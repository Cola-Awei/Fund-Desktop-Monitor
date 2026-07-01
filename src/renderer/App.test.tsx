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
  it("renders the monitor title and top-right add control", async () => {
    render(<App />);

    expect(await screen.findByText("基金实时监控")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("基金代码，如 000001")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加基金" })).toBeInTheDocument();
    expect(screen.getByText("暂无持仓，点击右上角添加基金。")).toBeInTheDocument();
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
            gszzl: -2.13,
            gztime: "2026-07-01 10:33"
          },
          currentPrice: 1.6547,
          profitLoss: -1066.19,
          status: "fresh"
        }
      ],
      totalProfitLoss: -1066.19,
      latestEstimateTime: "2026-07-01 10:33",
      isRefreshing: false
    });

    render(<App />);

    expect(await screen.findByText("当日实时盈亏")).toBeInTheDocument();
    expect(screen.getByText(/持仓 1 只/)).toBeInTheDocument();
    expect(screen.getByText(/估值 10:33/)).toBeInTheDocument();
    expect(screen.getByText(/000001 · 估值 1.6547 · 成本 1.5000/)).toBeInTheDocument();
    expect(screen.getAllByText("-1066.19")).toHaveLength(2);
    for (const amount of screen.getAllByText("-1066.19")) {
      expect(amount).toHaveClass("loss");
    }
    expect(screen.getByText("-2.13%")).toHaveClass("loss");
    expect(screen.getByRole("button", { name: "删除 000001" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "添加基金" }));

    expect(screen.getByText("添加持仓")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "成本单价" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "总投入金额" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "按收益反推" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("基金代码")).toBeInTheDocument();
    expect(screen.getByLabelText("持有份额")).toBeInTheDocument();
    expect(screen.getByLabelText("持仓成本单价")).toBeInTheDocument();
    expect(screen.queryByLabelText("目前金额")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("持有收益")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "保存" })).toBeInTheDocument();
  });
});
