import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Icon, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { colors } from "@/lib/colors";
import type { QuizAttempt } from "@/lib/types";

type ClassStats = Awaited<ReturnType<typeof api.getClassStats>>;
type StudentRow = ClassStats["students"][number];

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function scoreColor(pct: number) {
  return pct >= 70 ? colors.neet : pct >= 50 ? colors.jee : colors.destructive;
}

function StatBox({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex-1 rounded-2xl border bg-white p-3 text-center" style={{ borderColor: colors.border }}>
      <div className="text-xl font-bold" style={{ color: color || colors.primary }}>{value}</div>
      <div className="text-[10px]" style={{ color: colors.mutedForeground }}>{label}</div>
    </div>
  );
}

export default function ClassInfo() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState<ClassStats | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  // Selected student records (drill-down)
  const [selected, setSelected] = useState<StudentRow | null>(null);
  const [records, setRecords] = useState<QuizAttempt[] | null>(null);
  const [recLoading, setRecLoading] = useState(false);

  useEffect(() => {
    let on = true;
    setLoading(true);
    api.getClassStats(id)
      .then((d) => { if (on) { setData(d); setErr(""); } })
      .catch((e) => on && setErr(String(e?.message || e)))
      .finally(() => on && setLoading(false));
    return () => { on = false; };
  }, [id]);

  const openStudent = (s: StudentRow) => {
    setSelected(s);
    setRecords(null);
    setRecLoading(true);
    api.getClassStudentAttempts(id, s.studentId)
      .then((r) => setRecords(r.attempts || []))
      .catch(() => setRecords([]))
      .finally(() => setRecLoading(false));
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ color: colors.mutedForeground }}><Spinner size={22} /></div>;
  }
  if (err) {
    return (
      <div className="p-6">
        <button onClick={() => nav(-1)} className="flex items-center gap-1 text-sm font-semibold mb-4" style={{ color: colors.primary }}>
          <Icon name="arrow-left" size={16} color={colors.primary} /> Back
        </button>
        <div className="rounded-2xl p-4 text-sm" style={{ background: "#fee2e2", color: "#991b1b" }}>{err}</div>
      </div>
    );
  }
  if (!data) return null;

  const c = data.class;
  const s = data.summary;

  return (
    <div className="min-h-screen" style={{ background: colors.background, paddingBottom: 40 }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-6 text-white" style={{ background: "linear-gradient(135deg,#1c1917,#292524)" }}>
        <button onClick={() => nav(-1)} className="flex items-center gap-1 text-sm font-semibold mb-3" style={{ color: "#fbbf24" }}>
          <Icon name="arrow-left" size={16} color="#fbbf24" /> Back
        </button>
        <div className="text-[24px] font-bold">{c.name}</div>
        <div className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>
          Class {c.classLevel} · {c.batchType === "toppers" ? "Toppers" : "Normal"} batch
          {c.subject ? ` · ${c.subject}` : ""} · Code <span className="font-bold tracking-wider">{c.code}</span>
        </div>
      </div>

      <div className="px-4 -mt-3">
        {/* Class summary */}
        <div className="flex gap-2 mb-4">
          <StatBox label="Students" value={s.totalStudents} color={colors.primary} />
          <StatBox label="Pending" value={s.pending} color={colors.jee} />
          <StatBox label="Quizzes" value={s.totalQuizzes} color={colors.board} />
          <StatBox label="Class Avg" value={`${s.classAvgScore}%`} color={colors.neet} />
        </div>

        <div className="text-[15px] font-bold mb-2" style={{ color: colors.foreground }}>Students</div>

        {data.students.length === 0 && (
          <div className="rounded-2xl border p-6 text-center text-sm" style={{ borderColor: colors.border, background: "#fff", color: colors.mutedForeground }}>
            No approved students yet. Share the join code to add students.
          </div>
        )}

        <div className="flex flex-col gap-2">
          {data.students.map((st) => (
            <button
              key={st.studentId || st.membershipId}
              onClick={() => openStudent(st)}
              className="flex items-center gap-3 rounded-2xl border bg-white p-3.5 text-left active:scale-[0.99] transition"
              style={{ borderColor: colors.border }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0" style={{ background: "#fef3c7", color: "#92400e" }}>
                {(st.name || "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate" style={{ color: colors.foreground }}>{st.name}</div>
                <div className="text-[11px]" style={{ color: colors.mutedForeground }}>
                  Roll {st.rollNumber || "—"} · {st.quizzes} quizzes · last {fmtDate(st.lastActive)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[15px] font-bold" style={{ color: scoreColor(st.avgScore) }}>{st.avgScore}%</div>
                <div className="text-[10px]" style={{ color: colors.mutedForeground }}>avg</div>
              </div>
              <Icon name="chevron-right" size={16} color={colors.mutedForeground} />
            </button>
          ))}
        </div>
      </div>

      {/* Student records drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={() => setSelected(null)}>
          <div
            className="w-full max-w-md rounded-t-[28px] sm:rounded-[28px] bg-white p-5 shadow-2xl max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="text-[17px] font-bold" style={{ color: colors.foreground }}>{selected.name}</div>
                <div className="text-[12px]" style={{ color: colors.mutedForeground }}>Roll {selected.rollNumber || "—"}{selected.parentPhone ? ` · ${selected.parentPhone}` : ""}</div>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-full p-2" style={{ background: colors.secondary }}>
                <Icon name="x" size={16} color={colors.foreground} />
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <StatBox label="Quizzes" value={selected.quizzes} color={colors.primary} />
              <StatBox label="Avg" value={`${selected.avgScore}%`} color={colors.neet} />
              <StatBox label="Best" value={`${selected.bestScore}%`} color={colors.jee} />
            </div>

            <div className="text-[13px] font-bold mb-2" style={{ color: colors.foreground }}>Quiz & mock records</div>

            {recLoading && <div className="flex justify-center py-6"><Spinner size={18} /></div>}

            {!recLoading && records && records.length === 0 && (
              <div className="rounded-2xl border p-4 text-center text-sm" style={{ borderColor: colors.border, color: colors.mutedForeground }}>
                No attempts yet.
              </div>
            )}

            {!recLoading && records && records.length > 0 && (
              <div className="flex flex-col gap-2">
                {records.map((a) => {
                  const pct = a.totalQuestions ? Math.round((a.score / a.totalQuestions) * 100) : 0;
                  return (
                    <div key={a.id} className="flex items-center justify-between rounded-xl border p-3" style={{ borderColor: colors.border }}>
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="text-[13px] font-semibold truncate" style={{ color: colors.foreground }}>{a.title || "Quiz"}</div>
                        <div className="text-[11px]" style={{ color: colors.mutedForeground }}>
                          {a.subject ? `${a.subject} · ` : ""}{a.score}/{a.totalQuestions} · {fmtDate(a.date)}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg text-[13px] font-bold" style={{ background: pct >= 70 ? colors.neetLight : pct >= 50 ? colors.jeeLight : "#fee2e2", color: scoreColor(pct) }}>
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
