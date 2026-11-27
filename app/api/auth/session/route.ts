import { NextRequest, NextResponse } from "next/server";
import {
  OWNER_SESSION_COOKIE,
  checkBruteForceLockout,
  clearFailedPasscodeAttempts,
  createOwnerSessionToken,
  getBlockedRequestsCount,
  getClientIp,
  getConfiguredAiRateLimitPerMin,
  getDailyQuotaSummary,
  getEnvPasscode,
  getRateLimitStatus,
  hasConfiguredPasscode,
  isExplicitlyLocked,
  isOwnerRequestAuthenticated,
  recordFailedPasscodeAttempt,
  resetDailyQuotaCounter,
  setCustomDailyQuotaLimit,
  setExplicitlyLocked,
  setRuntimeOwnerPasscode,
  verifyOwnerPasscode,
  verifyPayloadSize,
  verifySameOriginRequest,
} from "@/lib/security/api-guard";

function isHttpsRequest(req: NextRequest): boolean {
  const proto = req.headers.get("x-forwarded-proto");
  if (proto && proto.includes("https")) return true;
  return req.nextUrl?.protocol === "https:" || process.env.NODE_ENV === "production";
}

function buildSessionPayload(
  req: NextRequest,
  authenticatedOverride?: boolean,
  options?: { exposeSessionToken?: string | null }
) {
  const ip = getClientIp(req);
  const configured = hasConfiguredPasscode();
  const locked = isExplicitlyLocked();
  const authenticated =
    authenticatedOverride !== undefined
      ? authenticatedOverride
      : isOwnerRequestAuthenticated(req) || (!configured && !locked);
  const hasEnv = Boolean(getEnvPasscode());
  const limitPerMin = getConfiguredAiRateLimitPerMin();

  return {
    success: true,
    authenticated,
    ...(options && "exposeSessionToken" in options
      ? { sessionToken: options.exposeSessionToken ?? null }
      : {}),
    hasEnvPasscode: hasEnv,
    hasCustomPasscode: configured && !hasEnv,
    requiresPasscodeSetup: !configured,
    dailyQuota: getDailyQuotaSummary(),
    rateLimit: getRateLimitStatus(ip, "ai-assistant", limitPerMin, 60_000),
    shields: {
      serverOnlyApiKey: true,
      httpOnlySession: true,
      sameOriginCsrf: true,
      rateLimiting: true,
      dailyQuotaCap: true,
    },
    blockedRequestsCount: getBlockedRequestsCount(),
  };
}

export async function GET(req: NextRequest) {
  const basePayload = buildSessionPayload(req);
  const existingCookie = req.cookies.get(OWNER_SESSION_COOKIE)?.value;
  const issuedToken = basePayload.authenticated
    ? existingCookie || createOwnerSessionToken()
    : null;
  const payload = buildSessionPayload(req, basePayload.authenticated, {
    exposeSessionToken: issuedToken,
  });
  const res = NextResponse.json(payload);
  if (payload.authenticated && issuedToken && !existingCookie) {
    const https = isHttpsRequest(req);
    res.cookies.set(OWNER_SESSION_COOKIE, issuedToken, {
      httpOnly: true,
      sameSite: https ? "none" : "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      secure: https,
    });
  }
  return res;
}

export async function POST(req: NextRequest) {
  const sizeCheck = verifyPayloadSize(req, 32 * 1024);
  if (!sizeCheck.valid && sizeCheck.errorResponse) {
    return sizeCheck.errorResponse;
  }

  const originCheck = verifySameOriginRequest(req);
  if (!originCheck.valid) {
    return NextResponse.json(
      {
        success: false,
        error: originCheck.reason || "Cross-origin request rejected.",
      },
      { status: 403 }
    );
  }

  const ip = getClientIp(req);
  const https = isHttpsRequest(req);

  try {
    const body = (await req.json()) as {
      action?: "unlock" | "update-settings";
      passcode?: string;
      dailyLimit?: number;
      resetQuota?: boolean;
      newPasscode?: string;
    };

    const action = body.action || "unlock";

    if (action === "update-settings") {
      if (!isOwnerRequestAuthenticated(req)) {
        return NextResponse.json(
          {
            success: false,
            error: "Owner authentication required to modify security settings.",
          },
          { status: 401 }
        );
      }

      if (typeof body.dailyLimit === "number" && Number.isFinite(body.dailyLimit)) {
        setCustomDailyQuotaLimit(body.dailyLimit);
      }

      if (body.resetQuota === true) {
        resetDailyQuotaCounter();
      }

      let refreshedToken: string | null = null;
      if (
        typeof body.newPasscode === "string" &&
        body.newPasscode.trim().length >= 4
      ) {
        setRuntimeOwnerPasscode(body.newPasscode.trim());
        refreshedToken = createOwnerSessionToken();
      }

      const activeToken = refreshedToken || createOwnerSessionToken();
      const res = NextResponse.json(
        buildSessionPayload(req, true, { exposeSessionToken: activeToken })
      );
      res.cookies.set(OWNER_SESSION_COOKIE, activeToken, {
        httpOnly: true,
        sameSite: https ? "none" : "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        secure: https,
      });
      return res;
    }

    // Default action: "unlock"
    const lockout = checkBruteForceLockout(ip);
    if (!lockout.allowed) {
      return NextResponse.json(
        {
          success: false,
          lockedOut: true,
          retryAfterSeconds: lockout.retryAfterSeconds,
          error: `Too many failed passcode attempts. Try again in ${lockout.retryAfterSeconds}s.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(lockout.retryAfterSeconds),
          },
        }
      );
    }

    const passcode = (body.passcode || "").trim();
    if (passcode.length < 4) {
      return NextResponse.json(
        {
          success: false,
          error: "Owner passcode must be at least 4 characters.",
        },
        { status: 400 }
      );
    }

    // First-time setup if neither STUDIO_ACCESS_CODE nor runtime passcode exists yet
    if (!hasConfiguredPasscode()) {
      setRuntimeOwnerPasscode(passcode);
    } else if (!verifyOwnerPasscode(passcode)) {
      const attempt = recordFailedPasscodeAttempt(ip);
      if (attempt.locked) {
        return NextResponse.json(
          {
            success: false,
            lockedOut: true,
            retryAfterSeconds: attempt.retryAfterSeconds,
            error: `Too many failed attempts. Passcode login locked for ${Math.ceil(
              attempt.retryAfterSeconds / 60
            )} minutes.`,
          },
          { status: 429 }
        );
      }
      return NextResponse.json(
        {
          success: false,
          remainingAttempts: attempt.remainingAttempts,
          error: `Invalid owner passcode (${attempt.remainingAttempts} attempt${
            attempt.remainingAttempts === 1 ? "" : "s"
          } remaining before cooldown).`,
        },
        { status: 401 }
      );
    }

    setExplicitlyLocked(false);
    clearFailedPasscodeAttempts(ip);
    const token = createOwnerSessionToken();
    const res = NextResponse.json(
      buildSessionPayload(req, true, { exposeSessionToken: token })
    );

    res.cookies.set(OWNER_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: https ? "none" : "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      secure: https,
    });

    return res;
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid request payload.",
      },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const originCheck = verifySameOriginRequest(req);
  if (!originCheck.valid) {
    return NextResponse.json(
      {
        success: false,
        error: originCheck.reason || "Cross-origin request rejected.",
      },
      { status: 403 }
    );
  }

  setExplicitlyLocked(true);
  const https = isHttpsRequest(req);
  const res = NextResponse.json(
    buildSessionPayload(req, false, { exposeSessionToken: null })
  );
  res.cookies.set(OWNER_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: https ? "none" : "lax",
    path: "/",
    maxAge: 0,
    secure: https,
  });
  return res;
}
