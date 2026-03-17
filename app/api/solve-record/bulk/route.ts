import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import ProblemSolveRecord from "@/models/ProblemSolveRecord";
import { requireSameUser } from "@/lib/auth-guard";

// GET /api/solve-records/bulk?userId=65fa1b23c9d&problemIds=701,702,703
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const url = new URL(req.url);
    const userIdParam = url.searchParams.get("userId");
    const problemIdsParam = url.searchParams.get("problemIds");

    if (!userIdParam) {
      return NextResponse.json({ success: false, data: [] }, { status: 400 });
    }

    // Ensure the request user matches the userId (security check)
    const auth = requireSameUser(req, userIdParam);
    if (!auth.ok) return auth.response;

    if (!userIdParam || !mongoose.Types.ObjectId.isValid(userIdParam)) {
      return NextResponse.json({ success: false, data: [] }, { status: 400 });
    }

    const userId = new mongoose.Types.ObjectId(userIdParam);

    const problemIds = (problemIdsParam || "")
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    const validProblemIds = problemIds.filter((id) =>
      mongoose.Types.ObjectId.isValid(id),
    );

    if (validProblemIds.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const records = await ProblemSolveRecord.find({
      userId,
      problemId: {
        $in: validProblemIds.map((id) => new mongoose.Types.ObjectId(id)),
      },
    })
      .select("problemId pointsEarned completedAt")
      .sort({ completedAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    console.error("Error fetching bulk solve records:", error);
    return NextResponse.json({ success: false, data: [] }, { status: 500 });
  }
}
