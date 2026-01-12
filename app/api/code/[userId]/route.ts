import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { buildTree } from "@/lib/utils";
import UserCodeFile, { IUserCodeFile } from "@/models/UserCodeFile";
import { UserCodeFileNode } from "@/lib/types";
import { createErrorResponse, validateParams } from "@/lib/api-helpers";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/code/[userId]">
) {
  try {
    await dbConnect();

    const { userId } = await ctx.params;

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
      })
    );

    const userFiles = allFiles.filter((file) => file.data?.userId === userId);

    return NextResponse.json({
      success: true,
      files: userFiles,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/code/[userId]">
) {
  try {
    await dbConnect();

    const { userId } = await ctx.params;

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
