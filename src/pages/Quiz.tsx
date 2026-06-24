import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Icon, QuizCard, Spinner } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";
import { colors } from "@/lib/colors";
import { showExamTracks } from "@/lib/scope";
import type { ExamType, Question, Subject } from "@/lib/types";

const EXAM_TYPES: ExamType[] = ["NEET", "JEE", "BITS", "BOARD"];

// A quiz is generated on the fly from the question bank for the student's
// class + subject + topic, so a Class-6 student only ever sees Class-6 quizzes.
interface GeneratedQuiz {
  id: string;
  title: string;
  subject: Subject;
  topic: string;
  questionsCount: number;
  timeLimit: number;
  difficulty: "Easy" | "Moderate" | "Hard";
  examType?: ExamType;
}

export default function Quiz() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { profile } = useApp();

  const cls = profile.classLevel || "";
  const examMode = showExamTracks(cls); // class 11/12 or exam aspirant

  const [all, setAll] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const initialSubject = (params.get("subject") as Subject) || "All";
  const [selectedExam, setSelectedExam] = useState<ExamType | "All">("All");
  const [selectedSubject, setSelectedSubject] = useState<Subject | "All">(initialSubject);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await api.getQuestions();
        if (!cancelled) setAll(r.questions || []);
      } catch (e) {
        console.warn("[Quiz] load failed", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Scope the pool to the student's class.
  //  - Lower classes (1–10): strictly that class's tagged questions only.
  //  - Class 11/12 & aspirants: the full bank (NEET/JEE questions are usually
  //    not class-tagged), filtered later by the exam chips.
  const pool = useMemo(() => {
    if (cls && !examMode) return all.filter((q) => String((q as any).classLevel || "") === cls);
    return all;
  }, [all, cls, examMode]);

  const subjects = useMemo(
    () => [...new Set(pool.map((q) => q.subject))].sort() as Subject[],
    [pool],
  );

  // Group the scoped pool into one quiz per subject+topic.
  const quizzes = useMemo<GeneratedQuiz[]>(() => {
    const groups = new Map<string, { subject: Subject; topic: string; qs: Question[] }>();
    for (const q of pool) {
      if (selectedSubject !== "All" && q.subject !== selectedSubject) continue;
      if (examMode && selectedExam !== "All" && !(q.examType || []).includes(selectedExam)) continue;
      const topic = q.topic || "General";
      const key = `${q.subject}|${topic}`;
      if (!groups.has(key)) groups.set(key, { subject: q.subject as Subject, topic, qs: [] });
      groups.get(key)!.qs.push(q);
    }
    return [...groups.values()]
      .filter((g) => g.qs.length >= 1)
      .sort((a, b) => b.qs.length - a.qs.length)
      .map((g) => {
        const count = Math.min(g.qs.length, 15);
        // Pick the most common difficulty as the card's label.
        const diffCount: Record<string, number> = {};
        g.qs.forEach((q) => { diffCount[q.difficulty] = (diffCount[q.difficulty] || 0) + 1; });
        const difficulty = (Object.entries(diffCount).sort(([, a], [, b]) => b - a)[0]?.[0] || "Moderate") as GeneratedQuiz["difficulty"];
        return {
          id: `${g.subject}-${g.topic}`.replace(/[^a-z0-9]+/gi, "-").toLowerCase(),
          title: g.topic === "General" ? `${g.subject} Practice` : g.topic,
          subject: g.subject,
          topic: g.topic,
          questionsCount: count,
          timeLimit: Math.max(5, Math.round(count * 1.2)),
          difficulty,
          examType: examMode ? (g.qs[0].examType?.[0] as ExamType) : undefined,
        };
      });
  }, [pool, selectedSubject, selectedExam, examMode]);

  const chip = (active: boolean, accentBg = colors.primary) => ({
    background: active ? accentBg : colors.card,
    borderColor: active ? accentBg : colors.border,
    color: active ? "#fff" : colors.mutedForeground,
  });

  const startQuiz = (quiz: GeneratedQuiz) => {
    const sp = new URLSearchParams({
      title: quiz.title,
      subject: quiz.subject,
      topic: quiz.topic,
      difficulty: "All",
      examType: quiz.examType || "All",
      timeLimit: String(quiz.timeLimit),
      questionsCount: String(quiz.questionsCount),
    });
    // Lower classes carry their class level so the runner stays in-scope.
    if (cls && !examMode) sp.set("classLevel", cls);
    nav(`/quiz/${quiz.id}?${sp.toString()}`);
  };

  return (
    <div className="pb-5">
      {/* Header with back button */}
      <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 border-b bg-white" style={{ borderColor: colors.border }}>
        <button
          onClick={() => nav(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center border active:scale-95 transition"
          style={{ borderColor: colors.border, background: colors.card }}
          aria-label="Back"
        >
          <Icon name="arrow-left" size={18} color={colors.foreground} />
        </button>
        <div className="flex-1">
          <div className="text-[17px] font-bold" style={{ color: colors.foreground }}>Quiz Mode</div>
          <div className="text-[11px]" style={{ color: colors.mutedForeground }}>
            {cls ? `Class ${cls}` : profile.targetExam} · timed practice
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* Exam chips only for class 11/12 and exam aspirants */}
        {examMode && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-1">
            {(["All", ...EXAM_TYPES] as const).map((ex) => (
              <button
                key={ex}
                onClick={() => setSelectedExam(ex as ExamType | "All")}
                className="px-3.5 py-1.5 rounded-full text-[13px] font-medium border whitespace-nowrap"
                style={chip(selectedExam === ex)}
              >
                {ex}
              </button>
            ))}
          </div>
        )}

        {/* Subject chips — derived from the student's class content */}
        {subjects.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
            {(["All", ...subjects] as const).map((sub) => {
              const active = selectedSubject === sub;
              return (
                <button
                  key={sub}
                  onClick={() => setSelectedSubject(sub as Subject | "All")}
                  className="px-3.5 py-1.5 rounded-full text-[13px] border whitespace-nowrap"
                  style={{
                    background: active ? colors.secondary : colors.card,
                    borderColor: active ? colors.mutedForeground : colors.border,
                    color: active ? colors.foreground : colors.mutedForeground,
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {sub}
                </button>
              );
            })}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16"><Spinner size={32} color={colors.primary} /></div>
        ) : (
          <>
            <div className="text-xs mb-3 mt-1" style={{ color: colors.mutedForeground }}>
              {quizzes.length} quizzes
            </div>

            {quizzes.map((quiz) => (
              <QuizCard
                key={quiz.id}
                title={quiz.title}
                subject={quiz.subject}
                questionsCount={quiz.questionsCount}
                timeLimit={quiz.timeLimit}
                difficulty={quiz.difficulty}
                tag={quiz.examType}
                onClick={() => startQuiz(quiz)}
              />
            ))}

            {quizzes.length === 0 && (
              <div className="flex flex-col items-center py-16 gap-3 text-center" style={{ color: colors.mutedForeground }}>
                <Icon name="inbox" size={40} color={colors.mutedForeground} />
                <span className="text-[15px]">
                  {cls
                    ? `No quizzes for Class ${cls} yet`
                    : "No quizzes match your filters"}
                </span>
                <span className="text-[12px] max-w-[260px]">
                  New quizzes are added regularly. Meanwhile, try the Question Bank or AI tutor.
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
