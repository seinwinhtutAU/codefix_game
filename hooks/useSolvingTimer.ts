import { useState, useEffect, useCallback } from "react";
import { Problem } from "@/lib/types";

export function useSolvingTimer(
  initialTimeSpent: number,
  hasCompleted: boolean,
  problem: Problem | null
) {
  const [totalTimeSpent, setTotalTimeSpent] =
    useState<number>(initialTimeSpent);
  const [isSolving, setIsSolving] = useState<boolean>(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isSolving && !hasCompleted && problem) {
      interval = setInterval(() => {
        setTotalTimeSpent((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSolving, hasCompleted, problem]);

  const updateTotalTimeSpent = useCallback((time: number) => {
    setTotalTimeSpent(time);
  }, []);

  const setIsSolvingState = useCallback((state: boolean) => {
    setIsSolving(state);
  }, []);

  return {
    totalTimeSpent,
    setTotalTimeSpent: updateTotalTimeSpent,
    isSolving,
    setIsSolving: setIsSolvingState,
  };
}
