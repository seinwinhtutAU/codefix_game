// /services
import {
  Problem,
  TreeNode,
  UserCodeFileNode,
  ProblemSolveRecord,
  SolveRecordRequest,
  ProblemFile,
} from "@/lib/types";

export interface User {
  _id: string;
  username: string;
  email: string;
}

export interface ProblemResponse {
  success: boolean;
  problem: Problem;
}

export interface UserCodeResponse {
  success: boolean;
  files: TreeNode<UserCodeFileNode>[];
}

export interface SolveRecordResponse {
  success: boolean;
  data: ProblemSolveRecord | null;
}

export interface ProblemByLevelResponse {
  success: boolean;
  problems: Problem[];
}

export async function fetchProblem(
  problemId: string
): Promise<ProblemResponse> {
  const response = await fetch(`/api/problems/id/${problemId}`);
  return response.json();
}

export async function fetchProblemsByLevel(
  level: string
): Promise<ProblemByLevelResponse> {
  const response = await fetch(`/api/problems/level/${level}`);
  return response.json();
}

export async function fetchUserCode(
  userId: string,
  problemId: string
): Promise<UserCodeResponse> {
  const response = await fetch(`/api/code/${userId}/${problemId}`);
  return response.json();
}

export async function fetchAllSolveRecords(): Promise<{
  success: true;
  data: ProblemSolveRecord[];
}> {
  const response = await fetch(`/api/solve-record`);
  return response.json();
}

export async function fetchAllUsers(): Promise<{
  success: boolean;
  data: User[];
}> {
  const response = await fetch(`/api/user`);

  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }

  return response.json();
}

export async function fetchAllProblems(): Promise<{
  success: boolean;
  problems: Problem[];
}> {
  const response = await fetch(`/api/problems`);
  return response.json();
}

export async function checkExistingSolveRecord(
  userId: string,
  problemId: string
): Promise<SolveRecordResponse | null> {
  try {
    const response = await fetch(
      `/api/solve-record?userId=${userId}&problemId=${problemId}`
    );
    const data = await response.json();
    return data.success ? data || null : null;
  } catch (error) {
    console.error("Error checking solve record:", error);
    return null;
  }
}

export async function saveUserCode(
  userId: string,
  problem: Problem
): Promise<void> {
  if (!problem || !userId || userId === "null") return;

  try {
    const existingCode = await fetchUserCode(userId, problem._id);
    const hasExistingCode =
      existingCode.success && existingCode.files.length > 0;

    const method = hasExistingCode ? "PUT" : "POST";
    const payload = {
      files: hasExistingCode
        ? problem.userCodeFiles
        : buildInitialUserCode(problem.files),
    };

    const response = await fetch(`/api/code/${userId}/${problem._id}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (data.success) {
      console.log("User code saved successfully");
    }
  } catch (error) {
    console.error("Error saving user code:", error);
  }
}

export async function saveSolveRecord(
  solveRecord: SolveRecordRequest
): Promise<boolean> {
  try {
    console.log("solveRecord: ", JSON.stringify(solveRecord, null, 2));
    const existingRecord = await checkExistingSolveRecord(
      solveRecord.userId,
      solveRecord.problemId
    );

    console.log(
      "SolveRecordResponse: ",
      JSON.stringify(existingRecord, null, 2)
    );

    if (existingRecord?.data == null) {
      console.log("Creating new solve record...");
      const response = await fetch("/api/solve-record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(solveRecord),
      });

      if (!response.ok) return false;

      const data = await response.json();
      return data.success;
    }

    return true;
  } catch (error) {
    console.error("Error saving solve record:", error);
    return false;
  }
}

function buildInitialUserCode(
  files: ProblemFile[]
): TreeNode<{ content?: string }>[] {
  return files.map((file) => ({
    name: file.name,
    type: file.type,
    order: file.order,
    data: file.type === "file" ? { content: file.content || "" } : undefined,
    children: file.children ? buildInitialUserCode(file.children) : undefined,
  }));
}
