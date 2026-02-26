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

  const [totalTimeSpent, setTotalTimeSpent] = useState<number>(() => {
    if (typeof window === "undefined") return initialTimeSpent;

    const saved = localStorage.getItem(`timer_${problemId}`);
    const savedTime = Number(saved);

    if (!Number.isNaN(savedTime)) {
      return savedTime;
    }

    return initialTimeSpent;
  });
  const [isSolving, setIsSolving] = useState<boolean>(true);
  const [isTimeUp, setIsTimeUp] = useState(false);

  // 2. Persist changes to LocalStorage
  useEffect(() => {
    if (!hasCompleted && totalTimeSpent > 0) {
      localStorage.setItem(storageKey, totalTimeSpent.toString());
    }
  }, [totalTimeSpent, storageKey, hasCompleted]);

  // 3. The Interval Logic
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
