"use client";

import { useState } from "react";
import { User } from "@/services";
import {
  Users,
  Search,
  Mail,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Copy,
} from "lucide-react";
import Link from "next/link";

interface UsersListProps {
  users: User[];
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
}

const UserAvatar = ({ username }: { username?: string }) => {
  const displayLetter = username ? username.charAt(0).toUpperCase() : "?";
  return (
    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-lg flex-shrink-0 border-2 border-white shadow-sm">
      {displayLetter}
    </div>
  );
};

export default function UsersList({
  users,
  loading,
  error,
  onRetry,
}: UsersListProps) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"username" | "email">("username");

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Simple alert for confirmation
    alert("Copied ID to clipboard!");
  };

  const filteredAndSortedUsers = users
    .filter(
      (user) =>
        (user.username?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (user.email?.toLowerCase() || "").includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      if (sortBy === "username") {
        return (a.username || "").localeCompare(b.username || "");
      } else {
        return (a.email || "").localeCompare(b.email || "");
      }
    });

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-600 animate-pulse">
          Fetching user directory...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-4">
        <div className="max-w-md text-center bg-white p-8 rounded-2xl shadow-sm border border-red-100">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Connection Error
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Users Directory
          </h1>
          <p className="text-gray-500">Viewing {users.length} total members</p>
        </div>
        <div className="hidden md:block p-3 bg-white rounded-xl shadow-sm border border-gray-100">
          <Users className="w-8 h-8 text-blue-600" />
        </div>
      </div>

      {/* Controls Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
            />
          </div>
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {(["username", "email"] as const).map((key) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`flex-1 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  sortBy === key
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Sort by {key === "username" ? "Name" : "Email"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  User Profile
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Contact Info
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                  System ID
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAndSortedUsers.length > 0 ? (
                filteredAndSortedUsers.map((user) => (
                  <tr
                    key={user._id}
                    className="hover:bg-blue-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar username={user.username} />
                        <p className="font-semibold text-gray-900">
                          {user.username || "Unknown User"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => copyToClipboard(user._id)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 text-gray-500 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 rounded-lg text-xs font-mono transition-all group-hover:border-blue-200"
                        title="Copy Full ID"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {user._id.slice(-8)}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <Search className="w-10 h-10 text-gray-200 mb-2" />
                      <p className="text-gray-500 font-medium">
                        No users found
                      </p>
                      <button
                        onClick={() => setSearch("")}
                        className="text-blue-600 text-sm hover:underline mt-1"
                      >
                        Clear search filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
