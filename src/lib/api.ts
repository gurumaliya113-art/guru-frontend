import type { GeneratedPaper, Question, QuizAttempt, UserProfile } from "./types";

const ADMIN_TOKEN_KEY = "smartprep.adminToken";

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}
export function setAdminToken(token: string | null) {
  if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token);
  else localStorage.removeItem(ADMIN_TOKEN_KEY);
}

async function request<T>(path: string, init: RequestInit = {}, opts: { admin?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init.headers as Record<string, string>) || {}),
  };
  if (opts.admin) {
    const t = getAdminToken();
    if (t) headers["x-admin-token"] = t;
  }
  const res = await fetch(path, {
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
  parser: string;
  pageCount: number;
  textLength: number;
  questions: Question[];
}

export const api = {
  getProfile: () => request<{ profile: UserProfile | null }>("/api/profile"),
  saveProfile: (profile: UserProfile) =>
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
};

// ---- Admin API ----
export const adminApi = {
  login: (email: string, password: string) =>
    request<{ token: string }>("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<{ ok: true }>("/api/admin/logout", { method: "POST" }, { admin: true }),
  me: () => request<{ ok: true; geminiAvailable: boolean }>("/api/admin/me", {}, { admin: true }),
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

  parsePdf: async (file: File, mode: "heuristic" | "ai"): Promise<ParsePdfResult> => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("mode", mode);
    const t = getAdminToken();
    const res = await fetch("/api/admin/parse-pdf", {
      method: "POST",
      headers: t ? { "x-admin-token": t, "x-user-id": getUserId() } : { "x-user-id": getUserId() },
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
