import { NextResponse } from "next/server";
import User from "@/models/User";
import dbConnect from "@/lib/db";

export async function POST(request: Request) {
  await dbConnect();
  const { username, email, password } = await request.json();

  if (!username || !email || !password || password.length < 6) {
    return NextResponse.json({ message: "Invalid input." }, { status: 422 });
  }

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists." },
        { status: 409 }
      );
    }

    const newUser = await User.create({
      username,
      email,
      password: password,
    });

    return NextResponse.json(
      {
        message: "User created successfully! (TEST MODE)",
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}
