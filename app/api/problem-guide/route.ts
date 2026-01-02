import { NextResponse } from "next/server";
import ProblemGuide from "@/models/ProblemGuide";
import dbConnect from "@/lib/db";
import { GuideBlock, CreateProblemGuideRequest } from "@/lib/types";

/**
 * GET /api/problem-guide
 */
export async function GET(req: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const problemId = searchParams.get("problemId");

    const query: { problemId?: string } = {};
    if (problemId) query.problemId = problemId;

    const guide = await ProblemGuide.findOne({ problemId });

    return NextResponse.json(guide, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    console.error("GET /problem-guide error:", message);

    return NextResponse.json(
      { message: "Failed to fetch guides", error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/problem-guide
 */
export async function POST(req: Request) {
  try {
    await dbConnect();

    const body = (await req.json()) as CreateProblemGuideRequest;
    const { problemId, level, guideContent } = body;

    // ---- Validation ----
    if (
      !problemId ||
      !["easy", "medium", "hard"].includes(level) ||
      !Array.isArray(guideContent) ||
      guideContent.length === 0
    ) {
      return NextResponse.json(
        { message: "Invalid input data" },
        { status: 400 }
      );
    }

    for (const block of guideContent) {
      if (!isValidGuideBlock(block)) {
        return NextResponse.json(
          { message: "Invalid guide block format" },
          { status: 400 }
        );
      }
    }

    const guide = await ProblemGuide.create({
      problemId,
      level,
      guideContent,
    });

    return NextResponse.json(guide, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    console.error("POST /problem-guide error:", message);

    return NextResponse.json(
      { message: "Failed to create guide", error: message },
      { status: 500 }
    );
  }
}

function isValidGuideBlock(block: unknown): block is GuideBlock {
  if (typeof block !== "object" || block === null) return false;

  if (!("type" in block) || !("content" in block)) return false;

  if (typeof block.content !== "string") return false;

  if (block.type === "code") {
    return "language" in block && typeof block.language === "string";
  }

  return true;
}

/**
 * DELETE /api/problem-guide
 * - ?problemId=xxx → delete one
 * - ?all=true      → delete all
 */
export async function DELETE(req: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const problemId = searchParams.get("problemId");
    const deleteAll = searchParams.get("all") === "true";

    // ----------------------------
    // DELETE ALL GUIDES
    // ----------------------------
    if (deleteAll) {
      const result = await ProblemGuide.deleteMany({});

      return NextResponse.json(
        {
          message: "All problem guides deleted successfully",
          deletedCount: result.deletedCount,
        },
        { status: 200 }
      );
    }

    // ----------------------------
    // DELETE ONE GUIDE
    // ----------------------------
    if (!problemId) {
      return NextResponse.json(
        { message: "problemId is required unless all=true" },
        { status: 400 }
      );
    }

    const deletedGuide = await ProblemGuide.findOneAndDelete({
      problemId,
    });

    if (!deletedGuide) {
      return NextResponse.json(
        { message: "Problem guide not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Problem guide deleted successfully",
        data: deletedGuide,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    console.error("DELETE /problem-guide error:", message);

    return NextResponse.json(
      { message: "Failed to delete guide", error: message },
      { status: 500 }
    );
  }
}
