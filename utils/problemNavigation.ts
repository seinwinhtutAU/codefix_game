import { Problem } from "@/lib/types";

/**
 * Get the next problem in the list
 */
export function getNextProblem(
  currentProblemId: string,
  problems: Problem[]
): Problem | null {
  const currentIndex = problems.findIndex((p) => p._id === currentProblemId);
  if (currentIndex >= 0 && currentIndex < problems.length - 1) {
    return problems[currentIndex + 1];
  }
  return null;
}

/**
 * Get the previous problem in the list
 */
export function getPreviousProblem(
  currentProblemId: string,
  problems: Problem[]
): Problem | null {
  const currentIndex = problems.findIndex((p) => p._id === currentProblemId);
  if (currentIndex > 0) {
    return problems[currentIndex - 1];
  }
  return null;
}

/**
 * Check if a problem has a next problem
 */
export function hasNextProblem(
  currentProblemId: string,
  problems: Problem[]
): boolean {
  const currentIndex = problems.findIndex((p) => p._id === currentProblemId);
  return currentIndex >= 0 && currentIndex < problems.length - 1;
}

/**
 * Check if a problem has a previous problem
 */
export function hasPreviousProblem(
  currentProblemId: string,
  problems: Problem[]
): boolean {
  const currentIndex = problems.findIndex((p) => p._id === currentProblemId);
  return currentIndex > 0;
}

/**
 * Get the current problem index in the list
 */
export function getCurrentProblemIndex(
  currentProblemId: string,
  problems: Problem[]
): number {
  return problems.findIndex((p) => p._id === currentProblemId);
}

/**
 * Format progress text (e.g., "Problem 3 of 10")
 */
export function formatProgressText(
  currentProblemId: string,
  problems: Problem[]
): string {
  const currentIndex = getCurrentProblemIndex(currentProblemId, problems);
  if (currentIndex >= 0) {
    return `Problem ${currentIndex + 1} of ${problems.length}`;
  }
  return "";
}
