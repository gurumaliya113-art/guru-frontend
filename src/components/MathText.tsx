// Renders a plain string that may contain LaTeX math, using KaTeX.
// Supports the delimiters exam papers / AI output commonly use:
//   \( ... \)   and   $ ... $      -> inline math
//   \[ ... \]   and   $$ ... $$    -> display (block) math
// Non-math text is HTML-escaped and shown as-is.
import katex from "katex";
import "katex/dist/katex.min.css";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderTex(tex: string, display: boolean): string {
  try {
    return katex.renderToString(tex, {
      displayMode: display,
      throwOnError: false,
      strict: false,
    });
  } catch {
    return escapeHtml(tex);
  }
}

// Matches \[...\], $$...$$ (display) and \(...\), $...$ (inline).
const MATH_RE =
  /(\\\[[\s\S]+?\\\])|(\$\$[\s\S]+?\$\$)|(\\\([\s\S]+?\\\))|(\$[^$\n]+?\$)/g;

export function mathToHtml(input: string): string {
  const text = String(input || "");
  let out = "";
  let last = 0;
  let m: RegExpExecArray | null;
  MATH_RE.lastIndex = 0;
  while ((m = MATH_RE.exec(text)) !== null) {
    // plain text before this match
    if (m.index > last) out += escapeHtml(text.slice(last, m.index));
    const token = m[0];
    let display = false;
    let tex = token;
    if (token.startsWith("\\[") && token.endsWith("\\]")) {
      display = true;
      tex = token.slice(2, -2);
    } else if (token.startsWith("$$") && token.endsWith("$$")) {
      display = true;
      tex = token.slice(2, -2);
    } else if (token.startsWith("\\(") && token.endsWith("\\)")) {
      tex = token.slice(2, -2);
    } else if (token.startsWith("$") && token.endsWith("$")) {
      tex = token.slice(1, -1);
    }
    out += renderTex(tex.trim(), display);
    last = m.index + token.length;
  }
  if (last < text.length) out += escapeHtml(text.slice(last));
  return out;
}

export function MathText({
  text,
  className,
  style,
}: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={className}
      style={style}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: mathToHtml(text) }}
    />
  );
}

export default MathText;
