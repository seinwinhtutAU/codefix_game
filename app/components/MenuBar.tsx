"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Home, User, LogOut, Settings } from "lucide-react"; // Home is already imported

interface UserProfile {
  id: string;
  username: string;
  email: string;
}

export default function MenuBar() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => {
      setMounted(true);
      const stored = localStorage.getItem("user");
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        router.push("/login");
      }
    });
  }, [router]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".profile-dropdown-container")) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  if (!mounted || !user) return null;

  return (
    <header className="sticky top-0 z-50 w-full bg-gray-900 border-b border-gray-800">
      <div className="container mx-auto px-6">
        <div className="flex h-14 items-center justify-between">
          {/* Left Section: Logo & Navigation */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 text-white hover:text-blue-300 transition-colors"
            >
              <div className="w-6 h-6 rounded-lg bg-gray-800 flex items-center justify-center">
                <div className="w-3 h-3 rounded bg-blue-500"></div>
              </div>
              <span className="text-2xl font-extrabold">CodeFix</span>
            </button>

            {/* --- ADDED HOME ICON HERE --- */}
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              title="Home"
            >
              <Home size={20} />
              <span className="text-sm font-medium hidden sm:inline">Home</span>
            </button>
          </div>

          {/* Right Section: User Profile */}
          <div className="flex items-center gap-4">
            {/* User Info */}
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-white">{user.username}</p>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>

            {/* User Avatar with Dropdown */}
            <div className="relative profile-dropdown-container">
              <button
                onClick={toggleDropdown}
                className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-800 text-white font-semibold border border-gray-700 hover:bg-gray-700 transition-colors"
                aria-expanded={showDropdown}
                aria-haspopup="true"
              >
                {user.username.charAt(0).toUpperCase()}
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-64">
                  <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
                    {/* User Info Section */}
                    <div className="px-4 py-3 bg-gray-900 border-b border-gray-700">
                      <p className="font-medium text-white">{user.username}</p>
                      <p className="text-sm text-gray-400 truncate">
                        {user.email}
                      </p>
                    </div>

                    {/* Dropdown Items */}
                    <div className="py-1">
                      <div className="border-t border-gray-700 my-1" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 transition-colors"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <div className="flex flex-col gap-1">
                <div className="w-6 h-0.5 bg-white"></div>
                <div className="w-6 h-0.5 bg-white"></div>
                <div className="w-6 h-0.5 bg-white"></div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
