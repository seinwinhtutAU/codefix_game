"use client";

import dynamic from "next/dynamic";

const PhaserGame = dynamic(() => import("@/game/components/PhaserGame"), {
  ssr: false,
  loading: () => <div className="text-white">Loading Game Engine...</div>,
});

export default function GamePage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="relative shadow-2xl border-4 border-gray-800 rounded-lg overflow-hidden">
        <PhaserGame />
      </div>
    </div>
  );
}
