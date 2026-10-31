import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, ArrowRight, Camera, ChevronRight, FilePlus, FileText, PlayCircle, Send,
  Sparkles, Trophy, Users, Wallet,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { colors } from "@/lib/colors";
import TeacherClassPanel from "@/pages/TeacherClassPanel";
import { CountUp, ScoreRing, Sparkle } from "@/components/motion";

const scoreTone = (s: number) =>
  s >= 80 ? { fg: "#16a34a", bg: "#dcfce7" } : s >= 60 ? { fg: "#d97706", bg: "#fef3c7" } : { fg: "#dc2626", bg: "#fee2e2" };

export default function TeacherHome() {
  const nav = useNavigate();
  const { profile, papers, students } = useApp();
  const [showAll, setShowAll] = useState(false);

  const hasStudents = students.length > 0;
  const avg = hasStudents ? Math.round(students.reduce((s, st) => s + st.score, 0) / students.length) : 0;
  const ranked = [...students].sort((a, b) => b.score - a.score);
  const top = ranked.slice(0, 3);
  const needHelp = [...students].sort((a, b) => a.score - b.score).filter((s) => s.score < 60).slice(0, 3);
  const recent = [...papers].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 3);
  const firstName = (profile.name || "Teacher").split(" ")[0];

  return (
    <div>
      {/* ── Compact header ── */}
      <div className="am-grad relative overflow-hidden rounded-b-[26px] px-5 pb-5 pt-12 text-white">
        <span className="am-blob-a pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full bg-white/[0.07]" />
        <span className="am-blob-b pointer-events-none absolute -bottom-10 left-10 h-28 w-28 rounded-full bg-amber-300/10" />
        <Sparkle className="absolute right-[42%] top-10 h-3 w-3 text-white/60" />
        <div className="relative flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-[12px] text-white/65">Welcome back 👋</div>
            <div className="am-shine truncate text-[22px] font-bold leading-tight">{firstName}</div>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold">
              <span className="rounded-full bg-amber-300/25 px-2.5 py-1 text-amber-100">Teacher</span>
              <span className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1"><Users size={12} /> {students.length} students</span>
              <span className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1"><FileText size={12} /> {papers.length} papers</span>
            </div>
          </div>
          <ScoreRing pct={avg} size={68}>
            <div className="text-[16px] font-extrabold leading-none">{hasStudents ? <CountUp to={avg} suffix="%" /> : "—"}</div>
            <div className="mt-0.5 text-[9px] text-white/70">class avg</div>
          </ScoreRing>
        </div>
      </div>

      <div className="px-4 pt-5">
        {/* ── Motion card: create a paper ── */}
        <button onClick={() => nav("/paper/generate")}
          className="am-grad group relative mb-5 block w-full overflow-hidden rounded-3xl p-5 text-left text-white shadow-[0_20px_40px_-20px_rgba(76,29,149,.8)]">
          <span className="am-orbit pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full border border-white/20">
            <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,.9)]" />
          </span>
          <span className="am-orbit-rev pointer-events-none absolute -right-2 top-3 h-24 w-24 rounded-full border border-dashed border-white/25">
            <span className="absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 translate-y-1/2 rounded-full bg-fuchsia-300" />
          </span>
          <span className="am-float pointer-events-none absolute right-5 top-8 rounded-lg bg-white/95 px-2 py-1 text-[11px] font-bold text-violet-700 shadow">30 Qs</span>
          <span className="am-float pointer-events-none absolute right-20 top-16 rounded-lg bg-white/95 px-2 py-1 text-[11px] font-bold text-emerald-600 shadow" style={{ animationDelay: "1s" }}>✓ PDF</span>
          <span className="am-float pointer-events-none absolute right-8 top-[88px] rounded-lg bg-white/95 px-2 py-1 text-[11px] font-bold text-amber-600 shadow" style={{ animationDelay: "1.8s" }}>Answer key</span>

          <div className="relative max-w-[62%]">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-violet-200">
              <Sparkles size={12} /> Paper maker
            </div>
            <div className="mt-1.5 text-[20px] font-extrabold leading-tight">Create a paper in a minute</div>
            <div className="mt-1 text-[12px] leading-snug text-violet-100/85">Pick exam, class & topics. Review, swap questions, download PDF.</div>
          </div>
          <span className="relative mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-bold text-violet-800">
            <span className="am-ripple" />
            Generate paper <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
          </span>
        </button>

        {/* ── Quick tiles ── */}
        <div className="mb-6 grid grid-cols-4 gap-2.5">
          {[
            { label: "New Paper", icon: FilePlus, color: "#6d28d9", bg: "#f3efff", to: "/paper/generate" },
            { label: "Quiz", icon: PlayCircle, color: "#2563eb", bg: "#eef4ff", to: "/paper/generate?mode=quiz" },
            { label: "Snap Paper", icon: Camera, color: "#d97706", bg: "#fff6e8", to: "/paper/capture" },
            { label: "Assign", icon: Send, color: "#16a34a", bg: "#ecfbf1", to: "/papers" },
          ].map((t) => (
            <button key={t.label} onClick={() => nav(t.to)} className="am-tile flex flex-col items-center gap-1.5 rounded-2xl border bg-white py-3"
              style={{ borderColor: colors.border }}>
              <span className="am-tile-icon flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: t.bg }}>
                <t.icon size={19} color={t.color} />
              </span>
              <span className="text-[11px] font-semibold" style={{ color: colors.foreground }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Classes (join codes, requests, assignments) */}
      <TeacherClassPanel />

      <div className="px-4 pt-5">
        {/* ── Recent papers (timeline) ── */}
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[17px] font-bold" style={{ color: colors.foreground }}>Recent Papers</div>
          {papers.length > 0 && (
            <button onClick={() => nav("/papers")} className="text-[12px] font-semibold" style={{ color: colors.primary }}>
              See all ({papers.length})
            </button>
          )}
        </div>
        <div className="mb-6">
          {recent.length === 0 ? (
            <button onClick={() => nav("/paper/generate")}
              className="flex w-full items-center gap-3 rounded-2xl border border-dashed p-4 text-left" style={{ borderColor: "#ddd6fe" }}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: colors.secondary }}>
                <FilePlus size={18} color={colors.primary} className="am-bell" />
              </span>
              <span>
                <span className="block text-[13px] font-semibold" style={{ color: colors.foreground }}>No papers yet</span>
                <span className="block text-[11px]" style={{ color: colors.mutedForeground }}>Create your first paper — it takes a minute.</span>
              </span>
            </button>
          ) : (
            <div className="relative pl-5">
              <span className="absolute bottom-3 left-[7px] top-3 w-[2px] rounded-full" style={{ background: "#ede9fe" }} />
              {recent.map((p, i) => (
                <button key={p.id} onClick={() => nav(`/paper/${p.id}`)}
                  className="relative mb-2.5 flex w-full items-center gap-3 rounded-2xl border bg-white p-3 text-left last:mb-0"
                  style={{ borderColor: colors.border }}>
                  <span className="absolute -left-[18px] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-white"
                    style={{ background: i === 0 ? colors.primary : "#c4b5fd", boxShadow: "0 0 0 2px #ede9fe" }} />
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: "#ede9fe" }}>
                    <FileText size={16} color="#6d28d9" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold" style={{ color: colors.foreground }}>{p.title}</span>
                    <span className="block truncate text-[11px]" style={{ color: colors.mutedForeground }}>
                      {p.questions.length} questions · {p.difficulty} · {new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  </span>
                  <ChevronRight size={16} color={colors.mutedForeground} />
                </button>
              ))}
            </div>
          )}
        </div>

        {hasStudents ? (
          <>
            {/* ── Top performers ── */}
            <div className="mb-3 flex items-center gap-2 text-[17px] font-bold" style={{ color: colors.foreground }}>
              <Trophy size={16} color="#f59e0b" /> Top Performers
            </div>
            <div className="mb-6 rounded-2xl border bg-white p-3" style={{ borderColor: colors.border }}>
              {top.map((st, i) => {
                const tone = scoreTone(st.score);
                return (
                  <div key={st.id} className="flex items-center gap-3 py-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold"
                      style={{ background: ["#fef3c7", "#f1f5f9", "#ffedd5"][i], color: ["#b45309", "#475569", "#c2410c"][i] }}>
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between text-[13px]">
                        <span className="truncate font-semibold" style={{ color: colors.foreground }}>{st.name}</span>
                        <span className="font-bold" style={{ color: tone.fg }}>{st.score}%</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full" style={{ background: colors.muted }}>
                        <div className="h-full rounded-full transition-[width] duration-1000" style={{ width: `${st.score}%`, background: colors.primaryGradient }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Need attention ── */}
            {needHelp.length > 0 && (
              <div className="mb-6 rounded-2xl border p-3.5" style={{ background: "#fff5f5", borderColor: "#fecaca" }}>
                <div className="mb-2 flex items-center gap-1.5 text-[13px] font-bold" style={{ color: "#991b1b" }}>
                  <AlertTriangle size={14} /> Need attention
                </div>
                {needHelp.map((st) => (
                  <div key={st.id} className="flex items-center gap-3 py-1.5">
                    <span className="am-live h-2 w-2 shrink-0 rounded-full bg-red-500" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold" style={{ color: "#7f1d1d" }}>{st.name}</div>
                      <div className="truncate text-[11px]" style={{ color: "#b91c1c" }}>Weak in {st.weakSubject} · {st.avgAccuracy}% accuracy</div>
                    </div>
                    <button onClick={() => nav("/paper/generate")} className="rounded-lg px-3 py-1.5 text-[11px] font-bold text-white" style={{ background: "#ef4444" }}>
                      Assign
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* ── All students (collapsible) ── */}
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[17px] font-bold" style={{ color: colors.foreground }}>All Students</div>
              {ranked.length > 4 && (
                <button onClick={() => setShowAll((v) => !v)} className="text-[12px] font-semibold" style={{ color: colors.primary }}>
                  {showAll ? "Show less" : `See all (${ranked.length})`}
                </button>
              )}
            </div>
            <div className="mb-6 overflow-hidden rounded-2xl border bg-white" style={{ borderColor: colors.border }}>
              {(showAll ? ranked : ranked.slice(0, 4)).map((st, idx, arr) => {
                const tone = scoreTone(st.score);
                return (
                  <div key={st.id} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: idx < arr.length - 1 ? `1px solid ${colors.border}` : "none" }}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white" style={{ background: colors.primaryGradient }}>
                      {st.name.charAt(0)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold" style={{ color: colors.foreground }}>{st.name}</div>
                      <div className="truncate text-[11px]" style={{ color: colors.mutedForeground }}>{st.totalQuizzes} quizzes · {st.lastActive}</div>
                    </div>
                    <span className="rounded-lg px-2 py-1 text-[12px] font-bold" style={{ background: tone.bg, color: tone.fg }}>{st.score}%</span>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-dashed p-4" style={{ borderColor: "#ddd6fe" }}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: colors.secondary }}>
              <Users size={18} color={colors.primary} className="am-bell" />
            </span>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold" style={{ color: colors.foreground }}>No student activity yet</div>
              <div className="text-[11px]" style={{ color: colors.mutedForeground }}>
                Share your class code. Top performers and students who need help will show here.
              </div>
            </div>
          </div>
        )}

        {/* ── Earnings (compact) ── */}
        <button onClick={() => nav("/referral")}
          className="mb-4 flex w-full items-center gap-3 rounded-2xl border p-3 text-left" style={{ background: colors.secondary, borderColor: "#ddd6fe" }}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: colors.primaryGradient }}>
            <Wallet size={18} color="#fbbf24" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-bold" style={{ color: "#2e1065" }}>Referral & Earnings</span>
            <span className="block text-[12px]" style={{ color: "#5b21b6" }}>Earn 10% on every plan your referrals buy</span>
          </span>
          <ChevronRight size={18} color="#2e1065" />
        </button>
      </div>
    </div>
  );
}
