import { CreateProblemRequest, IGameProgress } from "@/lib/types";
import { ProblemResponse } from "./problem";

export async function getPlayerProgress() {
  const userJson = localStorage.getItem("user");
  if (!userJson) return null;

  const user = JSON.parse(userJson);
  const response = await fetch(`/api/game-progress?userId=${user.id}`);
  if (!response.ok) return null;

  return await response.json();
}

export async function saveGameProgress(progress: IGameProgress): Promise<void> {
  console.log("saveGameProgress payload: ", JSON.stringify(progress, null, 2));

  const response = await fetch("/api/game-progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(progress),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Save failed:", error);
    throw new Error("Failed to save game progress");
  }

  return response.json();
}

export async function generateRandomProblem(
  difficulty: string,
  bug_num: number,
): Promise<string> {
  const response = await fetch(
    `http://localhost:8000/api/generate-problem?difficulty=${difficulty}&bug_num=${bug_num}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    console.error("Failed to generate random problem:", error);
    throw new Error(error.detail || "Failed to generate random problem");
  }

  const data: { success: boolean; problem: CreateProblemRequest } =
    await response.json();

  const problemResponse = await fetch("/api/problems", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data.problem),
  });

  if (!problemResponse.ok) {
    const error = await problemResponse.json();
    console.error("Failed to save random problem:", error);
    throw new Error(error.error || "Failed to save random problem");
  }

  console.log("Problem generated and saved successfully!");

  const problemData: ProblemResponse = await problemResponse.json();
  return problemData.problem._id;
}
