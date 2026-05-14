import { useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Icon, Spinner } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { adminApi } from "@/lib/api";
import { colors } from "@/lib/colors";
import { EditableQuestion, QuestionEditor } from "./QuestionEditor";

type ParserMode = "heuristic" | "ai";

export default function AdminUpload() {
  const nav = useNavigate();
  const { geminiAvailable } = useOutletContext<{ geminiAvailable: boolean }>();
  const { refreshQuestions } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<ParserMode>("heuristic");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [meta, setMeta] = useState<{ parser: string; pageCount: number; textLength: number } | null>(null);
  const [drafts, setDrafts] = useState<EditableQuestion[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState<number | null>(null);

  useEffect(() => {
    if (!geminiAvailable && mode === "ai") setMode("heuristic");
  }, [geminiAvailable, mode]);

  const onPick = (f: File | null) => {
    setFile(f);
    setError("");
    setDrafts([]);
    setMeta(null);
    setSavedCount(null);
  };

  const onParse = async () => {
    if (!file) return;
    setBusy(true); setError(""); setDrafts([]); setMeta(null); setSavedCount(null);
    try {
      const result = await adminApi.parsePdf(file, mode);
      setMeta({ parser: result.parser, pageCount: result.pageCount, textLength: result.textLength });
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
      }));
      setDrafts(ds);
    } catch (e: any) {
      setError(e?.message || "Parsing failed");
    } finally {
      setBusy(false);
    }
  };

  const onSave = async () => {
    if (drafts.length === 0) return;
    setSaving(true); setError("");
    try {
      // Validate minimally
      const bad = drafts.find((d) => !d.text.trim() || d.options.filter((o) => o.trim()).length < 2);
      if (bad) {
        setError("Some questions are missing text or have fewer than 2 options. Please complete them or remove.");
        setSaving(false);
        return;
      }
      const res = await adminApi.addQuestions(drafts);
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
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <div className="text-[26px] font-bold" style={{ color: colors.foreground }}>Upload PDF</div>
        <div className="text-sm" style={{ color: colors.mutedForeground }}>
          Extract questions from a past paper. Text is parsed — PDFs are never stored.
        </div>
      </div>

      {/* Upload card */}
      <div className="rounded-2xl border bg-white p-6 mb-6" style={{ borderColor: colors.border }}>
        <div className="flex flex-col md:flex-row gap-4 items-start">
          <div className="flex-1">
            <div className="text-[11px] uppercase tracking-wider font-semibold mb-2" style={{ color: colors.mutedForeground }}>
              1. Pick a PDF file
            </div>
            <label
              className="block rounded-xl border-2 border-dashed p-6 cursor-pointer text-center hover:bg-gray-50 transition"
              style={{ borderColor: file ? colors.primary : colors.border }}
            >
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => onPick(e.target.files?.[0] || null)}
                className="hidden"
              />
              <Icon name="file-text" size={32} color={file ? colors.primary : colors.mutedForeground} />
              <div className="text-sm font-medium mt-2" style={{ color: colors.foreground }}>
                {file ? file.name : "Click to choose a PDF"}
              </div>
              <div className="text-xs mt-1" style={{ color: colors.mutedForeground }}>
                {file ? `${(file.size / 1024).toFixed(0)} KB` : "Max 25 MB · text-based PDFs only"}
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
                onClick={() => geminiAvailable && setMode("ai")}
                disabled={!geminiAvailable}
                className="text-left rounded-xl border p-3 transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  borderColor: mode === "ai" ? colors.primary : colors.border,
                  background: mode === "ai" ? colors.primary + "10" : colors.card,
                }}
              >
                <div className="flex items-center gap-2">
                  <input type="radio" checked={mode === "ai"} readOnly disabled={!geminiAvailable} />
                  <div className="font-semibold text-sm" style={{ color: colors.foreground }}>
                    AI parser (Gemini Flash — free tier)
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
                    ? "Higher accuracy on messy PDFs"
                    : "Set GEMINI_API_KEY in server/.env to enable"}
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={onParse}
            disabled={!file || busy}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-white font-bold disabled:opacity-50"
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
          <div className="flex items-center justify-between mb-3">
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

          {drafts.map((d, i) => (
            <QuestionEditor
              key={i}
              index={i}
              value={d}
              onChange={(next) => setDrafts((arr) => arr.map((q, idx) => idx === i ? next : q))}
              onRemove={() => setDrafts((arr) => arr.filter((_, idx) => idx !== i))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
