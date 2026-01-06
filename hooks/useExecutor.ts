"use client";

import { useState, useCallback } from "react";
import { Problem, ExecutionResult, HintUsage } from "@/lib/types";
import {
  formatNormalExecutionResult,
  formatTestExecutionResult,
  convertToFileStructure,
} from "@/utils";
import { SolveRecordRequest } from "@/lib/types";
import { saveSolveRecord, SolveRecordResponse } from "@/services";
import { saveFiles } from "@/lib/utils";

interface UseExecutorProps {
  problem: Problem | null;
  fileContents: Record<string, string>;
  userId: string | null;
  hintUsages: HintUsage[];
  timerTimeSpent: number;
  hasCompleted: boolean;
  setHasCompleted: (completed: boolean) => void;
  level: string;
  attempt?: number;
}

export function useExecutor({
  problem,
  fileContents,
  userId,
  hintUsages,
  timerTimeSpent,
  hasCompleted,
  setHasCompleted,
  level,
  attempt,
}: UseExecutorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);
  const [executionResult, setExecutionResult] =
    useState<ExecutionResult | null>(null);
  const [showOutput, setShowOutput] = useState(false);

  const runNormalCode = useCallback(async () => {
    if (!problem || isSubmitting) return;

    setIsSubmitting(true);
    setShowOutput(true);

    try {
      // Convert files to FileStructure
      const files = convertToFileStructure(problem.files, fileContents);

      const request = {
        files,
        inputs: [] as string[],
      };

      const response = await fetch(
        "https://fastapi-code.up.railway.app/api/execute/normal",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        }
      );

      const data = await response.json();
      const result = formatNormalExecutionResult(data);
      setExecutionResult(result);

      return result;
    } catch (error) {
      const errorResult: ExecutionResult = {
        success: false,
        output: "",
        error: error instanceof Error ? error.message : "Execution failed",
        waitingForInput: false,
      };
      setExecutionResult(errorResult);
      return errorResult;
    } finally {
      setIsSubmitting(false);
    }
  }, [problem, fileContents, isSubmitting]);

  const runTestCode = useCallback(async () => {
    if (!problem || isSubmitting || !userId) return;

    setIsSubmitting(true);
    setShowOutput(true);

    try {
      const files = convertToFileStructure(problem.files, fileContents);
      const testCases = problem.testCases || [];

      const request = {
        files,
        test_cases: testCases.map((tc) => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
        })),
      };

      const response = await fetch(
        "https://fastapi-code.up.railway.app/api/execute/test",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        }
      );

      const data = await response.json();
      const result = formatTestExecutionResult(data);
      setExecutionResult(result);

      // If all tests passed, mark as completed and save solve record
      if (
        result.passedTests === result.totalTests &&
        result.totalTests &&
        result.totalTests > 0 &&
        !hasCompleted
      ) {
        setHasCompleted(true);

        // Calculate points based on hint usage and time spent
        let pointsEarned = 0;
        const reduceAttemptPoint = attempt ? attempt * 10 : 0;

        if (hintUsages.length == 0) {
          pointsEarned = 100;
        } else {
          for (const hintUsage of hintUsages) {
            if (hintUsage.hintLevel == "small") {
              pointsEarned = 90;
            } else if (hintUsage.hintLevel == "medium") {
              pointsEarned = 70;
            } else {
              pointsEarned = 50;
            }
          }
        }

        if (pointsEarned > reduceAttemptPoint) {
          pointsEarned = pointsEarned - reduceAttemptPoint;
        }

        // Save solve record
        try {
          const newRecord: SolveRecordRequest = {
            userId: userId,
            problemId: problem._id,
            timeSpent: timerTimeSpent,
            hintUsages: hintUsages,
            pointsEarned: pointsEarned,
            level: level,
            attempt: attempt,
          };

          console.log(
            "Saving solve record:",
            JSON.stringify(newRecord, null, 2)
          );

          const saveResponse = await fetch("/api/solve-record", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newRecord),
          });
          const saveData: SolveRecordResponse = await saveResponse.json();
          console.log("Solve record saved:", JSON.stringify(saveData, null, 2));
        } catch (saveError) {
          console.error("Failed to save solve record:", saveError);
        }
      }

      return result;
    } catch (error) {
      const errorResult: ExecutionResult = {
        success: false,
        output: "",
        error: error instanceof Error ? error.message : "Test execution failed",
        passedTests: 0,
        totalTests: 0,
        testResults: [],
      };
      setExecutionResult(errorResult);
      return errorResult;
    } finally {
      setIsSubmitting(false);
    }
  }, [
    problem,
    fileContents,
    isSubmitting,
    userId,
    hintUsages,
    timerTimeSpent,
    hasCompleted,
    setHasCompleted,
  ]);

  const continueExecution = useCallback(
    async (executionId: string, input: string) => {
      if (!executionId || !input.trim() || isContinuing) return;

      setIsContinuing(true);

      try {
        const request = { input };

        const response = await fetch(
          `https://fastapi-code.up.railway.app/api/execute/normal/${executionId}/continue`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request),
          }
        );

        const data = await response.json();
        const result = formatNormalExecutionResult(data);
        setExecutionResult(result);

        return result;
      } catch (error) {
        const errorResult: ExecutionResult = {
          success: false,
          output: "",
          error:
            error instanceof Error
              ? error.message
              : "Continue execution failed",
          waitingForInput: false,
        };
        setExecutionResult(errorResult);
        return errorResult;
      } finally {
        setIsContinuing(false);
      }
    },
    [isContinuing]
  );

  return {
    isSubmitting,
    isContinuing,
    executionResult,
    showOutput,
    setShowOutput,
    runNormalCode,
    runTestCode,
    continueExecution,
  };
}
