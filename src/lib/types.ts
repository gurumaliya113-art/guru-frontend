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
}
