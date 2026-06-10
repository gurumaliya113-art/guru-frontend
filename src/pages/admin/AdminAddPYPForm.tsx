import { useEffect, useRef, useState } from "react";
import { Icon, Spinner } from "@/components/ui";
import { adminApi, getAdminToken } from "@/lib/api";
import { colors } from "@/lib/colors";
import type { Question, PreviousYearPaperSummary } from "@/lib/types";

const EXAMS = ["NEET", "JEE", "BOARD"] as const;
const SUBJECTS = ["Physics", "Chemistry", "Biology", "Mathematics"];
const DIFFICULTIES = ["Easy", "Moderate", "Hard"];

interface EditableQuestion {
  text: string;
  options: string[];
  correctIndex: number;
  subject: string;
  topic: string;
  difficulty: string;
  examType: string[];
  explanation: string;
  type: string;
  year?: number;
  classLevel?: string;
  isNCERT?: boolean;
  pageImageUrl?: string;
}

export default function AdminAddPYPForm() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pyps, setPyps] = useState<PreviousYearPaperSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // PYP metadata
  const [title, setTitle] = useState("");
  const [examType, setExamType] = useState<(typeof EXAMS)[number]>("NEET");
  const [year, setYear] = useState<string>(String(new Date().getFullYear() - 1));
  const [subject, setSubject] = useState("Physics");
  const [durationMinutes, setDurationMinutes] = useState("180");

  // PDF upload & parsing
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [questions, setQuestions] = useState<EditableQuestion[]>([]);
  const [selectedCount, setSelectedCount] = useState<number | null>(null);

  // Save state
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await adminApi.listPyps();
      setPyps(r.pyps || []);
    } catch (e) {
      console.error("Failed to load PYPs:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setParseError("");
      setQuestions([]);
      setSelectedCount(null);
    }
  };

  const parsePdf = async () => {
    if (!file) return;
    if (!title.trim()) {
      setParseError("Please enter a paper title first");
      return;
    }

    setParsing(true);
    setParseError("");
    try {
      const result = await adminApi.parsePdf(file, "auto", {
        subject,
        examType,
      });

      const qs: EditableQuestion[] = result.questions.map((q: any) => ({
        text: q.text || "",
        options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ["", "", "", ""],
        correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : 0,
        subject: q.subject || subject || "Physics",
        topic: q.topic || "",
        difficulty: q.difficulty || "Moderate",
        examType: [examType],
        type: "MCQ",
        explanation: q.explanation || "",
        year: Number(year),
        pageImageUrl: q.pageImageUrl,
      }));

      setQuestions(qs);
      setSelectedCount(qs.length);
    } catch (e: any) {
      setParseError(e?.message || "Failed to parse PDF");
    } finally {
      setParsing(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (questions.length === 0) {
      setError("No questions to save");
      return;
    }

    const y = Number(year);
    if (!Number.isInteger(y) || y < 1990 || y > 2100) {
      setError("Year must be between 1990 and 2100");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await adminApi.addPyp({
        title: title.trim(),
        examType,
        year: y,
        subject: subject.trim() || undefined,
        durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
        questions: questions as any,
      });

      setSuccess(`✓ Added "${title}" with ${questions.length} questions!`);
      setTitle("");
      setSubject("Physics");
      setDurationMinutes("180");
      setFile(null);
      setQuestions([]);
      if (fileRef.current) fileRef.current.value = "";
      await load();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e?.message || "Failed to save paper");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this PYP? Students will lose access.")) return;
    try {
      await adminApi.deletePyp(id);
      await load();
    } catch (e) {
      alert(String(e));
    }
  };

  return (
    <div className="min-h-full p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2" style={{ color: colors.foreground }}>
          📄 Add Previous Year Paper
        </h1>
        <p style={{ color: colors.mutedForeground }}>
          Upload a PDF, review extracted questions, and save as a paper. That's it!
        </p>
      </div>

      {error && (
        <div
          className="rounded-lg p-4 mb-6 border flex gap-3"
          style={{ background: "#fee2e2", borderColor: colors.destructive, color: colors.destructive }}
        >
          <Icon name="alert-circle" size={20} />
          <div>{error}</div>
        </div>
      )}

      {success && (
        <div
          className="rounded-lg p-4 mb-6 border flex gap-3"
          style={{ background: colors.neetLight, borderColor: colors.neet, color: colors.neet }}
        >
          <Icon name="check-circle" size={20} />
          <div>{success}</div>
        </div>
      )}

      {parseError && (
        <div
          className="rounded-lg p-4 mb-6 border flex gap-3"
          style={{ background: "#fef3c7", borderColor: "#fcd34d", color: "#92400e" }}
        >
          <Icon name="alert-circle" size={20} />
          <div>{parseError}</div>
        </div>
      )}

      {/* STEP 1: Paper Metadata */}
      <div className="rounded-lg border p-6 mb-6" style={{ borderColor: colors.border }}>
        <h2 className="text-lg font-bold mb-4" style={{ color: colors.foreground }}>
          Step 1️⃣ Paper Details
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold block mb-1" style={{ color: colors.foreground }}>
              Title *
            </label>
            <input
              type="text"
              placeholder="NEET 2023 Paper 1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-white"
              style={{ borderColor: colors.border, color: colors.foreground }}
            />
          </div>

          <div>
            <label className="text-sm font-semibold block mb-1" style={{ color: colors.foreground }}>
              Exam *
            </label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg border bg-white"
              style={{ borderColor: colors.border, color: colors.foreground }}
            >
              {EXAMS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold block mb-1" style={{ color: colors.foreground }}>
              Year *
            </label>
            <input
              type="number"
              min="1990"
              max="2100"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-white"
              style={{ borderColor: colors.border, color: colors.foreground }}
            />
          </div>

          <div>
            <label className="text-sm font-semibold block mb-1" style={{ color: colors.foreground }}>
              Duration (min)
            </label>
            <input
              type="number"
              placeholder="180"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-white"
              style={{ borderColor: colors.border, color: colors.foreground }}
            />
          </div>

          <div>
            <label className="text-sm font-semibold block mb-1" style={{ color: colors.foreground }}>
              Subject
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-white"
              style={{ borderColor: colors.border, color: colors.foreground }}
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* STEP 2: PDF Upload */}
      <div className="rounded-lg border p-6 mb-6" style={{ borderColor: colors.border }}>
        <h2 className="text-lg font-bold mb-4" style={{ color: colors.foreground }}>
          Step 2️⃣ Upload PDF
        </h2>

        <div className="flex flex-col gap-3">
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            onChange={onFileChange}
            className="hidden"
          />

          <button
            onClick={() => fileRef.current?.click()}
            className="w-full px-4 py-3 rounded-lg border-2 border-dashed text-sm font-semibold"
            style={{ borderColor: colors.primary, color: colors.primary, background: colors.primary + "10" }}
          >
            {file ? `📄 ${file.name}` : "+ Click to select PDF"}
          </button>

          {file && !questions.length && (
            <button
              onClick={parsePdf}
              disabled={parsing}
              className="w-full py-2 rounded-lg text-white font-semibold"
              style={{ background: colors.primary, opacity: parsing ? 0.6 : 1 }}
            >
              {parsing ? "Extracting questions..." : "🚀 Extract Questions"}
            </button>
          )}
        </div>
      </div>

      {/* STEP 3: Review Questions */}
      {questions.length > 0 && (
        <div className="rounded-lg border p-6 mb-6" style={{ borderColor: colors.border }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: colors.foreground }}>
            Step 3️⃣ Review Questions ({questions.length})
          </h2>

          <div className="max-h-96 overflow-y-auto flex flex-col gap-2">
            {questions.map((q, idx) => (
              <div
                key={idx}
                className="rounded-lg p-3 border bg-white text-sm"
                style={{ borderColor: colors.border }}
              >
                <div className="font-semibold" style={{ color: colors.foreground }}>
                  Q{idx + 1}. {q.text.substring(0, 80)}
                  {q.text.length > 80 ? "..." : ""}
                </div>
                <div style={{ color: colors.mutedForeground }} className="text-xs mt-1">
                  {q.topic || "No topic"} • {q.difficulty}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full mt-4 py-3 rounded-lg text-white font-bold"
            style={{ background: colors.neet, opacity: saving ? 0.6 : 1 }}
          >
            {saving ? "Saving..." : `✓ Save Paper (${questions.length} Questions)`}
          </button>
        </div>
      )}

      {/* EXISTING PYPs */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner size={24} />
        </div>
      ) : pyps.length > 0 ? (
        <div className="rounded-lg border p-6" style={{ borderColor: colors.border }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: colors.foreground }}>
            📚 Existing Papers ({pyps.length})
          </h2>
          <div className="flex flex-col gap-3 max-h-60 overflow-y-auto">
            {pyps.map((p) => (
              <div
                key={p.id}
                className="rounded-lg p-3 border bg-white flex items-center justify-between"
                style={{ borderColor: colors.border }}
              >
                <div className="text-sm flex-1">
                  <div className="font-semibold" style={{ color: colors.foreground }}>
                    {p.title}
                  </div>
                  <div style={{ color: colors.mutedForeground }} className="text-xs">
                    {p.examType} {p.year} • {p.questionCount}Q {p.durationMinutes && `• ${p.durationMinutes}min`}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="px-2 py-1 rounded text-xs font-semibold"
                  style={{ borderColor: colors.destructive, color: colors.destructive, border: `1px solid ${colors.destructive}` }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

