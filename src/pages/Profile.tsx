import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { colors, examColor, examLight } from "@/lib/colors";
import { startSubscriptionCheckout } from "@/lib/razorpay";
import type { ExamType } from "@/lib/types";

const EXAM_TYPES: ExamType[] = ["NEET", "JEE", "BITS", "BOARD"];
const CLASS_LEVELS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

export default function Profile() {
  const { profile, updateProfile, attempts, papers, resetProgress, upgradeToTeacher, myMemberships } = useApp();
  const { logout } = useAuth();
  const nav = useNavigate();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);
  const [paying, setPaying] = useState(false);

  const isTeacher = profile.role === "teacher";
  const subscribed = !!profile.subscription?.active;
  const ec = examColor(profile.targetExam);
  const approvedClass = myMemberships.find((m) => m.status === "approved");
  const pendingClass = myMemberships.find((m) => m.status === "pending");

  const handleSaveName = () => {
    if (nameInput.trim()) updateProfile({ name: nameInput.trim() });
    setEditingName(false);
  };

  const handleReset = () => {
    if (window.confirm("Reset Progress? This will clear all your quiz history and papers.")) {
      resetProgress();
    }
  };

  const handleBecomeTeacher = async () => {
    const ok = window.confirm(
      "Switch to Teacher mode? This will clear your student progress, papers, and memberships, then start a fresh teacher profile."
    );
    if (!ok) return;
    await upgradeToTeacher();
  };

  const handleUpgrade = async () => {
    setPaying(true);
    await startSubscriptionCheckout(
      { name: profile.name || "Student" },
      async (sub) => { await updateProfile({ subscription: { active: true, ...sub } }); setPaying(false); },
      () => { setPaying(false); alert("Payment could not be completed. Please try again."); }
    );
  };

  return (
    <div className="px-4 pt-12 pb-8">
      {/* ---- Header ---- */}
      <div className="flex flex-col items-center mb-5">
        <div className="w-[84px] h-[84px] rounded-full flex items-center justify-center mb-3"
          style={{ background: colors.primary + "20" }}>
          <span className="text-4xl font-bold" style={{ color: colors.primary }}>
            {profile.name.charAt(0).toUpperCase() || "?"}
          </span>
        </div>
        {editingName ? (
          <div className="flex items-center gap-2 mb-2">
            <input
              autoFocus
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
              className="border-[1.5px] rounded-xl px-3 py-2 text-lg font-semibold w-[180px] outline-none"
              style={{ borderColor: colors.primary, background: colors.card, color: colors.foreground }}
            />
            <button onClick={handleSaveName} className="px-4 py-2 rounded-xl text-white text-sm font-semibold" style={{ background: colors.primary }}>
              Save
            </button>
          </div>
        ) : (
          <button onClick={() => { setNameInput(profile.name); setEditingName(true); }} className="flex items-center gap-2 mb-1.5">
            <div className="text-[22px] font-bold" style={{ color: colors.foreground }}>{profile.name || "Your name"}</div>
            <Icon name="edit-2" size={15} color={colors.mutedForeground} />
          </button>
        )}
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[12px] font-semibold" style={{ background: colors.secondary, color: colors.foreground }}>
            {isTeacher ? "Teacher" : "Student"}
          </span>
          {!isTeacher && profile.classLevel && (
            <span className="px-2.5 py-0.5 rounded-full text-[12px] font-semibold" style={{ background: colors.primary + "18", color: colors.primary }}>
              Class {profile.classLevel}
            </span>
          )}
          <span className="px-2.5 py-0.5 rounded-full text-[12px] font-semibold" style={{ background: ec + "18", color: ec }}>
            {profile.targetExam}
          </span>
        </div>
      </div>

      {/* ---- Subscription ---- */}
      <div className="rounded-2xl p-4 mb-3 border shadow-sm"
        style={{ borderColor: subscribed ? colors.success : "#fcd34d", background: subscribed ? "#ecfdf5" : "linear-gradient(135deg,#fffbeb,#fef3c7)" }}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#fff" }}>
            <Icon name={subscribed ? "check-circle" : "star"} size={20} color={subscribed ? colors.success : "#d97706"} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-bold" style={{ color: subscribed ? "#065f46" : "#7c2d12" }}>
              {subscribed ? "Premium active" : "Free plan"}
            </div>
            <div className="text-[12px]" style={{ color: subscribed ? "#047857" : "#92400e" }}>
              {subscribed ? "Unlimited solutions & papers unlocked" : "Upgrade for unlimited solutions, papers & analytics"}
            </div>
          </div>
          {!subscribed && (
            <button onClick={handleUpgrade} disabled={paying}
              className="shrink-0 px-4 py-2 rounded-xl text-[13px] font-bold text-white disabled:opacity-60" style={{ background: "#d97706" }}>
              {paying ? "…" : "Upgrade"}
            </button>
          )}
        </div>
      </div>

      {/* ---- Class selector (students only) ---- */}
      {!isTeacher && (
        <div className="rounded-2xl p-4 mb-3 border bg-white shadow-sm" style={{ borderColor: colors.border }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[15px] font-semibold" style={{ color: colors.foreground }}>My Class</div>
            <span className="text-[11px]" style={{ color: colors.mutedForeground }}>Used in Question Bank</span>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {CLASS_LEVELS.map((c) => {
              const active = profile.classLevel === c;
              return (
                <button
                  key={c}
                  onClick={() => updateProfile({ classLevel: c })}
                  className="py-2.5 rounded-xl text-[14px] font-bold transition active:scale-95"
                  style={{
                    background: active ? colors.primary : colors.secondary,
                    border: `${active ? 0 : 1}px solid ${colors.border}`,
                    color: active ? "#fff" : colors.foreground,
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ---- Join / My class (students) ---- */}
      {!isTeacher && (
        <button
          onClick={() => nav("/class/join")}
          className="w-full rounded-2xl p-4 mb-3 border shadow-sm text-left active:scale-[0.99] transition"
          style={{ background: "linear-gradient(135deg,#eff6ff,#dbeafe)", borderColor: "#bfdbfe" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#1e3a8a" }}>
              <Icon name="qr-code" size={20} color="#fff" />
            </div>
            <div className="flex-1 min-w-0">
              {approvedClass?.class ? (
                <>
                  <div className="text-[14px] font-bold" style={{ color: "#1e3a8a" }}>{approvedClass.class.name}</div>
                  <div className="text-[12px]" style={{ color: "#1d4ed8" }}>Joined · tap to switch or join another class</div>
                </>
              ) : pendingClass ? (
                <>
                  <div className="text-[14px] font-bold" style={{ color: "#1e3a8a" }}>Class join pending approval</div>
                  <div className="text-[12px]" style={{ color: "#1d4ed8" }}>Waiting for your teacher · tap to manage</div>
                </>
              ) : (
                <>
                  <div className="text-[14px] font-bold" style={{ color: "#1e3a8a" }}>Join your class</div>
                  <div className="text-[12px]" style={{ color: "#1d4ed8" }}>Enter the code your teacher shared</div>
                </>
              )}
            </div>
            <Icon name="chevron-right" size={18} color="#1e3a8a" />
          </div>
        </button>
      )}

      {/* ---- Target Exam ---- */}
      <div className="rounded-2xl p-4 mb-3 border bg-white shadow-sm" style={{ borderColor: colors.border }}>
        <div className="text-[15px] font-semibold mb-3" style={{ color: colors.foreground }}>Target Exam</div>
        <div className="flex gap-2">
          {EXAM_TYPES.map((e) => {
            const ac = examColor(e), al = examLight(e);
            const active = profile.targetExam === e;
            return (
              <button
                key={e}
                onClick={() => updateProfile({ targetExam: e })}
                className="flex-1 py-3 rounded-xl text-sm"
                style={{
                  background: active ? al : colors.secondary,
                  border: `${active ? 2 : 1}px solid ${active ? ac : colors.border}`,
                  color: active ? ac : colors.mutedForeground,
                  fontWeight: active ? 700 : 400,
                }}
              >
                {e}
              </button>
            );
          })}
        </div>
      </div>

      {/* ---- Stats ---- */}
      <div className="flex gap-2 mb-3">
        {[
          { v: profile.streak, l: "Day Streak", c: colors.primary },
          { v: profile.totalPoints, l: "Points", c: colors.jee },
          { v: attempts.length, l: "Quizzes", c: colors.neet },
          { v: papers.length, l: "Papers", c: colors.board },
        ].map((s) => (
          <div key={s.l} className="flex-1 rounded-2xl p-3 border bg-white flex flex-col items-center shadow-sm" style={{ borderColor: colors.border }}>
            <div className="text-xl font-bold" style={{ color: s.c }}>{s.v}</div>
            <div className="text-[10px] text-center" style={{ color: colors.mutedForeground }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* ---- Teacher switch (highlighted) ---- */}
      {!isTeacher ? (
        <button
          onClick={handleBecomeTeacher}
          className="w-full rounded-2xl p-4 mb-3 border shadow-sm text-left active:scale-[0.99] transition"
          style={{ background: "linear-gradient(135deg,#1c1917,#292524)", borderColor: "rgba(251,191,36,0.4)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(251,191,36,0.15)" }}>
              <Icon name="users" size={20} color="#fbbf24" />
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-bold" style={{ color: "#fbbf24" }}>Switch to Teacher</div>
              <div className="text-[12px]" style={{ color: "rgba(255,255,255,0.65)" }}>Create classes, make papers, track students & earn referral commission</div>
            </div>
            <Icon name="chevron-right" size={18} color="#fbbf24" />
          </div>
        </button>
      ) : (
        <div className="w-full rounded-2xl p-4 mb-3 border shadow-sm flex items-center gap-3"
          style={{ background: "#ecfdf5", borderColor: colors.success }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#fff" }}>
            <Icon name="check-circle" size={20} color={colors.success} />
          </div>
          <div>
            <div className="text-[14px] font-bold" style={{ color: "#065f46" }}>Teacher mode active</div>
            <div className="text-[12px]" style={{ color: "#047857" }}>You can create classes & generate papers</div>
          </div>
        </div>
      )}

      {/* ---- Actions ---- */}
      <button
        onClick={handleReset}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-[1.5px] mb-2 bg-white"
        style={{ borderColor: colors.destructive }}
      >
        <Icon name="trash-2" size={16} color={colors.destructive} />
        <span className="text-sm font-semibold" style={{ color: colors.destructive }}>Reset Progress</span>
      </button>
      <button
        onClick={() => logout()}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-[1.5px] bg-white"
        style={{ borderColor: colors.primary, color: colors.foreground }}
      >
        <Icon name="log-out" size={16} color={colors.primary} />
        <span className="text-sm font-semibold">Logout</span>
      </button>
    </div>
  );
}
