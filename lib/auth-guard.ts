import { NextRequest, NextResponse } from "next/server";
import User from "@/models/User";
import { getAuthCookieName, verifyAuthToken } from "@/lib/auth";

type AuthResult =
  | { ok: true; payload: { sub: string; email: string } }
  | { ok: false; response: NextResponse };

function isLocalhostHost(value: string | null) {
  if (!value) return false;
  const host = value.toLowerCase();
  return (
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.startsWith("[::1]") ||
    host.startsWith("::1")
  );
}

function enforceLocalhostInDev(req: NextRequest): AuthResult | null {
  if (process.env.NODE_ENV === "production") return null;

  const host =
    req.headers.get("x-forwarded-host") || req.headers.get("host");
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  if (isLocalhostHost(host) || isLocalhostHost(origin) || isLocalhostHost(referer)) {
    return null;
  }

  return {
    ok: false,
    response: NextResponse.json(
      { error: "Forbidden (localhost-only in development)" },
      { status: 403 }
    ),
  };
}

export function requireAuth(req: NextRequest): AuthResult {
  const devBlock = enforceLocalhostInDev(req);
  if (devBlock) return devBlock;

  const token = req.cookies.get(getAuthCookieName())?.value;
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  try {
    const payload = verifyAuthToken(token);
    return { ok: true, payload };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
}

export function requireSameUser(
  req: NextRequest,
  userId: string
): AuthResult {
  const auth = requireAuth(req);
  if (!auth.ok) return auth;

  if (auth.payload.sub !== userId) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return auth;
}

export async function requireAdmin(req: NextRequest): Promise<AuthResult> {
  const auth = requireAuth(req);
  if (!auth.ok) return auth;

  const user = await User.findById(auth.payload.sub).select("username").lean();
  const username = user?.username?.toLowerCase() || "";

  if (!username.startsWith("admin")) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return auth;
}
