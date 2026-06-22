import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui";
import { adminApi, AdminSubscriptionRow, AdminSubscriptionsResponse } from "@/lib/api";
import { colors } from "@/lib/colors";

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-2xl p-5 border bg-white" style={{ borderColor: colors.border }}>
      <div className="text-[13px]" style={{ color: colors.mutedForeground }}>{label}</div>
      <div className="text-3xl font-bold mt-1" style={{ color }}>{value}</div>
    </div>
  );
}

function StatusPill({ row }: { row: AdminSubscriptionRow }) {
  const label = row.active ? "Active" : row.expired ? "Expired" : "Inactive";
  const bg = row.active ? colors.neetLight : row.expired ? "#fee2e2" : colors.muted;
  const fg = row.active ? colors.neetForeground : row.expired ? "#991b1b" : colors.mutedForeground;
  return (
    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ background: bg, color: fg }}>
      {label}
    </span>
  );
}

export default function AdminSubscriptions() {
  const [data, setData] = useState<AdminSubscriptionsResponse | null>(null);
  const [query, setQuery] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = (q: string) => {
    setLoading(true);
    adminApi
      .subscriptions(q)
      .then((d) => {
        setData(d);
        setErr("");
      })
      .catch((e) => setErr(String(e?.message || e)))
      .finally(() => setLoading(false));
  };

  // Initial load.
  useEffect(() => {
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced server-side search whenever the query changes.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const rows = data?.subscriptions ?? [];
  const summary = data?.summary;

  const copyEmail = (email: string | null) => {
    if (email) navigator.clipboard?.writeText(email).catch(() => {});
  };

  const emptyMessage = useMemo(() => {
    if (loading) return "Loading…";
    if (query.trim()) return `No subscriber matches “${query.trim()}”.`;
    return "No subscriptions yet. Purchases will appear here automatically.";
  }, [loading, query]);

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-6">
        <div className="text-[26px] font-bold" style={{ color: colors.foreground }}>Subscriptions</div>
        <div className="text-sm" style={{ color: colors.mutedForeground }}>
          Everyone who purchased a plan. Search by email, name, user ID, plan, or payment ID.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total subscribers" value={summary?.total ?? 0} color={colors.primary} />
        <StatCard label="Active" value={summary?.active ?? 0} color={colors.neet} />
        <StatCard label="Expired" value={summary?.expired ?? 0} color={colors.destructive} />
      </div>

      <div className="relative mb-4">
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <Icon name="search" size={18} color={colors.mutedForeground} />
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Paste a buyer's email or ID…"
          className="w-full rounded-2xl pl-11 pr-4 py-3 border outline-none text-[15px]"
          style={{ borderColor: colors.border, background: "#fff", color: colors.foreground }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2"
            style={{ color: colors.mutedForeground }}
          >
            <Icon name="x" size={16} color={colors.mutedForeground} />
          </button>
        )}
      </div>

      {err && (
        <div className="mb-4 text-sm px-4 py-3 rounded-xl" style={{ background: "#fee2e2", color: "#991b1b" }}>
          {err}
        </div>
      )}

      <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: colors.border }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr style={{ background: colors.muted, color: colors.mutedForeground }}>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Valid until</th>
                <th className="px-4 py-3 font-semibold">Purchased</th>
                <th className="px-4 py-3 font-semibold text-right">Total paid</th>
                <th className="px-4 py-3 font-semibold">Payment ID</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center" style={{ color: colors.mutedForeground }}>
                    {emptyMessage}
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <tr key={row.userId} className="border-t" style={{ borderColor: colors.border }}>
                  <td className="px-4 py-3">
                    <div className="font-semibold" style={{ color: colors.foreground }}>
                      {row.name || "—"}
                    </div>
                    <button
                      onClick={() => copyEmail(row.email)}
                      title="Copy email"
                      className="flex items-center gap-1.5 mt-0.5"
                      style={{ color: colors.mutedForeground }}
                    >
                      <span className="truncate max-w-[220px]">{row.email || row.userId}</span>
                      {row.email && <Icon name="copy" size={12} color={colors.mutedForeground} />}
                    </button>
                    <div className="text-[11px] mt-0.5 capitalize" style={{ color: colors.mutedForeground }}>
                      {row.role}
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: colors.foreground }}>{row.plan || "—"}</td>
                  <td className="px-4 py-3"><StatusPill row={row} /></td>
                  <td className="px-4 py-3" style={{ color: colors.foreground }}>{fmtDate(row.validUntil)}</td>
                  <td className="px-4 py-3" style={{ color: colors.foreground }}>{fmtDate(row.purchasedAt)}</td>
                  <td className="px-4 py-3 text-right font-semibold" style={{ color: colors.foreground }}>
                    ₹{row.totalPaid.toLocaleString("en-IN")}
                    {row.paymentCount > 1 && (
                      <div className="text-[11px] font-normal" style={{ color: colors.mutedForeground }}>
                        {row.paymentCount} payments
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-mono" style={{ color: colors.mutedForeground }}>
                      {row.razorpayPaymentId || "—"}
                    </span>
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
