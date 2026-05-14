import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/ui";
import { adminApi, AdminStats } from "@/lib/api";
import { colors, examColor, subjectColor, difficultyColor } from "@/lib/colors";

export default function AdminDashboard() {
  const nav = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    adminApi.stats().then(setStats).catch((e) => setErr(String(e?.message || e)));
  }, []);

  if (err) {
    return <div className="p-8" style={{ color: colors.destructive }}>Error: {err}</div>;
  }
  if (!stats) {
    return <div className="p-8" style={{ color: colors.mutedForeground }}>Loading stats…</div>;
  }

  const breakdownCard = (
    title: string,
    data: Record<string, number>,
    colorFn: (k: string) => string,
  ) => {
    const entries = Object.entries(data).sort(([, a], [, b]) => b - a);
    const max = Math.max(1, ...entries.map(([, v]) => v));
    return (
      <div className="rounded-2xl p-5 border bg-white" style={{ borderColor: colors.border }}>
        <div className="text-[15px] font-semibold mb-4" style={{ color: colors.foreground }}>{title}</div>
        {entries.length === 0 && <div className="text-sm" style={{ color: colors.mutedForeground }}>No data yet</div>}
        {entries.map(([k, v]) => (
          <div key={k} className="mb-3 last:mb-0">
            <div className="flex justify-between text-[13px] mb-1">
              <span style={{ color: colors.foreground }}>{k}</span>
              <span className="font-semibold" style={{ color: colorFn(k) }}>{v}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: colors.muted }}>
              <div style={{ width: `${(v / max) * 100}%`, height: "100%", background: colorFn(k) }} />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="text-[26px] font-bold" style={{ color: colors.foreground }}>Dashboard</div>
          <div className="text-sm" style={{ color: colors.mutedForeground }}>Question bank overview</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => nav("/admin/upload")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm"
            style={{ background: colors.primary }}
          >
            <Icon name="file-text" size={16} color="#fff" /> Upload PDF
          </button>
          <button
            onClick={() => nav("/admin/questions/new")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border bg-white font-semibold text-sm"
            style={{ borderColor: colors.border, color: colors.foreground }}
          >
            <Icon name="plus" size={16} color={colors.foreground} /> Add Question
          </button>
        </div>
      </div>

      <div className="rounded-3xl p-6 mb-6 text-white" style={{ background: "linear-gradient(135deg,#1e3a8a,#2563eb)" }}>
        <div className="text-sm opacity-75 mb-1">Total Questions</div>
        <div className="text-5xl font-bold">{stats.total}</div>
        <div className="text-xs opacity-60 mt-2">across {Object.keys(stats.bySubject).length} subjects</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {breakdownCard("By Subject", stats.bySubject, subjectColor)}
        {breakdownCard("By Exam Type", stats.byExam, examColor)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {breakdownCard("By Difficulty", stats.byDifficulty, difficultyColor)}
        {breakdownCard("By Source", stats.bySource, () => colors.primary)}
      </div>
    </div>
  );
}
