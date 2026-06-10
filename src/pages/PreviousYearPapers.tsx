// PreviousYearPapers — student-facing catalogue of admin-curated previous
// year papers and mock tests. We show summaries (light payload) on this
// list page; the full questions array is fetched only when a student
// opens a specific paper. The server enforces the "first 5 free" paywall
// on the detail endpoint (HTTP 402 with code: "PAYWALL"), so we don't
// have to trust client-side gating.

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon, Spinner } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";
import { colors, examColor, examLight } from "@/lib/colors";
import { startSubscriptionCheckout } from "@/lib/razorpay";
import type { ExamType, PreviousYearPaperSummary } from "@/lib/types";

const SUBSCRIPTION_PLANS = [
  { id: "7d-29", label: "7 days", amount: 29, subtitle: "Short access" },
  { id: "30d-99", label: "30 days", amount: 99, subtitle: "Most popular" },
  { id: "3m-249", label: "3 months", amount: 249, subtitle: "Best value" },
  { id: "lifetime-999", label: "Lifetime", amount: 999, subtitle: "Unlimited access" },
] as const;

const ALL_EXAMS: (ExamType | "ALL")[] = ["ALL", "NEET", "JEE", "BOARD"];

export default function PreviousYearPapers() {
  const nav = useNavigate();
  const { profile, addPaper, updateProfile } = useApp();

  const [pyps, setPyps] = useState<PreviousYearPaperSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ExamType | "ALL">(
    (profile.targetExam as ExamType) || "ALL",
  );
  const [opening, setOpening] = useState<string | null>(null);
  const [paywall, setPaywall] = useState<{ message: string } | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState(SUBSCRIPTION_PLANS[1].id);
  const [paying, setPaying] = useState(false);

  const selectedPlan = SUBSCRIPTION_PLANS.find((plan) => plan.id === selectedPlanId) ?? SUBSCRIPTION_PLANS[1];

  const handlePay = () => {
    setPaying(true);
    startSubscriptionCheckout(
      { name: profile.name, phone: profile.phone },
      async (sub) => {
        await updateProfile({ subscription: sub });
        setPaying(false);
        setPaywall(null);
        alert("Subscription activated! Enjoy unlimited access 🎉");
      },
      (err) => {
        setPaying(false);
        alert(`Payment failed: ${err.message}`);
      },
      {
        planId: selectedPlan.id,
        planLabel: selectedPlan.label,
      },
    );
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await api.getPyps();
        if (!cancelled) setPyps(r.pyps || []);
      } catch (e) {
        if (!cancelled) setError(String((e as Error).message || e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Sort oldest-first so the "first 5 free" slots are stable across loads.
  const sorted = useMemo(() => {
    return [...pyps].sort((a, b) => {
      const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
      const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
      return ta - tb;
    });
  }, [pyps]);

  const filtered = useMemo(() => {
    if (filter === "ALL") return sorted;
    return sorted.filter((p) => p.examType === filter);
  }, [sorted, filter]);

  const subscribed = profile.subscription?.active === true;

  const handleOpen = async (p: PreviousYearPaperSummary, indexInGlobal: number) => {
    // Client-side hint: if this PYP is beyond the free quota and the user is
    // unsubscribed, surface the paywall immediately without round-tripping.
    // The server enforces the same rule so this is purely a UX shortcut.
    if (indexInGlobal >= 5 && !subscribed) {
      setPaywall({
        message: "First 5 papers / mocks are free. Subscribe from ₹29 to unlock the rest.",
      });
      return;
    }

    setOpening(p.id);
    try {
      const r = await api.getPyp(p.id);
      // Hand the PYP off to the existing PaperView by stashing it into the
      // user's paper cache as a regular GeneratedPaper. The id is namespaced
      // ("pyp_…") so it never collides with user-generated paper ids.
      await addPaper({
        id: r.pyp.id,
        title: r.pyp.title,
        examType: r.pyp.examType,
        subject: (r.pyp.subject as never) || ("Physics" as never),
        topic: "Previous Year",
        difficulty: "Moderate",
        durationMinutes: r.pyp.durationMinutes,
        questions: r.pyp.questions,
        createdAt: r.pyp.createdAt,
        skipHeader: true,
      });
      nav(`/paper/${r.pyp.id}`);
    } catch (e: unknown) {
      const msg = String((e as Error)?.message || e);
      if (msg.includes("PAYWALL") || msg.includes("402")) {
        setPaywall({
          message:
            "First 5 papers / mocks are free. Subscribe from ₹29 to unlock the rest.",
        });
      } else {
        setError(msg);
      }
    } finally {
      setOpening(null);
    }
  };

  const handleAttempt = async (p: PreviousYearPaperSummary, indexInGlobal: number) => {
    if (indexInGlobal >= 5 && !subscribed) {
      setPaywall({
        message: "First 5 papers / mocks are free. Subscribe from ₹29 to unlock the rest.",
      });
      return;
    }

    setOpening(p.id);
    try {
      const r = await api.getPyp(p.id);
      nav(`/quiz/${r.pyp.id}`, {
        state: {
          title: r.pyp.title,
          questions: r.pyp.questions,
          timeLimitMin: r.pyp.durationMinutes ?? 180,
          examType: r.pyp.examType,
          subject: r.pyp.subject || "All",
          topic: "Previous Year",
          difficulty: "Moderate",
        },
      });
    } catch (e: unknown) {
      const msg = String((e as Error)?.message || e);
      if (msg.includes("PAYWALL") || msg.includes("402")) {
        setPaywall({
          message:
            "First 5 papers / mocks are free. Subscribe from ₹29 to unlock the rest.",
        });
      } else {
        setError(msg);
      }
    } finally {
      setOpening(null);
    }
  };

  return (
    <div className="min-h-full max-w-[640px] mx-auto pb-20">
      {/* Top bar */}
      <div
        className="flex items-center gap-2.5 px-4 pt-12 pb-3 border-b bg-white sticky top-0 z-10"
        style={{ borderColor: colors.border }}
      >
        <button
          onClick={() => nav(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: colors.secondary }}
        >
          <Icon name="arrow-left" size={18} color={colors.foreground} />
        </button>
        <div className="flex-1">
          <div className="text-[15px] font-semibold" style={{ color: colors.foreground }}>
            Super App
          </div>
          <div className="text-[11px]" style={{ color: colors.mutedForeground }}>
            NEET · JEE · Board · curated by admin
          </div>
        </div>
      </div>

      {/* Exam filter pills */}
      <div className="px-4 pt-4">
        <div className="flex gap-2 overflow-x-auto pb-3">
          {ALL_EXAMS.map((e) => {
            const active = filter === e;
            const c = e === "ALL" ? colors.primary : examColor(e);
            return (
              <button
                key={e}
                onClick={() => setFilter(e)}
                className="px-3.5 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap"
                style={{
                  background: active ? c : colors.secondary,
                  color: active ? "#fff" : colors.mutedForeground,
                  border: `1px solid ${active ? c : colors.border}`,
                }}
              >
                {e === "ALL" ? "All" : e}
              </button>
            );
          })}
        </div>

        {/* Free / paid banner */}
        {!subscribed && (
          <>
            <div
              className="rounded-2xl p-3.5 border mb-4 flex items-center gap-3"
              style={{ background: "#fffbeb", borderColor: "#fde68a" }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "#fef3c7" }}
              >
                <Icon name="zap" size={16} color="#d97706" />
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-semibold" style={{ color: "#92400e" }}>
                  Free preview: first 5 papers
                </div>
                <div className="text-[11px]" style={{ color: "#b45309" }}>
                  Unlock the full catalogue from ₹29.
                </div>
              </div>
            </div>

            {paywall && (
              <div
                className="rounded-2xl p-3.5 mb-4 border bg-[#f9fafb]"
                style={{ borderColor: colors.border }}
              >
                <div className="text-[13px] font-medium" style={{ color: colors.foreground }}>
                  {paywall.message}
                </div>
              </div>
            )}

            <div
              className="rounded-2xl p-4 mb-6 border bg-white shadow-sm"
              style={{ borderColor: colors.border }}
            >
              <div className="mb-4">
                <div className="text-[15px] font-semibold" style={{ color: colors.foreground }}>
                  Choose your plan
                </div>
                <div className="text-[12px]" style={{ color: colors.mutedForeground }}>
                  Unlock Super App from ₹29.
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {SUBSCRIPTION_PLANS.map((plan) => {
                  const active = plan.id === selectedPlanId;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlanId(plan.id)}
                      className="rounded-2xl border p-3 text-left"
                      style={{
                        background: active ? colors.primary : "#fff",
                        borderColor: active ? colors.primary : colors.border,
                        color: active ? "#fff" : colors.foreground,
                      }}
                    >
                      <div className="text-[13px] font-semibold">{plan.label}</div>
                      <div className="text-[20px] font-bold">₹{plan.amount}</div>
                      <div
                        className="text-[11px] mt-1"
                        style={{ color: active ? "rgba(255,255,255,0.85)" : colors.mutedForeground }}
                      >
                        {plan.subtitle}
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handlePay}
                disabled={paying}
                className="w-full py-3 rounded-2xl text-white font-bold disabled:opacity-60"
                style={{ background: "#d97706" }}
              >
                {paying ? "Opening Razorpay…" : `Pay ₹${selectedPlan.amount}`}
              </button>
            </div>
          </>
        )}

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner size={24} />
          </div>
        ) : error ? (
          <div
            className="rounded-2xl p-4 border text-[13px]"
            style={{ background: "#fef2f2", borderColor: "#fecaca", color: "#991b1b" }}
          >
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="rounded-2xl p-8 border-2 border-dashed text-center"
            style={{ borderColor: colors.border }}
          >
            <Icon name="inbox" size={28} color={colors.mutedForeground} />
            <div
              className="text-[14px] font-semibold mt-2"
              style={{ color: colors.foreground }}
            >
              No papers in this catalogue yet
            </div>
            <div
              className="text-[12px] mt-0.5"
              style={{ color: colors.mutedForeground }}
            >
              Admin is uploading. Check back soon!
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filtered.map((p) => {
              const globalIdx = sorted.findIndex((x) => x.id === p.id);
              const locked = globalIdx >= 5 && !subscribed;
              const ec = examColor(p.examType);
              const el = examLight(p.examType);
              return (
                        <div
                  key={p.id}
                  className="rounded-2xl p-3.5 border bg-white shadow-sm"
                  style={{ borderColor: colors.border }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 relative"
                      style={{ background: el }}
                    >
                      <Icon name="file-text" size={18} color={ec} />
                      {locked && (
                        <div
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: "#fef3c7" }}
                        >
                          <Icon name="lock" size={10} color="#d97706" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-[14px] font-semibold truncate"
                        style={{ color: colors.foreground }}
                      >
                        {p.title}
                      </div>
                      <div
                        className="flex items-center gap-2 mt-0.5 text-[11px]"
                        style={{ color: colors.mutedForeground }}
                      >
                        <span
                          className="px-1.5 py-0.5 rounded-md font-bold"
                          style={{ background: el, color: ec }}
                        >
                          {p.examType}
                        </span>
                        <span>· {p.year}</span>
                        {p.subject && <span>· {p.subject}</span>}
                        <span>· {p.questionCount}Q</span>
                        {p.durationMinutes && <span>· {p.durationMinutes} min</span>}
                      </div>
                    </div>
                    {opening === p.id ? (
                      <Spinner size={16} />
                    ) : (
                      <Icon
                        name={locked ? "lock" : "chevron-right"}
                        size={16}
                        color={locked ? "#d97706" : colors.mutedForeground}
                      />
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => handleOpen(p, globalIdx)}
                      disabled={opening === p.id}
                      className="flex-1 min-w-[120px] rounded-2xl border py-2 text-sm font-semibold"
                      style={{
                        background: colors.secondary,
                        borderColor: colors.border,
                        color: colors.foreground,
                      }}
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => handleAttempt(p, globalIdx)}
                      disabled={opening === p.id}
                      className="flex-1 min-w-[120px] rounded-2xl py-2 text-sm font-semibold"
                      style={{
                        background: locked ? "#fef3c7" : colors.primary,
                        color: locked ? "#92400e" : "#fff",
                        borderColor: locked ? colors.border : colors.primary,
                      }}
                    >
                      {locked ? "Locked" : "Attempt Exam"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
