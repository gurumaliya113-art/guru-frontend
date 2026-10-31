import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight, Camera, CheckCircle2, FilePlus, FileText, HelpCircle, Plus, Search, Send, Sparkles, Trash2,
} from "lucide-react";
import { Icon } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { colors, difficultyColor, examColor, examLight } from "@/lib/colors";
import type { Assignment, ClassRoom, GeneratedPaper } from "@/lib/types";
import { CountUp, Sparkle } from "@/components/motion";

export default function Papers() {
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    papers,
    deletePaper,
    profile,
    classes,
    assignPaperToClass,
    getMyAssignments,
  } = useApp();

  const isTeacher = profile.role === "teacher";
  const [assignFor, setAssignFor] = useState<GeneratedPaper | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [query, setQuery] = useState("");
  const [exam, setExam] = useState<string>("All");

  // Refresh assignments so we can show "Assigned" badges on cards.
  const refreshAssignments = async () => {
    if (!isTeacher) return;
    try {
      const list = await getMyAssignments();
      setAssignments(list);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    void refreshAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTeacher]);

  // If we arrived here via ?assign=<paperId>, auto-open the modal.
  useEffect(() => {
    const id = searchParams.get("assign");
    if (id && papers.length) {
      const p = papers.find((x) => x.id === id);
      if (p) setAssignFor(p);
      searchParams.delete("assign");
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [papers.length]);

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Delete "${title}"?`)) deletePaper(id);
  };

  const classesForPaper = (paperId: string) =>
    assignments.filter((a) => a.paperId === paperId);

  const examTabs = useMemo(() => ["All", ...Array.from(new Set(papers.map((p) => p.examType).filter(Boolean)))], [papers]);
  const assignedCount = useMemo(() => new Set(assignments.map((a) => a.paperId)).size, [assignments]);
  const totalQs = useMemo(() => papers.reduce((s, p) => s + p.questions.length, 0), [papers]);

  const shown = useMemo(() => {
    const term = query.trim().toLowerCase();
    return [...papers]
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .filter((p) => exam === "All" || p.examType === exam)
      .filter((p) => !term || `${p.title} ${p.subject} ${p.topic}`.toLowerCase().includes(term));
  }, [papers, exam, query]);

  return (
    <div className="pb-5">
      {/* ── Header ── */}
      <div className="am-grad relative overflow-hidden rounded-b-[26px] px-5 pb-5 pt-12 text-white">
        <span className="am-blob-a pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full bg-white/[0.07]" />
        <span className="am-blob-b pointer-events-none absolute -bottom-10 left-10 h-28 w-28 rounded-full bg-amber-300/10" />
        <Sparkle className="absolute right-[40%] top-10 h-3 w-3 text-white/60" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-violet-200">
              <Sparkles size={12} /> Paper bank
            </div>
            <div className="text-[22px] font-bold leading-tight">My Papers</div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => nav("/paper/capture")} title="Snap photos of a handwritten/printed paper"
              className="flex h-9 items-center gap-1.5 rounded-full bg-white/15 px-3 text-[12px] font-semibold">
              <Camera size={15} /> Snap
            </button>
            <button onClick={() => nav("/paper/generate")}
              className="flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-[12px] font-bold text-violet-800">
              <Plus size={15} /> New
            </button>
          </div>
        </div>
        <div className="relative mt-4 grid grid-cols-3 gap-2">
          {[
            { label: "papers", value: papers.length },
            { label: "questions", value: totalQs },
            { label: "assigned", value: assignedCount },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-white/12 px-3 py-2 text-center" style={{ background: "rgba(255,255,255,.12)" }}>
              <div className="text-[18px] font-extrabold leading-none"><CountUp to={s.value} /></div>
              <div className="mt-1 text-[10px] text-white/70">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4">
        {papers.length > 0 && (
          <>
            <div className="mb-3 flex items-center gap-2 rounded-xl border bg-white px-3" style={{ borderColor: colors.border }}>
              <Search size={15} color={colors.mutedForeground} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search papers by title, subject or topic"
                className="w-full bg-transparent py-2.5 text-[13px] outline-none" />
            </div>
            {examTabs.length > 2 && (
              <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
                {examTabs.map((e) => (
                  <button key={e} onClick={() => setExam(e)}
                    className="whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[12px] font-semibold"
                    style={exam === e
                      ? { background: colors.primaryGradient, borderColor: "transparent", color: "#fff" }
                      : { background: "#fff", borderColor: colors.border, color: colors.mutedForeground }}>
                    {e}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {papers.length === 0 && (
          <button onClick={() => nav("/paper/generate")}
            className="am-grad group relative mt-2 block w-full overflow-hidden rounded-3xl p-6 text-left text-white">
            <span className="am-orbit pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full border border-white/20">
              <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-300" />
            </span>
            <FilePlus size={28} className="am-float" />
            <div className="mt-3 text-[18px] font-extrabold">No papers yet</div>
            <div className="mt-1 max-w-[70%] text-[12px] text-violet-100/85">Create your first paper — pick exam, class and topics, then download the PDF.</div>
            <span className="relative mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-bold text-violet-800">
              <span className="am-ripple" /> Generate paper <ArrowRight size={15} />
            </span>
          </button>
        )}

        {papers.length > 0 && shown.length === 0 && (
          <div className="py-10 text-center text-[13px]" style={{ color: colors.mutedForeground }}>No papers match your search.</div>
        )}

        {shown.map((paper) => {
          const assigned = isTeacher ? classesForPaper(paper.id) : [];
          return (
            <div key={paper.id} className="mb-3 rounded-2xl border bg-white p-4" style={{ borderColor: colors.border }}>
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: examLight(paper.examType) }}>
                  <FileText size={19} color={examColor(paper.examType)} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-md px-2 py-0.5 text-[10px] font-bold"
                      style={{ background: examLight(paper.examType), color: examColor(paper.examType) }}>
                      {paper.examType}
                    </span>
                    <span className="rounded-md px-2 py-0.5 text-[10px] font-semibold"
                      style={{ background: difficultyColor(paper.difficulty) + "20", color: difficultyColor(paper.difficulty) }}>
                      {paper.difficulty}
                    </span>
                    <span className="ml-auto text-[11px]" style={{ color: colors.mutedForeground }}>
                      {new Date(paper.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <div className="mt-1.5 line-clamp-2 text-[15px] font-semibold leading-snug" style={{ color: colors.foreground }}>{paper.title}</div>
                  <div className="mt-0.5 flex items-center gap-1 truncate text-[12px]" style={{ color: colors.mutedForeground }}>
                    <HelpCircle size={12} /> {paper.questions.length} questions · {paper.subject}
                  </div>
                </div>
              </div>

              {assigned.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {assigned.map((a) => (
                    <span key={a.id} title={`Assigned to ${a.className || a.classCode}`}
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ background: "#dcfce7", color: "#166534" }}>
                      <CheckCircle2 size={10} /> {a.classCode || a.className}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-3 flex gap-2">
                <button onClick={() => nav(`/paper/${paper.id}`)}
                  className="group flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-[13px] font-semibold"
                  style={{ borderColor: "#ddd6fe", background: colors.secondary, color: "#4c1d95" }}>
                  View & PDF <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </button>
                {isTeacher && (
                  <button onClick={() => setAssignFor(paper)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-bold text-white"
                    style={{ background: colors.primaryGradient }}>
                    <Send size={14} /> Assign
                  </button>
                )}
                <button onClick={() => handleDelete(paper.id, paper.title)} aria-label="Delete paper"
                  className="flex w-10 items-center justify-center rounded-xl border" style={{ borderColor: colors.border }}>
                  <Trash2 size={15} color={colors.mutedForeground} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {assignFor && (
        <AssignToClassModal
          paper={assignFor}
          classes={classes}
          alreadyAssignedClassIds={
            new Set(classesForPaper(assignFor.id).map((a) => a.classId))
          }
          onClose={() => setAssignFor(null)}
          onAssign={async (cls) => {
            const r = await assignPaperToClass(assignFor.id, cls.id);
            await refreshAssignments();
            return r.alreadyAssigned ? "already" : "ok";
          }}
          onGoCreateClass={() => {
            setAssignFor(null);
            nav("/class/create");
          }}
        />
      )}
    </div>
  );
}

function AssignToClassModal({
  paper,
  classes,
  alreadyAssignedClassIds,
  onClose,
  onAssign,
  onGoCreateClass,
}: {
  paper: GeneratedPaper;
  classes: ClassRoom[];
  alreadyAssignedClassIds: Set<string>;
  onClose: () => void;
  onAssign: (cls: ClassRoom) => Promise<"ok" | "already">;
  onGoCreateClass: () => void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set(alreadyAssignedClassIds));
  const [error, setError] = useState("");

  const handle = async (cls: ClassRoom) => {
    setError("");
    setBusyId(cls.id);
    try {
      await onAssign(cls);
      setDoneIds((prev) => new Set([...prev, cls.id]));
    } catch (e: any) {
      setError(e?.message || "Could not assign");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(20,17,43,0.45)" }}
      onClick={onClose}
    >
      <div
        className="am-sheet w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-5 pt-5 pb-3 text-white"
          style={{ background: colors.primaryGradient }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-[11px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.55)" }}>
                Assign paper to a class
              </div>
              <div className="text-base font-bold truncate">{paper.title}</div>
              <div className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.65)" }}>
                {paper.subject} • {paper.questions.length} questions • {paper.difficulty}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full"
              style={{ background: "rgba(255,255,255,0.15)" }}
              aria-label="Close"
            >
              <Icon name="x" size={16} color="#fff" />
            </button>
          </div>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {classes.length === 0 ? (
            <div className="text-center py-6">
              <div
                className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                style={{ background: colors.muted }}
              >
                <Icon name="users" size={26} color={colors.mutedForeground} />
              </div>
              <div className="text-sm font-semibold mb-1" style={{ color: colors.foreground }}>
                No classes yet
              </div>
              <div className="text-xs mb-4" style={{ color: colors.mutedForeground }}>
                Create a class first so you can assign papers to it.
              </div>
              <button
                onClick={onGoCreateClass}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: colors.primaryGradient }}
              >
                <Icon name="plus" size={14} color="#fbbf24" /> Create new class
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {classes.map((c) => {
                const done = doneIds.has(c.id);
                const busy = busyId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => !done && !busy && handle(c)}
                    disabled={done || busy}
                    className="flex items-center gap-3 p-3 rounded-2xl border text-left"
                    style={{
                      borderColor: done ? "#86efac" : colors.border,
                      background: done ? "#f0fdf4" : "#fff",
                      opacity: busy ? 0.7 : 1,
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                      style={{
                        background: done ? "#16a34a" : "#ede9fe",
                        color: done ? "#fff" : "#4c1d95",
                      }}
                    >
                      {c.classLevel}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate" style={{ color: colors.foreground }}>
                        {c.name}
                      </div>
                      <div className="text-[11px]" style={{ color: colors.mutedForeground }}>
                        {c.batchType === "toppers" ? "Toppers" : "Normal"} •{" "}
                        <span className="font-bold tracking-wider">{c.code}</span>
                      </div>
                    </div>
                    {done ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold" style={{ color: "#16a34a" }}>
                        <Icon name="check-circle" size={14} color="#16a34a" /> Assigned
                      </span>
                    ) : busy ? (
                      <span className="text-[11px] font-bold" style={{ color: colors.mutedForeground }}>
                        Assigning…
                      </span>
                    ) : (
                      <Icon name="arrow-right" size={16} color={colors.mutedForeground} />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {error && (
            <div
              className="mt-3 text-xs rounded-xl px-3 py-2"
              style={{ background: "#fee2e2", color: "#b91c1c" }}
            >
              {error}
            </div>
          )}
        </div>

        <div className="px-4 pb-4">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl text-sm font-bold"
            style={{ background: colors.muted, color: colors.foreground }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
