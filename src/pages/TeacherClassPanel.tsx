import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { colors } from "@/lib/colors";
import type { ClassRoom, Membership } from "@/lib/types";

const ACTIVE_CLASS_KEY = "gurutron.activeClassId";

/**
 * Card rendered inside the teacher home showing:
 *  - Active class code + QR
 *  - Pending student join requests (approve / reject)
 *  - Approved student count
 */
export default function TeacherClassPanel() {
  const { classes, getClassMemberships, decideMembership } = useApp();
  const nav = useNavigate();
  // Restore last-opened class from localStorage on first mount; fall back to first class.
  const initialActive = useMemo<ClassRoom | null>(() => {
    try {
      const stored = localStorage.getItem(ACTIVE_CLASS_KEY);
      if (stored) {
        const found = classes.find((c) => c.id === stored);
        if (found) return found;
      }
    } catch {
      /* ignore */
    }
    return classes[0] || null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [active, setActive] = useState<ClassRoom | null>(initialActive);
  const [members, setMembers] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);

  // Persist active class id so it survives reload.
  useEffect(() => {
    if (active?.id) {
      try { localStorage.setItem(ACTIVE_CLASS_KEY, active.id); } catch { /* ignore */ }
    }
  }, [active?.id]);

  // Keep active class in sync if the classes list changes (e.g. fresh login fetch).
  useEffect(() => {
    if (classes.length === 0) {
      if (active) setActive(null);
      return;
    }
    if (!active) {
      // Prefer the previously stored class if it now exists.
      try {
        const stored = localStorage.getItem(ACTIVE_CLASS_KEY);
        const found = stored ? classes.find((c) => c.id === stored) : null;
        setActive(found || classes[0]);
        return;
      } catch {
        setActive(classes[0]);
        return;
      }
    }
    if (active && !classes.find((c) => c.id === active.id)) {
      setActive(classes[0]);
    }
  }, [classes, active]);

  const refresh = async (clsId: string) => {
    setLoading(true);
    try {
      const m = await getClassMemberships(clsId);
      setMembers(m);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (active) void refresh(active.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id]);

  // No active class yet (zero classes) — still render the top action buttons
  // so the teacher can create their first class from the dashboard.
  if (!active) {
    return (
      <div className="px-4 pt-4 mb-2">
        <button
          onClick={() => nav("/class/create")}
          className="w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl text-sm font-bold text-white shadow-sm"
          style={{ background: "#1c1917" }}
        >
          <Icon name="plus" size={16} color="#fbbf24" />
          Create your first class
        </button>
        <div
          className="text-[11px] mt-2 text-center"
          style={{ color: colors.mutedForeground }}
        >
          Create a class so students can join and you can assign papers.
        </div>
      </div>
    );
  }

  const pending = members.filter((m) => m.status === "pending");
  const approved = members.filter((m) => m.status === "approved");

  const joinUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/class/join?code=${encodeURIComponent(active.code)}`
      : `/class/join?code=${active.code}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(
    joinUrl
  )}`;

  const decide = async (m: Membership, status: "approved" | "rejected") => {
    await decideMembership(m.id, status);
    void refresh(active.id);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(active.code);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="px-4 pt-4 mb-2">
      {/* Top quick actions: Create + Switch */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => nav("/class/create")}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm"
          style={{ background: "#1c1917" }}
        >
          <Icon name="plus" size={16} color="#fbbf24" />
          Create new class
        </button>
        <button
          onClick={() => setShowSwitcher((s) => !s)}
          disabled={classes.length < 2}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold border disabled:opacity-50"
          style={{
            borderColor: colors.border,
            background: showSwitcher ? "#fef3c7" : "#fff",
            color: colors.foreground,
          }}
          title={classes.length < 2 ? "Only one class — create another to switch" : "Switch class"}
        >
          <Icon name="refresh-cw" size={14} color={colors.foreground} />
          Switch class{classes.length > 1 ? ` (${classes.length})` : ""}
        </button>
      </div>

      {/* Class switcher dropdown */}
      {showSwitcher && classes.length > 1 && (
        <div
          className="rounded-2xl border bg-white mb-3 overflow-hidden"
          style={{ borderColor: colors.border }}
        >
          {classes.map((c, idx) => {
            const a = c.id === active.id;
            return (
              <button
                key={c.id}
                onClick={() => {
                  setActive(c);
                  setShowSwitcher(false);
                }}
                className="w-full flex items-center px-4 py-3 gap-3 text-left"
                style={{
                  borderBottom:
                    idx < classes.length - 1 ? `1px solid ${colors.border}` : "none",
                  background: a ? "#fef3c7" : "#fff",
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs"
                  style={{
                    background: a ? "#fbbf24" : colors.muted,
                    color: a ? "#1c1917" : colors.foreground,
                  }}
                >
                  {c.classLevel}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate" style={{ color: colors.foreground }}>
                    {c.name}
                  </div>
                  <div className="text-[11px]" style={{ color: colors.mutedForeground }}>
                    {c.batchType === "toppers" ? "Toppers" : "Normal"} • Code{" "}
                    <span className="font-bold tracking-wider">{c.code}</span>
                  </div>
                </div>
                {a && <Icon name="check" size={16} color="#16a34a" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Class header card */}
      <div
        className="rounded-3xl border bg-white shadow-sm p-4"
        style={{ borderColor: colors.border }}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div
              className="text-[11px] uppercase tracking-wider font-bold"
              style={{ color: colors.mutedForeground }}
            >
              Active class
            </div>
            <div className="text-lg font-bold truncate" style={{ color: colors.foreground }}>
              {active.name}
            </div>
            <div className="text-xs" style={{ color: colors.mutedForeground }}>
              Class {active.classLevel} •{" "}
              {active.batchType === "toppers" ? "Toppers" : "Normal"} batch
            </div>
          </div>
        </div>

        {/* Code row */}
        <div
          className="mt-3 rounded-2xl border flex items-center p-3"
          style={{ borderColor: colors.border, background: "#fafafa" }}
        >
          <div className="flex-1">
            <div
              className="text-[10px] uppercase tracking-wider font-bold"
              style={{ color: colors.mutedForeground }}
            >
              Join code
            </div>
            <div
              className="text-xl font-extrabold tracking-[0.18em]"
              style={{ color: colors.foreground }}
            >
              {active.code}
            </div>
          </div>
          <button
            onClick={copy}
            className="p-2 rounded-xl mr-1"
            style={{ background: colors.muted }}
            title="Copy code"
          >
            <Icon name="copy" size={16} color={colors.foreground} />
          </button>
          <button
            onClick={() => setShowQr((s) => !s)}
            className="px-3 py-2 rounded-xl font-bold text-sm flex items-center gap-1.5"
            style={{ background: "#fbbf24", color: "#1c1917" }}
          >
            <Icon name="qr-code" size={16} color="#1c1917" />
            {showQr ? "Hide" : "QR"}
          </button>
        </div>

        {showQr && (
          <div className="mt-3 flex flex-col items-center rounded-2xl border p-4" style={{ borderColor: colors.border }}>
            <img src={qrSrc} alt="Class QR" width={200} height={200} className="rounded-xl" />
            <div className="text-[11px] mt-2" style={{ color: colors.mutedForeground }}>
              Students scan this to join {active.name}
            </div>
          </div>
        )}

      </div>

      {/* Pending approvals */}
      <div className="mt-4">
        <div className="flex justify-between items-center mb-2">
          <div className="text-[17px] font-bold" style={{ color: colors.foreground }}>
            Join requests
          </div>
          <div
            className="px-2 py-0.5 rounded-md text-[11px] font-bold"
            style={{
              background: pending.length ? "#fef3c7" : colors.muted,
              color: pending.length ? "#92400e" : colors.mutedForeground,
            }}
          >
            {pending.length} pending
          </div>
        </div>

        {loading && (
          <div className="text-xs" style={{ color: colors.mutedForeground }}>
            Loading…
          </div>
        )}

        {!loading && pending.length === 0 && (
          <div
            className="rounded-2xl border p-4 text-sm text-center"
            style={{ borderColor: colors.border, background: "#fff", color: colors.mutedForeground }}
          >
            No pending requests. Share the join code with your students.
          </div>
        )}

        {pending.length > 0 && (
          <div
            className="rounded-2xl border bg-white overflow-hidden"
            style={{ borderColor: colors.border }}
          >
            {pending.map((m, idx) => (
              <div
                key={m.id}
                className="flex items-center px-4 py-3 gap-3"
                style={{
                  borderBottom:
                    idx < pending.length - 1 ? `1px solid ${colors.border}` : "none",
                }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold"
                  style={{ background: "#fef3c7", color: "#92400e" }}
                >
                  {m.studentName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate" style={{ color: colors.foreground }}>
                    {m.studentName}
                  </div>
                  <div className="text-[11px]" style={{ color: colors.mutedForeground }}>
                    Roll {m.rollNumber}
                    {m.parentPhone ? ` • ${m.parentPhone}` : ""}
                  </div>
                </div>
                <button
                  onClick={() => decide(m, "rejected")}
                  className="px-3 py-2 rounded-xl text-xs font-bold"
                  style={{ background: "#fee2e2", color: "#b91c1c" }}
                >
                  Reject
                </button>
                <button
                  onClick={() => decide(m, "approved")}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-white"
                  style={{ background: "#16a34a" }}
                >
                  Approve
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-2 text-[11px]" style={{ color: colors.mutedForeground }}>
          {approved.length} approved student{approved.length === 1 ? "" : "s"} in {active.code}
        </div>
      </div>
    </div>
  );
}
