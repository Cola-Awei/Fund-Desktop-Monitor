import { X } from "lucide-react";
import { useState } from "react";
import type { HoldingInput, HoldingInputErrors } from "../../shared/types.js";

interface AddHoldingDialogProps {
  initialFundCode: string;
  onSubmit(input: HoldingInput): Promise<HoldingInputErrors | null>;
  onClose(): void;
}

export function AddHoldingDialog({ initialFundCode, onSubmit, onClose }: AddHoldingDialogProps) {
  const [fundCode, setFundCode] = useState(initialFundCode);
  const [shares, setShares] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [errors, setErrors] = useState<HoldingInputErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const nextErrors = await onSubmit({
        mode: "costPrice",
        fundCode,
        shares,
        costPrice,
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
