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

/*
Allow requests only from localhost during development.

- If the app is running in production, skip this check
- Check request host, origin, and referer headers
- If the request is from localhost → allow it
- Otherwise → return a 403 Forbidden response
*/
function enforceLocalhostInDev(req: NextRequest): AuthResult | null {
  if (process.env.NODE_ENV === "production") return null;

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  if (
    isLocalhostHost(host) ||
    isLocalhostHost(origin) ||
    isLocalhostHost(referer)
  ) {
    return null;
  }

  return {
    ok: false,
    response: NextResponse.json(
      { error: "Forbidden (localhost-only in development)" },
      { status: 403 },
    ),
  };
}

/*
Require user authentication for a request.

Process:
1. In development, block requests that are not from localhost
2. Get the JWT token from the authentication cookie
3. If the token is missing → return 401 Unauthorized
4. Verify the token
5. If valid → return user payload
6. If invalid → return 401 Unauthorized
*/
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

/*
Ensure the request is authenticated and belongs to the same user.

Process:
1. Verify the user is authenticated (requireAuth)
2. Compare the authenticated user ID with the requested userId
3. If they do not match → return 403 Forbidden
4. If they match → allow the request
*/
export function requireSameUser(req: NextRequest, userId: string): AuthResult {
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

/*
Ensure the request is from an authenticated admin user.

Process:
1. Verify the user is authenticated (requireAuth)
2. Fetch the user from the database
3. Check if the username starts with "admin"
4. If not → return 403 Forbidden
5. If yes → allow the request
*/
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
