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

export const fetchAllGameProgress = async () => {
  const response = await fetch("/api/game-progress");
  return response.json();
};

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
