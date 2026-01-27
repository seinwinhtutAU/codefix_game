"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
  Sparkle,
  Layout,
  LucideIcon,
  CheckCircle2,
  Code2,
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
import {
  checkExistingSolveRecord,
  saveSolveRecord,
  saveUserCode,
} from "@/services";
import { EventBus } from "@/game/events";
import {
  IGameProgress,
  ProblemSolveRecord,
  SolveRecordRequest,
} from "@/lib/types";
import { getPlayerProgress } from "@/services/game";
import { HintUsage } from "@/lib/types";

interface ProblemOverlayProps {
  problemId: string;
  onClose: () => void;
  difficulty?: string;
}

export function ProblemOverlay({
  problemId,
  onClose,
  difficulty,
}: ProblemOverlayProps) {
  const outputContainerRef = useRef<HTMLDivElement>(
    null,
  ) as React.RefObject<HTMLDivElement>;
  const userId = useUserId();

  // --- UI STATES ---
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);

  // --- DATA STATES ---
  const [finalRecord, setFinalRecord] = useState<ProblemSolveRecord>();
  const [progress, setProgress] = useState<IGameProgress>();

  // ✅ DERIVED STATE
  const attempts = progress?.gameState?.currentTask?.attempts ?? 0;

  // --- 1. INITIAL LOAD ---
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const data = await getPlayerProgress();
        setProgress(data);
      } catch (err) {
        console.error("Failed to load progress:", err);
      }
    };
    fetchProgress();
  }, []);

  // --- 2. PROGRESS MODIFIERS ---
  const incrementAttemptsInProgress = () => {
    setProgress((prev) => {
      if (!prev?.gameState?.currentTask) return prev;
      const currentAttempts = prev.gameState.currentTask.attempts ?? 0;
      const newAttempts = currentAttempts + 1 > 5 ? 0 : currentAttempts + 1;
      return {
        ...prev,
        gameState: {
          ...prev.gameState,
          currentTask: {
            ...prev.gameState.currentTask,
            attempts: newAttempts,
          },
        },
      };
    });
  };

  // --- 3. DATABASE SYNC ---
  useEffect(() => {
    if (!progress) return;
    const updateProgress = async () => {
      try {
        await fetch("/api/game-progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: progress.userId,
            lastLocation: progress.lastLocation,
            gameState: progress.gameState,
            bugCounts: progress.bugCounts,
          }),
        });
      } catch (e) {
        console.error("Database Save Error:", e);
      }
    };
    const timeoutId = setTimeout(updateProgress, 500);
    return () => clearTimeout(timeoutId);
  }, [progress]);

  useEffect(() => {
    if (!progress) return;
    const timeoutId = setTimeout(() => {
      EventBus.emit("problem-update-progress", {
        userId: progress.userId,
        lastLocation: progress.lastLocation,
        gameState: progress.gameState,
        bugCounts: progress.bugCounts,
      } as IGameProgress);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [progress]);

  // --- HOOKS & UI HELPERS ---
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
    loadProblemData,
  } = useProblemLoader(problemId, userId);

  const {
    hintUsages,
    setHintUsages,
    findContentInUserCodeFiles,
    getCurrentFileContent,
    getOriginalFileContent,
    updateUserCodeFiles,
    resetAllFiles,
    recordHintUsage,
    isCurrentFileModified,
    isAnyFileModified,
  } = useUserCodeManager();

  // --- TIMER LOGIC ---
  const [timeLimited, setTimeLimited] = useState(60);
  const [basePoints, setBasePoints] = useState(100);

  const currentBugCount = progress?.bugCounts?.find(
    (b) => b.problemId === problemId,
  );

  const minBugs: number = 10;
  const timerIncrementPerBug: number = 120;
  const pointIncrementPerBug: number = 10;
  const BASE_TIME_LIMIT = 60;
  const BASE_POINTS = 100;

  const calculateTimeAndPoints = (bugCount: number) => {
    const bugFactor = bugCount - minBugs;
    const calculatedTime = bugFactor * timerIncrementPerBug + BASE_TIME_LIMIT;
    const calculatedPoints = bugFactor * pointIncrementPerBug + BASE_POINTS;
    return { calculatedTime, calculatedPoints };
  };

  useEffect(() => {
    if (currentBugCount) {
      const { calculatedTime, calculatedPoints } = calculateTimeAndPoints(
        currentBugCount.bugCount,
      );
      setTimeLimited(calculatedTime);
      setBasePoints(calculatedPoints);
    }
  }, [currentBugCount]);

  const { totalTimeSpent, timeLeft, isTimeUp, resetTimer, setIsSolving } =
    useSolvingTimer(0, hasCompleted, problem, timeLimited);

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
    timeLimited: timeLimited,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isTestRunning, setIsTestRunning] = useState(false);

  // Panel dimensions
  const [fileExplorerWidth, setFileExplorerWidth] = useState(200);
  const [hintsPanelWidth, setHintsPanelWidth] = useState(300);
  const [outputPanelWidth, setOutputPanelWidth] = useState(400);
  const [testCasePanelHeight, setTestCasePanelHeight] = useState(200);

  // --- GAME OVER LOGIC ---
  useEffect(() => {
    if (isTimeUp && !hasCompleted) {
      incrementAttemptsInProgress();
      setShowGameOver(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimeUp, hasCompleted]);

  useEffect(() => {
    if (!progress) return;
    if (hasCompleted) return;

    if (attempts === 5) {
      if (progress.gameState.currentTask.status === "completed") return;

      const failedRecord: SolveRecordRequest = {
        userId: progress.userId,
        problemId: problemId,
        timeSpent: timeLimited * 5,
        pointsEarned: 0,
        hintUsages: hintUsages,
        level: "easy",
        attempt: 5,
      };
      saveSolveRecord(failedRecord);
    }
  }, [attempts]);

  const handleTryAgain = () => {
    setShowGameOver(false);
    resetTimer();
  };

  const editorWidth = () => {
    let width = "100%";
    if (showExplorer)
      width = `calc(${width} - ${fileExplorerWidth}px - 0.75rem)`;
    if (showHints) width = `calc(${width} - ${hintsPanelWidth}px - 0.75rem)`;
    if (showOutput) width = `calc(${width} - ${outputPanelWidth}px - 0.75rem)`;
    return width;
  };

  useEffect(() => {
    if (userId && userId !== "null") {
      loadProblemData().then((result) => {
        if (result) {
          setHasCompleted(result.hasCompleted);
          setIsSolving(!result.hasCompleted);

          if (progress?.gameState?.currentTask?.hintUsages) {
            setHintUsages(progress.gameState.currentTask.hintUsages);
          }
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
      newValue,
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

  // ✅ 1. NEW HANDLER: Run Code & Auto-Show Output
  const handleRunCode = () => {
    setShowOutput(true);
    runNormalCode();
  };

  const handleSubmitCode = async () => {
    if (hasCompleted || isTimeUp) return;

    // ✅ 2. MODIFIED: Auto-Show Test Cases
    setShowTestCases(true);
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

        const recordResponse = await checkExistingSolveRecord(
          userId,
          problemId,
        );
        if (recordResponse?.data && recordResponse.success) {
          setFinalRecord(recordResponse.data);
        }

        setShowSuccessPopup(true);
      }
    } finally {
      setIsTestRunning(false);
    }
  };

  const handleContinueExecution = async (
    executionId: string,
    input: string,
  ) => {
    await continueExecution(executionId, input);
  };

  const hintLevelMap = {
    none: 0,
    small: 1,
    medium: 2,
    big: 3,
  } as const;

  type HintLevel = keyof typeof hintLevelMap;

  const reverseHintLevelMap: Record<number, HintLevel> = {
    0: "none",
    1: "small",
    2: "medium",
    3: "big",
  };

  const getHighestHintLevelUsed = useCallback(
    (usages: HintUsage[]): HintLevel => {
      let highestHintLevel = 0;
      for (const usage of usages) {
        highestHintLevel = Math.max(
          highestHintLevel,
          hintLevelMap[usage.hintLevel],
        );
      }
      return reverseHintLevelMap[highestHintLevel];
    },
    [],
  );

  useEffect(() => {
    if (
      JSON.stringify(hintUsages) ===
      JSON.stringify(progress?.gameState?.currentTask?.hintUsages)
    ) {
      return;
    }

    setProgress((prev) => {
      if (!prev?.gameState?.currentTask) return prev;
      return {
        ...prev,
        gameState: {
          ...prev.gameState,
          currentTask: {
            ...prev.gameState.currentTask,
            highestHintLevelUsed: getHighestHintLevelUsed(hintUsages),
            hintUsages: hintUsages,
          },
        },
      };
    });
  }, [hintUsages, getHighestHintLevelUsed]);

  const handleFinalExit = async () => {
    const currentIndex =
      progress?.gameState.currentTask.currentActiveIndex ?? 0;
    const nextIndex = currentIndex + 1;

    const updatedTask: IGameProgress["gameState"]["currentTask"] = {
      taskType: progress?.gameState.currentTask.taskType || "code_problem",
      taskId: progress?.gameState.currentTask.taskId,
      status: hasCompleted ? "completed" : "in_progress",
      attempts: attempts,
      timer: progress?.gameState.currentTask.timer,
      currentActiveIndex: nextIndex,
      highestHintLevelUsed: getHighestHintLevelUsed(hintUsages),
      hintUsages: hintUsages,
    };

    let currentScene;
    EventBus.on("ui-scene", (scene) => {
      currentScene = scene;
    });

    const updatedProgress: IGameProgress = {
      ...progress,
      gameState: {
        currentScene: progress?.gameState.currentScene || currentScene,
        eventFlags: progress?.gameState.eventFlags || {},
        currentTask: updatedTask,
      },
    } as IGameProgress;

    try {
      await fetch("/api/game-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: updatedProgress?.userId,
          lastLocation: updatedProgress?.lastLocation,
          gameState: updatedProgress?.gameState,
          bugCounts: updatedProgress?.bugCounts,
        }),
      });
    } catch (e) {
      console.error("Failed to persist progress to DB on exit:", e);
    }

    if (hasCompleted) {
      EventBus.emit("problem-solved", { currentTask: updatedTask });
    }
    EventBus.emit("resume-after-solve", updatedProgress);
    EventBus.emit("ui-close-problem");
    onClose();
  };

  const calculateEstimatedPoints = () => {
    if (hasCompleted && finalRecord) return finalRecord.pointsEarned;
    if (attempts >= 5) return 0;
    const hintLevel = progress?.gameState.currentTask.highestHintLevelUsed;
    let currentPoints = basePoints;
    switch (hintLevel) {
      case "small":
        currentPoints = Math.min(currentPoints, 90);
        break;
      case "medium":
        currentPoints = Math.min(currentPoints, 70);
        break;
      case "big":
        currentPoints = Math.min(currentPoints, 50);
        break;
    }
    return Math.max(0, currentPoints - attempts * 10);
  };

  const estimatedPoints = calculateEstimatedPoints();

  const resetCurrentFile = () => {
    if (!selectedFile || !problem) return;
    const originalContent = getOriginalFileContent(
      selectedFile,
      originalFileContents,
    );
    setFileContents((prev) => ({
      ...prev,
      [selectedFile.id]: originalContent,
    }));
    const updatedProblem = updateUserCodeFiles(
      problem,
      selectedFile,
      selectedFile.id,
      originalContent,
    );
    if (updatedProblem) {
      setProblem(updatedProblem);
    }
  };

  const handleResetAllFiles = async () => {
    if (
      !problem ||
      !window.confirm(
        "Are you sure you want to reset all files to their original state? This cannot be undone.",
      )
    ) {
      return;
    }
    setFileContents(originalFileContents);
    const updatedProblem = resetAllFiles(problem, originalFileContents);
    if (updatedProblem) {
      setProblem(updatedProblem);
    }
  };

  const resetAllFileInTryAgain = async () => {
    if (!problem) return;
    setFileContents(originalFileContents);
    const updatedProblem = resetAllFiles(problem, originalFileContents);
    if (updatedProblem) {
      setProblem(updatedProblem);
    }
  };

  if (isLoading || !problem) {
    return (
      <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-violet-50/90 backdrop-blur-sm gap-4">
        <Loader2 className="animate-spin text-violet-500" size={64} />
      </div>
    );
  }

  // Helper for Sidebar Buttons
  const SidebarButton = ({
    active,
    onClick,
    icon: Icon,
    colorClass,
  }: {
    active: boolean;
    onClick: () => void;
    icon: LucideIcon;
    colorClass: string;
  }) => (
    <button
      onClick={onClick}
      className={`p-3 rounded-2xl transition-all duration-300 shadow-sm ${
        active
          ? `${colorClass} text-white shadow-md scale-105`
          : "bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600 hover:scale-105"
      }`}
    >
      <Icon size={22} strokeWidth={active ? 2.5 : 2} />
    </button>
  );

  return (
    // MAIN CONTAINER: 柔和的暖白色背景，适应 768px 高度
    <div
      className="absolute inset-0 z-[150] bg-[#FDFBF7] flex flex-row animate-in fade-in zoom-in duration-200 overflow-hidden font-sans"
      onKeyDown={(e) => e.stopPropagation()}
    >
      <AnimatePresence>
        {/* SUCCESS POPUP */}
        {showSuccessPopup && (
          <GameNotification
            type="SUCCESS"
            title="Great Job!"
            message={`Solved in ${finalRecord?.timeSpent || totalTimeSpent}s and ${attempts} attempts`}
            points={
              finalRecord?.pointsEarned ?? (attempts >= 5 ? 0 : basePoints)
            }
            confirmLabel="Back to Game"
            onConfirm={handleFinalExit}
          />
        )}

        {/* GAME OVER POPUP */}
        {showGameOver && (
          <GameNotification
            type="GAMEOVER"
            title="Game Over"
            message={
              attempts >= 5
                ? "Maximum attempts reached. Proceeding to next problem."
                : `Time's up! Please try again. (Attempt ${attempts}/5)`
            }
            confirmLabel={attempts >= 5 ? "Back to Game" : "Try Again"}
            onConfirm={attempts >= 5 ? handleFinalExit : handleTryAgain}
          />
        )}
      </AnimatePresence>

      {/* --- LEFT SIDEBAR (Compact Navigation) --- */}
      <div className="w-16 flex flex-col items-center py-4 bg-white border-r border-slate-100 shadow-[2px_0_15px_-5px_rgba(0,0,0,0.05)] z-20 gap-3">
        <button
          onClick={onClose}
          className="mb-2 p-2 rounded-full hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors"
        >
          <X size={24} />
        </button>

        <div className="w-8 h-[1px] bg-slate-100 mb-2" />

        <SidebarButton
          active={showExplorer}
          onClick={() => setShowExplorer(!showExplorer)}
          icon={Files}
          colorClass="bg-indigo-400"
        />
        <SidebarButton
          active={showHints}
          onClick={() => setShowHints(!showHints)}
          icon={Lightbulb}
          colorClass="bg-amber-400"
        />
        <SidebarButton
          active={showTestCases}
          onClick={() => setShowTestCases(!showTestCases)}
          icon={Terminal}
          colorClass="bg-emerald-400"
        />
        <SidebarButton
          active={showOutput}
          onClick={() => setShowOutput(!showOutput)}
          icon={Layout}
          colorClass="bg-violet-400"
        />
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-3 gap-3">
        {/* 1. HEADER (Compact & Cute) */}
        <div className="flex items-center justify-between bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm shrink-0 h-14">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-slate-700 tracking-tight flex items-center gap-2">
              <span className="text-violet-400">#</span>
              {problem.title}
            </h2>

            {/* TIMER - Capsule Style */}
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
                timeLeft < 10
                  ? "bg-red-50 border-red-200"
                  : "bg-blue-50 border-blue-100"
              }`}
            >
              <Timer
                size={16}
                className={timeLeft < 10 ? "text-red-500" : "text-blue-400"}
              />
              <span
                className={`font-mono text-base font-bold ${
                  timeLeft < 10 ? "text-red-500" : "text-blue-500"
                }`}
              >
                {Math.floor(timeLeft / 60)
                  .toString()
                  .padStart(2, "0")}
                :{(timeLeft % 60).toString().padStart(2, "0")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border ${
                hasCompleted
                  ? "bg-emerald-50 text-emerald-500 border-emerald-100"
                  : "bg-slate-50 text-slate-400 border-slate-100"
              }`}
            >
              {hasCompleted ? "SOLVED" : "CODING"}
            </span>

            <div className="flex items-center gap-4 text-slate-500">
              <div className="flex flex-col items-end leading-none">
                <span className="text-[9px] uppercase tracking-wider text-slate-300 font-bold">
                  Reward
                </span>
                <div className="flex items-center gap-1">
                  <Sparkle
                    size={12}
                    className="text-amber-400 fill-amber-400"
                  />
                  <span className="text-lg font-bold text-slate-700">
                    {estimatedPoints}
                  </span>
                </div>
              </div>

              <div className="w-[1px] h-6 bg-slate-100" />

              <div className="flex flex-col items-end leading-none">
                <span className="text-[9px] uppercase tracking-wider text-slate-300 font-bold">
                  Attempts
                </span>
                <span
                  className={`text-lg font-bold ${
                    attempts >= 4 ? "text-rose-500" : "text-slate-700"
                  }`}
                >
                  {attempts}/5
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. DESCRIPTION AREA */}
        <AnimatePresence>
          {showProblem && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 12 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0"
            >
              <ProblemDescription
                problem={problem}
                isOpen={showProblem}
                totalTimeSpent={totalTimeSpent}
                userId={userId}
                hasCompleted={hasCompleted}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3. WORKSPACE AREA (Panels + Editor) */}
        <div className="flex-1 flex gap-3 min-h-0 relative">
          {/* EXPLORER PANEL */}
          <FileExplorer
            files={problem.files}
            isOpen={showExplorer}
            selectedFileId={selectedFile?.id}
            onSelectFile={setSelectedFile}
            onResize={setFileExplorerWidth}
            defaultWidth={200}
          />

          {/* EDITOR CONTAINER - The Core */}
          <div
            className="flex flex-col min-w-0 rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden relative transition-all duration-300"
            style={{ width: editorWidth() }}
          >
            {/* Editor Toolbar */}
            <div className="border-b border-slate-100 bg-white shrink-0">
              <Toolbar
                selectedFile={selectedFile!}
                hasCompleted={hasCompleted}
                isCurrentFileModified={isCurrentFileModified(
                  selectedFile,
                  getCurrentFileContent(
                    selectedFile,
                    problem,
                    fileContents,
                    (n) => findContentInUserCodeFiles(problem, n),
                  ),
                  getOriginalFileContent(selectedFile, originalFileContents),
                )}
                isAnyFileModified={isAnyFileModified(
                  fileContents,
                  originalFileContents,
                )}
                onResetCurrentFile={resetCurrentFile}
                onResetAllFiles={handleResetAllFiles}
                onSaveCode={handleSaveCode}
                isSaving={isSaving}
              />
            </div>

            {/* Editor Body - Added min-h-0 and overflow-hidden to fix layout overflow */}
            <div className="flex-1 min-h-0 overflow-hidden relative bg-white">
              <Editor
                height="100%"
                language="python"
                theme="light"
                value={getCurrentFileContent(
                  selectedFile,
                  problem,
                  fileContents,
                  (n) => findContentInUserCodeFiles(problem, n),
                )}
                onChange={handleCodeChange}
                options={{
                  minimap: { enabled: false },
                  readOnly: hasCompleted || isTimeUp,
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  scrollBeyondLastLine: false,
                  padding: { top: 16, bottom: 16 },
                  overviewRulerBorder: false,
                  renderLineHighlight: "none",
                  fixedOverflowWidgets: true,
                }}
              />
            </div>

            {/* ACTION BAR (Footer) - Fixed Visibility */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/80 backdrop-blur-sm shrink-0 z-10">
              {/* Left side: Status or Info */}
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <Code2 size={14} className="text-slate-400" />
                <span>Ready to run</span>
              </div>

              {/* Right side: Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleRunCode}
                  disabled={
                    isSubmitting || hasCompleted || isContinuing || isTimeUp
                  }
                  className="bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-100 hover:border-indigo-200 active:scale-95 px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all font-bold text-sm disabled:opacity-50 disabled:shadow-none"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Play size={16} fill="currentColor" />
                  )}{" "}
                  Run Code
                </button>
                <button
                  onClick={handleSubmitCode}
                  disabled={isTestRunning || hasCompleted || isTimeUp}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all font-bold text-sm disabled:opacity-50 disabled:shadow-none active:scale-95 ${
                    hasCompleted
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                      : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 shadow-md"
                  }`}
                >
                  {isTestRunning ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : hasCompleted ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <Upload size={16} />
                  )}{" "}
                  {hasCompleted ? "Solved" : "Submit"}
                </button>
              </div>
            </div>
          </div>

          {/* HINTS & OUTPUT PANELS (Side by side with editor if open) */}
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

        {/* 4. BOTTOM AREA (Test Cases) */}
        {showTestCases && (
          <div className="flex-shrink-0 animate-in slide-in-from-bottom-4 duration-300">
            <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-white">
              <TestCasePanel
                executionResult={executionResult}
                isVisible={showTestCases}
                isSubmitting={isTestRunning || isSubmitting}
                onResize={setTestCasePanelHeight}
                onClose={() => setShowTestCases(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
