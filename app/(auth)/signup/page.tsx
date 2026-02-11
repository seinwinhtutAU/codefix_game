"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Code, Eye, EyeOff, UserPlus, LogIn, User } from "lucide-react";

export default function SignUpPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      router.replace("/");
    }
  }, [router]);

  if (typeof window !== "undefined" && localStorage.getItem("user")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1e1e1e]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#007acc] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#cccccc]">Redirecting...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push("/game");
      } else {
        setError(data.message || "Signup failed. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1e1e1e] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-4 h-4 rounded-full bg-[#007acc]" />
            <div className="w-4 h-4 rounded-full bg-[#c586c0]" />
            <div className="w-4 h-4 rounded-full bg-[#4ec9b0]" />
          </div>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Code className="h-8 w-8 text-[#569cd6]" />
            <h1 className="text-3xl font-bold text-[#cccccc]">DebugFix</h1>
          </div>
          <p className="text-[#858585] text-lg">Create your account</p>
        </div>

        {/* Signup Card */}
        <div className="bg-[#252526] rounded-lg border border-[#3e3e42] p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-[#cccccc] mb-2">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[#2d2d30] border border-[#3e3e42] rounded-lg text-[#cccccc] focus:outline-none focus:ring-2 focus:ring-[#007acc] focus:border-transparent placeholder-[#858585] transition"
                  placeholder="Choose a username"
                />
                <div className="absolute right-3 top-3.5">
                  <User className="h-5 w-5 text-[#858585]" />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#cccccc] mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[#2d2d30] border border-[#3e3e42] rounded-lg text-[#cccccc] focus:outline-none focus:ring-2 focus:ring-[#007acc] focus:border-transparent placeholder-[#858585] transition"
                  placeholder="you@example.com"
                />
                <div className="absolute right-3 top-3.5">
                  <div className="w-2 h-2 rounded-full bg-[#c586c0]" />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[#cccccc] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[#2d2d30] border border-[#3e3e42] rounded-lg text-[#cccccc] focus:outline-none focus:ring-2 focus:ring-[#007acc] focus:border-transparent placeholder-[#858585] transition pr-12"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-[#858585] hover:text-[#cccccc] transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-[#858585] mt-2 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#4ec9b0]" />
                Use at least 6 characters
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-900/20 border border-red-800/50 text-red-400 text-sm rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  {error}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#007acc] hover:bg-[#0a8de0] text-white py-3.5 px-4 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#007acc] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5" />
                  Create Account
                </>
              )}
            </button>

            {/* Login Link */}
            <div className="pt-6 border-t border-[#3e3e42]">
              <p className="text-center text-[#858585]">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="text-[#569cd6] hover:text-[#4ec9b0] font-medium inline-flex items-center gap-1 transition-colors"
                >
                  <LogIn className="h-4 w-4" />
                  Sign in
                </button>
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-[#858585]">
            By creating an account, you agree to our{" "}
            <button className="text-[#569cd6] hover:underline">Terms</button>{" "}
            and{" "}
            <button className="text-[#569cd6] hover:underline">Privacy</button>
          </p>
        </div>
      </div>
    </div>
  );
}
