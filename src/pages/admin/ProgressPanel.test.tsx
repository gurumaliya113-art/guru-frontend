import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ProgressPanel from "./ProgressPanel";
import type { ProgressState } from "@/lib/useParseProgress";

/**
 * Builds a ProgressState with sensible defaults, overridable per-case.
 * Keeps each test focused on only the fields that matter for that state.
 */
function makeState(overrides: Partial<ProgressState> = {}): ProgressState {
  return {
    status: "running",
    totalPages: 0,
    completedCount: 0,
    remainingCount: 0,
    percentage: 0,
    etaSeconds: null,
    pages: {},
    error: null,
    ...overrides,
  };
}

describe("ProgressPanel", () => {
  it("renders nothing when idle", () => {
    const { container } = render(<ProgressPanel state={makeState({ status: "idle" })} />);
    expect(container).toBeEmptyDOMElement();
  });

  describe("running with a computed ETA", () => {
    const runningState = makeState({
      status: "running",
      totalPages: 120,
      completedCount: 3,
      remainingCount: 117,
      percentage: 2.5,
      etaSeconds: 200,
      pages: { 1: "done", 2: "done", 3: "done" },
    });

    it("shows the completed/total count", () => {
      render(<ProgressPanel state={runningState} />);
      expect(screen.getByText("3 / 120")).toBeInTheDocument();
    });

    it("shows the percentage and remaining count", () => {
      render(<ProgressPanel state={runningState} />);
      expect(screen.getByText("2.5%")).toBeInTheDocument();
      expect(screen.getByText("117 remaining")).toBeInTheDocument();
    });

    it("shows an ETA label ending in 'left'", () => {
      render(<ProgressPanel state={runningState} />);
      // 200s -> "3m 20s", rendered as "~3m 20s left"
      expect(screen.getByText(/3m 20s left/)).toBeInTheDocument();
    });

    it("renders a progressbar with aria-valuenow driven by the percentage", () => {
      render(<ProgressPanel state={runningState} />);
      const bar = screen.getByRole("progressbar");
      expect(bar).toHaveAttribute("aria-valuenow", "2.5");
    });

    it("marks done pages with ✅ and the current page with ⏳", () => {
      render(<ProgressPanel state={runningState} />);
      // Three completed pages each render the done icon.
      expect(screen.getAllByText("✅")).toHaveLength(3);
      // Page 4 is the lowest not-yet-done page -> processing.
      expect(screen.getByText("⏳")).toBeInTheDocument();
      expect(screen.getByTitle("Page 4 — processing")).toBeInTheDocument();
      expect(screen.getByTitle("Page 1 — done")).toBeInTheDocument();
    });
  });

  it("shows the estimating placeholder when the ETA is not yet available", () => {
    render(
      <ProgressPanel
        state={makeState({
          status: "running",
          totalPages: 120,
          completedCount: 0,
          remainingCount: 120,
          percentage: 0,
          etaSeconds: null,
        })}
      />,
    );
    expect(screen.getByText(/Estimating time/)).toBeInTheDocument();
    // No numeric "left" label while calculating.
    expect(screen.queryByText(/left/)).not.toBeInTheDocument();
  });

  it("shows a success banner when complete", () => {
    render(
      <ProgressPanel
        state={makeState({
          status: "complete",
          totalPages: 120,
          completedCount: 120,
          remainingCount: 0,
          percentage: 100,
          etaSeconds: 0,
        })}
      />,
    );
    expect(screen.getByText(/All 120 pages processed/)).toBeInTheDocument();
  });

  it("shows a partial banner when stopped", () => {
    render(
      <ProgressPanel
        state={makeState({
          status: "stopped",
          totalPages: 120,
          completedCount: 3,
          remainingCount: 117,
          percentage: 2.5,
          etaSeconds: 0,
          error: "Stopped after the time budget was reached.",
        })}
      />,
    );
    expect(screen.getByText(/Processed 3 of 120/)).toBeInTheDocument();
    expect(screen.getByText(/time budget/)).toBeInTheDocument();
  });

  it("shows an error banner with the failure cause when failed", () => {
    const message = "Could not read this file — it may be password-protected.";
    render(
      <ProgressPanel
        state={makeState({
          status: "failed",
          totalPages: 0,
          completedCount: 0,
          remainingCount: 0,
          percentage: 0,
          etaSeconds: null,
          error: message,
        })}
      />,
    );
    expect(screen.getByText(message)).toBeInTheDocument();
  });
});
