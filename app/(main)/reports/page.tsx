"use client";

import { useState, useEffect, useMemo } from "react";
import {
  fetchAllSolveRecords,
  fetchAllUsers,
  fetchAllProblems,
  User,
} from "@/services";
import {
  Problem,
  ProblemSolveRecord,
  DifficultyLevel,
  HintUsage,
} from "@/lib/types";
import {
  Filter,
  Users,
  BookOpen,
  X,
  AlertCircle,
  Clock,
  Award,
  Lightbulb,
  Calendar,
  Loader2,
  User as UserIcon,
  Download,
} from "lucide-react";
import * as XLSX from "xlsx";
import Link from "next/link";
import { type } from "os";

// ============================================================================
// Types
// ============================================================================

interface SolveRecordFilters {
  problemId: string;
  userId: string;
  isSolved: "all" | "solved" | "unsolved";
  level: DifficultyLevel | "all";
}

// ============================================================================
// Sub-Components
// ============================================================================

const LoadingState = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
      <p className="text-gray-600">Loading solve records...</p>
    </div>
  </div>
);

const ErrorState = ({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) => (
  <div className="min-h-screen flex items-center justify-center p-4">
    <div className="max-w-md text-center">
      <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        Error Loading Data
      </h2>
      <p className="text-gray-600 mb-4">{error}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        Retry
      </button>
    </div>
  </div>
);

const DifficultyBadge = ({ difficulty }: { difficulty: string }) => {
  const colors: Record<string, string> = {
    easy: "bg-green-100 text-green-800 border-green-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    hard: "bg-orange-100 text-orange-800 border-orange-200",
    boss: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${colors[difficulty]}`}
    >
      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
    </span>
  );
};

const LevelBadge = ({ level }: { level: string }) => {
  const colors: Record<string, string> = {
    easy: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    hard: "bg-orange-100 text-orange-800",
    boss: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        colors[level] || "bg-gray-100 text-gray-800"
      }`}
    >
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
};

const HintUsageDisplay = ({ hintUsages }: { hintUsages?: HintUsage[] }) => {
  // 1. Safety check: If it's not an array or it's empty, show None
  if (!Array.isArray(hintUsages) || hintUsages.length === 0) {
    return <span className="text-gray-400">None</span>;
  }

  // 2. Count occurrences of each level
  const counts = hintUsages.reduce((acc, usage) => {
    const level = usage.hintLevel?.toLowerCase() || "unknown";
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 3. Create the string (e.g., "1 big, 2 small")
  const levelsString = Object.entries(counts)
    .map(([level, count]) => `${count} ${level}`)
    .join(", ");

  return (
    <div className="flex items-center gap-2">
      <Lightbulb className="w-4 h-4 text-yellow-500 flex-shrink-0" />
      <span className="text-sm text-gray-700 font-medium">{levelsString}</span>
    </div>
  );
};

const UserAvatar = ({ username }: { username: string }) => (
  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium flex-shrink-0">
    {username.charAt(0).toUpperCase()}
  </div>
);

// ============================================================================
// Excel Export Utility Functions
// ============================================================================

const formatHintUsageForExcel = (hintUsages?: HintUsage[]): string => {
  if (!hintUsages?.length) return "None";

  const counts = hintUsages.reduce((acc, usage) => {
    const level = usage.hintLevel.toLowerCase();
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(counts)
    .map(([level, count]) => `${count} ${level}`)
    .join(", ");
};

const exportToExcel = (
  records: ProblemSolveRecord[],
  problemMap: Map<string, Problem>,
  userMap: Map<string, User>,
  filters: SolveRecordFilters
) => {
  // Prepare data for Excel
  const excelData = records.map((record) => {
    const problem = problemMap.get(record.problemId);
    const user = userMap.get(record.userId);

    return {
      "Problem Title": problem?.title || "Unknown",
      "Problem ID": record.problemId,
      User: user?.username || "Unknown",
      "User ID": record.userId,
      Difficulty: problem?.difficulty || "-",
      Level: problem?.difficulty || "-",
      "Time Spent (seconds)": record.timeSpent,
      "Points Earned": record.pointsEarned,
      "Hints Used Details": formatHintUsageForExcel(record.hintUsages),
      "Completed At": new Date(record.completedAt).toLocaleString(),
      "Date (YYYY-MM-DD)": new Date(record.completedAt)
        .toISOString()
        .split("T")[0],
      "Time (HH:MM:SS)": new Date(record.completedAt)
        .toTimeString()
        .split(" ")[0],
    };
  });

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Solve Records");

  // Add summary sheet
  const summaryData = [
    ["SOLVE RECORDS EXPORT SUMMARY"],
    ["Export Date:", new Date().toLocaleString()],
    ["Total Records:", records.length],
    ["Filters Applied:"],
    ["- Problem ID:", filters.problemId === "all" ? "All" : filters.problemId],
    ["- User ID:", filters.userId === "all" ? "All" : filters.userId],
    ["- Level:", filters.level === "all" ? "All" : filters.level],
    ["- Status:", filters.isSolved === "all" ? "All" : filters.isSolved],
    [],
    ["DATA COLUMNS DESCRIPTION"],
    ["Problem Title: Name of the coding problem"],
    ["Problem ID: Unique identifier for the problem"],
    ["User: Username of the solver"],
    ["User ID: Unique identifier for the user"],
    ["Difficulty: Problem difficulty level"],
    ["Level: Problem level (easy, medium, hard, boss)"],
    ["Time Spent (seconds): Time taken to solve in seconds"],
    ["Points Earned: Points awarded for solving"],
    ["Hints Used Details: Breakdown of hint levels used"],
    ["Completed At: Full timestamp of completion"],
    ["Date (YYYY-MM-DD): Completion date"],
    ["Time (HH:MM:SS): Completion time"],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Export Info");

  // Set column widths
  const maxWidths = excelData.reduce((acc, row) => {
    Object.entries(row).forEach(([key, value]) => {
      const length = String(value).length;
      if (!acc[key] || length > acc[key]) {
        acc[key] = length;
      }
    });
    return acc;
  }, {} as Record<string, number>);

  worksheet["!cols"] = Object.keys(maxWidths).map((key) => ({
    wch: Math.min(Math.max(maxWidths[key] || 10, key.length), 50),
  }));

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const filename = `solve-records-export-${timestamp}.xlsx`;

  // Export file
  XLSX.writeFile(workbook, filename);
};

// ============================================================================
// Main Component
// ============================================================================

export default function SolveRecordsDashboard() {
  // State
  const [records, setRecords] = useState<ProblemSolveRecord[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const [filters, setFilters] = useState<SolveRecordFilters>({
    problemId: "all",
    userId: "all",
    isSolved: "all",
    level: "all",
  });

  const [showAllProblems, setShowAllProblems] = useState(false);
  const [showAllUsers, setShowAllUsers] = useState(false);

  // Data Fetching
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [recordsRes, usersRes, problemsRes] = await Promise.all([
          fetchAllSolveRecords(),
          fetchAllUsers(),
          fetchAllProblems(),
        ]);

        if (recordsRes.success && usersRes.success && problemsRes.success) {
          setRecords(recordsRes.data);
          setUsers(usersRes.data);
          setProblems(problemsRes.problems);
          setError(null);
        } else {
          setError("Failed to fetch data. Please try again.");
        }
      } catch (e) {
        console.error("Data loading error:", e);
        setError("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Memoized data and calculations
  const problemMap = useMemo(
    () => new Map(problems.map((p) => [p._id, p])),
    [problems]
  );

  const userMap = useMemo(() => new Map(users.map((u) => [u._id, u])), [users]);

  // FIXED: Get unique problems for dropdown (remove duplicates)
  const uniqueProblems = useMemo(() => {
    const seen = new Set<string>();
    return problems.filter((problem) => {
      if (seen.has(problem._id)) {
        return false;
      }
      seen.add(problem._id);
      return true;
    });
  }, [problems]);

  // FIXED: Get unique users for dropdown
  const uniqueUsers = useMemo(() => {
    const seen = new Set<string>();
    return users.filter((user) => {
      if (seen.has(user._id)) {
        return false;
      }
      seen.add(user._id);
      return true;
    });
  }, [users]);

  // FIXED: Correct filtering logic
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const problem = problemMap.get(record.problemId);
      const user = userMap.get(record.userId);

      // If no problem/user found, skip
      if (!problem || !user) return false;

      // Problem ID filter
      if (filters.problemId !== "all" && record.problemId !== filters.problemId)
        return false;

      // User ID filter
      if (filters.userId !== "all" && record.userId !== filters.userId)
        return false;

      // Level filter
      if (filters.level !== "all" && problem.difficulty !== filters.level)
        return false;

      // Solved/Unsolved filter
      if (filters.isSolved !== "all") {
        const isSolved = record.pointsEarned > 0; // Assuming points > 0 means solved
        if (filters.isSolved === "solved" && !isSolved) return false;
        if (filters.isSolved === "unsolved" && isSolved) return false;
      }

      return true;
    });
  }, [records, filters, problemMap, userMap]);

  // Handlers
  const handleFilterChange = (key: keyof SolveRecordFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      problemId: "all",
      userId: "all",
      isSolved: "all",
      level: "all",
    });
  };

  const handleExportToExcel = () => {
    if (filteredRecords.length === 0) {
      alert("No records to export. Please adjust your filters.");
      return;
    }

    try {
      setExporting(true);
      exportToExcel(filteredRecords, problemMap, userMap, filters);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export to Excel. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const difficultyLevels = ["easy", "medium", "hard", "boss"];

  // Render states
  if (loading) return <LoadingState />;
  if (error)
    return (
      <ErrorState error={error} onRetry={() => window.location.reload()} />
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Solve Records Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Analyzing {filteredRecords.length} of {records.length} total
              records
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Problems Button as Link */}
            <Link
              href="/reports/problems"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Problems ({problems.length})
            </Link>

            {/* Users Button as Link */}
            <Link
              href="/reports/users"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Users className="w-4 h-4" />
              Users ({users.length})
            </Link>
          </div>
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Filter className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Filter Records
                </h2>
                <p className="text-sm text-gray-500">
                  Refine your search with multiple filters
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                Clear filters
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Problem Filter */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Problem
              </label>
              <select
                value={filters.problemId}
                onChange={(e) =>
                  handleFilterChange("problemId", e.target.value)
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white"
              >
                <option value="all">
                  All Problems ({uniqueProblems.length})
                </option>
                {uniqueProblems.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.title}
                  </option>
                ))}
                {uniqueProblems.length === 0 && (
                  <option disabled>No problems available</option>
                )}
              </select>
            </div>

            {/* User Filter */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                User
              </label>
              <select
                value={filters.userId}
                onChange={(e) => handleFilterChange("userId", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white"
              >
                <option value="all">All Users ({uniqueUsers.length})</option>
                {uniqueUsers.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.username}
                  </option>
                ))}
                {uniqueUsers.length === 0 && (
                  <option disabled>No users available</option>
                )}
              </select>
            </div>

            {/* Level Filter */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Level
              </label>
              <select
                value={filters.level}
                onChange={(e) => handleFilterChange("level", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white"
              >
                <option value="all">All Levels</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="boss">Boss</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={filters.isSolved}
                onChange={(e) => handleFilterChange("isSolved", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white"
              >
                <option value="all">All Records</option>
                <option value="solved">Solved Only</option>
                <option value="unsolved">Unsolved Only</option>
              </select>
            </div>
          </div>

          {/* Export Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {filteredRecords.length} record(s) available for export
              </div>
              <button
                onClick={handleExportToExcel}
                disabled={exporting || filteredRecords.length === 0}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  exporting || filteredRecords.length === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-green-500 text-white hover:bg-green-600"
                }`}
              >
                {exporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download Excel
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Records Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Solve Records
                </h3>
                <p className="text-sm text-gray-500">
                  {filteredRecords.length} record
                  {filteredRecords.length !== 1 ? "s" : ""} found
                </p>
              </div>
              <div className="text-sm text-gray-500">
                Sorted by completion date
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Problem
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Award className="w-4 h-4 inline mr-1" />
                    Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hints Used
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Completed
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record) => {
                    const problem = problemMap.get(record.problemId);
                    const user = userMap.get(record.userId);

                    return (
                      <tr
                        key={`${record.userId}-${record.problemId}-${record.completedAt}`}
                        className="hover:bg-gray-50 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                            {problem?.title || "Unknown Problem"}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {record.problemId.slice(0, 8)}...
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <UserAvatar
                              username={user?.username || "Unknown"}
                            />
                            <div>
                              <span className="text-gray-700">
                                {user?.username || "Unknown User"}
                              </span>
                              <div className="text-sm text-gray-500">
                                ID: {record.userId.slice(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {problem?.difficulty && (
                            <LevelBadge level={problem.difficulty} />
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-700">
                            <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span>{record.timeSpent}s</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-700">
                            <Award className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                            <span className="font-medium">
                              {record.pointsEarned}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <HintUsageDisplay hintUsages={record.hintUsages} />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span>
                              {new Date(record.completedAt).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="max-w-sm mx-auto text-gray-400">
                        <Filter className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-lg font-medium text-gray-500 mb-2">
                          No matching records
                        </p>
                        <p className="text-sm">
                          Try adjusting your filters or search terms
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
