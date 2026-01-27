import { ProblemFile } from "@/lib/types";
import {
  FileText,
  RefreshCw,
  Undo2,
  Save,
  CheckCircle,
  CircleDashed,
} from "lucide-react";

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
    <div className="bg-white border-b border-slate-100 px-4 py-2 flex justify-between items-center h-12 shrink-0">
      {/* Left Section: File Info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center text-sm">
          {/* File Icon */}
          <div className="p-1.5 bg-indigo-50 rounded-lg mr-2 border border-indigo-100 text-indigo-500">
            <FileText size={14} />
          </div>

          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-700">
              {selectedFile.name}
            </span>

            {/* Modified Badge */}
            {isCurrentFileModified && !hasCompleted && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 flex items-center gap-1">
                <CircleDashed size={10} />
                Modified
              </span>
            )}

            {/* Completed Badge */}
            {hasCompleted && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1">
                <CheckCircle size={10} />
                Completed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Section: Actions */}
      <div className="flex items-center gap-2">
        {/* Save Button */}
        <button
          onClick={onSaveCode}
          disabled={!isAnyFileModified || hasCompleted || isSaving}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all duration-200 shadow-sm ${
            isAnyFileModified && !hasCompleted
              ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 hover:border-indigo-700 active:scale-95 shadow-indigo-100"
              : "bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed shadow-none"
          }`}
        >
          <Save size={14} />
          {isSaving ? "Saving..." : "Save Code"}
        </button>

        {/* Divider */}
        <div className="h-4 w-px bg-slate-200 mx-1" />

        {/* Reset Buttons Group */}
        <div className="flex items-center gap-1">
          <button
            onClick={onResetCurrentFile}
            disabled={!isCurrentFileModified || hasCompleted}
            className={`p-1.5 rounded-lg transition-all duration-200 border ${
              isCurrentFileModified && !hasCompleted
                ? "text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-100"
                : "text-slate-300 border-transparent cursor-not-allowed"
            }`}
            title="Reset current file"
          >
            <Undo2 size={16} />
          </button>

          <button
            onClick={onResetAllFiles}
            disabled={!isAnyFileModified || hasCompleted}
            className={`p-1.5 rounded-lg transition-all duration-200 border ${
              isAnyFileModified && !hasCompleted
                ? "text-slate-500 border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100"
                : "text-slate-300 border-transparent cursor-not-allowed"
            }`}
            title="Reset all files"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
