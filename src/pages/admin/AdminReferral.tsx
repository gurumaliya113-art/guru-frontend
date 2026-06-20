import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/ui";
import { adminApi } from "@/lib/api";
import { colors } from "@/lib/colors";

type Summary = Awaited<ReturnType<typeof adminApi.referralSummary>>;
type RefRow = Awaited<ReturnType<typeof adminApi.referralList>>["referrals"][number];
type ComRow = Awaited<ReturnType<typeof adminApi.referralCommissions>>["commissions"][number];
type PayRow = Awaited<ReturnType<typeof adminApi.referralPayouts>>["payouts"][number];

function fmtINR(n: number) {
  return "₹" + (Number(n) || 0).toLocaleString("en-IN");
}
function fmtDate(iso?: string) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }); }
  catch { return "—"; }
}

function Card({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="rounded-2xl border p-4" style={{ background: colors.card, borderColor: colors.border }}>
      <div className="text-2xl font-bold" style={{ color: color || colors.primary }}>{value}</div>
      <div className="text-[12px] mt-1" style={{ color: colors.mutedForeground }}>{label}</div>
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
  return <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md capitalize" style={{ background: c.bg, color: c.fg }}>{status}</span>;
}

type Tab = "referrals" | "commissions" | "payouts";

export default function AdminReferral() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [referrals, setReferrals] = useState<RefRow[]>([]);
  const [commissions, setCommissions] = useState<ComRow[]>([]);
  const [payouts, setPayouts] = useState<PayRow[]>([]);
  const [tab, setTab] = useState<Tab>("referrals");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, r, c, p] = await Promise.all([
        adminApi.referralSummary(),
        adminApi.referralList(),
        adminApi.referralCommissions(),
        adminApi.referralPayouts(),
      ]);
      setSummary(s);
      setReferrals(r.referrals || []);
      setCommissions(c.commissions || []);
      setPayouts(p.payouts || []);
    } catch (e) {
      console.warn("[AdminReferral] load failed", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id: string, status: string) => {
    setBusy(id);
    try {
      await adminApi.referralSetCommissionStatus(id, status);
      await load();
    } catch (e) {
      alert("Failed: " + (e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const payout = async (userId: string, name: string) => {
    const note = window.prompt(`Pay out approved commissions for ${name}? Add a transaction note (optional):`, "");
    if (note === null) return;
    setBusy(userId);
    try {
      const r = await adminApi.referralPayout(userId, note || undefined);
      alert(`Paid ${fmtINR(r.amount)} across ${r.paidCount} commission(s).`);
      await load();
    } catch (e) {
      alert("Payout failed: " + (e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-sm" style={{ color: colors.mutedForeground }}>Loading referral data…</div>;
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "referrals", label: "Referral List" },
    { id: "commissions", label: "Commissions" },
    { id: "payouts", label: "Payouts" },
  ];

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center gap-2 mb-5">
        <Icon name="award" size={22} color={colors.primary} />
        <h1 className="text-xl font-bold" style={{ color: colors.foreground }}>Referral Management</h1>
      </div>

      {/* Dashboard cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card label="Total Referral Users" value={summary?.totalReferralUsers ?? 0} />
        <Card label="Teachers Referred" value={summary?.teachersReferred ?? 0} />
        <Card label="Students Referred" value={summary?.studentsReferred ?? 0} />
        <Card label="Total Commission" value={fmtINR(summary?.totalCommissionAmount ?? 0)} color={colors.success} />
        <Card label="Pending Commission" value={fmtINR(summary?.pendingCommission ?? 0)} color={colors.warning} />
        <Card label="Approved Commission" value={fmtINR(summary?.approvedCommission ?? 0)} color={colors.info} />
        <Card label="Paid Commission" value={fmtINR(summary?.paidCommission ?? 0)} color={colors.success} />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2 rounded-xl text-[13px] font-semibold"
            style={{ background: tab === t.id ? colors.primary : colors.secondary, color: tab === t.id ? "#fff" : colors.foreground }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border overflow-x-auto" style={{ background: colors.card, borderColor: colors.border }}>
        {tab === "referrals" && (
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ color: colors.mutedForeground, background: colors.secondary }} className="text-left">
                <th className="px-4 py-2.5 font-medium">Referrer</th>
                <th className="px-4 py-2.5 font-medium">Code</th>
                <th className="px-4 py-2.5 font-medium">Referred User</th>
                <th className="px-4 py-2.5 font-medium">Role</th>
                <th className="px-4 py-2.5 font-medium">Signup Date</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {referrals.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center" style={{ color: colors.mutedForeground }}>No referrals yet.</td></tr>
              ) : referrals.map((r) => (
                <tr key={r.id} className="border-t" style={{ borderColor: colors.border }}>
                  <td className="px-4 py-2.5">{r.referrerName}</td>
                  <td className="px-4 py-2.5 font-semibold" style={{ color: colors.primary }}>{r.referralCode}</td>
                  <td className="px-4 py-2.5">{r.referredUser}</td>
                  <td className="px-4 py-2.5 capitalize">{r.role}</td>
                  <td className="px-4 py-2.5">{fmtDate(r.signupDate)}</td>
                  <td className="px-4 py-2.5">{statusPill(r.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "commissions" && (
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ color: colors.mutedForeground, background: colors.secondary }} className="text-left">
                <th className="px-4 py-2.5 font-medium">Referrer</th>
                <th className="px-4 py-2.5 font-medium">Buyer</th>
                <th className="px-4 py-2.5 font-medium">Order ID</th>
                <th className="px-4 py-2.5 font-medium">Amount</th>
                <th className="px-4 py-2.5 font-medium">%</th>
                <th className="px-4 py-2.5 font-medium">Commission</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Date</th>
                <th className="px-4 py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {commissions.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-6 text-center" style={{ color: colors.mutedForeground }}>No commissions yet.</td></tr>
              ) : commissions.map((c) => (
                <tr key={c.id} className="border-t" style={{ borderColor: colors.border }}>
                  <td className="px-4 py-2.5">{c.referrer}</td>
                  <td className="px-4 py-2.5">{c.buyer}</td>
                  <td className="px-4 py-2.5 text-[11px]">{c.orderId ? c.orderId.slice(-10) : "—"}</td>
                  <td className="px-4 py-2.5">{fmtINR(c.purchaseAmount)}</td>
                  <td className="px-4 py-2.5">{c.commissionPercent}%</td>
                  <td className="px-4 py-2.5 font-semibold">{fmtINR(c.commissionAmount)}</td>
                  <td className="px-4 py-2.5">{statusPill(c.status)}</td>
                  <td className="px-4 py-2.5">{fmtDate(c.date)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1.5">
                      {c.status === "pending" && (
                        <button disabled={busy === c.id} onClick={() => setStatus(c.id, "approved")} className="px-2 py-1 rounded-md text-[11px] font-semibold" style={{ background: "#dbeafe", color: "#1e40af" }}>Approve</button>
                      )}
                      {c.status === "approved" && (
                        <button disabled={busy === c.id} onClick={() => setStatus(c.id, "paid")} className="px-2 py-1 rounded-md text-[11px] font-semibold" style={{ background: "#dcfce7", color: "#14532d" }}>Mark Paid</button>
                      )}
                      {c.status !== "cancelled" && c.status !== "paid" && (
                        <button disabled={busy === c.id} onClick={() => setStatus(c.id, "cancelled")} className="px-2 py-1 rounded-md text-[11px] font-semibold" style={{ background: "#fee2e2", color: "#991b1b" }}>Cancel</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "payouts" && (
          <div>
            {/* Approved-balance payout shortcut grouped by referrer */}
            <PayoutPanel commissions={commissions} onPayout={payout} busy={busy} />
            <table className="w-full text-[13px]">
              <thead>
                <tr style={{ color: colors.mutedForeground, background: colors.secondary }} className="text-left">
                  <th className="px-4 py-2.5 font-medium">Teacher</th>
                  <th className="px-4 py-2.5 font-medium">Amount</th>
                  <th className="px-4 py-2.5 font-medium">Transaction Note</th>
                  <th className="px-4 py-2.5 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {payouts.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-6 text-center" style={{ color: colors.mutedForeground }}>No payouts recorded yet.</td></tr>
                ) : payouts.map((p) => (
                  <tr key={p.id} className="border-t" style={{ borderColor: colors.border }}>
                    <td className="px-4 py-2.5">{p.userName}</td>
                    <td className="px-4 py-2.5 font-semibold">{fmtINR(p.amount)}</td>
                    <td className="px-4 py-2.5">{p.transactionNote || "—"}</td>
                    <td className="px-4 py-2.5">{fmtDate(p.paidAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Groups approved commissions by referrer so the admin can pay each teacher's
// approved balance in one click.
function PayoutPanel({
  commissions,
  onPayout,
  busy,
}: {
  commissions: ComRow[];
  onPayout: (userId: string, name: string) => void;
  busy: string | null;
}) {
  const approvedByUser: Record<string, { name: string; total: number; count: number }> = {};
  for (const c of commissions) {
    if (c.status !== "approved") continue;
    const k = c.referrerId;
    if (!approvedByUser[k]) approvedByUser[k] = { name: c.referrer, total: 0, count: 0 };
    approvedByUser[k].total += Number(c.commissionAmount) || 0;
    approvedByUser[k].count += 1;
  }
  const rows = Object.entries(approvedByUser);
  if (rows.length === 0) {
    return (
      <div className="px-4 py-3 text-[12px] border-b" style={{ color: colors.mutedForeground, borderColor: colors.border }}>
        No approved commissions awaiting payout.
      </div>
    );
  }
  return (
    <div className="px-4 py-3 border-b flex flex-col gap-2" style={{ borderColor: colors.border }}>
      <div className="text-[12px] font-semibold" style={{ color: colors.foreground }}>Approved balances awaiting payout</div>
      {rows.map(([userId, info]) => (
        <div key={userId} className="flex items-center gap-3 text-[13px]">
          <span className="flex-1">{info.name} <span style={{ color: colors.mutedForeground }}>({info.count} approved)</span></span>
          <span className="font-semibold">{fmtINR(info.total)}</span>
          <button
            disabled={busy === userId}
            onClick={() => onPayout(userId, info.name)}
            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white"
            style={{ background: colors.success }}
          >
            Mark Paid
          </button>
        </div>
      ))}
    </div>
  );
}
