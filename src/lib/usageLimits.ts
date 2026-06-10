const STORAGE_KEY = "gurutron_usage_limits_v1";

export type UsageFeature = "doubts" | "flashcards" | "papers";

interface UsageSnapshot {
  dayKey: string;
  doubtsUsed: number;
  flashcardsViewed: number;
  papersAttempted: number;
}

const LIMITS: Record<UsageFeature, number> = {
  doubts: 5,
  flashcards: 7,
  papers: 3,
};

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function readSnapshot(): UsageSnapshot {
  if (typeof window === "undefined") {
    return {
      dayKey: getTodayKey(),
      doubtsUsed: 0,
      flashcardsViewed: 0,
      papersAttempted: 0,
    };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        dayKey: getTodayKey(),
        doubtsUsed: 0,
        flashcardsViewed: 0,
        papersAttempted: 0,
      };
    }

    const parsed = JSON.parse(raw) as Partial<UsageSnapshot>;
    const dayKey = getTodayKey();

    if (parsed.dayKey !== dayKey) {
      return {
        dayKey,
        doubtsUsed: 0,
        flashcardsViewed: 0,
        papersAttempted: 0,
      };
    }

    return {
      dayKey,
      doubtsUsed: Number(parsed.doubtsUsed || 0),
      flashcardsViewed: Number(parsed.flashcardsViewed || 0),
      papersAttempted: Number(parsed.papersAttempted || 0),
    };
  } catch {
    return {
      dayKey: getTodayKey(),
      doubtsUsed: 0,
      flashcardsViewed: 0,
      papersAttempted: 0,
    };
  }
}

export function getUsageStats() {
  return readSnapshot();
}

export function canUseFeature(feature: UsageFeature, subscribed: boolean) {
  if (subscribed) return true;
  return getUsageStats()[feature === "doubts" ? "doubtsUsed" : feature === "flashcards" ? "flashcardsViewed" : "papersAttempted"] < LIMITS[feature];
}

export function getRemaining(feature: UsageFeature, subscribed: boolean) {
  if (subscribed) return "Unlimited";
  const used = getUsageStats()[feature === "doubts" ? "doubtsUsed" : feature === "flashcards" ? "flashcardsViewed" : "papersAttempted"];
  return Math.max(LIMITS[feature] - used, 0);
}

export function recordFeatureUse(feature: UsageFeature) {
  const snapshot = readSnapshot();
  const updated = {
    ...snapshot,
    dayKey: getTodayKey(),
    doubtsUsed: snapshot.doubtsUsed + (feature === "doubts" ? 1 : 0),
    flashcardsViewed: snapshot.flashcardsViewed + (feature === "flashcards" ? 1 : 0),
    papersAttempted: snapshot.papersAttempted + (feature === "papers" ? 1 : 0),
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  return updated;
}
