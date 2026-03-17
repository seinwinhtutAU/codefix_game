import { useState, useCallback } from "react";
import { Problem, ProblemFile } from "@/lib/types";
import {
  fetchProblem,
  fetchUserCode,
  checkExistingSolveRecord,
} from "@/services";
import { extractFileContents, findFirstFile } from "@/utils";

export function useProblemLoader(problemId: string, userId: string) {
  const [problem, setProblem] = useState<Problem | null>(null); // problem information
  const [selectedFile, setSelectedFile] = useState<ProblemFile | null>(null); // currently edited file
  const [fileContents, setFileContents] = useState<Record<string, string>>({}); // user-modified code
  const [originalFileContents, setOriginalFileContents] = useState<
    Record<string, string>
  >({}); // original problem code
  const [isLoading, setIsLoading] = useState(true); // whether data is loading
  const [hasCompleted, setHasCompleted] = useState(false); // whether the problem is completed
  const [totalTimeSpent, setTotalTimeSpent] = useState<number>(0); // total time spent

  /*
  Load and initialize problem data.

  1. Fetch problem info, user code, and solve record in parallel
  2. Merge problem data with user code
  3. Initialize file contents and select the first file
  4. Restore completion status, hints, and time if a record exists
  5. Return progress data (completion, hints, time)
  */
  const loadProblemData = useCallback(async () => {
    try {
      setIsLoading(true);
      const shouldCheckRecord = userId && userId !== "null";
      const [problemData, userCodeData, existingRecord] = await Promise.all([
        fetchProblem(problemId),
        fetchUserCode(userId, problemId),
        shouldCheckRecord
          ? checkExistingSolveRecord(userId, problemId)
          : Promise.resolve(null),
      ]);

      if (problemData.success && userCodeData.success) {
        const enrichedProblem = {
          ...problemData.problem,
          userCodeFiles: userCodeData.files,
        };

        setProblem(enrichedProblem);

        const { currentContents, originalContents } = extractFileContents(
          userCodeData.files,
          problemData.problem.files,
        );

        setFileContents(currentContents);
        setOriginalFileContents(originalContents);

        const firstFile = findFirstFile(problemData.problem.files);
        setSelectedFile(firstFile);

        if (existingRecord?.data) {
          // Set states based on existing record
          setHasCompleted(true);
          setTotalTimeSpent(existingRecord.data.timeSpent || 0);

          return {
            hintUsages: existingRecord.data.hintUsages || [],
            totalTimeSpent: existingRecord.data.timeSpent || 0,
            hasCompleted: true,
          };
        } else {
          // No existing record found
          setHasCompleted(false);
          setTotalTimeSpent(0);

          return {
            hintUsages: [],
            totalTimeSpent: 0,
            hasCompleted: false,
          };
        }
      } else {
        // If fetch failed, set defaults
        setHasCompleted(false);
        setTotalTimeSpent(0);

        return {
          hintUsages: [],
          totalTimeSpent: 0,
          hasCompleted: false,
        };
      }
    } catch (error) {
      console.error("Error loading problem:", error);
      // On error, set defaults
      setHasCompleted(false);
      setTotalTimeSpent(0);

      return {
        hintUsages: [],
        totalTimeSpent: 0,
        hasCompleted: false,
      };
    } finally {
      setIsLoading(false);
    }
  }, [problemId, userId]);

  return {
    problem,
    setProblem,
    selectedFile,
    setSelectedFile,
    fileContents,
    setFileContents,
    originalFileContents,
    setOriginalFileContents,
    isLoading,
    hasCompleted,
    setHasCompleted,
    totalTimeSpent,
    setTotalTimeSpent,
    loadProblemData,
  };
}
