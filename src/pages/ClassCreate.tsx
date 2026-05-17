import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { colors } from "@/lib/colors";
import type { BatchType, ClassRoom } from "@/lib/types";

const CLASS_LEVELS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
const SUGGESTED_SUBJECTS = [
  "Mathematics",
  "Science",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Social Science",
];

export default function ClassCreate() {
  const { profile, createClass } = useApp();
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [classLevel, setClassLevel] = useState("6");
  const [batchType, setBatchType] = useState<BatchType>("normal");
  const [school, setSchool] = useState("");
  const [teacherName, setTeacherName] = useState(profile.name || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<ClassRoom | null>(null);

  const canSubmit = useMemo(
    () => name.trim().length > 1 && classLevel && batchType && !submitting,
    [name, classLevel, batchType, submitting]
  );

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError("");
    setSubmitting(true);
    try {
      const cls = await createClass({
        name: name.trim(),
        subject: subject.trim() || undefined,
        classLevel,
        batchType,
        school: school.trim() || undefined,
        teacherName: teacherName.trim() || undefined,
      });
      setCreated(cls);
    } catch (e: any) {
      setError(e?.message || "Could not create class");
    } finally {
      setSubmitting(false);
    }
  };

  if (created) {
    return <ClassCreatedScreen cls={created} onDone={() => nav("/", { replace: true })} />;
  }

  return (
    <div
      className="min-h-full px-6 py-10 text-white relative overflow-hidden"
      style={{ background: "linear-gradient(135deg,#1c1917 0%,#292524 50%,#44403c 100%)" }}
    >
      <div
        className="absolute -top-20 -right-20 w-72 h-72 rounded-full"
        style={{ background: "rgba(251,191,36,0.08)" }}
      />
      <div
        className="absolute bottom-24 -left-16 w-48 h-48 rounded-full"
        style={{ background: "rgba(251,191,36,0.05)" }}
      />

      <div className="relative z-10 max-w-md mx-auto">
        <div className="text-center mb-8">
          <div
            className="w-[64px] h-[64px] rounded-2xl mx-auto mb-3 flex items-center justify-center border"
            style={{
              background: "rgba(251,191,36,0.15)",
              borderColor: "rgba(251,191,36,0.3)",
            }}
          >
            <Icon name="graduation-cap" size={30} color="#fbbf24" />
          </div>
          <div className="text-[26px] font-bold tracking-tight">Create your class</div>
          <div className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
            Students will join with a code or QR
          </div>
        </div>

        {/* Class name */}
        <Field label="Class name" required>
          <div
            className="flex items-center rounded-2xl border px-4 h-14"
            style={{ background: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.18)" }}
          >
            <Icon name="book-open" size={18} color="rgba(255,255,255,0.5)" />
            <input
              autoFocus
              placeholder="e.g. 6A Maths"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="ml-2.5 flex-1 bg-transparent outline-none text-white placeholder:text-white/40"
            />
          </div>
        </Field>

        {/* Class level */}
        <Field label="Class (Grade)" required>
          <div className="grid grid-cols-5 gap-2">
            {CLASS_LEVELS.map((cl) => {
              const active = classLevel === cl;
              return (
                <button
                  key={cl}
                  onClick={() => setClassLevel(cl)}
                  className="py-3 rounded-xl text-sm font-bold transition active:scale-[0.95]"
                  style={{
                    background: active ? "rgba(251,191,36,0.25)" : "rgba(255,255,255,0.08)",
                    border: `${active ? 2 : 1}px solid ${active ? "#fbbf24" : "rgba(255,255,255,0.15)"}`,
                    color: active ? "#fbbf24" : "rgba(255,255,255,0.6)",
                  }}
                >
                  {cl}
                </button>
              );
            })}
          </div>
        </Field>

        {/* Batch */}
        <Field label="Batch type" required>
          <div className="flex gap-2.5">
            {([
              { v: "toppers", label: "Toppers", icon: "award", c: "#fbbf24" },
              { v: "normal", label: "Normal", icon: "users", c: "#60a5fa" },
            ] as { v: BatchType; label: string; icon: string; c: string }[]).map((b) => {
              const active = batchType === b.v;
              return (
                <button
                  key={b.v}
                  onClick={() => setBatchType(b.v)}
                  className="flex-1 py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-2 transition active:scale-[0.97]"
                  style={{
                    background: active ? b.c + "30" : "rgba(255,255,255,0.06)",
                    border: `${active ? 2 : 1}px solid ${active ? b.c : "rgba(255,255,255,0.15)"}`,
                    color: active ? b.c : "rgba(255,255,255,0.6)",
                  }}
                >
                  <Icon name={b.icon} size={18} color={active ? b.c : "rgba(255,255,255,0.55)"} />
                  {b.label}
                </button>
              );
            })}
          </div>
        </Field>

        {/* Subject (optional) */}
        <Field label="Primary subject (optional)">
          <div
            className="flex items-center rounded-2xl border px-4 h-12 mb-2"
            style={{ background: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.18)" }}
          >
            <Icon name="zap" size={16} color="rgba(255,255,255,0.5)" />
            <input
              placeholder="e.g. Mathematics"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="ml-2.5 flex-1 bg-transparent outline-none text-white placeholder:text-white/40 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_SUBJECTS.map((s) => (
              <button
                key={s}
                onClick={() => setSubject(s)}
                className="px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  background: subject === s ? "rgba(251,191,36,0.2)" : "rgba(255,255,255,0.06)",
                  color: subject === s ? "#fbbf24" : "rgba(255,255,255,0.6)",
                  border: `1px solid ${subject === s ? "rgba(251,191,36,0.4)" : "rgba(255,255,255,0.1)"}`,
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </Field>

        {/* School (optional) */}
        <Field label="School (optional)">
          <div
            className="flex items-center rounded-2xl border px-4 h-12"
            style={{ background: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.18)" }}
          >
            <Icon name="school" size={16} color="rgba(255,255,255,0.5)" />
            <input
              placeholder="e.g. ABC Public School"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              className="ml-2.5 flex-1 bg-transparent outline-none text-white placeholder:text-white/40 text-sm"
            />
          </div>
        </Field>

        {/* Teacher name */}
        <Field label="Teacher name">
          <div
            className="flex items-center rounded-2xl border px-4 h-12"
            style={{ background: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.18)" }}
          >
            <Icon name="user" size={16} color="rgba(255,255,255,0.5)" />
            <input
              placeholder="e.g. Sharma Sir"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              className="ml-2.5 flex-1 bg-transparent outline-none text-white placeholder:text-white/40 text-sm"
            />
          </div>
        </Field>

        {error && (
          <div
            className="text-sm rounded-xl px-3 py-2 mb-3"
            style={{ background: "rgba(239,68,68,0.15)", color: "#fca5a5" }}
          >
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full rounded-2xl overflow-hidden transition active:scale-[0.97] disabled:opacity-40 mt-2"
          style={{ background: "linear-gradient(to right, #fbbf24, #f59e0b)" }}
        >
          <div className="flex items-center justify-center gap-2.5 py-4 text-base font-bold" style={{ color: "#1c1917" }}>
            {submitting ? "Creating…" : "Create Class"}
            <Icon name="arrow-right" size={18} color="#1c1917" />
          </div>
        </button>

        <div className="mt-6 text-center text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
          <Icon name="sparkles" size={12} color="rgba(255,255,255,0.4)" /> A join code and QR will be
          generated automatically.
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <div
        className="text-[11px] uppercase tracking-wider mb-2 font-semibold"
        style={{ color: "rgba(255,255,255,0.6)" }}
      >
        {label}
        {required && <span style={{ color: "#fbbf24" }}> *</span>}
      </div>
      {children}
    </div>
  );
}

function ClassCreatedScreen({ cls, onDone }: { cls: ClassRoom; onDone: () => void }) {
  const [copied, setCopied] = useState(false);
  const joinUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/class/join?code=${encodeURIComponent(cls.code)}`
      : `/class/join?code=${cls.code}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(
    joinUrl
  )}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cls.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="min-h-full" style={{ background: colors.background }}>
      <div
        className="px-6 pt-14 pb-8 text-white"
        style={{ background: "linear-gradient(135deg,#1c1917,#292524)" }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
          style={{ background: "rgba(34,197,94,0.2)" }}
        >
          <Icon name="check-circle" size={28} color="#4ade80" />
        </div>
        <div className="text-[26px] font-bold tracking-tight">Class created!</div>
        <div className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
          Share the code or QR with your students.
        </div>
      </div>

      <div className="px-5 -mt-4">
        <div
          className="rounded-3xl border bg-white p-5 shadow-sm"
          style={{ borderColor: colors.border }}
        >
          <div className="text-[11px] uppercase tracking-wider font-bold mb-1" style={{ color: colors.mutedForeground }}>
            Class
          </div>
          <div className="text-lg font-bold" style={{ color: colors.foreground }}>
            {cls.name}
          </div>
          <div className="text-xs mt-0.5" style={{ color: colors.mutedForeground }}>
            Class {cls.classLevel} • {cls.batchType === "toppers" ? "Toppers" : "Normal"} batch
            {cls.subject ? ` • ${cls.subject}` : ""}
          </div>
          {cls.school && (
            <div className="text-xs mt-1" style={{ color: colors.mutedForeground }}>
              <Icon name="school" size={11} color={colors.mutedForeground} /> {cls.school}
            </div>
          )}

          <div className="mt-5 rounded-2xl border p-4 flex flex-col items-center" style={{ borderColor: colors.border, background: "#fafafa" }}>
            <img src={qrSrc} alt="Class QR" width={200} height={200} className="rounded-xl mb-3" />
            <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: colors.mutedForeground }}>
              Join code
            </div>
            <div className="text-3xl font-extrabold tracking-[0.15em]" style={{ color: colors.foreground }}>
              {cls.code}
            </div>
            <button
              onClick={copy}
              className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: "#fbbf24", color: "#1c1917" }}
            >
              <Icon name={copied ? "check" : "copy"} size={16} color="#1c1917" />
              {copied ? "Copied!" : "Copy code"}
            </button>
          </div>

          <button
            onClick={onDone}
            className="mt-5 w-full py-4 rounded-2xl text-base font-bold text-white"
            style={{ background: "#1c1917" }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
