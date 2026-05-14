import { useState, useEffect } from "react";
import OpenAI from "openai";
import styles from "./sidebar.css?inline";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

type Analysis = {
  fitScore: number;
  title: string;
  company: string;
  whyMatch: string[];
  concerns: string[];
  stack: string[];
  missingSkills: string[];
  interviewTopics: string[];
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  shadowRoot: ShadowRoot;
};

export default function Sidebar({ isOpen, onClose, shadowRoot }: Props) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Инжектируем Tailwind CSS в shadow DOM
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
    :host { all: initial; display: block; }
    :host * { box-sizing: border-box; }
    ${styles}
  `;
    shadowRoot.appendChild(style);
    return () => style.remove();
  }, [shadowRoot]);

  async function analyze() {
    setLoading(true);
    setError(null);

    try {
      const fullText = document.body.innerText.slice(0, 6000);

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are helping a frontend developer evaluate job postings. Always respond with valid JSON only, no markdown, no code blocks.",
          },
          {
            role: "user",
            content: `
              Here is the text from the job posting page:
              ${fullText}

              My profile: senior frontend developer, 7 years of Vue.js experience, basic React knowledge, TypeScript, strong CSS/HTML skills.

              Extract the job title and company name from the text above.
              Then evaluate how well my profile matches this job.

              Return ONLY valid JSON, no markdown, no code blocks:
              {
                "fitScore": number from 0 to 100,
                "title": "job title extracted from the text",
                "company": "company name extracted from the text",
                "whyMatch": ["reason 1", "reason 2", "reason 3"],
                "concerns": ["concern 1", "concern 2"],
                "stack": ["technology 1", "technology 2"],
                "missingSkills": ["skill 1", "skill 2"],
                "interviewTopics": ["topic 1", "topic 2", "topic 3"]
              }
            `,
          },
        ],
      });

      const text = response.choices[0].message.content ?? "";
      const parsed: Analysis = JSON.parse(text);
      setAnalysis(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const scoreColor =
    analysis && analysis.fitScore >= 70
      ? "text-emerald-400"
      : analysis && analysis.fitScore >= 40
        ? "text-amber-400"
        : "text-red-400";

  const scoreBarColor =
    analysis && analysis.fitScore >= 70
      ? "bg-emerald-400"
      : analysis && analysis.fitScore >= 40
        ? "bg-amber-400"
        : "bg-red-400";

  if (!isOpen) return null;

  return (
    <div
      className="fixed bottom-4 right-4 w-[480px] max-h-[80vh] overflow-y-auto bg-[#1a1a2e] text-white font-sans rounded-2xl shadow-2xl border border-white/10"
      style={{ fontSize: "16px", zIndex: 999998 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 sticky top-0 bg-[#1a1a2e]">
        <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="font-semibold text-sm tracking-wide">
          AI Job Match
        </span>
        <button
          onClick={onClose}
          className="ml-auto text-white/40 hover:text-white/80 transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="px-4 py-4 space-y-3">
        {!analysis && !loading && (
          <div className="text-center py-8">
            <p className="text-white/40 text-sm mb-4">
              Click analyze to evaluate this job posting
            </p>
            <button
              onClick={analyze}
              className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 transition-colors text-sm font-medium"
            >
              Analyze Job
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-white/40 text-sm">Analyzing job posting...</p>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
            <p className="text-red-400 text-xs">{error}</p>
          </div>
        )}

        {analysis && (
          <>
            <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
              <p className="text-white/40 text-[11px] uppercase tracking-widest mb-2">
                Fit Score
              </p>
              <div className="flex items-baseline gap-2 mb-2">
                <span className={`text-4xl font-bold ${scoreColor}`}>
                  {analysis.fitScore}
                </span>
                <span className="text-white/30 text-lg">/100</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${scoreBarColor}`}
                  style={{ width: `${analysis.fitScore}%` }}
                />
              </div>
              <p className="text-white/50 text-xs mt-2">
                {analysis.title} · {analysis.company}
              </p>
            </div>

            <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
              <div className="flex items-center justify-between mb-3">
                <p className="text-white/40 text-[11px] uppercase tracking-widest">
                  Skills Match
                </p>
                <span className="text-white/30 text-xs">
                  {analysis.stack.length} found
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {analysis.stack.map((skill, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-md text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {analysis.missingSkills.length > 0 && (
              <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-white/40 text-[11px] uppercase tracking-widest">
                    Missing Skills
                  </p>
                  <span className="text-amber-400/70 text-xs">
                    {analysis.missingSkills.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {analysis.missingSkills.map((skill, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-white/70 text-xs">{skill}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">
                        Gap
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
              <p className="text-white/40 text-[11px] uppercase tracking-widest mb-3">
                Why You Match
              </p>
              <ul className="space-y-2">
                {analysis.whyMatch.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-white/60"
                  >
                    <span className="text-emerald-400 mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {analysis.concerns.length > 0 && (
              <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
                <p className="text-white/40 text-[11px] uppercase tracking-widest mb-3">
                  Concerns
                </p>
                <ul className="space-y-2">
                  {analysis.concerns.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs text-white/60"
                    >
                      <span className="text-amber-400 mt-0.5">⚠</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
              <p className="text-white/40 text-[11px] uppercase tracking-widest mb-3">
                Interview Prep
              </p>
              <ul className="space-y-2">
                {analysis.interviewTopics.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-white/60"
                  >
                    <span className="text-violet-400 mt-0.5">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={analyze}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-sm text-white/60 hover:text-white/80"
            >
              Analyze again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
