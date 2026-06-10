// AdminPYP — admin-side catalogue of Previous Year Papers / Mocks.
//
// Workflow:
//   1. Admin uses the existing /admin/upload pipeline to parse a PDF into
//      questions and saves them (or maintains a hand-curated set on
//      /admin/questions). They copy the questions JSON.
//   2. On this page they fill in title / exam / year / subject / duration
//      and paste the questions JSON. We POST to /api/admin/pyp which wraps
//      it as a standalone PYP row visible to students at /pyp.
//
// We deliberately keep this dead-simple — a textarea for JSON — instead of
// a full question editor, because the admin already has /admin/questions
// for editing the question bank. PYPs are just curated snapshots.

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui";
import { adminApi } from "@/lib/api";
import { colors } from "@/lib/colors";
import type { PreviousYearPaperSummary } from "@/lib/types";

const EXAMS = ["NEET", "JEE", "BOARD"] as const;

export default function AdminPYP() {
  const [pyps, setPyps] = useState<PreviousYearPaperSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [examType, setExamType] = useState<(typeof EXAMS)[number]>("NEET");
  const [year, setYear] = useState<string>(String(new Date().getFullYear() - 1));
  const [subject, setSubject] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [questionsJson, setQuestionsJson] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await adminApi.listPyps();
      setPyps(r.pyps || []);
    } catch (e) {
      setError(String((e as Error).message || e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    if (!title.trim()) return setError("Title is required.");
    const y = Number(year);
    if (!Number.isInteger(y) || y < 1990 || y > 2100) {
      return setError("Year must be a 4-digit year between 1990 and 2100.");
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(questionsJson);
    } catch {
      return setError("Questions JSON is not valid JSON.");
    }
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return setError("Questions JSON must be a non-empty array.");
    }

    setSubmitting(true);
    try {
      await adminApi.addPyp({
        title: title.trim(),
        examType,
        year: y,
        subject: subject.trim() || undefined,
        durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
        questions: parsed as never,
      });
      setSuccess(`Added "${title.trim()}" with ${(parsed as unknown[]).length} questions.`);
      setTitle("");
      setSubject("");
      setDurationMinutes("");
      setQuestionsJson("");
      await load();
    } catch (e) {
      setError(String((e as Error).message || e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this PYP? Students will lose access immediately.")) return;
    try {
      await adminApi.deletePyp(id);
      await load();
    } catch (e) {
      alert(String((e as Error).message || e));
    }
  };

  return (
    <div className="p-6 max-w-[1100px]">
      <div className="mb-6">
        <div className="text-[20px] font-bold" style={{ color: colors.foreground }}>
          Super App
        </div>
        <div className="text-[13px]" style={{ color: colors.mutedForeground }}>
          Curated catalogue surfaced to students at <code>/pyp</code>. First 5 are free; the rest are paywalled.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add form */}
        <div className="rounded-2xl border bg-white p-5" style={{ borderColor: colors.border }}>
          <div className="text-[15px] font-semibold mb-4" style={{ color: colors.foreground }}>
            Add new PYP / Mock
          </div>

          <Label>Title</Label>
          <Input
            value={title}
            onChange={setTitle}
            placeholder='e.g. "NEET 2023 Paper 1"'
          />

          <div className="grid grid-cols-3 gap-2 mt-3">
            <div>
              <Label>Exam</Label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value as (typeof EXAMS)[number])}
                className="w-full px-3 py-2 rounded-xl border outline-none text-[14px]"
                style={{ borderColor: colors.border, background: colors.card, color: colors.foreground }}
              >
                {EXAMS.map((x) => (
                  <option key={x} value={x}>{x}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Year</Label>
              <Input value={year} onChange={setYear} placeholder="2023" />
            </div>
            <div>
              <Label>Duration (min)</Label>
              <Input
                value={durationMinutes}
                onChange={setDurationMinutes}
                placeholder="180"
              />
            </div>
          </div>

          <Label>Subject (optional)</Label>
          <Input value={subject} onChange={setSubject} placeholder="Physics" />

          <Label>Questions JSON</Label>
          <div className="text-[11px] mb-1.5" style={{ color: colors.mutedForeground }}>
            Paste an array of Question objects from the question bank (or
            from a parsed PDF preview).
          </div>
          <textarea
            value={questionsJson}
            onChange={(e) => setQuestionsJson(e.target.value)}
            rows={10}
            placeholder='[ { "id": "q1", "subject": "Physics", "text": "...", "options": ["a","b","c","d"], "correctIndex": 0, ... } ]'
            className="w-full px-3 py-2 rounded-xl border outline-none text-[12px] font-mono"
            style={{ borderColor: colors.border, background: colors.card, color: colors.foreground }}
          />

          {error && (
            <div
              className="mt-3 rounded-xl p-3 text-[13px]"
              style={{ background: "#fef2f2", color: "#991b1b" }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              className="mt-3 rounded-xl p-3 text-[13px]"
              style={{ background: "#dcfce7", color: "#166534" }}
            >
              {success}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-4 w-full py-3 rounded-2xl text-white font-bold disabled:opacity-50"
            style={{ background: colors.primary }}
          >
            {submitting ? "Saving…" : "Add Paper"}
          </button>
        </div>

        {/* Catalogue list */}
        <div className="rounded-2xl border bg-white p-5" style={{ borderColor: colors.border }}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-[15px] font-semibold" style={{ color: colors.foreground }}>
              Catalogue ({pyps.length})
            </div>
            <button
              onClick={load}
              className="text-[12px] font-semibold flex items-center gap-1"
              style={{ color: colors.primary }}
            >
              <Icon name="refresh-cw" size={12} color={colors.primary} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-[13px]" style={{ color: colors.mutedForeground }}>
              Loading…
            </div>
          ) : pyps.length === 0 ? (
            <div
              className="rounded-xl border-2 border-dashed p-6 text-center text-[12px]"
              style={{ borderColor: colors.border, color: colors.mutedForeground }}
            >
              No PYPs yet. Add one from the form on the left.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {pyps.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-xl border p-3"
                  style={{ borderColor: colors.border }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: colors.muted }}
                  >
                    <Icon name="file-text" size={16} color={colors.mutedForeground} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[13px] font-semibold truncate"
                      style={{ color: colors.foreground }}
                    >
                      {p.title}
                    </div>
                    <div
                      className="text-[11px]"
                      style={{ color: colors.mutedForeground }}
                    >
                      {p.examType} · {p.year}
                      {p.subject ? ` · ${p.subject}` : ""}
                      {" · "}{p.questionCount}Q
                      {p.durationMinutes ? ` · ${p.durationMinutes} min` : ""}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="px-2 py-1 rounded-md text-[11px] font-semibold"
                    style={{ background: "#fef2f2", color: "#dc2626" }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Small helpers ----------
function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[12px] font-semibold mt-3 mb-1"
      style={{ color: colors.foreground }}
    >
      {children}
    </div>
  );
}
function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-xl border outline-none text-[14px]"
      style={{
        borderColor: colors.border,
        background: colors.card,
        color: colors.foreground,
      }}
    />
  );
}
