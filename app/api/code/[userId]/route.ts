import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { buildTree } from "@/lib/utils";
import UserCodeFile, { IUserCodeFile } from "@/models/UserCodeFile";
import { UserCodeFileNode } from "@/lib/types";
import { createErrorResponse, validateParams } from "@/lib/api-helpers";
import { requireSameUser } from "@/lib/auth-guard";

export async function GET(
  req: NextRequest,
  ctx: RouteContext<"/api/code/[userId]">
) {
  try {
    const { userId } = await ctx.params;
    const auth = requireSameUser(req, userId);
    if (!auth.ok) return auth.response;

    await dbConnect();

    const validationError = validateParams({ userId });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const allFiles = await buildTree<UserCodeFileNode, IUserCodeFile>(
      UserCodeFile,
      null,
      (doc) => ({
        userId: doc.userId.toString(),
        problemId: doc.problemId.toString(),
        content: doc.content,
      }),
      { userId }
    );

    const userFiles = allFiles;
    return NextResponse.json({
      success: true,
      files: userFiles,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function DELETE(
  req: NextRequest,
  ctx: RouteContext<"/api/code/[userId]">
) {
  try {
    const { userId } = await ctx.params;
    const auth = requireSameUser(req, userId);
    if (!auth.ok) return auth.response;

    await dbConnect();

    const validationError = validateParams({ userId });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const result = await UserCodeFile.deleteMany({
      userId,
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
