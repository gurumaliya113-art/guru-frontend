import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import type { ExamType, Role } from "@/lib/types";

type Step = "role" | "details";

export default function Onboarding() {
  const { completeOnboarding } = useApp();
  const nav = useNavigate();
  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [exam, setExam] = useState<ExamType>("NEET");

  const examColor = (e: ExamType) =>
    e === "NEET" ? "#4ade80" : e === "JEE" ? "#fb923c" : "#a78bfa";

  const handleFinish = async () => {
    if (!name.trim() || !role) return;
    await completeOnboarding(name.trim(), role, exam);
    nav("/", { replace: true });
  };

  return (
    <div
      className="min-h-full px-6 py-12 text-white relative overflow-hidden"
      style={{ background: "linear-gradient(135deg,#1e3a8a 0%,#2563eb 50%,#3b82f6 100%)" }}
    >
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
      <div className="absolute bottom-24 -left-16 w-48 h-48 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }} />

      <div className="relative z-10 max-w-md mx-auto">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-[72px] h-[72px] rounded-2xl mx-auto mb-3.5 flex items-center justify-center border"
            style={{ background: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.2)" }}>
            <Icon name="book-open" size={32} color="#fff" />
          </div>
          <div className="text-[28px] font-bold tracking-tight">SmartPrep</div>
          <div className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Master NEET & JEE with AI</div>
        </div>

        {step === "role" ? (
          <div className="mb-8">
            <div className="text-[26px] font-bold mb-1.5 tracking-tight">Who are you?</div>
            <div className="text-sm mb-7" style={{ color: "rgba(255,255,255,0.55)" }}>
              We'll personalise your experience
            </div>

            <button
              onClick={() => { setRole("student"); setStep("details"); }}
              className="w-full text-left mb-3.5 rounded-2xl border overflow-hidden p-5 transition active:scale-[0.97]"
              style={{
                borderColor: "rgba(255,255,255,0.18)",
                background: "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.08))",
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(34,197,94,0.25)" }}>
                  <Icon name="user" size={28} color="#4ade80" />
                </div>
                <div className="flex-1">
                  <div className="text-lg font-bold">Student</div>
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                    Practice quizzes, generate papers, track your weak areas
                  </div>
                </div>
                <Icon name="arrow-right" size={20} color="rgba(255,255,255,0.6)" />
              </div>
            </button>

            <button
              onClick={() => { setRole("teacher"); setStep("details"); }}
              className="w-full text-left rounded-2xl border overflow-hidden p-5 transition active:scale-[0.97]"
              style={{
                borderColor: "rgba(255,255,255,0.18)",
                background: "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.08))",
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(251,191,36,0.25)" }}>
                  <Icon name="users" size={28} color="#fbbf24" />
                </div>
                <div className="flex-1">
                  <div className="text-lg font-bold">Teacher</div>
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                    Create tests, assign to students, track class performance
                  </div>
                </div>
                <Icon name="arrow-right" size={20} color="rgba(255,255,255,0.6)" />
              </div>
            </button>
          </div>
        ) : (
          <div className="mb-8">
            <button onClick={() => setStep("role")} className="flex items-center gap-1.5 mb-4 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
              <Icon name="arrow-left" size={16} color="rgba(255,255,255,0.7)" /> Change role
            </button>

            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-5"
              style={{ background: role === "student" ? "rgba(34,197,94,0.2)" : "rgba(251,191,36,0.2)" }}
            >
              <Icon name={role === "student" ? "user" : "users"} size={14} color={role === "student" ? "#4ade80" : "#fbbf24"} />
              <span className="text-xs font-semibold" style={{ color: role === "student" ? "#4ade80" : "#fbbf24" }}>
                {role === "student" ? "Student" : "Teacher"}
              </span>
            </div>

            <div className="text-[26px] font-bold mb-1.5 tracking-tight">
              {role === "teacher" ? "Set up your classroom" : "Let's get started"}
            </div>
            <div className="text-sm mb-7" style={{ color: "rgba(255,255,255,0.55)" }}>
              {role === "teacher" ? "Enter your name to continue" : "Enter your name and target exam"}
            </div>

            <div className="flex items-center rounded-2xl border px-4 mb-5 h-14"
              style={{ background: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.2)" }}>
              <Icon name="user" size={18} color="rgba(255,255,255,0.5)" />
              <input
                autoFocus
                placeholder={role === "teacher" ? "Your name (e.g. Mr. Sharma)" : "Your name"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFinish()}
                className="ml-2.5 flex-1 bg-transparent outline-none text-white placeholder:text-white/40"
              />
            </div>

            {role === "student" && (
              <div className="mb-7">
                <div className="text-[11px] uppercase tracking-wider mb-2.5 font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>
                  Target Exam
                </div>
                <div className="flex gap-2.5">
                  {(["NEET", "JEE", "BOARD"] as ExamType[]).map((e) => {
                    const active = exam === e;
                    const ec = examColor(e);
                    return (
                      <button
                        key={e}
                        onClick={() => setExam(e)}
                        className="flex-1 py-3.5 rounded-2xl text-sm font-bold"
                        style={{
                          background: active ? ec + "30" : "rgba(255,255,255,0.08)",
                          border: `${active ? 2 : 1}px solid ${active ? ec : "rgba(255,255,255,0.15)"}`,
                          color: active ? ec : "rgba(255,255,255,0.55)",
                        }}
                      >
                        {e}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              onClick={handleFinish}
              disabled={!name.trim()}
              className="w-full rounded-2xl overflow-hidden transition active:scale-[0.97] disabled:opacity-40"
              style={{ background: "linear-gradient(to right, #ffffff, #e0e7ff)" }}
            >
              <div className="flex items-center justify-center gap-2.5 py-4 text-base font-bold" style={{ color: "#1e3a8a" }}>
                {role === "teacher" ? "Enter Dashboard" : "Start Preparing"}
                <Icon name="arrow-right" size={18} color="#1e3a8a" />
              </div>
            </button>
          </div>
        )}

        <div className="flex justify-center gap-5 flex-wrap">
          {[
            { icon: "cpu", label: "AI Paper Generator" },
            { icon: "target", label: "Smart Analytics" },
            { icon: "book-open", label: "10,000+ PYQs" },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
              <Icon name={icon} size={16} color="rgba(255,255,255,0.5)" />
              {label}
            </div>
          ))}
        </div>

        <button
          onClick={() => nav("/admin/login")}
          className="mt-5 flex items-center justify-center gap-2 text-[11px]"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          <Icon name="shield" size={12} color="rgba(255,255,255,0.45)" />
          Admin Login
        </button>
      </div>
    </div>
  );
}
