// Mock Test Practice: student picks a subject (from their class's questions),
// selects topics, and gets a random 30-question timed test. The test itself and
// the result screen are handled by QuizSession (same as other quizzes).
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, Check, Clock, Shuffle, Sparkles } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { colors } from "@/lib/colors";
import { scopeQuestionsForClass } from "@/lib/scope";
import type { Question } from "@/lib/types";

const TEST_SIZE = 30;
const MIN_PER_Q = 1.2; // minutes per question

const shuffle = <T,>(arr: T[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export default function Practice() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { profile, questions } = useApp();

  // Only MCQs the student is allowed to see (their class / exam scope).
  const pool = useMemo(
    () => scopeQuestionsForClass(questions as any[], profile.classLevel)
      .filter((q: Question) => Array.isArray(q.options) && q.options.length >= 2) as Question[],
    [questions, profile.classLevel],
  );

  const subjects = useMemo(() => {
    const m = new Map<string, number>();
    pool.forEach((q) => q.subject && m.set(q.subject, (m.get(q.subject) || 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [pool]);

  const initial = params.get("subject");
  const [subject, setSubject] = useState<string | null>(
    initial && subjects.some(([s]) => s === initial) ? initial : null,
  );

  const topics = useMemo(() => {
    if (!subject) return [];
    const m = new Map<string, number>();
    pool.filter((q) => q.subject === subject).forEach((q) => {
      const t = q.topic || "General";
      m.set(t, (m.get(t) || 0) + 1);
    });
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [pool, subject]);

  // Every topic starts selected whenever the subject changes.
  const [picked, setPicked] = useState<Set<string>>(new Set());
  useEffect(() => { setPicked(new Set(topics.map(([t]) => t))); }, [topics]);
  const allSelected = topics.length > 0 && picked.size === topics.length;
  const toggle = (t: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t); else next.add(t);
      return next;
    });

  const available = useMemo(
    () => pool.filter((q) => q.subject === subject && picked.has(q.topic || "General")),
    [pool, subject, picked],
  );
  const count = Math.min(TEST_SIZE, available.length);
  const minutes = Math.max(5, Math.round(count * MIN_PER_Q));

  const start = () => {
    if (!subject || count === 0) return;
    const qs = shuffle(available).slice(0, count);
    const chosen = allSelected ? "All topics" : [...picked].join(", ");
    nav(`/quiz/practice-${Date.now()}`, {
      state: {
        title: `${subject} Mock Test`,
        questions: qs,
        timeLimitMin: minutes,
        examType: profile.classLevel ? "BOARD" : profile.targetExam,
        subject,
        topic: chosen,
        difficulty: "Mixed",
      },
    });
  };

  return (
    <div className="pb-28">
      {/* Header */}
      <div className="am-grad relative overflow-hidden rounded-b-[26px] px-4 pb-6 pt-12 text-white">
        <span className="am-orbit pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full border border-white/20">
          <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-300" />
        </span>
        <div className="relative flex items-center gap-3">
          <button onClick={() => (subject && !initial ? setSubject(null) : nav(-1))}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15" aria-label="Back">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-violet-200">
              <Sparkles size={12} /> Mock test practice
            </div>
            <div className="text-[19px] font-extrabold leading-tight">
              {subject ? subject : "Choose a subject"}
            </div>
          </div>
        </div>
        <div className="relative mt-4 flex gap-2 text-[11px] font-semibold">
          <span className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1"><Shuffle size={12} /> {TEST_SIZE} random Qs</span>
          <span className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1"><Clock size={12} /> ~{Math.round(TEST_SIZE * MIN_PER_Q)} min</span>
          <span className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1"><Check size={12} /> Instant result</span>
        </div>
      </div>

      <div className="px-4 pt-5">
        {!subject ? (
          questions.length === 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl" style={{ background: colors.muted }} />)}
            </div>
          ) : subjects.length === 0 ? (
            <div className="py-16 text-center text-[13px]" style={{ color: colors.mutedForeground }}>
              <BookOpen className="mx-auto mb-2" size={30} />
              No questions are available for your class yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {subjects.map(([s, n]) => (
                <button key={s} onClick={() => setSubject(s)}
                  className="rounded-2xl border bg-white p-4 text-left" style={{ borderColor: colors.border }}>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: colors.secondary }}>
                    <BookOpen size={18} color={colors.primary} />
                  </span>
                  <div className="mt-3 text-[15px] font-bold" style={{ color: colors.foreground }}>{s}</div>
                  <div className="text-[11px]" style={{ color: colors.mutedForeground }}>{n} questions</div>
                </button>
              ))}
            </div>
          )
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[15px] font-bold" style={{ color: colors.foreground }}>
                Topics <span className="text-[12px] font-medium" style={{ color: colors.mutedForeground }}>({topics.length})</span>
              </div>
              <button onClick={() => setPicked(allSelected ? new Set() : new Set(topics.map(([t]) => t)))}
                className="text-[12px] font-semibold" style={{ color: colors.primary }}>
                {allSelected ? "Clear all" : "Select all"}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {topics.map(([t, n]) => {
                const on = picked.has(t);
                return (
                  <button key={t} onClick={() => toggle(t)}
                    className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors"
                    style={on
                      ? { background: colors.secondary, borderColor: "#c4b5fd", color: "#4c1d95" }
                      : { background: "#fff", borderColor: colors.border, color: colors.mutedForeground }}>
                    {on && <Check size={12} />} {t} <span className="opacity-60">· {n}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Sticky start bar */}
      {subject && (
        <div className="fixed inset-x-0 bottom-[64px] z-40 mx-auto max-w-[640px] px-4 pb-3">
          <div className="rounded-2xl border bg-white/95 p-3 shadow-[0_-10px_30px_-20px_rgba(46,16,101,.5)] backdrop-blur"
            style={{ borderColor: colors.border }}>
            <div className="mb-2 text-center text-[12px]" style={{ color: colors.mutedForeground }}>
              {count === 0
                ? "Select at least one topic"
                : `${count} questions · ${minutes} min${available.length < TEST_SIZE ? ` (only ${available.length} available)` : ""}`}
            </div>
            <button onClick={start} disabled={count === 0}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-bold text-white disabled:opacity-50"
              style={{ background: colors.primaryGradient }}>
              Start Mock Test <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
