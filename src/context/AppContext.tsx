import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type {
  Assignment,
  Badge,
  BatchType,
  ClassRoom,
  ExamType,
  GeneratedPaper,
  Membership,
  MembershipStatus,
  OnboardingExtras,
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

// No mock students — the teacher dashboard now reflects real class membership
// data only. Student records will be populated once we have per-student quiz
// metrics wired up; until then the dashboard shows empty states.
const MOCK_STUDENTS: StudentRecord[] = [];

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

interface CreateClassInput {
  name: string;
  subject?: string;
  classLevel: string;
  batchType: BatchType;
  school?: string;
  teacherName?: string;
}

interface JoinClassInput {
  code: string;
  studentName: string;
  rollNumber: string;
  parentPhone?: string;
}

interface AppContextType {
  profile: UserProfile;
  attempts: QuizAttempt[];
  papers: GeneratedPaper[];
  students: StudentRecord[];
  questions: Question[];
  classes: ClassRoom[];
  myMemberships: Membership[];
  refreshQuestions: () => Promise<void>;
  refreshClasses: () => Promise<void>;
  refreshMemberships: () => Promise<void>;
  createClass: (input: CreateClassInput) => Promise<ClassRoom>;
  joinClass: (input: JoinClassInput) => Promise<Membership>;
  decideMembership: (id: string, status: MembershipStatus) => Promise<Membership>;
  getClassMemberships: (classId: string) => Promise<Membership[]>;
  assignPaperToClass: (paperId: string, classId: string) => Promise<{ assignment: Assignment; alreadyAssigned?: boolean }>;
  getMyAssignments: () => Promise<Assignment[]>;
  getClassAssignments: (classId: string) => Promise<Assignment[]>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  addAttempt: (attempt: QuizAttempt) => Promise<void>;
  addPaper: (paper: GeneratedPaper) => Promise<void>;
  /** Merge an already-persisted paper into local state without re-POSTing.
   *  Used by the capture-upload flow where the server has already saved it. */
  attachPaper: (paper: GeneratedPaper) => void;
  deletePaper: (id: string) => Promise<void>;
  completeOnboarding: (name: string, role: Role, exam: ExamType, extras?: OnboardingExtras) => Promise<void>;
  upgradeToTeacher: () => Promise<void>;
  resetProgress: () => Promise<void>;
  isLoading: boolean;
  /** True once the initial authenticated fetch has completed. */
  dataLoaded: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [papers, setPapers] = useState<GeneratedPaper[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [myMemberships, setMyMemberships] = useState<Membership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  /** True only after we have successfully fetched user-scoped data at least once
      while authenticated. The class-onboarding guard waits on this so we don't
      flicker to /class/create before classes are loaded. */
  const [dataLoaded, setDataLoaded] = useState(false);
  /** Flag to prevent the useEffect from overwriting profile during onboarding */
  const onboardingInProgress = React.useRef(false);

  const refreshQuestions = useCallback(async () => {
    try {
      const q = await api.getQuestions();
      setQuestions(q.questions || []);
    } catch (e) {
      console.warn("[AppContext] questions fetch failed:", e);
    }
  }, []);

  const refreshClasses = useCallback(async () => {
    try {
      const r = await api.getMyClasses();
      setClasses(r.classes || []);
    } catch (e) {
      console.warn("[AppContext] classes fetch failed:", e);
    }
  }, []);

  const refreshMemberships = useCallback(async () => {
    try {
      const r = await api.getMyMemberships();
      setMyMemberships(r.memberships || []);
    } catch (e) {
      console.warn("[AppContext] memberships fetch failed:", e);
    }
  }, []);

  const createClass = useCallback(
    async (input: CreateClassInput) => {
      const r = await api.createClass(input);
      setClasses((prev) => [r.class, ...prev]);
      return r.class;
    },
    []
  );

  const joinClass = useCallback(
    async (input: JoinClassInput) => {
      const r = await api.joinClass(input);
      setMyMemberships((prev) => {
        const others = prev.filter((m) => m.id !== r.membership.id);
        return [r.membership, ...others];
      });
      return r.membership;
    },
    []
  );

  const decideMembership = useCallback(
    async (id: string, status: MembershipStatus) => {
      const r = await api.decideMembership(id, status);
      return r.membership;
    },
    []
  );

  const getClassMemberships = useCallback(async (classId: string) => {
    const r = await api.getClassMemberships(classId);
    return r.memberships || [];
  }, []);

  const assignPaperToClass = useCallback(
    async (paperId: string, classId: string) => {
      const r = await api.assignPaperToClass(paperId, classId);
      return r;
    },
    []
  );

  const getMyAssignments = useCallback(async () => {
    const r = await api.getMyAssignments();
    return r.assignments || [];
  }, []);

  const getClassAssignments = useCallback(async (classId: string) => {
    const r = await api.getClassAssignments(classId);
    return r.assignments || [];
  }, []);

  useEffect(() => {
    // Wait until AuthContext has resolved before deciding what to fetch.
    if (authLoading) return;

    // Not logged in: clear user-scoped state and stop loading so the login
    // screen renders immediately.
    if (!isAuthenticated) {
      setProfile(DEFAULT_PROFILE);
      setAttempts([]);
      setPapers([]);
      setClasses([]);
      setMyMemberships([]);
      setDataLoaded(false);
      setIsLoading(false);
      return;
    }

    // Skip fetch if onboarding is in progress to prevent race condition
    if (onboardingInProgress.current) return;

    let cancelled = false;
    setIsLoading(true);
    (async () => {
      try {
        const [p, a, pp, qs, cls, mems] = await Promise.all([
          api.getProfile(),
          api.getAttempts(),
          api.getPapers(),
          api.getQuestions(),
          api.getMyClasses().catch(() => ({ classes: [] as ClassRoom[] })),
          api.getMyMemberships().catch(() => ({ memberships: [] as Membership[] })),
        ]);
        if (cancelled) return;
        if (p.profile) setProfile({ ...DEFAULT_PROFILE, ...p.profile });
        setAttempts(a.attempts || []);
        setPapers(pp.papers || []);
        setQuestions(qs.questions || []);
        setClasses(cls.classes || []);
        setMyMemberships(mems.memberships || []);
        setDataLoaded(true);
      } catch (e) {
        if (!cancelled) console.warn("[AppContext] Backend not reachable yet:", e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, authLoading]);

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
    async (name: string, role: Role, exam: ExamType, extras?: OnboardingExtras) => {
      const { teacherInviteCode, password, ...profileExtras } = extras || {};
      const next: UserProfile = {
        ...DEFAULT_PROFILE,
        name,
        role,
        targetExam: exam,
        isOnboarded: true,
        badges: DEFAULT_BADGES,
        ...profileExtras,
      };
      // Send invite code + raw password to server. Neither is stored locally
      // on the profile — the server hashes the password and strips both.
      setProfile(next);
      onboardingInProgress.current = true;
      try {
        await api.saveProfile({ ...next, teacherInviteCode, password });
        // Re-assert the saved profile locally. This guards against a race
        // where the post-signup auto-fetch in this provider overwrites our
        // optimistic state with the pre-save server profile.
        setProfile(next);
        setDataLoaded(true);
      } catch (e) {
        // Roll back the optimistic profile on failure so the user can retry.
        setProfile(profile);
        throw e;
      } finally {
        onboardingInProgress.current = false;
      }
    },
    [profile]
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
    // Optimistically add, but roll back if the server rejects so the paper
    // can never appear in the list without also existing on the backend
    // (otherwise downstream actions like "Assign to class" 404 with
    // "Paper not found").
    setPapers((prev) => [paper, ...prev]);
    try {
      await api.addPaper(paper);
    } catch (e) {
      console.error(e);
      setPapers((prev) => prev.filter((p) => p.id !== paper.id));
      throw e;
    }
  }, []);

  const attachPaper = useCallback((paper: GeneratedPaper) => {
    setPapers((prev) => {
      // Replace if same id already present, otherwise prepend.
      const others = prev.filter((p) => p.id !== paper.id);
      return [paper, ...others];
    });
  }, []);

  const deletePaper = useCallback(async (id: string) => {
    setPapers((prev) => prev.filter((p) => p.id !== id));
    try { await api.deletePaper(id); } catch (e) { console.error(e); }
  }, []);

  const resetProgress = useCallback(async () => {
    setAttempts([]);
    setPapers([]);
    setMyMemberships([]);
    try { await api.reset(); } catch (e) { console.error(e); }
    const next: UserProfile = { ...profile, streak: 0, totalPoints: 0, lastQuizDate: "" };
    await persistProfile(next);
  }, [profile, persistProfile]);

  const upgradeToTeacher = useCallback(async () => {
    setAttempts([]);
    setPapers([]);
    setMyMemberships([]);
    try { await api.reset(); } catch (e) { console.error(e); }
    const next: UserProfile = {
      ...profile,
      role: "teacher",
      isOnboarded: true,
      streak: 0,
      totalPoints: 0,
      lastQuizDate: "",
      skipClassJoin: false,
    };
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
        classes,
        myMemberships,
        refreshQuestions,
        refreshClasses,
        refreshMemberships,
        createClass,
        joinClass,
        decideMembership,
        getClassMemberships,
        assignPaperToClass,
        getMyAssignments,
        getClassAssignments,
        updateProfile,
        addAttempt,
        addPaper,
        attachPaper,
        deletePaper,
        completeOnboarding,
        upgradeToTeacher,
        resetProgress,
        isLoading,
        dataLoaded,
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
