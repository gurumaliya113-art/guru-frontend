import type {
  Assignment,
  BatchType,
  ClassRoom,
  GeneratedPaper,
  Membership,
  MembershipStatus,
  PreviousYearPaper,
  PreviousYearPaperSummary,
  Question,
  QuizAttempt,
  Topic,
  UserProfile,
} from "./types";

const ADMIN_TOKEN_KEY = "gurutron.adminToken";
const ADMIN_AUTH_EXPIRED_EVENT = "gurutron:admin-auth-expired";

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}
export function setAdminToken(token: string | null) {
  if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token);
  else localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export function clearAdminTokenAndNotify() {
  setAdminToken(null);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ADMIN_AUTH_EXPIRED_EVENT));
  }
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
    if (opts.admin && res.status === 401) {
      clearAdminTokenAndNotify();
    }
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

export type ParserMode = "auto" | "groq" | "heuristic" | "gemini" | "ai" | "raw";

export const api = {
  getProfile: () => request<{ profile: UserProfile | null }>("/api/profile"),
  saveProfile: (profile: UserProfile & { teacherInviteCode?: string; password?: string }) =>
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
  getPaper: (id: string) =>
    request<{ paper: GeneratedPaper }>(`/api/papers/${encodeURIComponent(id)}`),
  addPaper: (paper: GeneratedPaper) =>
    request<{ paper: GeneratedPaper }>("/api/papers", {
      method: "POST",
      body: JSON.stringify(paper),
    }),
  // Upload a "captured" paper — N image snapshots that get turned into a
  // single image-only paper on the backend. Returns the created paper so
  // the caller can immediately navigate to /paper/:id or assign it.
  uploadCapture: async (payload: {
    title: string;
    examType?: string;
    subject?: string;
    topic?: string;
    difficulty?: string;
    images: File[];
  }): Promise<{ paper: GeneratedPaper }> => {
    const fd = new FormData();
    fd.append("title", payload.title);
    if (payload.examType) fd.append("examType", payload.examType);
    if (payload.subject) fd.append("subject", payload.subject);
    if (payload.topic) fd.append("topic", payload.topic);
    if (payload.difficulty) fd.append("difficulty", payload.difficulty);
    payload.images.forEach((f) => fd.append("images", f, f.name));
    const url = `${API_BASE_URL}/api/papers/capture`;
    const res = await fetch(url, {
      method: "POST",
      body: fd,
      credentials: "include",
      // NOTE: don't set Content-Type — the browser must add the multipart boundary.
    });
    if (!res.ok) {
      let detail = "";
      try { detail = (await res.json()).error || ""; } catch { /* ignore */ }
      throw new Error(`API ${res.status}: ${detail || res.statusText}`);
    }
    return res.json();
  },
  deletePaper: (id: string) =>
    request<{ ok: true }>(`/api/papers/${encodeURIComponent(id)}`, { method: "DELETE" }),
  reset: () => request<{ ok: true }>("/api/reset", { method: "POST" }),

  // Public questions catalogue
  getQuestions: () => request<{ questions: Question[] }>("/api/questions"),

  // Public topics catalogue (admin-managed). Surfaced in PaperGenerate so
  // teachers see exactly what admins curated for them.
  getTopics: () => request<{ topics: Topic[] }>('/api/topics'),
  getFlashcards: () => request<{ flashcards: Flashcard[] }>('/api/flashcards'),

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

  // ---- Previous Year Papers / Mocks ----
  // Listing is public (no auth). Detail requires auth and enforces the
  // 5-free-then-₹49 paywall server-side (HTTP 402 with code "PAYWALL").
  getPyps: () => request<{ pyps: PreviousYearPaperSummary[] }>("/api/pyp"),
  getPyp: (id: string) =>
    request<{ pyp: PreviousYearPaper }>(`/api/pyp/${encodeURIComponent(id)}`),

  // ---- Razorpay subscription payments ----
  getPaymentConfig: () =>
    request<{
      configured: boolean;
      keyId: string | null;
      amount: number;
      currency: string;
      plan: string;
      plans?: { id: string; amount: number; currency: string; label: string; description: string; validityDays: number | null }[];
    }>("/api/payments/config"),
  createPaymentOrder: (planId?: string) =>
    request<{ orderId: string; amount: number; currency: string; keyId: string }>(
      "/api/payments/create-order",
      { method: "POST", body: JSON.stringify({ plan: planId }) },
    ),
  verifyPayment: (payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    plan?: string;
  }) =>
    request<{
      ok: true;
      subscription: { active: boolean; plan?: string; validUntil?: string; razorpayPaymentId?: string };
    }>("/api/payments/verify", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

// ---- Admin API ----
export const adminApi = {
  login: (email: string, password: string) =>
    (async () => {
      const res = await fetch(`/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        let detail = "";
        try { detail = (await res.json()).error || ""; } catch {}
        throw new Error(`API ${res.status}: ${detail || res.statusText}`);
      }
      return res.json();
    })(),
  logout: () => request<{ ok: true }>("/api/admin/logout", { method: "POST" }, { admin: true }),
  me: async () => {
    const t = getAdminToken();
    if (t === "LOCAL-BYPASS" && (import.meta as any).env?.DEV) {
      return { ok: true, geminiAvailable: false, groqAvailable: false };
    }
    return request<{ ok: true; geminiAvailable: boolean; groqAvailable: boolean }>("/api/admin/me", {}, { admin: true });
  },
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

  // ---- Topics catalogue (admin) ----
  listTopics: () =>
    request<{ topics: Topic[] }>("/api/admin/topics", {}, { admin: true }),
  addTopic: (payload: { subject: string; name: string; classLevel?: string | null; examType?: string | null }) =>
    request<{ topic: Topic }>("/api/admin/topics", {
      method: "POST",
      body: JSON.stringify(payload),
    }, { admin: true }),
  deleteTopic: (id: string) =>
    request<{ ok: true }>(`/api/admin/topics/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }, { admin: true }),

  // ---- Flashcards deck (admin) ----
  listFlashcards: () =>
    request<{ flashcards: Flashcard[] }>('/api/admin/flashcards', {}, { admin: true }),
  addFlashcard: (payload: {
    subject: string;
    topic: string;
    classLevel?: string | null;
    examType?: string | null;
    question: string;
    answer: string;
    difficulty?: string;
  }) =>
    request<{ flashcard: Flashcard }>('/api/admin/flashcards', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, { admin: true }),
  deleteFlashcard: (id: string) =>
    request<{ ok: true }>(`/api/admin/flashcards/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }, { admin: true }),

  // ---- Previous Year Papers / Mocks (admin) ----
  listPyps: () =>
    request<{ pyps: PreviousYearPaperSummary[] }>("/api/admin/pyp", {}, { admin: true }),
  addPyp: (payload: {
    title: string;
    examType: string;
    year: number;
    subject?: string;
    durationMinutes?: number;
    questions: Partial<Question>[];
  }) =>
    request<{ pyp: PreviousYearPaper }>("/api/admin/pyp", {
      method: "POST",
      body: JSON.stringify(payload),
    }, { admin: true }),
  deletePyp: (id: string) =>
    request<{ ok: true }>(`/api/admin/pyp/${encodeURIComponent(id)}`, {
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
