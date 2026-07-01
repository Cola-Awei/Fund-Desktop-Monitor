import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

beforeEach(() => {
  window.fundApp = {
    getSnapshot: vi.fn().mockResolvedValue({
      holdings: [],
      totalProfitLoss: 0,
      latestEstimateTime: null,
      isRefreshing: false
    }),
    addHolding: vi.fn(),
    removeHolding: vi.fn(),
    refreshNow: vi.fn(),
    minimize: vi.fn(),
    closeToTray: vi.fn(),
    onSnapshotUpdated: vi.fn().mockReturnValue(() => undefined)
  };
});

describe("App", () => {
  it("renders the monitor title and add controls", async () => {
    render(<App />);
    expect(await screen.findByText("基金实时监控")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("基金代码，如 000001")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加" })).toBeInTheDocument();
  });
});
