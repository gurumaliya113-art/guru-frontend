import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Icon } from "@/components/ui";
import MathText from "@/components/MathText";
import QuestionDiagram from "@/components/QuestionDiagram";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";
import { colors, examColor } from "@/lib/colors";
import type { GeneratedPaper, Question } from "@/lib/types";

export default function PaperView() {
  const nav = useNavigate();
  const { id = "" } = useParams();
  const { papers, profile, questions: pool, updatePaperQuestions } = useApp();
  const [showAnswers, setShowAnswers] = useState(false);
  // Swap-question sheet state
  const [swapIndex, setSwapIndex] = useState<number | null>(null);
  const [swapSearch, setSwapSearch] = useState("");
  const [swapLimit, setSwapLimit] = useState(30);
  const [swapError, setSwapError] = useState("");
  const [justSwapped, setJustSwapped] = useState<string | null>(null);
  // Remarks (e.g. "NEET 2022") always show on screen. This flag controls
  // whether they are also included in the printed / saved-as-PDF paper.
  const [includeRemarks, setIncludeRemarks] = useState(false);

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

  // Only the paper's owner can swap questions, and only for normal MCQ papers
  // (not captured photo papers or previous-year papers).
  const canSwap =
    Boolean(localPaper) &&
    paper.topic !== "Previous Year" &&
    paper.questions.some((q) => q.options.length > 0);

  const candidatesFor = (target: Question) => {
    const inPaper = new Set(paper.questions.map((q) => q.id));
    const sameTopic = (q: Question) =>
      q.topic === target.topic && (!target.subject || q.subject === target.subject);
    return pool
      .filter((q) => !inPaper.has(q.id) && sameTopic(q) && q.options?.length > 0)
      .sort((a, b) => Number(b.difficulty === target.difficulty) - Number(a.difficulty === target.difficulty));
  };

  const replaceQuestion = async (index: number, next: Question) => {
    const updated = paper.questions.map((q, i) => (i === index ? next : q));
    setSwapIndex(null);
    setSwapError("");
    try {
      await updatePaperQuestions(paper.id, updated);
      setJustSwapped(next.id);
      window.setTimeout(() => setJustSwapped(null), 1600);
    } catch (e: any) {
      setSwapError("Could not save the change: " + String(e?.message || e));
    }
  };

  return (
    <div className="min-h-full max-w-[640px] mx-auto">
     <div className="no-print">
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
          style={{ background: colors.primaryGradient }}
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
            style={{ background: colors.primaryGradient, color: "#fff" }}
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
        {/* Toggle whether remarks (e.g. "NEET 2022") are printed. They always
            show on screen; this only affects the PDF/print output. */}
        {paper.questions.some((q) => q.remark) && (
          <button
            onClick={() => setIncludeRemarks((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl border text-xs font-semibold"
            style={{
              background: includeRemarks ? colors.primary + "18" : colors.secondary,
              borderColor: includeRemarks ? colors.primary : colors.border,
              color: includeRemarks ? colors.primary : colors.mutedForeground,
            }}
            title="Include remarks in the printed PDF"
          >
            <Icon name={includeRemarks ? "check-circle" : "tag"} size={15} color={includeRemarks ? colors.primary : colors.mutedForeground} />
            {includeRemarks ? "Remarks in PDF" : "Remarks"}
          </button>
        )}
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

        {canSwap && (
          <div className="rounded-2xl p-3.5 mb-5 flex items-start gap-3 border" style={{ background: colors.secondary, borderColor: "#ddd6fe" }}>
            <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: colors.primaryGradient }}>
              <Icon name="refresh-cw" size={16} color="#fff" />
            </span>
            <div className="text-[13px] leading-5" style={{ color: colors.foreground }}>
              <b>Review your paper.</b> Koi question badalna ho to uske <b>Replace</b> button pe tap karo — usi topic ke
              dusre questions dikhenge, jo chaho select kar lo.
            </div>
          </div>
        )}
        {swapError && (
          <div className="rounded-xl px-3 py-2 mb-4 text-[13px]" style={{ background: "#fef2f2", color: "#b91c1c" }}>{swapError}</div>
        )}

        {paper.questions.map((q, idx) => (
          <div key={q.id}
            className={`rounded-2xl p-4 mb-4 border bg-white shadow-sm transition-shadow ${justSwapped === q.id ? "pv-swapped" : ""}`}
            style={{ borderColor: justSwapped === q.id ? colors.primary : colors.border }}>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[13px] font-bold" style={{ background: colors.primaryGradient }}>
                {idx + 1}
              </div>
              {canSwap && q.options.length > 0 && (
                <button
                  onClick={() => { setSwapIndex(idx); setSwapSearch(""); setSwapLimit(30); }}
                  className="order-last ml-auto flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold"
                  style={{ borderColor: "#ddd6fe", color: colors.primary, background: "#fff" }}
                >
                  <Icon name="refresh-cw" size={12} color={colors.primary} /> Replace
                </button>
              )}
              <div className="flex gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium" style={{ background: colors.secondary, color: colors.mutedForeground }}>{q.topic}</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium"
                  style={{
                    background: q.difficulty === "Easy" ? colors.neetLight : q.difficulty === "Moderate" ? colors.jeeLight : "#fee2e2",
                    color: q.difficulty === "Easy" ? colors.neet : q.difficulty === "Moderate" ? colors.jee : colors.destructive,
                  }}>
                  {q.difficulty}
                </span>
                {q.remark && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold" style={{ background: colors.primary + "18", color: colors.primary }}>
                    {q.remark}
                  </span>
                )}
              </div>
            </div>

            {q.text && (
              <MathText className="text-sm font-medium leading-6 mb-2 block" style={{ color: colors.foreground }} text={q.text} />
            )}

            {/* For captured papers (image-only) we let the image grow to its
                natural height so handwriting stays readable; typed-paper
                diagrams are still capped. When the figure is expected but
                missing/broken, QuestionDiagram shows a clear placeholder. */}
            <QuestionDiagram
              url={q.pageImageUrl}
              hasFigure={q.hasFigure}
              maxHeight={q.options.length === 0 ? 1200 : 360}
              downloadName={`question-${idx + 1}.png`}
            />

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
                    <MathText className="flex-1 text-[13px] leading-5" style={{ color: correct ? colors.neetForeground : colors.foreground }} text={opt} />
                    {correct && <Icon name="check-circle" size={16} color={colors.neet} />}
                  </div>
                );
              })}
            </div>

            {showAnswers && (
              <div className="rounded-lg p-3 mt-3" style={{ background: colors.muted }}>
                <div className="text-[11px] font-semibold mb-1" style={{ color: colors.mutedForeground }}>Explanation:</div>
                <MathText className="text-xs leading-5 block" style={{ color: colors.foreground }} text={q.explanation} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ---------- Swap-question sheet ---------- */}
      {swapIndex !== null && paper.questions[swapIndex] && (() => {
        const target = paper.questions[swapIndex];
        const term = swapSearch.trim().toLowerCase();
        const all = candidatesFor(target);
        const list = term
          ? all.filter((c) => (c.text + " " + c.options.join(" ")).toLowerCase().includes(term))
          : all;
        return (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center pv-fade" onClick={() => setSwapIndex(null)}
            style={{ background: "rgba(20,17,43,0.45)" }}>
            <div className="pv-sheet w-full sm:max-w-[600px] max-h-[88vh] flex flex-col bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}>
              <div className="px-5 pt-5 pb-3 border-b" style={{ borderColor: colors.border }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[16px] font-bold" style={{ color: colors.foreground }}>Replace Q{swapIndex + 1}</div>
                    <div className="text-[12px] mt-0.5" style={{ color: colors.mutedForeground }}>
                      {target.subject ? `${target.subject} · ` : ""}{target.topic} · {all.length} other question{all.length === 1 ? "" : "s"}
                    </div>
                  </div>
                  <button onClick={() => setSwapIndex(null)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: colors.secondary }}>
                    <Icon name="x" size={16} color={colors.foreground} />
                  </button>
                </div>
                <div className="mt-3 rounded-xl p-3 text-[12px] leading-5" style={{ background: colors.secondary, color: colors.mutedForeground }}>
                  <span className="font-semibold" style={{ color: colors.foreground }}>Current: </span>
                  <MathText text={target.text.length > 160 ? target.text.slice(0, 160) + "…" : target.text} />
                </div>
                {all.length > 6 && (
                  <input
                    value={swapSearch}
                    onChange={(e) => setSwapSearch(e.target.value)}
                    placeholder="Search in these questions…"
                    className="mt-3 w-full rounded-xl px-3 py-2 text-[13px] outline-none border"
                    style={{ borderColor: colors.border, background: "#fff" }}
                  />
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3">
                {list.length === 0 ? (
                  <div className="py-10 text-center text-[13px]" style={{ color: colors.mutedForeground }}>
                    <Icon name="inbox" size={28} color={colors.mutedForeground} />
                    <div className="mt-2">
                      {all.length === 0 ? "Is topic mein aur koi question nahi hai." : "Search se koi question match nahi hua."}
                    </div>
                  </div>
                ) : (
                  list.slice(0, swapLimit).map((c, i) => (
                    <button
                      key={c.id}
                      onClick={() => replaceQuestion(swapIndex, c)}
                      className="pv-item w-full text-left rounded-2xl border p-3.5 mb-2.5 bg-white"
                      style={{ borderColor: colors.border, animationDelay: `${Math.min(i, 10) * 0.035}s` }}
                    >
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold"
                          style={{
                            background: c.difficulty === "Easy" ? colors.neetLight : c.difficulty === "Moderate" ? colors.jeeLight : "#fee2e2",
                            color: c.difficulty === "Easy" ? colors.neet : c.difficulty === "Moderate" ? colors.jee : colors.destructive,
                          }}>{c.difficulty}</span>
                        {c.remark && <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold" style={{ background: colors.secondary, color: colors.primary }}>{c.remark}</span>}
                        {c.pageImageUrl && <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold" style={{ background: colors.secondary, color: colors.mutedForeground }}>Diagram</span>}
                        <span className="ml-auto text-[11px] font-bold" style={{ color: colors.primary }}>Select</span>
                      </div>
                      <MathText className="text-[13px] leading-5 block" style={{ color: colors.foreground }} text={c.text} />
                      <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px]" style={{ color: colors.mutedForeground }}>
                        {c.options.slice(0, 4).map((o, oi) => (
                          <div key={oi} className="truncate"><b>{String.fromCharCode(65 + oi)}.</b> <MathText text={o} /></div>
                        ))}
                      </div>
                    </button>
                  ))
                )}
                {list.length > swapLimit && (
                  <button onClick={() => setSwapLimit((n) => n + 30)} className="w-full py-2.5 rounded-xl text-[13px] font-semibold" style={{ color: colors.primary, background: colors.secondary }}>
                    Show more ({list.length - swapLimit} left)
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
     </div>

      {/* ----------------- PRINT-ONLY VIEW ----------------- */}
      {/* This block is invisible on screen and only flows into the page when
          the user hits the PDF / print button. We use CSS multi-column to
          pack two questions per row (matching the "ek page p do side" ask)
          and stamp the teacher's header image at the top of every page via
          `position: running()` fallback — most browsers honor it. The screen
          UI itself is hidden with a print rule on `.no-print`. */}
      <div className={`paper-print ${includeRemarks ? "remarks-on" : "remarks-off"}`}>
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
              {q.remark && <span className="paper-print-remark">[{q.remark}]</span>}
              <MathText className="paper-print-q-text" text={q.text} />
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
                    <MathText text={opt} />
                  </li>
                ))}
              </ol>
              {showAnswers && q.explanation && (
                <div className="paper-print-expl"><b>Ans:</b> <MathText text={q.explanation} /></div>
              )}
            </li>
          ))}
        </ol>
      </div>

      {/* Inline print stylesheet — kept here so it ships with the component
          and doesn't pollute the global app styles. */}
      <style>{`
        .paper-print { display: none; }
        .pv-fade { animation: pv-fade .2s ease backwards; }
        @keyframes pv-fade { from { opacity: 0; } }
        .pv-sheet { animation: pv-up .35s cubic-bezier(.22,1,.36,1) backwards; }
        @keyframes pv-up { from { translate: 0 40px; opacity: 0; } }
        .pv-item { animation: pv-rise .4s cubic-bezier(.22,1,.36,1) backwards; transition: border-color .2s, box-shadow .2s, translate .2s; }
        .pv-item:hover { border-color: #c4b5fd !important; box-shadow: 0 12px 26px -18px rgba(46,16,101,.45); translate: 0 -1px; }
        @keyframes pv-rise { from { opacity: 0; translate: 0 10px; } }
        .pv-swapped { animation: pv-flash 1.6s ease; }
        @keyframes pv-flash { 0% { box-shadow: 0 0 0 0 rgba(124,58,237,.45); } 40% { box-shadow: 0 0 0 8px rgba(124,58,237,0); } 100% { box-shadow: none; } }
        @media print {
          @page { size: A4; margin: 12mm 10mm; }
          /* Blank-page fix: the on-screen UI used to be only visibility-hidden,
             so its full height still counted and added empty pages. Remove it
             from layout entirely and let the print block flow normally. */
          html, body, #root { height: auto !important; min-height: 0 !important; background: #fff !important; }
          #root * { min-height: 0 !important; }
          .no-print { display: none !important; }
          body * { visibility: hidden !important; }
          .paper-print, .paper-print * { visibility: visible !important; }
          .paper-print {
            display: block !important;
            position: static;
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
          /* Remarks are optional in print — hidden unless "Remarks in PDF" is on. */
          .paper-print-remark {
            display: inline-block;
            font-size: 8.5pt;
            font-weight: bold;
            color: #444;
            margin-right: 4px;
          }
          .paper-print.remarks-off .paper-print-remark { display: none; }
          .paper-print-q-img {
            display: block;
            max-width: 100%;
            max-height: 55mm;
            object-fit: contain;
            margin: 4px 0;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          /* Options: drive the (A)(B)(C)(D) labels with a CSS counter for the
             same reason as the question numbers — <ol> markers get dropped /
             clipped inside multi-column print layouts, which left the options
             stacked with no letters. Counter-based ::before is reliable. */
          .paper-print-opts {
            margin: 2px 0 0;
            padding-left: 0;
            font-size: 10.5pt;
            list-style: none;
            counter-reset: optnum;
          }
          .paper-print-opts li {
            counter-increment: optnum;
            position: relative;
            padding-left: 22px;
            margin-bottom: 1px;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .paper-print-opts li::before {
            content: "(" counter(optnum, upper-alpha) ")";
            position: absolute;
            left: 0;
            top: 0;
            font-weight: 600;
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
