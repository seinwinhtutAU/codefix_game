import { useState, useEffect, useCallback } from "react";
import { Problem } from "@/lib/types";

export function useSolvingTimer(
  initialTimeSpent: number,
  hasCompleted: boolean,
  problem: Problem | null,
  problemId: string,
  timeLimit: number,
) {
  const storageKey = `timer_${problemId}`;

  /*
  Initialize total time spent.
  - Load saved timer value from localStorage if available
  - If no saved value, use the initial time
  - Handle SSR by checking if window exists
  */
  const [totalTimeSpent, setTotalTimeSpent] = useState<number>(() => {
    if (typeof window === "undefined") return initialTimeSpent;

    const saved = localStorage.getItem(`timer_${problemId}`);
    const savedTime = Number(saved);

    if (!Number.isNaN(savedTime)) {
      return savedTime;
    }

    return initialTimeSpent;
  });
  const [isSolving, setIsSolving] = useState<boolean>(true); // whether the user is currently solving the problem
  const [isTimeUp, setIsTimeUp] = useState(false); // whether the time limit has been reached

  /*
  Save timer progress.
  - Store total time spent in localStorage
  - Only save if the task is not completed
  - Update whenever time changes
  */
  useEffect(() => {
    if (!hasCompleted && totalTimeSpent > 0) {
      localStorage.setItem(storageKey, totalTimeSpent.toString());
    }
  }, [totalTimeSpent, storageKey, hasCompleted]);

  /*
  Timer logic for solving the problem.
  - Start a timer when the user is solving and the task is not completed
  - Increase total time every second
  - Stop the timer when time reaches the limit
  - Mark time as up and stop solving
  */
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

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
    localStorage.removeItem(storageKey);
    setTotalTimeSpent(0);
    setIsTimeUp(false);
    setIsSolving(true);
  }, [storageKey]);

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
