"use client";

import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { GuideBlock } from "@/lib/types";
import { Hash, FileText, Code, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, ReactNode } from "react";
import { Image as ImgIcon } from "lucide-react";
import Image from "next/image";

interface Props {
  guideContent?: GuideBlock[];
}

const iconMap = {
  h1: Hash,
  h2: Hash,
  h3: Hash,
  text: FileText,
  code: Code,
  blank: FileText,
  image: ImgIcon,
};

interface CodeComponentProps {
  node?: unknown;
  inline?: boolean;
  className?: string;
  children?: ReactNode;
}

// Function to parse text with inline code AND bold text
const parseTextWithFormatting = (content: string) => {
  // First split by bold markers, then by code markers
  const parts = content.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  return parts.map((part, index) => {
    // Check if this part is bold text (wrapped in **)
    if (part.startsWith("**") && part.endsWith("**")) {
      // Remove the asterisks and wrap in strong element
      const boldContent = part.slice(2, -2);
      return (
        <strong key={index} className="font-semibold text-gray-100">
          {boldContent}
        </strong>
      );
    }

    // Check if this part is inline code (wrapped in backticks)
    else if (part.startsWith("`") && part.endsWith("`")) {
      // Remove the backticks and wrap in code element
      const codeContent = part.slice(1, -1);
      return (
        <code
          key={index}
          className="bg-yellow-900/30 text-yellow-300 px-1.5 py-0.5 rounded text-sm font-mono border border-yellow-800/50"
        >
          {codeContent}
        </code>
      );
    }

    // Regular text - handle newlines
    else if (part.includes("\n")) {
      const lines = part.split("\n").filter((line) => line !== "");
      return lines.map((line, lineIndex) => (
        <span key={`${index}-${lineIndex}`}>
          {line}
          {lineIndex < lines.length - 1 && <br />}
        </span>
      ));
    }

    return <span key={index}>{part}</span>;
  });
};

export default function GuideRenderer({ guideContent }: Props) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);

      setTimeout(() => {
        setCopiedIndex(null);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  return (
    <div className="space-y-6">
      {guideContent?.map((block, index) => {
        const Icon = iconMap[block.type as keyof typeof iconMap];

        // Handle blank lines
        if (block.type === "blank") {
          return <div key={index} className="h-4" />; // Adds vertical spacing
        }

        // Handle h1, h2, h3 headings
        if (block.type === "h1" || block.type === "h2" || block.type === "h3") {
          const headingLevel = block.type;
          const fontSize = {
            h1: "text-3xl",
            h2: "text-2xl",
            h3: "text-xl",
          }[headingLevel];

          const spacing = {
            h1: "mb-4",
            h2: "mb-3",
            h3: "mb-2",
          }[headingLevel];

          return (
            <div key={index} className={`space-y-2 ${spacing}`}>
              <div className="flex items-center gap-3">
                {Icon && (
                  <div className="p-2 bg-blue-900/20 rounded-lg">
                    <Icon className="w-5 h-5 text-blue-400" />
                  </div>
                )}
                {headingLevel === "h1" && (
                  <h1
                    className={`${fontSize} font-bold text-gray-200 tracking-tight`}
                  >
                    {parseTextWithFormatting(block.content)}
                  </h1>
                )}
                {headingLevel === "h2" && (
                  <h2
                    className={`${fontSize} font-bold text-gray-200 tracking-tight`}
                  >
                    {parseTextWithFormatting(block.content)}
                  </h2>
                )}
                {headingLevel === "h3" && (
                  <h3
                    className={`${fontSize} font-bold text-gray-200 tracking-tight`}
                  >
                    {parseTextWithFormatting(block.content)}
                  </h3>
                )}
              </div>
              <div className="h-px bg-gradient-to-r from-blue-600/20 via-gray-600 to-transparent" />
            </div>
          );
        }

        if (block.type === "text") {
          return (
            <div key={index} className="group">
              <div className="flex gap-4">
                {Icon && (
                  <div className="flex-shrink-0">
                    <div className="p-1.5 bg-gray-700 rounded-lg">
                      <Icon className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                )}
                <p className="text-gray-300 leading-relaxed text-base">
                  {parseTextWithFormatting(block.content)}
                </p>
              </div>
            </div>
          );
        }

        if (block.type === "image") {
          const src = block.content.startsWith("/")
            ? block.content
            : `/${block.content}`;
          const Icon = iconMap.image;

          return (
            <div key={index} className="group">
              <div className="flex items-start gap-4">
                {Icon && (
                  <div className="shrink-0">
                    <div className="p-1.5 bg-gray-700 rounded-lg">
                      <Icon className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                )}
                <div className="relative w-full h-[300px] md:h-[400px] lg:h-[500px]">
                  <Image
                    src={src}
                    alt={`guide-img-${index}`}
                    fill
                    className="object-contain rounded-lg"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority={index === 0} // optional: mark first image as high-priority for LCP
                  />
                </div>
              </div>
            </div>
          );
        }

        if (block.type === "code") {
          const markdown = `\`\`\`${block.language || ""}
${block.content}
\`\`\``;

          const isCopied = copiedIndex === index;

          return (
            <div
              key={index}
              className="group rounded-lg overflow-hidden border border-gray-700 bg-gray-900 hover:border-gray-600 transition-all duration-200"
            >
              <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  {Icon && <Icon className="w-4 h-4 text-blue-400" />}
                  <span className="text-sm font-medium text-gray-300">
                    {block.language || "code"}
                  </span>
                  <div className="flex items-center gap-2">
                    {block.language === "python" && (
                      <span className="text-xs px-2 py-0.5 bg-yellow-900/30 text-yellow-400 rounded">
                        Python
                      </span>
                    )}
                    {block.language === "javascript" && (
                      <span className="text-xs px-2 py-0.5 bg-yellow-900/30 text-yellow-400 rounded">
                        JS
                      </span>
                    )}
                    {block.language === "typescript" && (
                      <span className="text-xs px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded">
                        TS
                      </span>
                    )}
                    {block.language === "java" && (
                      <span className="text-xs px-2 py-0.5 bg-red-900/30 text-red-400 rounded">
                        Java
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleCopyCode(block.content, index)}
                  className={`
                    flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-colors border
                    ${
                      isCopied
                        ? "bg-green-900/30 text-green-400 border-green-800/50 hover:bg-green-900/40"
                        : "text-gray-400 border-gray-600 hover:text-gray-200 hover:bg-gray-700"
                    }
                  `}
                >
                  {isCopied ? (
                    <>
                      <Check size={14} />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-0 overflow-x-auto">
                <ReactMarkdown
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    pre: ({ children }) => (
                      <pre className="!m-0 !p-4 bg-transparent !bg-gray-900">
                        {children}
                      </pre>
                    ),
                    code: ({
                      className,
                      children,
                      ...props
                    }: CodeComponentProps) => (
                      <code
                        className={cn(
                          className,
                          "!font-mono text-sm !bg-transparent text-gray-200"
                        )}
                        {...props}
                      >
                        {children}
                      </code>
                    ),
                  }}
                >
                  {markdown}
                </ReactMarkdown>
              </div>
            </div>
          );
        }

        // Default text rendering for unknown types
        return (
          <div key={index} className="flex items-start gap-3">
            <div className="text-gray-300 leading-relaxed">
              {parseTextWithFormatting(block.content)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
