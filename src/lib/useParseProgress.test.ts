import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useParseProgress } from "./useParseProgress";

/**
 * Minimal mock of the browser `EventSource` global.
 *
 * It records every handler registered via `addEventListener` keyed by event
 * type and exposes `emit(type, payload)` to synthesise a `MessageEvent`-like
 * object (`{ data: JSON.stringify(payload) }`) and dispatch it to the handlers
 * the hook registered. `emitRaw(type, data)` lets a test feed a malformed body.
 */
class MockEventSource {
  static instances: MockEventSource[] = [];

  url: string;
  closed = false;
  onerror: ((this: EventSource, ev: Event) => unknown) | null = null;
  private listeners: Record<string, EventListener[]> = {};

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
  }

  addEventListener(type: string, handler: EventListener) {
    (this.listeners[type] ??= []).push(handler);
  }

  close() {
    this.closed = true;
  }

  /** Emit a well-formed named event carrying a JSON-encoded payload. */
  emit(type: string, payload: unknown) {
    this.emitRaw(type, JSON.stringify(payload));
  }

  /** Emit a named event with a raw (possibly malformed) data string. */
  emitRaw(type: string, data: string) {
    for (const handler of this.listeners[type] ?? []) {
      handler({ data } as MessageEvent);
    }
  }

  static reset() {
    MockEventSource.instances = [];
  }

  static get last(): MockEventSource {
    const inst = MockEventSource.instances.at(-1);
    if (!inst) throw new Error("No EventSource was created");
    return inst;
  }
}

const originalEventSource = globalThis.EventSource;

beforeEach(() => {
  MockEventSource.reset();
  // @ts-expect-error - assigning a test double to the browser global
  globalThis.EventSource = MockEventSource;
});

afterEach(() => {
  globalThis.EventSource = originalEventSource;
  vi.restoreAllMocks();
});

/** Build a `total`-shaped payload with sensible defaults. */
function totalEvent(overrides: Record<string, unknown> = {}) {
  return {
    type: "total",
    jobId: "job-1",
    totalPages: 5,
    completedCount: 0,
    remainingCount: 5,
    percentage: 0,
    etaSeconds: null,
    emittedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

/** Build a `progress`-shaped payload with sensible defaults. */
function progressEvent(overrides: Record<string, unknown> = {}) {
  return {
    type: "progress",
    jobId: "job-1",
    totalPages: 5,
    completedCount: 1,
    remainingCount: 4,
    percentage: 20,
    etaSeconds: 12,
    page: { number: 1, outcome: "done", durationMs: 500 },
    emittedAt: "2024-01-01T00:00:01.000Z",
    ...overrides,
  };
}

describe("useParseProgress", () => {
  it("starts in the idle state", () => {
    const { result } = renderHook(() => useParseProgress());
    expect(result.current.state.status).toBe("idle");
    expect(result.current.state.totalPages).toBeNull();
    expect(result.current.state.percentage).toBe(0);
    expect(result.current.state.pages).toEqual({});
  });

  it("opens a connection and moves to 'connecting' on start()", () => {
    const { result } = renderHook(() => useParseProgress());

    act(() => result.current.start("job-1"));

    expect(MockEventSource.instances).toHaveLength(1);
    expect(MockEventSource.last.url).toContain("job-1");
    expect(result.current.state.status).toBe("connecting");
  });

  it("adopts a 'total' event: status running, totalPages and percentage from payload", () => {
    const { result } = renderHook(() => useParseProgress());
    act(() => result.current.start("job-1"));

    act(() => MockEventSource.last.emit("total", totalEvent()));

    expect(result.current.state.status).toBe("running");
    expect(result.current.state.totalPages).toBe(5);
    expect(result.current.state.percentage).toBe(0);
    expect(result.current.state.completedCount).toBe(0);
    expect(result.current.state.remainingCount).toBe(5);
    expect(result.current.state.etaSeconds).toBeNull();
  });

  it("records the page outcome and adopts metrics from a 'progress' event", () => {
    const { result } = renderHook(() => useParseProgress());
    act(() => result.current.start("job-1"));
    act(() => MockEventSource.last.emit("total", totalEvent()));

    act(() =>
      MockEventSource.last.emit(
        "progress",
        progressEvent({
          completedCount: 2,
          remainingCount: 3,
          percentage: 40,
          etaSeconds: 9,
          page: { number: 2, outcome: "failed", durationMs: 700 },
        }),
      ),
    );

    // State reflects ONLY the received payload values.
    expect(result.current.state.status).toBe("running");
    expect(result.current.state.pages).toEqual({ 2: "failed" });
    expect(result.current.state.completedCount).toBe(2);
    expect(result.current.state.remainingCount).toBe(3);
    expect(result.current.state.percentage).toBe(40);
    expect(result.current.state.etaSeconds).toBe(9);
  });

  it("event-only: a render tick with no new event never changes percentage or pages", () => {
    const { result, rerender } = renderHook(() => useParseProgress());
    act(() => result.current.start("job-1"));
    act(() => MockEventSource.last.emit("total", totalEvent()));
    act(() =>
      MockEventSource.last.emit(
        "progress",
        progressEvent({ completedCount: 1, remainingCount: 4, percentage: 20 }),
      ),
    );

    const percentageAfterEvent = result.current.state.percentage;
    const pagesAfterEvent = result.current.state.pages;

    // Re-render and let time pass with no further events dispatched.
    act(() => rerender());
    act(() => {
      /* no event emitted */
    });

    expect(result.current.state.percentage).toBe(percentageAfterEvent);
    expect(result.current.state.pages).toEqual(pagesAfterEvent);
    expect(result.current.state.pages).toEqual({ 1: "done" });
  });

  it("'complete' sets status complete and closes the connection", () => {
    const { result } = renderHook(() => useParseProgress());
    act(() => result.current.start("job-1"));
    const source = MockEventSource.last;
    act(() => source.emit("total", totalEvent()));

    act(() =>
      source.emit(
        "complete",
        totalEvent({
          type: "complete",
          completedCount: 5,
          remainingCount: 0,
          percentage: 100,
          etaSeconds: 0,
        }),
      ),
    );

    expect(result.current.state.status).toBe("complete");
    expect(result.current.state.percentage).toBe(100);
    expect(source.closed).toBe(true);
  });

  it("'stopped' sets status stopped and closes the connection", () => {
    const { result } = renderHook(() => useParseProgress());
    act(() => result.current.start("job-1"));
    const source = MockEventSource.last;
    act(() => source.emit("total", totalEvent()));

    act(() =>
      source.emit(
        "stopped",
        totalEvent({
          type: "stopped",
          completedCount: 3,
          remainingCount: 2,
          percentage: 60,
          message: "Time budget reached",
        }),
      ),
    );

    expect(result.current.state.status).toBe("stopped");
    expect(result.current.state.error).toBe("Time budget reached");
    expect(source.closed).toBe(true);
  });

  it("'failure' sets status failed, surfaces the message, and closes the connection", () => {
    const { result } = renderHook(() => useParseProgress());
    act(() => result.current.start("job-1"));
    const source = MockEventSource.last;
    act(() => source.emit("total", totalEvent()));

    act(() =>
      source.emit(
        "failure",
        totalEvent({
          type: "failure",
          message: "Corrupt PDF",
        }),
      ),
    );

    expect(result.current.state.status).toBe("failed");
    expect(result.current.state.error).toBe("Corrupt PDF");
    expect(source.closed).toBe(true);
  });

  it("reset() returns state to idle and closes the connection", () => {
    const { result } = renderHook(() => useParseProgress());
    act(() => result.current.start("job-1"));
    const source = MockEventSource.last;
    act(() => source.emit("total", totalEvent()));
    act(() => source.emit("progress", progressEvent()));

    expect(result.current.state.status).toBe("running");

    act(() => result.current.reset());

    expect(result.current.state.status).toBe("idle");
    expect(result.current.state.totalPages).toBeNull();
    expect(result.current.state.percentage).toBe(0);
    expect(result.current.state.pages).toEqual({});
    expect(result.current.state.error).toBeNull();
    expect(source.closed).toBe(true);
  });

  it("ignores malformed JSON payloads (state unchanged)", () => {
    const { result } = renderHook(() => useParseProgress());
    act(() => result.current.start("job-1"));
    const source = MockEventSource.last;
    act(() => source.emit("total", totalEvent()));
    act(() =>
      source.emit(
        "progress",
        progressEvent({ completedCount: 1, remainingCount: 4, percentage: 20 }),
      ),
    );

    const before = {
      status: result.current.state.status,
      percentage: result.current.state.percentage,
      completedCount: result.current.state.completedCount,
      pages: result.current.state.pages,
    };

    // Feed a broken body on a valid event type.
    act(() => source.emitRaw("progress", "{ this is not valid json"));

    expect(result.current.state.status).toBe(before.status);
    expect(result.current.state.percentage).toBe(before.percentage);
    expect(result.current.state.completedCount).toBe(before.completedCount);
    expect(result.current.state.pages).toEqual(before.pages);
    // A malformed payload must not close the live connection.
    expect(source.closed).toBe(false);
  });
});
