import { useState, useCallback } from "react";
import {
  Problem,
  ProblemFile,
  TreeNode,
  UserCodeFileNode,
  HintUsage,
} from "@/lib/types";
import { resetUserCodeFilesToOriginal } from "@/utils";

export function useUserCodeManager() {
  const [hintUsages, setHintUsages] = useState<HintUsage[]>([]);

  const findContentInUserCodeFiles = useCallback(
    (problem: Problem | null, fileName: string): string => {
      if (!problem) return "";

      function traverse(nodes: TreeNode<UserCodeFileNode>[]): string {
        for (const node of nodes) {
          if (
            node.name === fileName &&
            node.type === "file" &&
            node.data?.content
          ) {
            return node.data.content;
          }
          if (node.children) {
            const found = traverse(node.children);
            if (found) return found;
          }
        }
        return "";
      }

      return traverse(problem.userCodeFiles);
    },
    []
  );

  const getCurrentFileContent = useCallback(
    (
      selectedFile: ProblemFile | null,
      problem: Problem | null,
      fileContents: Record<string, string>,
      findContentInUserCodeFiles: (fileName: string) => string
    ): string => {
      if (!selectedFile || !problem) return "";

      // 🔑 If user has ever edited this file (even to empty), trust it
      if (Object.prototype.hasOwnProperty.call(fileContents, selectedFile.id)) {
        return fileContents[selectedFile.id];
      }

      const savedContent = findContentInUserCodeFiles(selectedFile.name);
      if (savedContent !== "") return savedContent;

      return selectedFile.content ?? "";
    },
    []
  );

  const getOriginalFileContent = useCallback(
    (
      selectedFile: ProblemFile | null,
      originalFileContents: Record<string, string>
    ): string => {
      if (!selectedFile) return "";
      return (
        originalFileContents[selectedFile.id] || selectedFile.content || ""
      );
    },
    []
  );

  const updateUserCodeFiles = useCallback(
    (
      problem: Problem | null,
      selectedFile: ProblemFile | null,
      fileId: string,
      newContent: string
    ) => {
      if (!problem || !selectedFile) return null;

      function updateNode(
        nodes: TreeNode<UserCodeFileNode>[]
      ): TreeNode<UserCodeFileNode>[] {
        return nodes.map((node) => {
          if (node.name === selectedFile?.name && node.type === "file") {
            return {
              ...node,
              data: { ...node.data, content: newContent },
            };
          }
          if (node.children) {
            return { ...node, children: updateNode(node.children) };
          }
          return node;
        });
      }

      return {
        ...problem,
        userCodeFiles: updateNode(problem.userCodeFiles),
      };
    },
    []
  );

  const resetAllFiles = useCallback(
    (problem: Problem | null, originalFileContents: Record<string, string>) => {
      if (!problem) return null;

      const updatedUserCodeFiles = resetUserCodeFilesToOriginal(
        problem.userCodeFiles,
        problem.files
      );

      return {
        ...problem,
        userCodeFiles: updatedUserCodeFiles,
      };
    },
    []
  );

  const recordHintUsage = useCallback(
    (hintId: string, hintLevel: "small" | "medium" | "big") => {
      setHintUsages((prev) => {
        const alreadyUsed = prev.some((h) => h.hintLevel === hintLevel);
        if (alreadyUsed) return prev;

        return [...prev, { hintId, hintLevel, usedAt: new Date() }];
      });
    },
    []
  );

  const isCurrentFileModified = useCallback(
    (
      selectedFile: ProblemFile | null,
      currentContent: string,
      originalContent: string
    ): boolean => {
      if (!selectedFile) return false;
      return currentContent !== originalContent;
    },
    []
  );

  const isAnyFileModified = useCallback(
    (
      fileContents: Record<string, string>,
      originalFileContents: Record<string, string>
    ): boolean => {
      for (const fileId in fileContents) {
        if (fileContents[fileId] !== originalFileContents[fileId]) {
          return true;
        }
      }
      return false;
    },
    []
  );

  return {
    hintUsages,
    setHintUsages,
    findContentInUserCodeFiles,
    getCurrentFileContent,
    getOriginalFileContent,
    updateUserCodeFiles,
    resetAllFiles,
    recordHintUsage,
    isCurrentFileModified,
    isAnyFileModified,
  };
}
