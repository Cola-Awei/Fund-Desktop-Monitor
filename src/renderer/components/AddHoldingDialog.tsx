import { X } from "lucide-react";
import { useState } from "react";
import type { CostInputMode, HoldingInputErrors } from "../../shared/types.js";

interface AddHoldingDialogProps {
  initialFundCode: string;
  onSubmit(input: {
    mode: CostInputMode;
    fundCode: string;
    shares?: string;
    costPrice?: string;
    totalAmount?: string;
    currentAmount?: string;
    holdingProfit?: string;
  }): Promise<HoldingInputErrors | null>;
  onClose(): void;
}

export function AddHoldingDialog({ initialFundCode, onSubmit, onClose }: AddHoldingDialogProps) {
  const [mode, setMode] = useState<CostInputMode>("costPrice");
  const [fundCode, setFundCode] = useState(initialFundCode);
  const [shares, setShares] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [holdingProfit, setHoldingProfit] = useState("");
  const [errors, setErrors] = useState<HoldingInputErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const nextErrors = await onSubmit({
        mode,
        fundCode,
        shares,
        costPrice,
        totalAmount,
        currentAmount,
        holdingProfit,
      });
      if (nextErrors) setErrors(nextErrors);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <form className="dialog" onSubmit={submit}>
        <div className="dialog-title">
          <strong>添加持仓</strong>
          <button className="dialog-close" type="button" aria-label="关闭" onClick={onClose}>
            <X size={14} />
          </button>
        </div>
        <div className="mode-switch">
          <button
            type="button"
            className={mode === "costPrice" ? "active" : ""}
            aria-pressed={mode === "costPrice"}
            onClick={() => setMode("costPrice")}
          >
            成本单价
          </button>
          <button
            type="button"
            className={mode === "totalAmount" ? "active" : ""}
            aria-pressed={mode === "totalAmount"}
            onClick={() => setMode("totalAmount")}
          >
            总投入金额
          </button>
          <button
            type="button"
            className={mode === "profitAmount" ? "active" : ""}
            aria-pressed={mode === "profitAmount"}
            onClick={() => setMode("profitAmount")}
          >
            按收益反推
          </button>
        </div>
        <div className="dialog-body">
          <label htmlFor="fund-code-input">
            基金代码
            <input
              id="fund-code-input"
              inputMode="numeric"
              placeholder="例如 000001"
              value={fundCode}
              onChange={(event) => setFundCode(event.target.value)}
            />
          </label>
          {errors.fundCode ? <p className="field-error">{errors.fundCode}</p> : null}
          {mode === "profitAmount" ? (
            <>
              <p className="dialog-hint">保存时会先获取当前净值/估值，再自动计算份额和成本单价。</p>
              <label htmlFor="current-amount-input">
                目前金额
                <input
                  id="current-amount-input"
                  inputMode="decimal"
                  placeholder="例如 1654.70"
                  value={currentAmount}
                  onChange={(event) => setCurrentAmount(event.target.value)}
                />
              </label>
              {errors.currentAmount ? <p className="field-error">{errors.currentAmount}</p> : null}
              <label htmlFor="holding-profit-input">
                持有收益
                <input
                  id="holding-profit-input"
                  inputMode="decimal"
                  placeholder="盈利填 154.70，亏损填 -154.70"
                  value={holdingProfit}
                  onChange={(event) => setHoldingProfit(event.target.value)}
                />
              </label>
              {errors.holdingProfit ? <p className="field-error">{errors.holdingProfit}</p> : null}
              {errors.currentPrice ? <p className="field-error">{errors.currentPrice}</p> : null}
            </>
          ) : (
            <>
              <label htmlFor="shares-input">
                持有份额
                <input
                  id="shares-input"
                  inputMode="decimal"
                  placeholder="例如 1000"
                  value={shares}
                  onChange={(event) => setShares(event.target.value)}
                />
              </label>
              {errors.shares ? <p className="field-error">{errors.shares}</p> : null}
              {mode === "costPrice" ? (
                <>
                  <label htmlFor="cost-price-input">
                    持仓成本单价
                    <input
                      id="cost-price-input"
                      inputMode="decimal"
                      placeholder="例如 1.5000"
                      value={costPrice}
                      onChange={(event) => setCostPrice(event.target.value)}
                    />
                  </label>
                  {errors.costPrice ? <p className="field-error">{errors.costPrice}</p> : null}
                </>
              ) : (
                <>
                  <label htmlFor="total-amount-input">
                    总投入金额
                    <input
                      id="total-amount-input"
                      inputMode="decimal"
                      placeholder="例如 1500"
                      value={totalAmount}
                      onChange={(event) => setTotalAmount(event.target.value)}
                    />
                  </label>
                  {errors.totalAmount ? <p className="field-error">{errors.totalAmount}</p> : null}
                </>
              )}
            </>
          )}
        </div>
        <div className="dialog-actions">
          <button className="primary-action" type="submit" disabled={isSubmitting}>
            保存
          </button>
        </div>
      </form>
    </div>
  );
}
