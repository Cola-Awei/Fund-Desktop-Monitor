import { formatAmount, signClass } from "../../shared/money.js";

interface SummaryPanelProps {
  totalProfitLoss: number;
  holdingCount: number;
  latestEstimateTime: string | null;
}

function formatEstimateStatus(latestEstimateTime: string | null) {
  if (!latestEstimateTime) return "等待刷新";

  const time = latestEstimateTime.slice(11, 16);
  return time >= "15:00" ? `已闭市 ${time}` : `估值 ${time}`;
}

export function SummaryPanel({ totalProfitLoss, holdingCount, latestEstimateTime }: SummaryPanelProps) {
  return (
    <section className="summary-panel">
      <span>当日实时盈亏</span>
      <div className="summary-line">
        <strong className={signClass(totalProfitLoss)}>{formatAmount(totalProfitLoss)}</strong>
        <small>
          持仓 {holdingCount} 只 · {formatEstimateStatus(latestEstimateTime)}
        </small>
      </div>
    </section>
  );
}
