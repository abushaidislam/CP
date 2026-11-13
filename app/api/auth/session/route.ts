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
  isOwnerRequestAuthenticated,
  recordFailedPasscodeAttempt,
  resetDailyQuotaCounter,
  setCustomDailyQuotaLimit,
  setRuntimeOwnerPasscode,
  verifyOwnerPasscode,
  verifyPayloadSize,
  verifySameOriginRequest,
} from "@/lib/security/api-guard";

function buildSessionPayload(req: NextRequest, authenticatedOverride?: boolean) {
  const ip = getClientIp(req);
  const authenticated =
    authenticatedOverride !== undefined
      ? authenticatedOverride
      : isOwnerRequestAuthenticated(req);
  const hasEnv = Boolean(getEnvPasscode());
  const configured = hasConfiguredPasscode();
  const limitPerMin = getConfiguredAiRateLimitPerMin();

  return {
    success: true,
    authenticated,
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
  return NextResponse.json(buildSessionPayload(req));
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
        body.newPasscode.trim().length >= 4 &&
        !getEnvPasscode()
      ) {
        setRuntimeOwnerPasscode(body.newPasscode.trim());
        refreshedToken = createOwnerSessionToken();
      }

      const res = NextResponse.json(buildSessionPayload(req, true));
      if (refreshedToken) {
        res.cookies.set(OWNER_SESSION_COOKIE, refreshedToken, {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
          secure: process.env.NODE_ENV === "production",
        });
      }
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

    clearFailedPasscodeAttempts(ip);
    const token = createOwnerSessionToken();
    const res = NextResponse.json(buildSessionPayload(req, true));

    res.cookies.set(OWNER_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === "production",
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

  const res = NextResponse.json(buildSessionPayload(req, false));
  res.cookies.set(OWNER_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
