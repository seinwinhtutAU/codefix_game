"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { Problem } from "@/lib/types";
import {
  ChevronDown,
  ChevronUp,
  Lock,
  Target,
  Zap,
  Tag,
  BookOpen,
} from "lucide-react";
import ReactMarkdown, { Components } from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { checkExistingSolveRecord } from "@/services";

interface Props {
  problem: Problem;
  isOpen: boolean;
  totalTimeSpent?: number; // Kept in interface but unused visually as requested
  userId: string;
  hasCompleted?: boolean;
}

const CodeBlock = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  if (!className?.includes("language-")) {
    return (
      <code className="bg-rose-50 text-rose-500 px-1.5 py-0.5 rounded border border-rose-100 font-mono text-xs font-medium">
        {children}
      </code>
    );
  }

  const processMarkTags = (codeString: string): ReactNode[] => {
    const processed = codeString.replace(
      /<mark>(.*?)<\/mark>/g,
      "___MARK_START___$1___MARK_END___",
    );
    const parts = processed.split(/(___MARK_START___|___MARK_END___)/);

    return parts
      .map((part, index) => {
        if (part === "___MARK_START___" || part === "___MARK_END___")
          return null;
        if (index > 0 && parts[index - 1] === "___MARK_START___" && part) {
          return (
            <span
              key={index}
              className="relative inline-block font-mono mx-0.5"
            >
              <span className="text-amber-400 font-semibold bg-amber-400/10 px-2 py-0.5 rounded">
                {part}
              </span>
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 from-transparent via-amber-400 to-transparent"></span>
            </span>
          );
        }
        return part;
      })
      .filter(Boolean);
  };

  const renderContent = (): ReactNode => {
    if (typeof children === "string") return processMarkTags(children);
    if (Array.isArray(children)) {
      return children.map((child, idx) =>
        typeof child === "string" ? (
          <span key={idx}>{processMarkTags(child)}</span>
        ) : (
          child
        ),
      );
    }
    return children;
  };

  return (
    <div className="relative group my-3">
      <div
        className="relative"
        onCopy={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
      >
        <pre className="bg-slate-800 text-slate-50 rounded-xl p-4 overflow-x-auto select-none cursor-not-allowed shadow-inner border border-slate-700/50">
          <code
            className={`${className} text-xs md:text-sm font-mono leading-relaxed`}
          >
            {renderContent()}
          </code>
        </pre>
      </div>

      <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/10 backdrop-blur-md text-slate-300 text-[10px] px-2 py-1 rounded-full border border-white/10 shadow-sm">
        <Lock size={10} />
        <span className="font-medium">Protected</span>
      </div>
    </div>
  );
};

export default function ProblemDescription({
  problem,
  isOpen,
  userId,
  hasCompleted,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Difficulty Badge Logic
  const getDifficultyColor = (diff: string = "easy") => {
    switch (diff.toLowerCase()) {
      case "hard":
        return "bg-rose-50 text-rose-600 border-rose-200";
      case "medium":
        return "bg-amber-50 text-amber-600 border-amber-200";
      case "easy":
      default:
        return "bg-emerald-50 text-emerald-600 border-emerald-200";
    }
  };

  // Check if content is long enough to show "More"
  useEffect(() => {
    const checkCanExpand = () => {
      if (contentRef.current) {
        const isLong = contentRef.current.scrollHeight > 140; // Slightly reduced threshold
        setCanExpand(isLong);
      }
    };

    checkCanExpand();
    const resizeObserver = new ResizeObserver(checkCanExpand);
    if (contentRef.current) resizeObserver.observe(contentRef.current);
    return () => resizeObserver.disconnect();
  }, [problem.description]);

  if (!isOpen) return null;

  const markdownComponents: Components = {
    code({ className, children, ...props }) {
      return (
        <CodeBlock className={className} {...props}>
          {children}
        </CodeBlock>
      );
    },
    // ... (其他 markdown 组件保持不变)
    mark({ children, ...props }) {
      return (
        <span className="relative inline-block font-mono mx-0.5" {...props}>
          <span className="text-rose-500 font-semibold bg-rose-50 px-2 py-0.5 rounded">
            {children}
          </span>
          <span className="absolute -bottom-1 left-0 right-0 h-0.5 from-transparent via-rose-400 to-transparent"></span>
        </span>
      );
    },
    h1({ children, ...props }) {
      return (
        <h1 className="text-xl font-bold text-slate-800 mt-4 mb-3" {...props}>
          {children}
        </h1>
      );
    },
    h2({ children, ...props }) {
      return (
        <h2 className="text-lg font-bold text-slate-800 mt-4 mb-2" {...props}>
          {children}
        </h2>
      );
    },
    h3({ children, ...props }) {
      return (
        <h3 className="text-base font-bold text-slate-800 mt-3 mb-2" {...props}>
          {children}
        </h3>
      );
    },
    p({ children, ...props }) {
      return (
        <p className="text-slate-600 mb-3 leading-relaxed text-sm" {...props}>
          {children}
        </p>
      );
    },
    ul({ children, ...props }) {
      return (
        <ul className="text-slate-600 mb-3 ml-5 list-disc text-sm" {...props}>
          {children}
        </ul>
      );
    },
    ol({ children, ...props }) {
      return (
        <ol
          className="text-slate-600 mb-3 ml-5 list-decimal text-sm"
          {...props}
        >
          {children}
        </ol>
      );
    },
    li({ children, ...props }) {
      return (
        <li className="mb-1 pl-1" {...props}>
          {children}
        </li>
      );
    },
    blockquote({ children, ...props }) {
      return (
        <blockquote
          className="border-l-4 border-indigo-400 pl-4 my-4 italic text-slate-500 bg-slate-50 py-2 pr-2 rounded-r-lg text-sm"
          {...props}
        >
          {children}
        </blockquote>
      );
    },
    strong({ children, ...props }) {
      return (
        <strong className="font-bold text-slate-800" {...props}>
          {children}
        </strong>
      );
    },
  };

  return (
    <div className="bg-white/90 backdrop-blur-md border border-white/50 rounded-2xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] transition-all duration-300 w-full overflow-hidden flex flex-col">
      {/* 1. Header Area: Meta Info (Tags, Difficulty) */}
      <div className="px-5 pt-4 pb-2 flex flex-wrap items-center gap-2 border-b border-transparent">
        {/* Difficulty Badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wide ${getDifficultyColor(
            problem.difficulty,
          )}`}
        >
          <Zap size={10} fill="currentColor" />
          <span>{problem.difficulty || "Easy"}</span>
        </div>

        {/* Category / Task Type Badge (Example) */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-bold uppercase tracking-wide">
          <Target size={10} />
          <span>Challenge</span>
        </div>

        {/* Optional: Add tags if problem has them */}
        {/* {problem.tags?.map(tag => (
           <div key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 text-slate-500 border border-slate-100 text-[10px]">
             <Tag size={10} />
             {tag}
           </div>
        ))} */}

        {/* Decorative "Read" Icon on far right */}
        <div className="ml-auto text-slate-300">
          <BookOpen size={16} />
        </div>
      </div>

      {/* 2. Content Area */}
      <div className="px-5 pb-5 relative">
        <div
          ref={contentRef}
          className={`text-sm text-slate-600 leading-relaxed transition-all duration-500 ease-in-out overflow-hidden ${
            isExpanded
              ? "max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent"
              : "max-h-24"
          }`}
        >
          {/* Main Description */}
          <ReactMarkdown
            rehypePlugins={[rehypeHighlight]}
            components={markdownComponents}
          >
            {problem.description}
          </ReactMarkdown>
        </div>

        {/* 3. Expand/Collapse Trigger */}
        {canExpand && (
          <>
            {/* Fade Overlay when collapsed */}
            {!isExpanded && (
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none" />
            )}

            {/* Toggle Button */}
            <div
              className={`flex justify-center relative z-10 ${isExpanded ? "mt-4" : "mt-1"}`}
            >
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="group flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-white px-4 py-1.5 rounded-full border border-slate-100 shadow-sm hover:shadow-md hover:text-indigo-500 hover:border-indigo-100 transition-all active:scale-95"
              >
                <span>{isExpanded ? "Show Less" : "Read More"}</span>
                <div
                  className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                >
                  <ChevronDown size={12} strokeWidth={3} />
                </div>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
