import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { colors } from "@/lib/colors";

// Split markdown into "pages" that roughly fill one phone screen.
// Keeps headings attached to the text that follows and guarantees at
// least `minPages` pages so a note always reads like a multi-page copy.
function paginate(md: string, minPages = 3, budget = 760): string[] {
  const text = (md || "").trim();
  if (!text) return [""];

  // Break into logical blocks (paragraphs / list groups / headings).
  const rawBlocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);

  // Merge a heading line with the block right after it.
  const blocks: string[] = [];
  for (let i = 0; i < rawBlocks.length; i++) {
    const b = rawBlocks[i];
    if (/^#{1,6}\s/.test(b) && i + 1 < rawBlocks.length) {
      blocks.push(b + "\n\n" + rawBlocks[i + 1]);
      i++;
    } else {
      blocks.push(b);
    }
  }

  const total = blocks.reduce((s, b) => s + b.length, 0);
  // Choose a budget that yields at least `minPages` pages.
  const targetPages = Math.max(minPages, Math.ceil(total / budget));
  const perPage = Math.ceil(total / targetPages);

  const pages: string[] = [];
  let cur = "";
  for (const b of blocks) {
    if (cur && cur.length + b.length > perPage) {
      pages.push(cur.trim());
      cur = b;
    } else {
      cur = cur ? cur + "\n\n" + b : b;
    }
  }
  if (cur.trim()) pages.push(cur.trim());

  // If still fewer than minPages (very short note), split the largest pages.
  while (pages.length < minPages && pages.some((p) => p.length > 80)) {
    const idx = pages.reduce((mi, p, i, arr) => (p.length > arr[mi].length ? i : mi), 0);
    const p = pages[idx];
    const mid = Math.floor(p.length / 2);
    const cut = p.indexOf("\n", mid);
    const at = cut === -1 ? mid : cut;
    pages.splice(idx, 1, p.slice(0, at).trim(), p.slice(at).trim());
  }

  return pages.length ? pages : [text];
}

const mdComponents = {
  h1: ({ children }: any) => <h2 className="text-lg font-bold mt-1 mb-2" style={{ color: colors.primary }}>{children}</h2>,
  h2: ({ children }: any) => <h3 className="text-base font-bold mt-1 mb-2" style={{ color: colors.primary }}>{children}</h3>,
  h3: ({ children }: any) => <h4 className="text-[15px] font-semibold mt-2 mb-1.5" style={{ color: "#7c3aed" }}>{children}</h4>,
  p: ({ children }: any) => <p className="mb-2.5">{children}</p>,
  strong: ({ children }: any) => <strong style={{ color: colors.primary, fontWeight: 700 }}>{children}</strong>,
  ul: ({ children }: any) => <ul className="list-disc pl-5 mb-3 space-y-1.5">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-5 mb-3 space-y-1.5">{children}</ol>,
  code: ({ children }: any) => (
    <code className="px-1.5 py-0.5 rounded text-[13px] font-mono" style={{ background: colors.primary + "18", color: colors.primary }}>{children}</code>
  ),
  table: ({ children }: any) => (
    <div className="overflow-x-auto my-3"><table className="w-full text-[13px] border-collapse">{children}</table></div>
  ),
  th: ({ children }: any) => <th className="border px-2 py-1 text-left font-semibold" style={{ borderColor: colors.border, background: colors.primary + "12", color: colors.primary }}>{children}</th>,
  td: ({ children }: any) => <td className="border px-2 py-1" style={{ borderColor: colors.border }}>{children}</td>,
};

function PageContent({ md }: { md: string }) {
  return (
    <div className="book-md text-[14px] leading-7" style={{ color: colors.foreground }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
        {md}
      </ReactMarkdown>
    </div>
  );
}

export default function BookReader({ content, title }: { content: string; title?: string }) {
  const pages = useMemo(() => paginate(content), [content]);
  const [index, setIndex] = useState(0);
  // Animation overlay: shows the OLD page flipping away to reveal the new one.
  const [flip, setFlip] = useState<{ dir: "next" | "prev"; md: string } | null>(null);
  const animating = useRef(false);

  useEffect(() => {
    setIndex(0);
    setFlip(null);
    animating.current = false;
  }, [content]);

  const go = (dir: "next" | "prev") => {
    if (animating.current) return;
    const target = dir === "next" ? index + 1 : index - 1;
    if (target < 0 || target >= pages.length) return;
    animating.current = true;
    const oldMd = pages[index];
    setIndex(target); // base layer immediately shows the new page
    setFlip({ dir, md: oldMd }); // overlay flips the old page away
  };

  const onFlipEnd = () => {
    setFlip(null);
    animating.current = false;
  };

  const atFirst = index === 0;
  const atLast = index === pages.length - 1;

  return (
    <div className="select-none">
      {/* Book / page */}
      <div className="book-stage relative mx-auto" style={{ perspective: "1600px" }}>
        {/* Back-of-stack hint pages for a paper-stack look */}
        <div className="book-stack" aria-hidden style={{ borderColor: colors.border }} />
        <div className="book-stack book-stack-2" aria-hidden style={{ borderColor: colors.border }} />

        {/* Base page (current) */}
        <div
          className="book-page relative rounded-r-xl rounded-l-md border shadow-md"
          style={{ background: "#fffdf7", borderColor: colors.border }}
        >
          {title && index === 0 && (
            <h1 className="text-xl font-extrabold mb-3 pb-2 border-b" style={{ color: colors.foreground, borderColor: colors.border }}>
              {title}
            </h1>
          )}
          <PageContent md={pages[index]} />
          <div className="book-spine" aria-hidden />
          <div className="absolute bottom-2 right-3 text-[11px] font-medium" style={{ color: colors.mutedForeground }}>
            {index + 1} / {pages.length}
          </div>
        </div>

        {/* Flipping overlay shows the OLD page turning over */}
        {flip && (
          <div
            className={`book-page book-flip ${flip.dir === "next" ? "flip-next" : "flip-prev"} rounded-r-xl rounded-l-md border shadow-lg`}
            style={{ background: "#fffdf7", borderColor: colors.border }}
            onAnimationEnd={onFlipEnd}
          >
            <PageContent md={flip.md} />
            <div className="book-spine" aria-hidden />
            <div className="book-flip-shade" aria-hidden />
          </div>
        )}

        {/* Left tap zone — go to previous page */}
        {!atFirst && (
          <button
            onClick={() => go("prev")}
            className="book-nav book-nav-left"
            aria-label="Previous page"
            title="Previous page"
          >
            <span className="book-nav-icon">‹</span>
          </button>
        )}
      </div>

      {/* Turn page arrow */}
      <div className="flex items-center justify-between mt-4 px-1">
        <button
          onClick={() => go("prev")}
          disabled={atFirst}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-semibold transition disabled:opacity-40"
          style={{ background: colors.secondary, color: colors.foreground }}
        >
          ← Previous
        </button>

        <span className="text-[12px]" style={{ color: colors.mutedForeground }}>
          Page {index + 1} of {pages.length}
        </span>

        <button
          onClick={() => go("next")}
          disabled={atLast}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-bold text-white transition disabled:opacity-40"
          style={{ background: colors.primary }}
        >
          Turn Page →
        </button>
      </div>

      <style>{`
        .book-stage { width: 100%; max-width: 520px; }
        .book-page {
          width: 100%;
          min-height: 60vh;
          padding: 20px 22px 34px 26px;
          transform-origin: left center;
          backface-visibility: hidden;
          overflow: hidden;
        }
        .book-stack {
          position: absolute; inset: 0;
          transform: translate(6px, 8px);
          background: #fbf7ea;
          border: 1px solid;
          border-radius: 0 12px 12px 6px;
          z-index: 0;
        }
        .book-stack-2 { transform: translate(11px, 15px); background: #f7f1df; opacity: 0.7; }
        .book-page { position: relative; z-index: 2; }
        .book-flip { position: absolute; inset: 0; z-index: 3; }
        .book-spine {
          position: absolute; top: 0; left: 0; height: 100%; width: 14px;
          background: linear-gradient(to right, rgba(0,0,0,0.10), rgba(0,0,0,0));
          border-top-left-radius: 6px; border-bottom-left-radius: 6px;
          pointer-events: none;
        }
        .book-flip-shade {
          position: absolute; inset: 0;
          background: linear-gradient(to right, rgba(0,0,0,0.04), rgba(0,0,0,0.18));
          opacity: 0; pointer-events: none;
        }
        .flip-next {
          transform-origin: left center;
          animation: flipNext 0.62s ease-in forwards;
        }
        .flip-next .book-flip-shade { animation: shadeIn 0.62s ease-in forwards; }
        .flip-prev {
          transform-origin: right center;
          animation: flipPrev 0.62s ease-in forwards;
        }
        @keyframes flipNext {
          0%   { transform: rotateY(0deg);   box-shadow: 0 0 0 rgba(0,0,0,0); }
          100% { transform: rotateY(-178deg); box-shadow: -18px 0 28px rgba(0,0,0,0.18); }
        }
        @keyframes flipPrev {
          0%   { transform: rotateY(0deg); }
          100% { transform: rotateY(178deg); }
        }
        @keyframes shadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .book-nav {
          position: absolute; top: 0; bottom: 0; left: 0; width: 52px;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(to right, rgba(0,0,0,0.05), rgba(0,0,0,0));
          border: none; cursor: pointer; z-index: 4;
          border-top-left-radius: 6px; border-bottom-left-radius: 6px;
        }
        .book-nav-icon {
          font-size: 28px; line-height: 1; color: ${colors.primary};
          background: #fff; border-radius: 9999px; width: 34px; height: 34px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 1px 6px rgba(0,0,0,0.18);
        }
        .book-md > *:first-child { margin-top: 0; }
      `}</style>
    </div>
  );
}
