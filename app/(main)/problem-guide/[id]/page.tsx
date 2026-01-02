"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import GuideRenderer from "@/app/components/problems/GuideRenderer";
import { ProblemGuide } from "@/lib/types";
import { ArrowLeft, Play } from "lucide-react";
import Link from "next/link";

export default function ProblemGuidePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [guide, setGuide] = useState<ProblemGuide | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  // ===============================
  // FETCH
  // ===============================
  useEffect(() => {
    if (!id) return;

    const fetchGuide = async () => {
      try {
        const res = await fetch(`/api/problem-guide?problemId=${id}`);
        const data = await res.json();

        if (data) {
          setGuide(data);
        } else {
          // Guide not found, redirect to problem page
          setRedirecting(true);
          router.replace(`/problem/${id}`);
        }
      } catch (error) {
        console.error("❌ Failed to fetch guide:", error);
        // On error, also redirect to problem page
        setRedirecting(true);
        router.replace(`/problem/${id}`);
      } finally {
        setLoading(false);
      }
    };

    fetchGuide();
  }, [id, router]);

  // ===============================
  // REDIRECTING STATE
  // ===============================
  if (redirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-700 rounded-lg mb-4 w-48 mx-auto"></div>
              <p className="text-gray-400 mb-6">Redirecting to problem...</p>
              <div className="h-4 bg-gray-700 rounded-lg w-32 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===============================
  // LOADING STATE
  // ===============================
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-800 border border-gray-700 rounded-lg mb-6 w-32"></div>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 bg-gray-700 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===============================
  // MAIN CONTENT (Guide exists)
  // ===============================
  if (guide) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Navigation */}
          <div className="mb-6 flex items-center justify-between">
            <Link
              href={`/learn/${guide.level}`}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors"
            >
              <ArrowLeft size={18} />
              <span>Back to {guide.level} Problems</span>
            </Link>

            {/* Start Button */}
            <Link
              href={`/problem/${id}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Play size={18} />
              <span>Start</span>
            </Link>
          </div>

          {/* Guide Content */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <GuideRenderer guideContent={guide.guideContent ?? []} />
          </div>
        </div>
      </div>
    );
  }

  // ===============================
  // FALLBACK (Should not reach here due to redirect)
  // ===============================
  return null;
}
