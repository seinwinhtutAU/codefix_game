import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import dbConnect from "@/lib/db";
import { setAuthCookie, signAuthToken } from "@/lib/auth";

export async function POST(request: Request) {
  await dbConnect();
  const { email, password } = await request.json();

  const normalizedEmail =
    typeof email === "string" ? email.trim().toLowerCase() : "";
  const passwordStr = typeof password === "string" ? password : "";

  if (!normalizedEmail || !passwordStr) {
    return NextResponse.json(
      { message: "Email and password required." },
      { status: 422 },
    );
  }

  try {
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid credentials." },
        { status: 401 },
      );
    }

    const isValidPassword = await bcrypt.compare(passwordStr, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { message: "Invalid credentials." },
        { status: 401 },
      );
    }

    const token = signAuthToken({
      sub: user._id.toString(),
      email: user.email,
    });

    const response = NextResponse.json({
      message: "Login successful!",
      user: { id: user._id, username: user.username, email: user.email },
    });
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 },
    );
  }
}
