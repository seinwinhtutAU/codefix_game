import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import GameProgressModel from "@/models/GameProgress";
import { HintUsage } from "@/models/ProblemSolveRecord";
import mongoose from "mongoose";
import { requireAuth, requireSameUser, requireAdmin } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

type IncomingHint = Omit<HintUsage, "hintId">;

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
      currentActiveIndex: number;
      highestHintLevelUsed: "none" | "small" | "medium" | "big";
      hintUsages: IncomingHint[];
    };
  };
  bugCounts?: {
    problemId: string;
    bugCount: number;
  }[];
}

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
      currentActiveIndex: 0,
      highestHintLevelUsed: "none",
      hintUsages: [],
    },
  },
  bugCounts: [],
};

/* 
GET /api/game-progress
GET /api/game-progress?userId=65fa1b23c9d
*/
export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (!auth.ok) return auth.response;

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    /**
     * CASE 1: Fetch ALL Progress
     * Used by the Admin Dashboard to see all students' live status.
     */
    if (!userId) {
      const admin = await requireAdmin(req);
      if (!admin.ok) return admin.response;

      const allProgress = await GameProgressModel.find({})
        .sort({ updatedAt: -1 }) // Show most recent activity first
        .lean();

      return NextResponse.json({
        success: true,
        data: allProgress,
      });
    }

    /**
     * CASE 2: Fetch Specific User Progress
     * Used by the Phaser game client to load a player's save.
     */
    if (auth.payload.sub !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const progress = await GameProgressModel.findOne({ userId }).lean();

    // If no progress exists, return the default starting state
    if (!progress) {
      return NextResponse.json({
        userId: userId,
        ...DEFAULT_GAME_STATE,
      });
    }

    return NextResponse.json(progress);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// POST /api/game-progress
export async function POST(req: NextRequest) {
  try {
    const body: GameProgressRequest = await req.json();
    const auth = requireSameUser(req, body.userId);
    if (!auth.ok) return auth.response;

    await dbConnect();

    const { userId, lastLocation, gameState, bugCounts } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    // Process hints to ensure they have ObjectIds and proper Dates
    const hintUsages = body.gameState?.currentTask?.hintUsages;
    const processedHintUsages = (hintUsages || []).map((hint) => ({
      ...hint,
      hintId: new mongoose.Types.ObjectId(),
      usedAt: hint.usedAt ? new Date(hint.usedAt) : new Date(),
    }));

    const updateData = {
      lastLocation,
      gameState: {
        ...gameState,
        currentTask: {
          ...gameState.currentTask,
          hintUsages: processedHintUsages,
        },
      },
      // Ensure problemIds in bugCounts are cast to ObjectId for DB consistency
      bugCounts: bugCounts
        ? bugCounts.map((bug) => ({
            problemId: new mongoose.Types.ObjectId(bug.problemId),
            bugCount: bug.bugCount,
          }))
        : [],
      updatedAt: new Date(),
    };

    const updatedProgress = await GameProgressModel.findOneAndUpdate(
      { userId },
      updateData,
      { upsert: true, new: true, runValidators: true },
    );

    return NextResponse.json(updatedProgress);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    console.error("Save Error:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// DELETE /api/game-progress?userId=65fa1b23c9d
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required to delete progress" },
        { status: 400 },
      );
    }

    const auth = requireSameUser(req, userId);
    if (!auth.ok) return auth.response;

    await dbConnect();

    const deletedProgress = await GameProgressModel.findOneAndDelete({
      userId,
    });

    if (!deletedProgress) {
      return NextResponse.json(
        { error: "No progress found for this user" },
        { status: 404 },
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
