import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Icon } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { colors, examColor } from "@/lib/colors";

export default function PaperView() {
  const nav = useNavigate();
  const { id = "" } = useParams();
  const { papers } = useApp();
  const [showAnswers, setShowAnswers] = useState(false);
  const paper = papers.find((p) => p.id === id);
  const ec = examColor(paper?.examType || "NEET");

  if (!paper) {
    return (
      <div className="min-h-full pt-12 px-4 max-w-[640px] mx-auto">
        <button onClick={() => nav(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: colors.secondary }}>
          <Icon name="arrow-left" size={18} color={colors.foreground} />
        </button>
        <div className="flex flex-col items-center justify-center pt-32 gap-3" style={{ color: colors.mutedForeground }}>
          <Icon name="file-x" size={40} color={colors.mutedForeground} />
          <div className="text-base">Paper not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full max-w-[640px] mx-auto">
      <div className="flex items-center gap-2.5 px-4 pt-12 pb-3 border-b bg-white sticky top-0 z-10" style={{ borderColor: colors.border }}>
        <button onClick={() => nav(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: colors.secondary }}>
          <Icon name="arrow-left" size={18} color={colors.foreground} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold truncate" style={{ color: colors.foreground }}>{paper.title}</div>
          <div className="text-xs" style={{ color: colors.mutedForeground }}>{paper.questions.length} questions • {paper.difficulty}</div>
        </div>
        <button
          onClick={() => setShowAnswers((v) => !v)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl border text-xs font-semibold"
          style={{
            background: showAnswers ? colors.neetLight : colors.secondary,
            borderColor: showAnswers ? colors.neet : colors.border,
            color: showAnswers ? colors.neet : colors.mutedForeground,
          }}
        >
          <Icon name={showAnswers ? "eye-off" : "eye"} size={15} color={showAnswers ? colors.neet : colors.mutedForeground} />
          {showAnswers ? "Hide" : "Answers"}
        </button>
      </div>

      <div className="px-4 pt-4 pb-8">
        <div className="rounded-2xl p-3.5 border mb-5" style={{ background: ec + "10", borderColor: ec + "40" }}>
          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
            <span className="text-white text-[11px] font-bold px-2 py-0.5 rounded-md" style={{ background: ec }}>{paper.examType}</span>
            <span className="text-xs" style={{ color: colors.mutedForeground }}>•</span>
            <span className="text-[13px]" style={{ color: colors.mutedForeground }}>{paper.subject}</span>
            <span className="text-xs" style={{ color: colors.mutedForeground }}>•</span>
            <span className="text-[13px]" style={{ color: colors.mutedForeground }}>{paper.topic === "All" ? "Mixed" : paper.topic}</span>
          </div>
          <div className="text-[11px]" style={{ color: colors.mutedForeground }}>
            Generated {new Date(paper.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>

        {paper.questions.map((q, idx) => (
          <div key={q.id} className="rounded-2xl p-4 mb-4 border bg-white shadow-sm" style={{ borderColor: colors.border }}>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[13px] font-bold" style={{ background: colors.primary }}>
                {idx + 1}
              </div>
              <div className="flex gap-1.5">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium" style={{ background: colors.secondary, color: colors.mutedForeground }}>{q.topic}</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium"
                  style={{
                    background: q.difficulty === "Easy" ? colors.neetLight : q.difficulty === "Moderate" ? colors.jeeLight : "#fee2e2",
                    color: q.difficulty === "Easy" ? colors.neet : q.difficulty === "Moderate" ? colors.jee : colors.destructive,
                  }}>
                  {q.difficulty}
                </span>
              </div>
            </div>

            <div className="text-sm font-medium leading-6 mb-3.5" style={{ color: colors.foreground }}>{q.text}</div>

            <div className="flex flex-col gap-2 mb-1">
              {q.options.map((opt, optIdx) => {
                const correct = showAnswers && optIdx === q.correctIndex;
                return (
                  <div key={optIdx} className="flex items-center gap-2 px-3 py-2.5 rounded-lg border"
                    style={{
                      background: correct ? colors.neetLight : colors.secondary,
                      borderColor: correct ? colors.neet : colors.border,
                    }}>
                    <span className="text-[13px] font-bold w-5" style={{ color: correct ? colors.neet : colors.mutedForeground }}>
                      {String.fromCharCode(65 + optIdx)}.
                    </span>
                    <span className="flex-1 text-[13px] leading-5" style={{ color: correct ? colors.neetForeground : colors.foreground }}>{opt}</span>
                    {correct && <Icon name="check-circle" size={16} color={colors.neet} />}
                  </div>
                );
              })}
            </div>

            {showAnswers && (
              <div className="rounded-lg p-3 mt-3" style={{ background: colors.muted }}>
                <div className="text-[11px] font-semibold mb-1" style={{ color: colors.mutedForeground }}>Explanation:</div>
                <div className="text-xs leading-5" style={{ color: colors.foreground }}>{q.explanation}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
