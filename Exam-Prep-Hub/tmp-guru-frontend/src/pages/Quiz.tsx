import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Icon, QuizCard } from "@/components/ui";
import { colors } from "@/lib/colors";
import type { ExamType, Subject } from "@/lib/types";

const EXAM_TYPES: ExamType[] = ["NEET", "JEE", "BITS", "BOARD"];
const SUBJECTS: Subject[] = ["Physics", "Chemistry", "Biology", "Mathematics"];

interface QuizDef {
  id: string;
  title: string;
  subject: Subject;
  topic: string;
  questionsCount: number;
  timeLimit: number;
  difficulty: "Easy" | "Moderate" | "Hard";
  examType: ExamType[];
  tag?: string;
  tagColor?: string;
  tagBg?: string;
}

const QUIZ_LIST: QuizDef[] = [
  { id: "daily", title: "Daily Practice Quiz", subject: "Physics", topic: "All", questionsCount: 10, timeLimit: 12, difficulty: "Moderate", examType: ["NEET", "JEE"], tag: "HOT", tagColor: "#dc2626", tagBg: "#fee2e2" },
  { id: "electrostatics", title: "Electrostatics & Capacitors", subject: "Physics", topic: "Electrostatics", questionsCount: 10, timeLimit: 15, difficulty: "Moderate", examType: ["NEET", "JEE"] },
  { id: "organicChem", title: "Organic Chemistry Reactions", subject: "Chemistry", topic: "Organic Chemistry", questionsCount: 8, timeLimit: 12, difficulty: "Hard", examType: ["NEET", "JEE"], tag: "PYQ", tagColor: "#7c3aed", tagBg: "#ede9fe" },
  { id: "cellBiology", title: "Cell Biology & Organelles", subject: "Biology", topic: "Cell Biology", questionsCount: 10, timeLimit: 10, difficulty: "Easy", examType: ["NEET"], tag: "NEET", tagColor: "#16a34a", tagBg: "#dcfce7" },
  { id: "genetics", title: "Genetics & Heredity", subject: "Biology", topic: "Genetics", questionsCount: 12, timeLimit: 15, difficulty: "Moderate", examType: ["NEET"] },
  { id: "calculus", title: "Differential Calculus", subject: "Mathematics", topic: "Calculus", questionsCount: 10, timeLimit: 20, difficulty: "Hard", examType: ["JEE"], tag: "JEE", tagColor: "#ea580c", tagBg: "#ffedd5" },
  { id: "thermodynamics", title: "Thermodynamics", subject: "Physics", topic: "Thermodynamics", questionsCount: 10, timeLimit: 15, difficulty: "Moderate", examType: ["NEET", "JEE"] },
  { id: "chemKinetics", title: "Chemical Kinetics & Equilibrium", subject: "Chemistry", topic: "Chemical Kinetics", questionsCount: 10, timeLimit: 14, difficulty: "Hard", examType: ["JEE"], tag: "PYQ", tagColor: "#7c3aed", tagBg: "#ede9fe" },
  { id: "humanPhysio", title: "Human Physiology", subject: "Biology", topic: "Human Physiology", questionsCount: 15, timeLimit: 18, difficulty: "Moderate", examType: ["NEET"], tag: "NEET", tagColor: "#16a34a", tagBg: "#dcfce7" },
];

export default function Quiz() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const initialSubject = (params.get("subject") as Subject) || "All";
  const [selectedExam, setSelectedExam] = useState<ExamType | "All">("All");
  const [selectedSubject, setSelectedSubject] = useState<Subject | "All">(initialSubject);

  const filtered = QUIZ_LIST.filter((q) => {
    const examMatch = selectedExam === "All" || q.examType.includes(selectedExam);
    const subjectMatch = selectedSubject === "All" || q.subject === selectedSubject;
    return examMatch && subjectMatch;
  });

  const chip = (active: boolean, accentBg = colors.primary) => ({
    background: active ? accentBg : colors.card,
    borderColor: active ? accentBg : colors.border,
    color: active ? "#fff" : colors.mutedForeground,
  });

  return (
    <div className="px-4 pt-12 pb-5">
      <div className="text-[26px] font-bold mb-1" style={{ color: colors.foreground }}>Quiz Mode</div>
      <div className="text-sm mb-4" style={{ color: colors.mutedForeground }}>Practice with timed tests</div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-1">
        {(["All", ...EXAM_TYPES] as const).map((ex) => {
          const active = selectedExam === ex;
          return (
            <button
              key={ex}
              onClick={() => setSelectedExam(ex as ExamType | "All")}
              className="px-3.5 py-1.5 rounded-full text-[13px] font-medium border whitespace-nowrap"
              style={chip(active)}
            >
              {ex}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
        {(["All", ...SUBJECTS] as const).map((sub) => {
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

      <div className="text-xs mb-3 mt-1" style={{ color: colors.mutedForeground }}>
        {filtered.length} quizzes
      </div>

      {filtered.map((quiz) => (
        <QuizCard
          key={quiz.id}
          title={quiz.title}
          subject={quiz.subject}
          questionsCount={quiz.questionsCount}
          timeLimit={quiz.timeLimit}
          difficulty={quiz.difficulty}
          tag={quiz.tag}
          tagColor={quiz.tagColor}
          tagBg={quiz.tagBg}
          onClick={() => {
            const sp = new URLSearchParams({
              title: quiz.title,
              subject: quiz.subject,
              topic: quiz.topic,
              difficulty: quiz.difficulty,
              examType: quiz.examType[0],
              timeLimit: String(quiz.timeLimit),
              questionsCount: String(quiz.questionsCount),
            });
            nav(`/quiz/${quiz.id}?${sp.toString()}`);
          }}
        />
      ))}

      {filtered.length === 0 && (
        <div className="flex flex-col items-center py-16 gap-3" style={{ color: colors.mutedForeground }}>
          <Icon name="inbox" size={40} color={colors.mutedForeground} />
          <span className="text-[15px]">No quizzes match your filters</span>
        </div>
      )}
    </div>
  );
}
