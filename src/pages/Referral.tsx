import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";
import { colors } from "@/lib/colors";

type Me = Awaited<ReturnType<typeof api.getReferralMe>>;
type History = Awaited<ReturnType<typeof api.getReferralHistory>>;

const SIGNUP_BASE = "https://gurtron.in/signup";

function fmtINR(n: number) {
  return "₹" + (Number(n) || 0).toLocaleString("en-IN");
}
function fmtDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" });
  } catch {
    return "—";
  }
}

function StatTile({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="rounded-2xl border p-4 flex flex-col gap-1 shadow-sm" style={{ background: colors.card, borderColor: colors.border }}>
      <div className="text-xl font-bold" style={{ color: color || colors.primary }}>{value}</div>
      <div className="text-[11px]" style={{ color: colors.mutedForeground }}>{label}</div>
    </div>
  );
}

function statusPill(status: string) {
  const map: Record<string, { bg: string; fg: string }> = {
    pending: { bg: "#fef3c7", fg: "#92400e" },
    approved: { bg: "#dbeafe", fg: "#1e40af" },
    paid: { bg: "#dcfce7", fg: "#14532d" },
    cancelled: { bg: "#fee2e2", fg: "#991b1b" },
    joined: { bg: "#e0e7ff", fg: "#3730a3" },
  };
  const c = map[status] || { bg: colors.muted, fg: colors.mutedForeground };
  return (
    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md capitalize" style={{ background: c.bg, color: c.fg }}>
      {status}
    </span>
  );
}

export default function Referral() {
  const { profile } = useApp();
  const isTeacher = profile.role === "teacher";
  const [me, setMe] = useState<Me | null>(null);
  const [history, setHistory] = useState<History | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [m, h] = await Promise.all([api.getReferralMe(), api.getReferralHistory()]);
        if (cancelled) return;
        setMe(m);
        setHistory(h);
      } catch (e) {
        console.warn("[Referral] load failed", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const code = me?.referralCode || "";
  const link = me?.shareLink || `${SIGNUP_BASE}?ref=${code}`;

  const whatsappMsg = `🚀 Join Gurtron and learn smarter.\nUse my referral code:\n${code}\nRegister here:\n${link}`;
  const emailSubject = "Join Gurtron";
  const emailBody = `Join Gurtron using my referral code and start learning today.\nReferral Code:\n${code}\nLink:\n${link}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* ignore */ }
  };

  const shareNative = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: "Join Gurtron", text: whatsappMsg, url: link }); } catch { /* ignore */ }
    } else {
      copyLink();
    }
  };

  // Referral growth: count referrals per day for a simple bar chart.
  const growth = useMemo(() => {
    const refs = history?.referrals || [];
    const byDay: Record<string, number> = {};
    for (const r of refs) {
      const d = fmtDate(r.joinDate);
      byDay[d] = (byDay[d] || 0) + 1;
    }
    const entries = Object.entries(byDay).slice(-8);
    const max = Math.max(1, ...entries.map(([, v]) => v));
    return { entries, max };
  }, [history]);

  if (loading) {
    return (
      <div className="p-5 text-sm" style={{ color: colors.mutedForeground }}>Loading your referral dashboard…</div>
    );
  }

  return (
    <div className="px-4 py-5 max-w-2xl mx-auto" style={{ color: colors.foreground }}>
      <div className="flex items-center gap-2 mb-4">
        <Icon name="award" size={22} color={colors.primary} />
        <h1 className="text-xl font-bold">{isTeacher ? "Referral & Earnings" : "Invite & Earn"}</h1>
      </div>

      {/* Referral code + share link */}
      <div className="rounded-2xl border p-4 mb-4 shadow-sm" style={{ background: colors.card, borderColor: colors.border }}>
        <div className="text-[11px] mb-1" style={{ color: colors.mutedForeground }}>Your referral code</div>
        <div className="flex items-center justify-between gap-2">
          <div className="text-2xl font-extrabold tracking-wide" style={{ color: colors.primary }}>{code}</div>
          <button onClick={copyLink} className="flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-xl" style={{ background: colors.primary, color: colors.primaryForeground }}>
            <Icon name="copy" size={14} color={colors.primaryForeground} />
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
        <div className="mt-2 text-[12px] break-all" style={{ color: colors.mutedForeground }}>{link}</div>

        <div className="grid grid-cols-4 gap-2 mt-4">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(whatsappMsg)}`}
            target="_blank" rel="noreferrer"
            className="flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-semibold"
            style={{ background: "#dcfce7", color: "#166534" }}
          >
            <Icon name="send" size={16} color="#166534" /> WhatsApp
          </a>
          <a
            href={`mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
            className="flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-semibold"
            style={{ background: "#dbeafe", color: "#1e40af" }}
          >
            <Icon name="mail" size={16} color="#1e40af" /> Email
          </a>
          <button
            onClick={copyLink}
            className="flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-semibold"
            style={{ background: colors.muted, color: colors.foreground }}
          >
            <Icon name="copy" size={16} color={colors.foreground} /> Copy
          </button>
          <button
            onClick={shareNative}
            className="flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-semibold"
            style={{ background: "#ede9fe", color: "#5b21b6" }}
          >
            <Icon name="share" size={16} color="#5b21b6" /> Share
          </button>
        </div>
      </div>

      {/* Stats */}
      {isTeacher ? (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <StatTile label="Teachers Referred" value={me?.totals.teachersReferred ?? 0} />
          <StatTile label="Students Referred" value={me?.totals.studentsReferred ?? 0} />
          <StatTile label="Lifetime Earnings" value={fmtINR(me?.totals.lifetime ?? 0)} color={colors.success} />
          <StatTile label="Pending" value={fmtINR(me?.totals.pending ?? 0)} color={colors.warning} />
          <StatTile label="Approved" value={fmtINR(me?.totals.approved ?? 0)} color={colors.info} />
          <StatTile label="Paid" value={fmtINR(me?.totals.paid ?? 0)} color={colors.success} />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <StatTile label="Total Referrals" value={me?.totals.totalReferrals ?? 0} />
          <StatTile label="Coins Earned" value={me?.totals.coins ?? 0} color={colors.warning} />
          <StatTile label="Premium Days" value={me?.totals.premiumDays ?? 0} color={colors.board} />
        </div>
      )}

      {/* Referral growth chart */}
      {growth.entries.length > 0 && (
        <div className="rounded-2xl border p-4 mb-4 shadow-sm" style={{ background: colors.card, borderColor: colors.border }}>
          <div className="text-sm font-semibold mb-3">Referral Growth</div>
          <div className="flex items-end gap-2 h-28">
            {growth.entries.map(([day, val]) => (
              <div key={day} className="flex-1 flex flex-col items-center justify-end gap-1">
                <div className="w-full rounded-t-md" style={{ height: `${(val / growth.max) * 100}%`, background: colors.primary, minHeight: 4 }} />
                <div className="text-[9px]" style={{ color: colors.mutedForeground }}>{day}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Referral history */}
      <div className="rounded-2xl border p-4 mb-4 shadow-sm overflow-x-auto" style={{ background: colors.card, borderColor: colors.border }}>
        <div className="text-sm font-semibold mb-3">Referral History</div>
        {(history?.referrals?.length ?? 0) === 0 ? (
          <div className="text-[13px]" style={{ color: colors.mutedForeground }}>No referrals yet. Share your code to get started!</div>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ color: colors.mutedForeground }} className="text-left">
                <th className="py-1 font-medium">Name</th>
                <th className="py-1 font-medium">Role</th>
                <th className="py-1 font-medium">Join Date</th>
                <th className="py-1 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {history!.referrals.map((r) => (
                <tr key={r.id} className="border-t" style={{ borderColor: colors.border }}>
                  <td className="py-2">{r.name}</td>
                  <td className="py-2 capitalize">{r.role}</td>
                  <td className="py-2">{fmtDate(r.joinDate)}</td>
                  <td className="py-2">{statusPill(r.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Commission history (teachers) */}
      {isTeacher && (
        <div className="rounded-2xl border p-4 mb-4 shadow-sm overflow-x-auto" style={{ background: colors.card, borderColor: colors.border }}>
          <div className="text-sm font-semibold mb-3">Commission History</div>
          {(history?.commissions?.length ?? 0) === 0 ? (
            <div className="text-[13px]" style={{ color: colors.mutedForeground }}>No commissions yet.</div>
          ) : (
            <table className="w-full text-[13px]">
              <thead>
                <tr style={{ color: colors.mutedForeground }} className="text-left">
                  <th className="py-1 font-medium">Order</th>
                  <th className="py-1 font-medium">Amount</th>
                  <th className="py-1 font-medium">Commission</th>
                  <th className="py-1 font-medium">Status</th>
                  <th className="py-1 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {history!.commissions.map((c) => (
                  <tr key={c.id} className="border-t" style={{ borderColor: colors.border }}>
                    <td className="py-2 text-[11px]">{c.orderId ? c.orderId.slice(-8) : "—"}</td>
                    <td className="py-2">{fmtINR(c.purchaseAmount)}</td>
                    <td className="py-2 font-semibold">{fmtINR(c.commissionAmount)}</td>
                    <td className="py-2">{statusPill(c.status)}</td>
                    <td className="py-2">{fmtDate(c.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Reward history (students) */}
      {!isTeacher && (history?.rewards?.length ?? 0) > 0 && (
        <div className="rounded-2xl border p-4 mb-4 shadow-sm" style={{ background: colors.card, borderColor: colors.border }}>
          <div className="text-sm font-semibold mb-3">Reward History</div>
          <div className="flex flex-col gap-2">
            {history!.rewards.map((rw) => (
              <div key={rw.id} className="flex items-center justify-between text-[13px] border-t pt-2" style={{ borderColor: colors.border }}>
                <span style={{ color: colors.mutedForeground }}>{rw.reason} · {fmtDate(rw.createdAt)}</span>
                <span className="font-semibold" style={{ color: colors.warning }}>
                  {rw.coins ? `+${rw.coins} coins` : ""}{rw.premiumDays ? ` +${rw.premiumDays} premium days` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl p-4 text-[12px]" style={{ background: colors.secondary, color: colors.secondaryForeground }}>
        {isTeacher
          ? "Earn 10% commission when someone you refer purchases any paid plan or course. Commission is approved after the refund window and paid out by admin."
          : "Earn 100 coins for every friend who joins with your code. Hit 10 referrals to unlock 1 month of premium free!"}
      </div>
    </div>
  );
}
