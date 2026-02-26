"use client";

interface HintsListProps {
  hints: string[];
}

export function HintsList({ hints }: HintsListProps) {
  return (
    <div className="space-y-5">
      {hints.map((hint, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-[10px] font-bold">
            {i + 1}
          </div>
          <p className="text-sm text-slate-600 leading-relaxed pt-0.5">
            {hint}
          </p>
        </div>
      ))}
    </div>
  );
}
