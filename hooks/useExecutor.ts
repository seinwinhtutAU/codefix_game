"use client";

import { useState, useCallback } from "react";
import { Problem, ExecutionResult, HintUsage } from "@/lib/types";
import {
  formatNormalExecutionResult,
  formatTestExecutionResult,
  convertToFileStructure,
} from "@/utils";
import { SolveRecordRequest } from "@/lib/types";
import { SolveRecordResponse } from "@/services";

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
  bugCounts?: number;
  timeLimited?: number;
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
  bugCounts,
  timeLimited,
}: UseExecutorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false); // Running/Submitting (prevent duplicate clicks)
  const [isContinuing, setIsContinuing] = useState(false); // Continuing execution (handling input)
  const [executionResult, setExecutionResult] =
    useState<ExecutionResult | null>(null); // Execution result (output / error / test results)
  const [showOutput, setShowOutput] = useState(false); // Output panel show/hide

  /*
  Run normal code (Run button)
  Function:
  Send code to the backend for execution and return the output.
  1. Check for duplicate submission (isSubmitting)
  2. Set submitting state and open the output panel
  3. Convert files to the format required by the backend
  4. Send a POST request to execute the code
  5. Format the returned result and update the state
  6. Handle errors (display error message)
  7. Reset submitting state
  */
  const runNormalCode = useCallback(async () => {
    // preventing duplicated click of run code
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
        "https://fastapi1-05lo.onrender.com/api/execute/normal",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        },
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

  /*
  Test code submission (Submit button)
  Function:
  1. Run all test cases
  2. Show test results (pass / fail)
  3. Automatically save the solution record if all tests pass
  4. Calculate final score (base score - hint penalty - attempt penalty + bug bonus)
  */
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

      console.log("test cases: ", JSON.stringify(request, null, 2));

      const response = await fetch(
        "https://fastapi1-05lo.onrender.com/api/execute/test",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        },
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
          const bugFactor = Math.max(0, (bugCounts ?? 0) - 10);
          pointsEarned = pointsEarned + bugFactor * 10;
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

        // deduction of points for attempts
        if (pointsEarned > reduceAttemptPoint) {
          pointsEarned = pointsEarned - reduceAttemptPoint;
        }

        const PENALTY_PER_ATTEMPT = timeLimited ?? 1200;
        const totalAttempts = attempt ?? 0;
        // Save solve record
        try {
          const newRecord: SolveRecordRequest = {
            userId: userId,
            problemId: problem._id,
            timeSpent: timerTimeSpent + totalAttempts * PENALTY_PER_ATTEMPT,
            hintUsages: hintUsages,
            pointsEarned: pointsEarned,
            level: level,
            attempt: attempt,
          };

          console.log(
            "Saving solve record:",
            JSON.stringify(newRecord, null, 2),
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

  /*
  Continue executing a program waiting for input.
  Scenario:
  The program pauses at input() and requires user input to continue.
  
  Parameters:
  - executionId: ID of the current program execution
  - input: user input content

  Process:
  1. Prevent duplicate execution (isContinuing)
  2. Send input to the backend
  3. Get the result after continuing execution
  4. Update execution result
  */
  const continueExecution = useCallback(
    async (executionId: string, input: string) => {
      if (!executionId || !input.trim() || isContinuing) return;

      setIsContinuing(true);

      try {
        const request = { input };

        const response = await fetch(
          `https://fastapi1-05lo.onrender.com/api/execute/normal/${executionId}/continue`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request),
          },
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
    [isContinuing],
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
