import mongoose from "mongoose";
import {
  TreeNode,
  ProblemFile,
  UserCodeFileNode,
  FileStructure,
} from "@/lib/types";
import { IFileDocument } from "@/models/IFileDocument";

// ============================================================================
// MongoDB Tree Operations
// ============================================================================

/**
 * Recursively save a tree of files/folders to MongoDB
 * @param files - Array of TreeNode to save
 * @param Model - Mongoose model to use for saving
 * @param parentId - Parent folder ID (null for root)
 * @param extraData - Additional data to merge into each document
 * @returns Saved tree structure with MongoDB IDs
 */
export async function saveFiles<T, D extends IFileDocument>(
  files: TreeNode<T>[],
  Model: mongoose.Model<D>,
  parentId: string | null = null,
  extraData?: Partial<T>
): Promise<TreeNode<T>[]> {
  const savedFiles: TreeNode<T>[] = [];
  let orderIndex = 0;

  for (const file of files) {
    // Remove client-side ID before saving
    const fileWithoutId = { ...file };
    if ("id" in fileWithoutId) {
      delete (fileWithoutId as Partial<TreeNode<T>>).id;
    }

    // Create and save document
    const document = new Model({
      name: file.name,
      type: file.type,
      parentId,
      order: file.order ?? orderIndex++,
      ...(file.data || {}),
      ...(extraData || {}),
    });

    await document.save();

    // Recursively save children
    const savedChildren = file.children?.length
      ? await saveFiles<T, D>(
          file.children,
          Model,
          document._id.toString(),
          extraData
        )
      : [];

    savedFiles.push({
      id: document._id.toString(),
      name: document.name,
      type: document.type,
      parentId,
      order: document.order,
      children: savedChildren,
      data: { ...(file.data || {}), ...(extraData || {}) } as T,
    });
  }

  return savedFiles.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/**
 * Build nested file tree from MongoDB documents
 * @param Model - Mongoose model to query
 * @param parentId - Parent folder ID (null for root level)
 * @param extraTransform - Optional function to extract additional fields into data
 * @returns Nested tree structure
 */
export async function buildTree<T, D extends IFileDocument>(
  Model: mongoose.Model<D>,
  parentId: string | null = null,
  extraTransform?: (doc: D) => T
): Promise<TreeNode<T>[]> {
  const documents = await Model.find({ parentId }).sort({ order: 1 }).lean();
  const tree: TreeNode<T>[] = [];

  for (const doc of documents) {
    const children = await buildTree<T, D>(
      Model,
      doc._id.toString(),
      extraTransform
    );

    tree.push({
      id: doc._id.toString(),
      name: doc.name,
      type: doc.type,
      parentId: doc.parentId ? doc.parentId.toString() : null,
      order: doc.order,
      children,
      data: extraTransform ? extraTransform(doc as D) : undefined,
    });
  }

  return tree;
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate that no duplicate file/folder names exist at the same level
 * @param files - Array of TreeNode to validate
 * @param path - Current path (for error messages)
 * @throws Error if duplicates are found
 */
export function validateSiblingNames<T>(files: TreeNode<T>[], path = ""): void {
  const names = new Set<string>();

  for (const file of files) {
    if (names.has(file.name)) {
      throw new Error(
        `Duplicate file/folder name '${file.name}' in path '${path}'`
      );
    }
    names.add(file.name);

    if (file.children?.length) {
      validateSiblingNames(file.children, `${path}/${file.name}`);
    }
  }
}

// ============================================================================
// Tree Flattening/Unflattening
// ============================================================================

export interface FlattenedNode<T = unknown> {
  id: string;
  name: string;
  type: "file" | "folder";
  parentId: string | null;
  order?: number;
  children: FlattenedNode<T>[];

  // merged file-node fields
  [key: string]: unknown;
}

/**
 * Flatten a tree structure by merging data into the node
 * @param nodes - Array of TreeNode to flatten
 * @returns Flattened array with data fields at the top level
 */
export function flattenTree<T extends object>(
  nodes: TreeNode<T>[]
): FlattenedNode<T>[] {
  return nodes.map((node) => {
    const { data, children, id, name, type, parentId, order } = node;

    const flattened: FlattenedNode<T> = {
      id: id ?? "",
      name: name ?? "",
      type: type ?? "file",
      parentId: parentId ?? null,
      order,
      children: [],
      ...(data ?? {}),
    };

    flattened.children = flattenTree(children ?? []);

    return flattened;
  });
}

/**
 * Unflatten a tree structure by extracting data fields
 * @param flattenedNodes - Array of FlattenedNode to unflatten
 * @returns TreeNode structure with data separated
 */
export function unflattenTree<T extends Record<string, unknown>>(
  flattenedNodes: FlattenedNode[]
): TreeNode<T>[] {
  return flattenedNodes.map((flatNode) => {
    const { children, id, name, type, parentId, order, ...dataFields } =
      flatNode;

    const treeNode: TreeNode<T> = {
      id,
      name,
      type,
      parentId,
      order,
      data: Object.keys(dataFields).length > 0 ? (dataFields as T) : undefined,
      children: children?.length ? unflattenTree(children) : undefined,
    };

    return treeNode;
  });
}

// ============================================================================
// Code Execution Utilities
// ============================================================================

/**
 * Convert problem files structure to FastAPI format with paths
 * @param problemFiles - Problem file tree structure
 * @param contents - Map of file IDs to their content
 * @returns Array of files with name, content, and full path
 */
// export function convertToFileStructure(
//   files: ProblemFile[],
//   fileContents: Record<string, string>
// ): FileStructure[] {
//   return files.map((file) => {
//     if (file.type === "file") {
//       return {
//         name: file.name,
//         content: fileContents[file.id] || file.content || "",
//         isDirectory: false,
//       };
//     } else {
//       return {
//         name: file.name,
//         content: "",
//         isDirectory: true,
//         children: file.children
//           ? convertToFileStructure(file.children, fileContents)
//           : [],
//       };
//     }
//   });
// }

// ============================================================================
// Output Comparison Utilities
// ============================================================================

/**
 * Normalize output string for comparison
 * @param output - Raw output string
 * @returns Normalized output (trimmed, lowercase, normalized whitespace)
 */
export function normalizeOutput(output: string): string {
  return output
    .trim()
    .replace(/\r\n/g, "\n") // Normalize line endings
    .replace(/\s+/g, " ") // Normalize whitespace
    .toLowerCase();
}

/**
 * Compare two outputs with flexible matching
 * @param actual - Actual output from code execution
 * @param expected - Expected output
 * @returns True if outputs match after normalization
 */
export function compareOutputs(actual: string, expected: string): boolean {
  return normalizeOutput(actual) === normalizeOutput(expected);
}

/**
 * Find and format differences between actual and expected outputs
 * @param actual - Actual output from code execution
 * @param expected - Expected output
 * @returns Formatted string describing differences
 */
export function findOutputDifferences(
  actual: string,
  expected: string
): string {
  const actualLines = actual.split("\n").map((line) => line.trim());
  const expectedLines = expected.split("\n").map((line) => line.trim());
  const maxLines = Math.max(actualLines.length, expectedLines.length);

  let differences = "";

  for (let i = 0; i < maxLines; i++) {
    const actualLine = actualLines[i] || "[MISSING]";
    const expectedLine = expectedLines[i] || "[MISSING]";

    if (actualLine !== expectedLine) {
      differences += `Line ${i + 1}:\n`;
      differences += `  Expected: "${expectedLine}"\n`;
      differences += `  Got:      "${actualLine}"\n`;
      differences += `  ${actualLine === expectedLine ? "✅" : "❌"}\n\n`;
    }
  }

  return (
    differences ||
    "No line-by-line differences found. Check for whitespace or formatting issues."
  );
}

// ============================================================================
// Time Formatting and File Utilities
// ============================================================================

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return "0:00";
  const safeSeconds = Math.floor(seconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export function findFileByName(
  files: ProblemFile[],
  name: string
): ProblemFile | null {
  for (const file of files) {
    if (file.name === name) return file;
    if (file.children) {
      const found = findFileByName(file.children, name);
      if (found) return found;
    }
  }
  return null;
}

export function findFirstFile(files: ProblemFile[]): ProblemFile | null {
  for (const file of files) {
    if (file.type === "file") return file;
    if (file.children) {
      const found = findFirstFile(file.children);
      if (found) return found;
    }
  }
  return null;
}

// Extract both current file contents and original contents
export function extractFileContents(
  userCodeFiles: TreeNode<UserCodeFileNode>[],
  problemFiles: ProblemFile[]
) {
  const currentContents: Record<string, string> = {};
  const originalContents: Record<string, string> = {};

  function traverse(
    userNodes: TreeNode<UserCodeFileNode>[],
    problemNodes: ProblemFile[]
  ) {
    userNodes.forEach((userNode) => {
      const problemFile = findFileByName(problemNodes, userNode.name);
      if (problemFile) {
        if (problemFile.type === "file") {
          currentContents[problemFile.id] =
            userNode.data?.content ?? problemFile.content ?? "";
          originalContents[problemFile.id] = problemFile.content ?? "";
        }
        if (userNode.children && problemFile.children) {
          traverse(userNode.children, problemFile.children);
        }
      }
    });
  }

  traverse(userCodeFiles, problemFiles);
  return { currentContents, originalContents };
}

// ============================================================================
// Guide Render
// ============================================================================

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
