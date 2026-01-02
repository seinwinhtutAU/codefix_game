import { DifficultyLevel } from "@/lib/types";

interface DifficultyBadgeProps {
  difficulty: DifficultyLevel | string;
  className?: string;
}

export default function DifficultyBadge({
  difficulty,
  className = "",
}: DifficultyBadgeProps) {
  const colors: Record<string, string> = {
    easy: "bg-green-100 text-green-800 border-green-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    hard: "bg-orange-100 text-orange-800 border-orange-200",
    boss: "bg-red-100 text-red-800 border-red-200",
  };

  const colorClass =
    colors[difficulty.toLowerCase()] ||
    "bg-gray-100 text-gray-800 border-gray-200";

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${colorClass} ${className}`}
    >
      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
    </span>
  );
}
