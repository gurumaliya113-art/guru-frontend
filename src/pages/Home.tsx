import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon, ProgressBar } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";
import { colors } from "@/lib/colors";
import type { Assignment } from "@/lib/types";
import TeacherClassPanel from "@/pages/TeacherClassPanel";
import StudentHome from "@/pages/StudentHome";
import { Sparkle } from "@/components/motion";

export default function Home() {
  const { profile, attempts, papers, students, questions, myMemberships } = useApp();
  if (profile.role === "teacher") return <TeacherHome />;
  return <StudentHome />;

  function TeacherHome() {
    const nav = useNavigate();
    const hasStudents = students.length > 0;
    const avgClassScore = hasStudents
      ? Math.round(students.reduce((s, st) => s + st.score, 0) / students.length)
      : null;
    const topStudents = [...students].sort((a, b) => b.score - a.score).slice(0, 3);
    const needHelp = [...students].sort((a, b) => a.score - b.score).slice(0, 2);

    return (
      <div>
        <div className="am-grad relative overflow-hidden px-5 pt-16 pb-7 text-white rounded-b-[28px]">
          <div className="am-blob-a absolute -top-14 -right-10 w-52 h-52 rounded-full" style={{ background: "rgba(251,191,36,0.08)" }} />
          <div className="am-blob-b absolute -bottom-8 left-8 w-32 h-32 rounded-full" style={{ background: "rgba(240,171,252,0.10)" }} />
          <Sparkle className="absolute right-[38%] top-12 h-3 w-3 text-white/60" />
          <Sparkle className="absolute right-6 bottom-24 h-3.5 w-3.5 text-amber-200/80" delay={1.6} />
          <div className="flex items-start justify-between mb-5 relative">
            <div>
              <div className="text-[13px]" style={{ color: "rgba(255,255,255,0.65)" }}>Welcome back</div>
              <div className="am-shine text-2xl font-bold tracking-tight">{profile.name}</div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
              style={{ background: "rgba(251,191,36,0.15)", borderColor: "rgba(251,191,36,0.3)" }}>
              <Icon name="users" size={12} color="#fbbf24" />
              <span className="text-xs font-bold" style={{ color: "#fbbf24" }}>Teacher</span>
            </div>
          </div>
          <div className="flex items-center rounded-2xl py-3.5 px-4 relative" style={{ background: "rgba(255,255,255,0.1)" }}>
            {[
              { icon: "users", val: students.length, label: "students" },
              { icon: "bar-chart-2", val: hasStudents ? `${avgClassScore}%` : "—", label: "class avg" },
              { icon: "file-text", val: papers.length, label: "papers" },
            ].map((s, i, arr) => (
              <div key={s.label} className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-0.5">
                  <Icon name={s.icon} size={14} color="rgba(255,255,255,0.5)" />
                  <div className="text-lg font-bold">{s.val}</div>
                  <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>{s.label}</div>
                </div>
                {i < arr.length - 1 && <div className="w-px h-8 ml-auto" style={{ background: "rgba(255,255,255,0.12)" }} />}
              </div>
            ))}
          </div>
        </div>

        <TeacherClassPanel />

        <div className="px-4 pt-5">
          {/* Teacher action row — three primary CTAs:
              1. Generate Paper  → /paper/generate (AI-generated practice paper)
              2. Create Quiz     → /paper/generate?mode=quiz (same flow, saves
                                   as a quiz so it surfaces in students' Quiz
                                   tab once assigned to a class)
              3. Assign to Class → /papers (pick from paper bank, push to a class) */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            <button
              onClick={() => nav("/paper/generate")}
              className="flex flex-col items-center justify-center gap-1 py-3 rounded-2xl text-white font-bold shadow-md"
              style={{ background: "#d97706" }}
            >
              <Icon name="file-plus" size={20} color="#fff" />
              <span className="text-[12px]">Generate Paper</span>
            </button>
            <button
              onClick={() => nav("/paper/generate?mode=quiz")}
              className="flex flex-col items-center justify-center gap-1 py-3 rounded-2xl text-white font-bold shadow-md"
              style={{ background: colors.primaryGradient }}
            >
              <Icon name="play-circle" size={20} color="#fff" />
              <span className="text-[12px]">Create Quiz</span>
            </button>
            <button
              onClick={() => nav("/papers")}
              className="flex flex-col items-center justify-center gap-1 py-3 rounded-2xl border bg-white font-semibold text-[12px]"
              style={{ borderColor: colors.border, color: colors.foreground }}
            >
              <Icon name="send" size={20} color="#d97706" />
              <span>Assign</span>
            </button>
          </div>

          {/* ---------- Referral & Earnings (Referral program) ---------- */}
          <button
            onClick={() => nav("/referral")}
            className="w-full text-left rounded-2xl p-4 mb-6 border shadow-sm active:opacity-90"
            style={{ background: "linear-gradient(135deg,#2e1065,#4c1d95)", borderColor: "rgba(251,191,36,0.3)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(251,191,36,0.15)" }}>
                <Icon name="award" size={22} color="#fbbf24" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-bold" style={{ color: "#fbbf24" }}>Referral &amp; Earnings</div>
                <div className="text-[12px]" style={{ color: "rgba(255,255,255,0.65)" }}>
                  Earn 10% commission on every paid plan your referrals purchase.
                </div>
              </div>
              <Icon name="chevron-right" size={18} color="#fbbf24" />
            </div>
          </button>

          {hasStudents ? (
            <>
              <div className="flex justify-between items-center mb-3">
                <div className="text-[17px] font-bold" style={{ color: colors.foreground }}>Top Performers</div>
                <Icon name="award" size={16} color="#f59e0b" />
              </div>
              <div className="rounded-2xl border mb-6 bg-white shadow-sm overflow-hidden" style={{ borderColor: colors.border }}>
                {topStudents.map((st, idx) => (
                  <div key={st.id} className="flex items-center px-4 py-3.5 gap-3" style={{ borderBottom: idx < topStudents.length - 1 ? `1px solid ${colors.border}` : "none" }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[13px]"
                      style={{ background: idx === 0 ? "#fef3c7" : idx === 1 ? "#f1f5f9" : "#fef3c7", color: idx === 0 ? "#d97706" : idx === 1 ? "#475569" : "#92400e" }}>
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold" style={{ color: colors.foreground }}>{st.name}</div>
                      <div className="text-[11px]" style={{ color: colors.mutedForeground }}>{st.totalQuizzes} quizzes • {st.lastActive}</div>
                    </div>
                    <div className="px-2.5 py-1 rounded-lg font-bold text-[13px]"
                      style={{ background: st.score >= 85 ? "#dcfce7" : st.score >= 70 ? "#fef3c7" : "#fee2e2", color: st.score >= 85 ? "#16a34a" : st.score >= 70 ? "#d97706" : "#dc2626" }}>
                      {st.score}%
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center mb-3">
                <div className="text-[17px] font-bold" style={{ color: colors.foreground }}>Need Attention</div>
                <Icon name="alert-triangle" size={16} color="#ef4444" />
              </div>
              <div className="rounded-2xl border mb-6 overflow-hidden" style={{ background: "#fff5f5", borderColor: "#fecaca" }}>
                {needHelp.map((st, idx) => (
                  <div key={st.id} className="flex items-center px-4 py-3.5 gap-3" style={{ borderBottom: idx < needHelp.length - 1 ? "1px solid #fecaca" : "none" }}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ef4444" }} />
                    <div className="flex-1">
                      <div className="text-sm font-semibold" style={{ color: "#7f1d1d" }}>{st.name}</div>
                      <div className="text-xs" style={{ color: "#b91c1c" }}>Weak in {st.weakSubject} • {st.avgAccuracy}% accuracy</div>
                    </div>
                    <button onClick={() => nav("/paper/generate")} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: "#ef4444" }}>
                      Assign
                    </button>
                  </div>
                ))}
              </div>

              <div className="text-[17px] font-bold mb-3" style={{ color: colors.foreground }}>All Students</div>
              <div className="rounded-2xl border mb-6 bg-white shadow-sm overflow-hidden" style={{ borderColor: colors.border }}>
                {[...students].sort((a, b) => b.score - a.score).map((st, idx, arr) => (
                  <div key={st.id} className="flex items-center px-4 py-3.5 gap-3" style={{ borderBottom: idx < arr.length - 1 ? `1px solid ${colors.border}` : "none" }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold" style={{ background: colors.muted, color: colors.mutedForeground }}>
                      {st.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold" style={{ color: colors.foreground }}>{st.name}</div>
                      <div className="text-[11px]" style={{ color: colors.mutedForeground }}>{st.totalQuizzes} quizzes • {st.lastActive}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold" style={{ color: st.score >= 80 ? "#16a34a" : st.score >= 60 ? "#d97706" : "#ef4444" }}>{st.score}%</div>
                      <div className="text-[11px]" style={{ color: colors.mutedForeground }}>{st.weakSubject}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-2xl p-6 border mb-6 bg-white shadow-sm text-center" style={{ borderColor: colors.border }}>
              <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ background: colors.muted }}>
                <Icon name="users" size={22} color={colors.mutedForeground} />
              </div>
              <div className="text-[15px] font-semibold mb-1" style={{ color: colors.foreground }}>
                No student activity yet
              </div>
              <div className="text-[13px] leading-relaxed" style={{ color: colors.mutedForeground }}>
                Share your class join code with students. Class performance, top
                performers and at-risk learners will appear here once students
                start attempting tests.
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}
