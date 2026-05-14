import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon, Spinner } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { filterQuestions, TOPICS_BY_SUBJECT } from "@/data/questions";
import { colors, difficultyColor, examColor, examLight } from "@/lib/colors";
import type { Difficulty, ExamType, Subject } from "@/lib/types";

type QuestionType = "MCQ" | "Assertion-Reason" | "Case-Based";

export default function PaperGenerate() {
  const nav = useNavigate();
  const { addPaper, questions: pool } = useApp();

  const [examType, setExamType] = useState<ExamType>("NEET");
  const [subject, setSubject] = useState<Subject>("Biology");
  const [topic, setTopic] = useState("All");
  const [difficulty, setDifficulty] = useState<Difficulty>("Moderate");
  const [questionType, setQuestionType] = useState<QuestionType>("MCQ");
  const [questionCount, setQuestionCount] = useState(15);
  const [generating, setGenerating] = useState(false);

  const subjects: Subject[] =
    examType === "NEET"
      ? ["Biology", "Physics", "Chemistry"]
      : examType === "JEE"
        ? ["Physics", "Chemistry", "Mathematics"]
        : ["Physics", "Chemistry", "Biology", "Mathematics"];
  const topics = ["All", ...(TOPICS_BY_SUBJECT[subject] || [])];

  const handleGenerate = async () => {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 1200));
    const questions = filterQuestions(pool, subject, topic, difficulty, examType, questionCount);
    const paper = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
      title: `${examType} ${subject} — ${topic === "All" ? "Mixed Topics" : topic}`,
      examType,
      subject,
      topic,
      difficulty,
      questions,
      createdAt: new Date().toISOString(),
    };
    await addPaper(paper);
    setGenerating(false);
    nav(`/paper/${paper.id}`, { replace: true });
  };

  const Pill = ({
    label, active, activeColor, activeBg, onClick,
  }: { label: string; active: boolean; activeColor?: string; activeBg?: string; onClick: () => void }) => (
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

  return (
    <div className="min-h-full max-w-[640px] mx-auto">
      <div className="flex items-center justify-between px-4 pt-12 pb-3 border-b bg-white sticky top-0 z-10" style={{ borderColor: colors.border }}>
        <button onClick={() => nav(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: colors.secondary }}>
          <Icon name="arrow-left" size={18} color={colors.foreground} />
        </button>
        <div className="text-[17px] font-bold" style={{ color: colors.foreground }}>Generate Paper</div>
        <div className="w-9" />
      </div>

      <div className="px-4 pt-5 pb-8">
        <div className="rounded-2xl p-4 mb-6 flex items-center gap-3 text-white" style={{ background: colors.primary }}>
          <Icon name="cpu" size={24} color="#fff" />
          <div className="flex-1">
            <div className="text-[15px] font-bold mb-0.5">AI Paper Generator</div>
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.75)" }}>Auto-generates questions in NEET/JEE pattern</div>
          </div>
        </div>

        <Section title="Exam Type">
          <Row>
            {(["NEET", "JEE", "BOARD"] as ExamType[]).map((e) => (
              <Pill
                key={e}
                label={e}
                active={examType === e}
                activeColor={examColor(e)}
                activeBg={examLight(e)}
                onClick={() => {
                  setExamType(e);
                  setSubject(e === "NEET" ? "Biology" : "Physics");
                  setTopic("All");
                }}
              />
            ))}
          </Row>
        </Section>

        <Section title="Subject">
          <Row>
            {subjects.map((s) => (
              <Pill key={s} label={s} active={subject === s} onClick={() => { setSubject(s); setTopic("All"); }} />
            ))}
          </Row>
        </Section>

        <Section title="Topic">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {topics.map((t) => (
              <Pill key={t} label={t} active={topic === t} onClick={() => setTopic(t)} />
            ))}
          </div>
        </Section>

        <Section title="Difficulty">
          <Row>
            {(["Easy", "Moderate", "Hard"] as Difficulty[]).map((d) => (
              <Pill key={d} label={d} active={difficulty === d} activeColor={difficultyColor(d)} activeBg={difficultyColor(d) + "20"} onClick={() => setDifficulty(d)} />
            ))}
          </Row>
        </Section>

        <Section title="Question Type">
          <div className="flex flex-wrap gap-2">
            {(["MCQ", "Assertion-Reason", "Case-Based"] as QuestionType[]).map((qt) => (
              <Pill key={qt} label={qt} active={questionType === qt} onClick={() => setQuestionType(qt)} />
            ))}
          </div>
        </Section>

        <Section title={`Number of Questions: ${questionCount}`}>
          <div className="flex gap-2">
            {[5, 10, 15, 20, 30].map((n) => (
              <button
                key={n}
                onClick={() => setQuestionCount(n)}
                className="w-[52px] py-2.5 rounded-xl border text-[15px] font-semibold"
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
        </Section>

        <div className="rounded-2xl p-4 border bg-white mb-5" style={{ borderColor: colors.border }}>
          <div className="text-[15px] font-semibold mb-3" style={{ color: colors.foreground }}>Paper Summary</div>
          {[
            { label: "Exam", value: examType },
            { label: "Subject", value: subject },
            { label: "Topic", value: topic },
            { label: "Difficulty", value: difficulty },
            { label: "Type", value: questionType },
            { label: "Questions", value: String(questionCount) },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-1.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
              <span className="text-[13px]" style={{ color: colors.mutedForeground }}>{label}</span>
              <span className="text-[13px] font-semibold" style={{ color: colors.foreground }}>{value}</span>
            </div>
          ))}
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-white font-bold disabled:opacity-85"
          style={{ background: colors.primary }}
        >
          {generating ? <><Spinner size={18} /> Generating…</> : <><Icon name="zap" size={18} color="#fff" /> Generate Paper</>}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="text-[15px] font-semibold mb-2.5" style={{ color: colors.foreground }}>{title}</div>
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-2 flex-wrap">{children}</div>;
}
