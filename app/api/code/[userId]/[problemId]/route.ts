import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { saveFiles, validateSiblingNames, buildTree } from "@/lib/utils";
import { TreeNode } from "@/lib/types";
import UserCodeFile, { IUserCodeFile } from "@/models/UserCodeFile";
import { UserCodeFileNode, UserCodeRequest } from "@/lib/types";
import { createErrorResponse, validateParams } from "@/lib/api-helpers";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/code/[userId]/[problemId]">
) {
  try {
    await dbConnect();

    const { problemId, userId } = await ctx.params;

    const validationError = validateParams({ problemId, userId });
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

    const userFiles = allFiles.filter(
      (file) =>
        file.data?.problemId === problemId && file.data?.userId === userId
    );

    return NextResponse.json({
      success: true,
      files: userFiles,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/code/[userId]/[problemId]">
) {
  try {
    await dbConnect();

    const body: UserCodeRequest = await req.json();
    const { problemId, userId } = await ctx.params;

    const validationError = validateParams({ problemId, userId });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    if (body.files) {
      validateSiblingNames(body.files);
    }

    const codeFiles = body.files?.length
      ? await saveFiles<UserCodeFileNode, IUserCodeFile>(
          body.files,
          UserCodeFile,
          null,
          {
            problemId: problemId.toString(),
            userId: userId.toString(),
          }
        )
      : [];

    return NextResponse.json({ success: true, userCode: codeFiles });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function PUT(
  req: NextRequest,
  ctx: RouteContext<"/api/code/[userId]/[problemId]">
) {
  try {
    await dbConnect();

    const body: UserCodeRequest = await req.json();
    const { problemId, userId } = await ctx.params;

    const validationError = validateParams({ problemId, userId });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    if (!body.files || body.files.length === 0) {
      return NextResponse.json(
        { error: "No files provided to update" },
        { status: 400 }
      );
    }

    const updatedFiles: TreeNode<UserCodeFileNode>[] = [];

    for (const file of body.files) {
      if (!file.id) {
        return NextResponse.json(
          { error: "File id is required for update" },
          { status: 400 }
        );
      }

      const updated = await updateFileNode(file, userId, problemId, null);
      if (updated) {
        updatedFiles.push(updated);
      }
    }

    return NextResponse.json({ success: true, updatedFiles });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function DELETE(
  req: NextRequest,
  ctx: RouteContext<"/api/code/[userId]/[problemId]">
) {
  try {
    await dbConnect();

    const body: { id: string } = await req.json();
    const { problemId, userId } = await ctx.params;

    const validationError = validateParams({ problemId, userId });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    if (!body.id) {
      return NextResponse.json(
        { error: "Missing file/folder id" },
        { status: 400 }
      );
    }

    const target = await UserCodeFile.findOne({
      _id: body.id,
      userId,
      problemId,
    });

    if (!target) {
      return NextResponse.json(
        { error: "File or folder not found" },
        { status: 404 }
      );
    }

    const idsToDelete = await collectDeletionIds(
      target._id.toString(),
      userId,
      problemId,
      target.type === "folder"
    );

    const result = await UserCodeFile.deleteMany({
      _id: { $in: idsToDelete },
      userId,
      problemId,
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * Recursively update a file node and its children
 */
async function updateFileNode(
  node: TreeNode<UserCodeFileNode>,
  userId: string,
  problemId: string,
  parentId: string | null
): Promise<TreeNode<UserCodeFileNode> | null> {
  if (!node.id) return null;

  const updateData: Partial<IUserCodeFile> = {
    name: node.name,
    order: node.order,
    content: node.data?.content,
  };

  const updated = await UserCodeFile.findOneAndUpdate(
    { _id: node.id, userId, problemId },
    { $set: updateData },
    { new: true }
  );

  if (!updated) return null;

  const updatedChildren: TreeNode<UserCodeFileNode>[] = [];

  if (node.children?.length) {
    for (const child of node.children) {
      const updatedChild = await updateFileNode(
        child,
        userId,
        problemId,
        updated._id.toString()
      );
      if (updatedChild) {
        updatedChildren.push(updatedChild);
      }
    }
  }

  return {
    id: updated._id.toString(),
    name: updated.name,
    type: updated.type,
    parentId: updated.parentId?.toString() || null,
    order: updated.order,
    children: updatedChildren,
    data: {
      content: updated.content,
    },
  };
}

/**
 * Collect all IDs to delete (including nested children for folders)
 */
async function collectDeletionIds(
  targetId: string,
  userId: string,
  problemId: string,
  isFolder: boolean
): Promise<string[]> {
  const idsToDelete: string[] = [targetId];

  if (isFolder) {
    const collectChildren = async (parentId: string) => {
      const children = await UserCodeFile.find({
        parentId,
        userId,
        problemId,
      });

      for (const child of children) {
        idsToDelete.push(child._id.toString());
        if (child.type === "folder") {
          await collectChildren(child._id.toString());
        }
      }
    };

    await collectChildren(targetId);
  }

  return idsToDelete;
}
