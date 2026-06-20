export type ExamType = "NEET" | "JEE" | "BITS" | "BOARD";
export type Subject = "Physics" | "Chemistry" | "Biology" | "Mathematics";
export type Difficulty = "Easy" | "Moderate" | "Hard";
export type Role = "student" | "teacher";
export type ClassLevel = "9" | "10" | "11" | "12";
export type Board = "CBSE" | "ICSE" | "State" | "Other";

// Question fields stay free-form strings so admins can add new
// subjects / boards / classes / types / exams beyond the defaults.
export interface Question {
  id: string;
  subject: string;
  topic: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: Difficulty;
  type: string;
  examType: string[];
  year?: number;
  /** Class level — e.g. "9" / "10" / "11" / "12" or custom */
  classLevel?: string;
  /** Board — e.g. "CBSE" / "ICSE" / "State" / "Other" or custom */
  board?: string;
  /** Whether the question is from NCERT textbook */
  isNCERT?: boolean;
  /** Provenance: "seed" | "manual" | "pdf" | "pdf-ai" — admin metadata */
  source?: string;
  /** ID of the source document (PDF), if extracted */
  documentId?: string;
  /** 1-indexed page number in the source PDF */
  pageNumber?: number | null;
  /** true if the question references a figure / diagram */
  hasFigure?: boolean;
  /** URL of the rendered PDF-page PNG (the diagram). Shown alongside the question. */
  pageImageUrl?: string;
  /** ISO timestamp when added to the bank */
  createdAt?: string;
}

// Topic — admin-curated entry in the topic catalogue. Independent of any
// particular Question so admins can pre-seed an empty syllabus and have it
// show up in the teacher's Paper Generation flow before any questions exist.
export interface Topic {
  id: string;
  subject: string;
  name: string;
  classLevel?: string | null;
  examType?: string | null;
  createdAt?: string;
}

export interface Flashcard {
  id: string;
  subject: string;
  topic: string;
  classLevel?: string | null;
  examType?: string | null;
  question: string;
  answer: string;
  difficulty?: string;
  createdAt?: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  title: string;
  subject: Subject;
  examType: ExamType;
  score: number;
  totalQuestions: number;
  timeSpent: number;
  date: string;
  answers: Record<string, number>;
  weakTopics: string[];
}

export interface GeneratedPaper {
  id: string;
  title: string;
  examType: ExamType;
  subject: Subject;
  topic: string;
  difficulty: Difficulty;
  questions: Question[];
  durationMinutes?: number;
  createdAt: string;
  // Per-paper override: when true, PaperView skips stamping the school
  // header image on the printed PDF even if one is set on the profile.
  skipHeader?: boolean;
}

// Previous Year Paper / Mock — admin-curated, global catalogue. The summary
// shape is returned by the list endpoint (cheap to load); the full shape is
// returned by the detail endpoint (gated by the paywall after 5 free PYPs).
export interface PreviousYearPaperSummary {
  id: string;
  title: string;
  examType: ExamType;
  year: number;
  subject?: string;
  durationMinutes?: number;
  questionCount: number;
  createdAt: string;
}

export interface PreviousYearPaper extends PreviousYearPaperSummary {
  questions: Question[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
}

export interface StudentRecord {
  id: string;
  name: string;
  score: number;
  totalQuizzes: number;
  avgAccuracy: number;
  weakSubject: string;
  lastActive: string;
}

export type BatchType = "toppers" | "normal";

export interface ClassRoom {
  id: string;
  code: string;
  name: string;
  subject?: string;
  classLevel: string; // "1" .. "10"
  batchType: BatchType;
  school?: string;
  teacherId?: string;
  teacherName?: string;
  createdAt?: string;
}

export type MembershipStatus = "pending" | "approved" | "rejected";

export interface Membership {
  id: string;
  classId: string;
  studentId?: string;
  studentName: string;
  rollNumber: string;
  parentPhone?: string;
  status: MembershipStatus;
  createdAt?: string;
  decidedAt?: string;
  class?: ClassRoom;
}

export interface Assignment {
  id: string;
  paperId: string;
  paperTitle?: string;
  classId: string;
  classCode?: string;
  className?: string;
  assignedBy?: string;
  /** Display name of the assigning teacher, hydrated server-side for the
   *  student home-feed ("Manoj sir uploaded …"). */
  assignedByName?: string;
  assignedAt?: string;
  /** Optional ISO deadline. When present, the home-feed renders an
   *  "attempt by …" hint so students see the cut-off at a glance. */
  dueAt?: string;
}

export interface UserProfile {
  name: string;
  role: Role;
  targetExam: ExamType;
  streak: number;
  lastQuizDate: string;
  totalPoints: number;
  badges: Badge[];
  rank: number;
  isOnboarded: boolean;
  /** Display handle (unique-ish, no spaces) — collected at onboarding */
  username?: string;
  /** Contact phone number */
  phone?: string;
  /** School / coaching name */
  schoolName?: string;
  /** Class level for students — "9" / "10" / "11" / "12" or custom */
  classLevel?: string;
  /** Student chose to skip joining a teacher's class and explore the app on their own. */
  skipClassJoin?: boolean;
  /**
   * Teacher-only: data URL of the school / institute header image stamped at
   * the top of every generated paper PDF. Stored on the profile so it persists
   * across sessions and devices once we sync via the profile API.
   */
  paperHeaderImage?: string;

  /**
   * Subscription state for the paywall (Previous Year Papers beyond the first 5,
   * full Progress analytics, etc.). Razorpay payment webhook flips `active`
   * to true and stores `validUntil` when applicable.
   */
  subscription?: {
    active: boolean;
    plan?: string;             // e.g. "yearly-49"
    validUntil?: string;       // ISO date
    razorpayPaymentId?: string;
  };

  /** This user's own unique referral code (e.g. "GURU-MUKUL"). Server-generated. */
  referralCode?: string;
  /** Referral code that brought this user in (immutable once set). */
  referredBy?: string;
}

export interface OnboardingExtras {
  username?: string;
  phone?: string;
  schoolName?: string;
  classLevel?: string;
  skipClassJoin?: boolean;
  /** Invite-only code required when registering as a teacher. */
  teacherInviteCode?: string;
  /** Optional password to set/update on the account. */
  password?: string;
  /** Optional referral code the user was referred by. */
  referredByCode?: string;
}
