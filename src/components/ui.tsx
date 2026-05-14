import React from "react";
import * as Icons from "lucide-react";
import { colors, difficultyColor } from "@/lib/colors";

// ---------- Icon ----------
// Maps Feather/Lucide style names used throughout the prototype to lucide-react components.
const ICON_MAP: Record<string, keyof typeof Icons> = {
  activity: "Activity",
  "alert-circle": "AlertCircle",
  "alert-triangle": "AlertTriangle",
  "arrow-left": "ArrowLeft",
  "arrow-right": "ArrowRight",
  award: "Award",
  "bar-chart": "BarChart",
  "bar-chart-2": "BarChart2",
  "book-open": "BookOpen",
  check: "Check",
  "check-circle": "CheckCircle2",
  "chevron-right": "ChevronRight",
  clock: "Clock",
  cpu: "Cpu",
  droplet: "Droplet",
  edit: "Pencil",
  "edit-2": "Pencil",
  eye: "Eye",
  "eye-off": "EyeOff",
  feather: "Feather",
  "file-plus": "FilePlus",
  "file-text": "FileText",
  "file-x": "FileX",
  "help-circle": "HelpCircle",
  inbox: "Inbox",
  info: "Info",
  lock: "Lock",
  percent: "Percent",
  play: "Play",
  "play-circle": "PlayCircle",
  plus: "Plus",
  "refresh-cw": "RefreshCw",
  shield: "Shield",
  send: "Send",
  star: "Star",
  target: "Target",
  "trash-2": "Trash2",
  "trending-up": "TrendingUp",
  user: "User",
  users: "Users",
  "x": "X",
  "x-circle": "XCircle",
  zap: "Zap",
};

export function Icon({
  name,
  size = 18,
  color,
  className,
}: {
  name: string;
  size?: number;
  color?: string;
  className?: string;
}) {
  const key = ICON_MAP[name] || "Circle";
  const Cmp = (Icons as any)[key] || Icons.Circle;
  return <Cmp size={size} color={color} className={className} strokeWidth={2} />;
}

// ---------- ProgressBar ----------
export function ProgressBar({
  progress,
  color = colors.primary,
  height = 6,
}: {
  progress: number;
  color?: string;
  height?: number;
}) {
  const pct = Math.min(100, Math.max(0, progress * 100));
  return (
    <div
      style={{ height, background: colors.muted, borderRadius: 999, overflow: "hidden" }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: color,
          borderRadius: 999,
          transition: "width 300ms ease",
        }}
      />
    </div>
  );
}

// ---------- StatCard ----------
export function StatCard({
  label,
  value,
  color,
  bgColor,
}: {
  label: string;
  value: string | number;
  color?: string;
  bgColor?: string;
}) {
  return (
    <div
      className="flex-1 rounded-2xl border p-4 flex flex-col items-center shadow-sm"
      style={{ background: bgColor || colors.card, borderColor: colors.border }}
    >
      <div className="text-2xl font-bold" style={{ color: color || colors.primary }}>
        {value}
      </div>
      <div className="text-[11px]" style={{ color: colors.mutedForeground }}>
        {label}
      </div>
    </div>
  );
}

// ---------- QuizCard ----------
export function QuizCard({
  title,
  subject,
  questionsCount,
  timeLimit,
  difficulty,
  tag,
  tagColor,
  tagBg,
  onClick,
}: {
  title: string;
  subject: string;
  questionsCount: number;
  timeLimit: number;
  difficulty: string;
  tag?: string;
  tagColor?: string;
  tagBg?: string;
  onClick: () => void;
}) {
  const diff = difficultyColor(difficulty);
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl border p-4 mb-3 shadow-sm bg-white hover:shadow-md active:scale-[0.99] transition"
      style={{ borderColor: colors.border }}
    >
      <div className="flex items-start justify-between mb-1">
        <div className="font-semibold text-[15px] leading-snug pr-2" style={{ color: colors.foreground }}>
          {title}
        </div>
        {tag && (
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
            style={{ background: tagBg, color: tagColor }}
          >
            {tag}
          </span>
        )}
      </div>
      <div className="text-xs mb-3" style={{ color: colors.mutedForeground }}>{subject}</div>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1 text-xs" style={{ color: colors.mutedForeground }}>
          <Icon name="help-circle" size={13} color={colors.mutedForeground} />
          {questionsCount} Qs
        </span>
        <span className="flex items-center gap-1 text-xs" style={{ color: colors.mutedForeground }}>
          <Icon name="clock" size={13} color={colors.mutedForeground} />
          {timeLimit} min
        </span>
        <span
          className="ml-auto text-[11px] font-semibold px-2 py-0.5 rounded-md"
          style={{ background: diff + "20", color: diff }}
        >
          {difficulty}
        </span>
      </div>
    </button>
  );
}

// ---------- Spinner ----------
export function Spinner({ size = 18, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <span
      className="spin inline-block rounded-full border-2 border-t-transparent"
      style={{ width: size, height: size, borderColor: color, borderTopColor: "transparent" }}
    />
  );
}
