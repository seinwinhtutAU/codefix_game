import { ITestCase } from "@/models/Problem";

// ============================================================================
// Core Tree Structure
// ============================================================================

export interface TreeNode<T = object> {
  id?: string;
  name: string;
  type: "file" | "folder";
  parentId?: string | null;
  order?: number;
  children?: TreeNode<T>[];
  data?: T;
}

// ============================================================================
// Problem Types
// ============================================================================

export interface CreateProblemRequest {
  mode: "normal" | "game" | "paste";
  title?: string;
  description?: string;
  difficulty?: "easy" | "medium" | "hard" | "boss";
  hints?: {
    small?: string[];
    medium?: string[];
    big?: string[];
  };
  order?: number;
  expectedOutput?: string[];
  files?: TreeNode<{ content?: string }>[];
}

export interface ProblemFileNode {
  content?: string;
  problemId?: string;
  mode?: string;
}

export interface ProblemFile {
  id: string;
  name: string;
  type: "file" | "folder";
  content: string;
  order: number;
  parentId?: string | null;
  children: ProblemFile[];
}

export interface Problem {
  _id: string;
  title: string;
  description: string;
  difficulty: string;
  files: ProblemFile[];
  userCodeFiles: TreeNode<UserCodeFileNode>[];
  expectedOutput: string;
  testCases: ITestCase[];
  mode: "normal" | "game" | "paste";
  hints?: {
    small?: string[];
    medium?: string[];
    big?: string[];
  };
}

// ============================================================================
// User Code Types
// ============================================================================

export interface UserCodeFileNode {
  userId?: string;
  problemId?: string;
  content?: string;
}

export interface UserCodeRequest {
  files: TreeNode<{ content?: string }>[];
}

export interface UserCodeFile {
  id: string;
  name: string;
  type: "file" | "folder";
  content: string;
  order: number;
  parentId?: string | null;
  children: UserCodeFile[];
}

// ============================================================================
// Code Execution Types
// ============================================================================

export interface FileStructure {
  name: string;
  content: string;
  path: string;
  children?: FileStructure[];
}

export interface TestCase {
  input?: string;
  expectedOutput: string;
}

export interface TestResult {
  testNumber: number;
  input?: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  error?: string;
}

export interface TestExecutionResult {
  test_case?: {
    input?: string;
    expectedOutput: string;
  };
  actual_output: string;
  passed: boolean;
  error?: string;
}

export interface ExecutionRequest {
  files: FileStructure[];
  test_cases?: TestCase[];
}

export interface ExecutionResponse {
  success: boolean;
  output: string;
  error?: string;
  execution_time?: number;
  test_results?: TestExecutionResult[];
  passed_tests?: number;
  total_tests?: number;
}

export interface NormalExecutionRequest {
  files: FileStructure[];
  inputs?: string[];
}

export interface NormalExecutionResponse {
  success: boolean;
  output: string;
  error?: string;
  execution_time?: number;
  waiting_for_input?: boolean;
  input_prompt?: string;
  execution_id?: string;
}

export interface ContinueExecutionRequest {
  input: string;
}

export interface ContinueExecutionResponse {
  success: boolean;
  output: string;
  error?: string;
  execution_time?: number;
  waiting_for_input?: boolean;
  input_prompt?: string;
  execution_id?: string;
}

export interface TestExecutionRequest {
  files: FileStructure[];
  test_cases: TestCase[];
}

export interface TestExecutionResponse {
  success: boolean;
  output: string;
  error?: string;
  execution_time?: number;
  test_results?: TestExecutionResult[];
  passed_tests?: number;
  total_tests?: number;
}

// Update ExecutionResult to handle both modes
export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime?: number;
  waitingForInput?: boolean;
  inputPrompt?: string;
  executionId?: string;
  passedTests?: number;
  totalTests?: number;
  testResults?: TestResult[];
}

// ============================================================================
// Hints Types
// ============================================================================

export interface Hint {
  id: string;
  content: string;
  level: "easy" | "medium" | "hard";
  used: boolean;
}

export interface HintsResponse {
  generated_hints: string[];
  level: "easy" | "medium" | "hard";
}

// ============================================================================
// Tracking Spending Time and Points Types
// ============================================================================

// ============================================================================
// User Type
// ============================================================================
export interface User {
  id: string;
  username: string;
  email: string;
}

// ============================================================================
// Solve Record Type
// ============================================================================
export interface HintUsage {
  hintId: string;
  hintLevel: "small" | "medium" | "big";
  usedAt: Date;
}

export interface SolveRecordRequest {
  userId: string;
  problemId: string;
  timeSpent: number;
  pointsEarned: number;
  hintUsages: HintUsage[];
  level: string;
  attempt?: number;
}

export interface ProblemSolveRecord {
  id: string;
  userId: string;
  problemId: string;
  timeSpent: number;
  pointsEarned: number;
  hintUsages?: HintUsage[];
  level?: string;
  attempt?: number;
  completedAt: Date;
  startedAt: Date;
}

export interface SolveRecordResponse {
  success: boolean;
  data: ProblemSolveRecord | null;
}

// ============================================================================
// Solve Record Type
// ============================================================================
export type GuideBlock = {
  type: string;
  content: string;
  language?: string;
};

export type CreateProblemGuideRequest = {
  problemId: string;
  level: "easy" | "medium" | "hard";
  guideContent: GuideBlock[];
};

export interface ProblemGuide {
  problemId: string;
  level: "easy" | "medium" | "hard";
  guideContent: GuideBlock[];
}

// ============================================================================
// Game Progress
// ============================================================================
export interface IGameProgress {
  userId: string;
  lastLocation: string;
  gameState: {
    currentScene: string;
    eventFlags: Record<string, boolean>;
    currentTask: {
      taskType: "code_problem" | "none";
      taskId?: string;
      status: "none" | "in_progress" | "completed";
      attempts?: number;
      timer?: number;
      currentActiveIndex?: number;
      highestHintLevelUsed?: "none" | "small" | "medium" | "big";
      hintUsages?: HintUsage[];
    };
  };
  bugCounts?: {
    problemId: string;
    bugCount: number;
  }[];
}

export interface CurrentTask {
  taskType: "code_problem" | "none";
  taskId?: string;
  status?: "none" | "in_progress" | "completed";
  attempts?: number;
  timer?: number;
  currentActiveIndex?: number;
  highestHintLevelUsed?: "none" | "small" | "medium" | "big";
  hintUsages?: HintUsage[];
}

// ============================================================================
// Paste Mode
// ============================================================================
export type HistoryItem = {
  type: "output" | "input";
  content: string;
  isError?: boolean;
};

export type ActiveTab = "terminal" | "expected" | "description";

// ============================================================================
// Generate Code and Hint
// ============================================================================

// ============================================================================
// Type Aliases for Better Semantics
// ============================================================================

export type FileType = "file" | "folder";
export type DifficultyLevel = "easy" | "medium" | "hard" | "boss";
export type HintLevel = "small" | "medium" | "big";
