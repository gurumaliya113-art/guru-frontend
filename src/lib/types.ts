export type ExamType = "NEET" | "JEE" | "BOARD";
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
  createdAt: string;
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
  assignedAt?: string;
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
}

export interface OnboardingExtras {
  username?: string;
  phone?: string;
  schoolName?: string;
  classLevel?: string;
  /** Invite-only code required when registering as a teacher. */
  teacherInviteCode?: string;
}
