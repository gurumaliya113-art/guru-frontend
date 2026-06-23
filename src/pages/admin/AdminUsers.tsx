import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/ui";
import { adminApi } from "@/lib/api";
import { colors } from "@/lib/colors";

type User = Awaited<ReturnType<typeof adminApi.listUsers>>["users"][number];
type RangeKey = "all" | "this_month" | "last_month" | "last7";

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function inRange(iso: string | null, key: RangeKey): boolean {
  if (key === "all") return true;
  if (!iso) return false;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  if (key === "last7") {
    const sevenAgo = new Date(now.getTime() - 7 * 86400000);
    return d >= sevenAgo;
  }
  if (key === "this_month") {
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }
  if (key === "last_month") {
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getFullYear() === lm.getFullYear() && d.getMonth() === lm.getMonth();
  }
  return true;
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-2xl p-4 border bg-white" style={{ borderColor: colors.border }}>
      <div className="text-[12px]" style={{ color: colors.mutedForeground }}>{label}</div>
      <div className="text-2xl font-bold mt-0.5" style={{ color }}>{value}</div>
    </div>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [range, setRange] = useState<RangeKey>("all");
  const [roleFilter, setRoleFilter] = useState<"all" | "student" | "teacher">("all");
  const [busyId, setBusyId] = useState<string>("");

  const load = () => {
    setLoading(true);
    adminApi.listUsers()
      .then((d) => { setUsers(d.users || []); setErr(""); })
      .catch((e) => setErr(String(e?.message || e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // Counts for summary cards (independent of current view filter).
  const counts = useMemo(() => {
    const now = new Date();
    let thisM = 0, lastM = 0;
    let teachers = 0, students = 0;
    for (const u of users) {
      if (u.role === "teacher") teachers++; else students++;
      if (inRange(u.createdAt, "this_month")) thisM++;
      if (inRange(u.createdAt, "last_month")) lastM++;
    }
    void now;
    return { total: users.length, thisM, lastM, teachers, students };
  }, [users]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (!inRange(u.createdAt, range)) return false;
      if (!q) return true;
      return [u.name, u.email, u.phone, u.id, u.role].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
    });
  }, [users, query, range, roleFilter]);

  const exportCsv = () => {
    const header = ["Name", "Email", "Phone", "Role", "Class", "Subscribed", "Plan", "Suspended", "Joined"];
    const rows = filtered.map((u) => [
      u.name || "", u.email || "", u.phone || "", u.role, u.classLevel || "",
      u.subscribed ? "Yes" : "No", u.plan || "", u.suspended ? "Yes" : "No", u.createdAt || "",
    ]);
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gurutron-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSuspend = async (u: User) => {
    setBusyId(u.id);
    try {
      await adminApi.suspendUser(u.id, !u.suspended);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, suspended: !u.suspended } : x)));
    } catch (e) {
      alert(`Failed: ${String((e as Error)?.message || e)}`);
    } finally {
      setBusyId("");
    }
  };

  const removeUser = async (u: User) => {
    if (!window.confirm(`Permanently DELETE ${u.name || u.email || u.id} from the database? This cannot be undone.`)) return;
    setBusyId(u.id);
    try {
      await adminApi.deleteUser(u.id);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
    } catch (e) {
      alert(`Failed: ${String((e as Error)?.message || e)}`);
    } finally {
      setBusyId("");
    }
  };

  const RANGES: { k: RangeKey; label: string }[] = [
    { k: "all", label: "All time" },
    { k: "this_month", label: "This month" },
    { k: "last_month", label: "Last month" },
    { k: "last7", label: "Last 7 days" },
  ];

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
        <div>
          <div className="text-[26px] font-bold" style={{ color: colors.foreground }}>Users</div>
          <div className="text-sm" style={{ color: colors.mutedForeground }}>
            Everyone who registered — students & teachers. Filter, export, suspend or delete.
          </div>
        </div>
        <button
          onClick={exportCsv}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm"
          style={{ background: colors.neet }}
        >
          <Icon name="file-text" size={16} color="#fff" /> Export CSV ({filtered.length})
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <StatCard label="Total users" value={counts.total} color={colors.primary} />
        <StatCard label="Joined this month" value={counts.thisM} color={colors.neet} />
        <StatCard label="Joined last month" value={counts.lastM} color={colors.jee} />
        <StatCard label="Teachers" value={counts.teachers} color={colors.board} />
        <StatCard label="Students" value={counts.students} color={colors.bits} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <div className="absolute left-3 top-1/2 -translate-y-1/2"><Icon name="search" size={16} color={colors.mutedForeground} /></div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, phone, ID…"
            className="w-full rounded-xl pl-9 pr-3 py-2.5 border outline-none text-[14px]"
            style={{ borderColor: colors.border, background: "#fff", color: colors.foreground }}
          />
        </div>
        <div className="flex gap-1.5">
          {(["all", "student", "teacher"] as const).map((r) => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className="px-3 py-2 rounded-xl text-[13px] font-semibold capitalize"
              style={{ background: roleFilter === r ? colors.primary : colors.muted, color: roleFilter === r ? "#fff" : colors.foreground }}>
              {r === "all" ? "All roles" : r}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {RANGES.map((r) => (
          <button key={r.k} onClick={() => setRange(r.k)}
            className="px-3 py-1.5 rounded-full text-[12px] font-semibold"
            style={{ background: range === r.k ? colors.foreground : colors.muted, color: range === r.k ? "#fff" : colors.foreground }}>
            {r.label}
          </button>
        ))}
      </div>

      {err && <div className="mb-4 text-sm px-4 py-3 rounded-xl" style={{ background: "#fee2e2", color: "#991b1b" }}>{err}</div>}

      <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: colors.border }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr style={{ background: colors.muted, color: colors.mutedForeground }}>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={5} className="px-4 py-10 text-center" style={{ color: colors.mutedForeground }}>Loading…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center" style={{ color: colors.mutedForeground }}>No users match.</td></tr>
              )}
              {!loading && filtered.map((u) => (
                <tr key={u.id} className="border-t" style={{ borderColor: colors.border, opacity: u.suspended ? 0.6 : 1 }}>
                  <td className="px-4 py-3">
                    <div className="font-semibold" style={{ color: colors.foreground }}>{u.name || "—"}</div>
                    <div className="truncate max-w-[260px]" style={{ color: colors.mutedForeground }}>{u.email || u.phone || u.id}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize"
                      style={{ background: u.role === "teacher" ? "#ede9fe" : "#eff6ff", color: u.role === "teacher" ? "#4c1d95" : "#1e40af" }}>
                      {u.role}{u.classLevel ? ` · ${u.classLevel}` : ""}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: colors.foreground }}>{fmtDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    {u.suspended
                      ? <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: "#fee2e2", color: "#991b1b" }}>Suspended</span>
                      : <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: colors.neetLight, color: colors.neetForeground }}>Active</span>}
                    {u.subscribed && <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: "#fef3c7", color: "#92400e" }}>Premium</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleSuspend(u)}
                        disabled={busyId === u.id}
                        className="px-3 py-1.5 rounded-lg text-[12px] font-semibold disabled:opacity-50"
                        style={{ background: u.suspended ? colors.neetLight : "#fef3c7", color: u.suspended ? colors.neetForeground : "#92400e" }}
                      >
                        {u.suspended ? "Unsuspend" : "Suspend"}
                      </button>
                      <button
                        onClick={() => removeUser(u)}
                        disabled={busyId === u.id}
                        className="px-3 py-1.5 rounded-lg text-[12px] font-semibold disabled:opacity-50"
                        style={{ background: "#fee2e2", color: "#991b1b" }}
                      >
                        Delete
                      </button>
                    </div>
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
