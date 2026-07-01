import { Minus, Plus, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import type {
  FundStockHoldings,
  HoldingInputErrors,
  HoldingProfitView,
  PortfolioSnapshot,
} from "../shared/types.js";
import { AddHoldingDialog } from "./components/AddHoldingDialog.js";
import { FundRow } from "./components/FundRow.js";
import { FundStockDialog } from "./components/FundStockDialog.js";
import { SummaryPanel } from "./components/SummaryPanel.js";

const emptySnapshot: PortfolioSnapshot = {
  holdings: [],
  totalProfitLoss: 0,
  latestEstimateTime: null,
  isRefreshing: false
};

function formatClockTime(date: Date) {
  return date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

export function App() {
  const [snapshot, setSnapshot] = useState<PortfolioSnapshot>(emptySnapshot);
  const [currentTime, setCurrentTime] = useState(() => formatClockTime(new Date()));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFund, setSelectedFund] = useState<HoldingProfitView | null>(null);
  const [stockHoldings, setStockHoldings] = useState<FundStockHoldings | null>(null);
  const [stockDetailLoading, setStockDetailLoading] = useState(false);
  const [stockDetailError, setStockDetailError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  useEffect(() => {
    void window.fundApp
      .getSnapshot()
      .then(setSnapshot)
      .catch(() => setStatusMessage("快照读取失败"));
    return window.fundApp.onSnapshotUpdated(setSnapshot);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(formatClockTime(new Date()));
    }, 30_000);

    return () => window.clearInterval(timer);
  }, []);

  async function refreshNow() {
    try {
      setStatusMessage(null);
      setIsManualRefreshing(true);
      setSnapshot(await window.fundApp.refreshNow());
      setStatusMessage(`已刷新 ${formatClockTime(new Date())}`);
    } catch {
      setStatusMessage("刷新失败");
    } finally {
      setIsManualRefreshing(false);
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

  async function openFundDetail(item: HoldingProfitView) {
    setSelectedFund(item);
    setStockHoldings(null);
    await loadFundDetail(item.holding.fundCode);
  }

  async function loadFundDetail(fundCode: string) {
    try {
      setStockDetailLoading(true);
      setStockDetailError(null);
      const result = await window.fundApp.getFundStockHoldings(fundCode);
      if (result.ok) {
        setStockHoldings(result.holdings);
      } else {
        setStockDetailError(result.error);
      }
    } catch {
      setStockDetailError("持仓股票读取失败");
    } finally {
      setStockDetailLoading(false);
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
          <button type="button" aria-label="刷新" onClick={refreshNow} disabled={isManualRefreshing}>
            <RefreshCw size={14} className={isManualRefreshing || snapshot.isRefreshing ? "is-spinning" : ""} />
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
              <FundRow
                key={item.holding.fundCode}
                item={item}
                onOpen={openFundDetail}
                onRemove={removeHolding}
              />
            ))
          )}
        </section>
      </section>
      <footer>
        {isManualRefreshing ? "正在刷新..." : (statusMessage ?? <>自动刷新 · 30s · 当前 {currentTime}</>)}
      </footer>
      {dialogOpen ? (
        <AddHoldingDialog
          initialFundCode=""
          onSubmit={submitHolding}
          onClose={() => setDialogOpen(false)}
        />
      ) : null}
      {selectedFund ? (
        <FundStockDialog
          fundName={selectedFund.quote?.name ?? selectedFund.holding.fundCode}
          fundCode={selectedFund.holding.fundCode}
          holdings={stockHoldings}
          isLoading={stockDetailLoading}
          error={stockDetailError}
          onRetry={() => void loadFundDetail(selectedFund.holding.fundCode)}
          onClose={() => {
            setSelectedFund(null);
            setStockHoldings(null);
            setStockDetailError(null);
          }}
        />
      ) : null}
    </main>
  );
}
