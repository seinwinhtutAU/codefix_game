"use client";

import { useState, useRef, useMemo } from "react";
import Editor from "@monaco-editor/react";
import {
  Play,
  Lightbulb,
  Loader2,
  Terminal,
  X,
  Code2,
  Sparkles,
} from "lucide-react";
import { useExecutor } from "@/hooks";
import {
  Problem,
  ProblemFile,
  TestCase,
  TreeNode,
  UserCodeFileNode,
} from "@/lib/types";

interface PasteOverlayProps {
  onClose: () => void;
  userId: string;
}

export function PasteOverlay({ onClose, userId }: PasteOverlayProps) {
  const [code, setCode] = useState(
    "# Paste your code here\nprint('Hello World')",
  );
  const [hints, setHints] = useState<string[]>([]);
  const [isGeneratingHints, setIsGeneratingHints] = useState(false);
  const [hintLevel, setHintLevel] = useState<"small" | "medium" | "hard">(
    "medium",
  );

  // --- CORRECTED PROBLEMFILE CONSTRUCTION ---
  const pasteProblem: Problem = useMemo(() => {
    // Creating a single file object that matches your recursive ProblemFile interface
    const mainFile: ProblemFile = {
      id: "main-file-id",
      name: "main.py",
      type: "file",
      content: code,
      order: 0,
      parentId: null,
      children: [], // Recursive requirement satisfied
    };

    return {
      _id: "paste-session",
      title: "Paste & Debug",
      description: "Code sandbox for quick debugging.",
      difficulty: "medium",
      mode: "paste",
      files: [mainFile],
      userCodeFiles: [] as TreeNode<UserCodeFileNode>[],
      expectedOutput: "",
      testCases: [] as TestCase[],
      hints: {
        small: [],
        medium: [],
        big: [],
      },
    };
  }, [code]);

  // The executor needs to map the specific file id to the content
  const fileContents: Record<string, string> = {
    "main-file-id": code,
  };

  const { isSubmitting, executionResult, runNormalCode } = useExecutor({
    problem: pasteProblem,
    fileContents,
    userId,
    hintUsages: [],
    timerTimeSpent: 0,
    hasCompleted: false,
    setHasCompleted: () => {},
    level: "paste",
    attempt: 0,
    bugCounts: 0,
    timeLimited: 0,
  });

  const handleGetHint = async () => {
    if (!code.trim()) return;
    setIsGeneratingHints(true);

    try {
      const response = await fetch("/api/get-hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Backend expects a simple List[CodeFile], we map our tree file to that
          files: [
            {
              name: "main.py",
              path: "main.py",
              content: code,
            },
          ],
          error: executionResult?.error || null,
          hint_level: hintLevel,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setHints(data.hints);
      }
    } catch (error) {
      console.error("Hint Error:", error);
    } finally {
      setIsGeneratingHints(false);
    }
  };

  return (
    <div className="absolute inset-0 z-[200] bg-[#FDFBF7] flex flex-col animate-in fade-in duration-200">
      {/* Header */}
      <div className="h-16 border-b border-slate-100 bg-white flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-100 text-violet-600 rounded-xl">
            <Code2 size={20} />
          </div>
          <h2 className="font-bold text-slate-700">Paste & Debug Mode</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-100 rounded-full text-slate-400"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 flex min-h-0 p-4 gap-4">
        {/* Editor Area */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase">
              editor.py
            </span>
            <button
              onClick={runNormalCode}
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-violet-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-violet-700 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-violet-100"
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Play size={16} fill="currentColor" />
              )}
              Run Code
            </button>
          </div>
          <div className="flex-1">
            <Editor
              height="100%"
              language="python"
              theme="light"
              value={code}
              onChange={(val) => setCode(val || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                padding: { top: 20 },
              }}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-[420px] flex flex-col gap-4">
          {/* Console */}
          <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex flex-col shadow-xl">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2 text-slate-500">
              <Terminal size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Console Output
              </span>
            </div>
            <div className="flex-1 p-5 font-mono text-sm overflow-y-auto">
              {executionResult?.output && (
                <pre className="text-emerald-400 whitespace-pre-wrap">
                  {executionResult.output}
                </pre>
              )}
              {executionResult?.error && (
                <pre className="text-rose-400 whitespace-pre-wrap">
                  {executionResult.error}
                </pre>
              )}
              {!executionResult?.output && !executionResult?.error && (
                <span className="text-slate-700">Ready for execution...</span>
              )}
            </div>
          </div>

          {/* AI Hints */}
          <div className="h-[350px] bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-amber-50/40">
              <div className="flex items-center gap-2 text-amber-600">
                <Sparkles size={18} />
                <span className="text-sm font-bold">AI Assistant</span>
              </div>
              <select
                value={hintLevel}
                onChange={(e) =>
                  setHintLevel(e.target.value as "small" | "medium" | "hard")
                }
                className="text-xs bg-white border border-amber-200 rounded-lg px-2 py-1 outline-none"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              {hints.length > 0 ? (
                <div className="space-y-4">
                  {hints.map((hint, i) => (
                    <div
                      key={i}
                      className="flex gap-3 animate-in slide-in-from-left-2 duration-300"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {hint}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <Lightbulb size={40} className="text-amber-200 mb-3" />
                  <p className="text-xs text-slate-500 font-medium">
                    Click `Get AI Hint` for debugging help.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <button
                onClick={handleGetHint}
                disabled={isGeneratingHints || !code.trim()}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-100 transition-all disabled:opacity-50"
              >
                {isGeneratingHints ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Sparkles size={18} />
                )}
                Get AI Hint
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
