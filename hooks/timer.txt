import { useState, useEffect, useCallback } from "react";
import { Problem } from "@/lib/types";

export function useSolvingTimer(
  initialTimeSpent: number,
  hasCompleted: boolean,
  problem: Problem | null,
  timeLimit: number = 30,
) {
  const [totalTimeSpent, setTotalTimeSpent] =
    useState<number>(initialTimeSpent);
  const [isSolving, setIsSolving] = useState<boolean>(true);
  const [isTimeUp, setIsTimeUp] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isSolving && !hasCompleted && problem && !isTimeUp) {
      interval = setInterval(() => {
        setTotalTimeSpent((prev) => {
          const nextTime = prev + 1;
          if (nextTime >= timeLimit) {
            setIsTimeUp(true);
            setIsSolving(false);
            return timeLimit;
          }
          return nextTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSolving, hasCompleted, problem, timeLimit, isTimeUp]);

  const resetTimer = useCallback(() => {
    setTotalTimeSpent(0);
    setIsTimeUp(false);
    setIsSolving(true);
  }, []);

  return {
    totalTimeSpent,
    timeLeft: Math.max(0, timeLimit - totalTimeSpent),
    isTimeUp,
    resetTimer,
    setTotalTimeSpent,
    isSolving,
    setIsSolving,
  };
}
