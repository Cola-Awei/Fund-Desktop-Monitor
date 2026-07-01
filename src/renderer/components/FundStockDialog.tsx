import { RefreshCw, X } from "lucide-react";
import { formatPercent, signClass } from "../../shared/money.js";
import type { FundStockHoldings } from "../../shared/types.js";

interface FundStockDialogProps {
  fundName: string;
  fundCode: string;
  holdings: FundStockHoldings | null;
  isLoading: boolean;
  error: string | null;
  onRetry(): void;
  onClose(): void;
}

export function FundStockDialog({
  fundName,
  fundCode,
  holdings,
  isLoading,
  error,
  onRetry,
  onClose,
}: FundStockDialogProps) {
  const title = holdings?.fundName ?? fundName;
  const dateLine = holdings ? `截止 ${holdings.reportDate}` : fundCode;

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="dialog stock-dialog" aria-label={`${title} 关联股票`}>
        <div className="dialog-title">
          <div className="dialog-heading">
            <strong>关联股票</strong>
            <span title={title}>{title}</span>
            <small>{dateLine}</small>
          </div>
          <button className="dialog-close" type="button" aria-label="关闭" onClick={onClose}>
            <X size={14} />
          </button>
        </div>
        <div className="stock-dialog-body">
          {isLoading ? <p className="detail-state">正在加载持仓股票...</p> : null}
          {error ? (
            <div className="detail-state">
              <p>{error}</p>
              <button className="detail-retry" type="button" onClick={onRetry}>
                <RefreshCw size={13} />
                重试
              </button>
            </div>
          ) : null}
          {!isLoading && !error && holdings && holdings.stocks.length === 0 ? (
            <p className="detail-state">暂无持仓明细</p>
          ) : null}
          {!isLoading && !error && holdings && holdings.stocks.length > 0 ? (
            <div className="stock-table" role="table" aria-label="基金关联股票">
              <div className="stock-table-head" role="row">
                <span role="columnheader">股票名称</span>
                <span role="columnheader">涨幅</span>
                <span role="columnheader">持仓占比</span>
                <span role="columnheader">较上期占比</span>
              </div>
              {holdings.stocks.map((stock) => (
                <div className="stock-table-row" role="row" key={stock.marketCode}>
                  <span className="stock-name" role="cell">
                    <strong>{stock.stockName}</strong>
                    <small>{stock.stockCode}</small>
                  </span>
                  <span className={signClass(stock.stockChangePercent)} role="cell">
                    {formatPercent(stock.stockChangePercent)}
                  </span>
                  <span role="cell">{formatPercent(stock.holdingPercent).replace(/^\+/, "")}</span>
                  <span className={stock.isNew ? "flat" : signClass(stock.holdingChangePercent)} role="cell">
                    {stock.isNew ? "新增" : formatPercent(stock.holdingChangePercent)}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
