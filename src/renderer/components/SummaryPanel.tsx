import { formatAmount, signClass } from "../../shared/money.js";

interface SummaryPanelProps {
  totalProfitLoss: number;
  holdingCount: number;
  latestEstimateTime: string | null;
}

export function SummaryPanel({ totalProfitLoss, holdingCount, latestEstimateTime }: SummaryPanelProps) {
  return (
    <section className="summary-panel">
      <span>总实时盈亏</span>
      <div className="summary-line">
        <strong className={signClass(totalProfitLoss)}>{formatAmount(totalProfitLoss)}</strong>
        <small>
          持仓 {holdingCount} 只 ·{" "}
          {latestEstimateTime ? `估值 ${latestEstimateTime.slice(11, 16)}` : "等待刷新"}
        </small>
      </div>
    </section>
  );
}
