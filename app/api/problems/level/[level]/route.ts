import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Problem, { IProblem } from "@/models/Problem";
import ProblemFile, { IProblemFile } from "@/models/ProblemFile";
import { ProblemFileNode } from "@/lib/types";
import {
  createErrorResponse,
  validateParams,
  buildProblemFiles,
} from "@/lib/api-helpers";
import { requireAuth } from "@/lib/auth-guard";

const VALID_LEVELS = ["easy", "medium", "hard", "boss"] as const;

export async function GET(
  req: NextRequest,
  ctx: RouteContext<"/api/problems/level/[level]">,
) {
  try {
    const auth = requireAuth(req);
    if (!auth.ok) return auth.response;

    await dbConnect();

    const { level } = await ctx.params;
    const includeFilesParam = req.nextUrl.searchParams.get("includeFiles");
    const includeFiles = includeFilesParam !== "false";

    const validationError = validateParams({ level });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    if (!VALID_LEVELS.includes(level as (typeof VALID_LEVELS)[number])) {
      return NextResponse.json({ error: "Invalid level" }, { status: 400 });
    }

    // Add sorting by order field in ascending order
    const problems = await Problem.find({ difficulty: level, mode: "normal" })
      .sort({ order: 1 })
      .lean<IProblem[]>();

    if (includeFiles) {
      const problemsWithFiles = await Promise.all(
        problems.map((problem) => enrichProblemWithFiles(problem)),
      );

      return NextResponse.json({
        success: true,
        problems: problemsWithFiles,
      });
    }

    return NextResponse.json({
      success: true,
      problems,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

async function enrichProblemWithFiles(problem: IProblem) {
  const problemId = problem._id.toString();

  const problemFiles = await buildProblemFiles<ProblemFileNode, IProblemFile>(
    ProblemFile,
    problemId,
    (doc) => ({
      problemId: doc.problemId.toString(),
      content: doc.content,
      mode: doc.mode,
    }),
  );

  return {
    ...problem,
    _id: problemId,
    files: problemFiles,
  };
}
