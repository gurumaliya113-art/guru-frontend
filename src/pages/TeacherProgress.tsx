import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon, Spinner } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";
import { colors } from "@/lib/colors";
import type { ClassRoom, QuizAttempt } from "@/lib/types";

const ACTIVE_CLASS_KEY = "gurutron.activeClassId";

type ClassStats = Awaited<ReturnType<typeof api.getClassStats>>;
type StudentRow = ClassStats["students"][number];

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}
const scoreColor = (p: number) => (p >= 70 ? colors.neet : p >= 50 ? colors.jee : colors.destructive);

function StatBox({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex-1 rounded-2xl border bg-white p-3 text-center" style={{ borderColor: colors.border }}>
      <div className="text-xl font-bold" style={{ color: color || colors.primary }}>{value}</div>
      <div className="text-[10px]" style={{ color: colors.mutedForeground }}>{label}</div>
    </div>
  );
}

export default function TeacherProgress() {
  const { classes } = useApp();
  const nav = useNavigate();

  const initial = useMemo<ClassRoom | null>(() => {
    try {
      const stored = localStorage.getItem(ACTIVE_CLASS_KEY);
      if (stored) {
        const f = classes.find((c) => c.id === stored);
        if (f) return f;
      }
    } catch { /* ignore */ }
    return classes[0] || null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [active, setActive] = useState<ClassRoom | null>(initial);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [data, setData] = useState<ClassStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [selected, setSelected] = useState<StudentRow | null>(null);
  const [records, setRecords] = useState<QuizAttempt[] | null>(null);
  const [recLoading, setRecLoading] = useState(false);

  useEffect(() => {
    if (active?.id) { try { localStorage.setItem(ACTIVE_CLASS_KEY, active.id); } catch { /* ignore */ } }
  }, [active?.id]);

  useEffect(() => {
    if (!active && classes.length) setActive(classes[0]);
  }, [classes, active]);

  useEffect(() => {
    if (!active) return;
    let on = true;
    setLoading(true);
    api.getClassStats(active.id)
      .then((d) => { if (on) { setData(d); setErr(""); } })
      .catch((e) => on && setErr(String(e?.message || e)))
      .finally(() => on && setLoading(false));
    return () => { on = false; };
  }, [active?.id]);

  const openStudent = (s: StudentRow) => {
    if (!active) return;
    setSelected(s);
    setRecords(null);
    setRecLoading(true);
    api.getClassStudentAttempts(active.id, s.studentId)
      .then((r) => setRecords(r.attempts || []))
      .catch(() => setRecords([]))
      .finally(() => setRecLoading(false));
  };

  return (
    <div className="px-4 pt-12 pb-6">
      <div className="text-[26px] font-bold mb-1" style={{ color: colors.foreground }}>Class Progress</div>
      <div className="text-sm mb-4" style={{ color: colors.mutedForeground }}>Track how your students are doing</div>

      {classes.length === 0 ? (
        <div className="rounded-2xl border p-6 text-center" style={{ borderColor: colors.border, background: "#fff" }}>
          <div className="text-sm mb-3" style={{ color: colors.mutedForeground }}>You have no classes yet.</div>
          <button onClick={() => nav("/class/create")} className="px-4 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: "#1c1917" }}>
            <Icon name="plus" size={14} color="#fbbf24" /> Create a class
          </button>
        </div>
      ) : (
        <>
          {/* Class selector */}
          <button
            onClick={() => setShowSwitcher((s) => !s)}
            className="w-full flex items-center gap-3 rounded-2xl border bg-white p-3.5 mb-3"
            style={{ borderColor: colors.border }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold" style={{ background: "#fbbf24", color: "#1c1917" }}>
              {active?.classLevel || "?"}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-sm font-bold truncate" style={{ color: colors.foreground }}>{active?.name || "Select class"}</div>
              <div className="text-[11px]" style={{ color: colors.mutedForeground }}>
                {active ? `${active.batchType === "toppers" ? "Toppers" : "Normal"} · Code ${active.code}` : "Tap to choose"}
              </div>
            </div>
            <Icon name="refresh-cw" size={16} color={colors.mutedForeground} />
            <span className="text-[12px] font-semibold" style={{ color: colors.primary }}>Switch</span>
          </button>

          {showSwitcher && classes.length > 0 && (
            <div className="rounded-2xl border bg-white mb-3 overflow-hidden" style={{ borderColor: colors.border }}>
              {classes.map((c, idx) => {
                const a = c.id === active?.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => { setActive(c); setShowSwitcher(false); setSelected(null); }}
                    className="w-full flex items-center px-4 py-3 gap-3 text-left"
                    style={{ borderBottom: idx < classes.length - 1 ? `1px solid ${colors.border}` : "none", background: a ? "#fef3c7" : "#fff" }}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs" style={{ background: a ? "#fbbf24" : colors.muted, color: a ? "#1c1917" : colors.foreground }}>
                      {c.classLevel}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate" style={{ color: colors.foreground }}>{c.name}</div>
                      <div className="text-[11px]" style={{ color: colors.mutedForeground }}>Code <span className="font-bold tracking-wider">{c.code}</span></div>
                    </div>
                    {a && <Icon name="check" size={16} color="#16a34a" />}
                  </button>
                );
              })}
            </div>
          )}

          {loading && <div className="flex justify-center py-8"><Spinner size={20} /></div>}
          {err && <div className="rounded-2xl p-4 text-sm" style={{ background: "#fee2e2", color: "#991b1b" }}>{err}</div>}

          {!loading && data && (
            <>
              <div className="flex gap-2 mb-4">
                <StatBox label="Students" value={data.summary.totalStudents} color={colors.primary} />
                <StatBox label="Pending" value={data.summary.pending} color={colors.jee} />
                <StatBox label="Quizzes" value={data.summary.totalQuizzes} color={colors.board} />
                <StatBox label="Class Avg" value={`${data.summary.classAvgScore}%`} color={colors.neet} />
              </div>

              <div className="text-[15px] font-bold mb-2" style={{ color: colors.foreground }}>Students</div>
              {data.students.length === 0 ? (
                <div className="rounded-2xl border p-6 text-center text-sm" style={{ borderColor: colors.border, background: "#fff", color: colors.mutedForeground }}>
                  No approved students yet.
                </div>
              ) : (
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
              )}
            </>
          )}
        </>
      )}

      {/* Student records drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md rounded-t-[28px] sm:rounded-[28px] bg-white p-5 shadow-2xl max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
              <div className="rounded-2xl border p-4 text-center text-sm" style={{ borderColor: colors.border, color: colors.mutedForeground }}>No attempts yet.</div>
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
                      <span className="px-2.5 py-1 rounded-lg text-[13px] font-bold" style={{ background: pct >= 70 ? colors.neetLight : pct >= 50 ? colors.jeeLight : "#fee2e2", color: scoreColor(pct) }}>{pct}%</span>
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
