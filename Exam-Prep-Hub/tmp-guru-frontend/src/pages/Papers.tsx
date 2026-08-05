import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Icon } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { colors, difficultyColor, examColor, examLight } from "@/lib/colors";
import type { Assignment, ClassRoom, GeneratedPaper } from "@/lib/types";

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
      // Strip query so the modal doesn't reopen after closing.
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

  return (
    <div className="px-4 pt-12 pb-5">
      <div className="flex justify-between items-start mb-5">
        <div>
          <div className="text-[26px] font-bold mb-0.5" style={{ color: colors.foreground }}>My Papers</div>
          <div className="text-[13px]" style={{ color: colors.mutedForeground }}>{papers.length} generated</div>
        </div>
        <div className="flex items-center gap-2">
          {/* Quick photo-snap path for teachers who don't feel like typing
              MCQs. Creates an image-only paper they can assign just like
              any AI-generated one. */}
          <button
            onClick={() => nav("/paper/capture")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full border text-[12px] font-semibold"
            style={{ borderColor: colors.border, background: "#fff", color: colors.foreground }}
            title="Snap photos of your handwritten/printed paper"
          >
            <Icon name="camera" size={15} color={colors.foreground} /> Capture
          </button>
          <button
            onClick={() => nav("/paper/generate")}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-white text-[13px] font-semibold"
            style={{ background: colors.primary }}
          >
            <Icon name="plus" size={18} color="#fff" /> New Paper
          </button>
        </div>
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
          {isTeacher && classesForPaper(paper.id).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {classesForPaper(paper.id).map((a) => (
                <span
                  key={a.id}
                  className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold"
                  style={{ background: "#dcfce7", color: "#166534" }}
                  title={`Assigned to ${a.className || a.classCode}`}
                >
                  <Icon name="check" size={10} color="#166534" />
                  {a.classCode || a.className}
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => nav(`/paper/${paper.id}`)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-sm font-medium"
              style={{ borderColor: colors.border, background: colors.secondary, color: colors.foreground }}
            >
              View <Icon name="arrow-right" size={14} color={colors.foreground} />
            </button>
            {isTeacher && (
              <button
                onClick={() => setAssignFor(paper)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: "#d97706" }}
              >
                <Icon name="send" size={14} color="#fff" /> Assign
              </button>
            )}
          </div>
        </div>
      ))}

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
      style={{ background: "rgba(15,23,42,0.55)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-5 pt-5 pb-3 text-white"
          style={{ background: "linear-gradient(135deg,#1c1917,#292524)" }}
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
                style={{ background: "#1c1917" }}
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
                        background: done ? "#16a34a" : "#fef3c7",
                        color: done ? "#fff" : "#92400e",
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
