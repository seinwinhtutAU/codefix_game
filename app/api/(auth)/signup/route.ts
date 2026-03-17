import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import dbConnect from "@/lib/db";
import { setAuthCookie, signAuthToken } from "@/lib/auth";

export async function POST(request: Request) {
  await dbConnect();
  const { username, email, password } = await request.json();

  const normalizedEmail =
    typeof email === "string" ? email.trim().toLowerCase() : "";
  const normalizedUsername =
    typeof username === "string" ? username.trim() : "";
  const passwordStr = typeof password === "string" ? password : "";

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (
    !normalizedUsername ||
    !normalizedEmail ||
    !emailRegex.test(normalizedEmail) ||
    !passwordStr ||
    passwordStr.length < 8
  ) {
    return NextResponse.json(
      {
        message:
          "Invalid input. Use a valid email and a password of 8+ characters.",
      },
      { status: 422 },
    );
  }

  // Check if a user with the same email or username already exists
  try {
    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
    });
    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists." },
        { status: 409 },
      );
    }

    // Create a new user in the database
    const hashedPassword = await bcrypt.hash(passwordStr, 12);
    const newUser = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
    });

    // Generate a JWT authentication token
    const token = signAuthToken({
      sub: newUser._id.toString(),
      email: newUser.email,
    });

    const response = NextResponse.json(
      {
        message: "User created successfully!",
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
        },
      },
      { status: 201 },
    );

    // Set the auth cookie and return the created user info
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
