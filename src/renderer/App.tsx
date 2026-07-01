import { Minus, Plus, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import type { HoldingInputErrors, PortfolioSnapshot } from "../shared/types.js";
import { AddHoldingDialog } from "./components/AddHoldingDialog.js";
import { FundRow } from "./components/FundRow.js";
import { SummaryPanel } from "./components/SummaryPanel.js";

const emptySnapshot: PortfolioSnapshot = {
  holdings: [],
  totalProfitLoss: 0,
  latestEstimateTime: null,
  isRefreshing: false
};

export function App() {
  const [snapshot, setSnapshot] = useState<PortfolioSnapshot>(emptySnapshot);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    void window.fundApp
      .getSnapshot()
      .then(setSnapshot)
      .catch(() => setStatusMessage("快照读取失败"));
    return window.fundApp.onSnapshotUpdated(setSnapshot);
  }, []);

  async function refreshNow() {
    try {
      setStatusMessage(null);
      setSnapshot(await window.fundApp.refreshNow());
    } catch {
      setStatusMessage("刷新失败");
    }
  }

  async function removeHolding(code: string) {
    try {
      setStatusMessage(null);
      setSnapshot(await window.fundApp.removeHolding(code));
    } catch {
      setStatusMessage("删除失败");
    }
  }

  async function submitHolding(
    input: Parameters<typeof window.fundApp.addHolding>[0]
  ): Promise<HoldingInputErrors | null> {
    try {
      setStatusMessage(null);
      const result = await window.fundApp.addHolding(input);
      if ("snapshot" in result) {
        setSnapshot(result.snapshot);
        setDialogOpen(false);
        void refreshNow();
        return null;
      }
      return result.errors;
    } catch {
      setStatusMessage("添加失败");
      return {};
    }
  }

  return (
    <main className="window-shell">
      <header className="titlebar">
        <div className="brand">
          <span className="status-dot" />
          基金实时监控
        </div>
        <div className="title-actions">
          <button type="button" aria-label="添加基金" onClick={() => setDialogOpen(true)}>
            <Plus size={14} />
          </button>
          <button type="button" aria-label="刷新" onClick={refreshNow}>
            <RefreshCw size={14} className={snapshot.isRefreshing ? "is-spinning" : ""} />
          </button>
          <button
            type="button"
            aria-label="最小化"
            onClick={() => void window.fundApp.minimize().catch(() => setStatusMessage("最小化失败"))}
          >
            <Minus size={14} />
          </button>
        </div>
      </header>
      <section className="content">
        <SummaryPanel
          totalProfitLoss={snapshot.totalProfitLoss}
          holdingCount={snapshot.holdings.length}
          latestEstimateTime={snapshot.latestEstimateTime}
        />
        <section className="fund-list" aria-label="基金持仓">
          {snapshot.holdings.length === 0 ? (
            <p className="empty-state">暂无持仓，点击右上角添加基金。</p>
          ) : (
            snapshot.holdings.map((item) => (
              <FundRow key={item.holding.fundCode} item={item} onRemove={removeHolding} />
            ))
          )}
        </section>
      </section>
      <footer>
        {statusMessage ?? (
          <>自动刷新 · 30s · {snapshot.latestEstimateTime ? `最近 ${snapshot.latestEstimateTime.slice(11, 16)}` : "等待刷新"}</>
        )}
      </footer>
      {dialogOpen ? (
        <AddHoldingDialog
          initialFundCode=""
          onSubmit={submitHolding}
          onClose={() => setDialogOpen(false)}
        />
      ) : null}
    </main>
  );
}
