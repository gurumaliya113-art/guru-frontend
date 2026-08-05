import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Icon, ProgressBar } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { filterQuestions } from "@/data/questions";
import { colors } from "@/lib/colors";
import type { ExamType, Question, Subject } from "@/lib/types";

type Phase = "intro" | "quiz" | "result";

interface QuizState {
  title?: string;
  questions?: Question[];
  timeLimitMin?: number;
  examType?: string;
  subject?: string;
  topic?: string;
  difficulty?: string;
}

export default function QuizSession() {
  const nav = useNavigate();
  const location = useLocation();
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const { addAttempt, questions: pool } = useApp();
  const state = location.state as QuizState | null;

  const title = state?.title || params.get("title") || "Quiz";
  const subject = state?.subject || params.get("subject") || "All";
  const topic = state?.topic || params.get("topic") || "All";
  const difficulty = state?.difficulty || params.get("difficulty") || "All";
  const examType = state?.examType || params.get("examType") || "All";
  const timeLimitMin = state?.timeLimitMin ?? parseInt(params.get("timeLimit") || "15", 10);
  const questionsCount = parseInt(params.get("questionsCount") || "10", 10);
  const timeLimit = timeLimitMin * 60;

  const questions = useMemo(() => {
    if (state?.questions) return state.questions;
    return filterQuestions(pool, subject, topic, difficulty, examType, questionsCount);
  }, [pool, state?.questions, subject, topic, difficulty, examType, questionsCount]);

  const subjects = useMemo(
    () => Array.from(new Set(questions.map((q) => q.subject))),
    [questions],
  );

  const [phase, setPhase] = useState<Phase>("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [startTime, setStartTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const finishQuiz = useCallback(
    (timedOut = false) => {
      if (timerRef.current) clearInterval(timerRef.current);
      const score = questions.reduce(
        (sum, q) => sum + (answers[q.id] === q.correctIndex ? 1 : 0),
        0
      );
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      const wrongQs = questions.filter((q) => answers[q.id] !== q.correctIndex);
      const weakTopics = Array.from(new Set(wrongQs.map((q) => q.topic)));

      addAttempt({
        id: Date.now().toString(),
        quizId: id,
        title,
        subject: subject as Subject,
        examType: examType as ExamType,
        score,
        totalQuestions: questions.length,
        timeSpent,
        date: new Date().toISOString(),
        answers,
        weakTopics,
      });

      if (timedOut) alert("Time's up! Quiz submitted automatically.");
      setPhase("result");
    },
    [answers, questions, startTime, id, title, subject, examType, addAttempt]
  );

  useEffect(() => {
    if (phase !== "quiz") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { finishQuiz(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, finishQuiz]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  if (questions.length === 0) {
    return (
      <div className="min-h-full pt-12 px-4 pb-8 max-w-[640px] mx-auto">
        <button
          onClick={() => nav(-1)}
          className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
          style={{ background: colors.secondary }}
        >
          <Icon name="arrow-left" size={20} color={colors.foreground} />
        </button>
        <div className="rounded-2xl p-6 border bg-white text-center" style={{ borderColor: colors.border }}>
          <div className="text-lg font-semibold mb-2" style={{ color: colors.foreground }}>No questions available</div>
          <div className="text-sm" style={{ color: colors.mutedForeground }}>
            We could not load any questions for this quiz. Please go back and choose another paper.
          </div>
        </div>
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <div className="min-h-full pt-12 px-4 pb-8 max-w-[640px] mx-auto">
        <button
          onClick={() => nav(-1)}
          className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
          style={{ background: colors.secondary }}
        >
          <Icon name="arrow-left" size={20} color={colors.foreground} />
        </button>

        <div className="rounded-3xl p-8 flex flex-col items-center mb-5 text-white gap-3" style={{ background: colors.primary }}>
          <Icon name="play-circle" size={48} color="#fff" />
          <div className="text-xl font-bold text-center">{title}</div>
          <div className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>{subject}</div>
        </div>

        <div className="flex flex-wrap gap-2.5 mb-4">
          {[
            { icon: "help-circle", label: "Questions", value: `${questions.length}` },
            { icon: "clock", label: "Time Limit", value: `${timeLimitMin} min` },
            { icon: "bar-chart", label: "Difficulty", value: difficulty },
            { icon: "target", label: "Exam", value: examType },
          ].map((it) => (
            <div key={it.label} className="basis-[calc(50%-5px)] rounded-2xl p-3.5 border bg-white flex flex-col items-center gap-1.5"
              style={{ borderColor: colors.border }}>
              <Icon name={it.icon} size={20} color={colors.primary} />
              <div className="text-base font-bold" style={{ color: colors.foreground }}>{it.value}</div>
              <div className="text-[11px]" style={{ color: colors.mutedForeground }}>{it.label}</div>
            </div>
          ))}
        </div>

        {subjects.length > 1 && (
          <div className="flex flex-wrap gap-2.5 mb-4">
            {subjects.map((subjectName) => (
              <span key={subjectName} className="rounded-full px-3 py-1 text-[12px] font-semibold"
                style={{ background: colors.secondary, color: colors.mutedForeground }}>
                {subjectName}
              </span>
            ))}
          </div>
        )}

        <div className="rounded-2xl p-4 border bg-white mb-5" style={{ borderColor: colors.border }}>
          <div className="text-[15px] font-semibold mb-3" style={{ color: colors.foreground }}>Instructions</div>
          {[
            "Each question has one correct answer",
            "Explanation shown after each answer",
            "Timer runs throughout the quiz",
            "Results and weak areas shown at the end",
          ].map((rule) => (
            <div key={rule} className="flex items-center gap-2.5 mb-2 last:mb-0">
              <Icon name="check" size={14} color={colors.neet} />
              <span className="text-[13px]" style={{ color: colors.mutedForeground }}>{rule}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => { setPhase("quiz"); setStartTime(Date.now()); }}
          className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-white font-bold active:scale-[0.98] transition"
          style={{ background: colors.primary }}
        >
          <Icon name="play" size={18} color="#fff" /> Start Quiz
        </button>
      </div>
    );
  }

  if (phase === "quiz") {
    const q = questions[currentIndex];
    const selectedAnswer = answers[q.id];
    const hasAnswered = selectedAnswer !== undefined;
    const timerPct = timeLeft / timeLimit;
    const timerColor = timerPct > 0.5 ? colors.neet : timerPct > 0.2 ? colors.warning : colors.destructive;

    const handleAnswer = (idx: number) => {
      setAnswers((prev) => ({ ...prev, [q.id]: idx }));
      setShowExplanation(true);
    };

    const next = () => {
      setShowExplanation(false);
      if (currentIndex < questions.length - 1) setCurrentIndex((i) => i + 1);
      else finishQuiz(false);
    };

    return (
      <div className="min-h-full pt-12 max-w-[640px] mx-auto">
        <div className="flex items-center gap-3 px-4 pb-3">
          <button
            onClick={() => {
              if (window.confirm("Quit quiz? Progress will be lost.")) {
                if (timerRef.current) clearInterval(timerRef.current);
                nav(-1);
              }
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: colors.secondary }}
          >
            <Icon name="x" size={18} color={colors.foreground} />
          </button>
          <div className="flex-1">
            <div className="text-xs mb-1" style={{ color: colors.mutedForeground }}>
              {currentIndex + 1} / {questions.length}
            </div>
            <ProgressBar progress={(currentIndex + 1) / questions.length} height={6} />
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-2xl text-[13px] font-bold"
            style={{ background: timerColor + "20", color: timerColor }}>
            <Icon name="clock" size={13} color={timerColor} />
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="px-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {questions.map((question, idx) => {
              const answered = answers[question.id] !== undefined;
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={question.id}
                  onClick={() => setCurrentIndex(idx)}
                  className="rounded-full px-3 py-1 text-[12px] font-semibold border"
                  style={{
                    background: isCurrent ? colors.primary : answered ? colors.neetLight : colors.secondary,
                    color: isCurrent ? "#fff" : answered ? colors.neet : colors.mutedForeground,
                    borderColor: isCurrent ? colors.primary : colors.border,
                  }}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-4 pt-2 pb-10">
          <div className="flex gap-2 mb-4 flex-wrap">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-medium" style={{ background: colors.physics + "20", color: colors.physics }}>{q.subject}</span>
            <span className="px-2.5 py-1 rounded-md text-[11px] font-medium" style={{ background: colors.secondary, color: colors.mutedForeground }}>{q.topic}</span>
            {q.year && (
              <span className="px-2.5 py-1 rounded-md text-[11px] font-medium" style={{ background: colors.jeeLight, color: colors.jee }}>PYQ {q.year}</span>
            )}
          </div>

          <div className="text-[17px] font-semibold leading-7 mb-3" style={{ color: colors.foreground }}>{q.text}</div>

          {q.pageImageUrl && (
            <div className="mb-5 rounded-xl overflow-hidden border" style={{ borderColor: colors.border }}>
              <img
                src={q.pageImageUrl}
                alt="Question diagram"
                className="w-full block"
                style={{ background: "#fff", maxHeight: 420, objectFit: "contain" }}
                loading="lazy"
              />
            </div>
          )}

          <div className="flex flex-col gap-2.5 mb-4">
            {q.options.map((option, idx) => {
              let bg = colors.card, border = colors.border, textC = colors.foreground;
              if (hasAnswered) {
                if (idx === q.correctIndex) { bg = colors.neetLight; border = colors.neet; textC = colors.neetForeground; }
                else if (idx === selectedAnswer) { bg = "#fee2e2"; border = colors.destructive; textC = colors.destructive; }
              }
              return (
                <button
                  key={idx}
                  disabled={hasAnswered}
                  onClick={() => !hasAnswered && handleAnswer(idx)}
                  className="flex items-center rounded-2xl p-3.5 gap-3 text-left transition"
                  style={{ background: bg, border: `1.5px solid ${border}` }}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                    style={{
                      background: hasAnswered
                        ? idx === q.correctIndex ? colors.neet
                          : idx === selectedAnswer ? colors.destructive : colors.muted
                        : colors.muted,
                      color: hasAnswered && (idx === q.correctIndex || idx === selectedAnswer) ? "#fff" : colors.mutedForeground,
                    }}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <div className="flex-1 text-sm leading-5" style={{ color: textC }}>{option}</div>
                  {hasAnswered && idx === q.correctIndex && <Icon name="check-circle" size={18} color={colors.neet} />}
                  {hasAnswered && idx === selectedAnswer && idx !== q.correctIndex && <Icon name="x-circle" size={18} color={colors.destructive} />}
                </button>
              );
            })}
          </div>

          {showExplanation && (
            <div className="rounded-2xl p-3.5 border bg-white mb-4" style={{ borderColor: colors.border }}>
              <div className="flex items-center gap-2 mb-2">
                <Icon name="info" size={15} color={colors.info} />
                <div className="text-sm font-semibold" style={{ color: colors.foreground }}>Explanation</div>
              </div>
              <div className="text-[13px] leading-5" style={{ color: colors.mutedForeground }}>{q.explanation}</div>
            </div>
          )}

          {hasAnswered && (
            <button
              onClick={next}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-white font-semibold"
              style={{ background: colors.primary }}
            >
              {currentIndex < questions.length - 1 ? "Next Question" : "Finish Quiz"}
              <Icon name="arrow-right" size={18} color="#fff" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Result
  const score = questions.reduce((sum, q) => sum + (answers[q.id] === q.correctIndex ? 1 : 0), 0);
  const pct = Math.round((score / questions.length) * 100);
  const resultColor = pct >= 70 ? colors.neet : pct >= 50 ? colors.warning : colors.destructive;
  const skipped = questions.filter((q) => answers[q.id] === undefined).length;

  return (
    <div className="min-h-full pt-12 px-4 pb-8 max-w-[640px] mx-auto">
      <div className="flex flex-col items-center pt-5">
        <div className="w-36 h-36 rounded-full border-[6px] flex flex-col items-center justify-center mb-5"
          style={{ borderColor: resultColor }}>
          <div className="text-4xl font-bold" style={{ color: resultColor }}>{pct}%</div>
          <div className="text-sm" style={{ color: colors.mutedForeground }}>{score}/{questions.length}</div>
        </div>

        <div className="text-2xl font-bold mb-2 text-center" style={{ color: colors.foreground }}>
          {pct >= 80 ? "Excellent work!" : pct >= 60 ? "Good effort!" : "Keep practicing!"}
        </div>
        <div className="text-sm text-center mb-6 px-5 leading-5" style={{ color: colors.mutedForeground }}>
          {pct >= 80 ? "You have a strong grasp of this topic."
            : pct >= 60 ? "Review the explanations to improve further."
            : "Focus on your weak areas and retry."}
        </div>

        <div className="flex gap-2.5 mb-6 w-full">
          {[
            { v: score, l: "Correct", c: colors.neet },
            { v: questions.length - score, l: "Wrong", c: colors.destructive },
            { v: skipped, l: "Skipped", c: colors.jee },
          ].map((s) => (
            <div key={s.l} className="flex-1 rounded-2xl p-3.5 border bg-white flex flex-col items-center" style={{ borderColor: colors.border }}>
              <div className="text-2xl font-bold mb-1" style={{ color: s.c }}>{s.v}</div>
              <div className="text-xs" style={{ color: colors.mutedForeground }}>{s.l}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-2.5 w-full">
          <button
            onClick={() => nav(-1)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border bg-white font-semibold text-sm"
            style={{ borderColor: colors.border, color: colors.foreground }}
          >
            <Icon name="arrow-left" size={16} color={colors.foreground} /> Back to Quiz
          </button>
          <button
            onClick={() => {
              setPhase("intro");
              setCurrentIndex(0);
              setAnswers({});
              setShowExplanation(false);
              setTimeLeft(timeLimit);
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-semibold text-sm"
            style={{ background: colors.primary }}
          >
            <Icon name="refresh-cw" size={16} color="#fff" /> Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
