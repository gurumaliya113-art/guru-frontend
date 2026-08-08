import type { ProgressState } from "@/lib/useParseProgress";
import { colors } from "@/lib/colors";

interface ProgressPanelProps {
  state: ProgressState;
}

/**
 * Formats a duration in seconds into a compact human-readable "left" label.
 * Pure: same input always yields the same output, no timers.
 *
 * Examples: 200 -> "3m 20s", 45 -> "45s", 3600 -> "60m 0s".
 */
function formatEta(etaSeconds: number): string {
  const total = Math.max(0, Math.round(etaSeconds));
  if (total < 60) return `${total}s`;
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}m ${seconds}s`;
}

/** Chip used for each page in the per-page checklist. */
function PageChip({
  page,
  status,
}: {
  page: number;
  status: "done" | "failed" | "processing" | "pending";
}) {
  const style: { bg: string; fg: string; border: string; icon: string } = (() => {
    switch (status) {
      case "done":
        return { bg: colors.neetLight, fg: colors.neetForeground, border: colors.neet, icon: "✅" };
      case "failed":
        return { bg: "#fee2e2", fg: colors.destructive, border: colors.destructive, icon: "⚠️" };
      case "processing":
        return { bg: colors.primary + "15", fg: colors.primary, border: colors.primary, icon: "⏳" };
      default:
        return { bg: colors.card, fg: colors.mutedForeground, border: colors.border, icon: "" };
    }
  })();

  return (
    <div
      className="flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium"
      style={{ background: style.bg, color: style.fg, borderColor: style.border }}
      title={`Page ${page}${status !== "pending" ? ` — ${status}` : ""}`}
    >
      {style.icon && <span aria-hidden>{style.icon}</span>}
      <span>{page}</span>
    </div>
  );
}

/**
 * Presentational panel that renders the live parse progress reflected by
 * `useParseProgress`. It contains no data fetching and no timers — every value
 * shown is derived directly from the passed-in `state`.
 *
 * Requirements: 6.1 (counts + percentage), 6.2 (progress bar driven by data),
 * 6.3 (per-page checklist), 6.4 (ETA / calculating placeholder),
 * 6.7 (terminal banners), 6.8 (responsive layout).
 */
export default function ProgressPanel({ state }: ProgressPanelProps) {
  // Only appears during or after a job, never while idle.
  if (state.status === "idle") return null;

  const totalPages = state.totalPages ?? 0;
  // Round to one decimal, but keep whole numbers clean (e.g. 37.5 vs 40).
  const pctRounded = Math.round(state.percentage * 10) / 10;
  const pctLabel = Number.isInteger(pctRounded) ? `${pctRounded}%` : `${pctRounded.toFixed(1)}%`;
  const barWidth = `${Math.max(0, Math.min(100, state.percentage))}%`;

  // The currently-processing page is the lowest page in [1..totalPages] that is
  // not yet done/failed — only meaningful while the job is actively running.
  let processingPage: number | null = null;
  if (state.status === "running") {
    for (let n = 1; n <= totalPages; n++) {
      const s = state.pages[n];
      if (s !== "done" && s !== "failed") {
        processingPage = n;
        break;
      }
    }
  }

  const pageStatus = (n: number): "done" | "failed" | "processing" | "pending" => {
    const s = state.pages[n];
    if (s === "done") return "done";
    if (s === "failed") return "failed";
    if (n === processingPage) return "processing";
    return "pending";
  };

  return (
    <div className="rounded-2xl border bg-white p-6 mb-6" style={{ borderColor: colors.border }}>
      {/* Header row: counts + percentage */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <div className="flex items-baseline gap-3 flex-wrap">
          <div className="text-lg font-bold" style={{ color: colors.foreground }}>
            {state.completedCount} / {totalPages}
          </div>
          <div className="text-sm" style={{ color: colors.mutedForeground }}>
            {state.remainingCount} remaining
          </div>
        </div>
        <div className="text-lg font-bold tabular-nums" style={{ color: colors.primary }}>
          {pctLabel}
        </div>
      </div>

      {/* Progress bar — width driven purely by state.percentage */}
      <div
        className="h-3 w-full rounded-full overflow-hidden mb-2"
        style={{ background: colors.muted }}
        role="progressbar"
        aria-valuenow={pctRounded}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-[width] duration-300 ease-out"
          style={{ width: barWidth, background: colors.primary }}
        />
      </div>

      {/* ETA line + live engine/key badge */}
      <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
        <div className="text-sm" style={{ color: colors.mutedForeground }}>
          {state.etaSeconds !== null ? `~${formatEta(state.etaSeconds)} left` : "Estimating time…"}
        </div>
        {state.activeKey && state.status === "running" && (
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: colors.primary + "15", color: colors.primary }}
            title="Which AI key/engine is processing right now"
          >
            <span aria-hidden>⚡</span>
            <span>{state.activeKey}</span>
          </div>
        )}
      </div>

      {/* Per-page checklist: scrollable wrapping grid for large PDFs */}
      {totalPages > 0 && (
        <div
          className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1 rounded-xl"
          style={{ background: colors.background }}
        >
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <PageChip key={n} page={n} status={pageStatus(n)} />
          ))}
        </div>
      )}

      {/* Terminal banners */}
      {state.status === "complete" && (
        <div
          className="mt-4 px-3 py-2 rounded-lg text-sm font-medium"
          style={{ background: colors.neetLight, color: colors.neetForeground }}
        >
          All {totalPages} page{totalPages === 1 ? "" : "s"} processed.
        </div>
      )}

      {state.status === "stopped" && (
        <div
          className="mt-4 px-3 py-2 rounded-lg text-sm font-medium"
          style={{ background: colors.jeeLight, color: colors.jeeForeground }}
        >
          Processed {state.completedCount} of {totalPages} pages within the time budget.
          {state.error ? ` ${state.error}` : ""}
        </div>
      )}

      {state.status === "failed" && (
        <div
          className="mt-4 px-3 py-2 rounded-lg text-sm font-medium"
          style={{ background: "#fee2e2", color: colors.destructive }}
        >
          {state.error || "Parsing failed."}
        </div>
      )}
    </div>
  );
}
