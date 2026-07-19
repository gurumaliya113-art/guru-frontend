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

// Known LaTeX commands (functions / Greek / operators) that exam content
// frequently stores WITHOUT their leading backslash, or that lose the
// backslash during a JSON round-trip ("\frac" -> form-feed + "rac").
const TEX_WORDS =
  "frac|sqrt|cos|sin|tan|cot|sec|csc|log|ln|exp|lim|sum|int|" +
  "alpha|beta|gamma|delta|theta|lambda|mu|nu|rho|sigma|phi|psi|omega|pi|" +
  "Delta|Sigma|Omega|Theta|Lambda|Gamma|Phi|Psi|" +
  "times|cdot|div|pm|mp|leq|geq|neq|approx|infty|ldots|cdots|rightarrow|to|hat|vec";

// Repair the most common corruptions we see in imported question LaTeX so
// KaTeX can typeset it. Only ever runs on strings we've already decided are
// math, so ordinary prose is never touched.
function repairTex(input: string): string {
  let s = input;
  // 1. Control chars that are JSON-escape artifacts of a lost backslash:
  //    "\frac" -> \x0C(form-feed)+"rac", "\beta" -> \x08(backspace)+"eta",
  //    "\theta"/"\times" -> \x09(tab)+"heta"/"imes".
  s = s.replace(/\x0C/g, "\\f").replace(/\x08/g, "\\b").replace(/\x09/g, "\\t");
  // 2. Bare "rac{" (backslash fully stripped) -> "\frac{".
  s = s.replace(/(^|[^\\A-Za-z])rac\{/g, "$1\\frac{");
  // 3. Normalise unicode dashes / minus to ASCII "-".
  s = s.replace(/[\u2012\u2013\u2014\u2212]/g, "-");
  // 4. Collapse the "^{. . .}^" / "{...}" ellipsis garbage into \ldots.
  s = s.replace(/\^?\{\s*\.(?:\s*\.)+\s*\}\^?/g, "\\ldots ");
  // 5. Re-attach missing backslashes on known commands/Greek letters.
  const re = new RegExp(`(^|[^\\\\A-Za-z])(${TEX_WORDS})(?![A-Za-z])`, "g");
  s = s.replace(re, "$1\\$2");
  return s;
}

function renderTex(tex: string, display: boolean): string {
  const cleaned = repairTex(tex);
  try {
    return katex.renderToString(cleaned, {
      displayMode: display,
      throwOnError: false,
      strict: false,
    });
  } catch {
    return escapeHtml(cleaned);
  }
}

// Strict render used to *probe* whether a whole line parses as valid math.
// throwOnError:true makes KaTeX throw (instead of emitting a red error node)
// so the caller can cleanly fall back to token-by-token rendering.
function renderTexStrict(tex: string): string {
  return katex.renderToString(repairTex(tex), {
    displayMode: false,
    throwOnError: true,
    strict: false,
  });
}

// Heuristic: is this whitespace-delimited token math rather than prose?
function isMathToken(t: string): boolean {
  if (!t) return false;
  if (/[\\^_{}]/.test(t)) return true;          // latex command / super-sub / braces
  if (/[=<>]/.test(t)) return true;             // a relation
  if (/^[+\-*/·×÷]$/.test(t)) return true;      // a lone operator
  if (/[0-9]/.test(t) && /[A-Za-z]/.test(t)) return true; // mixed like "2gt", "3H"
  if (/^[0-9]+\/[0-9]+[.,;]?$/.test(t)) return true;      // fraction like "1/8"
  if (/^[A-Za-z][.,;]?$/.test(t)) return true;  // single-letter variable
  return false;
}

// Token-by-token fallback for a single line: typeset only the math-looking
// words and HTML-escape the rest. Used when the whole line does NOT parse as
// one math expression (e.g. genuine prose with a little inline math).
function tokenMixedHtml(line: string): string {
  const parts = line.split(/(\s+)/);
  let out = "";
  let i = 0;
  while (i < parts.length) {
    const part = parts[i];
    if (part === "") { i++; continue; }
    if (/^\s+$/.test(part)) { out += part; i++; continue; }
    if (isMathToken(part)) {
      let run = part;
      let j = i + 1;
      while (j + 1 < parts.length && /^\s+$/.test(parts[j]) && isMathToken(parts[j + 1])) {
        run += parts[j] + parts[j + 1];
        j += 2;
      }
      out += renderTex(run, false);
      i = j;
    } else {
      out += escapeHtml(part);
      i++;
    }
  }
  return out;
}

// Render one line (no explicit math delimiters). If the line looks like math
// (backslash command, super/sub-script, a fraction, or a relation) we first
// try to typeset the WHOLE line as a single expression — this keeps commands
// whose arguments contain spaces (e.g. "\text{ ... (1)}") intact. Only if that
// fails do we fall back to token-by-token rendering.
function renderLine(line: string): string {
  if (!line) return "";
  if (!line.trim()) return line; // whitespace only
  // Pure prose (no math indicators at all) -> escape untouched.
  if (!/[\\^_{}=<>]/.test(line) && !/[0-9]/.test(line)) return escapeHtml(line);
  const looksMath =
    /\\[A-Za-z]/.test(line) || /[\^_]/.test(line) || /rac\{/.test(line) || /[=<>]/.test(line);
  if (looksMath) {
    try {
      const lead = (line.match(/^\s*/) || [""])[0];
      const trail = (line.match(/\s*$/) || [""])[0];
      return lead + renderTexStrict(line.trim()) + trail;
    } catch {
      // fall through to token mode
    }
  }
  return tokenMixedHtml(line);
}

// Render a plain (non-delimited) chunk, preserving line breaks and typesetting
// any bare / corrupted LaTeX it contains via renderLine.
function autoMathHtml(chunk: string): string {
  if (!chunk) return "";
  return chunk
    .split(/(\r?\n)/)
    .map((part) => (/^\r?\n$/.test(part) ? "<br/>" : renderLine(part)))
    .join("");
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
    // plain text before this match (may itself contain bare LaTeX)
    if (m.index > last) out += autoMathHtml(text.slice(last, m.index));
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
  if (last < text.length) out += autoMathHtml(text.slice(last));
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
