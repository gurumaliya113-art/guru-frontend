import type {
  Assignment,
  BatchType,
  ClassRoom,
  GeneratedPaper,
  Membership,
  MembershipStatus,
  Question,
  QuizAttempt,
  UserProfile,
} from "./types";

const ADMIN_TOKEN_KEY = "gurutron.adminToken";

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}
export function setAdminToken(token: string | null) {
  if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token);
  else localStorage.removeItem(ADMIN_TOKEN_KEY);
}

/**
 * Base URL for all API requests.
 * - In local dev: empty (Vite proxy or same-origin) so `/api/...` hits the local backend.
 * - In production on Vercel: set `VITE_API_BASE_URL=https://your-backend.example.com`
 *   in Vercel project env vars so the frontend can reach the deployed backend.
 * Trailing slash is stripped so we can safely concatenate with paths that start with "/".
 */
function normalizeBaseUrl(raw: string): string {
  let v = (raw || "").trim().replace(/\/$/, "");
  if (!v) return "";
  // If user forgot the scheme (e.g. "api.example.com"), default to https://
  if (!/^https?:\/\//i.test(v)) v = `https://${v}`;
  return v;
}
const API_BASE_URL: string = normalizeBaseUrl(
  (import.meta as any).env?.VITE_API_BASE_URL || ""
);

async function request<T>(path: string, init: RequestInit = {}, opts: { admin?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init.headers as Record<string, string>) || {}),
  };
  if (opts.admin) {
    const t = getAdminToken();
    if (t) headers["x-admin-token"] = t;
  }
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    headers,
    credentials: "include" // Include cookies for session authentication
  });
  if (!res.ok) {
    let detail = "";
    try { detail = (await res.json()).error || ""; } catch {}
    throw new Error(`API ${res.status}: ${detail || res.statusText}`);
  }
  return res.json();
}

export interface AdminStats {
  total: number;
  bySubject: Record<string, number>;
  byExam: Record<string, number>;
  byDifficulty: Record<string, number>;
  bySource: Record<string, number>;
}

export interface ParsePdfResult {
  documentId?: string | null;
  parser: string;
  pageCount: number;
  textLength: number;
  isScanned?: boolean;
  questionsCount?: number;
  questions: Question[];
  saved?: boolean;
}

export type ParserMode = "auto" | "groq" | "heuristic" | "gemini" | "ai";

export const api = {
  getProfile: () => request<{ profile: UserProfile | null }>("/api/profile"),
  saveProfile: (profile: UserProfile & { teacherInviteCode?: string }) =>
    request<{ profile: UserProfile }>("/api/profile", {
      method: "PUT",
      body: JSON.stringify(profile),
    }),
  getAttempts: () => request<{ attempts: QuizAttempt[] }>("/api/attempts"),
  addAttempt: (attempt: QuizAttempt) =>
    request<{ attempt: QuizAttempt }>("/api/attempts", {
      method: "POST",
      body: JSON.stringify(attempt),
    }),
  getPapers: () => request<{ papers: GeneratedPaper[] }>("/api/papers"),
  addPaper: (paper: GeneratedPaper) =>
    request<{ paper: GeneratedPaper }>("/api/papers", {
      method: "POST",
      body: JSON.stringify(paper),
    }),
  deletePaper: (id: string) =>
    request<{ ok: true }>(`/api/papers/${encodeURIComponent(id)}`, { method: "DELETE" }),
  reset: () => request<{ ok: true }>("/api/reset", { method: "POST" }),

  // Public questions catalogue
  getQuestions: () => request<{ questions: Question[] }>("/api/questions"),

  // ---- Classes ----
  getMyClasses: () => request<{ classes: ClassRoom[] }>("/api/classes/mine"),
  createClass: (payload: {
    name: string;
    subject?: string;
    classLevel: string;
    batchType: BatchType;
    school?: string;
    teacherName?: string;
  }) =>
    request<{ class: ClassRoom }>("/api/classes", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getClassByCode: (code: string) =>
    request<{ class: ClassRoom }>(`/api/classes/by-code/${encodeURIComponent(code)}`),
  getClassMemberships: (classId: string) =>
    request<{ memberships: Membership[] }>(
      `/api/classes/${encodeURIComponent(classId)}/memberships`
    ),

  // ---- Memberships ----
  getMyMemberships: () =>
    request<{ memberships: Membership[] }>("/api/memberships/mine"),
  joinClass: (payload: {
    code: string;
    studentName: string;
    rollNumber: string;
    parentPhone?: string;
  }) =>
    request<{ membership: Membership }>("/api/memberships", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  decideMembership: (id: string, status: MembershipStatus) =>
    request<{ membership: Membership }>(`/api/memberships/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  // ---- Assignments ----
  getMyAssignments: () =>
    request<{ assignments: Assignment[] }>("/api/assignments/mine"),
  getClassAssignments: (classId: string) =>
    request<{ assignments: Assignment[] }>(
      `/api/classes/${encodeURIComponent(classId)}/assignments`
    ),
  assignPaperToClass: (paperId: string, classId: string) =>
    request<{ assignment: Assignment; alreadyAssigned?: boolean }>(
      `/api/papers/${encodeURIComponent(paperId)}/assign`,
      { method: "POST", body: JSON.stringify({ classId }) }
    ),
  unassign: (id: string) =>
    request<{ ok: true }>(`/api/assignments/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
  getAssignmentsForMe: () =>
    request<{ assignments: Assignment[] }>("/api/assignments/for-me"),
};

// ---- Admin API ----
export const adminApi = {
  login: (email: string, password: string) =>
    request<{ token: string }>("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<{ ok: true }>("/api/admin/logout", { method: "POST" }, { admin: true }),
  me: () => request<{ ok: true; geminiAvailable: boolean; groqAvailable: boolean }>("/api/admin/me", {}, { admin: true }),
  stats: () => request<AdminStats>("/api/admin/stats", {}, { admin: true }),

  listQuestions: () => request<{ questions: Question[] }>("/api/admin/questions", {}, { admin: true }),
  addQuestions: (questions: Partial<Question>[]) =>
    request<{ added: number; questions: Question[] }>("/api/admin/questions", {
      method: "POST",
      body: JSON.stringify({ questions }),
    }, { admin: true }),
  updateQuestion: (id: string, updates: Partial<Question>) =>
    request<{ question: Question }>(`/api/admin/questions/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    }, { admin: true }),
  deleteQuestion: (id: string) =>
    request<{ ok: true }>(`/api/admin/questions/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }, { admin: true }),

  parsePdf: async (
    file: File,
    mode: ParserMode = "auto",
    opts: { save?: boolean; subject?: string; examType?: string; classLevel?: string } = {}
  ): Promise<ParsePdfResult> => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("mode", mode);
    fd.append("save", opts.save === true ? "1" : "0");
    if (opts.subject)    fd.append("subject", opts.subject);
    if (opts.examType)   fd.append("examType", opts.examType);
    if (opts.classLevel) fd.append("classLevel", opts.classLevel);

    const t = getAdminToken();
    const headers: Record<string, string> = {};
    if (t) headers["x-admin-token"] = t;

    const res = await fetch("/api/admin/parse-pdf", {
      method: "POST",
      headers,
      credentials: "include",
      body: fd,
    });
    if (!res.ok) {
      let detail = "";
      try { detail = (await res.json()).error || ""; } catch {}
      throw new Error(`API ${res.status}: ${detail || res.statusText}`);
    }
    return res.json();
  },
};
