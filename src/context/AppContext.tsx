import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type {
  Badge,
  ExamType,
  GeneratedPaper,
  Question,
  QuizAttempt,
  Role,
  StudentRecord,
  UserProfile,
} from "@/lib/types";

const DEFAULT_BADGES: Badge[] = [
  { id: "topper", name: "Topper", description: "Score 90%+ in a quiz", icon: "award", earned: false },
  { id: "fast-solver", name: "Fast Solver", description: "Complete under 10 min", icon: "zap", earned: false },
  { id: "accuracy-king", name: "Accuracy King", description: "85%+ accuracy over 5 quizzes", icon: "target", earned: false },
  { id: "streak-5", name: "5-Day Streak", description: "Study 5 days in a row", icon: "activity", earned: false },
  { id: "first-paper", name: "Paper Maker", description: "Generate your first paper", icon: "file-text", earned: false },
];

const MOCK_STUDENTS: StudentRecord[] = [
  { id: "s1", name: "Priya Sharma", score: 87, totalQuizzes: 12, avgAccuracy: 82, weakSubject: "Chemistry", lastActive: "Today" },
  { id: "s2", name: "Arjun Mehta", score: 74, totalQuizzes: 8, avgAccuracy: 71, weakSubject: "Physics", lastActive: "Yesterday" },
  { id: "s3", name: "Sneha Patel", score: 91, totalQuizzes: 15, avgAccuracy: 89, weakSubject: "Organic Chemistry", lastActive: "Today" },
  { id: "s4", name: "Rahul Gupta", score: 63, totalQuizzes: 6, avgAccuracy: 60, weakSubject: "Biology", lastActive: "2 days ago" },
  { id: "s5", name: "Ananya Singh", score: 95, totalQuizzes: 20, avgAccuracy: 93, weakSubject: "Waves", lastActive: "Today" },
  { id: "s6", name: "Karan Joshi", score: 58, totalQuizzes: 4, avgAccuracy: 55, weakSubject: "Mathematics", lastActive: "3 days ago" },
];

const DEFAULT_PROFILE: UserProfile = {
  name: "",
  role: "student",
  targetExam: "NEET",
  streak: 0,
  lastQuizDate: "",
  totalPoints: 0,
  badges: DEFAULT_BADGES,
  rank: 142,
  isOnboarded: false,
};

interface AppContextType {
  profile: UserProfile;
  attempts: QuizAttempt[];
  papers: GeneratedPaper[];
  students: StudentRecord[];
  questions: Question[];
  refreshQuestions: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  addAttempt: (attempt: QuizAttempt) => Promise<void>;
  addPaper: (paper: GeneratedPaper) => Promise<void>;
  deletePaper: (id: string) => Promise<void>;
  completeOnboarding: (name: string, role: Role, exam: ExamType) => Promise<void>;
  resetProgress: () => Promise<void>;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [papers, setPapers] = useState<GeneratedPaper[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshQuestions = useCallback(async () => {
    try {
      const q = await api.getQuestions();
      setQuestions(q.questions || []);
    } catch (e) {
      console.warn("[AppContext] questions fetch failed:", e);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [p, a, pp, qs] = await Promise.all([
          api.getProfile(),
          api.getAttempts(),
          api.getPapers(),
          api.getQuestions(),
        ]);
        if (p.profile) setProfile({ ...DEFAULT_PROFILE, ...p.profile });
        setAttempts(a.attempts || []);
        setPapers(pp.papers || []);
        setQuestions(qs.questions || []);
      } catch (e) {
        // Backend unreachable — keep defaults; user will retry by reload.
        console.warn("[AppContext] Backend not reachable yet:", e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const persistProfile = useCallback(async (next: UserProfile) => {
    setProfile(next);
    try { await api.saveProfile(next); } catch (e) { console.error(e); }
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      const next = { ...profile, ...updates };
      await persistProfile(next);
    },
    [profile, persistProfile]
  );

  const completeOnboarding = useCallback(
    async (name: string, role: Role, exam: ExamType) => {
      const next: UserProfile = {
        ...DEFAULT_PROFILE,
        name,
        role,
        targetExam: exam,
        isOnboarded: true,
        badges: DEFAULT_BADGES,
      };
      await persistProfile(next);
    },
    [persistProfile]
  );

  const addAttempt = useCallback(
    async (attempt: QuizAttempt) => {
      setAttempts((prev) => [attempt, ...prev]);
      try { await api.addAttempt(attempt); } catch (e) { console.error(e); }

      const today = new Date().toDateString();
      const streak =
        profile.lastQuizDate === new Date(Date.now() - 86400000).toDateString()
          ? profile.streak + 1
          : profile.lastQuizDate === today
            ? profile.streak
            : 1;
      const next: UserProfile = {
        ...profile,
        streak,
        lastQuizDate: today,
        totalPoints: profile.totalPoints + Math.floor(attempt.score * 10),
      };
      await persistProfile(next);
    },
    [profile, persistProfile]
  );

  const addPaper = useCallback(async (paper: GeneratedPaper) => {
    setPapers((prev) => [paper, ...prev]);
    try { await api.addPaper(paper); } catch (e) { console.error(e); }
  }, []);

  const deletePaper = useCallback(async (id: string) => {
    setPapers((prev) => prev.filter((p) => p.id !== id));
    try { await api.deletePaper(id); } catch (e) { console.error(e); }
  }, []);

  const resetProgress = useCallback(async () => {
    setAttempts([]);
    setPapers([]);
    try { await api.reset(); } catch (e) { console.error(e); }
    const next: UserProfile = { ...profile, streak: 0, totalPoints: 0, lastQuizDate: "" };
    await persistProfile(next);
  }, [profile, persistProfile]);

  return (
    <AppContext.Provider
      value={{
        profile,
        attempts,
        papers,
        students: MOCK_STUDENTS,
        questions,
        refreshQuestions,
        updateProfile,
        addAttempt,
        addPaper,
        deletePaper,
        completeOnboarding,
        resetProgress,
        isLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
