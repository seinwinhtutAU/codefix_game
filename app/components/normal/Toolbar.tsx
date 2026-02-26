import { ProblemFile } from "@/lib/types";
import { FileText, RefreshCw, Undo2, Save, CheckCircle } from "lucide-react";

interface ToolbarProps {
  selectedFile: ProblemFile;
  hasCompleted: boolean;
  isCurrentFileModified: boolean;
  isAnyFileModified: boolean;
  onResetCurrentFile: () => void;
  onResetAllFiles: () => void;
  onSaveCode: () => void;
  isSaving?: boolean;
}

export default function Toolbar({
  selectedFile,
  hasCompleted,
  isCurrentFileModified,
  isAnyFileModified,
  onResetCurrentFile,
  onResetAllFiles,
  onSaveCode,
  isSaving = false,
}: ToolbarProps) {
  return (
    <div className="bg-gray-800 border-b border-gray-700 px-5 py-3 flex justify-between items-center">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <div className="flex items-center text-sm text-white">
          <div className="p-1.5 bg-gray-700 rounded-lg mr-3 border border-gray-600">
            <FileText size={16} className="text-blue-400" />
          </div>
          <div className="flex items-center gap-3">
            <div className="font-medium text-gray-200">{selectedFile.name}</div>
            {isCurrentFileModified && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-900/30 text-yellow-400 border border-yellow-800">
                Modified
              </span>
            )}
          </div>
        </div>

        {/* Completion Status - 直接放在Modified标签后面 */}
        {hasCompleted && (
          <div className="flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-green-900/30 text-green-400 border border-green-800">
            <CheckCircle size={12} />
            <span>Completed</span>
          </div>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Save Button */}
        <button
          onClick={onSaveCode}
          disabled={!isAnyFileModified || hasCompleted || isSaving}
          className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition-all ${
            isAnyFileModified && !hasCompleted
              ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:border-blue-700 active:scale-95"
              : "bg-gray-700 text-gray-500 border-gray-600 cursor-not-allowed"
          }`}
        >
          <Save size={16} />
          {isSaving ? "Saving..." : "Save"}
        </button>

        <div className="h-6 w-px bg-gray-700" />

        {/* Reset Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onResetCurrentFile}
            disabled={!isCurrentFileModified || hasCompleted}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-all ${
              isCurrentFileModified && !hasCompleted
                ? "text-blue-400 border-blue-600 hover:bg-gray-700 active:scale-95"
                : "text-gray-600 border-gray-700 cursor-not-allowed"
            }`}
            title="Reset current file"
          >
            <Undo2 size={16} />
            {/* Reset Current */}
          </button>
          <button
            onClick={onResetAllFiles}
            disabled={!isAnyFileModified || hasCompleted}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-all ${
              isAnyFileModified && !hasCompleted
                ? "text-red-400 border-red-600 hover:bg-gray-700 active:scale-95"
                : "text-gray-600 border-gray-700 cursor-not-allowed"
            }`}
            title="Reset all files"
          >
            <RefreshCw size={16} />
            {/* Reset All */}
          </button>
        </div>
      </div>
    </div>
  );
}
