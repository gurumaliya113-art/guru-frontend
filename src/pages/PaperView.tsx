import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Icon } from "@/components/ui";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";
import { colors, examColor } from "@/lib/colors";
import type { GeneratedPaper } from "@/lib/types";

export default function PaperView() {
  const nav = useNavigate();
  const { id = "" } = useParams();
  const { papers, profile } = useApp();
  const [showAnswers, setShowAnswers] = useState(false);

  // Local-cache hit (teacher viewing own paper) is the fast path. For
  // students opening an assigned paper, the paper isn't in their `papers`
  // array — fetch it from the backend instead. The new GET /api/papers/:id
  // route authorizes the caller (owner or approved-class-member) server-side.
  const localPaper = papers.find((p) => p.id === id);
  const [remotePaper, setRemotePaper] = useState<GeneratedPaper | null>(null);
  const [loading, setLoading] = useState<boolean>(!localPaper && Boolean(id));
  const [fetchError, setFetchError] = useState<string>("");

  useEffect(() => {
    if (localPaper || !id) return;
    let cancelled = false;
    setLoading(true);
    setFetchError("");
    api
      .getPaper(id)
      .then((r) => { if (!cancelled) setRemotePaper(r.paper); })
      .catch((e) => { if (!cancelled) setFetchError(String(e?.message || e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, localPaper]);

  const paper = localPaper || remotePaper;
  const ec = examColor(paper?.examType || "NEET");

  const handleAttempt = () => {
    if (!paper) return;
    nav(`/quiz/${paper.id}`, {
      state: {
        title: paper.title,
        questions: paper.questions,
        timeLimitMin: paper.durationMinutes ?? 180,
        examType: paper.examType,
        subject: paper.subject,
        topic: paper.topic,
        difficulty: paper.difficulty,
      },
    });
  };

  // Trigger the browser's print dialog. We rely on a print stylesheet
  // (see the <style> block below) that hides the live UI and reveals a
  // print-only block with the teacher's header image + a 2-column layout
  // so each printed / saved-as-PDF page packs two questions side-by-side.
  const handleDownload = () => {
    const original = document.title;
    document.title = paper ? `${paper.title.replace(/[\\/:*?"<>|]+/g, "-")}` : "Paper";
    window.print();
    setTimeout(() => { document.title = original; }, 500);
  };

  const handleDownloadAllImages = async () => {
    if (!paper) return;
    const imageUrls = paper.questions
      .map((q) => q.pageImageUrl)
      .filter((url): url is string => Boolean(url));

    if (imageUrls.length === 0) {
      alert("No images to download");
      return;
    }

    for (let i = 0; i < imageUrls.length; i++) {
      try {
        const link = document.createElement("a");
        link.href = imageUrls[i];
        link.download = `${paper.title.replace(/[^a-zA-Z0-9]/g, "_")}_question_${i + 1}.png`;
        link.click();
        // Small delay between downloads to avoid browser blocking
        if (i < imageUrls.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      } catch (e) {
        console.error(`Failed to download image ${i + 1}:`, e);
      }
    }
  };

  if (!paper) {
    return (
      <div className="min-h-full pt-12 px-4 max-w-[640px] mx-auto">
        <button onClick={() => nav(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: colors.secondary }}>
          <Icon name="arrow-left" size={18} color={colors.foreground} />
        </button>
        <div className="flex flex-col items-center justify-center pt-32 gap-3" style={{ color: colors.mutedForeground }}>
          {loading ? (
            <>
              <Icon name="clock" size={36} color={colors.mutedForeground} />
              <div className="text-base">Loading paper…</div>
            </>
          ) : (
            <>
              <Icon name="file-x" size={40} color={colors.mutedForeground} />
              <div className="text-base">Paper not found</div>
              {fetchError && (
                <div className="text-xs text-center max-w-xs" style={{ color: colors.mutedForeground }}>
                  {fetchError}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full max-w-[640px] mx-auto">
      <div className="flex items-center gap-2.5 px-4 pt-12 pb-3 border-b bg-white sticky top-0 z-10" style={{ borderColor: colors.border }}>
        <button onClick={() => nav(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: colors.secondary }}>
          <Icon name="arrow-left" size={18} color={colors.foreground} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold truncate" style={{ color: colors.foreground }}>{paper.title}</div>
          <div className="text-xs" style={{ color: colors.mutedForeground }}>{paper.questions.length} questions • {paper.difficulty}</div>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl text-white text-xs font-semibold"
          style={{ background: colors.primary }}
          title="Download as PDF (Save as PDF in the print dialog)"
        >
          <Icon name="download" size={14} color="#fff" />
          PDF
        </button>
        {paper.questions.some((q) => q.pageImageUrl) && (
          <button
            onClick={handleDownloadAllImages}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl border text-xs font-semibold"
            style={{ background: colors.secondary, borderColor: colors.border, color: colors.foreground }}
            title="Download all images"
          >
            <Icon name="image" size={14} color={colors.foreground} />
            Images
          </button>
        )}
        {paper.topic === "Previous Year" || paper.durationMinutes != null ? (
          <button
            onClick={handleAttempt}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl text-xs font-semibold"
            style={{ background: colors.primary, color: "#fff" }}
          >
            <Icon name="book-open" size={15} color="#fff" />
            Attempt Exam
          </button>
        ) : null}
        <button
          onClick={() => setShowAnswers((v) => !v)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl border text-xs font-semibold"
          style={{
            background: showAnswers ? colors.neetLight : colors.secondary,
            borderColor: showAnswers ? colors.neet : colors.border,
            color: showAnswers ? colors.neet : colors.mutedForeground,
          }}
        >
          <Icon name={showAnswers ? "eye-off" : "eye"} size={15} color={showAnswers ? colors.neet : colors.mutedForeground} />
          {showAnswers ? "Hide" : "Answers"}
        </button>
      </div>

      <div className="px-4 pt-4 pb-8">
        <div className="rounded-2xl p-3.5 border mb-5" style={{ background: ec + "10", borderColor: ec + "40" }}>
          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
            <span className="text-white text-[11px] font-bold px-2 py-0.5 rounded-md" style={{ background: ec }}>{paper.examType}</span>
            <span className="text-xs" style={{ color: colors.mutedForeground }}>•</span>
            <span className="text-[13px]" style={{ color: colors.mutedForeground }}>{paper.subject}</span>
            <span className="text-xs" style={{ color: colors.mutedForeground }}>•</span>
            <span className="text-[13px]" style={{ color: colors.mutedForeground }}>{paper.topic === "All" ? "Mixed" : paper.topic}</span>
          </div>
          <div className="text-[11px]" style={{ color: colors.mutedForeground }}>
            Generated {new Date(paper.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>

        {paper.questions.map((q, idx) => (
          <div key={q.id} className="rounded-2xl p-4 mb-4 border bg-white shadow-sm" style={{ borderColor: colors.border }}>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[13px] font-bold" style={{ background: colors.primary }}>
                {idx + 1}
              </div>
              <div className="flex gap-1.5">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium" style={{ background: colors.secondary, color: colors.mutedForeground }}>{q.topic}</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium"
                  style={{
                    background: q.difficulty === "Easy" ? colors.neetLight : q.difficulty === "Moderate" ? colors.jeeLight : "#fee2e2",
                    color: q.difficulty === "Easy" ? colors.neet : q.difficulty === "Moderate" ? colors.jee : colors.destructive,
                  }}>
                  {q.difficulty}
                </span>
              </div>
            </div>

            {q.text && (
              <div className="text-sm font-medium leading-6 mb-2" style={{ color: colors.foreground }}>{q.text}</div>
            )}

            {q.pageImageUrl && (
              <div className="mb-3 rounded-lg overflow-hidden border" style={{ borderColor: colors.border }}>
                <div className="relative">
                  <img
                    src={q.pageImageUrl}
                    alt="Question diagram"
                    className="w-full block"
                    // For captured papers (image-only) we let the image grow
                    // to its natural height so handwriting stays readable;
                    // typed-paper diagrams are still capped.
                    style={{ background: "#fff", maxHeight: q.options.length === 0 ? 1200 : 360, objectFit: "contain" }}
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <button
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = q.pageImageUrl || "";
                      link.download = `question-${idx + 1}.png`;
                      link.click();
                    }}
                    className="absolute top-2 right-2 px-3 py-1.5 rounded-lg text-white text-xs font-semibold shadow-lg"
                    style={{ background: colors.primary }}
                    title="Download image"
                  >
                    Download
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 mb-1">
              {q.options.map((opt, optIdx) => {
                const correct = showAnswers && optIdx === q.correctIndex;
                return (
                  <div key={optIdx} className="flex items-center gap-2 px-3 py-2.5 rounded-lg border"
                    style={{
                      background: correct ? colors.neetLight : colors.secondary,
                      borderColor: correct ? colors.neet : colors.border,
                    }}>
                    <span className="text-[13px] font-bold w-5" style={{ color: correct ? colors.neet : colors.mutedForeground }}>
                      {String.fromCharCode(65 + optIdx)}.
                    </span>
                    <span className="flex-1 text-[13px] leading-5" style={{ color: correct ? colors.neetForeground : colors.foreground }}>{opt}</span>
                    {correct && <Icon name="check-circle" size={16} color={colors.neet} />}
                  </div>
                );
              })}
            </div>

            {showAnswers && (
              <div className="rounded-lg p-3 mt-3" style={{ background: colors.muted }}>
                <div className="text-[11px] font-semibold mb-1" style={{ color: colors.mutedForeground }}>Explanation:</div>
                <div className="text-xs leading-5" style={{ color: colors.foreground }}>{q.explanation}</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ----------------- PRINT-ONLY VIEW ----------------- */}
      {/* This block is invisible on screen and only flows into the page when
          the user hits the PDF / print button. We use CSS multi-column to
          pack two questions per row (matching the "ek page p do side" ask)
          and stamp the teacher's header image at the top of every page via
          `position: running()` fallback — most browsers honor it. The screen
          UI itself is hidden with a print rule on `.no-print`. */}
      <div className="paper-print">
        {profile?.paperHeaderImage && !paper.skipHeader && (
          <img src={profile.paperHeaderImage} alt="" className="paper-print-header" />
        )}
        <div className="paper-print-meta">
          <div className="paper-print-title">{paper.title}</div>
          <div className="paper-print-sub">
            {paper.examType} · {paper.subject} · {paper.topic === "All" ? "Mixed" : paper.topic}
            {" · "}{paper.questions.length} questions · {paper.difficulty}
          </div>
        </div>
        {/* Numbering is rendered via CSS counters (see stylesheet below)
            instead of <ol> markers, because list-style markers are clipped
            inside CSS multi-column layouts in Chromium / print engines. */}
        <ol className="paper-print-list">
          {paper.questions.map((q) => (
            <li key={q.id} className="paper-print-q">
              <div className="paper-print-q-text">{q.text}</div>
              {q.pageImageUrl && (
                <img
                  src={q.pageImageUrl}
                  alt=""
                  className="paper-print-q-img"
                />
              )}
              <ol className="paper-print-opts" type="A">
                {q.options.map((opt, i) => (
                  <li key={i} className={showAnswers && i === q.correctIndex ? "is-correct" : ""}>
                    {opt}
                  </li>
                ))}
              </ol>
              {showAnswers && q.explanation && (
                <div className="paper-print-expl"><b>Ans:</b> {q.explanation}</div>
              )}
            </li>
          ))}
        </ol>
      </div>

      {/* Inline print stylesheet — kept here so it ships with the component
          and doesn't pollute the global app styles. */}
      <style>{`
        .paper-print { display: none; }
        @media print {
          @page { size: A4; margin: 12mm 10mm; }
          body { background: #fff !important; }
          /* Hide everything except our print block */
          body * { visibility: hidden !important; }
          .paper-print, .paper-print * { visibility: visible !important; }
          .paper-print {
            display: block !important;
            position: absolute;
            inset: 0;
            color: #000;
            font-family: "Times New Roman", Georgia, serif;
            font-size: 11pt;
          }
          .paper-print-header {
            display: block;
            width: 100%;
            max-height: 90px;
            object-fit: contain;
            margin: 0 auto 6px;
          }
          .paper-print-meta {
            text-align: center;
            border-bottom: 1.5px solid #000;
            padding-bottom: 4px;
            margin-bottom: 8px;
          }
          .paper-print-title { font-size: 14pt; font-weight: bold; }
          .paper-print-sub   { font-size: 10pt; margin-top: 2px; }
          /* Two-column body — questions flow side by side.
             We drive the visible "1.", "2.", "3." numbering with a CSS counter
             instead of relying on the <ol> marker, which the print engine
             routinely drops or clips inside multi-column layouts. */
          .paper-print-list {
            column-count: 2;
            column-gap: 8mm;
            column-rule: 1px solid #ccc;
            margin: 0;
            padding: 0;
            list-style: none;
            counter-reset: qnum;
          }
          .paper-print-q {
            break-inside: avoid;
            page-break-inside: avoid;
            margin-bottom: 8px;
            padding-left: 22px;
            position: relative;
            counter-increment: qnum;
          }
          .paper-print-q::before {
            content: counter(qnum) ".";
            position: absolute;
            left: 0;
            top: 0;
            font-weight: bold;
            min-width: 20px;
          }
          .paper-print-q-text { margin-bottom: 3px; }
          .paper-print-q-img {
            display: block;
            max-width: 100%;
            max-height: 55mm;
            object-fit: contain;
            margin: 4px 0;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .paper-print-opts {
            margin: 0;
            padding-left: 18px;
            font-size: 10.5pt;
          }
          .paper-print-opts li.is-correct { font-weight: bold; text-decoration: underline; }
          .paper-print-expl {
            margin-top: 3px;
            font-size: 9.5pt;
            font-style: italic;
            color: #333;
          }
        }
      `}</style>
    </div>
  );
}
