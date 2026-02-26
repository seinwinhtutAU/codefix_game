"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { Problem } from "@/lib/types";
import { ChevronDown, ChevronUp, Clock, Lock } from "lucide-react";
import ReactMarkdown, { Components } from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { checkExistingSolveRecord } from "@/services";
import Link from "next/link";

interface Props {
  problem: Problem;
  isOpen: boolean;
  totalTimeSpent?: number;
  userId: string;
  hasCompleted?: boolean;
}

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
};

const CodeBlock = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  if (!className?.includes("language-")) {
    return (
      <code className="bg-red-500/20 text-red-100 px-2 py-0.5 rounded border border-red-500/30 font-mono text-xs">
        {children}
      </code>
    );
  }

  const processMarkTags = (codeString: string): ReactNode[] => {
    const processed = codeString.replace(
      /<mark>(.*?)<\/mark>/g,
      "___MARK_START___$1___MARK_END___"
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
              <span className="text-yellow-300 font-semibold bg-yellow-300/10 px-2 py-0.5 rounded">
                {part}
              </span>
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 from-transparent via-yellow-400 to-transparent"></span>
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
        )
      );
    }
    return children;
  };

  return (
    <div className="relative group">
      <div
        className="relative"
        onCopy={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
      >
        <pre className="bg-black rounded-lg p-4 overflow-x-auto my-3 select-none cursor-not-allowed border border-gray-800">
          <code className={`${className} text-xs md:text-sm`}>
            {renderContent()}
          </code>
        </pre>
      </div>

      <div className="absolute top-2 right-2 flex items-center gap-1 bg-gray-900/90 text-gray-400 text-[10px] px-2 py-1 rounded-full border border-gray-700">
        <Lock size={10} />
        <span>Protected</span>
      </div>
    </div>
  );
};

export default function ProblemDescription({
  problem,
  isOpen,
  totalTimeSpent,
  userId,
  hasCompleted,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [pointsEarned, setPointsEarned] = useState<number | null>(null);

  // Fetch solve record
  useEffect(() => {
    if (!problem._id || !userId || userId === "null") return;

    const fetchSolveRecord = async () => {
      try {
        const record = await checkExistingSolveRecord(userId, problem._id);
        setPointsEarned(record?.data?.pointsEarned ?? 0);
      } catch (error) {
        setPointsEarned(0);
      }
    };

    fetchSolveRecord();
    if (hasCompleted) {
      const timeoutId = setTimeout(fetchSolveRecord, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [problem._id, userId, hasCompleted]);

  // Check if content is long enough to show "More"
  useEffect(() => {
    const checkCanExpand = () => {
      if (contentRef.current) {
        // 160px corresponds to max-h-40
        const isLong = contentRef.current.scrollHeight > 165;
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
    mark({ children, ...props }) {
      return (
        <span className="relative inline-block font-mono mx-0.5" {...props}>
          <span className="text-red-300 font-semibold bg-red-500/10 px-2 py-0.5 rounded">
            {children}
          </span>
          <span className="absolute -bottom-1 left-0 right-0 h-0.5 from-transparent via-red-400 to-transparent"></span>
        </span>
      );
    },
    // Heading components for text size control
    h1({ children, ...props }) {
      return (
        <h1 className="text-3xl font-bold text-white mt-6 mb-3" {...props}>
          {children}
        </h1>
      );
    },
    h2({ children, ...props }) {
      return (
        <h2 className="text-2xl font-bold text-white mt-5 mb-2" {...props}>
          {children}
        </h2>
      );
    },
    h3({ children, ...props }) {
      return (
        <h3 className="text-xl font-bold text-white mt-4 mb-2" {...props}>
          {children}
        </h3>
      );
    },
    h4({ children, ...props }) {
      return (
        <h4 className="text-lg font-bold text-white mt-3 mb-2" {...props}>
          {children}
        </h4>
      );
    },
    h5({ children, ...props }) {
      return (
        <h5 className="text-base font-bold text-white mt-2 mb-1" {...props}>
          {children}
        </h5>
      );
    },
    h6({ children, ...props }) {
      return (
        <h6 className="text-sm font-bold text-white mt-2 mb-1" {...props}>
          {children}
        </h6>
      );
    },
    // Add paragraph styling for consistency
    p({ children, ...props }) {
      return (
        <p className="text-gray-300 mb-3 leading-relaxed" {...props}>
          {children}
        </p>
      );
    },
    // Add list styling
    ul({ children, ...props }) {
      return (
        <ul className="text-gray-300 mb-3 ml-5 list-disc" {...props}>
          {children}
        </ul>
      );
    },
    ol({ children, ...props }) {
      return (
        <ol className="text-gray-300 mb-3 ml-5 list-decimal" {...props}>
          {children}
        </ol>
      );
    },
    li({ children, ...props }) {
      return (
        <li className="mb-1" {...props}>
          {children}
        </li>
      );
    },
    // Add blockquote styling
    blockquote({ children, ...props }) {
      return (
        <blockquote
          className="border-l-4 border-blue-500 pl-4 my-4 italic text-gray-400"
          {...props}
        >
          {children}
        </blockquote>
      );
    },
    // Add strong/bold styling (alternative to mark)
    strong({ children, ...props }) {
      return (
        <strong className="font-bold text-white" {...props}>
          {children}
        </strong>
      );
    },
    // Add emphasis/italic styling
    em({ children, ...props }) {
      return (
        <em className="italic text-gray-200" {...props}>
          {children}
        </em>
      );
    },
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg transition-all duration-300">
      <div className="p-5">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0 animate-pulse" />
              <Link
                href={`/learn/${problem.difficulty.toLowerCase()}`}
                className="group flex items-center gap-1 min-w-0"
              >
                <h1 className="text-xl font-bold text-white truncate hover:text-blue-400 transition-colors">
                  {problem.difficulty.toUpperCase()}
                </h1>
                {/* Optional: subtle external link or arrow icon that shows on hover */}
                <ChevronDown
                  size={14}
                  className="text-gray-500 -rotate-90 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1"
                />
              </Link>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="flex items-center text-sm text-yellow-300 bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-700">
                ⭐{" "}
                <span className="ml-2 font-semibold">
                  {pointsEarned ?? 0} pts
                </span>
              </div>

              {totalTimeSpent !== undefined && (
                <div className="flex items-center text-sm text-gray-300 bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-700">
                  <Clock size={14} className="mr-2 text-blue-400" />
                  <span className="font-medium whitespace-nowrap">
                    {formatTime(totalTimeSpent)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="relative">
          <div
            ref={contentRef}
            className={`text-sm text-gray-300 leading-relaxed bg-gray-900 p-4 rounded-lg border border-gray-700 transition-all duration-300 overflow-y-auto ${
              isExpanded ? "max-h-[600px]" : "max-h-40"
            }`}
          >
            <h3 className="text-lg font-semibold text-white mb-2">
              {problem.title}
            </h3>
            <ReactMarkdown
              rehypePlugins={[rehypeHighlight]}
              components={markdownComponents}
            >
              {problem.description}
            </ReactMarkdown>
          </div>

          {/* More/Less Trigger */}
          {canExpand && (
            <>
              {!isExpanded && (
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none rounded-b-lg" />
              )}

              <div className="flex justify-center -mt-3 relative z-30">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-1 text-xs text-gray-300 bg-gray-800 px-4 py-1.5 rounded-full border border-gray-600 shadow-xl hover:bg-gray-700 hover:text-white transition-colors"
                >
                  <span>{isExpanded ? "Show Less" : "Show More"}</span>
                  {isExpanded ? (
                    <ChevronUp size={14} />
                  ) : (
                    <ChevronDown size={14} />
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
