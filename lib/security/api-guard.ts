import { createHmac, createHash, randomBytes, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const OWNER_SESSION_COOKIE = "studio_owner_session";
export const OWNER_SESSION_HEADER = "x-studio-owner-token";
export const STUDIO_CLIENT_HEADER = "x-studio-client";
export const STUDIO_CLIENT_HEADER_VALUE = "component-studio";

const MAX_SECURITY_MAP_ENTRIES = 5000;

interface RateLimitBucket {
  timestamps: number[];
}

interface BruteForceRecord {
  failedAttempts: number;
  firstFailedAt: number;
  lockedUntil: number | null;
}

interface DailyQuotaRecord {
  dateKey: string;
  used: number;
  customLimit: number | null;
}

interface GlobalSecurityStore {
  rateLimits: Map<string, RateLimitBucket>;
  bruteForce: Map<string, BruteForceRecord>;
  dailyQuota: DailyQuotaRecord;
  runtimePasscodeHash: string | null;
  blockedRequestsCount: number;
  explicitlyLocked: boolean;
  ephemeralSigningSecret: string;
  lastPrunedAt: number;
}

const globalForSecurity = globalThis as unknown as {
  __studioSecurityStore?: GlobalSecurityStore;
};

function getUtcDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getSecurityStore(): GlobalSecurityStore {
  if (!globalForSecurity.__studioSecurityStore) {
    globalForSecurity.__studioSecurityStore = {
      rateLimits: new Map(),
      bruteForce: new Map(),
      dailyQuota: {
        dateKey: getUtcDateKey(),
        used: 0,
        customLimit: null,
      },
      runtimePasscodeHash: null,
      blockedRequestsCount: 0,
      explicitlyLocked: false,
      ephemeralSigningSecret: randomBytes(32).toString("hex"),
      lastPrunedAt: Date.now(),
    };
  }
  const store = globalForSecurity.__studioSecurityStore;
  const today = getUtcDateKey();
  if (store.dailyQuota.dateKey !== today) {
    store.dailyQuota.dateKey = today;
    store.dailyQuota.used = 0;
  }
  if (!store.ephemeralSigningSecret) {
    store.ephemeralSigningSecret = randomBytes(32).toString("hex");
  }
  return store;
}

function pruneSecurityMapsIfNeeded(store: GlobalSecurityStore, now: number): void {
  const shouldPruneByTime = now - (store.lastPrunedAt || 0) > 60_000;
  const shouldPruneBySize =
    store.rateLimits.size > MAX_SECURITY_MAP_ENTRIES ||
    store.bruteForce.size > MAX_SECURITY_MAP_ENTRIES;

  if (!shouldPruneByTime && !shouldPruneBySize) return;
  store.lastPrunedAt = now;

  // Prune rate limit buckets older than 5 minutes
  const rateCutoff = now - 5 * 60_000;
  for (const [key, bucket] of store.rateLimits.entries()) {
    const active = bucket.timestamps.filter((ts) => ts > rateCutoff);
    if (active.length === 0) {
      store.rateLimits.delete(key);
    } else if (active.length !== bucket.timestamps.length) {
      bucket.timestamps = active;
    }
  }
  if (store.rateLimits.size > MAX_SECURITY_MAP_ENTRIES) {
    const excess = store.rateLimits.size - MAX_SECURITY_MAP_ENTRIES;
    let removed = 0;
    for (const key of store.rateLimits.keys()) {
      store.rateLimits.delete(key);
      removed += 1;
      if (removed >= excess) break;
    }
  }

  // Prune expired brute-force records
  const bruteCutoff = now - 15 * 60_000;
  for (const [ip, rec] of store.bruteForce.entries()) {
    const lockExpired = !rec.lockedUntil || rec.lockedUntil <= now;
    if (lockExpired && rec.firstFailedAt < bruteCutoff) {
      store.bruteForce.delete(ip);
    }
  }
  if (store.bruteForce.size > MAX_SECURITY_MAP_ENTRIES) {
    const excess = store.bruteForce.size - MAX_SECURITY_MAP_ENTRIES;
    let removed = 0;
    for (const key of store.bruteForce.keys()) {
      store.bruteForce.delete(key);
      removed += 1;
      if (removed >= excess) break;
    }
  }
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function getSigningSecret(): string {
  return (
    process.env.STUDIO_SESSION_SECRET?.trim() ||
    process.env.STUDIO_ACCESS_CODE?.trim() ||
    getSecurityStore().ephemeralSigningSecret
  );
}

export function getEnvPasscode(): string | null {
  const code = process.env.STUDIO_ACCESS_CODE?.trim();
  return code && code.length > 0 ? code : null;
}

export function hasConfiguredPasscode(): boolean {
  const store = getSecurityStore();
  return Boolean(getEnvPasscode() || store.runtimePasscodeHash);
}

export function setExplicitlyLocked(locked: boolean): void {
  const store = getSecurityStore();
  store.explicitlyLocked = locked;
}

export function isExplicitlyLocked(): boolean {
  return Boolean(getSecurityStore().explicitlyLocked);
}

export function setRuntimeOwnerPasscode(newPasscode: string): void {
  const clean = newPasscode.trim();
  if (!clean) return;
  const store = getSecurityStore();
  store.runtimePasscodeHash = sha256Hex(clean);
  store.explicitlyLocked = false;
}

/**
 * Timing-safe verification of the owner passcode against STUDIO_ACCESS_CODE or runtime passcode
 */
export function verifyOwnerPasscode(candidate: string): boolean {
  const cleanCandidate = (candidate || "").trim();
  if (!cleanCandidate) return false;

  const envCode = getEnvPasscode();
  const store = getSecurityStore();

  const targetHashHex = envCode
    ? sha256Hex(envCode)
    : store.runtimePasscodeHash;

  if (!targetHashHex) {
    return false;
  }

  const candidateHashHex = sha256Hex(cleanCandidate);
  const a = Buffer.from(candidateHashHex, "hex");
  const b = Buffer.from(targetHashHex, "hex");
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}

/**
 * Creates an HMAC-SHA256 signed session token bound to the current active passcode fingerprint
 */
export function createOwnerSessionToken(ttlSeconds: number = 60 * 60 * 24 * 7): string {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + ttlSeconds;
  const store = getSecurityStore();
  const envCode = getEnvPasscode();
  const fingerprint = (envCode ? sha256Hex(envCode) : store.runtimePasscodeHash || "default").slice(0, 16);

  const payload = JSON.stringify({
    role: "owner",
    iat: now,
    exp,
    fp: fingerprint,
  });
  const payloadB64 = Buffer.from(payload, "utf8").toString("base64url");
  const sig = createHmac("sha256", getSigningSecret())
    .update(payloadB64, "utf8")
    .digest("base64url");

  return `${payloadB64}.${sig}`;
}

/**
 * Verifies an HMAC-SHA256 signed session token from cookie or header
 */
export function verifyOwnerSessionToken(token?: string | null): boolean {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return false;
  }
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return false;

  const expectedSig = createHmac("sha256", getSigningSecret())
    .update(payloadB64, "utf8")
    .digest("base64url");

  const sigBuf = Buffer.from(sig, "utf8");
  const expectedBuf = Buffer.from(expectedSig, "utf8");
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return false;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as {
      role?: string;
      exp?: number;
      fp?: string;
    };
    const now = Math.floor(Date.now() / 1000);
    if (decoded.role !== "owner" || !decoded.exp || decoded.exp < now) {
      return false;
    }

    const store = getSecurityStore();
    const envCode = getEnvPasscode();
    const currentFp = (envCode ? sha256Hex(envCode) : store.runtimePasscodeHash || "default").slice(0, 16);
    return decoded.fp === currentFp;
  } catch {
    return false;
  }
}

export function isOwnerRequestAuthenticated(req: NextRequest): boolean {
  const cookieToken = req.cookies.get(OWNER_SESSION_COOKIE)?.value;
  if (verifyOwnerSessionToken(cookieToken)) {
    return true;
  }

  const headerToken =
    req.headers.get(OWNER_SESSION_HEADER)?.trim() ||
    req.headers
      .get("authorization")
      ?.replace(/^Bearer\s+/i, "")
      .trim();
  if (verifyOwnerSessionToken(headerToken)) {
    return true;
  }

  // If no passcode has been configured via STUDIO_ACCESS_CODE or runtime setup,
  // and the session has not been explicitly locked, allow verified same-origin Studio requests seamlessly.
  if (
    !hasConfiguredPasscode() &&
    !isExplicitlyLocked() &&
    req.headers.get(STUDIO_CLIENT_HEADER) === STUDIO_CLIENT_HEADER_VALUE &&
    verifySameOriginRequest(req).valid
  ) {
    return true;
  }

  return false;
}

export function getClientIp(req: NextRequest): string {
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (hops.length > 0) {
      return hops[hops.length - 1];
    }
  }
  return "127.0.0.1";
}

export function recordBlockedRequest(): void {
  const store = getSecurityStore();
  store.blockedRequestsCount += 1;
}

/**
 * Brute-force protection for passcode login attempts (max 5 failed attempts per 15 min)
 */
export function checkBruteForceLockout(ip: string): {
  allowed: boolean;
  retryAfterSeconds: number;
  remainingAttempts: number;
} {
  const store = getSecurityStore();
  const now = Date.now();
  pruneSecurityMapsIfNeeded(store, now);
  const windowMs = 15 * 60 * 1000;
  const maxAttempts = 5;

  const rec = store.bruteForce.get(ip);
  if (!rec) {
    return { allowed: true, retryAfterSeconds: 0, remainingAttempts: maxAttempts };
  }

  if (rec.lockedUntil && rec.lockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((rec.lockedUntil - now) / 1000),
      remainingAttempts: 0,
    };
  }

  if (now - rec.firstFailedAt > windowMs) {
    store.bruteForce.delete(ip);
    return { allowed: true, retryAfterSeconds: 0, remainingAttempts: maxAttempts };
  }

  return {
    allowed: true,
    retryAfterSeconds: 0,
    remainingAttempts: Math.max(0, maxAttempts - rec.failedAttempts),
  };
}

export function recordFailedPasscodeAttempt(ip: string): {
  locked: boolean;
  retryAfterSeconds: number;
  remainingAttempts: number;
} {
  const store = getSecurityStore();
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const lockoutMs = 15 * 60 * 1000;
  const maxAttempts = 5;

  let rec = store.bruteForce.get(ip);
  if (!rec || now - rec.firstFailedAt > windowMs) {
    rec = {
      failedAttempts: 0,
      firstFailedAt: now,
      lockedUntil: null,
    };
  }

  rec.failedAttempts += 1;
  if (rec.failedAttempts >= maxAttempts) {
    rec.lockedUntil = now + lockoutMs;
    store.bruteForce.set(ip, rec);
    recordBlockedRequest();
    return {
      locked: true,
      retryAfterSeconds: Math.ceil(lockoutMs / 1000),
      remainingAttempts: 0,
    };
  }

  store.bruteForce.set(ip, rec);
  recordBlockedRequest();
  return {
    locked: false,
    retryAfterSeconds: 0,
    remainingAttempts: Math.max(0, maxAttempts - rec.failedAttempts),
  };
}

export function clearFailedPasscodeAttempts(ip: string): void {
  const store = getSecurityStore();
  store.bruteForce.delete(ip);
}

/**
 * Sliding-window per-IP rate limiter
 */
export function checkRateLimit(
  ip: string,
  bucketName: string,
  maxRequests: number,
  windowMs: number = 60_000
): {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
} {
  const store = getSecurityStore();
  const key = `${bucketName}:${ip}`;
  const now = Date.now();
  pruneSecurityMapsIfNeeded(store, now);
  const cutoff = now - windowMs;

  const bucket = store.rateLimits.get(key) || { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((ts) => ts > cutoff);

  if (bucket.timestamps.length >= maxRequests) {
    store.rateLimits.set(key, bucket);
    recordBlockedRequest();
    const oldest = bucket.timestamps[0] || now;
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  bucket.timestamps.push(now);
  store.rateLimits.set(key, bucket);

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - bucket.timestamps.length),
    retryAfterSeconds: 0,
  };
}

export function getRateLimitStatus(
  ip: string,
  bucketName: string,
  maxRequests: number,
  windowMs: number = 60_000
): {
  limitPerMinute: number;
  remainingPerMinute: number;
} {
  const store = getSecurityStore();
  const key = `${bucketName}:${ip}`;
  const cutoff = Date.now() - windowMs;
  const bucket = store.rateLimits.get(key);
  const activeCount = bucket
    ? bucket.timestamps.filter((ts) => ts > cutoff).length
    : 0;

  return {
    limitPerMinute: maxRequests,
    remainingPerMinute: Math.max(0, maxRequests - activeCount),
  };
}

export function getConfiguredAiRateLimitPerMin(): number {
  const parsed = Number(process.env.STUDIO_RATE_LIMIT_PER_MIN);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(120, Math.floor(parsed)) : 30;
}

export function getDailyQuotaSummary(): {
  used: number;
  limit: number;
  remaining: number;
  resetAt: string;
} {
  const store = getSecurityStore();
  const envLimit = Number(process.env.STUDIO_DAILY_AI_LIMIT);
  const defaultLimit =
    Number.isFinite(envLimit) && envLimit > 0 ? Math.floor(envLimit) : 100;
  const limit = store.dailyQuota.customLimit ?? defaultLimit;
  const used = store.dailyQuota.used;

  const tomorrow = new Date();
  tomorrow.setUTCHours(24, 0, 0, 0);

  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    resetAt: tomorrow.toISOString(),
  };
}

export function setCustomDailyQuotaLimit(limit: number): void {
  const store = getSecurityStore();
  const clamped = Math.max(5, Math.min(5000, Math.floor(limit)));
  store.dailyQuota.customLimit = clamped;
}

export function resetDailyQuotaCounter(): void {
  const store = getSecurityStore();
  store.dailyQuota.used = 0;
}

export function checkDailyAiQuota(): {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
} {
  const summary = getDailyQuotaSummary();
  if (summary.used >= summary.limit) {
    recordBlockedRequest();
    return {
      allowed: false,
      ...summary,
    };
  }
  return {
    allowed: true,
    ...summary,
  };
}

export function incrementDailyAiQuota(): {
  used: number;
  limit: number;
  remaining: number;
  resetAt: string;
} {
  const store = getSecurityStore();
  store.dailyQuota.used += 1;
  return getDailyQuotaSummary();
}

export function getBlockedRequestsCount(): number {
  return getSecurityStore().blockedRequestsCount;
}

/**
 * Verifies Same-Origin / Referer and Fetch Metadata on state-changing requests
 */
export function verifySameOriginRequest(req: NextRequest): {
  valid: boolean;
  reason?: string;
} {
  const secFetchSite = req.headers.get("sec-fetch-site")?.toLowerCase();
  if (secFetchSite === "cross-site") {
    recordBlockedRequest();
    return {
      valid: false,
      reason: "Cross-site request blocked by Fetch Metadata policy.",
    };
  }

  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const rawHost =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    req.nextUrl?.host ||
    "";
  const host = rawHost.split(",")[0].trim().toLowerCase();

  if (origin) {
    try {
      const originUrl = new URL(origin);
      const originHost = originUrl.host.toLowerCase();
      const matchesHost = host ? originHost === host : false;

      if (!matchesHost) {
        recordBlockedRequest();
        return {
          valid: false,
          reason: "Cross-origin request blocked by security policy.",
        };
      }
    } catch {
      recordBlockedRequest();
      return { valid: false, reason: "Malformed Origin header." };
    }
  } else if (referer) {
    try {
      const refUrl = new URL(referer);
      const refHost = refUrl.host.toLowerCase();
      const matchesHost = host ? refHost === host : false;

      if (!matchesHost) {
        recordBlockedRequest();
        return {
          valid: false,
          reason: "Cross-site referer blocked by security policy.",
        };
      }
    } catch {
      recordBlockedRequest();
      return { valid: false, reason: "Malformed Referer header." };
    }
  }

  return { valid: true };
}

export function verifyPayloadSize(
  req: NextRequest,
  maxBytes: number
): { valid: boolean; errorResponse?: NextResponse } {
  const contentLength = req.headers.get("content-length");
  if (contentLength) {
    const bytes = Number(contentLength);
    if (Number.isFinite(bytes) && bytes > maxBytes) {
      recordBlockedRequest();
      return {
        valid: false,
        errorResponse: NextResponse.json(
          {
            success: false,
            error: `Request payload exceeds maximum allowed size (${Math.round(
              maxBytes / 1024
            )}KB).`,
          },
          { status: 413 }
        ),
      };
    }
  }
  return { valid: true };
}

/**
 * Streams and parses a JSON request body while strictly enforcing a real byte limit,
 * preventing chunked Transfer-Encoding requests from bypassing Content-Length checks.
 */
export async function readJsonWithLimit<T>(
  req: NextRequest,
  maxBytes: number
): Promise<
  | { ok: true; data: T }
  | { ok: false; errorResponse: NextResponse }
> {
  const headerCheck = verifyPayloadSize(req, maxBytes);
  if (!headerCheck.valid && headerCheck.errorResponse) {
    return { ok: false, errorResponse: headerCheck.errorResponse };
  }

  try {
    const reader = req.body?.getReader();
    let rawText = "";
    if (!reader) {
      rawText = await req.text();
      if (Buffer.byteLength(rawText, "utf8") > maxBytes) {
        recordBlockedRequest();
        return {
          ok: false,
          errorResponse: NextResponse.json(
            {
              success: false,
              error: `Request payload exceeds maximum allowed size (${Math.round(
                maxBytes / 1024
              )}KB).`,
            },
            { status: 413 }
          ),
        };
      }
    } else {
      const chunks: Uint8Array[] = [];
      let total = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          total += value.byteLength;
          if (total > maxBytes) {
            await reader.cancel().catch(() => {});
            recordBlockedRequest();
            return {
              ok: false,
              errorResponse: NextResponse.json(
                {
                  success: false,
                  error: `Request payload exceeds maximum allowed size (${Math.round(
                    maxBytes / 1024
                  )}KB).`,
                },
                { status: 413 }
              ),
            };
          }
          chunks.push(value);
        }
      }
      rawText = Buffer.concat(chunks).toString("utf8");
    }

    const data = JSON.parse(rawText) as T;
    return { ok: true, data };
  } catch {
    return {
      ok: false,
      errorResponse: NextResponse.json(
        { success: false, error: "Invalid JSON request payload." },
        { status: 400 }
      ),
    };
  }
}
