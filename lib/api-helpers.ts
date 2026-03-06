import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { TreeNode } from "@/lib/types";
import { IFileDocument } from "@/models/IFileDocument";
import { buildTree } from "@/lib/utils";

/**
 * Standard error response handler
 */
export function createErrorResponse(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error("API Error:", message);
  return NextResponse.json({ error: message }, { status });
}

/**
 * Validate required parameters
 */
export function validateParams(
  params: Record<string, string | undefined>
): string | null {
  for (const [key, value] of Object.entries(params)) {
    if (!value) {
      return `Missing ${key}`;
    }
  }
  return null;
}

/**
 * Build file tree for a specific problem
 */
export async function buildProblemFiles<
  T extends { problemId?: string },
  D extends IFileDocument
>(
  Model: mongoose.Model<D>,
  problemId: string,
  transform: (doc: D) => T
): Promise<TreeNode<T>[]> {
  return buildTree<T, D>(Model, null, transform, { problemId });
}
