import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";
import { colors } from "@/lib/colors";
import { startSubscriptionCheckout } from "@/lib/razorpay";
import type { Question } from "@/lib/types";

const SOL_KEY = "gurutron_solutions_viewed_v1";
const FREE_SOLUTION_LIMIT = 10;

function getSolViewed(): number {
  try { return Number(localStorage.getItem(SOL_KEY) || 0); } catch { return 0; }
}
function setSolViewed(n: number) {
  try { localStorage.setItem(SOL_KEY, String(n)); } catch { /* ignore */ }
}

type Step = "class" | "subject" | "topic" | "questions";

const CLASS_ORDER = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

export default function QuestionBank() {
  const { profile, updateProfile } = useApp();
  const subscribed = !!profile.subscription?.active;

  const [all, setAll] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>(profile.classLevel ? "subject" : "class");
  const [selClass, setSelClass] = useState<string>(profile.classLevel || "");
  const [selSubject, setSelSubject] = useState<string>("");
  const [selTopic, setSelTopic] = useState<string>("");
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [solViewed, setSolViewedState] = useState<number>(getSolViewed());
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await api.getQuestions();
        if (!cancelled) setAll(r.questions || []);
      } catch (e) {
        console.warn("[QuestionBank] load failed", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Only questions that have a class level (the curated class-wise bank).
  const bank = useMemo(() => all.filter((q) => q.classLevel), [all]);

  const classes = useMemo(() => {
    const set = new Set(bank.map((q) => String(q.classLevel)));
    return CLASS_ORDER.filter((c) => set.has(c));
  }, [bank]);

  const subjects = useMemo(() => {
    if (!selClass) return [];
    return [...new Set(bank.filter((q) => String(q.classLevel) === selClass).map((q) => q.subject))].sort();
  }, [bank, selClass]);

  const topics = useMemo(() => {
    if (!selClass || !selSubject) return [];
    return [...new Set(
      bank
        .filter((q) => String(q.classLevel) === selClass && q.subject === selSubject)
        .map((q) => q.topic || "General")
    )].sort();
  }, [bank, selClass, selSubject]);

  const questions = useMemo(() => {
    if (!selClass || !selSubject || !selTopic) return [];
    return bank.filter(
      (q) => String(q.classLevel) === selClass && q.subject === selSubject && (q.topic || "General") === selTopic
    );
  }, [bank, selClass, selSubject, selTopic]);

  const remaining = subscribed ? "∞" : Math.max(0, FREE_SOLUTION_LIMIT - solViewed);

  function tryRevealSolution(q: Question) {
    if (revealed.has(q.id)) return; // already open
    if (subscribed) {
      setRevealed((prev) => new Set(prev).add(q.id));
      return;
    }
    if (solViewed >= FREE_SOLUTION_LIMIT) {
      setShowUpgrade(true);
      return;
    }
    const next = solViewed + 1;
    setSolViewed(next);
    setSolViewedState(next);
    setRevealed((prev) => new Set(prev).add(q.id));
  }

  async function handleUpgrade() {
    setPaying(true);
    await startSubscriptionCheckout(
      { name: profile.name || "Student" },
      async (sub) => {
        await updateProfile({ subscription: { active: true, ...sub } });
        setShowUpgrade(false);
        setPaying(false);
      },
      (err) => {
        console.error("[QuestionBank] payment failed", err);
        setPaying(false);
        alert("Payment could not be completed. Please try again.");
      }
    );
  }

  const Header = (
    <div className="px-4 pt-5 pb-3">
      <div className="flex items-center gap-2">
        <Icon name="book-open" size={22} color={colors.primary} />
        <div className="flex-1">
          <h1 className="text-lg font-bold" style={{ color: colors.foreground }}>Question Bank</h1>
          <div className="text-[11px]" style={{ color: colors.mutedForeground }}>
            {subscribed ? "Premium · unlimited solutions" : `${remaining} free solutions left`}
          </div>
        </div>
      </div>
      {selClass && step !== "class" && (
        <button
          onClick={() => setStep("class")}
          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold"
          style={{ background: colors.primary + "15", color: colors.primary }}
        >
          <Icon name="refresh-cw" size={13} color={colors.primary} />
          Class {selClass} · Change class
        </button>
      )}
    </div>
  );

  if (loading) {
    return (<div>{Header}<div className="px-4 text-sm" style={{ color: colors.mutedForeground }}>Loading questions…</div></div>);
  }

  // Breadcrumb / back
  const crumb = [
    step !== "class" && selClass ? `Class ${selClass}` : null,
    step !== "class" && step !== "subject" && selSubject ? selSubject : null,
    step === "questions" && selTopic ? selTopic : null,
  ].filter(Boolean).join("  ›  ");

  function goBack() {
    if (step === "questions") setStep("topic");
    else if (step === "topic") setStep("subject");
    else if (step === "subject") setStep("class");
  }

  return (
    <div>
      {Header}
      {step !== "class" && (
        <div className="px-4 pb-2 flex items-center gap-2">
          <button onClick={goBack} className="flex items-center gap-1 text-[13px] font-semibold" style={{ color: colors.primary }}>
            <Icon name="arrow-left" size={15} color={colors.primary} /> Back
          </button>
          <span className="text-[12px] truncate" style={{ color: colors.mutedForeground }}>{crumb}</span>
        </div>
      )}

      <div className="px-4 pb-24">
        {/* STEP 1: CLASS */}
        {step === "class" && (
          <>
            <div className="text-[14px] font-bold mb-3" style={{ color: colors.foreground }}>Select your class</div>
            {classes.length === 0 ? (
              <div className="text-sm" style={{ color: colors.mutedForeground }}>No questions available yet.</div>
            ) : (
              <div className="grid grid-cols-3 gap-2.5">
                {classes.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setSelClass(c); setSelSubject(""); setSelTopic(""); setStep("subject"); }}
                    className="rounded-2xl border py-4 font-bold text-[15px] active:scale-95 transition"
                    style={{
                      borderColor: c === profile.classLevel ? colors.primary : colors.border,
                      background: c === profile.classLevel ? "#eff6ff" : colors.card,
                      color: c === profile.classLevel ? colors.primary : colors.foreground,
                    }}
                  >
                    Class {c}
                    {c === profile.classLevel && <div className="text-[9px] font-semibold mt-0.5">Your class</div>}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* STEP 2: SUBJECT */}
        {step === "subject" && (
          <>
            <div className="text-[14px] font-bold mb-3" style={{ color: colors.foreground }}>Choose a subject</div>
            <div className="flex flex-col gap-2.5">
              {subjects.map((s) => {
                const count = bank.filter((q) => String(q.classLevel) === selClass && q.subject === s).length;
                return (
                  <button
                    key={s}
                    onClick={() => { setSelSubject(s); setSelTopic(""); setStep("topic"); }}
                    className="flex items-center gap-3 rounded-2xl border p-4 text-left active:scale-[0.99] transition"
                    style={{ borderColor: colors.border, background: colors.card }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#eff6ff" }}>
                      <Icon name="book-open" size={18} color={colors.primary} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-[14px]" style={{ color: colors.foreground }}>{s}</div>
                      <div className="text-[11px]" style={{ color: colors.mutedForeground }}>{count} questions</div>
                    </div>
                    <Icon name="chevron-right" size={16} color={colors.mutedForeground} />
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* STEP 3: TOPIC */}
        {step === "topic" && (
          <>
            <div className="text-[14px] font-bold mb-3" style={{ color: colors.foreground }}>Pick a topic</div>
            <div className="flex flex-col gap-2.5">
              {topics.map((t) => {
                const count = bank.filter((q) => String(q.classLevel) === selClass && q.subject === selSubject && (q.topic || "General") === t).length;
                return (
                  <button
                    key={t}
                    onClick={() => { setSelTopic(t); setStep("questions"); }}
                    className="flex items-center gap-3 rounded-2xl border p-3.5 text-left active:scale-[0.99] transition"
                    style={{ borderColor: colors.border, background: colors.card }}
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-[13.5px]" style={{ color: colors.foreground }}>{t}</div>
                      <div className="text-[11px]" style={{ color: colors.mutedForeground }}>{count} questions</div>
                    </div>
                    <Icon name="chevron-right" size={16} color={colors.mutedForeground} />
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* STEP 4: QUESTIONS */}
        {step === "questions" && (
          <div className="flex flex-col gap-3">
            {questions.map((q, i) => {
              const isOpen = revealed.has(q.id);
              return (
                <div key={q.id} className="rounded-2xl border p-4 shadow-sm" style={{ borderColor: colors.border, background: colors.card }}>
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-[12px] font-bold px-2 py-0.5 rounded-md shrink-0" style={{ background: "#eff6ff", color: colors.primary }}>Q{i + 1}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-md" style={{ background: colors.muted, color: colors.mutedForeground }}>{q.type || "MCQ"}</span>
                  </div>
                  <div className="text-[14px] font-semibold mb-3" style={{ color: colors.foreground }}>{q.text}</div>

                  <div className="flex flex-col gap-2 mb-3">
                    {(q.options || []).filter((o) => o).map((opt, idx) => {
                      const correct = isOpen && idx === q.correctIndex;
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-2 rounded-xl border px-3 py-2 text-[13px]"
                          style={{
                            borderColor: correct ? colors.success : colors.border,
                            background: correct ? "#dcfce7" : "#fff",
                            color: correct ? "#14532d" : colors.foreground,
                          }}
                        >
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                            style={{ background: correct ? colors.success : colors.muted, color: correct ? "#fff" : colors.mutedForeground }}>
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span>{opt}</span>
                          {correct && <Icon name="check-circle" size={15} color={colors.success} />}
                        </div>
                      );
                    })}
                  </div>

                  {isOpen ? (
                    <div className="rounded-xl p-3 text-[12.5px]" style={{ background: "#fffbeb", border: `1px solid #fde68a`, color: "#92400e" }}>
                      <span className="font-bold">Solution: </span>{q.explanation || "Correct option highlighted above."}
                    </div>
                  ) : (
                    <button
                      onClick={() => tryRevealSolution(q)}
                      className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white active:opacity-90"
                      style={{ background: colors.primary }}
                    >
                      View Answer & Solution
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upgrade modal */}
      {showUpgrade && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center" onClick={() => !paying && setShowUpgrade(false)}>
          <div className="w-full max-w-md rounded-[28px] border bg-white p-5 shadow-2xl" style={{ borderColor: colors.border }} onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: "#fef3c7" }}>
              <Icon name="lock" size={22} color="#d97706" />
            </div>
            <div className="text-[16px] font-bold mb-1" style={{ color: colors.foreground }}>Free solution limit reached</div>
            <div className="text-[13px] mb-4" style={{ color: colors.mutedForeground }}>
              You've viewed your {FREE_SOLUTION_LIMIT} free solutions. Upgrade to unlock unlimited answers & step-by-step solutions across all classes and subjects.
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowUpgrade(false)} disabled={paying}
                className="flex-1 rounded-2xl border py-2.5 text-[13px] font-semibold"
                style={{ borderColor: colors.border, background: colors.secondary, color: colors.foreground }}>
                Maybe later
              </button>
              <button onClick={handleUpgrade} disabled={paying}
                className="flex-1 rounded-2xl py-2.5 text-[13px] font-semibold text-white disabled:opacity-60"
                style={{ background: colors.primary }}>
                {paying ? "Processing…" : "Upgrade Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
