import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Problem from "@/models/Problem";
import User from "@/models/User";
import ProblemSolveRecord from "@/models/ProblemSolveRecord";
import GameProgress from "@/models/GameProgress";
import { requireAdmin } from "@/lib/auth-guard";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    if (!admin.ok) return admin.response;

    await dbConnect();

    const [records, users, problems, progress] = await Promise.all([
      ProblemSolveRecord.find().sort({ completedAt: -1 }).lean(),
      User.find().select("-password").sort({ createdAt: -1 }).lean(),
      Problem.find().sort({ order: 1 }).lean(),
      GameProgress.find().sort({ updatedAt: -1 }).lean(),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          records,
          users,
          problems,
          progress,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching report overview:", error);
    return NextResponse.json(
      { success: false, data: null },
      { status: 500 }
    );
  }
}
