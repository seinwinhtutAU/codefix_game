import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Problem, { IProblem } from "@/models/Problem";
import UserCodeFile from "@/models/UserCodeFile";
import ProblemFile, { IProblemFile } from "@/models/ProblemFile";
import ProblemSolveRecord from "@/models/ProblemSolveRecord";
import { saveFiles, validateSiblingNames, flattenTree } from "@/lib/utils";
import { CreateProblemRequest, ProblemFileNode } from "@/lib/types";
import { createErrorResponse } from "@/lib/api-helpers";
import { buildProblemFiles } from "@/lib/api-helpers";
import { requireAuth } from "@/lib/auth-guard";

export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (!auth.ok) return auth.response;

    await dbConnect();

    const body: CreateProblemRequest = await req.json();

    const missingFields = [];
    if (!body.title) missingFields.push("title");
    if (!body.description) missingFields.push("description");
    if (!body.difficulty) missingFields.push("difficulty");
    if (!body.order) missingFields.push("order");

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 },
      );
    }

    // Validate file structure
    if (body.files) validateSiblingNames(body.files);

    // Create problem document
    const problem = await Problem.create({
      ...body,
      hints: body.hints ?? { small: [], medium: [], big: [] },
    });

    const problemMetadata = {
      problemId: problem._id.toString(),
      mode: problem.mode,
    };

    // Save associated files
    const files = body.files?.length
      ? await saveFiles<ProblemFileNode, IProblemFile>(
          body.files,
          ProblemFile,
          null,
          problemMetadata,
        )
      : [];

    return NextResponse.json({
      success: true,
      problem: {
        ...problem.toObject(),
        files,
      },
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (!auth.ok) return auth.response;

    await dbConnect();

    // Add sorting by order field in ascending order
    const problems = await Problem.find()
      .sort({ order: 1 }) // 1 = ascending, -1 = descending
      .lean<IProblem[]>();

    const problemsWithFiles = await Promise.all(
      problems.map((problem) => enrichProblemWithFiles(problem)),
    );

    return NextResponse.json({
      success: true,
      problems: problemsWithFiles,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * Enrich a problem with its file trees
 */
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
    files: flattenTree(problemFiles),
  };
}

/*
Deletion options:
- difficulty + confirm=true → delete all problems of that difficulty
- confirm=true → delete ALL problems

When deleting problems, also remove related data:
- Problem files
- User code files
- Solve records
*/
export async function DELETE(req: NextRequest) {
  try {
    const auth = requireAuth(req);
    if (!auth.ok) return auth.response;

    await dbConnect();

    const url = new URL(req.url);
    const confirm = url.searchParams.get("confirm");
    const difficulty = url.searchParams.get("difficulty");
    const mode = url.searchParams.get("mode");

    // Check if it's a difficulty-specific deletion
    if (difficulty) {
      // Validate difficulty value
      const validDifficulties = ["easy", "medium", "hard", "boss"];
      if (!validDifficulties.includes(difficulty.toLowerCase())) {
        return NextResponse.json(
          {
            error: "Invalid difficulty value",
            validDifficulties: validDifficulties,
          },
          { status: 400 },
        );
      }

      // Confirm deletion for difficulty-specific delete
      if (!confirm || confirm !== "true") {
        return NextResponse.json(
          {
            error: `Confirmation required. Add ?confirm=true to delete all ${difficulty} problems`,
            warning: `This will delete ALL ${difficulty} problems, their files, and user code data`,
          },
          { status: 400 },
        );
      }

      // Delete problems by difficulty
      const result = await deleteProblemsByDifficulty(
        difficulty.toLowerCase(),
        mode,
      );

      return NextResponse.json({
        success: true,
        message: `Successfully deleted ${result.deletedProblems} ${difficulty} problems`,
        stats: result,
      });
    }

    // Original bulk delete all problems
    if (!confirm || confirm !== "true") {
      return NextResponse.json(
        {
          error:
            "Confirmation required. Add ?confirm=true to delete all problems",
          warning:
            "This will delete ALL problems, their files, and user code data",
        },
        { status: 400 },
      );
    }

    // Delete all problems and related data
    const result = await deleteAllProblems();

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${result.deletedProblems} problems and all related data`,
      stats: result,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

async function deleteProblemsByDifficulty(
  difficulty: string,
  mode?: string | null,
) {
  // Build query for difficulty
  const query = {
    difficulty: { $regex: new RegExp(`^${difficulty}$`, "i") },
  };

  // Get all problem IDs for the specified difficulty
  const problems = await Problem.find(query, "_id").lean<IProblem[]>();
  const problemIds = problems.map((p) => p._id.toString());

  if (problemIds.length === 0) {
    return {
      deletedProblems: 0,
      deletedProblemFiles: 0,
      deletedUserCodes: 0,
      deletedSovledRecords: 0,
      deletedProblemGuides: 0,
    };
  }

  // Delete in parallel for better performance
  const [
    deletedProblems,
    deletedProblemFiles,
    deletedUserCodes,
    deletedSovledRecords,
    deletedProblemGuides,
  ] = await Promise.all([
    Problem.deleteMany({ _id: { $in: problemIds } }),
    ProblemFile.deleteMany({ problemId: { $in: problemIds } }),
    UserCodeFile.deleteMany({ problemId: { $in: problemIds } }),
    ProblemSolveRecord.deleteMany({ problemId: { $in: problemIds } }),
    ProblemSolveRecord.deleteMany({ problemId: { $in: problemIds } }),
  ]);

  return {
    deletedProblems: deletedProblems.deletedCount,
    deletedProblemFiles: deletedProblemFiles.deletedCount,
    deletedUserCodes: deletedUserCodes.deletedCount,
    deletedSovledRecords: deletedSovledRecords.deletedCount,
    deletedProblemGuides: deletedProblemGuides.deletedCount,
    difficulty: difficulty,
    mode: mode || "all modes",
  };
}

async function deleteAllProblems() {
  // Get all problem IDs before deletion for cleaning up related data
  const allProblems = await Problem.find({}, "_id").lean<IProblem[]>();
  const problemIds = allProblems.map((p) => p._id.toString());

  // Delete in parallel for better performance
  const [
    deletedProblems,
    deletedProblemFiles,
    deletedUserCodes,
    deletedSovledRecords,
    deletedProblemGuides,
  ] = await Promise.all([
    Problem.deleteMany({}),
    ProblemFile.deleteMany({ problemId: { $in: problemIds } }),
    UserCodeFile.deleteMany({ problemId: { $in: problemIds } }),
    ProblemSolveRecord.deleteMany({ problemId: { $in: problemIds } }),
    ProblemSolveRecord.deleteMany({ problemId: { $in: problemIds } }),
  ]);

  return {
    deletedProblems: deletedProblems.deletedCount,
    deletedProblemFiles: deletedProblemFiles.deletedCount,
    deletedUserCodes: deletedUserCodes.deletedCount,
    deletedSovledRecords: deletedSovledRecords.deletedCount,
    deletedProblemGuides: deletedProblemGuides.deletedCount,
  };
}

// PATCH /api/problems?id=p123
export async function PATCH(req: NextRequest) {
  try {
    await dbConnect();

    const url = new URL(req.url);
    const id = url.searchParams.get("id"); // Get ID from /api/problems?id=...

    if (!id) {
      return NextResponse.json(
        { error: "Problem ID is required for updates" },
        { status: 400 },
      );
    }

    const body: Partial<CreateProblemRequest> = await req.json();

    // 1. Update the main Problem document
    const updatedProblem = await Problem.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true },
    );

    if (!updatedProblem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    const problemMetadata = {
      problemId: updatedProblem._id.toString(),
      mode: updatedProblem.mode,
    };

    // 2. Optional: Handle file updates if provided in the body
    // Note: This logic assumes you want to replace existing files with new ones
    if (body.files) {
      if (body.files) {
        await ProblemFile.deleteMany({ problemId: id });
        await saveFiles<ProblemFileNode, IProblemFile>(
          body.files,
          ProblemFile,
          null,
          problemMetadata,
        );
      }
    }

    // 3. Return the enriched updated problem
    const finalProblem = await enrichProblemWithFiles(updatedProblem);

    return NextResponse.json({
      success: true,
      problem: finalProblem,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
