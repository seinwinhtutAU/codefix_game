// app/api/solve-record/route.ts
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import ProblemSolveRecord, { HintUsage } from "@/models/ProblemSolveRecord";

type IncomingHint = Omit<HintUsage, "hintId">;

interface SolveRecordRequestBody {
  userId: string;
  problemId: string;
  timeSpent: number;
  pointsEarned?: number;
  hintUsages?: IncomingHint[];
  level: string;
}

interface RecordsFilter {
  userId?: mongoose.Types.ObjectId;
  problemId?: mongoose.Types.ObjectId;
}

// POST: Create a new solve record
export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body: SolveRecordRequestBody = await req.json();
    const { userId, problemId, timeSpent, pointsEarned, hintUsages, level } =
      body;

    if (!userId || !problemId || typeof timeSpent !== "number") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Missing required fields: userId, problemId, and timeSpent are mandatory.",
        },
        { status: 400 }
      );
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid userId format.",
        },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(problemId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid problemId format.",
        },
        { status: 400 }
      );
    }

    // Check if record already exists
    const existingRecord = await ProblemSolveRecord.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      problemId: new mongoose.Types.ObjectId(problemId),
    });

    if (existingRecord) {
      return NextResponse.json(
        {
          success: false,
          message: "Solve record already exists for this user and problem.",
          data: existingRecord,
        },
        { status: 409 }
      );
    }

    const processedHintUsages: HintUsage[] = (hintUsages || []).map((hint) => ({
      ...hint,
      hintId: new mongoose.Types.ObjectId(),
      usedAt: hint.usedAt ? new Date(hint.usedAt) : new Date(),
    }));

    const newRecord = await ProblemSolveRecord.create({
      userId: new mongoose.Types.ObjectId(userId),
      problemId: new mongoose.Types.ObjectId(problemId),
      timeSpent: Math.max(0, timeSpent), // Ensure non-negative
      pointsEarned: pointsEarned || 0,
      completedAt: new Date(),
      hintUsages: processedHintUsages,
      level: level,
    });

    console.log("new Record in API Post: ", JSON.stringify(newRecord, null, 2));

    return NextResponse.json(
      {
        success: true,
        message: "Record created successfully",
        data: newRecord,
      },
      { status: 201 }
    );
  } catch (error) {
    const e = error instanceof Error ? error : new Error("Unknown error");
    console.error("Error creating problem solve record:", e.message);

    return NextResponse.json(
      { success: false, message: e.message || "Failed to create record." },
      { status: 500 }
    );
  }
}

import { SolveRecordResponse } from "@/lib/types";

interface RecordsFilter {
  userId?: mongoose.Types.ObjectId;
  problemId?: mongoose.Types.ObjectId;
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const url = new URL(req.url);
    const userIdParam = url.searchParams.get("userId");
    const problemIdParam = url.searchParams.get("problemId");

    const filter: RecordsFilter = {};

    if (userIdParam) {
      if (!mongoose.Types.ObjectId.isValid(userIdParam)) {
        return NextResponse.json<SolveRecordResponse>(
          { success: false, data: null },
          { status: 400 }
        );
      }
      filter.userId = new mongoose.Types.ObjectId(userIdParam);
    }

    if (problemIdParam) {
      if (!mongoose.Types.ObjectId.isValid(problemIdParam)) {
        return NextResponse.json<SolveRecordResponse>(
          { success: false, data: null },
          { status: 400 }
        );
      }
      filter.problemId = new mongoose.Types.ObjectId(problemIdParam);
    }

    let result;

    // ✅ Case 1: No filters → fetch all records
    if (!userIdParam && !problemIdParam) {
      result = await ProblemSolveRecord.find().sort({ completedAt: -1 });
    }
    // ✅ Case 2: With filters → fetch only one (latest)
    else {
      result = await ProblemSolveRecord.findOne(filter).sort({
        completedAt: -1,
      });
    }

    return NextResponse.json<SolveRecordResponse>({
      success: true,
      data: result || null,
    });
  } catch (error) {
    console.error("Error fetching problem solve record:", error);
    return NextResponse.json<SolveRecordResponse>(
      { success: false, data: null },
      { status: 500 }
    );
  }
}

// DELETE: Delete solve records
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();

    const url = new URL(req.url);
    const userIdParam = url.searchParams.get("userId");
    const problemIdParam = url.searchParams.get("problemId");
    const recordIdParam = url.searchParams.get("recordId");
    const confirmAll = url.searchParams.get("confirmAll");

    // Case 1: Delete all records (requires confirmation)
    if (confirmAll === "true") {
      const deletedResult = await ProblemSolveRecord.deleteMany({});

      return NextResponse.json(
        {
          success: true,
          message: `Successfully deleted ${deletedResult.deletedCount} solve records`,
          data: { deletedCount: deletedResult.deletedCount },
        },
        { status: 200 }
      );
    }

    // Case 2: Delete by specific record ID
    if (recordIdParam) {
      if (!mongoose.Types.ObjectId.isValid(recordIdParam)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid recordId format",
          },
          { status: 400 }
        );
      }

      const deletedRecord = await ProblemSolveRecord.findByIdAndDelete(
        new mongoose.Types.ObjectId(recordIdParam)
      );

      if (!deletedRecord) {
        return NextResponse.json(
          {
            success: false,
            message: "Solve record not found",
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: "Solve record deleted successfully",
          data: deletedRecord,
        },
        { status: 200 }
      );
    }

    // Case 3: Delete by user and problem combination
    if (userIdParam && problemIdParam) {
      if (!mongoose.Types.ObjectId.isValid(userIdParam)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid userId format",
          },
          { status: 400 }
        );
      }

      if (!mongoose.Types.ObjectId.isValid(problemIdParam)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid problemId format",
          },
          { status: 400 }
        );
      }

      const deletedResult = await ProblemSolveRecord.deleteMany({
        userId: new mongoose.Types.ObjectId(userIdParam),
        problemId: new mongoose.Types.ObjectId(problemIdParam),
      });

      return NextResponse.json(
        {
          success: true,
          message: `Successfully deleted ${deletedResult.deletedCount} solve record(s) for this user and problem`,
          data: { deletedCount: deletedResult.deletedCount },
        },
        { status: 200 }
      );
    }

    // Case 4: Delete all records for a specific user
    if (userIdParam) {
      if (!mongoose.Types.ObjectId.isValid(userIdParam)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid userId format",
          },
          { status: 400 }
        );
      }

      const deletedResult = await ProblemSolveRecord.deleteMany({
        userId: new mongoose.Types.ObjectId(userIdParam),
      });

      return NextResponse.json(
        {
          success: true,
          message: `Successfully deleted ${deletedResult.deletedCount} solve record(s) for user`,
          data: { deletedCount: deletedResult.deletedCount },
        },
        { status: 200 }
      );
    }

    // Case 5: Delete all records for a specific problem
    if (problemIdParam) {
      if (!mongoose.Types.ObjectId.isValid(problemIdParam)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid problemId format",
          },
          { status: 400 }
        );
      }

      const deletedResult = await ProblemSolveRecord.deleteMany({
        problemId: new mongoose.Types.ObjectId(problemIdParam),
      });

      return NextResponse.json(
        {
          success: true,
          message: `Successfully deleted ${deletedResult.deletedCount} solve record(s) for problem`,
          data: { deletedCount: deletedResult.deletedCount },
        },
        { status: 200 }
      );
    }

    // No parameters provided
    return NextResponse.json(
      {
        success: false,
        message:
          "Please provide at least one parameter: recordId, userId, problemId, or confirmAll=true",
        note: "To delete all records, use ?confirmAll=true",
      },
      { status: 400 }
    );
  } catch (error) {
    const e = error instanceof Error ? error : new Error("Unknown error");
    console.error("Error deleting solve record:", e.message);

    return NextResponse.json(
      {
        success: false,
        message: e.message || "Failed to delete record",
      },
      { status: 500 }
    );
  }
}
