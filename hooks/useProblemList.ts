import { useState, useCallback, useEffect } from "react";
import { Problem } from "@/lib/types";
import { fetchProblemsByLevel, checkExistingSolveRecord } from "@/services";

interface UseProblemListProps {
  currentProblem?: Problem | null;
  userId: string | null;
  currentCompletion: boolean;
}

export function useProblemList({
  currentProblem,
  userId,
  currentCompletion,
}: UseProblemListProps) {
  const [showProblemList, setShowProblemList] = useState(false);
  const [levelProblems, setLevelProblems] = useState<Problem[]>([]);
  const [isLoadingProblems, setIsLoadingProblems] = useState(false);
  const [completionStatus, setCompletionStatus] = useState<
    Record<string, boolean>
  >({});
  const [hasFetched, setHasFetched] = useState(false); // Track if we've fetched

  // -------------------------------------------------------------
  // Refresh completion statuses
  // -------------------------------------------------------------
  const refreshCompletionStatuses = useCallback(async () => {
    if (!userId || userId === "null" || !levelProblems.length) return;

    try {
      const statuses: Record<string, boolean> = {};

      const promises = levelProblems.map(async (problem) => {
        try {
          const record = await checkExistingSolveRecord(userId, problem._id);
          statuses[problem._id] =
            record?.success === true && record.data !== null;
        } catch {
          statuses[problem._id] = false;
        }
      });

      await Promise.all(promises);
      setCompletionStatus(statuses);
    } catch (error) {
      console.error("Failed to refresh completion statuses:", error);
    }
  }, [userId, levelProblems]);

  // -------------------------------------------------------------
  // 1. Load problems for current difficulty
  // -------------------------------------------------------------
  const loadLevelProblems = useCallback(async () => {
    if (!currentProblem?.difficulty || isLoadingProblems || hasFetched) return;

    setIsLoadingProblems(true);

    try {
      const res = await fetchProblemsByLevel(
        currentProblem.difficulty.toLowerCase()
      );

      if (!res.success) return;

      const problems = res.problems;
      setLevelProblems(problems);
      setHasFetched(true); // Mark as fetched

      // Refresh completion statuses
      await refreshCompletionStatuses();
    } catch (err) {
      console.error("Error loading problems:", err);
    } finally {
      setIsLoadingProblems(false);
    }
  }, [
    currentProblem?.difficulty,
    isLoadingProblems,
    hasFetched,
    refreshCompletionStatuses,
  ]);

  // -------------------------------------------------------------
  // 2. Load problems ONCE when current problem changes
  // -------------------------------------------------------------
  useEffect(() => {
    if (currentProblem && !hasFetched) {
      loadLevelProblems();
    }
  }, [currentProblem?._id, loadLevelProblems, hasFetched]);

  // -------------------------------------------------------------
  // 3. Update completion when currentCompletion changes
  // -------------------------------------------------------------
  useEffect(() => {
    if (currentProblem?._id) {
      setCompletionStatus((prev) => ({
        ...prev,
        [currentProblem._id]: currentCompletion,
      }));

      // Only refresh completion statuses, don't refetch all problems
      if (currentCompletion && userId && userId !== "null") {
        // Refresh completion statuses for all problems
        refreshCompletionStatuses();
      }
    }
  }, [
    currentProblem?._id,
    currentCompletion,
    userId,
    refreshCompletionStatuses,
  ]);

  // -------------------------------------------------------------
  // 4. Manual refresh function - only refresh completions
  // -------------------------------------------------------------
  const refreshProblemList = useCallback(async () => {
    if (userId && userId !== "null") {
      await refreshCompletionStatuses();
    }
  }, [userId, refreshCompletionStatuses]);

  // -------------------------------------------------------------
  // 5. Synchronous completion checker
  // -------------------------------------------------------------
  const checkProblemCompletion = useCallback(
    (problemId: string) => {
      return completionStatus[problemId] || false;
    },
    [completionStatus]
  );

  return {
    showProblemList,
    setShowProblemList,
    levelProblems,
    isLoadingProblems,
    checkProblemCompletion,
    loadLevelProblems,
    refreshCompletionStatuses,
    refreshProblemList,
  };
}
