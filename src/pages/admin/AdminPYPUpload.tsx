import { useEffect, useRef, useState } from "react";
import { Icon, Spinner } from "@/components/ui";
import { adminApi } from "@/lib/api";
import { colors } from "@/lib/colors";
import type { Question, PreviousYearPaperSummary } from "@/lib/types";

const EXAMS = ["NEET", "JEE", "BITS", "BOARD"] as const;
const SUBJECTS = ["Physics", "Chemistry", "Biology", "Mathematics", "English", "History"];
const CLASSES = ["10", "11", "12"];

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

export default function AdminPYPUpload() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pyps, setPyps] = useState<PreviousYearPaperSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState("");
  const [examType, setExamType] = useState<(typeof EXAMS)[number]>("NEET");
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const [subject, setSubject] = useState("Physics");
  const [durationMinutes, setDurationMinutes] = useState("180");
  const [classLevel, setClassLevel] = useState("12");

  // Upload & parsing
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [questions, setQuestions] = useState<EditableQuestion[]>([]);
  const [selectedCount, setSelectedCount] = useState<number>(0);

  // Manual questions entry
  const [useManual, setUseManual] = useState(false);
  const [questionsJson, setQuestionsJson] = useState("");

  // Save state
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPyps();
  }, []);

  const loadPyps = async () => {
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

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setError(null);
      setQuestions([]);
      setSelectedCount(0);
    }
  };

  const parsePdf = async () => {
    if (!file) {
      setError("Select a PDF file first");
      return;
    }
    if (!title.trim()) {
      setError("Enter paper title first");
      return;
    }

    setParsing(true);
    setError(null);
    try {
      const result = await adminApi.parsePdf(file, "auto", {
        subject,
        examType,
      });

      const qs: EditableQuestion[] = result.questions.map((q: any) => ({
        text: q.text || "",
        options: Array.isArray(q.options) && q.options.length === 4 
          ? q.options 
          : ["", "", "", ""],
        correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : 0,
        subject: q.subject || subject || "Physics",
        topic: q.topic || "",
        difficulty: q.difficulty || "Moderate",
        examType: [examType],
        type: "MCQ",
        explanation: q.explanation || "",
        year: Number(year),
        classLevel,
        pageImageUrl: q.pageImageUrl,
      }));

      setQuestions(qs);
      setSelectedCount(qs.length);
      setSuccess(`✓ Extracted ${qs.length} questions from PDF`);
      setTimeout(() => setSuccess(null), 2000);
    } catch (e: any) {
      setError(e?.message || "PDF parsing failed");
    } finally {
      setParsing(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    const y = Number(year);
    if (!Number.isInteger(y) || y < 1990 || y > 2100) {
      setError("Year must be 1990–2100");
      return;
    }

    let qs: any[] = [];
    if (useManual) {
      try {
        qs = JSON.parse(questionsJson);
        if (!Array.isArray(qs) || qs.length === 0) {
          setError("Questions must be a non-empty JSON array");
          return;
        }
      } catch {
        setError("Invalid JSON");
        return;
      }
    } else {
      if (questions.length === 0) {
        setError("Upload and parse a PDF or enter questions manually");
        return;
      }
      qs = questions as any;
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
        questions: qs,
      });

      setSuccess(`✓ Paper "${title}" saved with ${qs.length} questions!`);
      setTitle("");
      setSubject("Physics");
      setDurationMinutes("180");
      setFile(null);
      setQuestions([]);
      setQuestionsJson("");
      setSelectedCount(0);
      setUseManual(false);
      if (fileRef.current) fileRef.current.value = "";
      await loadPyps();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this PYP? Students lose access.")) return;
    try {
      await adminApi.deletePyp(id);
      await loadPyps();
    } catch (e) {
      alert(String(e));
    }
  };

  return (
    <div className="min-h-full p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ color: colors.foreground }}>
          📚 Add Previous Year Paper
        </h1>
        <p style={{ color: colors.mutedForeground }}>
          Upload PDF or enter questions manually. Supports NEET, JEE, Board.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg border flex gap-3" style={{ background: "#fee2e2", borderColor: colors.destructive }}>
          <Icon name="alert-circle" size={20} color={colors.destructive} />
          <div style={{ color: colors.destructive }}>{error}</div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-lg border flex gap-3" style={{ background: colors.neetLight, borderColor: colors.neet }}>
          <Icon name="check-circle" size={20} color={colors.neet} />
          <div style={{ color: colors.neet }}>{success}</div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upload section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metadata */}
          <div className="rounded-lg border p-6" style={{ borderColor: colors.border }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: colors.foreground }}>
              📋 Paper Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold block mb-2" style={{ color: colors.foreground }}>
                  Title *
                </label>
                <input
                  type="text"
                  placeholder="NEET 2023 Paper 1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{ borderColor: colors.border, color: colors.foreground }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold block mb-2" style={{ color: colors.foreground }}>
                    Exam *
                  </label>
                  <select
                    value={examType}
                    onChange={(e) => setExamType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border"
                    style={{ borderColor: colors.border, color: colors.foreground }}
                  >
                    {EXAMS.map((e) => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold block mb-2" style={{ color: colors.foreground }}>
                    Year *
                  </label>
                  <input
                    type="number"
                    min="1990"
                    max="2100"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border"
                    style={{ borderColor: colors.border, color: colors.foreground }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold block mb-2" style={{ color: colors.foreground }}>
                    Subject
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border"
                    style={{ borderColor: colors.border, color: colors.foreground }}
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold block mb-2" style={{ color: colors.foreground }}>
                    Duration (min)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border"
                    style={{ borderColor: colors.border, color: colors.foreground }}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2" style={{ color: colors.foreground }}>
                  Class Level
                </label>
                <select
                  value={classLevel}
                  onChange={(e) => setClassLevel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border"
                  style={{ borderColor: colors.border, color: colors.foreground }}
                >
                  {CLASSES.map((c) => (
                    <option key={c} value={c}>Class {c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Upload or Manual */}
          <div className="rounded-lg border p-6" style={{ borderColor: colors.border }}>
            <div className="flex gap-4 mb-4">
              <button
                onClick={() => setUseManual(false)}
                className={`px-4 py-2 rounded-lg font-medium transition ${!useManual ? "ring-2" : ""}`}
                style={{
                  background: !useManual ? colors.primary : colors.secondary,
                  color: !useManual ? "#fff" : colors.foreground,
                  ringColor: colors.primary,
                }}
              >
                📄 Upload PDF
              </button>
              <button
                onClick={() => setUseManual(true)}
                className={`px-4 py-2 rounded-lg font-medium transition ${useManual ? "ring-2" : ""}`}
                style={{
                  background: useManual ? colors.primary : colors.secondary,
                  color: useManual ? "#fff" : colors.foreground,
                  ringColor: colors.primary,
                }}
              >
                ✍️ Enter Manually
              </button>
            </div>

            {!useManual ? (
              <>
                <div className="border-2 border-dashed rounded-lg p-6 text-center" style={{ borderColor: colors.border }}>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.docx,.doc"
                    onChange={onFileChange}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="text-sm font-medium"
                    style={{ color: colors.primary }}
                  >
                    <Icon name="upload" size={32} color={colors.primary} className="mx-auto mb-2" />
                    Click to upload or drag & drop
                  </button>
                  {file && (
                    <div className="mt-2 text-sm" style={{ color: colors.foreground }}>
                      ✓ {file.name}
                    </div>
                  )}
                </div>

                {file && (
                  <button
                    onClick={parsePdf}
                    disabled={parsing}
                    className="w-full mt-4 py-3 rounded-lg font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: colors.primary }}
                  >
                    {parsing && <Spinner size={16} />}
                    {parsing ? "Parsing..." : "Parse PDF"}
                  </button>
                )}

                {questions.length > 0 && (
                  <div className="mt-4 p-3 rounded-lg" style={{ background: colors.neetLight }}>
                    <p style={{ color: colors.neet }} className="text-sm font-medium">
                      ✓ Extracted {questions.length} questions (using {selectedCount} for paper)
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <label className="text-sm font-semibold block mb-2" style={{ color: colors.foreground }}>
                  Questions JSON Array
                </label>
                <textarea
                  value={questionsJson}
                  onChange={(e) => setQuestionsJson(e.target.value)}
                  rows={12}
                  placeholder='[{"id":"q1","text":"Question?","options":["a","b","c","d"],"correctIndex":0,"subject":"Physics",...}]'
                  className="w-full px-3 py-2 rounded-lg border font-mono text-sm"
                  style={{ borderColor: colors.border, color: colors.foreground }}
                />
              </>
            )}
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving || (questions.length === 0 && !questionsJson.trim())}
            className="w-full py-3 rounded-lg font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: colors.primary }}
          >
            {saving && <Spinner size={18} />}
            {saving ? "Saving..." : `Save Paper (${questions.length || questionsJson.length ? questions.length || "manual" : 0} questions)`}
          </button>
        </div>

        {/* Catalogue list */}
        <div className="rounded-lg border p-6" style={{ borderColor: colors.border }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold" style={{ color: colors.foreground }}>
              Papers ({pyps.length})
            </h3>
            <button
              onClick={loadPyps}
              className="text-xs font-medium p-1"
              style={{ color: colors.primary }}
            >
              <Icon name="refresh-cw" size={14} color={colors.primary} />
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-xs" style={{ color: colors.mutedForeground }}>Loading…</div>
            ) : pyps.length === 0 ? (
              <div className="text-xs" style={{ color: colors.mutedForeground }}>No papers yet</div>
            ) : (
              pyps.map((p) => (
                <div
                  key={p.id}
                  className="p-2 rounded-lg text-xs border"
                  style={{ borderColor: colors.border, background: colors.card }}
                >
                  <div className="font-medium truncate" style={{ color: colors.foreground }}>
                    {p.title}
                  </div>
                  <div style={{ color: colors.mutedForeground }} className="text-[11px]">
                    {p.examType} {p.year} • {p.questionCount} Qs
                  </div>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-[11px] mt-1"
                    style={{ color: colors.destructive }}
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
