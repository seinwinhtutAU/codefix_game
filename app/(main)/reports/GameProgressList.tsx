"use client";

import React, { useState } from "react";
import {
  MapPin,
  Terminal,
  Bug,
  Lightbulb,
  Flag,
  Activity,
  ChevronDown,
  ChevronUp,
  Hash,
  Gamepad2,
} from "lucide-react";
import { IGameProgress } from "@/lib/types";
import { User } from "@/services";

interface GameProgressListProps {
  progressData: IGameProgress[];
  userMap: Map<string, User>;
}

export default function GameProgressList({
  progressData,
  userMap,
}: GameProgressListProps) {
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>(
    {},
  );

  const toggleExpand = (userId: string) => {
    setExpandedUsers((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  if (!progressData || progressData.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-gray-200 p-20 text-center">
        <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-900">No Active Sessions</h3>
        <p className="text-gray-500">No live game progress found.</p>
      </div>
    );
  }

  const CHALLENGE_SCENES = [
    "MediumLevelScene",
    "HardLevelScene",
    "BossLevelScene",
  ];

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in duration-500">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Active Task
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Hints & Bugs
              </th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Flags Progress
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {progressData.map((progress) => {
              const user = userMap.get(progress.userId);
              const task = progress.gameState?.currentTask;
              const rawScene = progress.gameState?.currentScene || "";

              const currentScene = rawScene.trim();
              const isBossLevel =
                currentScene.toLowerCase() === "bosslevelscene";
              const isChallenge = CHALLENGE_SCENES.some(
                (s) => s.toLowerCase() === currentScene.toLowerCase(),
              );

              const problemNumber = (task?.currentActiveIndex ?? 0) + 1;
              const activeFlags = Object.entries(
                progress.gameState?.eventFlags || {},
              ).filter(([_, isActive]) => isActive);

              const isExpanded = expandedUsers[progress.userId];
              const lastFlag =
                activeFlags.length > 0
                  ? activeFlags[activeFlags.length - 1][0]
                  : null;

              return (
                <tr
                  key={progress.userId}
                  className="hover:bg-blue-50/20 transition-colors align-top"
                >
                  {/* Student */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold border border-white">
                        {user?.username?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 leading-none">
                          {user?.username || "Unknown"}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono mt-1">
                          {progress.userId.slice(-6)}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Location */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-700 font-medium text-xs">
                      <MapPin className="w-3.5 h-3.5 text-red-400" />{" "}
                      {currentScene}
                    </div>
                  </td>

                  {/* Active Task */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      {isChallenge ? (
                        <>
                          <div className="flex items-center gap-0.5 w-fit text-[10px] font-mono font-bold bg-blue-600 text-white px-2 py-0.5 rounded shadow-sm">
                            <Hash className="w-2.5 h-2.5" /> Problem{" "}
                            {problemNumber}
                          </div>
                          <p className="text-xs text-blue-700 flex items-center gap-1 font-bold">
                            <Terminal className="w-3 h-3" /> In Coding
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-gray-500 flex items-center gap-1 font-bold italic py-1">
                          <Gamepad2 className="w-3.5 h-3.5 text-gray-400" /> In
                          Game
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Hints & Bugs Breakdown */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      {/* Hints Section */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-gray-400 uppercase">
                          Hints Used:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {task?.hintUsages && task.hintUsages.length > 0 ? (
                            task.hintUsages.map((hint, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-yellow-50 border border-yellow-200 shadow-xs"
                              >
                                <Lightbulb className="w-3 h-3 text-yellow-600 fill-yellow-200" />
                                <span className="text-[10px] font-bold text-yellow-700 uppercase">
                                  {hint.hintLevel || `L${i + 1}`}
                                </span>
                              </div>
                            ))
                          ) : (
                            <span className="text-[10px] text-gray-300 italic">
                              None
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bugs Section */}
                      {isBossLevel && (
                        <div className="flex flex-col gap-1 mt-1 border-t border-gray-50 pt-1">
                          <span className="text-[9px] font-bold text-red-400 uppercase">
                            Bugs Chosen in Boss Level:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {progress.bugCounts &&
                            progress.bugCounts.length > 0 ? (
                              progress.bugCounts.map((bug, idx) => (
                                <div
                                  key={`${bug.problemId}-${idx}`}
                                  className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-red-50 border border-red-100 shadow-sm"
                                >
                                  <Bug className="w-3 h-3 text-red-600" />
                                  <span className="text-[10px] font-bold text-red-700">
                                    Problem{idx + 1}: {bug.bugCount} bugs
                                  </span>
                                  <span className="text-[8px] font-mono text-red-400 uppercase">
                                    ID:{bug.problemId.slice(-4)}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <span className="text-[10px] text-gray-300 italic">
                                No bugs yet
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Flags */}
                  <td className="px-6 py-4">
                    {activeFlags.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {!isExpanded && (
                          <button
                            onClick={() => toggleExpand(progress.userId)}
                            className="flex items-center gap-2 text-left group hover:opacity-80 transition-opacity"
                          >
                            <span className="bg-blue-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm">
                              {activeFlags.length}
                            </span>
                            <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
                              <Flag className="w-2.5 h-2.5 text-blue-500" />
                              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tight">
                                Last: {lastFlag?.replace(/_/g, " ")}
                              </span>
                              <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-blue-500 ml-1" />
                            </div>
                          </button>
                        )}

                        {isExpanded && (
                          <div className="space-y-2">
                            <button
                              onClick={() => toggleExpand(progress.userId)}
                              className="flex items-center gap-1 text-[10px] font-bold text-blue-600 uppercase hover:underline"
                            >
                              <ChevronUp className="w-3 h-3" /> Hide All
                            </button>
                            <div className="flex flex-wrap gap-1.5 max-w-[250px] animate-in slide-in-from-top-1 duration-200">
                              {activeFlags.map(([name]) => (
                                <span
                                  key={name}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 text-[9px] font-black uppercase tracking-tight"
                                >
                                  <Flag className="w-2.5 h-2.5" />{" "}
                                  {name.replace(/_/g, " ")}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-300 italic">
                        No flags unlocked
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
