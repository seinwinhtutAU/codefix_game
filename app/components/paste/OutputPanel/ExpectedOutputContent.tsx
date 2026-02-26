"use client";

interface ExpectedOutputContentProps {
  value: string;
  onChange: (value: string) => void;
}

export function ExpectedOutputContent({
  value,
  onChange,
}: ExpectedOutputContentProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Paste your expected output here..."
      className="w-full h-full p-4 text-sm font-mono text-slate-700 bg-transparent outline-none resize-none"
    />
  );
}
