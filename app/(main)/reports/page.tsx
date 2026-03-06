"use client";

import { useState, useEffect, useMemo } from "react";
import { User } from "@/services";
import {
  Problem,
  ProblemSolveRecord,
  DifficultyLevel,
  HintUsage,
  IGameProgress,
} from "@/lib/types";
import {
  Users,
  BookOpen,
  Clock,
  Award,
  Lightbulb,
  Loader2,
  Download,
  LayoutDashboard,
  Activity,
} from "lucide-react";
import * as XLSX from "xlsx";
import ProblemsList from "./ProblemList";
import UsersList from "./UserList";
import GameProgressList from "./GameProgressList";
import { useRouter } from "next/navigation";

// ============================================================================
// Types
// ============================================================================

type ViewState = "dashboard" | "problems" | "users" | "progress";

interface SolveRecordFilters {
  problemId: string;
  userId: string;
  level: DifficultyLevel | "all";
}

const DIFFICULTIES: DifficultyLevel[] = ["easy", "medium", "hard", "boss"];

// ============================================================================
// Sub-Components
// ============================================================================

const LevelBadge = ({ level }: { level: string }) => {
  const colors: Record<string, string> = {
    easy: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    hard: "bg-orange-100 text-orange-800",
    boss: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[level] || "bg-gray-100 text-gray-800"}`}
    >
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
};

const HintUsageDisplay = ({ hintUsages }: { hintUsages?: HintUsage[] }) => {
  if (!Array.isArray(hintUsages) || hintUsages.length === 0) {
    return <span className="text-gray-400 text-sm italic">None</span>;
  }

  const counts = hintUsages.reduce(
    (acc, usage) => {
      const level = usage.hintLevel?.toLowerCase() || "unknown";
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="flex items-center gap-2">
      <Lightbulb className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
      <span className="text-sm text-gray-700">
        {Object.entries(counts)
          .map(([lvl, count]) => `${count} ${lvl}`)
          .join(", ")}
      </span>
    </div>
  );
};

const UserAvatar = ({ username }: { username: string }) => (
  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium flex-shrink-0 border border-white">
    {username.charAt(0).toUpperCase()}
  </div>
);

// ============================================================================
// Main Dashboard Component
// ============================================================================

export default function SolveRecordsDashboard() {
  const [currentView, setCurrentView] = useState<ViewState>("dashboard");
  const [records, setRecords] = useState<ProblemSolveRecord[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [allProgress, setAllProgress] = useState<IGameProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [filters, setFilters] = useState<SolveRecordFilters>({
    problemId: "all",
    userId: "all",
    level: "all",
  });

  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch("/api/me");
        if (!res.ok) {
          router.replace("/");
          return;
        }
        const data = await res.json();
        const username = data?.user?.username?.toLowerCase() || "";
        if (!username.startsWith("admin")) {
          router.replace("/");
        }
      } catch {
        router.replace("/");
      }
    };

    checkAdmin();
  }, [router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/reports/overview");
      const payload = await res.json();

      if (res.ok && payload?.success) {
        setRecords(payload.data.records || []);
        setUsers(payload.data.users || []);
        setProblems(payload.data.problems || []);
        setAllProgress(payload.data.progress || []);
        setError(null);
      } else {
        setError("Failed to fetch data.");
      }
    } catch (e) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const userMap = useMemo(
    () => new Map<string, User>(users.map((u) => [u._id, u])),
    [users],
  );
  const problemMap = useMemo(
    () => new Map<string, Problem>(problems.map((p) => [p._id, p])),
    [problems],
  );

  const uniqueProblems = useMemo(
    () => Array.from(problemMap.values()),
    [problemMap],
  );
  const uniqueUsers = useMemo(() => Array.from(userMap.values()), [userMap]);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const problem = problemMap.get(record.problemId);
      if (!problem) return false;
      const matchesProblem =
        filters.problemId === "all" || record.problemId === filters.problemId;
      const matchesUser =
        filters.userId === "all" || record.userId === filters.userId;
      const matchesLevel =
        filters.level === "all" || problem.difficulty === filters.level;
      return matchesProblem && matchesUser && matchesLevel;
    });
  }, [records, filters, problemMap]);

  const handleExport = () => {
    try {
      setExporting(true);
      const excelData = filteredRecords.map((record) => {
        const problem = problemMap.get(record.problemId);
        const user = userMap.get(record.userId);
        return {
          Problem: problem?.title || "Unknown",
          User: user?.username || "Unknown",
          Difficulty: problem?.difficulty || "-",
          Seconds: record.timeSpent,
          Points: record.pointsEarned,
          Completion_Time: new Date(record.completedAt).toLocaleString("en-GB"),
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Records");
      XLSX.writeFile(
        workbook,
        `SolveRecords_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
    } catch (err) {
      console.error("Export Error:", err);
    } finally {
      setExporting(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400 font-medium">Loading Learning Data...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* View Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-200 self-start overflow-x-auto">
            <button
              onClick={() => setCurrentView("dashboard")}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${currentView === "dashboard" ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-gray-500 hover:text-gray-900"}`}
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </button>
            <button
              onClick={() => setCurrentView("progress")}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${currentView === "progress" ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-gray-500 hover:text-gray-900"}`}
            >
              <Activity className="w-4 h-4" /> Live Progress
            </button>
            <button
              onClick={() => setCurrentView("problems")}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${currentView === "problems" ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-gray-500 hover:text-gray-900"}`}
            >
              <BookOpen className="w-4 h-4" /> Problems
            </button>
            <button
              onClick={() => setCurrentView("users")}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${currentView === "users" ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-gray-500 hover:text-gray-900"}`}
            >
              <Users className="w-4 h-4" /> Users
            </button>
          </div>
        </div>

        {/* View Rendering */}
        {currentView === "problems" && (
          <ProblemsList problems={problems} loading={false} error={null} />
        )}
        {currentView === "users" && (
          <UsersList users={users} loading={false} error={null} />
        )}
        {currentView === "progress" && (
          <GameProgressList progressData={allProgress} userMap={userMap} />
        )}

        {currentView === "dashboard" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Filter Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Problem
                  </label>
                  <select
                    value={filters.problemId}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, problemId: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                  >
                    <option value="all">All Problems</option>
                    {uniqueProblems.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Student
                  </label>
                  <select
                    value={filters.userId}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, userId: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                  >
                    <option value="all">All Users</option>
                    {uniqueUsers.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.username}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Level
                  </label>
                  <select
                    value={filters.level}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        level: e.target.value as DifficultyLevel | "all",
                      }))
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none capitalize"
                  >
                    <option value="all">Any Difficulty</option>
                    {DIFFICULTIES.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Found{" "}
                  <span className="font-bold text-gray-900">
                    {filteredRecords.length}
                  </span>{" "}
                  matching entries
                </p>
                <button
                  onClick={handleExport}
                  disabled={filteredRecords.length === 0 || exporting}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-all font-semibold text-sm"
                >
                  <Download className="w-4 h-4" />{" "}
                  {exporting ? "Generating..." : "Export to Excel"}
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">
                        Problem
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">
                        User
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">
                        Performance
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">
                        Hints Usage
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">
                        Completed At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredRecords.length > 0 ? (
                      filteredRecords.map((record) => {
                        const problem = problemMap.get(record.problemId);
                        const user = userMap.get(record.userId);
                        const dateObj = new Date(record.completedAt);
                        return (
                          <tr
                            key={`${record.userId}-${record.problemId}-${record.completedAt}`}
                            className="hover:bg-blue-50/30 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <p className="font-bold text-gray-900">
                                {problem?.title || "???"}
                              </p>
                              <LevelBadge level={problem?.difficulty || ""} />
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <UserAvatar username={user?.username || "U"} />
                                <span className="text-sm font-medium text-gray-700">
                                  {user?.username || "Unknown"}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1 text-sm font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded-lg">
                                  <Clock className="w-3 h-3" />{" "}
                                  {record.timeSpent}s
                                </span>
                                <span className="flex items-center gap-1 text-sm font-bold text-green-700">
                                  <Award className="w-4 h-4" />{" "}
                                  {record.pointsEarned}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <HintUsageDisplay
                                hintUsages={record.hintUsages}
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 font-medium">
                                {dateObj.toLocaleDateString("en-GB")}
                              </div>
                              <div className="text-xs text-gray-500">
                                {dateObj.toLocaleTimeString("en-GB", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                })}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-20 text-center text-gray-400"
                        >
                          No records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
