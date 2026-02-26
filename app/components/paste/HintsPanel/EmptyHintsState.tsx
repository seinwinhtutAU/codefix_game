"use client";

import { Lightbulb } from "lucide-react";

export function EmptyHintsState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
      <Lightbulb size={32} className="text-amber-300 mb-3" />
      <p className="text-xs text-slate-500">
        Define your <strong>Expected Output</strong>, run your code, then
        request a hint.
      </p>
    </div>
  );
}
