"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const levels = [
  {
    name: "Easy",
    color: "bg-[#4ec9b0]",
    description: "Start learning basic debugging",
  },
  {
    name: "Medium",
    color: "bg-[#569cd6]",
    description: "Practice simple debugging challenges",
  },
  {
    name: "Hard",
    color: "bg-[#dcdcaa]",
    description: "Learn to debug more complex problems",
  },
  {
    name: "Boss",
    color: "bg-[#f44747]",
    description: "Face the hardest debugging puzzles",
  },
];

export default function LearnPage() {
  const router = useRouter();

  // Check login
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/me");
        if (!res.ok) router.push("/login");
      } catch {
        router.push("/login");
      }
    };
    checkSession();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <svg
            viewBox="0 0 400 100"
            className="w-full h-auto mb-4 mx-auto"
            style={{ maxWidth: "400px" }}
          >
            {/* 1. Define the Path (A half-circle/Arc) */}
            <defs>
              {/* M = Move to (x, y) | A = Arc (rx, ry, rotation, large-arc-flag, sweep-flag, x, y) */}
              <path
                id="curvePath"
                d="M 50 80 A 150 50 0 0 1 350 80"
                fill="none"
              />
            </defs>

            {/* 2. Place the Text on the Path */}
            <text
              className="font-bold text-4xl"
              style={{
                fill: "#569cd6",
                fontSize: "40px",
                letterSpacing: "5px",
                textAnchor: "middle",
              }}
            >
              <textPath href="#curvePath" startOffset="50%">
                CodeFix
              </textPath>
            </text>
          </svg>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Perfect for beginners to start building debugging skills
          </p>
        </div>

        {/* Levels Grid - MODIFIED: Now fixed at 2 columns */}
        <div className="grid grid-cols-2 gap-6">
          {levels.map((level) => (
            <a
              key={level.name}
              href={`/normal/${level.name.toLowerCase()}`}
              className={`
                block p-6 rounded-lg border border-gray-700 bg-gray-800
                hover:shadow-lg hover:border-blue-600/50 transition-all duration-300
                hover:scale-[1.02] cursor-pointer group
              `}
            >
              <div className="flex items-center mb-4">
                <div
                  className={`w-4 h-4 rounded-full ${level.color} mr-3`}
                ></div>
                <h2 className="text-xl font-semibold text-gray-200 group-hover:text-blue-400">
                  {level.name}
                </h2>
              </div>
              <p className="text-[#858585] text-base leading-relaxed group-hover:text-[#cccccc]">
                {level.description}
              </p>
              <div className="flex items-center mt-4 pt-4 border-t border-gray-700">
                <button
                  className="ml-auto px-4 py-1.5 text-sm rounded-md
               bg-green-700 text-white
               hover:bg-green-600 transition"
                >
                  Start
                </button>
              </div>
            </a>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center p-6 bg-gray-800 rounded-lg border border-gray-700">
          <p className="text-gray-300 text-sm">
            <span className="text-[#4ec9b0] font-medium">Tip:</span> Not sure
            where to start? Begin with{" "}
            <strong className="text-[#4ec9b0]">Easy</strong> and progress at
            your own pace.
          </p>
        </div>
      </div>
    </div>
  );
}
