import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, Atom, Award, Bell, BookOpen, Brain, ChevronRight, Droplet, Feather, FileText,
  Flame, Library, Percent, QrCode, Sparkles, Star, Target, Trophy,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";
import { colors } from "@/lib/colors";
import { scopeQuestionsForClass } from "@/lib/scope";
import type { Assignment } from "@/lib/types";
import { CountUp, ScoreRing, Sparkle } from "@/components/motion";

const SUBJECT_STYLE: Record<string, { color: string; icon: any }> = {
  Physics: { color: "#3b82f6", icon: Atom },
  Chemistry: { color: "#8b5cf6", icon: Droplet },
  Biology: { color: "#22c55e", icon: Feather },
  Mathematics: { color: "#f59e0b", icon: Percent },
};
const subjectStyle = (s: string) => SUBJECT_STYLE[s] || { color: colors.primary, icon: BookOpen };

const timeAgo = (iso?: string) => {
  if (!iso) return "";
  const m = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (m < 60) return `${Math.max(1, m)}m ago`;
  if (m < 60 * 24) return `${Math.round(m / 60)}h ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

export default function StudentHome() {
  const nav = useNavigate();
  const { profile, attempts, questions, myMemberships } = useApp();

  const hasClass = myMemberships.some((m) => m.status === "approved" || m.status === "pending");
  const showJoinClassCta = !profile.skipClassJoin && !hasClass;

  // Assigned papers from the student's classes (empty for students without a class).
  const [feed, setFeed] = useState<Assignment[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [showAllFeed, setShowAllFeed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    api.getAssignmentsForMe()
      .then((r) => {
        if (cancelled) return;
        const sorted = [...(r.assignments || [])].sort((a, b) =>
          (b.assignedAt ? Date.parse(b.assignedAt) : 0) - (a.assignedAt ? Date.parse(a.assignedAt) : 0));
        setFeed(sorted);
      })
      .catch((e) => { console.warn("[Home] failed to load assignments feed:", e); if (!cancelled) setFeed([]); })
      .finally(() => { if (!cancelled) setFeedLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const avgScore = attempts.length > 0
    ? Math.round(attempts.reduce((s, a) => s + (a.score / a.totalQuestions) * 100, 0) / attempts.length)
    : 0;

  // Subjects that actually exist for this student's class in the question bank.
  const pool = useMemo(() => scopeQuestionsForClass(questions as any[], profile.classLevel), [questions, profile.classLevel]);
  const subjects = useMemo(() => {
    const counts = new Map<string, number>();
    pool.forEach((q: any) => q.subject && counts.set(q.subject, (counts.get(q.subject) || 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([subject, count]) => {
      const sub = attempts.filter((a) => a.subject === subject);
      const avg = sub.length ? Math.round(sub.reduce((s, a) => s + (a.score / a.totalQuestions) * 100, 0) / sub.length) : 0;
      return { subject, count, avg };
    });
  }, [pool, attempts]);

  const weak = useMemo(() => {
    const c = attempts.flatMap((a) => a.weakTopics).reduce<Record<string, number>>((acc, t) => ((acc[t] = (acc[t] || 0) + 1), acc), {});
    return Object.entries(c).sort(([, a], [, b]) => b - a).slice(0, 3).map(([t]) => t);
  }, [attempts]);

  const firstName = (profile.name || "Student").split(" ")[0];
  const scopeLabel = profile.classLevel ? `Class ${profile.classLevel}` : profile.targetExam;
  const visibleFeed = showAllFeed ? feed : feed.slice(0, 3);

  return (
    <div>
      {/* ── Compact header ── */}
      <div className="am-grad relative overflow-hidden rounded-b-[26px] px-5 pb-5 pt-12 text-white">
        <span className="am-blob-a pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full bg-white/[0.07]" />
        <span className="am-blob-b pointer-events-none absolute -bottom-10 left-10 h-28 w-28 rounded-full bg-fuchsia-300/10" />
        <Sparkle className="absolute right-[42%] top-10 h-3 w-3 text-white/60" />
        <div className="relative flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-[12px] text-white/65">Hi, welcome back 👋</div>
            <div className="am-shine truncate text-[22px] font-bold leading-tight">{firstName}</div>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold">
              <span className="rounded-full bg-white/15 px-2.5 py-1">{scopeLabel}</span>
              <span className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1"><Flame size={12} /> {profile.streak} day streak</span>
              <span className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1"><Star size={12} /> {profile.totalPoints} pts</span>
            </div>
          </div>
          <ScoreRing pct={avgScore} size={68}>
            <div className="text-[16px] font-extrabold leading-none"><CountUp to={avgScore} suffix="%" /></div>
            <div className="mt-0.5 text-[9px] text-white/70">avg score</div>
          </ScoreRing>
        </div>
      </div>

      <div className="px-4 pt-5">
        {/* ── Motion card: Mock Test Practice ── */}
        <button onClick={() => nav("/practice")}
          className="am-grad group relative mb-5 block w-full overflow-hidden rounded-3xl p-5 text-left text-white shadow-[0_20px_40px_-20px_rgba(76,29,149,.8)]">
          <span className="am-orbit pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full border border-white/20">
            <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,.9)]" />
          </span>
          <span className="am-orbit-rev pointer-events-none absolute -right-2 top-3 h-24 w-24 rounded-full border border-dashed border-white/25">
            <span className="absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 translate-y-1/2 rounded-full bg-fuchsia-300" />
          </span>
          <span className="am-float pointer-events-none absolute right-5 top-8 rounded-lg bg-white/95 px-2 py-1 text-[11px] font-bold text-emerald-600 shadow">A ✓</span>
          <span className="am-float pointer-events-none absolute right-20 top-16 rounded-lg bg-white/95 px-2 py-1 text-[11px] font-bold text-violet-700 shadow" style={{ animationDelay: "1s" }}>+4</span>
          <span className="am-float pointer-events-none absolute right-8 top-[88px] rounded-lg bg-white/95 px-2 py-1 text-[11px] font-bold text-gray-700 shadow" style={{ animationDelay: "1.8s" }}>Q 17</span>

          <div className="relative max-w-[62%]">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-violet-200">
              <Sparkles size={12} /> Mock test practice
            </div>
            <div className="mt-1.5 text-[20px] font-extrabold leading-tight">30 random questions</div>
            <div className="mt-1 text-[12px] leading-snug text-violet-100/85">Pick subject & topics. Get your result instantly.</div>
          </div>
          <span className="relative mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-bold text-violet-800">
            <span className="am-ripple" />
            Start now <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
          </span>
        </button>

        {/* ── Quick tiles ── */}
        <div className="mb-6 grid grid-cols-4 gap-2.5">
          {[
            { label: "AI Chat", icon: Brain, color: "#6d28d9", bg: "#f3efff", to: "/pyp?section=chat" },
            { label: "Quiz", icon: Target, color: "#2563eb", bg: "#eef4ff", to: "/quiz" },
            { label: "Q. Bank", icon: Library, color: "#d97706", bg: "#fff6e8", to: "/question-bank" },
            { label: "Super App", icon: Award, color: "#16a34a", bg: "#ecfbf1", to: "/pyp" },
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

        {/* ── Join class (only without a class) ── */}
        {showJoinClassCta && (
          <button onClick={() => nav("/class/join")}
            className="mb-6 flex w-full items-center gap-3 rounded-2xl border p-3 text-left"
            style={{ background: colors.secondary, borderColor: "#ddd6fe" }}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: colors.primaryGradient }}>
              <QrCode size={18} color="#fff" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-bold" style={{ color: "#2e1065" }}>Join your class</span>
              <span className="block text-[12px]" style={{ color: "#5b21b6" }}>Get papers & updates from your teacher</span>
            </span>
            <ChevronRight size={18} color="#2e1065" />
          </button>
        )}

        {/* ── Daily updates (timeline) ── */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[17px] font-bold" style={{ color: colors.foreground }}>
            Daily Updates
            {feed.length > 0 && <span className="am-live h-2 w-2 rounded-full bg-emerald-500" />}
          </div>
          {feed.length > 3 && (
            <button onClick={() => setShowAllFeed((v) => !v)} className="text-[12px] font-semibold" style={{ color: colors.primary }}>
              {showAllFeed ? "Show less" : `See all (${feed.length})`}
            </button>
          )}
        </div>
        <div className="mb-6">
          {feedLoading ? (
            <div className="space-y-2">
              {[0, 1].map((i) => <div key={i} className="h-14 animate-pulse rounded-2xl" style={{ background: colors.muted }} />)}
            </div>
          ) : feed.length === 0 ? (
            <div className="flex items-center gap-3 rounded-2xl border border-dashed p-4" style={{ borderColor: "#ddd6fe" }}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: colors.secondary }}>
                <Bell size={18} color={colors.primary} className="am-bell" />
              </span>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold" style={{ color: colors.foreground }}>You're all caught up</div>
                <div className="text-[11px]" style={{ color: colors.mutedForeground }}>
                  {hasClass ? "New papers from your teacher will appear here." : "Join a class to get papers and updates here."}
                </div>
              </div>
            </div>
          ) : (
            <div className="relative pl-5">
              <span className="absolute bottom-3 left-[7px] top-3 w-[2px] rounded-full" style={{ background: "#ede9fe" }} />
              {visibleFeed.map((a, i) => {
                const due = a.dueAt ? new Date(a.dueAt) : null;
                const overdue = due ? due.getTime() < Date.now() : false;
                return (
                  <button key={a.id} onClick={() => nav(`/paper/${a.paperId}`)}
                    className="relative mb-2.5 flex w-full items-center gap-3 rounded-2xl border bg-white p-3 text-left last:mb-0"
                    style={{ borderColor: colors.border }}>
                    <span className="absolute -left-[18px] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-white"
                      style={{ background: i === 0 ? colors.primary : "#c4b5fd", boxShadow: "0 0 0 2px #ede9fe" }} />
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: "#ede9fe" }}>
                      <FileText size={16} color="#6d28d9" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold" style={{ color: colors.foreground }}>{a.paperTitle || "New paper"}</span>
                      <span className="block truncate text-[11px]" style={{ color: colors.mutedForeground }}>
                        {a.assignedByName || "Your teacher"}{a.className ? ` · ${a.className}` : ""} · {timeAgo(a.assignedAt)}
                      </span>
                    </span>
                    {due ? (
                      <span className="shrink-0 rounded-md px-2 py-1 text-[10px] font-bold"
                        style={overdue ? { background: "#fee2e2", color: "#b91c1c" } : { background: "#fef3c7", color: "#92400e" }}>
                        {overdue ? "Overdue" : `Due ${due.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
                      </span>
                    ) : <ChevronRight size={16} color={colors.mutedForeground} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Subjects (from the student's class) ── */}
        {subjects.length > 0 && (
          <>
            <div className="mb-3 text-[17px] font-bold" style={{ color: colors.foreground }}>Your Subjects</div>
            <div className="mb-6 grid grid-cols-2 gap-2.5">
              {subjects.slice(0, 6).map((s) => {
                const st = subjectStyle(s.subject);
                return (
                  <button key={s.subject} onClick={() => nav(`/practice?subject=${encodeURIComponent(s.subject)}`)}
                    className="rounded-2xl border bg-white p-3 text-left" style={{ borderColor: colors.border }}>
                    <div className="flex items-center justify-between">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: st.color + "18" }}>
                        <st.icon size={16} color={st.color} />
                      </span>
                      <span className="text-[13px] font-bold" style={{ color: st.color }}>{s.avg}%</span>
                    </div>
                    <div className="mt-2 truncate text-[13px] font-semibold" style={{ color: colors.foreground }}>{s.subject}</div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full" style={{ background: colors.muted }}>
                      <div className="h-full rounded-full transition-[width] duration-1000" style={{ width: `${s.avg}%`, background: st.color }} />
                    </div>
                    <div className="mt-1 text-[10px]" style={{ color: colors.mutedForeground }}>{s.count} questions</div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* ── Weak areas ── */}
        {weak.length > 0 && (
          <div className="mb-6 rounded-2xl border p-3.5" style={{ background: "#fffbeb", borderColor: "#fde68a" }}>
            <div className="mb-2 flex items-center gap-1.5 text-[13px] font-bold" style={{ color: "#92400e" }}>
              <Trophy size={14} /> Revise these next
            </div>
            <div className="flex flex-wrap gap-2">
              {weak.map((t) => (
                <button key={t} onClick={() => nav("/practice")}
                  className="rounded-full border bg-white px-3 py-1.5 text-[12px] font-semibold" style={{ borderColor: "#fcd34d", color: "#92400e" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
