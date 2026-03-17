import { ProblemFile, TreeNode, UserCodeFileNode } from "@/lib/types";

export function findFileByName(
  files: ProblemFile[],
  name: string,
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

/*
Extract file contents from user code and problem files.

- Traverse user files and problem files together
- Get the current content (user-edited code)
- Get the original content from the problem
- Store both using the problem file ID as the key
*/
export function extractFileContents(
  userCodeFiles: TreeNode<UserCodeFileNode>[],
  problemFiles: ProblemFile[],
): {
  currentContents: Record<string, string>;
  originalContents: Record<string, string>;
} {
  const currentContents: Record<string, string> = {};
  const originalContents: Record<string, string> = {};

  function traverse(
    userNodes: TreeNode<UserCodeFileNode>[],
    problemNodes: ProblemFile[],
  ): void {
    userNodes.forEach((userNode) => {
      const problemFile = findFileByName(problemNodes, userNode.name);
      if (!problemFile) return;

      if (problemFile.type === "file") {
        currentContents[problemFile.id] =
          userNode.data?.content ?? problemFile.content ?? "";
        originalContents[problemFile.id] = problemFile.content ?? "";
      }

      if (userNode.children && problemFile.children) {
        traverse(userNode.children, problemFile.children);
      }
    });
  }

  traverse(userCodeFiles, problemFiles);
  return { currentContents, originalContents };
}

/*
Reset user code files to the original problem code.

- Traverse the user file tree and the problem file tree
- Find the matching problem file by name
- If it is a file, replace the user's code with the original problem code
- If it is a folder, recursively process its children
- Return the updated file tree
*/
export function resetUserCodeFilesToOriginal(
  userCodeFiles: TreeNode<UserCodeFileNode>[],
  problemFiles: ProblemFile[],
): TreeNode<UserCodeFileNode>[] {
  function traverse(
    userNodes: TreeNode<UserCodeFileNode>[],
    problemNodes: ProblemFile[],
  ): TreeNode<UserCodeFileNode>[] {
    return userNodes.map((userNode) => {
      const problemFile = findFileByName(problemNodes, userNode.name);
      if (!problemFile) return userNode;

      if (problemFile && userNode.type === "file") {
        return {
          ...userNode,
          data: {
            ...userNode.data,
            content: problemFile.content || "",
          },
        };
      }

      if (userNode.children && problemFile?.children) {
        return {
          ...userNode,
          children: traverse(userNode.children, problemFile.children),
        };
      }

      return userNode;
    });
  }

  return traverse(userCodeFiles, problemFiles);
}
