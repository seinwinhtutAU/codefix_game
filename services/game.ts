export async function getPlayerProgress() {
  const userJson = localStorage.getItem("user");
  if (!userJson) return null;

  const user = JSON.parse(userJson);
  const response = await fetch(`/api/game-progress?userId=${user.id}`);
  if (!response.ok) return null;

  return await response.json();
}
