import { X } from "lucide-react";
import { formatAmount, formatPrice, signClass } from "../../shared/money.js";
import type { HoldingProfitView } from "../../shared/types.js";

interface FundRowProps {
  item: HoldingProfitView;
  onRemove(fundCode: string): void;
}

export function FundRow({ item, onRemove }: FundRowProps) {
  const name = item.quote?.name ?? "等待刷新";

  return (
    <article className={`fund-row ${item.status === "error" ? "is-error" : ""}`}>
      <div className="fund-main">
        <strong title={name}>{name}</strong>
        <span>
          {item.holding.fundCode} · 估值 {formatPrice(item.currentPrice)} · 成本{" "}
          {formatPrice(item.holding.costPrice)}
        </span>
        {item.error ? <em>{item.error}</em> : null}
      </div>
      <div className="fund-profit">
        <strong className={signClass(item.profitLoss)}>{formatAmount(item.profitLoss)}</strong>
        <span>
          {item.quote?.gszzl === null || item.quote?.gszzl === undefined
            ? "--"
            : `${formatAmount(item.quote.gszzl)}%`}
        </span>
      </div>
      <button
        className="row-remove"
        type="button"
        aria-label={`删除 ${item.holding.fundCode}`}
        onClick={() => onRemove(item.holding.fundCode)}
      >
        <X size={13} />
      </button>
    </article>
  );
}
