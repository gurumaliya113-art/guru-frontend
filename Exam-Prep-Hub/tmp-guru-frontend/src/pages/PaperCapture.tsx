import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";
import { colors } from "@/lib/colors";
import type { ExamType } from "@/lib/types";

// "Capture Paper" — quick path for teachers who don't feel like typing
// MCQs. They snap (or pick from gallery) photos of handwritten / printed
// questions, give them a title, and submit. The backend stores the images
// and returns a regular paper row whose questions are image-only — so
// every downstream surface (assign-to-class, student daily feed,
// PaperView, print/PDF) keeps working unchanged.
const EXAMS: ExamType[] = ["NEET", "JEE", "BITS", "BOARD"];
const SUBJECTS = ["Physics", "Chemistry", "Biology", "Mathematics", "Other"];
const MAX_IMAGES = 20;
const MAX_SIZE_MB = 8;

interface Pick {
  file: File;
  url: string; // local object URL for preview
}

export default function PaperCapture() {
  const nav = useNavigate();
  const { profile, attachPaper } = useApp();

  const [title, setTitle] = useState("");
  const [examType, setExamType] = useState<ExamType>(profile.targetExam || "BOARD");
  const [subject, setSubject] = useState<string>(SUBJECTS[0]);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const totalMB = useMemo(
    () => picks.reduce((s, p) => s + p.file.size, 0) / (1024 * 1024),
    [picks]
  );

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setError("");
    const next: Pick[] = [...picks];
    for (const f of Array.from(list)) {
      if (!f.type.startsWith("image/")) continue;
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`"${f.name}" is larger than ${MAX_SIZE_MB} MB — skipped.`);
        continue;
      }
      if (next.length >= MAX_IMAGES) {
        setError(`Limit is ${MAX_IMAGES} images per paper.`);
        break;
      }
      next.push({ file: f, url: URL.createObjectURL(f) });
    }
    setPicks(next);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAt = (i: number) => {
    setPicks((prev) => {
      const copy = prev.slice();
      const [removed] = copy.splice(i, 1);
      if (removed) URL.revokeObjectURL(removed.url);
      return copy;
    });
  };

  const moveUp = (i: number) => {
    if (i === 0) return;
    setPicks((prev) => {
      const copy = prev.slice();
      [copy[i - 1], copy[i]] = [copy[i], copy[i - 1]];
      return copy;
    });
  };

  const submit = async () => {
    if (!title.trim()) {
      setError("Please add a title");
      return;
    }
    if (picks.length === 0) {
      setError("Add at least one photo");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const r = await api.uploadCapture({
        title: title.trim(),
        examType,
        subject,
        topic: "All",
        difficulty: "Moderate",
        images: picks.map((p) => p.file),
      });
      attachPaper(r.paper);
      nav(`/paper/${r.paper.id}`, { replace: true });
    } catch (e: any) {
      setError(e?.message || "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-full max-w-[640px] mx-auto pb-28">
      <div
        className="flex items-center gap-2.5 px-4 pt-12 pb-3 border-b bg-white sticky top-0 z-10"
        style={{ borderColor: colors.border }}
      >
        <button
          onClick={() => nav(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: colors.secondary }}
        >
          <Icon name="arrow-left" size={18} color={colors.foreground} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[16px] font-bold" style={{ color: colors.foreground }}>
            Capture Paper
          </div>
          <div className="text-[11px]" style={{ color: colors.mutedForeground }}>
            Snap photos of your handwritten / printed questions and upload
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* Title */}
        <div className="mb-4">
          <div
            className="text-[11px] uppercase tracking-wider mb-1.5 font-semibold"
            style={{ color: colors.mutedForeground }}
          >
            Paper title
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Class 12 Physics — Surprise Test"
            className="w-full rounded-xl border px-4 h-12 outline-none text-base"
            style={{ borderColor: colors.border, background: "#fafafa", color: colors.foreground }}
          />
        </div>

        {/* Exam + Subject pickers */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <div
              className="text-[11px] uppercase tracking-wider mb-1.5 font-semibold"
              style={{ color: colors.mutedForeground }}
            >
              Exam
            </div>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value as ExamType)}
              className="w-full rounded-xl border px-3 h-12 outline-none text-sm"
              style={{ borderColor: colors.border, background: "#fafafa", color: colors.foreground }}
            >
              {EXAMS.map((x) => (
                <option key={x} value={x}>{x}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <div
              className="text-[11px] uppercase tracking-wider mb-1.5 font-semibold"
              style={{ color: colors.mutedForeground }}
            >
              Subject
            </div>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-xl border px-3 h-12 outline-none text-sm"
              style={{ borderColor: colors.border, background: "#fafafa", color: colors.foreground }}
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Image picker */}
        <div
          className="text-[11px] uppercase tracking-wider mb-1.5 font-semibold"
          style={{ color: colors.mutedForeground }}
        >
          Photos ({picks.length}/{MAX_IMAGES})
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          // capture="environment" makes phones open the camera directly.
          // Desktop browsers ignore it and just open the file picker.
          capture="environment"
          onChange={(e) => addFiles(e.target.files)}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={picks.length >= MAX_IMAGES}
          className="w-full rounded-2xl border-2 border-dashed p-5 flex flex-col items-center gap-2 mb-4 disabled:opacity-50"
          style={{ borderColor: colors.border, background: "#fafafa" }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "#dbeafe" }}
          >
            <Icon name="camera" size={22} color="#2563eb" />
          </div>
          <div className="text-[15px] font-semibold" style={{ color: colors.foreground }}>
            Take photo / Choose images
          </div>
          <div className="text-[11px]" style={{ color: colors.mutedForeground }}>
            JPG / PNG up to {MAX_SIZE_MB} MB each
          </div>
        </button>

        {picks.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {picks.map((p, i) => (
              <div
                key={p.url}
                className="relative rounded-xl overflow-hidden border bg-white"
                style={{ borderColor: colors.border }}
              >
                <img src={p.url} alt={`page ${i + 1}`} className="w-full h-40 object-cover" />
                <div
                  className="absolute top-1.5 left-1.5 text-white text-[11px] font-bold rounded-md px-1.5 py-0.5"
                  style={{ background: "rgba(0,0,0,0.6)" }}
                >
                  #{i + 1}
                </div>
                <div className="absolute top-1.5 right-1.5 flex gap-1">
                  {i > 0 && (
                    <button
                      onClick={() => moveUp(i)}
                      className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(255,255,255,0.9)" }}
                      title="Move up"
                    >
                      <Icon name="arrow-up" size={13} color={colors.foreground} />
                    </button>
                  )}
                  <button
                    onClick={() => removeAt(i)}
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(220,38,38,0.9)" }}
                    title="Remove"
                  >
                    <Icon name="trash-2" size={13} color="#fff" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div
            className="rounded-xl px-3 py-2 mb-3 text-[13px]"
            style={{ background: "#fee2e2", color: "#991b1b" }}
          >
            {error}
          </div>
        )}

        {picks.length > 0 && (
          <div className="text-[11px] mb-3" style={{ color: colors.mutedForeground }}>
            Total upload size: {totalMB.toFixed(1)} MB
          </div>
        )}

        <button
          onClick={submit}
          disabled={submitting || picks.length === 0 || !title.trim()}
          className="w-full py-4 rounded-2xl text-white font-bold text-base disabled:opacity-50 active:opacity-90"
          style={{ background: colors.primary }}
        >
          {submitting ? "Uploading…" : `Save & continue (${picks.length} photo${picks.length === 1 ? "" : "s"})`}
        </button>

        <div
          className="mt-3 text-[11px] text-center"
          style={{ color: colors.mutedForeground }}
        >
          After saving, open the paper to assign it to a class — students
          will see it in their daily updates and can download it.
        </div>
      </div>
    </div>
  );
}
