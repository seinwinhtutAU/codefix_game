"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Bug,
  ArrowRight,
  X,
  Lightbulb,
  AlertTriangle,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { EventBus } from "@/game/events";
import { GameNotification } from "@/game/components/GameNotification";
import { getPlayerProgress } from "@/services/game";
import { useUserId } from "@/hooks";
import { IGameProgress } from "@/lib/types";
import { QUESTIONS } from "./quiz_data";

interface DebuggingQuizProps {
  onClose?: () => void;
  quizId?: string;
}

export default function DebuggingQuiz({
  onClose,
  quizId = "easy_quiz",
}: DebuggingQuizProps) {
  const userId = useUserId();

  // State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [showQuizCompleted, setShowQuizCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Data State
  const [progress, setProgress] = useState<IGameProgress>();

  const currentQuestion = QUESTIONS[currentIndex];
  const progressPercent = ((currentIndex + 1) / QUESTIONS.length) * 100;

  // --- 1. LOAD PROGRESS ---
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

  const handleOptionSelect = (id: string) => {
    if (isSubmitted) return;
    setSelectedOptionId(id);
  };

  const handleSubmit = () => {
    if (!selectedOptionId) return;
    EventBus.emit("play-ui-sound", "click");
    setIsSubmitted(true);
    if (selectedOptionId === currentQuestion.correctOptionId) {
      setScore((prev) => prev + 1);
    }
  };

  const handleRetry = () => {
    EventBus.emit("play-ui-sound", "click");
    setIsSubmitted(false);
    setSelectedOptionId(null);
  };

  const handleNext = () => {
    EventBus.emit("play-ui-sound", "click");
    if (currentIndex < QUESTIONS.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOptionId(null);
      setIsSubmitted(false);
    } else {
      setShowQuizCompleted(true);
    }
  };

  const handleClose = () => {
    EventBus.emit("play-ui-sound", "click");
    if (onClose) onClose();
  };

  // --- 2. SAVE PROGRESS LOGIC ---
  const handleQuizNotificationConfirm = async () => {
    EventBus.emit("play-ui-sound", "click");
    setIsSaving(true);

    try {
      // 1. Prepare updated data
      const pointsEarned = score * 100;

      // Update Task Status
      const updatedTask = {
        ...(progress?.gameState?.currentTask || {}),
        status: "completed",
        pointsEarned: pointsEarned,
      };

      // Update Flags (e.g. set easyQuizCompleted to true)
      const updatedFlags = {
        ...(progress?.gameState?.eventFlags || {}),
        easyQuizCompleted: true,
      };

      const updatedProgress: IGameProgress = {
        ...progress,
        gameState: {
          ...progress?.gameState,
          eventFlags: updatedFlags,
          currentTask: updatedTask,
        },
      } as IGameProgress;

      // 2. Save to DB
      if (userId) {
        await fetch("/api/game-progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: updatedProgress.userId,
            lastLocation: updatedProgress.lastLocation,
            gameState: updatedProgress.gameState,
            bugCounts: updatedProgress.bugCounts,
          }),
        });
      }

      // 3. Emit Events to Game Scene
      EventBus.emit("quiz-completed", {
        score: score,
        total: QUESTIONS.length,
      });

      // Important: Tell the game scene to resume and update its state
      EventBus.emit("resume-after-solve", updatedProgress);
    } catch (error) {
      console.error("Failed to save quiz progress:", error);
    } finally {
      setIsSaving(false);
      if (onClose) onClose();
    }
  };

  // --- GAME NOTIFICATION VIEW ---
  if (showQuizCompleted) {
    return (
      <div className="absolute inset-0 z-[200]">
        {isSaving && (
          <div className="absolute inset-0 z-[300] flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
            <Loader2 className="animate-spin text-white w-10 h-10" />
          </div>
        )}
        <GameNotification
          type="SUCCESS"
          title="QUIZ COMPLETED!"
          message={""}
          points={500}
          onConfirm={handleQuizNotificationConfirm}
          confirmLabel={isSaving ? "SAVING..." : "BACK TO GAME"}
        />
      </div>
    );
  }

  // --- QUIZ VIEW ---
  return (
    <div className="absolute inset-0 bg-[#FDFBF7] flex flex-col items-center p-2 font-sans z-[150]">
      {/* 1. Header & Progress */}
      <div className="w-full max-w-3xl mb-3 flex items-center gap-3 shrink-0">
        <button
          onClick={handleClose}
          className="p-1.5 rounded-full bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-slate-100 transition-colors"
        >
          <X size={18} />
        </button>
        <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-indigo-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <span className="text-xs font-bold text-slate-400 min-w-[2.5rem] text-right">
          {currentIndex + 1} / {QUESTIONS.length}
        </span>
      </div>

      {/* 2. Main Card Container */}
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Question Header (Fixed at Top) */}
        <div className="px-6 py-4 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <div className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-indigo-100">
              <Bug size={10} />
              Debugging Challenge
            </div>
          </div>
          <h2 className="text-lg font-bold text-slate-800 leading-snug">
            {currentQuestion.description}
          </h2>
        </div>

        {/* SCROLLABLE CONTENT AREA (Code + Options) */}
        <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          {/* Code Snippet */}
          <div className="bg-slate-900 px-6 py-4 relative group">
            <div className="absolute top-2 right-3 text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold select-none">
              {currentQuestion.language}
            </div>
            <pre className="font-mono text-xs text-slate-50 overflow-x-auto leading-relaxed max-h-32 scrollbar-thin scrollbar-thumb-slate-700">
              <code>{currentQuestion.codeSnippet}</code>
            </pre>
          </div>

          {/* Options & Feedback Area */}
          <div className="p-6 bg-slate-50/50">
            <div className="space-y-2.5">
              {currentQuestion.options.map((option) => {
                const isSelected = selectedOptionId === option.id;
                const isCorrectOption =
                  option.id === currentQuestion.correctOptionId;

                let containerClasses =
                  "bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50 cursor-pointer text-slate-600";
                let icon = (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300 transition-all" />
                );

                if (isSelected) {
                  containerClasses =
                    "bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500 text-indigo-700";
                  icon = (
                    <div className="w-4 h-4 rounded-full border-[4px] border-indigo-600 bg-white transition-all" />
                  );
                }

                if (isSubmitted) {
                  if (isSelected && !isCorrectOption) {
                    containerClasses =
                      "bg-rose-50 border-rose-500 ring-1 ring-rose-500 text-rose-800 opacity-80";
                    icon = <XCircle className="w-4 h-4 text-rose-500" />;
                  } else if (isSelected && isCorrectOption) {
                    containerClasses =
                      "bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500 text-emerald-800";
                    icon = (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    );
                  } else {
                    containerClasses = "opacity-40 grayscale";
                  }
                }

                return (
                  <motion.button
                    key={option.id}
                    whileHover={!isSubmitted ? { scale: 1.01 } : {}}
                    whileTap={!isSubmitted ? { scale: 0.99 } : {}}
                    onClick={() => handleOptionSelect(option.id)}
                    disabled={isSubmitted}
                    className={`w-full text-left p-3 rounded-lg border-2 flex items-start gap-3 transition-all duration-200 text-sm ${containerClasses}`}
                  >
                    <div className="shrink-0 mt-0.5">{icon}</div>
                    <span className="font-medium leading-relaxed">
                      {option.text}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Feedback Section (Animated) */}
            <AnimatePresence>
              {isSubmitted && (
                <motion.div
                  initial={{ opacity: 0, y: 8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 overflow-hidden"
                >
                  <div
                    className={`rounded-xl p-4 border text-sm ${
                      selectedOptionId === currentQuestion.correctOptionId
                        ? "bg-emerald-100/50 border-emerald-100 text-emerald-900"
                        : "bg-rose-100/50 border-rose-100 text-rose-900"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold mb-1.5">
                      {selectedOptionId === currentQuestion.correctOptionId ? (
                        <>
                          <Lightbulb size={16} className="text-emerald-600" />
                          <span>Analysis Correct</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={16} className="text-rose-600" />
                          <span>Incorrect Analysis</span>
                        </>
                      )}
                    </div>
                    <p className="leading-relaxed opacity-90">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer Actions (Fixed at Bottom) */}
        <div className="p-4 bg-white border-t border-slate-100 flex justify-end shrink-0 z-10">
          {!isSubmitted ? (
            <button
              onClick={handleSubmit}
              disabled={!selectedOptionId}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg text-xs font-bold shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 active:scale-95"
            >
              Check Answer
            </button>
          ) : selectedOptionId !== currentQuestion.correctOptionId ? (
            <button
              onClick={handleRetry}
              className="bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-200 px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 active:scale-95"
            >
              <RotateCcw size={16} />
              Try Again
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2 rounded-lg text-xs font-bold shadow-lg shadow-slate-200 transition-all flex items-center gap-2 active:scale-95"
            >
              {currentIndex < QUESTIONS.length - 1 ? "Next" : "Finish Quiz"}
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
