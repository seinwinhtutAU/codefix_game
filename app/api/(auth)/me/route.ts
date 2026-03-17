import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { getAuthCookieName, verifyAuthToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Read the auth token from cookies
    const token = request.cookies.get(getAuthCookieName())?.value;
    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Verify the JWT token
    let payload: { sub: string; email: string };
    try {
      payload = verifyAuthToken(token);
    } catch {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Find the user in the database
    const user = await User.findById(payload.sub).select("-password");
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // If valid → return authenticated user info
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { authenticated: false, message: "Internal server error." },
      { status: 500 },
    );
  }
}
