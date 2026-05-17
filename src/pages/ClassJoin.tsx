import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Icon } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";
import { colors } from "@/lib/colors";
import type { ClassRoom, Membership } from "@/lib/types";

type Step = "entry" | "lookup" | "details" | "confirm" | "done";

export default function ClassJoin() {
  const { profile, joinClass, myMemberships } = useApp();
  const nav = useNavigate();
  const [params] = useSearchParams();

  // If the student already has an approved or pending membership, jump to status screen.
  const activeMembership = useMemo(
    () => myMemberships.find((m) => m.status === "approved" || m.status === "pending") || null,
    [myMemberships]
  );

  const [step, setStep] = useState<Step>("entry");
  const [code, setCode] = useState((params.get("code") || "").toUpperCase());
  const [cls, setCls] = useState<ClassRoom | null>(null);
  const [studentName, setStudentName] = useState(profile.name || "");
  const [rollNumber, setRollNumber] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [membership, setMembership] = useState<Membership | null>(activeMembership);

  // Auto-look-up if a code came in via QR ?code=...
  useEffect(() => {
    const incoming = params.get("code");
    if (incoming && !cls && step === "entry" && !activeMembership) {
      void lookup(incoming.toUpperCase());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show membership-status screen if a non-rejected membership already exists.
  if (activeMembership && step === "entry" && !cls) {
    return <MembershipStatusScreen membership={activeMembership} onLeave={() => nav("/", { replace: true })} />;
  }

  const lookup = async (raw: string) => {
    const c = raw.trim().toUpperCase();
    if (!c) {
      setError("Please enter a join code");
      return;
    }
    setError("");
    setLoading(true);
    setStep("lookup");
    try {
      const r = await api.getClassByCode(c);
      setCls(r.class);
      setStep("details");
    } catch (e: any) {
      setError(e?.message?.includes("404") ? "No class found for this code" : e?.message || "Lookup failed");
      setStep("entry");
    } finally {
      setLoading(false);
    }
  };

  const submitJoin = async () => {
    if (!cls) return;
    if (!studentName.trim() || !rollNumber.trim()) {
      setError("Name and Roll Number are required");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const m = await joinClass({
        code: cls.code,
        studentName: studentName.trim(),
        rollNumber: rollNumber.trim(),
        parentPhone: parentPhone.trim() || undefined,
      });
      setMembership(m);
      setStep("done");
    } catch (e: any) {
      setError(e?.message || "Could not join class");
    } finally {
      setLoading(false);
    }
  };

  if (step === "done" && membership) {
    return <MembershipStatusScreen membership={membership} onLeave={() => nav("/", { replace: true })} />;
  }

  // ENTRY screen
  if (step === "entry" || step === "lookup") {
    return (
      <div
        className="min-h-full px-6 py-12 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#1e3a8a 0%,#2563eb 50%,#3b82f6 100%)" }}
      >
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div className="absolute bottom-24 -left-16 w-48 h-48 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }} />

        <div className="relative z-10 max-w-md mx-auto">
          <div className="text-center mb-8">
            <div
              className="w-[64px] h-[64px] rounded-2xl mx-auto mb-3 flex items-center justify-center border"
              style={{ background: "rgba(255,255,255,0.15)", borderColor: "rgba(255,255,255,0.2)" }}
            >
              <Icon name="qr-code" size={30} color="#fff" />
            </div>
            <div className="text-[28px] font-bold tracking-tight">Join your class</div>
            <div className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
              Scan the QR or enter the code your teacher shared.
            </div>
          </div>

          <button
            disabled
            className="w-full mb-4 rounded-2xl overflow-hidden p-5 border opacity-70"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.08))",
              borderColor: "rgba(255,255,255,0.18)",
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.18)" }}
              >
                <Icon name="qr-code" size={28} color="#fff" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-base font-bold">Scan QR Code</div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                  Use your camera (coming soon)
                </div>
              </div>
            </div>
          </button>

          <div className="text-center my-3 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
            OR
          </div>

          <div
            className="flex items-center rounded-2xl border px-4 h-16 mb-3"
            style={{ background: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.2)" }}
          >
            <Icon name="hash" size={20} color="rgba(255,255,255,0.5)" />
            <input
              placeholder="ENTER JOIN CODE"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && lookup(code)}
              autoCapitalize="characters"
              spellCheck={false}
              className="ml-3 flex-1 bg-transparent outline-none text-white text-xl font-bold tracking-[0.15em] placeholder:text-white/40 placeholder:font-bold placeholder:text-base placeholder:tracking-wider"
            />
          </div>

          {error && (
            <div className="text-sm rounded-xl px-3 py-2 mb-3" style={{ background: "rgba(239,68,68,0.15)", color: "#fecaca" }}>
              {error}
            </div>
          )}

          <button
            onClick={() => lookup(code)}
            disabled={loading || code.trim().length < 3}
            className="w-full rounded-2xl overflow-hidden transition active:scale-[0.97] disabled:opacity-40"
            style={{ background: "linear-gradient(to right, #ffffff, #e0e7ff)" }}
          >
            <div className="flex items-center justify-center gap-2.5 py-4 text-base font-bold" style={{ color: "#1e3a8a" }}>
              {loading ? "Looking up…" : "Next"}
              <Icon name="arrow-right" size={18} color="#1e3a8a" />
            </div>
          </button>
        </div>
      </div>
    );
  }

  // DETAILS + CONFIRM screen
  if (!cls) return null;
  return (
    <div className="min-h-full" style={{ background: colors.background }}>
      <div className="px-6 pt-12 pb-6 text-white" style={{ background: "linear-gradient(135deg,#1e3a8a,#2563eb)" }}>
        <button
          onClick={() => {
            setStep("entry");
            setCls(null);
          }}
          className="flex items-center gap-1.5 text-sm mb-3"
          style={{ color: "rgba(255,255,255,0.7)" }}
        >
          <Icon name="arrow-left" size={16} color="rgba(255,255,255,0.7)" /> Change code
        </button>
        <div className="text-[11px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.55)" }}>
          You are joining
        </div>
        <div className="text-2xl font-bold mt-0.5">{cls.name}</div>
        <div className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.7)" }}>
          Class {cls.classLevel} • {cls.batchType === "toppers" ? "Toppers" : "Normal"} batch
        </div>
        {cls.teacherName && (
          <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>
            Teacher: {cls.teacherName}
          </div>
        )}
        {cls.school && (
          <div className="text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>
            School: {cls.school}
          </div>
        )}
      </div>

      <div className="px-5 -mt-3">
        <div className="rounded-3xl bg-white border p-5 shadow-sm" style={{ borderColor: colors.border }}>
          <div className="text-lg font-bold mb-3" style={{ color: colors.foreground }}>
            Your details
          </div>

          <BigField icon="user" label="Your name">
            <input
              placeholder="e.g. Rahul Kumar"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="flex-1 bg-transparent outline-none text-base font-medium"
              style={{ color: colors.foreground }}
            />
          </BigField>

          <BigField icon="hash" label="Roll number">
            <input
              placeholder="e.g. 12"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              className="flex-1 bg-transparent outline-none text-base font-medium"
              style={{ color: colors.foreground }}
            />
          </BigField>

          <BigField icon="phone" label="Parent phone (optional)">
            <input
              inputMode="tel"
              placeholder="e.g. 98XXXXXXXX"
              value={parentPhone}
              onChange={(e) => setParentPhone(e.target.value)}
              className="flex-1 bg-transparent outline-none text-base font-medium"
              style={{ color: colors.foreground }}
            />
          </BigField>

          {error && (
            <div
              className="text-sm rounded-xl px-3 py-2 mb-3"
              style={{ background: "#fee2e2", color: "#b91c1c" }}
            >
              {error}
            </div>
          )}

          <button
            onClick={submitJoin}
            disabled={loading || !studentName.trim() || !rollNumber.trim()}
            className="w-full py-4 rounded-2xl text-base font-bold text-white disabled:opacity-40"
            style={{ background: colors.primary }}
          >
            {loading ? "Joining…" : "Confirm Join"}
          </button>
          <div className="text-[11px] mt-2 text-center" style={{ color: colors.mutedForeground }}>
            Your teacher will approve your request before you can take tests.
          </div>
        </div>
      </div>
    </div>
  );
}

function BigField({
  icon,
  label,
  children,
}: {
  icon: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <div
        className="text-[11px] uppercase tracking-wider mb-1.5 font-semibold"
        style={{ color: colors.mutedForeground }}
      >
        {label}
      </div>
      <div
        className="flex items-center rounded-2xl border px-4 h-14"
        style={{ background: "#fafafa", borderColor: colors.border }}
      >
        <Icon name={icon} size={18} color={colors.mutedForeground} />
        <div className="ml-2.5 flex-1 flex items-center">{children}</div>
      </div>
    </div>
  );
}

function MembershipStatusScreen({
  membership,
  onLeave,
}: {
  membership: Membership;
  onLeave: () => void;
}) {
  const cls = membership.class;
  const status = membership.status;

  const palette =
    status === "approved"
      ? { bg: "#dcfce7", fg: "#166534", icon: "check-circle", c: "#16a34a" }
      : status === "rejected"
        ? { bg: "#fee2e2", fg: "#991b1b", icon: "x-circle", c: "#dc2626" }
        : { bg: "#fef3c7", fg: "#92400e", icon: "clock", c: "#d97706" };

  return (
    <div className="min-h-full px-6 py-12" style={{ background: colors.background }}>
      <div className="max-w-md mx-auto">
        <div
          className="rounded-3xl border p-6 shadow-sm bg-white"
          style={{ borderColor: colors.border }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: palette.bg }}
          >
            <Icon name={palette.icon} size={28} color={palette.c} />
          </div>
          <div className="text-2xl font-bold tracking-tight" style={{ color: colors.foreground }}>
            {status === "approved"
              ? "You're in!"
              : status === "rejected"
                ? "Request rejected"
                : "Waiting for approval"}
          </div>
          <div className="text-sm mt-1" style={{ color: colors.mutedForeground }}>
            {status === "approved"
              ? "You can now take tests assigned to this class."
              : status === "rejected"
                ? "Your teacher didn't approve this join request."
                : "Your teacher will approve you shortly. Tests will appear here after approval."}
          </div>

          {cls && (
            <div
              className="mt-5 rounded-2xl border p-4"
              style={{ background: "#fafafa", borderColor: colors.border }}
            >
              <div className="text-[11px] uppercase tracking-wider font-bold mb-1" style={{ color: colors.mutedForeground }}>
                Class
              </div>
              <div className="text-base font-bold" style={{ color: colors.foreground }}>
                {cls.name}
              </div>
              <div className="text-xs mt-0.5" style={{ color: colors.mutedForeground }}>
                Class {cls.classLevel} • {cls.batchType === "toppers" ? "Toppers" : "Normal"} batch
                {cls.teacherName ? ` • ${cls.teacherName}` : ""}
              </div>
              <div className="text-[11px] mt-2" style={{ color: colors.mutedForeground }}>
                Code: <span className="font-bold tracking-widest" style={{ color: colors.foreground }}>{cls.code}</span>
              </div>
            </div>
          )}

          <div
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: palette.bg, color: palette.fg }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: palette.c }} />
            {status.toUpperCase()}
          </div>

          <button
            onClick={onLeave}
            className="mt-6 w-full py-4 rounded-2xl text-base font-bold text-white"
            style={{ background: colors.primary }}
          >
            {status === "approved" ? "Open Dashboard" : "Back to Home"}
          </button>
        </div>
      </div>
    </div>
  );
}
