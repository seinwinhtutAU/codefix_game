import { useState, useCallback, useEffect } from "react";
import { Problem } from "@/lib/types";
import { fetchProblemsByLevel } from "@/services";

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
  const [showProblemList, setShowProblemList] = useState(false); // whether the problem list panel is visible
  const [levelProblems, setLevelProblems] = useState<Problem[]>([]); // list of problems in the current level
  const [isLoadingProblems, setIsLoadingProblems] = useState(false); // loading state for fetching problems
  const [completionStatus, setCompletionStatus] = useState<
    Record<string, boolean>
  >({}); // record of completed problems
  const [hasFetched, setHasFetched] = useState(false); // whether the problem list has been fetched

  /*
  Refresh completion status for problems in the current level.
  - Check which problems the user has completed
  - Fetch solve records in bulk from the backend
  - Map the results to each problem ID
  - Update completionStatus state
  - If the request fails, mark all problems as incomplete
  */
  const refreshCompletionStatuses = useCallback(
    async (problemsOverride?: Problem[]) => {
      const problemsToCheck = problemsOverride || levelProblems;
      if (!userId || userId === "null" || !problemsToCheck.length) return;

      try {
        const statuses: Record<string, boolean> = {};
        const problemIds = problemsToCheck.map((p) => p._id).join(",");

        if (problemIds.length > 0) {
          const res = await fetch(
            `/api/solve-record/bulk?userId=${userId}&problemIds=${problemIds}`,
          );

          if (res.ok) {
            const data = await res.json();
            if (data?.success && Array.isArray(data.data)) {
              const recordMap = new Map(
                data.data.map((r: any) => [r.problemId, r]),
              );
              problemsToCheck.forEach((problem) => {
                statuses[problem._id] = recordMap.has(problem._id);
              });
              setCompletionStatus(statuses);
              return;
            }
          }
        }

        // Fallback: set all to false if bulk fetch fails
        problemsToCheck.forEach((problem) => {
          statuses[problem._id] = false;
        });
        setCompletionStatus(statuses);
      } catch (error) {
        console.error("Failed to refresh completion statuses:", error);
      }
    },
    [userId, levelProblems],
  );

  /*
  Load problems for the current difficulty level.

  - Fetch problems based on the current problem's difficulty
  - Prevent duplicate loading using loading and fetched flags
  - Save the problems to state
  - Mark the list as fetched
  - Refresh completion status for each problem
  */
  const loadLevelProblems = useCallback(async () => {
    if (!currentProblem?.difficulty || isLoadingProblems || hasFetched) return;

    setIsLoadingProblems(true);

    try {
      const res = await fetchProblemsByLevel(
        currentProblem.difficulty.toLowerCase(),
        false,
      );

      if (!res.success) return;

      const problems = res.problems;
      setLevelProblems(problems);
      setHasFetched(true); // Mark as fetched

      // Refresh completion statuses
      await refreshCompletionStatuses(problems);
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

  // Load level problems when a new problem is opened
  useEffect(() => {
    if (currentProblem && !hasFetched) {
      loadLevelProblems();
    }
  }, [currentProblem?._id, loadLevelProblems, hasFetched]);

  // Update and refresh completion status when a problem is solved
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

  const refreshProblemList = useCallback(async () => {
    if (userId && userId !== "null") {
      await refreshCompletionStatuses();
    }
  }, [userId, refreshCompletionStatuses]);

  const checkProblemCompletion = useCallback(
    (problemId: string) => {
      return completionStatus[problemId] || false;
    },
    [completionStatus],
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
