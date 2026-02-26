"use client";

import { ReactNode } from "react";

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  color?: string;
  showWarning?: boolean;
}

export function TabButton({
  active,
  onClick,
  icon,
  label,
  color = "violet",
  showWarning,
}: TabButtonProps) {
  const baseClasses =
    "py-2 px-1 text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all";
  const activeClasses = active
    ? `border-${color}-600 text-${color}-600`
    : "border-transparent text-slate-400";
  const warningClasses = showWarning
    ? "border-rose-500 text-rose-600 animate-pulse animate-shake"
    : "";

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${activeClasses} ${warningClasses}`}
    >
      {icon}
      {label}
      {showWarning && (
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
      )}
    </button>
  );
}
