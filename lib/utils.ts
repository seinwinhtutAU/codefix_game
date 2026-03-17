import mongoose from "mongoose";
import { TreeNode } from "@/lib/types";
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
  extraData?: Partial<T>,
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
          extraData,
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
  extraTransform?: (doc: D) => T,
  baseFilter: Record<string, unknown> = {},
): Promise<TreeNode<T>[]> {
  const documents = await Model.find({ parentId, ...baseFilter })
    .sort({ order: 1 })
    .lean();
  const tree: TreeNode<T>[] = [];

  for (const doc of documents) {
    const children = await buildTree<T, D>(
      Model,
      doc._id.toString(),
      extraTransform,
      baseFilter,
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
        `Duplicate file/folder name '${file.name}' in path '${path}'`,
      );
    }
    names.add(file.name);

    if (file.children?.length) {
      validateSiblingNames(file.children, `${path}/${file.name}`);
    }
  }
}

// ============================================================================
// Tree Flattening
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
  nodes: TreeNode<T>[],
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
