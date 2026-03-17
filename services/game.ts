import { IGameProgress } from "@/lib/types";

export async function getPlayerProgress() {
  const meRes = await fetch("/api/me");
  if (!meRes.ok) return null;
  const me = await meRes.json();
  const userId = me?.user?.id;
  if (!userId) return null;

  const response = await fetch(`/api/game-progress?userId=${userId}`);
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
