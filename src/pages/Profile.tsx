import { useState } from "react";
import { Icon } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { colors, examColor, examLight } from "@/lib/colors";
import type { ExamType } from "@/lib/types";

const EXAM_TYPES: ExamType[] = ["NEET", "JEE", "BOARD"];

export default function Profile() {
  const { profile, updateProfile, attempts, papers, resetProgress } = useApp();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);

  const ec = examColor(profile.targetExam);

  const handleSaveName = () => {
    if (nameInput.trim()) updateProfile({ name: nameInput.trim() });
    setEditingName(false);
  };

  const handleReset = () => {
    if (window.confirm("Reset Progress? This will clear all your quiz history and papers.")) {
      resetProgress();
    }
  };

  const menuItems = [
    { icon: "target", label: "Target Exam", value: profile.targetExam },
    { icon: "book-open", label: "Papers Generated", value: String(papers.length) },
    { icon: "check-circle", label: "Quizzes Attempted", value: String(attempts.length) },
  ];

  return (
    <div className="px-4 pt-12 pb-5">
      <div className="flex flex-col items-center mb-6">
        <div className="w-[88px] h-[88px] rounded-full flex items-center justify-center mb-3"
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
            <button
              onClick={handleSaveName}
              className="px-4 py-2 rounded-xl text-white text-sm font-semibold"
              style={{ background: colors.primary }}
            >
              Save
            </button>
          </div>
        ) : (
          <button onClick={() => { setNameInput(profile.name); setEditingName(true); }}
            className="flex items-center gap-2 mb-2">
            <div className="text-[22px] font-bold" style={{ color: colors.foreground }}>{profile.name}</div>
            <Icon name="edit-2" size={16} color={colors.mutedForeground} />
          </button>
        )}
        <div className="px-3 py-1 rounded-2xl" style={{ background: ec + "20" }}>
          <span className="text-[13px] font-semibold" style={{ color: ec }}>{profile.targetExam} Aspirant</span>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {[
          { v: profile.streak, l: "Day Streak", c: colors.primary },
          { v: profile.totalPoints, l: "Points", c: colors.jee },
          { v: "#" + profile.rank, l: "Rank", c: colors.neet },
        ].map((s) => (
          <div key={s.l} className="flex-1 rounded-2xl p-3.5 border bg-white flex flex-col items-center shadow-sm"
            style={{ borderColor: colors.border }}>
            <div className="text-2xl font-bold" style={{ color: s.c }}>{s.v}</div>
            <div className="text-[11px] text-center" style={{ color: colors.mutedForeground }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Role picker removed \u2014 the app is now student-only. Teacher
          workflows live in a separate teacher app/build. */}

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

      {/* The school / institute header upload now lives inside the
          Paper Generation flow itself, so teachers configure it at the
          point of use instead of digging through Profile. */}

      <div className="rounded-2xl p-4 mb-3 border bg-white shadow-sm" style={{ borderColor: colors.border }}>
        {menuItems.map((item, i) => (
          <div key={item.label} className="flex justify-between items-center py-3"
            style={{ borderBottom: i < menuItems.length - 1 ? `1px solid ${colors.border}` : "none" }}>
            <div className="flex items-center gap-3">
              <div className="w-[34px] h-[34px] rounded-xl flex items-center justify-center" style={{ background: colors.muted }}>
                <Icon name={item.icon} size={16} color={colors.mutedForeground} />
              </div>
              <span className="text-sm font-medium" style={{ color: colors.foreground }}>{item.label}</span>
            </div>
            <span className="text-[13px]" style={{ color: colors.mutedForeground }}>{item.value}</span>
          </div>
        ))}
      </div>

      <button
        onClick={handleReset}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-[1.5px] mb-2 bg-white"
        style={{ borderColor: colors.destructive }}
      >
        <Icon name="trash-2" size={16} color={colors.destructive} />
        <span className="text-sm font-semibold" style={{ color: colors.destructive }}>Reset Progress</span>
      </button>
    </div>
  );
}

