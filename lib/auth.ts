import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const JWT_COOKIE_NAME = "codefix_auth";
const JWT_EXPIRES_IN = "7d";

// Get the JWT secret key from environment variables
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Please define JWT_SECRET in your environment");
  }
  return secret;
}

/*
Create (sign) a JWT authentication token.

- Use the user payload (user id and email)
- Sign the token with the JWT secret
- Set the token to expire in 7 days
*/
export function signAuthToken(payload: { sub: string; email: string }) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
}

/*
Verify a JWT authentication token.

- Check if the token is valid using the JWT secret
- Decode the token payload
- Return the user information (sub and email)
*/
export function verifyAuthToken(token: string): { sub: string; email: string } {
  return jwt.verify(token, getJwtSecret()) as { sub: string; email: string };
}

export function getAuthCookieName() {
  return JWT_COOKIE_NAME;
}

// Stores the JWT token in a browser cookie after the user logs in
export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set(JWT_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

// Clear the authentication cookie. Used when the user logs out.
export function clearAuthCookie(response: NextResponse) {
  response.cookies.set(JWT_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
