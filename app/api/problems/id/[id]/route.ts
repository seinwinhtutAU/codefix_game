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
import { flattenTree } from "@/lib/utils";
import { requireAuth } from "@/lib/auth-guard";

export async function GET(
  req: NextRequest,
  ctx: RouteContext<"/api/problems/id/[id]">
) {
  try {
    const auth = requireAuth(req);
    if (!auth.ok) return auth.response;

    await dbConnect();

    const { id: problemId } = await ctx.params;
    const includeSolutionFilesParam =
      req.nextUrl.searchParams.get("includeSolutionFiles");
    const includeSolutionFiles = includeSolutionFilesParam === "true";

    const validationError = validateParams({ problemId });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const problem = await Problem.findById(problemId).lean<IProblem>();
    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

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
      includeSolutionFiles
        ? buildProblemFiles<SolutionFileNode, ISolutionFile>(
            SolutionFile,
            problemId,
            (doc) => ({
              problemId: doc.problemId.toString(),
              content: doc.content,
            })
          )
        : Promise.resolve([] as SolutionFileNode[]),
    ]);

    return NextResponse.json({
      success: true,
      problem: {
        ...problem,
        _id: problem._id.toString(),
        files: flattenTree(problemFiles),
        solutionFiles: includeSolutionFiles
          ? flattenTree(solutionFiles)
          : undefined,
      },
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function DELETE(
  req: NextRequest,
  ctx: RouteContext<"/api/problems/id/[id]">
) {
  try {
    const auth = requireAuth(req);
    if (!auth.ok) return auth.response;

    await dbConnect();

    const { id: problemId } = await ctx.params;

    // Validate problem ID format
    if (!problemId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { error: "Invalid problem ID format" },
        { status: 400 }
      );
    }

    // Check if problem exists
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    // Optional: Check for confirmation in query parameters
    const url = new URL(req.url);
    const confirm = url.searchParams.get("confirm");

    if (confirm && confirm !== "true") {
      return NextResponse.json(
        {
          error:
            "Confirmation required. Add ?confirm=true to delete this problem",
          warning: `This will permanently delete problem: ${problem.title}`,
          problemTitle: problem.title,
          problemId: problemId,
        },
        { status: 400 }
      );
    }

    // Delete all related data in parallel for better performance
    const [
      deletedProblem,
      deletedProblemFiles,
      deletedSolutionFiles,
      deletedUserCodeFiles,
      deletedSovledRecords,
    ] = await Promise.all([
      // Delete the main problem
      Problem.findByIdAndDelete(problemId),
      ProblemFile.deleteMany({ problemId }),
      SolutionFile.deleteMany({ problemId }),
      UserCodeFile.deleteMany({ problemId }),
      ProblemSolveRecord.deleteMany({ problemId }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Successfully deleted problem: ${problem.title}`,
      deletedProblem: {
        _id: deletedProblem?._id?.toString(),
        title: deletedProblem?.title,
      },
      stats: {
        deletedProblem: deletedProblem ? 1 : 0,
        deletedProblemFiles: deletedProblemFiles.deletedCount,
        deletedSolutionFiles: deletedSolutionFiles.deletedCount,
        deletedUserCodeFiles: deletedUserCodeFiles.deletedCount,
        deletedSovledRecords: deletedSovledRecords.deletedCount,
      },
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
