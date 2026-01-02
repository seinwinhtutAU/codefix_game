import {
  ExecutionResponse,
  ExecutionResult,
  HintUsage,
  ProblemFile,
  FileStructure,
  NormalExecutionResponse,
  TestExecutionResponse,
} from "@/lib/types";

// Format normal execution response
export function formatNormalExecutionResult(
  data: NormalExecutionResponse
): ExecutionResult {
  return {
    success: data.success,
    output: data.output || "",
    error: data.error,
    executionTime: data.execution_time,
    waitingForInput: data.waiting_for_input,
    inputPrompt: data.input_prompt,
    executionId: data.execution_id,
  };
}

// // Format test execution response
export function formatTestExecutionResult(
  data: TestExecutionResponse
): ExecutionResult {
  return {
    success: data.success,
    output: data.output || "",
    error: data.error,
    executionTime: data.execution_time,
    passedTests: data.passed_tests,
    totalTests: data.total_tests,
    testResults:
      data.test_results?.map((result, index) => ({
        testNumber: index + 1,
        input: result.test_case?.input,
        expectedOutput: result.test_case?.expectedOutput || "",
        actualOutput: result.actual_output || "",
        passed: result.passed,
        error: result.error,
      })) || [],
  };
}

// Original function kept for backward compatibility
export function formatExecutionResult(
  data: ExecutionResponse
): ExecutionResult {
  return formatTestExecutionResult(data as TestExecutionResponse);
}

export function convertToFileStructure(
  files: ProblemFile[],
  fileContents: Record<string, string>,
  parentPath = ""
): FileStructure[] {
  const result: FileStructure[] = [];

  for (const file of files) {
    const currentPath = parentPath ? `${parentPath}/${file.name}` : file.name;

    if (file.type === "file") {
      result.push({
        name: file.name,
        content: fileContents[file.id] ?? file.content ?? "",
        path: currentPath,
      });
    } else {
      // folder → recursively collect all children files
      if (file.children) {
        const nested = convertToFileStructure(
          file.children,
          fileContents,
          currentPath
        );
        result.push(...nested);
      }
    }
  }

  return result;
}

export function calculatePoints(hintUsages: HintUsage[]): number {
  const basePoints = 100;
  let deduction = 0;

  hintUsages.forEach((usage) => {
    switch (usage.hintLevel) {
      case "small":
        deduction += 10;
        break;
      case "medium":
        deduction += 15;
        break;
      case "big":
        deduction += 20;
        break;
    }
  });

  return Math.max(0, basePoints - deduction);
}
