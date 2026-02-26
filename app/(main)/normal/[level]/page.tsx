"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Circle, ChevronRight, Trophy } from "lucide-react";
import { User } from "@/lib/types";
import { Problem } from "@/lib/types";

interface ProblemWithStatus extends Problem {
  isCompleted: boolean;
  pointsEarned: number;
}

export default function ProblemsListPage() {
  const { level } = useParams();
  const router = useRouter();
  const [problems, setProblems] = useState<ProblemWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProblems() {
      try {
        const res = await fetch(`/api/problems/level/${level}`);
        const data = await res.json();

        const user: User = JSON.parse(localStorage.getItem("user") || "{}");
        const userId = user.id;
        const problemsWithStatus: ProblemWithStatus[] = [];

        for (const problem of data.problems || []) {
          let isCompleted = false;
          let pointsEarned = 0;

          if (userId && userId !== "null") {
            try {
              const solveRes = await fetch(
                `/api/solve-record?userId=${userId}&problemId=${problem._id}`,
              );
              const solveData = await solveRes.json();
              isCompleted = solveData.data != null;
              pointsEarned = solveData.data ? solveData.data.pointsEarned : 0;
            } catch (err) {
              console.error(`Error checking completion for problem:`, err);
            }
          }

          problemsWithStatus.push({
            ...problem,
            isCompleted,
            pointsEarned,
          });
        }

        setProblems(problemsWithStatus);
      } catch (err) {
        console.error("Failed to fetch problems:", err);
        setProblems([]);
      }
      setLoading(false);
    }

    fetchProblems();
  }, [level]);

  // Handle problem click - Navigate directly to problem page for all levels
  const handleProblemClick = (
    problem: ProblemWithStatus,
    e: React.MouseEvent,
  ) => {
    e.preventDefault(); // Prevent any default behavior
    // Navigate directly to problem page for all levels
    router.push(`/problem/${problem._id}`);
  };

  // Get completion stats
  const completedCount = problems.filter((p) => p.isCompleted).length;
  const totalCount = problems.length;
  const completionPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Calculate total points earned
  const totalPointsEarned = problems.reduce(
    (sum, problem) => sum + (problem.pointsEarned || 0),
    0,
  );

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "bg-green-900/20 text-green-400 border-green-800/30";
      case "medium":
        return "bg-yellow-900/20 text-yellow-400 border-yellow-800/30";
      case "hard":
        return "bg-red-900/20 text-red-400 border-red-800/30";
      case "boss":
        return "bg-purple-900/20 text-purple-400 border-purple-800/30";
      default:
        return "bg-gray-800 text-gray-400 border-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-3xl font-bold text-gray-200 capitalize">
              {level} Level
            </h1>
          </div>

          {/* Progress Stats */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg text-gray-300">Your Progress</div>
              <div className="flex items-base gap-1 text-sm font-medium text-yellow-400">
                <Trophy size={16} />
                <span>Total Points: {totalPointsEarned}</span>
              </div>
            </div>

            <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-300">
                {completedCount} solved, {totalCount - completedCount} left (
                {completedCount} / {totalCount})
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm font-medium text-green-400">
                  {completionPercent}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-gray-800 border border-gray-700 rounded-lg p-5 animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-700 rounded-full" />
                    <div className="space-y-2">
                      <div className="h-5 bg-gray-700 rounded w-48" />
                      <div className="h-4 bg-gray-700 rounded w-32" />
                    </div>
                  </div>
                  <div className="h-8 bg-gray-700 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && problems.length === 0 && (
          <div className="text-center py-16 bg-gray-800 rounded-xl border border-gray-700">
            <div className="text-gray-600 mb-4">
              <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center bg-gray-700 rounded-full">
                <div className="w-2 h-2 rounded-full bg-gray-600" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-200 mb-2">
              No problems here yet
            </h3>
            <p className="text-gray-300 max-w-md mx-auto mb-6">
              {`This level doesn't have any problems yet. Check back soon!`}
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Home
            </Link>
          </div>
        )}

        {/* Problems List */}
        {!loading && problems.length > 0 && (
          <div className="space-y-3">
            {problems.map((problem, index) => (
              <div
                key={problem._id}
                onClick={(e) => handleProblemClick(problem, e)}
                className="block group cursor-pointer"
              >
                <div
                  className={`
                  bg-gray-800 border rounded-lg p-5 transition-all duration-200
                  ${
                    problem.isCompleted
                      ? "border-green-800/30"
                      : "border-gray-700"
                  }
                  hover:border-blue-600 hover:bg-gray-700/50
                `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Problem Number */}
                      <div
                        className={`
                        w-10 h-10 rounded-full flex items-center justify-center
                        text-sm font-bold
                        ${
                          problem.isCompleted
                            ? "bg-green-900/20 text-green-400"
                            : "bg-gray-700 text-gray-400"
                        }
                      `}
                      >
                        {index + 1}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-medium text-gray-200 group-hover:text-blue-400">
                            {problem.title}
                          </h3>
                          <span
                            className={`
                            px-3 py-1 rounded-full text-xs font-medium border
                            ${getDifficultyColor(problem.difficulty)}
                          `}
                          >
                            {problem.difficulty}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {problem.isCompleted ? (
                              <>
                                <CheckCircle
                                  size={14}
                                  className="text-green-400"
                                />
                                <span className="text-sm text-green-400">
                                  Solved
                                </span>
                              </>
                            ) : (
                              <>
                                <Circle size={14} className="text-gray-400" />
                                <span className="text-sm text-gray-400">
                                  UnSolved
                                </span>
                              </>
                            )}
                          </div>
                          {/* Points Display for each problem */}
                          <div className="flex items-center gap-1">
                            <div className="flex items-center gap-1 px-2 py-1 bg-yellow-900/20 text-yellow-400 border border-yellow-800/30 rounded-md">
                              <Trophy size={12} />
                              <span className="text-xs font-medium">
                                {problem.isCompleted
                                  ? `${problem.pointsEarned || 0} points`
                                  : "0 points"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div
                        className={`
                        px-3 py-1 rounded-full text-sm font-medium border
                        ${
                          problem.isCompleted
                            ? "bg-green-900/20 text-green-400 border-green-800/30"
                            : "bg-gray-700 text-gray-400 border-gray-600"
                        }
                      `}
                      >
                        {problem.isCompleted ? "Done" : "Try"}
                      </div>
                      <ChevronRight
                        size={18}
                        className="text-gray-400 group-hover:text-blue-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        {!loading && problems.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-200">
                  {totalCount}
                </div>
                <div className="text-sm text-gray-300">Total Problems</div>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">
                  {completedCount}
                </div>
                <div className="text-sm text-gray-300">Completed</div>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {completionPercent}%
                </div>
                <div className="text-sm text-gray-300">Progress</div>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {totalPointsEarned}
                </div>
                <div className="text-sm text-gray-300">Total Points</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
