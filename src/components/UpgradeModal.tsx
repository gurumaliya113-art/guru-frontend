import { useEffect, useMemo, useState } from "react";
import { Icon, Spinner } from "@/components/ui";
import { colors } from "@/lib/colors";
import { api } from "@/lib/api";
import { startSubscriptionCheckout, SubscriptionResult } from "@/lib/razorpay";

type Plan = {
  id: string;
  amount: number; // paise
  currency: string;
  label: string;
  description: string;
  subtitle?: string;
  validityDays: number | null;
  popular?: boolean;
};

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  /** Prefill details for the Razorpay checkout. */
  ctx?: { name?: string; email?: string; phone?: string };
  /** Called after a verified payment so the caller can refresh the profile. */
  onSuccess?: (sub: SubscriptionResult) => void | Promise<void>;
  mode?: "papers" | "dpp" | "teacher";
}

export default function UpgradeModal({ open, onClose, ctx, onSuccess, mode = "papers" }: UpgradeModalProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const isDpp = mode === "dpp";
  const isTeacher = mode === "teacher";

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoadingPlans(true);
    setError("");
    api
      .getPaymentConfig()
      .then((cfg) => {
        if (!active) return;
        const list = (cfg.plans || []) as Plan[];
        setPlans(list);
        const def = list.find((p) => p.popular) || list[0];
        setSelected((prev) => prev || def?.id || "");
      })
      .catch((e) => active && setError(String(e?.message || e)))
      .finally(() => active && setLoadingPlans(false));
    return () => {
      active = false;
    };
  }, [open]);

  const selectedPlan = useMemo(() => plans.find((p) => p.id === selected), [plans, selected]);

  if (!open) return null;

  const handleSubscribe = () => {
    if (!selectedPlan) return;
    setPaying(true);
    setError("");
    startSubscriptionCheckout(
      { name: ctx?.name || "Student", email: ctx?.email, phone: ctx?.phone },
      async (sub) => {
        await onSuccess?.(sub);
        setPaying(false);
        onClose();
      },
      (err) => {
        setPaying(false);
        setError(err?.message || "Payment could not be completed. Please try again.");
      },
      { planId: selectedPlan.id, planLabel: selectedPlan.label },
    );
  };

  const rupees = (paise: number) => `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center" onClick={() => !paying && onClose()}>
      <div
        className="w-full max-w-md rounded-[28px] border bg-white p-5 shadow-2xl max-h-[92vh] overflow-y-auto"
        style={{ borderColor: colors.border }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[17px] font-bold" style={{ color: colors.foreground }}>Choose your plan</div>
            <div className="text-[12px] mt-1" style={{ color: colors.mutedForeground }}>
              Unlock unlimited AI help, flashcards, papers & analytics.
            </div>
          </div>
          <button onClick={onClose} disabled={paying} className="rounded-full p-2" style={{ background: colors.secondary }}>
            <Icon name="x" size={16} color={colors.foreground} />
          </button>
        </div>

        {/* What you unlock */}
        <div className="mt-4 rounded-2xl border p-3 text-[12px]" style={{ borderColor: colors.border, background: "#eff6ff", color: colors.foreground }}>
          <div className="font-semibold mb-1">Premium unlocks</div>
          {isTeacher ? (
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Unlimited question paper generation</li>
              <li>Assign papers & tests to all your classes</li>
              <li>Full student performance analytics</li>
            </ul>
          ) : (
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Unlimited AI doubt solving{isDpp ? " & DPP views" : ""}</li>
              <li>All previous-year papers & mock tests</li>
              <li>Full flashcards revision & advanced analytics</li>
            </ul>
          )}
        </div>

        {/* Plans */}
        <div className="mt-4 space-y-2">
          {loadingPlans && (
            <div className="flex items-center justify-center gap-2 py-6 text-[13px]" style={{ color: colors.mutedForeground }}>
              <Spinner size={16} /> Loading plans…
            </div>
          )}

          {!loadingPlans && plans.length === 0 && (
            <div className="rounded-2xl border p-4 text-[13px]" style={{ borderColor: colors.border, color: colors.mutedForeground }}>
              Plans are not available right now. Please try again later.
            </div>
          )}

          {!loadingPlans &&
            plans.map((p) => {
              const active = p.id === selected;
              const perDay = p.validityDays ? Math.round(p.amount / 100 / p.validityDays) : null;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                  className="w-full text-left rounded-2xl border p-3.5 transition flex items-center justify-between gap-3"
                  style={{
                    borderColor: active ? colors.primary : colors.border,
                    background: active ? "#eff6ff" : "#fff",
                    boxShadow: active ? `0 0 0 1px ${colors.primary}` : "none",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 rounded-full border flex items-center justify-center shrink-0"
                      style={{ borderColor: active ? colors.primary : colors.border, background: active ? colors.primary : "#fff" }}
                    >
                      {active && <Icon name="check" size={12} color="#fff" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-bold" style={{ color: colors.foreground }}>{p.label}</span>
                        {p.popular && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: colors.primary, color: "#fff" }}>
                            POPULAR
                          </span>
                        )}
                      </div>
                      <div className="text-[11px]" style={{ color: colors.mutedForeground }}>{p.subtitle || p.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[18px] font-extrabold" style={{ color: colors.primary }}>{rupees(p.amount)}</div>
                    {perDay != null && perDay > 0 && (
                      <div className="text-[10px]" style={{ color: colors.mutedForeground }}>≈ ₹{perDay}/day</div>
                    )}
                  </div>
                </button>
              );
            })}
        </div>

        {error && (
          <div className="mt-3 text-[12px] px-3 py-2 rounded-lg" style={{ background: "#fee2e2", color: "#991b1b" }}>
            {error}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            onClick={onClose}
            disabled={paying}
            className="flex-1 rounded-2xl border py-3 text-[13px] font-semibold disabled:opacity-60"
            style={{ borderColor: colors.border, background: colors.secondary, color: colors.foreground }}
          >
            Maybe later
          </button>
          <button
            onClick={handleSubscribe}
            disabled={paying || loadingPlans || !selectedPlan}
            className="flex-[1.3] rounded-2xl py-3 text-[13px] font-bold text-white disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: colors.primary }}
          >
            {paying ? (
              <><Spinner size={16} /> Processing…</>
            ) : (
              <>Subscribe {selectedPlan ? `· ${rupees(selectedPlan.amount)}` : ""}</>
            )}
          </button>
        </div>

        <div className="mt-3 text-center text-[10px]" style={{ color: colors.mutedForeground }}>
          One-time payment · no auto-debit · secured by Razorpay
        </div>
      </div>
    </div>
  );
}
