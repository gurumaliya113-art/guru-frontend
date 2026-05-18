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
  const [paying, setPaying] = useState(false);

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
        message: "First 5 papers / mocks are free. Subscribe for ₹49/year to unlock the rest.",
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
            "First 5 papers / mocks are free. Subscribe for ₹49/year to unlock the rest.",
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
            Previous Year Papers &amp; Mocks
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
                Unlock the full catalogue for just ₹49 / year.
              </div>
            </div>
            <button
              onClick={() =>
                setPaywall({
                  message:
                    "Unlock unlimited previous year papers & mocks for just ₹49 / year.",
                })
              }
              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white"
              style={{ background: "#d97706" }}
            >
              Upgrade
            </button>
          </div>
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
                <button
                  key={p.id}
                  onClick={() => handleOpen(p, globalIdx)}
                  disabled={opening === p.id}
                  className="text-left rounded-2xl p-3.5 border bg-white shadow-sm active:opacity-90 disabled:opacity-60"
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
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Paywall modal */}
      {paywall && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => setPaywall(null)}
        >
          <div
            className="w-full max-w-[420px] rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: "#fef3c7" }}
              >
                <Icon name="zap" size={20} color="#d97706" />
              </div>
              <button
                onClick={() => setPaywall(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: colors.secondary }}
              >
                <Icon name="x" size={16} color={colors.foreground} />
              </button>
            </div>
            <div className="text-[18px] font-bold mb-1" style={{ color: colors.foreground }}>
              Unlock full potential
            </div>
            <div className="text-[13px] mb-4" style={{ color: colors.mutedForeground }}>
              {paywall.message}
            </div>
            <ul className="text-[12px] mb-4 flex flex-col gap-1.5" style={{ color: colors.foreground }}>
              <li className="flex items-center gap-2">
                <Icon name="check-circle" size={14} color="#16a34a" />
                Unlimited previous year papers
              </li>
              <li className="flex items-center gap-2">
                <Icon name="check-circle" size={14} color="#16a34a" />
                All mock tests &amp; analytics
              </li>
              <li className="flex items-center gap-2">
                <Icon name="check-circle" size={14} color="#16a34a" />
                Detailed progress reports
              </li>
            </ul>
            <button
              onClick={handlePay}
              disabled={paying}
              className="w-full py-3 rounded-2xl text-white font-bold disabled:opacity-60"
              style={{ background: "#d97706" }}
            >
              {paying ? "Opening Razorpay…" : "Pay ₹49 / year"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
