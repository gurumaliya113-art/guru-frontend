import { useMemo, useState } from "react";
import { Icon, ProgressBar, StatCard } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { colors, subjectColor } from "@/lib/colors";
import { startSubscriptionCheckout } from "@/lib/razorpay";

export default function Progress() {
  const { attempts, profile, updateProfile, questions } = useApp();
  const subscribed = profile.subscription?.active === true;
  const [paying, setPaying] = useState(false);

  const handlePay = () => {
    setPaying(true);
    startSubscriptionCheckout(
      { name: profile.name, phone: profile.phone },
      async (sub) => {
        await updateProfile({ subscription: sub });
        setPaying(false);
        alert("Subscription activated! Enjoy unlimited access 🎉");
      },
      (err) => {
        setPaying(false);
        alert(`Payment failed: ${err.message}`);
      },
    );
  };

  const total = attempts.length;
  const avgScore = total > 0
    ? Math.round(attempts.reduce((s, a) => s + (a.score / a.totalQuestions) * 100, 0) / total)
    : 0;
  const bestScore = total > 0
    ? Math.max(...attempts.map((a) => Math.round((a.score / a.totalQuestions) * 100)))
    : 0;

  // Subjects shown are REAL for the student: derived from the question bank
  // for their class (e.g. Class 2 → Maths/English/Hindi/EVS/GK), plus any
  // subject they've actually attempted. Falls back to exam-track subjects
  // when no class is set (NEET/JEE aspirants).
  const subjectNames = useMemo(() => {
    const set = new Set<string>();
    if (profile.classLevel) {
      for (const q of questions) {
        if (String(q.classLevel) === profile.classLevel && q.subject) set.add(q.subject);
      }
    }
    if (set.size === 0) {
      const fallback =
        profile.targetExam === "NEET" ? ["Physics", "Chemistry", "Biology"]
        : profile.targetExam === "JEE" ? ["Physics", "Chemistry", "Mathematics"]
        : ["Physics", "Chemistry", "Biology", "Mathematics"];
      fallback.forEach((s) => set.add(s));
    }
    // Include any subject the student actually attempted.
    for (const a of attempts) if (a.subject) set.add(a.subject);
    return [...set].sort();
  }, [questions, attempts, profile.classLevel, profile.targetExam]);

  const subjectStats = subjectNames.map((subj) => {
    const sub = attempts.filter((a) => a.subject === subj);
    const avg = sub.length > 0
      ? Math.round(sub.reduce((s, a) => s + (a.score / a.totalQuestions) * 100, 0) / sub.length)
      : 0;
    return { subject: subj, avg, count: sub.length };
  });

  const weakCounts = attempts.flatMap((a) => a.weakTopics).reduce<Record<string, number>>(
    (acc, t) => ((acc[t] = (acc[t] || 0) + 1), acc), {});
  const topWeak = Object.entries(weakCounts).sort(([, a], [, b]) => b - a).slice(0, 4);

  const earnedBadges = profile.badges.filter((b) => b.earned);
  const unearnedBadges = profile.badges.filter((b) => !b.earned);

  return (
    <div className="px-4 pt-12 pb-5">
      <div className="text-[26px] font-bold mb-1" style={{ color: colors.foreground }}>My Progress</div>
      <div className="text-sm mb-4" style={{ color: colors.mutedForeground }}>Track your performance</div>

      {/* Subscription upsell — only shown to users without an active plan. */}
      {!subscribed && (
        <div
          className="rounded-2xl p-4 mb-4 border flex items-center gap-3"
          style={{
            background: "linear-gradient(135deg,#fffbeb,#fef3c7)",
            borderColor: "#fcd34d",
          }}
        >
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "#fff" }}
          >
            <Icon name="zap" size={20} color="#d97706" />
          </div>
          <div className="flex-1">
            <div className="text-[14px] font-bold" style={{ color: "#7c2d12" }}>
              Unlock full potential
            </div>
            <div className="text-[12px]" style={{ color: "#92400e" }}>
              All PYP papers · advanced analytics · from ₹29
            </div>
          </div>
          <button
            onClick={handlePay}
            disabled={paying}
            className="px-3 py-2 rounded-xl text-white text-[12px] font-bold disabled:opacity-60"
            style={{ background: "#d97706" }}
          >
            {paying ? "…" : "From ₹29 · Subscribe"}
          </button>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <StatCard label="Total Quizzes" value={total} />
        <StatCard label="Avg Score" value={`${avgScore}%`} color={colors.neet} />
        <StatCard label="Best Score" value={`${bestScore}%`} color={colors.jee} />
      </div>

      <div className="rounded-2xl p-4 mb-4 border bg-white shadow-sm" style={{ borderColor: colors.border }}>
        <div className="text-base font-semibold mb-4" style={{ color: colors.foreground }}>Subject Performance</div>
        {subjectStats.map(({ subject, avg, count }) => (
          <div key={subject} className="flex items-center gap-2.5 mb-3.5 last:mb-0">
            <div className="w-[90px]">
              <div className="text-[13px] font-medium" style={{ color: colors.foreground }}>{subject}</div>
              <div className="text-[11px]" style={{ color: colors.mutedForeground }}>{count} quizzes</div>
            </div>
            <div className="flex-1"><ProgressBar progress={avg / 100} color={subjectColor(subject) || colors.primary} /></div>
            <div className="w-9 text-right text-[13px] font-semibold" style={{ color: subjectColor(subject) || colors.primary }}>{avg}%</div>
          </div>
        ))}
        {total === 0 && <div className="text-center text-[13px] py-2" style={{ color: colors.mutedForeground }}>Take some quizzes to see your performance</div>}
      </div>

      <div className="rounded-2xl p-4 mb-4 border bg-white shadow-sm" style={{ borderColor: colors.border }}>
        <div className="flex justify-between items-center mb-4">
          <div className="text-base font-semibold" style={{ color: colors.foreground }}>Weak Areas</div>
          <Icon name="alert-triangle" size={16} color={colors.warning} />
        </div>
        {topWeak.length === 0 ? (
          <div className="text-center text-[13px] py-2" style={{ color: colors.mutedForeground }}>No weak topics identified yet</div>
        ) : (
          <>
            {topWeak.map(([topic, count]) => (
              <div key={topic} className="flex items-center gap-2.5 mb-3 last:mb-0">
                <span className="w-2 h-2 rounded-full" style={{ background: colors.destructive }} />
                <span className="flex-1 text-sm font-medium" style={{ color: colors.foreground }}>{topic}</span>
                <span className="text-xs" style={{ color: colors.mutedForeground }}>missed {count}x</span>
              </div>
            ))}
            <div className="flex items-start gap-2 p-3 rounded-xl mt-1" style={{ background: colors.neetLight }}>
              <Icon name="book-open" size={14} color={colors.neet} />
              <div className="flex-1 text-[13px] leading-5" style={{ color: colors.neetForeground }}>
                Focus on {topWeak[0]?.[0]} — review NCERT concepts and attempt chapter-wise practice
              </div>
            </div>
          </>
        )}
      </div>

      <div className="rounded-2xl p-4 mb-4 border bg-white shadow-sm" style={{ borderColor: colors.border }}>
        <div className="text-base font-semibold mb-4" style={{ color: colors.foreground }}>Recent Attempts</div>
        {attempts.slice(0, 5).map((a) => {
          const pct = Math.round((a.score / a.totalQuestions) * 100);
          return (
            <div key={a.id} className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
              <div className="flex-1 pr-3">
                <div className="text-[13px] font-medium truncate" style={{ color: colors.foreground }}>{a.title}</div>
                <div className="text-[11px]" style={{ color: colors.mutedForeground }}>
                  {new Date(a.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-[13px] font-bold"
                style={{
                  background: pct >= 70 ? colors.neetLight : pct >= 50 ? colors.jeeLight : "#fee2e2",
                  color: pct >= 70 ? colors.neet : pct >= 50 ? colors.jee : colors.destructive,
                }}>
                {pct}%
              </span>
            </div>
          );
        })}
        {attempts.length === 0 && <div className="text-center text-[13px] py-2" style={{ color: colors.mutedForeground }}>No quiz attempts yet</div>}
      </div>

      <div className="rounded-2xl p-4 mb-4 border bg-white shadow-sm" style={{ borderColor: colors.border }}>
        <div className="text-base font-semibold mb-4" style={{ color: colors.foreground }}>Badges & Achievements</div>
        <div className="flex flex-wrap gap-2.5">
          {[...earnedBadges, ...unearnedBadges].map((badge) => (
            <div key={badge.id} className="basis-[30%] flex-1 flex flex-col items-center p-3 rounded-2xl border gap-2 relative"
              style={{
                background: badge.earned ? colors.jeeLight : colors.muted,
                borderColor: badge.earned ? colors.jee : colors.border,
              }}>
              <Icon name={badge.icon} size={24} color={badge.earned ? colors.jee : colors.mutedForeground} />
              <div className="text-[11px] font-medium text-center"
                style={{ color: badge.earned ? colors.foreground : colors.mutedForeground }}>
                {badge.name}
              </div>
              {!badge.earned && (
                <div className="absolute top-1.5 right-1.5 p-0.5 rounded-md" style={{ background: "rgba(0,0,0,0.05)" }}>
                  <Icon name="lock" size={12} color={colors.mutedForeground} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
