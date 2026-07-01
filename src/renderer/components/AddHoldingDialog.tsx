import { X } from "lucide-react";
import { useState } from "react";
import type { CostInputMode, HoldingInputErrors } from "../../shared/types.js";

interface AddHoldingDialogProps {
  initialFundCode: string;
  onSubmit(input: {
    mode: CostInputMode;
    fundCode: string;
    shares: string;
    costPrice?: string;
    totalAmount?: string;
  }): Promise<HoldingInputErrors | null>;
  onClose(): void;
}

export function AddHoldingDialog({ initialFundCode, onSubmit, onClose }: AddHoldingDialogProps) {
  const [mode, setMode] = useState<CostInputMode>("costPrice");
  const [fundCode, setFundCode] = useState(initialFundCode);
  const [shares, setShares] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [errors, setErrors] = useState<HoldingInputErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const nextErrors = await onSubmit({ mode, fundCode, shares, costPrice, totalAmount });
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
        </div>
        <label>
          基金代码
          <input value={fundCode} onChange={(event) => setFundCode(event.target.value)} />
        </label>
        {errors.fundCode ? <p className="field-error">{errors.fundCode}</p> : null}
        <label>
          持有份额
          <input value={shares} onChange={(event) => setShares(event.target.value)} />
        </label>
        {errors.shares ? <p className="field-error">{errors.shares}</p> : null}
        {mode === "costPrice" ? (
          <>
            <label>
              持仓成本单价
              <input value={costPrice} onChange={(event) => setCostPrice(event.target.value)} />
            </label>
            {errors.costPrice ? <p className="field-error">{errors.costPrice}</p> : null}
          </>
        ) : (
          <>
            <label>
              总投入金额
              <input value={totalAmount} onChange={(event) => setTotalAmount(event.target.value)} />
            </label>
            {errors.totalAmount ? <p className="field-error">{errors.totalAmount}</p> : null}
          </>
        )}
        <button className="primary-action" type="submit" disabled={isSubmitting}>
          保存
        </button>
      </form>
    </div>
  );
}
