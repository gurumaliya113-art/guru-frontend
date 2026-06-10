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

export const examColor = (exam: string) =>
  exam === "NEET" ? colors.neet : exam === "JEE" ? colors.jee : colors.board;

export const examLight = (exam: string) =>
  exam === "NEET" ? colors.neetLight : exam === "JEE" ? colors.jeeLight : colors.boardLight;

export const difficultyColor = (d: string) =>
  d === "Easy" ? colors.neet : d === "Moderate" ? colors.jee : colors.destructive;
