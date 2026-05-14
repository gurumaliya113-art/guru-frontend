import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { adminApi } from "@/lib/api";
import { colors, difficultyColor, examColor, examLight, subjectColor } from "@/lib/colors";
import type { Difficulty, ExamType, Question, Subject } from "@/lib/types";

const SUBJECTS: (Subject | "All")[] = ["All", "Physics", "Chemistry", "Biology", "Mathematics"];
const EXAMS: (ExamType | "All")[] = ["All", "NEET", "JEE", "BOARD"];
const DIFFICULTIES: (Difficulty | "All")[] = ["All", "Easy", "Moderate", "Hard"];

export default function AdminQuestions() {
  const nav = useNavigate();
  const { refreshQuestions } = useApp();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [subject, setSubject] = useState<Subject | "All">("All");
  const [exam, setExam] = useState<ExamType | "All">("All");
  const [difficulty, setDifficulty] = useState<Difficulty | "All">("All");

  const load = async () => {
    setLoading(true);
    try {
      const r = await adminApi.listQuestions();
      setQuestions(r.questions || []);
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return questions.filter((x) => {
      if (subject !== "All" && x.subject !== subject) return false;
      if (difficulty !== "All" && x.difficulty !== difficulty) return false;
      if (exam !== "All" && !x.examType.includes(exam)) return false;
      if (needle) {
        const hay = (x.text + " " + (x.topic || "") + " " + x.options.join(" ")).toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [questions, q, subject, exam, difficulty]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this question? This cannot be undone.")) return;
    try {
      await adminApi.deleteQuestion(id);
      setQuestions((arr) => arr.filter((x) => x.id !== id));
      refreshQuestions();
    } catch (e: any) {
      alert(e?.message || "Delete failed");
    }
  };

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex justify-between items-start mb-5">
        <div>
          <div className="text-[26px] font-bold" style={{ color: colors.foreground }}>Questions</div>
          <div className="text-sm" style={{ color: colors.mutedForeground }}>
            {loading ? "Loading…" : `${filtered.length} of ${questions.length} shown`}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => nav("/admin/upload")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border bg-white font-semibold text-sm"
            style={{ borderColor: colors.border, color: colors.foreground }}
          >
            <Icon name="file-text" size={16} color={colors.foreground} /> Upload PDF
          </button>
          <button
            onClick={() => nav("/admin/questions/new")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm"
            style={{ background: colors.primary }}
          >
            <Icon name="plus" size={16} color="#fff" /> Add Question
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border bg-white p-4 mb-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center"
        style={{ borderColor: colors.border }}>
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ borderColor: colors.border }}>
          <Icon name="help-circle" size={14} color={colors.mutedForeground} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search text, options, topic…"
            className="flex-1 bg-transparent outline-none text-sm"
          />
          {q && (
            <button onClick={() => setQ("")} className="p-1">
              <Icon name="x" size={14} color={colors.mutedForeground} />
            </button>
          )}
        </div>
        <Select value={subject} onChange={(v) => setSubject(v as any)} options={SUBJECTS} label="Subject" />
        <Select value={exam} onChange={(v) => setExam(v as any)} options={EXAMS} label="Exam" />
        <Select value={difficulty} onChange={(v) => setDifficulty(v as any)} options={DIFFICULTIES} label="Difficulty" />
      </div>

      {err && <div className="mb-3 px-3 py-2 rounded-lg text-sm" style={{ background: "#fee2e2", color: colors.destructive }}>{err}</div>}

      {/* List */}
      {!loading && filtered.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed p-10 text-center" style={{ borderColor: colors.border }}>
          <Icon name="inbox" size={40} color={colors.mutedForeground} />
          <div className="text-sm mt-3" style={{ color: colors.mutedForeground }}>No questions match the filters.</div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {filtered.map((x) => (
          <div key={x.id} className="rounded-2xl border bg-white p-4" style={{ borderColor: colors.border }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <Tag color={subjectColor(x.subject)}>{x.subject}</Tag>
                  {x.topic && <Tag color={colors.mutedForeground} muted>{x.topic}</Tag>}
                  <Tag color={difficultyColor(x.difficulty)} bg={difficultyColor(x.difficulty) + "20"}>{x.difficulty}</Tag>
                  {x.examType.map((e) => (
                    <Tag key={e} color={examColor(e)} bg={examLight(e)}>{e}</Tag>
                  ))}
                  {x.year && <Tag color={colors.jee} bg={colors.jeeLight}>PYQ {x.year}</Tag>}
                  {x.source && <Tag color={colors.mutedForeground} muted>src: {x.source}</Tag>}
                </div>
                <div className="text-[14px] leading-6 font-medium mb-2" style={{ color: colors.foreground }}>{x.text}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                  {x.options.map((o, i) => (
                    <div key={i} className="flex items-center gap-2 text-[12px]"
                      style={{ color: i === x.correctIndex ? colors.neet : colors.mutedForeground }}>
                      <span className="w-5 font-bold">{String.fromCharCode(65 + i)}.</span>
                      <span className="flex-1 truncate">{o}</span>
                      {i === x.correctIndex && <Icon name="check-circle" size={12} color={colors.neet} />}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <button
                  onClick={() => nav(`/admin/questions/${encodeURIComponent(x.id)}`)}
                  className="p-2 rounded-lg hover:bg-blue-50"
                  title="Edit"
                >
                  <Icon name="edit-2" size={15} color={colors.primary} />
                </button>
                <button
                  onClick={() => handleDelete(x.id)}
                  className="p-2 rounded-lg hover:bg-red-50"
                  title="Delete"
                >
                  <Icon name="trash-2" size={15} color={colors.destructive} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Select({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: readonly string[]; label: string }) {
  return (
    <label className="flex items-center gap-2 text-xs" style={{ color: colors.mutedForeground }}>
      <span className="font-semibold uppercase tracking-wider">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg px-2.5 py-2 border bg-white text-sm"
        style={{ borderColor: colors.border, color: colors.foreground }}
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function Tag({ children, color, bg, muted }: { children: React.ReactNode; color: string; bg?: string; muted?: boolean }) {
  return (
    <span
      className="px-2 py-0.5 rounded-md text-[10px] font-semibold"
      style={{
        background: bg || (muted ? colors.muted : color + "18"),
        color,
      }}
    >
      {children}
    </span>
  );
}
