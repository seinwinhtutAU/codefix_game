"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Bug,
  ArrowRight,
  X,
  Lightbulb,
  Trophy,
  AlertTriangle,
  RotateCcw, // Added icon for Retry
} from "lucide-react";

// --- TYPES ---
type Option = {
  id: string;
  text: string;
};

type Question = {
  id: string;
  title: string;
  description: string;
  codeSnippet: string; // The buggy code
  language: "python" | "javascript";
  options: Option[];
  correctOptionId: string;
  explanation: string; // The learning moment
};

// --- MOCK DATA (Debugging Scenarios) ---
const QUESTIONS: Question[] = [
  {
    id: "q1",
    title: "Index Out of Bounds",
    description:
      "The following Python code crashes. What is the cause of the `IndexError`?",
    codeSnippet: `numbers = [10, 20, 30]
# Trying to print the last element
print(numbers[3])`,
    language: "python",
    options: [
      { id: "A", text: "The list `numbers` is empty." },
      {
        id: "B",
        text: "List indices start at 0, so the last index is 2, not 3.",
      },
      { id: "C", text: "You cannot print integers directly in Python." },
      {
        id: "D",
        text: "The syntax for accessing lists uses parentheses `()`, not brackets `[]`.",
      },
    ],
    correctOptionId: "B",
    explanation:
      "Correct! In Python (and most languages), lists are 0-indexed. For a list of length 3, the valid indices are 0, 1, and 2. Accessing `numbers[3]` tries to get the 4th element, which doesn't exist.",
  },
  {
    id: "q2",
    title: "Infinite Loop",
    description:
      "This code is supposed to count down, but it runs forever. Why?",
    codeSnippet: `count = 10
while count > 0:
    print(count)
    count = count + 1`,
    language: "python",
    options: [
      { id: "A", text: "The `while` condition should be `count < 0`." },
      { id: "B", text: "The variable `count` is initialized incorrectly." },
      {
        id: "C",
        text: "The code increments `count` instead of decrementing it.",
      },
      {
        id: "D",
        text: "The `print` statement prevents the loop from finishing.",
      },
    ],
    correctOptionId: "C",
    explanation:
      "Spot on! Logic error. To count *down*, you need to subtract from `count` (`count -= 1`). By adding 1, `count` keeps getting larger (11, 12, 13...), so it stays > 0 forever.",
  },
  {
    id: "q3",
    title: "Variable Scope",
    description: "Why does this code throw a `NameError`?",
    codeSnippet: `def calculate_total():
    tax = 0.05
    return 100 * tax

# Trying to print the tax rate
print(tax)`,
    language: "python",
    options: [
      {
        id: "A",
        text: "`tax` is defined inside the function, so it's not accessible outside.",
      },
      { id: "B", text: "The function `calculate_total` was never called." },
      { id: "C", text: "Variable names cannot be only 3 letters long." },
      { id: "D", text: "You must use `global` to print variables." },
    ],
    correctOptionId: "A",
    explanation:
      "Exactly. This is a Scope issue. Variables defined inside a function are 'local' to that function. The main program doesn't know what `tax` is.",
  },
];

export default function DebuggingQuizPage() {
  const router = useRouter();

  // State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = QUESTIONS[currentIndex];
  const progressPercent = ((currentIndex + 1) / QUESTIONS.length) * 100;

  const handleOptionSelect = (id: string) => {
    if (isSubmitted) return; // Prevent changing after submit
    setSelectedOptionId(id);
  };

  const handleSubmit = () => {
    if (!selectedOptionId) return;
    setIsSubmitted(true);
    if (selectedOptionId === currentQuestion.correctOptionId) {
      setScore((prev) => prev + 1);
    }
  };

  // Logic for resetting state when user gets it wrong and wants to try again
  const handleRetry = () => {
    setIsSubmitted(false);
    setSelectedOptionId(null);
  };

  const handleNext = () => {
    if (currentIndex < QUESTIONS.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOptionId(null);
      setIsSubmitted(false);
    } else {
      setIsFinished(true);
    }
  };

  // --- RESULT VIEW ---
  if (isFinished) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4 font-sans">
        <div className="bg-white max-w-md w-full rounded-3xl shadow-xl p-8 text-center border border-slate-100 animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="text-indigo-500 w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            Quiz Completed!
          </h1>
          <p className="text-slate-500 mb-8">
            You scored{" "}
            <strong className="text-indigo-600 text-lg">{score}</strong> out of{" "}
            {QUESTIONS.length}
          </p>

          <div className="space-y-3">
            <button
              onClick={() => router.push("/game")} // Modify this route
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-indigo-200 active:scale-95"
            >
              Back to Game
            </button>
            <button
              onClick={() => {
                setIsFinished(false);
                setCurrentIndex(0);
                setScore(0);
                setIsSubmitted(false);
                setSelectedOptionId(null);
              }}
              className="w-full bg-white hover:bg-slate-50 text-slate-600 font-bold py-3 rounded-xl border border-slate-200 transition-all"
            >
              Review / Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- QUIZ VIEW ---
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center py-10 px-4 font-sans">
      {/* 1. Header & Progress */}
      <div className="w-full max-w-2xl mb-6 flex items-center gap-4 shrink-0">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-slate-100 transition-colors"
        >
          <X size={20} />
        </button>
        <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-indigo-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <span className="text-sm font-bold text-slate-400 min-w-[3rem] text-right">
          {currentIndex + 1} / {QUESTIONS.length}
        </span>
      </div>

      {/* 2. Main Card Container */}
      {/* max-h-[85vh] prevents card from growing too large on desktop */}
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Question Header (Fixed at Top) */}
        <div className="px-8 py-6 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-indigo-100">
              <Bug size={12} />
              Debugging Challenge
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-800 leading-snug">
            {currentQuestion.description}
          </h2>
        </div>

        {/* SCROLLABLE CONTENT AREA (Code + Options) */}
        <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          {/* Code Snippet */}
          <div className="bg-slate-900 px-8 py-6 relative group">
            <div className="absolute top-3 right-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold select-none">
              {currentQuestion.language}
            </div>
            {/* Added max-h-48 to handle very long code blocks gracefully */}
            <pre className="font-mono text-sm text-slate-50 overflow-x-auto leading-relaxed max-h-48 scrollbar-thin scrollbar-thumb-slate-700">
              <code>{currentQuestion.codeSnippet}</code>
            </pre>
          </div>

          {/* Options & Feedback Area */}
          <div className="p-8 bg-slate-50/50">
            <div className="space-y-3">
              {currentQuestion.options.map((option) => {
                const isSelected = selectedOptionId === option.id;
                const isCorrectOption =
                  option.id === currentQuestion.correctOptionId;

                // Dynamic Styling Logic
                let containerClasses =
                  "bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50 cursor-pointer text-slate-600";
                let icon = (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-300 transition-all" />
                );

                if (isSelected) {
                  containerClasses =
                    "bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500 text-indigo-700";
                  icon = (
                    <div className="w-5 h-5 rounded-full border-[5px] border-indigo-600 bg-white transition-all" />
                  );
                }

                if (isSubmitted) {
                  if (isSelected && !isCorrectOption) {
                    containerClasses =
                      "bg-rose-50 border-rose-500 ring-1 ring-rose-500 text-rose-800 opacity-80";
                    icon = <XCircle className="w-5 h-5 text-rose-500" />;
                  } else if (isSelected && isCorrectOption) {
                    containerClasses =
                      "bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500 text-emerald-800";
                    icon = (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
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
                    className={`w-full text-left p-4 rounded-xl border-2 flex items-start gap-4 transition-all duration-200 ${containerClasses}`}
                  >
                    <div className="shrink-0 mt-0.5">{icon}</div>
                    <span className="font-medium text-sm leading-relaxed">
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
                  initial={{ opacity: 0, y: 10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 overflow-hidden"
                >
                  <div
                    className={`rounded-2xl p-5 border ${
                      selectedOptionId === currentQuestion.correctOptionId
                        ? "bg-emerald-100/50 border-emerald-100 text-emerald-900"
                        : "bg-rose-100/50 border-rose-100 text-rose-900"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold mb-2">
                      {selectedOptionId === currentQuestion.correctOptionId ? (
                        <>
                          <Lightbulb size={18} className="text-emerald-600" />
                          <span>Analysis Correct</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={18} className="text-rose-600" />
                          <span>Incorrect Analysis</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed opacity-90">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer Actions (Fixed at Bottom) */}
        <div className="p-6 bg-white border-t border-slate-100 flex justify-end shrink-0 z-10">
          {!isSubmitted ? (
            <button
              onClick={handleSubmit}
              disabled={!selectedOptionId}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 active:scale-95"
            >
              Check Answer
            </button>
          ) : selectedOptionId !== currentQuestion.correctOptionId ? (
            // Wrong Answer: Show Try Again
            <button
              onClick={handleRetry}
              className="bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-200 px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 active:scale-95"
            >
              <RotateCcw size={18} />
              Try Again
            </button>
          ) : (
            // Correct Answer: Show Next
            <button
              onClick={handleNext}
              className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg shadow-slate-200 transition-all flex items-center gap-2 active:scale-95"
            >
              {currentIndex < QUESTIONS.length - 1 ? "Next" : "Finish Quiz"}
              <ArrowRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
