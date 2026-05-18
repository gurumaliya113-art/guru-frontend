// PaperGenerate — step-by-step wizard for teachers.
//
// Flow: Exam → Class → Subject → Topic → Mode → Details → Generate.
// Every step is its own panel; we keep all selected values in component state
// and let the user jump back via the breadcrumb pills above the panel.
//
// Topic step shows the count of available questions next to each topic so
// the teacher can pick a topic that actually has enough questions for the
// paper they want to build.

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon, Spinner } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";
import {
  colors,
  difficultyColor,
  examColor,
  examLight,
  subjectColor,
} from "@/lib/colors";
import type { Difficulty, ExamType, Subject, Topic } from "@/lib/types";

type QuestionType =
  | "MCQ"
  | "Assertion-Reason"
  | "Case-Based"
  | "Short Answer"
  | "Long Answer";

type Mode = "manual" | "ai";
type Step = "exam" | "class" | "subject" | "topic" | "mode" | "details";

const STEPS: Step[] = ["exam", "class", "subject", "topic", "mode", "details"];
const ALL_EXAMS: ExamType[] = ["NEET", "JEE", "BOARD"];
const ALL_CLASSES = ["9", "10", "11", "12"];
const QUESTION_TYPES: QuestionType[] = [
  "MCQ",
  "Assertion-Reason",
  "Case-Based",
  "Short Answer",
  "Long Answer",
];

// Subject palette per exam — Biology only makes sense for NEET/BOARD,
// Mathematics only for JEE/BOARD, etc.
function subjectsFor(exam: ExamType): string[] {
  if (exam === "NEET") return ["Biology", "Physics", "Chemistry"];
  if (exam === "JEE") return ["Physics", "Chemistry", "Mathematics"];
  return ["Physics", "Chemistry", "Biology", "Mathematics"];
}

export default function PaperGenerate() {
  const nav = useNavigate();
  const { addPaper, profile, updateProfile, questions: pool } = useApp();

  const [step, setStep] = useState<Step>("exam");
  const [examType, setExamType] = useState<ExamType | null>(null);
  const [classLevel, setClassLevel] = useState<string | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [topic, setTopic] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode | null>(null);

  const [difficulty, setDifficulty] = useState<Difficulty>("Moderate");
  const [questionType, setQuestionType] = useState<QuestionType>("MCQ");
  const [questionCount, setQuestionCount] = useState(15);
  const [generating, setGenerating] = useState(false);
  // Per-paper header opt-out. Profile keeps the uploaded school logo so
  // teachers don't have to re-upload it every time, but for a one-off paper
  // the user can hit "Continue without header" to skip stamping it.
  const [skipHeader, setSkipHeader] = useState(false);

  const handleHeaderPick = (file: File) => {
    if (file.size > 1024 * 1024) {
      alert("Image is too large. Please pick something under 1 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : undefined;
      if (dataUrl) {
        updateProfile({ paperHeaderImage: dataUrl });
        setSkipHeader(false);
      }
    };
    reader.onerror = () => alert("Could not read the image \u2014 try a different file.");
    reader.readAsDataURL(file);
  };

  // Admin-curated topic catalogue (synced with the admin Questions drill).
  const [catalogueTopics, setCatalogueTopics] = useState<Topic[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const r = await api.getTopics();
        setCatalogueTopics(r.topics || []);
      } catch (e) {
        console.warn("[PaperGenerate] failed to load topics catalogue:", e);
      }
    })();
  }, []);

  const subjects = examType ? subjectsFor(examType) : [];

  // Topic cards for the selected subject + class + exam combo, with counts
  // pulled from the actual question pool so teachers can see at a glance
  // whether a topic has enough questions.
  const topicCards = useMemo(() => {
    if (!subject) return [] as { name: string; count: number }[];
    const subjLower = subject.toLowerCase();
    const examLower = examType?.toLowerCase();

    const countMap = new Map<string, number>();
    for (const q of pool) {
      if ((q.subject || "").toLowerCase() !== subjLower) continue;
      if (classLevel && q.classLevel && q.classLevel !== classLevel) continue;
      if (examLower) {
        const ets = (q.examType || []).map((e) => String(e).toLowerCase());
        if (!ets.includes(examLower)) continue;
      }
      const t = (q.topic || "").trim() || "Untagged";
      countMap.set(t, (countMap.get(t) || 0) + 1);
    }

    const catalogueNames = new Set<string>();
    for (const t of catalogueTopics) {
      if ((t.subject || "").toLowerCase() !== subjLower) continue;
      if (t.classLevel && classLevel && t.classLevel !== classLevel) continue;
      if (t.examType && examLower && t.examType.toLowerCase() !== examLower) continue;
      catalogueNames.add(t.name);
    }

    const all = new Set<string>([...countMap.keys(), ...catalogueNames]);
    return [...all]
      .map((name) => ({ name, count: countMap.get(name) || 0 }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [pool, catalogueTopics, subject, classLevel, examType]);

  const totalForSubject = topicCards.reduce((s, t) => s + t.count, 0);

  // Filter the pool by every selection in one place — both the live preview
  // count and the actual generation use this so they can never disagree.
  const matchingQuestions = useMemo(() => {
    if (!examType || !subject) return [];
    const subjLower = subject.toLowerCase();
    const examLower = examType.toLowerCase();
    return pool.filter((q) => {
      if ((q.subject || "").toLowerCase() !== subjLower) return false;
      if (classLevel && q.classLevel && q.classLevel !== classLevel) return false;
      const ets = (q.examType || []).map((e) => String(e).toLowerCase());
      if (!ets.includes(examLower)) return false;
      if (topic && topic !== "All" && (q.topic || "").trim() !== topic) return false;
      if (mode === "manual") {
        if (questionType && q.type && q.type !== questionType) return false;
        if (difficulty && q.difficulty !== difficulty) return false;
      }
      return true;
    });
  }, [pool, examType, subject, classLevel, topic, mode, questionType, difficulty]);

  const handleGenerate = async () => {
    if (!examType || !subject) return;
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 900));
    const shuffled = [...matchingQuestions].sort(() => Math.random() - 0.5).slice(0, questionCount);
    const paper = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
      title: `${examType} ${subject} — ${!topic || topic === "All" ? "Mixed Topics" : topic}`,
      examType,
      subject: subject as Subject,
      topic: topic || "All",
      difficulty,
      questions: shuffled,
      createdAt: new Date().toISOString(),
      skipHeader,
    };
    await addPaper(paper);
    setGenerating(false);
    nav(`/paper/${paper.id}`, { replace: true });
  };

  // ---- Step navigation ----
  const stepIndex = STEPS.indexOf(step);

  const goBack = () => {
    if (stepIndex === 0) {
      nav(-1);
      return;
    }
    setStep(STEPS[stepIndex - 1]);
  };

  // Jump back to a specific step via breadcrumb. Clears every value below
  // that step so the user can't have inconsistent state (e.g. an old topic
  // still set after switching subject).
  const jumpTo = (s: Step) => {
    const i = STEPS.indexOf(s);
    if (i < 0 || i > stepIndex) return;
    setStep(s);
    if (i <= STEPS.indexOf("exam")) { setExamType(null); }
    if (i <= STEPS.indexOf("class")) { setClassLevel(null); }
    if (i <= STEPS.indexOf("subject")) { setSubject(null); }
    if (i <= STEPS.indexOf("topic")) { setTopic(null); }
    if (i <= STEPS.indexOf("mode")) { setMode(null); }
  };

  return (
    <div className="min-h-full max-w-[680px] mx-auto pb-24">
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 pt-12 pb-3 border-b bg-white sticky top-0 z-10"
        style={{ borderColor: colors.border }}
      >
        <button
          onClick={goBack}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: colors.secondary }}
        >
          <Icon name="arrow-left" size={18} color={colors.foreground} />
        </button>
        <div className="text-[17px] font-bold" style={{ color: colors.foreground }}>
          Generate Paper
        </div>
        <div className="w-9" />
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 py-3 border-b" style={{ borderColor: colors.border, background: "#fff" }}>
        {STEPS.map((s, i) => (
          <span
            key={s}
            className="rounded-full transition-all"
            style={{
              width: i === stepIndex ? 24 : 8,
              height: 8,
              background: i <= stepIndex ? colors.primary : colors.border,
            }}
          />
        ))}
      </div>

      {/* Selected breadcrumbs */}
      {(examType || classLevel || subject || topic || mode) && (
        <div className="px-4 pt-3 flex flex-wrap gap-2">
          {examType && (
            <Crumb label={examType} onClick={() => jumpTo("exam")} color={examColor(examType)} bg={examLight(examType)} />
          )}
          {classLevel && (
            <Crumb label={`Class ${classLevel}`} onClick={() => jumpTo("class")} />
          )}
          {subject && (
            <Crumb label={subject} onClick={() => jumpTo("subject")} color={subjectColor(subject as any) || colors.primary} />
          )}
          {topic && topic !== "All" && (
            <Crumb label={topic} onClick={() => jumpTo("topic")} />
          )}
          {topic === "All" && (
            <Crumb label="All topics" onClick={() => jumpTo("topic")} />
          )}
          {mode && (
            <Crumb label={mode === "ai" ? "AI Express" : "Manual"} onClick={() => jumpTo("mode")} />
          )}
        </div>
      )}

      <div className="px-4 pt-4">
        {/* ---- STEP 1: EXAM ---- */}
        {step === "exam" && (
          <Panel title="Choose exam type" subtitle="Which board / competitive exam is this paper for?">
            <HScroll>
              {ALL_EXAMS.map((e) => (
                <BigCard
                  key={e}
                  label={e}
                  accent={examColor(e)}
                  bg={examLight(e)}
                  onClick={() => { setExamType(e); setStep("class"); }}
                />
              ))}
            </HScroll>
          </Panel>
        )}

        {/* ---- STEP 2: CLASS ---- */}
        {step === "class" && (
          <Panel title="Choose class" subtitle="Pick the grade level — questions filter to this class.">
            <HScroll>
              {ALL_CLASSES.map((c) => (
                <BigCard
                  key={c}
                  label={`Class ${c}`}
                  accent={colors.primary}
                  onClick={() => { setClassLevel(c); setStep("subject"); }}
                />
              ))}
            </HScroll>
          </Panel>
        )}

        {/* ---- STEP 3: SUBJECT ---- */}
        {step === "subject" && (
          <Panel title="Choose subject">
            <div className="grid grid-cols-2 gap-3">
              {subjects.map((s) => (
                <BigCard
                  key={s}
                  label={s}
                  accent={subjectColor(s as any) || colors.primary}
                  onClick={() => { setSubject(s); setStep("topic"); }}
                  fullWidth
                />
              ))}
            </div>
          </Panel>
        )}

        {/* ---- STEP 4: TOPIC ---- */}
        {step === "topic" && subject && (
          <Panel title={`Topics in ${subject}`} subtitle="Number next to each topic shows available questions.">
            <button
              onClick={() => { setTopic("All"); setStep("mode"); }}
              className="w-full text-left rounded-2xl border-2 bg-white p-4 mb-3 hover:shadow-md transition"
              style={{ borderColor: colors.primary }}
            >
              <div className="flex items-center justify-between">
                <div className="font-bold text-[15px]" style={{ color: colors.primary }}>
                  All topics
                </div>
                <span
                  className="text-[12px] font-bold px-2.5 py-1 rounded-md"
                  style={{ background: colors.primary + "20", color: colors.primary }}
                >
                  {totalForSubject}
                </span>
              </div>
              <div className="text-[12px] mt-1" style={{ color: colors.mutedForeground }}>
                Mix questions from every topic
              </div>
            </button>

            {topicCards.length === 0 ? (
              <EmptyState text={`No topics yet for ${subject}.`} />
            ) : (
              <div className="flex flex-col gap-2.5">
                {topicCards.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => { setTopic(t.name); setStep("mode"); }}
                    disabled={t.count === 0}
                    className="w-full text-left rounded-xl border bg-white px-4 py-3 hover:shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ borderColor: colors.border }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-[14px]" style={{ color: colors.foreground }}>
                        {t.name}
                      </div>
                      <span
                        className="text-[11px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap"
                        style={{
                          background: t.count > 0 ? (subjectColor(subject as any) || colors.primary) + "18" : colors.muted,
                          color: t.count > 0 ? subjectColor(subject as any) || colors.primary : colors.mutedForeground,
                        }}
                      >
                        {t.count} {t.count === 1 ? "question" : "questions"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Panel>
        )}

        {/* ---- STEP 5: MODE ---- */}
        {step === "mode" && (
          <Panel title="How do you want to build the paper?">
            <ModeCard
              icon="zap"
              title="AI Express"
              subtitle="Auto-pick questions matching your filters. Fastest."
              accent={colors.primary}
              onClick={() => { setMode("ai"); setStep("details"); }}
            />
            <div className="h-3" />
            <ModeCard
              icon="sliders"
              title="Manual"
              subtitle="Choose question type, difficulty, and count yourself."
              accent={colors.jee}
              onClick={() => { setMode("manual"); setStep("details"); }}
            />
          </Panel>
        )}

        {/* ---- STEP 6: DETAILS ---- */}
        {step === "details" && (
          <Panel title="Final details">
            {mode === "manual" && (
              <>
                <Label>Difficulty</Label>
                <Row>
                  {(["Easy", "Moderate", "Hard"] as Difficulty[]).map((d) => (
                    <Pill
                      key={d}
                      label={d}
                      active={difficulty === d}
                      activeColor={difficultyColor(d)}
                      activeBg={difficultyColor(d) + "20"}
                      onClick={() => setDifficulty(d)}
                    />
                  ))}
                </Row>

                <div className="h-5" />
                <Label>Question Type</Label>
                <div className="flex flex-wrap gap-2">
                  {QUESTION_TYPES.map((qt) => (
                    <Pill key={qt} label={qt} active={questionType === qt} onClick={() => setQuestionType(qt)} />
                  ))}
                </div>
              </>
            )}

            <div className="h-5" />
            <Label>Number of Questions: {questionCount}</Label>
            <div className="flex gap-2 flex-wrap">
              {[5, 10, 15, 20, 30, 50].map((n) => (
                <button
                  key={n}
                  onClick={() => setQuestionCount(n)}
                  className="w-[56px] py-2.5 rounded-xl border text-[15px] font-semibold"
                  style={{
                    background: questionCount === n ? colors.primary : colors.secondary,
                    borderColor: questionCount === n ? colors.primary : colors.border,
                    color: questionCount === n ? "#fff" : colors.mutedForeground,
                  }}
                >
                  {n}
                </button>
              ))}
            </div>

            <div className="h-5" />
            {/* Paper header / school logo — set right here in the flow so the
                teacher doesn't have to detour through Profile. "Continue
                without header" stores a per-paper skip flag, leaving any
                previously uploaded logo intact for next time. */}
            <Label>Paper Header / School Logo</Label>
            {profile.paperHeaderImage && !skipHeader ? (
              <div
                className="rounded-xl border overflow-hidden bg-white mb-2"
                style={{ borderColor: colors.border }}
              >
                <img
                  src={profile.paperHeaderImage}
                  alt="Header preview"
                  className="w-full block"
                  style={{ maxHeight: 120, objectFit: "contain" }}
                />
                <div
                  className="flex items-center justify-between px-3 py-2 border-t text-[12px]"
                  style={{ borderColor: colors.border, color: colors.mutedForeground }}
                >
                  <span>Stamped on top of every page.</span>
                  <label
                    className="font-semibold cursor-pointer"
                    style={{ color: colors.primary }}
                  >
                    Replace
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleHeaderPick(f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <label
                className="block cursor-pointer rounded-xl border-2 border-dashed p-5 text-center mb-2"
                style={{ borderColor: colors.border, color: colors.mutedForeground }}
              >
                <Icon name="upload" size={22} color={colors.mutedForeground} />
                <div className="text-[13px] mt-1.5 font-semibold">
                  {skipHeader ? "Header skipped \u2014 click to upload one" : "Click to upload header image"}
                </div>
                <div className="text-[11px] mt-0.5">
                  PNG or JPG · under 1 MB · landscape works best
                </div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleHeaderPick(f);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
            <button
              onClick={() => setSkipHeader((v) => !v)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[13px] font-semibold mb-1"
              style={{
                background: skipHeader ? colors.primary + "15" : colors.secondary,
                borderColor: skipHeader ? colors.primary : colors.border,
                color: skipHeader ? colors.primary : colors.mutedForeground,
              }}
            >
              <Icon
                name={skipHeader ? "check-circle" : "x-circle"}
                size={15}
                color={skipHeader ? colors.primary : colors.mutedForeground}
              />
              {skipHeader ? "Will generate without header" : "Continue without header"}
            </button>

            <div className="h-6" />
            {/* Live preview */}
            <div className="rounded-2xl p-4 border bg-white mb-5" style={{ borderColor: colors.border }}>
              <div className="text-[15px] font-semibold mb-3" style={{ color: colors.foreground }}>
                Paper Summary
              </div>
              <Summary label="Exam" value={examType || "—"} />
              <Summary label="Class" value={classLevel ? `Class ${classLevel}` : "—"} />
              <Summary label="Subject" value={subject || "—"} />
              <Summary label="Topic" value={topic || "—"} />
              <Summary label="Mode" value={mode === "ai" ? "AI Express" : "Manual"} />
              {mode === "manual" && (
                <>
                  <Summary label="Difficulty" value={difficulty} />
                  <Summary label="Type" value={questionType} />
                </>
              )}
              <Summary
                label="Header"
                value={
                  skipHeader
                    ? "None"
                    : profile.paperHeaderImage
                    ? "School logo"
                    : "None"
                }
              />
              <Summary label="Questions" value={`${Math.min(questionCount, matchingQuestions.length)} / ${matchingQuestions.length} available`} />
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating || matchingQuestions.length === 0}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-white font-bold disabled:opacity-50"
              style={{ background: colors.primary }}
            >
              {generating ? (
                <><Spinner size={18} /> Generating…</>
              ) : matchingQuestions.length === 0 ? (
                "No questions match your filters"
              ) : (
                <><Icon name="zap" size={18} color="#fff" /> Generate Paper</>
              )}
            </button>
          </Panel>
        )}
      </div>
    </div>
  );
}

// ---------- Presentational helpers ----------

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="text-[18px] font-bold" style={{ color: colors.foreground }}>{title}</div>
      {subtitle && (
        <div className="text-[12px] mb-3" style={{ color: colors.mutedForeground }}>{subtitle}</div>
      )}
      {!subtitle && <div className="h-3" />}
      {children}
    </div>
  );
}

function HScroll({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
      {children}
    </div>
  );
}

function BigCard({
  label,
  accent,
  bg,
  onClick,
  fullWidth,
}: {
  label: string;
  accent: string;
  bg?: string;
  onClick: () => void;
  fullWidth?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl border-2 bg-white p-5 hover:shadow-md transition relative overflow-hidden text-left"
      style={{
        borderColor: colors.border,
        minWidth: fullWidth ? undefined : 140,
        width: fullWidth ? "100%" : undefined,
      }}
    >
      <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: accent }} />
      <div className="font-bold text-[18px] mt-2" style={{ color: accent }}>{label}</div>
      {bg && (
        <div
          className="mt-3 inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold"
          style={{ background: bg, color: accent }}
        >
          Tap to choose
        </div>
      )}
    </button>
  );
}

function ModeCard({
  icon,
  title,
  subtitle,
  accent,
  onClick,
}: {
  icon: string;
  title: string;
  subtitle: string;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl border-2 bg-white p-5 hover:shadow-md transition text-left flex items-center gap-4"
      style={{ borderColor: colors.border }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: accent + "20" }}
      >
        <Icon name={icon} size={22} color={accent} />
      </div>
      <div className="flex-1">
        <div className="font-bold text-[16px]" style={{ color: colors.foreground }}>{title}</div>
        <div className="text-[12px] mt-0.5" style={{ color: colors.mutedForeground }}>{subtitle}</div>
      </div>
      <Icon name="chevron-right" size={20} color={colors.mutedForeground} />
    </button>
  );
}

function Crumb({
  label,
  onClick,
  color,
  bg,
}: {
  label: string;
  onClick: () => void;
  color?: string;
  bg?: string;
}) {
  const c = color || colors.primary;
  return (
    <button
      onClick={onClick}
      className="px-3 py-1 rounded-full text-[12px] font-semibold flex items-center gap-1"
      style={{ background: bg || c + "18", color: c }}
    >
      {label}
      <Icon name="x" size={11} color={c} />
    </button>
  );
}

function Pill({
  label,
  active,
  activeColor,
  activeBg,
  onClick,
}: {
  label: string;
  active: boolean;
  activeColor?: string;
  activeBg?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="px-3.5 py-2 rounded-full text-[13px] transition whitespace-nowrap"
      style={{
        background: active ? activeBg || colors.primary : colors.secondary,
        border: `${active ? 1.5 : 1}px solid ${active ? activeColor || colors.primary : colors.border}`,
        color: active ? activeColor || "#fff" : colors.mutedForeground,
        fontWeight: active ? 600 : 400,
      }}
    >
      {label}
    </button>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-2 flex-wrap">{children}</div>;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[13px] font-semibold mb-2" style={{ color: colors.foreground }}>
      {children}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
      <span className="text-[13px]" style={{ color: colors.mutedForeground }}>{label}</span>
      <span className="text-[13px] font-semibold" style={{ color: colors.foreground }}>{value}</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div
      className="rounded-2xl border-2 border-dashed p-8 text-center"
      style={{ borderColor: colors.border }}
    >
      <Icon name="inbox" size={32} color={colors.mutedForeground} />
      <div className="text-sm mt-2" style={{ color: colors.mutedForeground }}>{text}</div>
    </div>
  );
}
