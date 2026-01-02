// app/users/page.tsx
"use client";

import { useState, useEffect } from "react";
import { fetchAllUsers, User } from "@/services";
import {
  Users,
  Search,
  User as UserIcon,
  Mail,
  ArrowLeft,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";
import Link from "next/link";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"username" | "email">("username");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log("fetchAllUsers: ");
      const response = await fetchAllUsers();
      console.log("fetchAllUsers: ", response.success);
      if (response.success) {
        setUsers(response.data);
        setError(null);
      } else {
        setError("Failed to fetch users");
      }
    } catch (e) {
      console.error("Error loading users:", e);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedUsers = users
    .filter(
      (user) =>
        user.username.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "username") {
        return a.username.localeCompare(b.username);
      } else {
        return a.email.localeCompare(b.email);
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Error Loading Users
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadUsers}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const UserAvatar = ({ username }: { username: string }) => (
    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-lg flex-shrink-0 border-2 border-white shadow-sm">
      {username.charAt(0).toUpperCase()}
    </div>
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link
                href="/reports"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Users Directory
            </h1>
            <p className="text-gray-600 mt-2">
              Manage all {users.length} registered users
            </p>
          </div>
          <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-sm">
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Search Users
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by username or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Sort By
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSortBy("username")}
                  className={`flex-1 px-4 py-2.5 border rounded-lg transition-colors ${
                    sortBy === "username"
                      ? "bg-blue-50 border-blue-200 text-blue-700 font-medium"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Username (A-Z)
                </button>
                <button
                  onClick={() => setSortBy("email")}
                  className={`flex-1 px-4 py-2.5 border rounded-lg transition-colors ${
                    sortBy === "email"
                      ? "bg-blue-50 border-blue-200 text-blue-700 font-medium"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Email (A-Z)
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-500 flex items-center gap-4">
            <span>
              Showing {filteredAndSortedUsers.length} of {users.length} users
            </span>
            {search && (
              <span className="text-blue-600 font-medium">
                {`Search results for: "${search}"`}
              </span>
            )}
          </div>
        </div>

        {/* Users Grid/List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                <Users className="w-5 h-5" />
                All Users ({filteredAndSortedUsers.length})
              </h3>
              <div className="text-sm text-gray-500">
                Click on any row to view details
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact Information
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAndSortedUsers.length > 0 ? (
                  filteredAndSortedUsers.map((user) => (
                    <tr
                      key={user._id}
                      onClick={() => setSelectedUser(user)}
                      className="hover:bg-blue-50 cursor-pointer transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <UserAvatar username={user.username} />
                          <div>
                            <p className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                              {user.username}
                            </p>
                            <p className="text-sm text-gray-500 mt-0.5">
                              ID: {user._id.substring(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span
                              className="text-gray-700 hover:text-blue-600 transition-colors break-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `mailto:${user.email}`;
                              }}
                            >
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className="font-mono text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded border border-gray-200 truncate max-w-[250px] hover:bg-gray-100 transition-colors cursor-copy"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(user._id);
                          }}
                          title="Click to copy ID"
                        >
                          {user._id}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `mailto:${user.email}`;
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            Email
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(user._id);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                          >
                            Copy ID
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="max-w-sm mx-auto text-gray-400">
                        <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-lg font-medium text-gray-500 mb-2">
                          No users found
                        </p>
                        <p className="text-sm">
                          Try adjusting your search terms
                        </p>
                        {search && (
                          <button
                            onClick={() => setSearch("")}
                            className="mt-3 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            Clear search
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Stats Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Total Users:</span> {users.length}
                {search && (
                  <span className="ml-4">
                    <span className="font-medium">Search Results:</span>{" "}
                    {filteredAndSortedUsers.length}
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Sorted By:</span>{" "}
                {sortBy === "username" ? "Username (A-Z)" : "Email (A-Z)"}
              </div>
            </div>
          </div>
        </div>

        {/* User Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl border border-blue-100 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {users.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  All registered users
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-green-50 rounded-xl border border-green-100 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Active Search
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {search ? "Yes" : "No"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {search ? `Searching: "${search}"` : "No active search"}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Search className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-purple-50 rounded-xl border border-purple-100 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Sort Order</p>
                <p className="text-3xl font-bold text-gray-900 mt-2 capitalize">
                  {sortBy}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {sortBy === "username" ? "By Username" : "By Email"}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* User Detail Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    User Details
                  </h3>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-3xl font-bold text-blue-600 mb-4 border-4 border-white shadow-lg">
                      {selectedUser.username.charAt(0).toUpperCase()}
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900">
                      {selectedUser.username}
                    </h4>
                    <p className="text-gray-500">User Profile</p>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-500 mb-2">
                        Email Address
                      </label>
                      <div className="flex items-center gap-2">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-900 font-medium">
                          {selectedUser.email}
                        </span>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-500 mb-2">
                        User ID
                      </label>
                      <div className="flex items-center justify-between">
                        <code className="text-sm text-gray-700 font-mono bg-gray-100 px-3 py-1.5 rounded">
                          {selectedUser._id}
                        </code>
                        <button
                          onClick={() => copyToClipboard(selectedUser._id)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <label className="block text-sm font-medium text-blue-700 mb-2">
                        Quick Actions
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            (window.location.href = `mailto:${selectedUser.email}`)
                          }
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                          Send Email
                        </button>
                        <button
                          onClick={() => copyToClipboard(selectedUser._id)}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          Copy ID
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
