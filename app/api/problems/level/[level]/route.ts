import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Problem, { IProblem } from "@/models/Problem";
import ProblemFile, { IProblemFile } from "@/models/ProblemFile";
import SolutionFile, { ISolutionFile } from "@/models/SolutionFile";
import { ProblemFileNode, SolutionFileNode } from "@/lib/types";
import {
  createErrorResponse,
  validateParams,
  buildProblemFiles,
} from "@/lib/api-helpers";

const VALID_LEVELS = ["easy", "medium", "hard", "boss"] as const;

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/problems/level/[level]">
) {
  try {
    await dbConnect();

    const { level } = await ctx.params;

    const validationError = validateParams({ level });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    if (!VALID_LEVELS.includes(level as (typeof VALID_LEVELS)[number])) {
      return NextResponse.json({ error: "Invalid level" }, { status: 400 });
    }

    // Add sorting by order field in ascending order
    const problems = await Problem.find({ difficulty: level })
      .sort({ order: 1 }) // 1 = ascending, -1 = descending
      .lean<IProblem[]>();

    const problemsWithFiles = await Promise.all(
      problems.map((problem) => enrichProblemWithFiles(problem))
    );

    return NextResponse.json({
      success: true,
      problems: problemsWithFiles,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

async function enrichProblemWithFiles(problem: IProblem) {
  const problemId = problem._id.toString();

  const [problemFiles, solutionFiles] = await Promise.all([
    buildProblemFiles<ProblemFileNode, IProblemFile>(
      ProblemFile,
      problemId,
      (doc) => ({
        problemId: doc.problemId.toString(),
        content: doc.content,
        mode: doc.mode,
      })
    ),
    buildProblemFiles<SolutionFileNode, ISolutionFile>(
      SolutionFile,
      problemId,
      (doc) => ({
        problemId: doc.problemId.toString(),
        content: doc.content,
      })
    ),
  ]);

  return {
    ...problem,
    _id: problemId,
    files: problemFiles,
    solutionFiles: solutionFiles,
  };
}
