import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import GameProgressModel from "@/models/GameProgress";

export const dynamic = "force-dynamic";

interface GameProgressRequest {
  userId: string;
  lastLocation: string;
  gameState: {
    currentScene: string;
    eventFlags: Record<string, boolean>;
    currentTask: {
      taskType: "code_problem" | "none";
      taskId: string;
      status: "none" | "in_progress" | "completed";
      attempts: number;
      timer: number;
    };
  };
}

// 2. CLEANUP: Define default state here to keep the GET function clean
const DEFAULT_GAME_STATE = {
  lastLocation: "/game",
  gameState: {
    currentScene: "IntroScene",
    eventFlags: {
      introCompleted: false,
    },
    currentTask: {
      taskType: "none",
      taskId: "none",
      status: "none",
      attempts: 0,
      timer: 0,
    },
  },
};

export async function GET(req: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const progress = await GameProgressModel.findOne({ userId });

    // --- TEACHER'S FIX: Return empty/default state instead of 404 ---
    if (!progress) {
      return NextResponse.json({
        userId: userId, // Include the ID so Phaser knows who it is
        ...DEFAULT_GAME_STATE, // Spread the default values defined above
      });
    }

    return NextResponse.json(progress);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();

    // Type the incoming JSON as our specific interface
    const body: GameProgressRequest = await req.json();
    const { userId, lastLocation, gameState } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const updatedProgress = await GameProgressModel.findOneAndUpdate(
      { userId },
      {
        lastLocation,
        gameState,
        updatedAt: new Date(),
      },
      // upsert: create if doesn't exist; new: return the updated doc
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json(updatedProgress);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    console.error("Save Error:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required to delete progress" },
        { status: 400 }
      );
    }

    const deletedProgress = await GameProgressModel.findOneAndDelete({
      userId,
    });

    if (!deletedProgress) {
      return NextResponse.json(
        { error: "No progress found for this user" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Game progress reset successfully",
      userId,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    console.error("Delete Error:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
