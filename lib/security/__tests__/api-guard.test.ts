import { describe, it, expect, beforeEach } from "bun:test";
import { NextRequest } from "next/server";
import {
  verifyOwnerPasscode,
  setRuntimeOwnerPasscode,
  createOwnerSessionToken,
  verifyOwnerSessionToken,
  isOwnerRequestAuthenticated,
  checkBruteForceLockout,
  recordFailedPasscodeAttempt,
  clearFailedPasscodeAttempts,
  checkRateLimit,
  checkDailyAiQuota,
  incrementDailyAiQuota,
  setCustomDailyQuotaLimit,
  resetDailyQuotaCounter,
  verifySameOriginRequest,
  verifyPayloadSize,
} from "../api-guard";

describe("API Guard & Credit Protection Security Suite", () => {
  beforeEach(() => {
    delete process.env.STUDIO_ACCESS_CODE;
    resetDailyQuotaCounter();
    setCustomDailyQuotaLimit(100);
  });

  it("sets a runtime owner passcode and verifies it with timing-safe SHA-256 comparison", () => {
    setRuntimeOwnerPasscode("my-personal-secret-2026");

    expect(verifyOwnerPasscode("my-personal-secret-2026")).toBe(true);
    expect(verifyOwnerPasscode("wrong-passcode")).toBe(false);
    expect(verifyOwnerPasscode("")).toBe(false);
  });

  it("creates and verifies HMAC-SHA256 signed owner session tokens and rejects tampered tokens", () => {
    setRuntimeOwnerPasscode("owner-pass-2026");
    const token = createOwnerSessionToken();
    expect(verifyOwnerSessionToken(token)).toBe(true);

    // Tamper signature
    const [payload, sig] = token.split(".");
    const tampered = `${payload}.${sig.slice(0, -2)}aa`;
    expect(verifyOwnerSessionToken(tampered)).toBe(false);
    expect(verifyOwnerSessionToken("invalid.token.parts")).toBe(false);
    expect(verifyOwnerSessionToken(undefined)).toBe(false);
  });

  it("authenticates NextRequest via HttpOnly cookie", () => {
    setRuntimeOwnerPasscode("owner-pass-999");
    const token = createOwnerSessionToken();

    const cookieReq = new NextRequest("http://localhost:3000/api/ai-assistant", {
      method: "POST",
      headers: {
        cookie: `studio_owner_session=${token}`,
      },
    });
    expect(isOwnerRequestAuthenticated(cookieReq)).toBe(true);

    const unauthReq = new NextRequest("http://localhost:3000/api/ai-assistant", {
      method: "POST",
    });
    expect(isOwnerRequestAuthenticated(unauthReq)).toBe(false);
  });

  it("enforces brute-force lockout after 5 failed passcode attempts", () => {
    const ip = "203.0.113.42";
    clearFailedPasscodeAttempts(ip);

    for (let i = 0; i < 4; i++) {
      recordFailedPasscodeAttempt(ip);
      expect(checkBruteForceLockout(ip).allowed).toBe(true);
    }

    // 5th failed attempt triggers 15-minute lockout
    const fifth = recordFailedPasscodeAttempt(ip);
    expect(fifth.locked).toBe(true);
    const status = checkBruteForceLockout(ip);
    expect(status.allowed).toBe(false);
    expect(status.remainingAttempts).toBe(0);
    expect(status.retryAfterSeconds).toBeGreaterThan(0);

    // Clearing attempts restores access
    clearFailedPasscodeAttempts(ip);
    expect(checkBruteForceLockout(ip).allowed).toBe(true);
  });

  it("enforces per-IP sliding-window rate limits", () => {
    const ip = `198.51.100.${Math.floor(Math.random() * 200)}`;
    const r1 = checkRateLimit(ip, "ai-test", 2, 60_000);
    const r2 = checkRateLimit(ip, "ai-test", 2, 60_000);
    const r3 = checkRateLimit(ip, "ai-test", 2, 60_000);

    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r3.allowed).toBe(false);
    expect(r3.remaining).toBe(0);
  });

  it("tracks and caps daily AI credit consumption and supports quota updates/resets", () => {
    setCustomDailyQuotaLimit(5);
    resetDailyQuotaCounter();

    expect(checkDailyAiQuota().allowed).toBe(true);
    expect(checkDailyAiQuota().remaining).toBe(5);

    for (let i = 0; i < 5; i++) {
      incrementDailyAiQuota();
    }

    const capped = checkDailyAiQuota();
    expect(capped.allowed).toBe(false);
    expect(capped.used).toBe(5);
    expect(capped.remaining).toBe(0);

    resetDailyQuotaCounter();
    const afterReset = checkDailyAiQuota();
    expect(afterReset.used).toBe(0);
    expect(afterReset.remaining).toBe(5);
    expect(afterReset.allowed).toBe(true);
  });

  it("verifies same-origin requests and blocks cross-origin POST requests", () => {
    const validReq = new NextRequest("http://localhost:3000/api/ai-assistant", {
      method: "POST",
      headers: {
        host: "localhost:3000",
        origin: "http://localhost:3000",
      },
    });
    expect(verifySameOriginRequest(validReq).valid).toBe(true);

    const evilReq = new NextRequest("http://localhost:3000/api/ai-assistant", {
      method: "POST",
      headers: {
        host: "localhost:3000",
        origin: "https://attacker-site.example.com",
      },
    });
    expect(verifySameOriginRequest(evilReq).valid).toBe(false);
  });

  it("blocks oversized request payloads via Content-Length check", () => {
    const oversizedReq = new NextRequest("http://localhost:3000/api/format-code", {
      method: "POST",
      headers: {
        "content-length": String(5 * 1024 * 1024),
      },
    });
    const check = verifyPayloadSize(oversizedReq, 512 * 1024);
    expect(check.valid).toBe(false);
  });
});
