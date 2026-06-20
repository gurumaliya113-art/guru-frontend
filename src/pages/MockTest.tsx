// MockTest — Testbook-style timed exam runner (JEE / NEET pattern).
// Sections (Subject × Section A MCQ / Section B Numerical), live countdown,
// question palette with status colours, Save & Next / Mark for Review /
// Clear Response, submit → result with +4 / −1 marking, and the attempt is
// recorded so it shows up in Progress. Mobile-first (palette is a drawer).
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Icon } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { colors } from "@/lib/colors";
import type { ExamType, Question, Subject } from "@/lib/types";

const CORRECT = 4;
const WRONG = -1;

type Status = "notVisited" | "notAnswered" | "answered" | "marked" | "markedAnswered";

interface PaperState {
  title?: string;
  questions?: Question[];
  timeLimitMin?: number;
  examType?: string;
  subject?: string;
}

interface Section {
  key: string;
  label: string;
  subject: string;
  part: "A" | "B";
  items: { q: Question; flatIndex: number }[];
}

function isNumerical(q: Question) {
  return /numer/i.test(q.type || "");
}

function isCorrect(q: Question, ans: string | undefined | null): boolean {
  if (ans == null || ans === "") return false;
  if (isNumerical(q)) {
    const correct = q.options?.[q.correctIndex] ?? q.options?.[0] ?? "";
    const a = parseFloat(String(ans).trim());
    const b = parseFloat(String(correct).trim());
    if (Number.isNaN(a) || Number.isNaN(b)) return String(ans).trim() === String(correct).trim();
    return Math.abs(a - b) < 0.01;
  }
  return Number(ans) === q.correctIndex;
}

export default function MockTest() {
  const nav = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { addAttempt, profile } = useApp();
  const paper = (location.state || {}) as PaperState;

  const questions = paper.questions || [];
  const durationMin = paper.timeLimitMin ?? 180;

  const [stage, setStage] = useState<"instructions" | "test" | "result">("instructions");
  const [agreed, setAgreed] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [curIdx, setCurIdx] = useState(0);
  const [secIdx, setSecIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(durationMin * 60);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [numInput, setNumInput] = useState("");
  const startRef = useRef<number>(0);

  // Build sections: each subject → Section A (MCQ) + Section B (Numerical).
  const { sections, flat } = useMemo(() => {
    const subjects: string[] = [];
    for (const q of questions) {
      const s = q.subject || "General";
      if (!subjects.includes(s)) subjects.push(s);
    }
    const flatArr: { q: Question; flatIndex: number }[] = [];
    const secs: Section[] = [];
    let fi = 0;
    for (const subj of subjects) {
      for (const part of ["A", "B"] as const) {
        const items = questions
          .filter((q) => (q.subject || "General") === subj && (part === "B" ? isNumerical(q) : !isNumerical(q)))
          .map((q) => {
            const entry = { q, flatIndex: fi++ };
            flatArr.push(entry);
            return entry;
          });
        if (items.length) {
          secs.push({ key: `${subj}-${part}`, label: `${subj} · Sec ${part}`, subject: subj, part, items });
        }
      }
    }
    return { sections: secs, flat: flatArr };
  }, [questions]);

  // init status to notVisited
  useEffect(() => {
    const init: Record<string, Status> = {};
    for (const q of questions) init[q.id] = "notVisited";
    setStatus(init);
    startRef.current = Date.now();
  }, [questions.length]);

  // countdown
  useEffect(() => {
    if (stage !== "test") return;
    if (timeLeft <= 0) { submit(); return; }
    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [stage, timeLeft]);

  const cur = flat[curIdx]?.q;
  const curSection = sections[secIdx];

  // when navigating to a question, mark visited and sync numeric input
  useEffect(() => {
    if (stage !== "test" || !cur) return;
    setStatus((prev) => {
      if (prev[cur.id] === "notVisited") return { ...prev, [cur.id]: "notAnswered" };
      return prev;
    });
    setNumInput(isNumerical(cur) ? (answers[cur.id] ?? "") : "");
    // keep section tab in sync with current question
    const si = sections.findIndex((s) => s.items.some((it) => it.flatIndex === curIdx));
    if (si >= 0 && si !== secIdx) setSecIdx(si);
  }, [curIdx, stage]);

  if (!questions.length) {
    return (
      <div className="p-6 text-center">
        <div className="text-sm mb-3" style={{ color: colors.mutedForeground }}>This test could not be loaded.</div>
        <button onClick={() => nav("/pyp")} className="px-4 py-2 rounded-xl text-white text-sm font-semibold" style={{ background: colors.primary }}>Back to Super App</button>
      </div>
    );
  }

  const fmtTime = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  function setAns(qid: string, val: string) {
    setAnswers((p) => ({ ...p, [qid]: val }));
  }

  function saveAndNext() {
    if (!cur) return;
    const val = isNumerical(cur) ? numInput.trim() : answers[cur.id];
    setStatus((p) => {
      const answered = val != null && val !== "";
      const wasMarked = p[cur.id] === "marked" || p[cur.id] === "markedAnswered";
      return { ...p, [cur.id]: answered ? (wasMarked ? "markedAnswered" : "answered") : "notAnswered" };
    });
    if (isNumerical(cur)) setAns(cur.id, numInput.trim());
    goNext();
  }

  function markAndNext() {
    if (!cur) return;
    const val = isNumerical(cur) ? numInput.trim() : answers[cur.id];
    if (isNumerical(cur)) setAns(cur.id, numInput.trim());
    const answered = val != null && val !== "";
    setStatus((p) => ({ ...p, [cur.id]: answered ? "markedAnswered" : "marked" }));
    goNext();
  }

  function clearResponse() {
    if (!cur) return;
    setAnswers((p) => { const n = { ...p }; delete n[cur.id]; return n; });
    setNumInput("");
    setStatus((p) => ({ ...p, [cur.id]: "notAnswered" }));
  }

  function goNext() {
    if (curIdx < flat.length - 1) setCurIdx(curIdx + 1);
  }

  function gotoFlat(i: number) {
    setCurIdx(i);
    setPaletteOpen(false);
  }

  function gotoSection(i: number) {
    setSecIdx(i);
    const first = sections[i]?.items[0]?.flatIndex;
    if (first != null) setCurIdx(first);
  }

  function submit() {
    // compute results
    const perSubject: Record<string, { correct: number; wrong: number; unattempted: number; marks: number; total: number }> = {};
    let correct = 0, wrong = 0, unattempted = 0, marks = 0;
    const weak: string[] = [];
    for (const q of questions) {
      const subj = q.subject || "General";
      perSubject[subj] = perSubject[subj] || { correct: 0, wrong: 0, unattempted: 0, marks: 0, total: 0 };
      perSubject[subj].total++;
      const ans = answers[q.id];
      if (ans == null || ans === "") { unattempted++; perSubject[subj].unattempted++; continue; }
      if (isCorrect(q, ans)) { correct++; marks += CORRECT; perSubject[subj].correct++; perSubject[subj].marks += CORRECT; }
      else { wrong++; marks += WRONG; perSubject[subj].wrong++; perSubject[subj].marks += WRONG; if (q.topic) weak.push(q.topic); }
    }
    const timeSpent = Math.round((Date.now() - startRef.current) / 1000);
    setResult({ correct, wrong, unattempted, marks, perSubject, timeSpent, maxMarks: questions.length * CORRECT });

    // record attempt for Progress (score = correct count, % based)
    try {
      addAttempt({
        id: `mock_${Date.now()}`,
        quizId: id || "mock",
        title: paper.title || "Mock Test",
        subject: (paper.subject as Subject) || ("Physics" as Subject),
        examType: (paper.examType as ExamType) || ("JEE" as ExamType),
        score: correct,
        totalQuestions: questions.length,
        timeSpent,
        date: new Date().toISOString(),
        answers: Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, Number(v) || 0])),
        weakTopics: [...new Set(weak)].slice(0, 6),
      });
    } catch (e) { console.warn("[MockTest] attempt save failed", e); }

    setStage("result");
  }

  const [result, setResult] = useState<null | {
    correct: number; wrong: number; unattempted: number; marks: number; maxMarks: number; timeSpent: number;
    perSubject: Record<string, { correct: number; wrong: number; unattempted: number; marks: number; total: number }>;
  }>(null);

  // ---------- INSTRUCTIONS ----------
  if (stage === "instructions") {
    const numA = questions.filter((q) => !isNumerical(q)).length;
    const numB = questions.filter((q) => isNumerical(q)).length;
    return (
      <div className="min-h-full max-w-[720px] mx-auto px-4 pt-10 pb-24">
        <div className="text-center mb-5">
          <div className="text-[20px] font-bold" style={{ color: colors.foreground }}>{paper.title || "Mock Test"}</div>
          <div className="flex items-center justify-center gap-4 mt-2 text-[13px]" style={{ color: colors.mutedForeground }}>
            <span>⏱ {durationMin} mins</span>
            <span>·</span>
            <span>Max Marks: {questions.length * CORRECT}</span>
          </div>
        </div>
        <div className="rounded-2xl p-4 border bg-white shadow-sm mb-4" style={{ borderColor: colors.border }}>
          <div className="font-semibold mb-2" style={{ color: colors.foreground }}>Read the instructions carefully</div>
          <ol className="list-decimal pl-5 space-y-1.5 text-[13px]" style={{ color: colors.mutedForeground }}>
            <li>The test contains {questions.length} questions.</li>
            <li>Section A has {numA} MCQs — each has 4 options with only one correct answer.</li>
            <li>Section B has {numB} numerical-answer questions.</li>
            <li>You have {durationMin} minutes to finish the test.</li>
            <li>You get <b style={{ color: colors.success }}>+{CORRECT}</b> for each correct answer and <b style={{ color: colors.destructive }}>{WRONG}</b> for each wrong answer.</li>
            <li>Unanswered questions get 0 marks. The test auto-submits when time ends.</li>
          </ol>
        </div>
        <label className="flex items-center gap-2 mb-4 text-[13px]" style={{ color: colors.foreground }}>
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          I have read and understood all the instructions.
        </label>
        <div className="flex gap-2">
          <button onClick={() => nav("/pyp")} className="flex-1 py-3 rounded-2xl border text-sm font-semibold" style={{ borderColor: colors.border, background: colors.secondary, color: colors.foreground }}>Back</button>
          <button disabled={!agreed} onClick={() => { setStage("test"); startRef.current = Date.now(); }} className="flex-1 py-3 rounded-2xl text-white text-sm font-semibold disabled:opacity-50" style={{ background: colors.primary }}>I am ready to begin</button>
        </div>
      </div>
    );
  }

  // ---------- RESULT ----------
  if (stage === "result" && result) {
    const pct = Math.round((result.correct / questions.length) * 100);
    return (
      <div className="min-h-full max-w-[680px] mx-auto px-4 pt-10 pb-24">
        <div className="text-center mb-5">
          <div className="text-[22px] font-bold" style={{ color: colors.foreground }}>Test Submitted 🎉</div>
          <div className="text-[13px]" style={{ color: colors.mutedForeground }}>{paper.title}</div>
        </div>
        <div className="rounded-2xl p-5 border bg-white shadow-sm mb-4 text-center" style={{ borderColor: colors.border }}>
          <div className="text-[13px]" style={{ color: colors.mutedForeground }}>Your Score</div>
          <div className="text-4xl font-black my-1" style={{ color: colors.primary }}>{result.marks} <span className="text-lg" style={{ color: colors.mutedForeground }}>/ {result.maxMarks}</span></div>
          <div className="text-[12px]" style={{ color: colors.mutedForeground }}>Accuracy {pct}% · Time {Math.floor(result.timeSpent / 60)}m {result.timeSpent % 60}s</div>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { l: "Correct", v: result.correct, c: colors.success },
            { l: "Wrong", v: result.wrong, c: colors.destructive },
            { l: "Skipped", v: result.unattempted, c: colors.mutedForeground },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl p-3 border bg-white text-center shadow-sm" style={{ borderColor: colors.border }}>
              <div className="text-2xl font-bold" style={{ color: s.c }}>{s.v}</div>
              <div className="text-[11px]" style={{ color: colors.mutedForeground }}>{s.l}</div>
            </div>
          ))}
        </div>
        <div className="rounded-2xl p-4 border bg-white shadow-sm mb-4" style={{ borderColor: colors.border }}>
          <div className="font-semibold mb-3" style={{ color: colors.foreground }}>Subject-wise</div>
          {Object.entries(result.perSubject).map(([subj, s]) => (
            <div key={subj} className="flex items-center justify-between py-2 text-[13px]" style={{ borderBottom: `1px solid ${colors.border}` }}>
              <span className="font-medium" style={{ color: colors.foreground }}>{subj}</span>
              <span style={{ color: colors.mutedForeground }}>
                <b style={{ color: colors.success }}>{s.correct}✓</b> · <b style={{ color: colors.destructive }}>{s.wrong}✗</b> · {s.marks} marks
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => nav("/progress")} className="flex-1 py-3 rounded-2xl border text-sm font-semibold" style={{ borderColor: colors.border, background: colors.secondary, color: colors.foreground }}>View Progress</button>
          <button onClick={() => nav("/pyp")} className="flex-1 py-3 rounded-2xl text-white text-sm font-semibold" style={{ background: colors.primary }}>Done</button>
        </div>
      </div>
    );
  }

  // ---------- TEST ----------
  const palette = (
    <div className="flex flex-col h-full">
      <div className="px-3 py-3 border-b" style={{ borderColor: colors.border }}>
        <div className="text-[12px] font-bold mb-2" style={{ color: colors.foreground }}>{curSection?.label}</div>
        <div className="grid grid-cols-5 gap-1.5">
          {curSection?.items.map((it, i) => {
            const st = status[it.q.id] || "notVisited";
            const bg = st === "answered" ? colors.success
              : st === "notAnswered" ? colors.destructive
              : st === "marked" ? "#7c3aed"
              : st === "markedAnswered" ? "#7c3aed"
              : "#fff";
            const fg = st === "notVisited" ? colors.foreground : "#fff";
            return (
              <button key={it.q.id} onClick={() => gotoFlat(it.flatIndex)}
                className="h-8 rounded-md text-[12px] font-bold border relative"
                style={{ background: bg, color: fg, borderColor: st === "notVisited" ? colors.border : bg }}>
                {i + 1}
                {st === "markedAnswered" && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full" style={{ background: colors.success }} />}
              </button>
            );
          })}
        </div>
      </div>
      <div className="px-3 py-2 text-[10px] flex flex-col gap-1" style={{ color: colors.mutedForeground }}>
        <span><span className="inline-block w-3 h-3 rounded mr-1 align-middle" style={{ background: colors.success }} />Answered</span>
        <span><span className="inline-block w-3 h-3 rounded mr-1 align-middle" style={{ background: colors.destructive }} />Not answered</span>
        <span><span className="inline-block w-3 h-3 rounded mr-1 align-middle" style={{ background: "#7c3aed" }} />Marked for review</span>
        <span><span className="inline-block w-3 h-3 rounded mr-1 align-middle border" style={{ background: "#fff", borderColor: colors.border }} />Not visited</span>
      </div>
      <div className="mt-auto p-3">
        <button onClick={() => { if (window.confirm("Submit the test now?")) submit(); }} className="w-full py-2.5 rounded-xl text-white font-bold text-[13px]" style={{ background: colors.primary }}>Submit Test</button>
      </div>
    </div>
  );

  const flatNoInSection = (curSection?.items.findIndex((it) => it.flatIndex === curIdx) ?? 0) + 1;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: colors.background }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b bg-white sticky top-0 z-20" style={{ borderColor: colors.border }}>
        <div className="text-[13px] font-bold truncate max-w-[45%]" style={{ color: colors.foreground }}>{paper.title}</div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg" style={{ background: timeLeft < 300 ? "#fee2e2" : colors.secondary }}>
          <Icon name="clock" size={14} color={timeLeft < 300 ? colors.destructive : colors.foreground} />
          <span className="text-[13px] font-bold tabular-nums" style={{ color: timeLeft < 300 ? colors.destructive : colors.foreground }}>{fmtTime(timeLeft)}</span>
        </div>
        <button onClick={() => setPaletteOpen(true)} className="md:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold" style={{ background: colors.primary, color: "#fff" }}>
          <Icon name="grid" size={13} color="#fff" /> Palette
        </button>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1.5 px-3 py-2 overflow-x-auto border-b bg-white" style={{ borderColor: colors.border }}>
        {sections.map((s, i) => (
          <button key={s.key} onClick={() => gotoSection(i)} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap"
            style={{ background: i === secIdx ? colors.primary : colors.secondary, color: i === secIdx ? "#fff" : colors.foreground }}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex-1 flex">
        {/* Question area */}
        <div className="flex-1 px-4 py-4 max-w-[760px]">
          {cur && (
            <>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[13px] font-bold" style={{ color: colors.foreground }}>Question {flatNoInSection}</div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded-md font-bold" style={{ background: "#dcfce7", color: "#14532d" }}>+{CORRECT}</span>
                  <span className="px-2 py-0.5 rounded-md font-bold" style={{ background: "#fee2e2", color: "#991b1b" }}>{WRONG}</span>
                </div>
              </div>
              <div className="text-[15px] mb-4 leading-relaxed" style={{ color: colors.foreground }}>{cur.text}</div>

              {isNumerical(cur) ? (
                <input
                  type="number"
                  value={numInput}
                  onChange={(e) => { setNumInput(e.target.value); setAns(cur.id, e.target.value); }}
                  placeholder="Enter your numerical answer"
                  className="w-full max-w-[280px] rounded-xl border px-4 py-3 text-[15px] outline-none"
                  style={{ borderColor: colors.primary, background: "#fff", color: colors.foreground }}
                />
              ) : (
                <div className="flex flex-col gap-2.5 max-w-[560px]">
                  {(cur.options || []).filter((o) => o !== "").map((opt, idx) => {
                    const selected = answers[cur.id] === String(idx);
                    return (
                      <button key={idx} onClick={() => setAns(cur.id, String(idx))}
                        className="flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-[14px]"
                        style={{ borderColor: selected ? colors.primary : colors.border, background: selected ? "#eff6ff" : "#fff", color: colors.foreground }}>
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
                          style={{ background: selected ? colors.primary : colors.muted, color: selected ? "#fff" : colors.mutedForeground }}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Palette — side panel on desktop */}
        <div className="hidden md:flex w-[260px] border-l bg-white" style={{ borderColor: colors.border }}>
          {palette}
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex gap-2 px-3 py-2.5 border-t bg-white sticky bottom-0" style={{ borderColor: colors.border }}>
        <button onClick={markAndNext} className="flex-1 py-2.5 rounded-xl border text-[12px] font-semibold" style={{ borderColor: "#7c3aed", color: "#7c3aed", background: "#f5f3ff" }}>Mark &amp; Next</button>
        <button onClick={clearResponse} className="px-3 py-2.5 rounded-xl border text-[12px] font-semibold" style={{ borderColor: colors.border, color: colors.foreground, background: colors.secondary }}>Clear</button>
        <button onClick={saveAndNext} className="flex-1 py-2.5 rounded-xl text-white text-[12px] font-bold" style={{ background: colors.primary }}>Save &amp; Next</button>
      </div>

      {/* Mobile palette drawer */}
      {paletteOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden" onClick={() => setPaletteOpen(false)}>
          <div className="ml-auto w-[80%] max-w-[320px] bg-white h-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-3 py-2.5 border-b" style={{ borderColor: colors.border }}>
              <span className="font-bold text-[13px]" style={{ color: colors.foreground }}>{profile.name}</span>
              <button onClick={() => setPaletteOpen(false)}><Icon name="x" size={18} color={colors.foreground} /></button>
            </div>
            {palette}
          </div>
        </div>
      )}
    </div>
  );
}
