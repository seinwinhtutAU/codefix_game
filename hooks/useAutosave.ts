import { useEffect, useRef } from "react";
import { Problem } from "@/lib/types";
import { saveUserCode } from "@/services";

const AUTOSAVE_DELAY_MS = 500;

export function useAutosave(userId: string, problem: Problem | null) {
  const saveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!problem || !userId || userId === "null") return;

    // Clear old timeout if user keeps typing
    if (saveTimeoutRef.current !== null) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Schedule autosave
    saveTimeoutRef.current = window.setTimeout(() => {
      saveUserCode(userId, problem);
    }, AUTOSAVE_DELAY_MS);

    // Cleanup on unmount or change
    return () => {
      if (saveTimeoutRef.current !== null) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [problem?.userCodeFiles, userId]);
}
