import { useCallback, useEffect, useReducer, useRef } from "react";
import { getAdminToken } from "./api";

/**
 * Live progress state for a PDF parse job, driven purely by Server-Sent Events.
 *
 * Every value here is a reflection of a received `ProgressEvent`. Nothing in
 * this hook advances any number on its own — no timers, intervals, or
 * animations. A React render tick that carries no new event never changes
 * `percentage` or per-page statuses (Requirement 6.6).
 */
export interface ProgressState {
  status: "idle" | "connecting" | "running" | "complete" | "stopped" | "failed";
  totalPages: number | null;
  completedCount: number;
  remainingCount: number;
  /** 0..100 */
  percentage: number;
  /** null = calculating / unavailable */
  etaSeconds: number | null;
  pages: Record<number, "processing" | "done" | "failed">;
  /** Human-readable note about the engine/key currently running, e.g. "Running on Key 2 of 4". */
  activeKey: string | null;
  error: string | null;
}

/** The JSON payload the backend sends over SSE (see design Data Models). */
interface ProgressEvent {
  type: "total" | "progress" | "stopped" | "complete" | "failure";
  jobId: string;
  totalPages: number;
  completedCount: number;
  remainingCount: number;
  percentage: number;
  etaSeconds: number | null;
  page?: {
    number: number;
    outcome: "done" | "failed";
    durationMs: number;
  };
  message?: string;
  note?: string;
  emittedAt: string;
}

const IDLE_STATE: ProgressState = {
  status: "idle",
  totalPages: null,
  completedCount: 0,
  remainingCount: 0,
  percentage: 0,
  etaSeconds: null,
  pages: {},
  activeKey: null,
  error: null,
};

type Action =
  | { kind: "reset" }
  | { kind: "connecting" }
  | { kind: "event"; event: ProgressEvent };

/**
 * Applies the shared metrics carried by every event. All numbers come straight
 * from the payload — the hook never derives or advances them itself.
 */
function applyMetrics(state: ProgressState, event: ProgressEvent): ProgressState {
  return {
    ...state,
    totalPages: event.totalPages,
    completedCount: event.completedCount,
    remainingCount: event.remainingCount,
    percentage: event.percentage,
    etaSeconds: event.etaSeconds,
  };
}

function reducer(state: ProgressState, action: Action): ProgressState {
  switch (action.kind) {
    case "reset":
      return IDLE_STATE;

    case "connecting":
      return { ...IDLE_STATE, status: "connecting" };

    case "event": {
      const event = action.event;
      switch (event.type) {
        case "total": {
          // First event for the job: adopt the metrics and start running.
          return { ...applyMetrics(state, event), status: "running", error: null };
        }

        case "progress": {
          let pages = state.pages;
          if (event.page) {
            pages = { ...pages, [event.page.number]: event.page.outcome };
          }
          // Keep the last known engine/key label if this event doesn't carry one.
          const activeKey = event.note ?? state.activeKey;
          return { ...applyMetrics(state, event), status: "running", pages, activeKey };
        }

        case "complete":
          return { ...applyMetrics(state, event), status: "complete" };

        case "stopped":
          return {
            ...applyMetrics(state, event),
            status: "stopped",
            error: event.message ?? null,
          };

        case "failure":
          return {
            ...applyMetrics(state, event),
            status: "failed",
            error: event.message ?? "Parsing failed",
          };

        default:
          return state;
      }
    }

    default:
      return state;
  }
}

const TERMINAL_TYPES = new Set(["complete", "stopped", "failure"]);

/**
 * React hook that wraps a single `EventSource` connection to the backend SSE
 * progress endpoint. It parses named events and exposes a typed, event-only
 * `ProgressState`.
 *
 * Requirements: 6.6 (state reflects only received events), 6.7 (terminal
 * statuses + error surfaced), 3.3 (token in query for EventSource auth),
 * 3.5 (connection closed on terminal events).
 */
export function useParseProgress(): {
  state: ProgressState;
  start: (jobId: string) => void;
  reset: () => void;
} {
  const [state, dispatch] = useReducer(reducer, IDLE_STATE);
  const sourceRef = useRef<EventSource | null>(null);

  const closeSource = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.close();
      sourceRef.current = null;
    }
  }, []);

  const start = useCallback(
    (jobId: string) => {
      // Tear down any previous connection before opening a new one.
      closeSource();
      dispatch({ kind: "connecting" });

      const token = getAdminToken() ?? "";
      const url = `/api/admin/parse-pdf/progress/${encodeURIComponent(
        jobId,
      )}?token=${encodeURIComponent(token)}`;

      const source = new EventSource(url);
      sourceRef.current = source;

      const handle = (e: MessageEvent) => {
        let event: ProgressEvent;
        try {
          event = JSON.parse(e.data) as ProgressEvent;
        } catch {
          // Ignore malformed payloads — never fabricate progress.
          return;
        }
        dispatch({ kind: "event", event });
        if (TERMINAL_TYPES.has(event.type)) {
          closeSource();
        }
      };

      for (const type of ["total", "progress", "stopped", "complete", "failure"]) {
        source.addEventListener(type, handle as EventListener);
      }

      // Generic transport error: EventSource auto-reconnects. If the job is not
      // yet terminal, leave state untouched and do not fabricate progress.
      source.onerror = () => {
        // Intentionally a no-op on state. The browser handles reconnection;
        // buffered events replay on reconnect and the panel catches up.
      };
    },
    [closeSource],
  );

  const reset = useCallback(() => {
    closeSource();
    dispatch({ kind: "reset" });
  }, [closeSource]);

  // Ensure the connection is torn down when the consuming component unmounts.
  useEffect(() => {
    return () => {
      closeSource();
    };
  }, [closeSource]);

  return { state, start, reset };
}

export default useParseProgress;
