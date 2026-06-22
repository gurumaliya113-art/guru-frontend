import { useEffect, useState } from "react";
import { Icon } from "@/components/ui";
import { adminApi, AdminRevenueResponse } from "@/lib/api";
import { colors } from "@/lib/colors";

function fmtMoney(n: number, currency = "INR") {
  const symbol = currency === "INR" ? "₹" : "";
  return `${symbol}${(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

function BigStat({ icon, label, value, tint }: { icon: string; label: string; value: string; tint: string }) {
  return (
    <div className="rounded-2xl p-5 border bg-white" style={{ borderColor: colors.border }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: tint + "22" }}>
          <Icon name={icon} size={16} color={tint} />
        </div>
        <div className="text-[13px]" style={{ color: colors.mutedForeground }}>{label}</div>
      </div>
      <div className="text-3xl font-bold" style={{ color: colors.foreground }}>{value}</div>
    </div>
  );
}

export default function AdminRevenue() {
  const [data, setData] = useState<AdminRevenueResponse | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    adminApi.revenue().then(setData).catch((e) => setErr(String(e?.message || e)));
  }, []);

  if (err) return <div className="p-8" style={{ color: colors.destructive }}>Error: {err}</div>;
  if (!data) return <div className="p-8" style={{ color: colors.mutedForeground }}>Loading revenue…</div>;

  const planEntries = Object.entries(data.byPlan).sort(([, a], [, b]) => b.amount - a.amount);
  const monthEntries = Object.entries(data.byMonth);
  const maxMonth = Math.max(1, ...monthEntries.map(([, v]) => v));

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-6">
        <div className="text-[26px] font-bold" style={{ color: colors.foreground }}>Revenue</div>
        <div className="text-sm" style={{ color: colors.mutedForeground }}>
          Subscription income from verified payments.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <BigStat icon="indian-rupee" label="Total revenue" value={fmtMoney(data.totalRevenue, data.currency)} tint={colors.neet} />
        <BigStat icon="calendar" label="This month" value={fmtMoney(data.thisMonthRevenue, data.currency)} tint={colors.primary} />
        <BigStat icon="credit-card" label="Transactions" value={String(data.totalTransactions)} tint={colors.board} />
        <BigStat icon="trending-up" label="Avg. order" value={fmtMoney(data.averageOrderValue, data.currency)} tint={colors.jee} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="rounded-2xl p-5 border bg-white" style={{ borderColor: colors.border }}>
          <div className="text-[15px] font-semibold mb-4" style={{ color: colors.foreground }}>Revenue by plan</div>
          {planEntries.length === 0 && <div className="text-sm" style={{ color: colors.mutedForeground }}>No data yet</div>}
          {planEntries.map(([plan, v]) => {
            const max = Math.max(1, ...planEntries.map(([, x]) => x.amount));
            return (
              <div key={plan} className="mb-3 last:mb-0">
                <div className="flex justify-between text-[13px] mb-1">
                  <span style={{ color: colors.foreground }}>{plan} <span style={{ color: colors.mutedForeground }}>· {v.count}</span></span>
                  <span className="font-semibold" style={{ color: colors.primary }}>{fmtMoney(v.amount, data.currency)}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: colors.muted }}>
                  <div style={{ width: `${(v.amount / max) * 100}%`, height: "100%", background: colors.primary }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl p-5 border bg-white" style={{ borderColor: colors.border }}>
          <div className="text-[15px] font-semibold mb-4" style={{ color: colors.foreground }}>Monthly trend</div>
          {monthEntries.length === 0 && <div className="text-sm" style={{ color: colors.mutedForeground }}>No data yet</div>}
          <div className="flex items-end gap-2 h-40">
            {monthEntries.map(([month, amount]) => (
              <div key={month} className="flex-1 flex flex-col items-center justify-end gap-1">
                <div className="text-[10px]" style={{ color: colors.mutedForeground }}>{fmtMoney(amount, data.currency)}</div>
                <div
                  className="w-full rounded-t-md"
                  style={{ height: `${(amount / maxMonth) * 100}%`, background: colors.neet, minHeight: 4 }}
                />
                <div className="text-[10px]" style={{ color: colors.mutedForeground }}>{monthLabel(month)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: colors.border }}>
        <div className="px-5 py-4 border-b text-[15px] font-semibold" style={{ borderColor: colors.border, color: colors.foreground }}>
          Recent transactions
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr style={{ background: colors.muted, color: colors.mutedForeground }}>
                <th className="px-4 py-3 font-semibold">Buyer</th>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold text-right">Amount</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Payment ID</th>
              </tr>
            </thead>
            <tbody>
              {data.recent.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center" style={{ color: colors.mutedForeground }}>
                    No transactions yet.
                  </td>
                </tr>
              )}
              {data.recent.map((t) => (
                <tr key={t.id} className="border-t" style={{ borderColor: colors.border }}>
                  <td className="px-4 py-3">
                    <div className="font-semibold" style={{ color: colors.foreground }}>{t.name || "—"}</div>
                    <div className="truncate max-w-[220px]" style={{ color: colors.mutedForeground }}>{t.email || "—"}</div>
                  </td>
                  <td className="px-4 py-3" style={{ color: colors.foreground }}>{t.plan || "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold" style={{ color: colors.neet }}>
                    {fmtMoney(t.amount, t.currency)}
                  </td>
                  <td className="px-4 py-3" style={{ color: colors.foreground }}>{fmtDate(t.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-mono" style={{ color: colors.mutedForeground }}>{t.paymentId || "—"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
