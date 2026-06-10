import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon, ProgressBar } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";
import { colors } from "@/lib/colors";
import type { Assignment } from "@/lib/types";
import TeacherClassPanel from "@/pages/TeacherClassPanel";

export default function Home() {
  const { profile, attempts, papers, students, questions, myMemberships } = useApp();
  if (profile.role === "teacher") return <TeacherHome />;
  return <StudentHome />;

  function StudentHome() {
    const nav = useNavigate();
    const hasClass = myMemberships.some(
      (m) => m.status === "approved" || m.status === "pending"
    );

    // Daily-updates feed. Right now we derive it from assignments the
    // student has via approved class memberships (teacher uploaded a paper /
    // assigned a quiz). General students with no class will see an empty
    // state — that's intentional, the home feed should stay quiet for them
    // until they join a class.
    const [feed, setFeed] = useState<Assignment[]>([]);
    const [feedLoading, setFeedLoading] = useState(true);
    useEffect(() => {
      let cancelled = false;
      (async () => {
        try {
          const r = await api.getAssignmentsForMe();
          if (cancelled) return;
          // Newest first.
          const sorted = [...(r.assignments || [])].sort((a, b) => {
            const ta = a.assignedAt ? Date.parse(a.assignedAt) : 0;
            const tb = b.assignedAt ? Date.parse(b.assignedAt) : 0;
            return tb - ta;
          });
          setFeed(sorted);
        } catch (e) {
          console.warn("[Home] failed to load assignments feed:", e);
          if (!cancelled) setFeed([]);
        } finally {
          if (!cancelled) setFeedLoading(false);
        }
      })();
      return () => { cancelled = true; };
    }, []);

    const avgScore =
      attempts.length > 0
        ? Math.round(
            attempts.reduce((s, a) => s + (a.score / a.totalQuestions) * 100, 0) / attempts.length
          )
        : 0;
    const examC =
      profile.targetExam === "NEET" ? "#16a34a" : profile.targetExam === "JEE" ? "#ea580c" : "#7c3aed";
    const subjectStats = ["Physics", "Chemistry", "Biology", "Mathematics"].map((subj) => {
      const sub = attempts.filter((a) => a.subject === subj);
      const avg =
        sub.length > 0
          ? Math.round(sub.reduce((s, a) => s + (a.score / a.totalQuestions) * 100, 0) / sub.length)
          : 0;
      return { subject: subj, avg, count: sub.length };
    });
    const subjectColors: Record<string, string> = {
      Physics: "#3b82f6", Chemistry: "#8b5cf6", Biology: "#22c55e", Mathematics: "#f59e0b",
    };
    const subjectIcons: Record<string, string> = {
      Physics: "zap", Chemistry: "droplet", Biology: "feather", Mathematics: "percent",
    };
    const weakTopicCounts = attempts.flatMap((a) => a.weakTopics).reduce<Record<string, number>>(
      (acc, t) => ((acc[t] = (acc[t] || 0) + 1), acc),
      {}
    );
    const topWeak = Object.entries(weakTopicCounts).sort(([, a], [, b]) => b - a).slice(0, 2);

    return (
      <div>
        {/* Hero */}
        <div className="relative overflow-hidden px-5 pt-16 pb-7 text-white"
          style={{ background: "linear-gradient(135deg,#0b1220 0%,#172554 45%,#2563eb 100%)" }}>
          <div className="absolute -top-14 -right-10 w-52 h-52 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="absolute -bottom-8 left-8 w-32 h-32 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }} />
          <div className="flex items-start justify-between mb-5 relative">
            <div>
              <div className="text-[13px]" style={{ color: "rgba(255,255,255,0.55)" }}>Good day</div>
              <div className="text-2xl font-bold tracking-tight">{profile.name}</div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
              style={{ background: examC + "30", borderColor: examC + "60" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: examC }} />
              <span className="text-xs font-bold" style={{ color: examC === "#16a34a" ? "#4ade80" : examC === "#ea580c" ? "#fb923c" : "#c4b5fd" }}>
                {profile.targetExam}
              </span>
            </div>
          </div>
          <div className="flex items-center rounded-2xl py-3.5 px-4 relative" style={{ background: "rgba(255,255,255,0.1)" }}>
            {[
              { icon: "activity", val: profile.streak, label: "day streak" },
              { icon: "star", val: profile.totalPoints, label: "points" },
              { icon: "trending-up", val: "#" + profile.rank, label: "rank" },
              { icon: "check-circle", val: avgScore + "%", label: "avg score" },
            ].map((s, i, arr) => (
              <div key={s.label} className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-0.5">
                  <Icon name={s.icon} size={14} color="rgba(255,255,255,0.6)" />
                  <div className="text-lg font-bold">{s.val}</div>
                  <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>{s.label}</div>
                </div>
                {i < arr.length - 1 && <div className="w-px h-8 ml-auto" style={{ background: "rgba(255,255,255,0.12)" }} />}
              </div>
            ))}
          </div>
        </div>

        <div className="px-4 pt-5">
          <div className="flex gap-2.5 mb-6">
            <button
              onClick={() => nav("/quiz")}
              className="flex-[1.4] flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-bold shadow-md active:opacity-90"
              style={{ background: colors.primary }}
            >
              <Icon name="play-circle" size={22} color="#fff" /> Start Quiz
            </button>
            <button
              onClick={() => nav("/pyp")}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border bg-white font-semibold text-[13px]"
              style={{ borderColor: colors.border, color: colors.foreground }}
            >
              <Icon name="award" size={20} color="#d97706" /> Prev. Papers
            </button>
          </div>

          {/* ---------- Join Class CTA (only for students without a class) ---------- */}
          {!hasClass && (
            <button
              onClick={() => nav("/class/join")}
              className="w-full text-left rounded-2xl p-3.5 mb-6 border shadow-sm active:opacity-90 flex items-center gap-3"
              style={{
                background: "linear-gradient(135deg,#eff6ff,#dbeafe)",
                borderColor: "#bfdbfe",
              }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "#1e3a8a" }}
              >
                <Icon name="qr-code" size={20} color="#fff" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-bold" style={{ color: "#1e3a8a" }}>
                  Join your class
                </div>
                <div className="text-[12px]" style={{ color: "#1d4ed8" }}>
                  Scan QR or enter the code your teacher shared.
                </div>
              </div>
              <Icon name="chevron-right" size={18} color="#1e3a8a" />
            </button>
          )}

          {/* ---------- Daily Updates feed ---------- */}
          {/* Empty for students who aren't in any class yet — by design,
              we don't fill the home feed with mock content for general
              users. As soon as they join a class and the teacher assigns
              anything, those rows surface here. */}
          <div className="flex justify-between items-center mb-3">
            <div className="text-[17px] font-bold" style={{ color: colors.foreground }}>
              Daily Updates
            </div>
            {feed.length > 0 && (
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded-md"
                style={{ background: "#eff6ff" }}
              >
                <Icon name="bell" size={11} color="#2563eb" />
                <span className="text-[11px] font-semibold" style={{ color: "#1d4ed8" }}>
                  {feed.length} new
                </span>
              </div>
            )}
          </div>
          <div className="mb-6 flex flex-col gap-2">
            {feedLoading ? (
              <div
                className="rounded-2xl p-4 border bg-white text-[12px]"
                style={{ borderColor: colors.border, color: colors.mutedForeground }}
              >
                Loading updates…
              </div>
            ) : feed.length === 0 ? (
              <div
                className="rounded-2xl p-4 border-2 border-dashed text-center"
                style={{ borderColor: colors.border }}
              >
                <Icon name="bell-off" size={20} color={colors.mutedForeground} />
                <div
                  className="text-[13px] font-semibold mt-1.5"
                  style={{ color: colors.foreground }}
                >
                  No updates yet
                </div>
                <div
                  className="text-[11px] mt-0.5"
                  style={{ color: colors.mutedForeground }}
                >
                  Join a class to see assigned papers &amp; daily announcements here.
                </div>
              </div>
            ) : (
              feed.slice(0, 4).map((a) => {
                const teacher = a.assignedByName || "Your teacher";
                const ts = a.assignedAt ? new Date(a.assignedAt) : null;
                const due = a.dueAt ? new Date(a.dueAt) : null;
                return (
                  <button
                    key={a.id}
                    onClick={() => nav(`/paper/${a.paperId}`)}
                    className="text-left rounded-2xl p-3.5 border bg-white shadow-sm active:opacity-90"
                    style={{ borderColor: colors.border }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: "#dbeafe" }}
                      >
                        <Icon name="file-text" size={16} color="#2563eb" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-[13px] leading-snug"
                          style={{ color: colors.foreground }}
                        >
                          <span className="font-semibold">{teacher}</span>
                          {" "}uploaded{" "}
                          <span className="font-semibold">
                            {a.paperTitle || "a new paper"}
                          </span>
                          {due
                            ? ` — attempt by ${due.toLocaleString("en-IN", {
                                day: "numeric",
                                month: "short",
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })}`
                            : ""}
                        </div>
                        <div
                          className="flex items-center gap-2 mt-1 text-[11px]"
                          style={{ color: colors.mutedForeground }}
                        >
                          {a.className && <span>{a.className}</span>}
                          {a.className && ts && <span>·</span>}
                          {ts && (
                            <span>
                              {ts.toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                      <Icon name="chevron-right" size={16} color={colors.mutedForeground} />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* ---------- Previous Year Papers / Mocks entry card ---------- */}
          <div
            className="rounded-2xl p-4 mb-6 border shadow-sm"
            style={{
              background: "linear-gradient(135deg,#fef3c7,#fde68a)",
              borderColor: "#fcd34d",
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "#fff" }}
              >
                <Icon name="award" size={22} color="#d97706" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-bold" style={{ color: "#7c2d12" }}>
                  Super App
                </div>
                <div className="text-[12px]" style={{ color: "#92400e" }}>
                  NEET · JEE · Board ·{" "}
                  {profile.subscription?.active
                    ? "all unlocked"
                    : "first 5 free, then subscription from ₹29"}
                </div>
              </div>
            </div>
            <button
              onClick={() => nav("/pyp")}
              className="w-full py-2.5 rounded-xl text-white font-bold text-[13px] active:opacity-90"
              style={{ background: "#d97706" }}
            >
              {profile.subscription?.active
                ? "Open library"
                : "Explore 5 papers now"}
            </button>
          </div>

          {/* ---------- Assigned Papers column ---------- */}
          {/* Same data source as the feed above (assignments for my classes),
              but rendered as a full standalone list. Stays empty for general
              (non-class) students by design. */}
          <div className="flex justify-between items-center mb-3">
            <div className="text-[17px] font-bold" style={{ color: colors.foreground }}>
              Assigned Papers
            </div>
            {feed.length > 0 && (
              <button
                onClick={() => nav("/papers")}
                className="text-[12px] font-semibold"
                style={{ color: colors.primary }}
              >
                See all
              </button>
            )}
          </div>
          <div className="mb-6 flex flex-col gap-2">
            {feedLoading ? (
              <div
                className="rounded-2xl p-4 border bg-white text-[12px]"
                style={{ borderColor: colors.border, color: colors.mutedForeground }}
              >
                Loading…
              </div>
            ) : feed.length === 0 ? (
              <div
                className="rounded-2xl p-4 border-2 border-dashed text-center"
                style={{ borderColor: colors.border }}
              >
                <Icon name="inbox" size={20} color={colors.mutedForeground} />
                <div
                  className="text-[13px] font-semibold mt-1.5"
                  style={{ color: colors.foreground }}
                >
                  No papers assigned yet
                </div>
                <div
                  className="text-[11px] mt-0.5"
                  style={{ color: colors.mutedForeground }}
                >
                  Once your teacher assigns a paper to your class, it shows up here.
                </div>
              </div>
            ) : (
              feed.map((a) => {
                const due = a.dueAt ? new Date(a.dueAt) : null;
                return (
                  <button
                    key={`assigned-${a.id}`}
                    onClick={() => nav(`/paper/${a.paperId}`)}
                    className="text-left rounded-2xl p-3.5 border bg-white shadow-sm active:opacity-90"
                    style={{ borderColor: colors.border }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: "#ecfdf5" }}
                      >
                        <Icon name="clipboard" size={18} color="#16a34a" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-[14px] font-semibold truncate"
                          style={{ color: colors.foreground }}
                        >
                          {a.paperTitle || "Untitled paper"}
                        </div>
                        <div
                          className="flex items-center gap-2 mt-0.5 text-[11px]"
                          style={{ color: colors.mutedForeground }}
                        >
                          {a.className && <span>{a.className}</span>}
                          {a.className && a.assignedByName && <span>·</span>}
                          {a.assignedByName && <span>by {a.assignedByName}</span>}
                        </div>
                      </div>
                      {due ? (
                        <div
                          className="text-[11px] font-semibold px-2 py-1 rounded-md"
                          style={{ background: "#fef3c7", color: "#92400e" }}
                        >
                          Due {due.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </div>
                      ) : (
                        <Icon name="chevron-right" size={16} color={colors.mutedForeground} />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="text-[17px] font-bold mb-3" style={{ color: colors.foreground }}>Subjects</div>
          <div className="mb-6 flex flex-col gap-2">
            {["Physics", "Chemistry", "Biology", "Mathematics"].map((subj) => {
              const stat = subjectStats.find((s) => s.subject === subj)!;
              const sc = subjectColors[subj];
              const ic = subjectIcons[subj];
              return (
                <button
                  key={subj}
                  onClick={() => nav(`/quiz?subject=${subj}`)}
                  className="flex items-center gap-3.5 rounded-2xl p-3.5 border bg-white shadow-sm active:opacity-90"
                  style={{ borderColor: colors.border }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: sc + "18" }}>
                    <Icon name={ic} size={18} color={sc} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div className="text-sm font-semibold" style={{ color: colors.foreground }}>{subj}</div>
                      <div className="text-sm font-bold" style={{ color: sc }}>{stat.avg}%</div>
                    </div>
                    <div className="my-1.5"><ProgressBar progress={stat.avg / 100} color={sc} height={5} /></div>
                    <div className="text-[11px]" style={{ color: colors.mutedForeground }}>
                      {questions.filter((q) => q.subject === subj).length} questions available
                    </div>
                  </div>
                  <Icon name="chevron-right" size={16} color={colors.mutedForeground} />
                </button>
              );
            })}
          </div>

          {topWeak.length > 0 && (
            <>
              <div className="flex justify-between items-center mb-3">
                <div className="text-[17px] font-bold" style={{ color: colors.foreground }}>Revise These</div>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md" style={{ background: "#fffbeb" }}>
                  <Icon name="alert-circle" size={12} color="#f59e0b" />
                  <span className="text-[11px] font-semibold" style={{ color: "#d97706" }}>Weak areas</span>
                </div>
              </div>
              <div className="rounded-2xl p-4 border mb-6" style={{ background: "#fffbeb", borderColor: "#fde68a" }}>
                {topWeak.map(([topic]) => (
                  <div key={topic} className="flex items-center gap-2.5 mb-2.5 last:mb-0">
                    <span className="w-2 h-2 rounded-full" style={{ background: "#f59e0b" }} />
                    <span className="flex-1 text-sm font-medium" style={{ color: "#92400e" }}>{topic as string}</span>
                    <button onClick={() => nav("/quiz")} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: "#f59e0b" }}>
                      Practice
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="rounded-2xl p-3.5 border mb-2 bg-white" style={{ borderColor: colors.border }}>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#dbeafe" }}>
                <Icon name="info" size={16} color="#2563eb" />
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-semibold mb-1" style={{ color: colors.foreground }}>Daily Tip</div>
                <div className="text-xs leading-5" style={{ color: colors.mutedForeground }}>
                  {profile.targetExam === "NEET"
                    ? "Focus on NCERT diagrams for Biology — appear directly in NEET papers."
                    : "For JEE, practice derivations — understanding > memorising formulas."}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
        <div className="relative overflow-hidden px-5 pt-16 pb-7 text-white"
          style={{ background: "linear-gradient(135deg,#1c1917,#292524)" }}>
          <div className="absolute -top-14 -right-10 w-52 h-52 rounded-full" style={{ background: "rgba(251,191,36,0.08)" }} />
          <div className="absolute -bottom-8 left-8 w-32 h-32 rounded-full" style={{ background: "rgba(251,191,36,0.05)" }} />
          <div className="flex items-start justify-between mb-5 relative">
            <div>
              <div className="text-[13px]" style={{ color: "rgba(255,255,255,0.55)" }}>Welcome back</div>
              <div className="text-2xl font-bold tracking-tight">{profile.name}</div>
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
              style={{ background: colors.primary }}
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
