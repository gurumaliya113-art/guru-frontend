// Design tokens — mirrored from the Expo prototype's constants/colors.ts
export const colors = {
  text: "#0f172a",
  background: "#f8fafc",
  foreground: "#0f172a",
  card: "#ffffff",
  cardForeground: "#0f172a",
  primary: "#2563eb",
  primaryForeground: "#ffffff",
  secondary: "#f1f5f9",
  secondaryForeground: "#1e293b",
  muted: "#f1f5f9",
  mutedForeground: "#64748b",
  destructive: "#ef4444",
  destructiveForeground: "#ffffff",
  border: "#e2e8f0",
  neet: "#16a34a",
  neetLight: "#dcfce7",
  neetForeground: "#14532d",
  jee: "#ea580c",
  jeeLight: "#ffedd5",
  jeeForeground: "#7c2d12",
  board: "#7c3aed",
  boardLight: "#ede9fe",
  boardForeground: "#4c1d95",
  bits: "#db2777",
  bitsLight: "#fce7f3",
  bitsForeground: "#9d174d",
  olympiads: "#0891b2",
  olympiadsLight: "#e0f2fe",
  olympiadsForeground: "#0c4a6e",
  success: "#22c55e",
  warning: "#f59e0b",
  info: "#3b82f6",
  physics: "#3b82f6",
  chemistry: "#8b5cf6",
  biology: "#22c55e",
  mathematics: "#f59e0b",
};

export const subjectColor = (subj: string) =>
  ({
    Physics: colors.physics,
    Chemistry: colors.chemistry,
    Biology: colors.biology,
    Mathematics: colors.mathematics,
  }[subj] || colors.primary);

export const examColor = (exam: string) => {
  const e = exam?.toUpperCase();
  if (e === "NEET") return colors.neet;
  if (e === "JEE") return colors.jee;
  if (e === "BITS") return colors.bits;
  if (e === "OLYMPIADS" || e === "OLYMPIAD") return colors.olympiads;
  return colors.board;
};

export const examLight = (exam: string) => {
  const e = exam?.toUpperCase();
  if (e === "NEET") return colors.neetLight;
  if (e === "JEE") return colors.jeeLight;
  if (e === "BITS") return colors.bitsLight;
  if (e === "OLYMPIADS" || e === "OLYMPIAD") return colors.olympiadsLight;
  return colors.boardLight;
};

export const difficultyColor = (d: string) =>
  d === "Easy" ? colors.neet : d === "Moderate" ? colors.jee : colors.destructive;
