import {
  ExecutionResult,
  ProblemFile,
  FileStructure,
  NormalExecutionResponse,
  TestExecutionResponse,
} from "@/lib/types";

// Format normal execution response
export function formatNormalExecutionResult(
  data: NormalExecutionResponse,
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

// Format test execution response
export function formatTestExecutionResult(
  data: TestExecutionResponse,
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

/*
Convert a problem file tree into a flat file structure.

- Read the file tree (files and folders)
- Build full file paths such as:
  src/main.py
  src/utils/helper.py
- Use user-modified content if available, otherwise use original content
- Return a list of files with name, path, and content
*/
export function convertToFileStructure(
  files: ProblemFile[],
  fileContents: Record<string, string>,
  parentPath = "",
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
          currentPath,
        );
        result.push(...nested);
      }
    }
  }

  return result;
}
