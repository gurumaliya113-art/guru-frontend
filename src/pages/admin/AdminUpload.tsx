import { useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Icon, Spinner } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { adminApi, getAdminToken } from "@/lib/api";
import { colors } from "@/lib/colors";
import { EditableQuestion, QuestionEditor } from "./QuestionEditor";

type ParserMode = "heuristic" | "groq" | "gemini" | "dpp" | "raw";

const SUBJECT_OPTIONS = ["Physics", "Chemistry", "Biology", "Mathematics"];
const DIFFICULTY_OPTIONS = ["Easy", "Moderate", "Hard"];
const CLASS_OPTIONS = ["9", "10", "11", "12"];
const BOARD_OPTIONS = ["CBSE", "ICSE", "State", "Other"];
const EXAM_OPTIONS = ["NEET", "JEE", "BOARD"];

function mergeUniqueOptions(...groups: Array<Array<string | undefined | null>>) {
  return Array.from(new Set(groups.flat().map((value) => String(value || "").trim()).filter(Boolean)));
}

export default function AdminUpload() {
  const nav = useNavigate();
  const { geminiAvailable, groqAvailable } = useOutletContext<{ geminiAvailable: boolean; groqAvailable: boolean }>();
  const { refreshQuestions } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<ParserMode>("heuristic");

  // Auto-pick best available parser on mount/when availability changes
  useEffect(() => {
    if (groqAvailable) setMode("groq");
    else if (geminiAvailable) setMode("gemini");
    else setMode("raw");
  }, [groqAvailable, geminiAvailable]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [meta, setMeta] = useState<{ parser: string; pageCount: number; textLength: number } | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<EditableQuestion[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [showProblemsOnly, setShowProblemsOnly] = useState(false);
  const [bulkStart, setBulkStart] = useState("1");
  const [bulkEnd, setBulkEnd] = useState("1");
  const [bulkSubject, setBulkSubject] = useState("Biology");
  const [bulkTopic, setBulkTopic] = useState("");
  const [bulkDifficulty, setBulkDifficulty] = useState("Moderate");
  const [bulkClassLevel, setBulkClassLevel] = useState("12");
  const [bulkBoard, setBulkBoard] = useState("CBSE");
  const [bulkExamType, setBulkExamType] = useState("NEET");

  const onPick = (f: File | null) => {
    setFile(f);
    setError("");
    setDrafts([]);
    setMeta(null);
    setDocumentId(null);
    setSavedCount(null);
    if (f?.type.startsWith("image/")) {
      setMode("dpp");
    }
  };

  const getDraftProblem = (q: EditableQuestion) => {
    const text = q.text?.trim() || "";
    const options = Array.isArray(q.options) ? q.options.map((o) => (o || "").trim()) : ["", "", "", ""];
    const filledOptions = options.filter((o) => o.length > 0).length;
    if (!text) return "Missing question text";
    if (filledOptions < 2) return "Too few options extracted";
    if (filledOptions < 4) return "Some options are missing";
    if (!options[q.correctIndex]?.trim()) return "Correct answer is not set or missing";
    return null;
  };

  const onParse = async () => {
    if (!file) return;
    setBusy(true); setError(""); setDrafts([]); setMeta(null); setSavedCount(null);
    try {
      const result = await adminApi.parsePdf(file, mode);
      setMeta({ parser: result.parser, pageCount: result.pageCount, textLength: result.textLength });
      setDocumentId(result.documentId || null);
      const sourceFallback = result.parser === "raw"
        ? "pdf-raw"
        : result.parser === "heuristic"
        ? "pdf-heuristic"
        : result.parser === "groq"
        ? "pdf-groq"
        : result.parser === "gemini" || String(result.parser).startsWith("gemini-")
        ? "pdf-gemini"
        : result.parser === "dpp-ai"
        ? "dpp-ai"
        : "pdf";
      // Normalise into EditableQuestion shape so the editor can mutate freely.
      const ds: EditableQuestion[] = result.questions.map((q: any) => ({
        text: q.text || "",
        options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ["", "", "", ""],
        correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : 0,
        subject: q.subject || "Physics",
        topic: q.topic || "",
        difficulty: q.difficulty || "Moderate",
        examType: Array.isArray(q.examType) && q.examType.length ? q.examType : ["NEET"],
        type: q.type || "MCQ",
        explanation: q.explanation || "",
        year: q.year,
        documentId: q.documentId || result.documentId || undefined,
        pageNumber: typeof q.pageNumber === "number" ? q.pageNumber : null,
        hasFigure: typeof q.hasFigure === "boolean" ? q.hasFigure : false,
        pageImageUrl: q.pageImageUrl || undefined,
        source: q.source || sourceFallback,
      }));
      setDrafts(ds);
      setBulkEnd(String(ds.length));
    } catch (e: any) {
      setError(e?.message || "Parsing failed");
    } finally {
      setBusy(false);
    }
  };

  const displayedDrafts = showProblemsOnly
    ? drafts.filter((d) => !!getDraftProblem(d))
    : drafts;
  const problemCount = drafts.filter((d) => !!getDraftProblem(d)).length;

  const availableSubjects = mergeUniqueOptions(SUBJECT_OPTIONS, drafts.map((q) => q.subject));
  const availableTopics = mergeUniqueOptions(drafts.map((q) => q.topic));
  const availableClassLevels = mergeUniqueOptions(CLASS_OPTIONS, drafts.map((q) => q.classLevel));
  const availableBoards = mergeUniqueOptions(BOARD_OPTIONS, drafts.map((q) => q.board));
  const availableExamTypes = mergeUniqueOptions(EXAM_OPTIONS, drafts.flatMap((q) => q.examType || []));

  const applyBulkAssignment = () => {
    const start = Number(bulkStart);
    const end = Number(bulkEnd);
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start || end > drafts.length) {
      setError(`Invalid range. Use 1 to ${drafts.length}.`);
      return;
    }
    setDrafts((arr) => arr.map((q, idx) => {
      const index = idx + 1;
      if (index < start || index > end) return q;
      return {
        ...q,
        subject: bulkSubject || q.subject,
        topic: bulkTopic || q.topic,
        difficulty: bulkDifficulty || q.difficulty,
        classLevel: bulkClassLevel || q.classLevel,
        board: bulkBoard || q.board,
        examType: bulkExamType ? [bulkExamType] : q.examType,
      };
    }));
    setError("");
  };

  const removeProblemQuestions = () => {
    setDrafts((arr) => arr.filter((q) => !getDraftProblem(q)));
    setError("");
  };

  const onSave = async () => {
    if (drafts.length === 0) return;
    setSaving(true); setError("");
    try {
      // Validate minimally
      const bad = drafts.find((d) => !!getDraftProblem(d));
      if (bad) {
        setError("Some questions are incomplete. Fix or remove the flagged questions before saving.");
        setSaving(false);
        return;
      }
      const payload = documentId
        ? drafts.map((d) => ({ ...d, documentId }))
        : drafts;
      const res = await adminApi.addQuestions(payload as any);
      setSavedCount(res.added);
      setDrafts([]);
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      await refreshQuestions();
    } catch (e: any) {
      setError(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-full mx-auto">
      <div className="mb-6">
        <div className="text-[26px] font-bold" style={{ color: colors.foreground }}>Upload Document</div>
        <div className="text-sm" style={{ color: colors.mutedForeground }}>
          Upload a past paper as PDF or Word document. The file is saved, questions are extracted, and you can review before saving them to the bank.
        </div>
      </div>

      {/* Upload card */}
      <div className="rounded-2xl border bg-white p-6 mb-6" style={{ borderColor: colors.border }}>
        <div className="flex flex-col md:flex-row gap-4 items-start">
          <div className="flex-1">
            <div className="text-[11px] uppercase tracking-wider font-semibold mb-2" style={{ color: colors.mutedForeground }}>
              1. Pick a PDF or Word file
            </div>
            <label
              className="block rounded-xl border-2 border-dashed p-6 cursor-pointer text-center hover:bg-gray-50 transition"
              style={{ borderColor: file ? colors.primary : colors.border }}
            >
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf,.pdf,image/*,application/msword,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
                capture="environment"
                onChange={(e) => onPick(e.target.files?.[0] || null)}
                className="hidden"
              />
              <Icon name="file-text" size={32} color={file ? colors.primary : colors.mutedForeground} />
              <div className="text-sm font-medium mt-2" style={{ color: colors.foreground }}>
                {file ? file.name : "Click to choose a PDF, image, or Word document"}
              </div>
              <div className="text-xs mt-1" style={{ color: colors.mutedForeground }}>
                {file ? `${(file.size / 1024).toFixed(0)} KB` : "Max 25 MB · PDFs, images, and DOC/DOCX"}
              </div>
            </label>
          </div>

          <div className="flex-1 w-full">
            <div className="text-[11px] uppercase tracking-wider font-semibold mb-2" style={{ color: colors.mutedForeground }}>
              2. Choose parser
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setMode("heuristic")}
                className="text-left rounded-xl border p-3 transition"
                style={{
                  borderColor: mode === "heuristic" ? colors.primary : colors.border,
                  background: mode === "heuristic" ? colors.primary + "10" : colors.card,
                }}
              >
                <div className="flex items-center gap-2">
                  <input type="radio" checked={mode === "heuristic"} readOnly />
                  <div className="font-semibold text-sm" style={{ color: colors.foreground }}>Heuristic (free, instant)</div>
                </div>
                <div className="text-xs ml-6" style={{ color: colors.mutedForeground }}>
                  Regex-based — best for standard Q1/A-B-C-D format
                </div>
              </button>

              <button
                onClick={() => setMode("raw")}
                className="text-left rounded-xl border p-3 transition"
                style={{
                  borderColor: mode === "raw" ? colors.primary : colors.border,
                  background: mode === "raw" ? colors.primary + "10" : colors.card,
                }}
              >
                <div className="flex items-center gap-2">
                  <input type="radio" checked={mode === "raw"} readOnly />
                  <div className="font-semibold text-sm" style={{ color: colors.foreground }}>
                    PDF Raw Extract (No AI)
                  </div>
                </div>
                <div className="text-xs ml-6" style={{ color: colors.mutedForeground }}>
                  Extract raw page text with pdf-parse and run question detection without any AI.
                </div>
              </button>

              <button
                onClick={() => groqAvailable && setMode("groq")}
                disabled={!groqAvailable}
                className="text-left rounded-xl border p-3 transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  borderColor: mode === "groq" ? colors.primary : colors.border,
                  background: mode === "groq" ? colors.primary + "10" : colors.card,
                }}
              >
                <div className="flex items-center gap-2">
                  <input type="radio" checked={mode === "groq"} readOnly disabled={!groqAvailable} />
                  <div className="font-semibold text-sm" style={{ color: colors.foreground }}>
                    Groq AI (Llama 3.3 70B — free, recommended)
                  </div>
                  {!groqAvailable && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded ml-auto"
                      style={{ background: colors.muted, color: colors.mutedForeground }}>
                      no key
                    </span>
                  )}
                </div>
                <div className="text-xs ml-6" style={{ color: colors.mutedForeground }}>
                  {groqAvailable
                    ? "Best accuracy on JEE/NEET papers · free 30 req/min"
                    : "Set GROQ_API_KEY in backend/.env (console.groq.com/keys)"}
                </div>
              </button>

              <button
                onClick={() => geminiAvailable && setMode("gemini")}
                disabled={!geminiAvailable}
                className="text-left rounded-xl border p-3 transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  borderColor: mode === "gemini" ? colors.primary : colors.border,
                  background: mode === "gemini" ? colors.primary + "10" : colors.card,
                }}
              >
                <div className="flex items-center gap-2">
                  <input type="radio" checked={mode === "gemini"} readOnly disabled={!geminiAvailable} />
                  <div className="font-semibold text-sm" style={{ color: colors.foreground }}>
                    Gemini Flash
                  </div>
                  {!geminiAvailable && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded ml-auto"
                      style={{ background: colors.muted, color: colors.mutedForeground }}>
                      no key
                    </span>
                  )}
                </div>
                <div className="text-xs ml-6" style={{ color: colors.mutedForeground }}>
                  {geminiAvailable
                    ? "Use only if Groq is unavailable"
                    : "Set GEMINI_API_KEY in backend/.env to enable"}
                </div>
              </button>

              <button
                onClick={() => geminiAvailable && setMode("dpp")}
                disabled={!geminiAvailable}
                className="text-left rounded-xl border p-3 transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  borderColor: mode === "dpp" ? colors.primary : colors.border,
                  background: mode === "dpp" ? colors.primary + "10" : colors.card,
                }}
              >
                <div className="flex items-center gap-2">
                  <input type="radio" checked={mode === "dpp"} readOnly disabled={!geminiAvailable} />
                  <div className="font-semibold text-sm" style={{ color: colors.foreground }}>
                    DPP Mode (Gemini Vision)
                  </div>
                </div>
                <div className="text-xs ml-6" style={{ color: colors.mutedForeground }}>
                  Best for camera photos, scanned pages, and DPP question generation
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-5">
          <button
            onClick={onParse}
            disabled={!file || busy}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-bold disabled:opacity-50"
            style={{ background: colors.primary }}
          >
            {busy ? <><Spinner size={16} /> Parsing…</> : <><Icon name="zap" size={16} color="#fff" /> Extract Questions</>}
          </button>
          {meta && (
            <div className="text-xs" style={{ color: colors.mutedForeground }}>
              {meta.pageCount} pages · {meta.textLength.toLocaleString()} chars · parser: <b>{meta.parser}</b>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-3 px-3 py-2 rounded-lg text-sm" style={{ background: "#fee2e2", color: colors.destructive }}>
            {error}
          </div>
        )}
        {savedCount != null && (
          <div className="mt-3 px-3 py-2 rounded-lg text-sm flex items-center gap-2"
            style={{ background: colors.neetLight, color: colors.neet }}>
            <Icon name="check-circle" size={16} color={colors.neet} />
            Saved {savedCount} question(s) to the bank.
            <button onClick={() => nav("/admin/questions")} className="ml-2 underline font-semibold">View →</button>
          </div>
        )}
      </div>

      {/* Review screen */}
      {drafts.length > 0 && (
        <div>
          <div className="flex flex-col gap-4 mb-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="text-lg font-bold" style={{ color: colors.foreground }}>
                  Review {drafts.length} extracted question{drafts.length === 1 ? "" : "s"}
                </div>
                <div className="text-xs" style={{ color: colors.mutedForeground }}>
                  Verify text, mark the correct option (highlighted green), tag subject/topic, then save.
                </div>
              </div>
              <button
                onClick={onSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-white font-bold disabled:opacity-50"
                style={{ background: colors.neet }}
              >
                {saving ? <><Spinner size={16} /> Saving…</> : <><Icon name="check-circle" size={16} color="#fff" /> Save All ({drafts.length})</>}
              </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-4">
              <div className="rounded-2xl border bg-white p-4" style={{ borderColor: colors.border }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold" style={{ color: colors.foreground }}>Filter extracted draft questions</div>
                  <div className="text-xs" style={{ color: colors.mutedForeground }}>
                    {problemCount} flagged
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setShowProblemsOnly(false)}
                    className="rounded-full px-3 py-2 text-sm font-semibold border"
                    style={{ borderColor: showProblemsOnly ? colors.border : colors.primary, background: showProblemsOnly ? colors.card : colors.primary + "15", color: showProblemsOnly ? colors.foreground : colors.primary }}
                  >
                    All questions
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowProblemsOnly(true)}
                    className="rounded-full px-3 py-2 text-sm font-semibold border"
                    style={{ borderColor: showProblemsOnly ? colors.primary : colors.border, background: showProblemsOnly ? colors.primary + "15" : colors.card, color: showProblemsOnly ? colors.primary : colors.foreground }}
                  >
                    Flagged only
                  </button>
                </div>
                <div className="text-xs text-slate-500">
                  Use “Flagged only” to review questions where options or answer data were not extracted cleanly.
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-4" style={{ borderColor: colors.border }}>
                <div className="text-sm font-semibold mb-3" style={{ color: colors.foreground }}>Bulk assign range</div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input
                    value={bulkStart}
                    onChange={(e) => setBulkStart(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="From question #"
                    className="rounded-xl border px-3 py-2 text-sm"
                    style={{ borderColor: colors.border, background: colors.card }}
                  />
                  <input
                    value={bulkEnd}
                    onChange={(e) => setBulkEnd(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="To question #"
                    className="rounded-xl border px-3 py-2 text-sm"
                    style={{ borderColor: colors.border, background: colors.card }}
                  />
                </div>
                <select
                  value={bulkSubject}
                  onChange={(e) => setBulkSubject(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm mb-3"
                  style={{ borderColor: colors.border, background: colors.card }}
                >
                  {availableSubjects.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <select
                  value={bulkTopic}
                  onChange={(e) => setBulkTopic(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm mb-3"
                  style={{ borderColor: colors.border, background: colors.card }}
                >
                  <option value="">Topic (keep existing)</option>
                  {availableTopics.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <select
                  value={bulkClassLevel}
                  onChange={(e) => setBulkClassLevel(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm mb-3"
                  style={{ borderColor: colors.border, background: colors.card }}
                >
                  {availableClassLevels.map((option) => (
                    <option key={option} value={option}>Class {option}</option>
                  ))}
                </select>
                <select
                  value={bulkBoard}
                  onChange={(e) => setBulkBoard(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm mb-3"
                  style={{ borderColor: colors.border, background: colors.card }}
                >
                  {availableBoards.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <select
                  value={bulkExamType}
                  onChange={(e) => setBulkExamType(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm mb-3"
                  style={{ borderColor: colors.border, background: colors.card }}
                >
                  {availableExamTypes.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <select
                  value={bulkDifficulty}
                  onChange={(e) => setBulkDifficulty(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-sm mb-4"
                  style={{ borderColor: colors.border, background: colors.card }}
                >
                  {DIFFICULTY_OPTIONS.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={applyBulkAssignment}
                  className="w-full rounded-xl px-4 py-3 font-bold text-white"
                  style={{ background: colors.primary }}
                >
                  Apply to range
                </button>
                <button
                  type="button"
                  onClick={removeProblemQuestions}
                  className="w-full rounded-xl px-4 py-3 mt-3 font-bold text-white"
                  style={{ background: colors.destructive }}
                >
                  Remove flagged questions
                </button>
              </div>
            </div>
          </div>

          {(() => {
            const adminToken = getAdminToken();
            const pdfUrl = documentId && adminToken
              ? `/api/admin/documents/${encodeURIComponent(documentId)}/pdf?token=${encodeURIComponent(adminToken)}`
              : null;
            return displayedDrafts.map((d, visibleIndex) => {
              const originalIndex = drafts.indexOf(d);
              const problem = getDraftProblem(d);
              return (
                <div key={originalIndex} className="mb-4">
                  {problem && (
                    <div className="mb-2 rounded-xl px-3 py-2 text-sm" style={{ background: "#fef3c7", color: "#92400e" }}>
                      <strong>Flagged:</strong> {problem}. Fix it before saving or remove it.
                    </div>
                  )}
                  <QuestionEditor
                    index={originalIndex}
                    value={d}
                    pdfUrl={pdfUrl}
                    onChange={(next) => setDrafts((arr) => arr.map((q, idx) => idx === originalIndex ? next : q))}
                    onRemove={() => setDrafts((arr) => arr.filter((_, idx) => idx !== originalIndex))}
                  />
                </div>
              );
            });
          })()}
        </div>
      )}
    </div>
  );
}
