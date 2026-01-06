"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import Editor from "@monaco-editor/react";
import {
  Loader2,
  Files,
  Terminal,
  Play,
  Lightbulb,
  Upload,
  X,
  Timer,
} from "lucide-react";
import {
  ProblemDescription,
  FileExplorer,
  HintsPanel,
  OutputPanel,
  Toolbar,
  TestCasePanel,
} from "@/app/components/problems";
import { GameNotification } from "@/game/components/GameNotification";
import {
  useUserId,
  useProblemLoader,
  useUserCodeManager,
  useSolvingTimer,
  useExecutor,
  useUIState,
} from "@/hooks";
import { saveUserCode } from "@/services";
import { EventBus } from "@/game/events";

interface ProblemOverlayProps {
  problemId: string;
  onClose: () => void;
}

export function ProblemOverlay({ problemId, onClose }: ProblemOverlayProps) {
  const outputContainerRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;
  const userId = useUserId();

  // --- NEW LOGIC STATES ---
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  // FIX: Initialize attempts at 0 always (do not read from localStorage)
  const [attempts, setAttempts] = useState<number>(0);

  const {
    showProblem,
    showExplorer,
    setShowExplorer,
    showHints,
    setShowHints,
    showTestCases,
    setShowTestCases,
    showOutput,
    setShowOutput,
  } = useUIState();

  const {
    problem,
    setProblem,
    selectedFile,
    setSelectedFile,
    fileContents,
    setFileContents,
    originalFileContents,
    isLoading,
    hasCompleted,
    setHasCompleted,
    totalTimeSpent: initialTime,
    loadProblemData,
  } = useProblemLoader(problemId, userId);

  const {
    hintUsages,
    findContentInUserCodeFiles,
    getCurrentFileContent,
    getOriginalFileContent,
    updateUserCodeFiles,
    recordHintUsage,
    isCurrentFileModified,
    isAnyFileModified,
  } = useUserCodeManager();

  // --- TIMER HOOK (Set to 30s) ---
  const { totalTimeSpent, timeLeft, isTimeUp, resetTimer, setIsSolving } =
    useSolvingTimer(0, hasCompleted, problem, 15);

  const level = problem ? problem.difficulty : "no level";

  const {
    isSubmitting,
    isContinuing,
    executionResult,
    runNormalCode,
    runTestCode,
    continueExecution,
  } = useExecutor({
    problem,
    fileContents,
    userId,
    hintUsages,
    timerTimeSpent: totalTimeSpent,
    hasCompleted,
    setHasCompleted,
    level,
    attempt: attempts,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isTestRunning, setIsTestRunning] = useState(false);

  // Panel dimensions
  const [fileExplorerWidth, setFileExplorerWidth] = useState(200);
  const [hintsPanelWidth, setHintsPanelWidth] = useState(300);
  const [outputPanelWidth, setOutputPanelWidth] = useState(500);
  const [testCasePanelHeight, setTestCasePanelHeight] = useState(288);

  // --- REMOVED: localStorage useEffect that loaded old attempts ---

  // --- ATTEMPT TRACKING LOGIC ---
  useEffect(() => {
    if (isTimeUp && !hasCompleted) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      // FIX: Removed localStorage.setItem here to prevent persistence between sessions
      setShowGameOver(true);
    }
  }, [isTimeUp, hasCompleted]); // Removed attempts from dependency to avoid loop issues

  const handleTryAgain = () => {
    setShowGameOver(false);
    resetTimer();
  };

  const editorWidth = () => {
    let width = "100%";
    if (showExplorer) width = `calc(${width} - ${fileExplorerWidth}px - 1rem)`;
    if (showHints) width = `calc(${width} - ${hintsPanelWidth}px - 1rem)`;
    if (showOutput) width = `calc(${width} - ${outputPanelWidth}px - 1rem)`;
    return width;
  };

  useEffect(() => {
    if (userId && userId !== "null") {
      loadProblemData().then((result) => {
        if (result) {
          setHasCompleted(result.hasCompleted);
          setIsSolving(!result.hasCompleted);
        }
      });
    }
  }, [problemId, userId, loadProblemData, setHasCompleted, setIsSolving]);

  const handleCodeChange = (value: string | undefined) => {
    if (!selectedFile || !problem || isTimeUp) return;
    const newValue = value ?? "";
    setFileContents((prev) => ({ ...prev, [selectedFile.id]: newValue }));
    const updatedProblem = updateUserCodeFiles(
      problem,
      selectedFile,
      selectedFile.id,
      newValue
    );
    if (updatedProblem) setProblem(updatedProblem);
  };

  const handleSaveCode = async () => {
    if (!problem || !userId || userId === "null" || isSaving) return;
    setIsSaving(true);
    try {
      await saveUserCode(userId, problem);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitCode = async () => {
    if (hasCompleted || isTimeUp) return;
    setIsTestRunning(true);
    try {
      const result = await runTestCode();
      const totalTests = result?.totalTests;

      if (
        totalTests !== undefined &&
        result?.passedTests === totalTests &&
        totalTests > 0
      ) {
        setHasCompleted(true);
        setIsSolving(false);
        handleSaveCode();
        setShowSuccessPopup(true);
        // FIX: Removed EventBus.emit here. Moved to handleFinalExit to ensure popup shows.
      }
    } finally {
      setIsTestRunning(false);
    }
  };

  const handleContinueExecution = async (
    executionId: string,
    input: string
  ) => {
    await continueExecution(executionId, input);
  };

  const handleFinalExit = () => {
    // FIX: Emit the solved event ONLY when the user clicks the exit button on the success popup
    if (hasCompleted) {
      console.log("hasCompleted attempts: ", attempts);
      EventBus.emit("problem-solved", { id: problemId, attempt: attempts });
    }

    // Always trigger resume to unpause the game
    EventBus.emit("resume-after-solve");
    onClose();
  };

  if (isLoading || !problem) {
    return (
      <div className="absolute inset-0 z-[200] flex items-center justify-center bg-gray-900/90 backdrop-blur-sm">
        <Loader2 className="animate-spin text-blue-400" size={48} />
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 z-[150] bg-gray-900 flex flex-col p-4 animate-in fade-in zoom-in duration-200 overflow-hidden"
      onKeyDown={(e) => e.stopPropagation()}
    >
      <AnimatePresence>
        {/* SUCCESS NOTIFICATION */}
        {showSuccessPopup && (
          <GameNotification
            type="SUCCESS"
            title="Terminal Breached"
            message={
              attempts >= 5
                ? "Access granted, but security trace was too high. Points Earned: 0"
                : "Encryption keys acquired. System access granted. Points Earned: 100"
            }
            confirmLabel="RETURN TO FIELD"
            onConfirm={handleFinalExit}
          />
        )}

        {/* GAME OVER NOTIFICATION */}
        {showGameOver && (
          <GameNotification
            type="GAMEOVER"
            title="SYSTEM LOCKDOWN"
            message={
              attempts >= 5
                ? "Max attempts reached. Security has localized your hardware. You have failed this breach."
                : `Time Expired! Trace reached 100%. Attempt ${attempts}/5.`
            }
            confirmLabel={
              attempts >= 5 ? "ABANDON MISSION" : "REBOOT & TRY AGAIN"
            }
            // Logic: If attempts < 5, try again. If >= 5, final exit.
            onConfirm={attempts >= 5 ? handleFinalExit : handleTryAgain}
          />
        )}
      </AnimatePresence>

      {/* Header with Timer */}
      <div className="flex items-center justify-between mb-4 bg-gray-800 p-3 rounded-lg border border-gray-700">
        <div className="flex items-center gap-6">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          <h2 className="text-xl font-mono text-white tracking-tight underline decoration-blue-500">
            SECURE_TERMINAL // {problem.title}
          </h2>

          {/* TIMER DISPLAY */}
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded bg-black/40 border ${
              timeLeft < 10
                ? "border-red-500 animate-pulse"
                : "border-blue-500/30"
            }`}
          >
            <Timer
              size={18}
              className={timeLeft < 10 ? "text-red-500" : "text-blue-400"}
            />
            <span
              className={`font-mono text-xl ${
                timeLeft < 10 ? "text-red-500" : "text-blue-400"
              }`}
            >
              00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">
            Attempt: {attempts}/5
          </span>
          <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">
            {hasCompleted ? "DECRYPTED" : "ENCRYPTED"}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <ProblemDescription
          problem={problem}
          isOpen={showProblem}
          totalTimeSpent={totalTimeSpent}
          userId={userId}
          hasCompleted={hasCompleted}
        />

        <div className="flex flex-1 gap-4 mt-4 min-h-0 overflow-hidden">
          <FileExplorer
            files={problem.files}
            isOpen={showExplorer}
            selectedFileId={selectedFile?.id}
            onSelectFile={setSelectedFile}
            onResize={setFileExplorerWidth}
            defaultWidth={200}
          />

          <div
            className="flex flex-col min-w-0 rounded-lg border border-gray-700 bg-gray-800 overflow-hidden shadow-2xl relative"
            style={{ width: editorWidth() }}
          >
            <Toolbar
              selectedFile={selectedFile!}
              hasCompleted={hasCompleted}
              isCurrentFileModified={isCurrentFileModified(
                selectedFile,
                getCurrentFileContent(
                  selectedFile,
                  problem,
                  fileContents,
                  (n) => findContentInUserCodeFiles(problem, n)
                ),
                getOriginalFileContent(selectedFile, originalFileContents)
              )}
              isAnyFileModified={isAnyFileModified(
                fileContents,
                originalFileContents
              )}
              onResetCurrentFile={() => {}}
              onResetAllFiles={() => {}}
              onSaveCode={handleSaveCode}
              isSaving={isSaving}
            />

            <div className="flex-1 relative">
              <Editor
                height="100%"
                language="python"
                theme="vs-dark"
                value={getCurrentFileContent(
                  selectedFile,
                  problem,
                  fileContents,
                  (n) => findContentInUserCodeFiles(problem, n)
                )}
                onChange={handleCodeChange}
                options={{
                  minimap: { enabled: false },
                  readOnly: hasCompleted || isTimeUp,
                  fontSize: 14,
                }}
              />

              <div className="absolute bottom-4 right-4 flex gap-2 z-10">
                <button
                  onClick={runNormalCode}
                  disabled={
                    isSubmitting || hasCompleted || isContinuing || isTimeUp
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Play size={16} />
                  )}{" "}
                  Run
                </button>
                <button
                  onClick={handleSubmitCode}
                  disabled={isTestRunning || hasCompleted || isTimeUp}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg"
                >
                  {isTestRunning ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Upload size={16} />
                  )}{" "}
                  {hasCompleted ? "Verified" : "Decrypt"}
                </button>
              </div>
            </div>
          </div>

          {showHints && problem.hints && (
            <HintsPanel
              hints={problem.hints}
              isVisible={showHints}
              onHintUsed={recordHintUsage}
              onClose={() => setShowHints(false)}
              onResize={setHintsPanelWidth}
              defaultWidth={300}
            />
          )}
          {showOutput && (
            <OutputPanel
              executionResult={executionResult}
              isVisible={showOutput}
              isSubmitting={isSubmitting}
              isContinuing={isContinuing}
              onClose={() => setShowOutput(false)}
              containerRef={outputContainerRef}
              onResize={setOutputPanelWidth}
              defaultWidth={outputPanelWidth}
              onContinueExecution={handleContinueExecution}
            />
          )}
        </div>

        {showTestCases && (
          <div className="mt-4 flex-shrink-0">
            <TestCasePanel
              executionResult={executionResult}
              isVisible={showTestCases}
              isSubmitting={isTestRunning || isSubmitting}
              onResize={setTestCasePanelHeight}
              onClose={() => setShowTestCases(false)}
            />
          </div>
        )}
      </div>

      <div className="fixed left-8 top-1/2 -translate-y-1/2 flex flex-col gap-4">
        <button
          onClick={() => setShowExplorer(!showExplorer)}
          className={`p-3 rounded-lg border transition-all ${
            showExplorer
              ? "bg-blue-600 border-blue-400"
              : "bg-gray-800 border-gray-700 hover:bg-gray-700"
          }`}
        >
          <Files size={20} />
        </button>
        <button
          onClick={() => setShowHints(!showHints)}
          className={`p-3 rounded-lg border transition-all ${
            showHints
              ? "bg-yellow-600 border-yellow-400"
              : "bg-gray-800 border-gray-700 hover:bg-gray-700"
          }`}
        >
          <Lightbulb size={20} />
        </button>
        <button
          onClick={() => setShowTestCases(!showTestCases)}
          className={`p-3 rounded-lg border transition-all ${
            showTestCases
              ? "bg-blue-600 border-blue-400"
              : "bg-gray-800 border-gray-700 hover:bg-gray-700"
          }`}
        >
          <Terminal size={20} />
        </button>
        <button
          onClick={() => setShowOutput(!showOutput)}
          className={`p-3 rounded-lg border transition-all ${
            showOutput
              ? "bg-green-600 border-green-400"
              : "bg-gray-800 border-gray-700 hover:bg-gray-700"
          }`}
        >
          <div className="w-4 h-4 rounded-full bg-white animate-pulse" />
        </button>
      </div>
    </div>
  );
}
