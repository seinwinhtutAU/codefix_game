// components/problems/ProblemListPanel.tsx
"use client";

import { Problem } from "@/lib/types";
import {
  X,
  CheckCircle,
  ChevronRight,
  Signal,
  SignalMedium,
  SignalLow,
  AlertCircle,
  FileCode,
  ChevronLeft,
  Clock,
} from "lucide-react";

interface ProblemListPanelProps {
  showList: boolean;
  problems: Problem[];
  isCompleted: (problemId: string) => boolean;
  onClose?: () => void;
  onProblemSelect?: (problem: Problem) => void;
  currentProblemId?: string;
  currentProblemCompleted?: boolean; // Add this prop
}

export default function ProblemListPanel({
  showList,
  problems,
  isCompleted,
  onClose,
  onProblemSelect,
  currentProblemId,
  currentProblemCompleted, // Add this
}: ProblemListPanelProps) {
  const getDifficultyIcon = (difficulty: string) => {
    const lower = difficulty.toLowerCase();
    if (lower.includes("easy"))
      return <SignalLow className="w-4 h-4 text-green-500" />;
    if (lower.includes("medium"))
      return <SignalMedium className="w-4 h-4 text-yellow-500" />;
    if (lower.includes("hard"))
      return <Signal className="w-4 h-4 text-red-500" />;
    return <AlertCircle className="w-4 h-4 text-blue-500" />;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "bg-green-900/30 text-green-400 border border-green-800";
      case "medium":
        return "bg-yellow-900/30 text-yellow-400 border border-yellow-800";
      case "hard":
        return "bg-red-900/30 text-red-400 border border-red-800";
      default:
        return "bg-blue-900/30 text-blue-400 border border-blue-800";
    }
  };

  const handleProblemClick = (problem: Problem) => {
    onProblemSelect?.(problem);
    onClose?.();
  };

  // Find current problem index
  const currentIndex = currentProblemId
    ? problems.findIndex((p) => p._id === currentProblemId)
    : -1;

  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < problems.length - 1;

  const handlePrevious = () => {
    if (hasPrevious && onProblemSelect) {
      onProblemSelect(problems[currentIndex - 1]);
      onClose?.();
    }
  };

  const handleNext = () => {
    if (hasNext && onProblemSelect) {
      onProblemSelect(problems[currentIndex + 1]);
      onClose?.();
    }
  };

  if (!showList) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[85vh]">
        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-700 bg-gray-900">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-700 border border-gray-600">
                <FileCode className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Problem List</h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  {problems.length} problem{problems.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Navigation Buttons */}
              <div className="flex items-center gap-2 mr-4">
                <button
                  onClick={handlePrevious}
                  disabled={!hasPrevious}
                  className={`p-2 rounded-lg ${
                    hasPrevious
                      ? "text-blue-400 hover:text-blue-300 hover:bg-gray-700"
                      : "text-gray-600 cursor-not-allowed"
                  } transition-colors`}
                  title="Previous Problem"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  onClick={handleNext}
                  disabled={!hasNext}
                  className={`p-2 rounded-lg ${
                    hasNext
                      ? "text-blue-400 hover:text-blue-300 hover:bg-gray-700"
                      : "text-gray-600 cursor-not-allowed"
                  } transition-colors`}
                  title="Next Problem"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Problems List */}
          <div className="overflow-y-auto max-h-[calc(85vh-140px)]">
            {problems.length === 0 ? (
              <div className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No problems available</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {problems.map((problem, index) => {
                  const isCurrent = problem._id === currentProblemId;

                  // IMPORTANT: Override completion status for current problem
                  const completed =
                    isCurrent && currentProblemCompleted !== undefined
                      ? currentProblemCompleted
                      : isCompleted(problem._id);

                  return (
                    <div
                      key={problem._id}
                      onClick={() => handleProblemClick(problem)}
                      className={`p-4 hover:bg-gray-700/50 cursor-pointer transition-colors ${
                        isCurrent
                          ? "bg-gray-700/70 border-l-4 border-l-blue-500"
                          : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-400 font-mono">
                                {index + 1}.
                              </span>
                              <h3 className="font-semibold text-white">
                                {problem.title}
                                {isCurrent && (
                                  <span className="ml-2 text-xs text-blue-400">
                                    (Current)
                                  </span>
                                )}
                              </h3>
                            </div>

                            {/* Completion Tag */}
                            {completed ? (
                              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-900/30 text-green-400 text-xs font-medium border border-green-800">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Completed</span>
                              </div>
                            ) : (
                              <div className="px-3 py-1 rounded-full bg-gray-700 text-gray-400 text-xs font-medium border border-gray-600">
                                <span>Pending</span>
                              </div>
                            )}
                          </div>

                          {/* Difficulty & Info */}
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg ${getDifficultyColor(
                                problem.difficulty
                              )}`}
                            >
                              {getDifficultyIcon(problem.difficulty)}
                              <span className="text-sm font-medium">
                                {problem.difficulty}
                              </span>
                            </div>
                          </div>
                        </div>

                        <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700 bg-gray-900">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <div>
                {currentIndex >= 0 && (
                  <span className="text-gray-300 font-medium">
                    Problem {currentIndex + 1} of {problems.length}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500">
                Click any problem to navigate
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
