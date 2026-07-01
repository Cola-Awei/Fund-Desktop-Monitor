import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
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

  it("renders Chinese copy in holding rows and add dialog", async () => {
    window.fundApp.getSnapshot = vi.fn().mockResolvedValue({
      holdings: [
        {
          holding: {
            fundCode: "000001",
            shares: 1000,
            costPrice: 1.5,
            createdAt: "2026-07-01T00:00:00.000Z",
            updatedAt: "2026-07-01T00:00:00.000Z"
          },
          quote: {
            fundCode: "000001",
            name: "华夏成长混合",
            jzrq: "2026-06-30",
            dwjz: 1.637,
            gsz: 1.6547,
            gszzl: 1.08,
            gztime: "2026-07-01 10:33"
          },
          currentPrice: 1.6547,
          profitLoss: 154.7,
          status: "fresh"
        }
      ],
      totalProfitLoss: 154.7,
      latestEstimateTime: "2026-07-01 10:33",
      isRefreshing: false
    });

    render(<App />);

    expect(await screen.findByText("总实时盈亏")).toBeInTheDocument();
    expect(screen.getByText(/持仓 1 只/)).toBeInTheDocument();
    expect(screen.getByText(/估值 10:33/)).toBeInTheDocument();
    expect(screen.getByText(/000001 · 估值 1.6547 · 成本 1.5000/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "删除 000001" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "添加" }));

    expect(screen.getByText("添加持仓")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "成本单价" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "总投入金额" })).toBeInTheDocument();
    expect(screen.getByText("基金代码")).toBeInTheDocument();
    expect(screen.getByText("持有份额")).toBeInTheDocument();
    expect(screen.getByText("持仓成本单价")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存" })).toBeInTheDocument();
  });
});
