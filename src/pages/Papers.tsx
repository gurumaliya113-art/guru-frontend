import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { colors, difficultyColor, examColor, examLight } from "@/lib/colors";

export default function Papers() {
  const nav = useNavigate();
  const { papers, deletePaper } = useApp();

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Delete "${title}"?`)) deletePaper(id);
  };

  return (
    <div className="px-4 pt-12 pb-5">
      <div className="flex justify-between items-start mb-5">
        <div>
          <div className="text-[26px] font-bold mb-0.5" style={{ color: colors.foreground }}>My Papers</div>
          <div className="text-[13px]" style={{ color: colors.mutedForeground }}>{papers.length} generated</div>
        </div>
        <button
          onClick={() => nav("/paper/generate")}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-white text-[13px] font-semibold"
          style={{ background: colors.primary }}
        >
          <Icon name="plus" size={18} color="#fff" /> New Paper
        </button>
      </div>

      {papers.length === 0 && (
        <div className="rounded-3xl border-[1.5px] border-dashed p-8 flex flex-col items-center mt-5" style={{ borderColor: colors.border }}>
          <div className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center mb-4" style={{ background: colors.muted }}>
            <Icon name="file-text" size={32} color={colors.mutedForeground} />
          </div>
          <div className="text-lg font-semibold mb-2" style={{ color: colors.foreground }}>No papers yet</div>
          <div className="text-sm text-center leading-5 mb-5" style={{ color: colors.mutedForeground }}>
            Generate your first practice paper using the AI Paper Generator
          </div>
          <button
            onClick={() => nav("/paper/generate")}
            className="px-6 py-3 rounded-full text-white text-sm font-semibold"
            style={{ background: colors.primary }}
          >
            Generate Paper
          </button>
        </div>
      )}

      {papers.map((paper) => (
        <div key={paper.id} className="rounded-2xl p-4 mb-3 border bg-white shadow-sm" style={{ borderColor: colors.border }}>
          <div className="flex justify-between items-center mb-2">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold"
              style={{ background: examLight(paper.examType), color: examColor(paper.examType) }}>
              {paper.examType}
            </span>
            <button onClick={() => handleDelete(paper.id, paper.title)} className="p-1">
              <Icon name="trash-2" size={16} color={colors.mutedForeground} />
            </button>
          </div>
          <div className="text-base font-semibold mb-1" style={{ color: colors.foreground }}>{paper.title}</div>
          <div className="text-[13px] mb-3" style={{ color: colors.mutedForeground }}>
            {paper.subject} • {paper.topic}
          </div>
          <div className="flex items-center gap-3 mb-2">
            <span className="flex items-center gap-1 text-xs" style={{ color: colors.mutedForeground }}>
              <Icon name="help-circle" size={13} color={colors.mutedForeground} />
              {paper.questions.length} questions
            </span>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold"
              style={{ background: difficultyColor(paper.difficulty) + "20", color: difficultyColor(paper.difficulty) }}>
              {paper.difficulty}
            </span>
          </div>
          <div className="text-[11px] mb-3" style={{ color: colors.mutedForeground }}>
            {new Date(paper.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </div>
          <button
            onClick={() => nav(`/paper/${paper.id}`)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-sm font-medium"
            style={{ borderColor: colors.border, background: colors.secondary, color: colors.foreground }}
          >
            View Paper <Icon name="arrow-right" size={14} color={colors.foreground} />
          </button>
        </div>
      ))}
    </div>
  );
}
