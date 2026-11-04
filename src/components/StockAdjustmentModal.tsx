import React, { useState } from 'react';
import { X, ArrowUpDown, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Product, MovementType } from '../types/inventory';
import { SkuBadge } from './SkuBadge';

interface StockAdjustmentModalProps {
  product: Product;
  onAdjust: (
    productId: string,
    quantityDelta: number,
    movementType: MovementType,
    reason: string,
    referenceId: string
  ) => Promise<void>;
  onClose: () => void;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  product,
  onAdjust,
  onClose,
}) => {
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove' | 'set'>('add');
  const [amount, setAmount] = useState<number>(10);
  const [movementType, setMovementType] = useState<MovementType>('adjustment');
  const [reason, setReason] = useState<string>('Physical warehouse cycle count adjustment');
  const [referenceId, setReferenceId] = useState<string>(`AUDIT-${new Date().toISOString().slice(0, 10)}`);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Calculate projected new total
  let delta = 0;
  if (adjustmentType === 'add') {
    delta = amount;
  } else if (adjustmentType === 'remove') {
    delta = -amount;
  } else if (adjustmentType === 'set') {
    delta = amount - product.stockQuantity;
  }

  const projectedQuantity = Math.max(0, product.stockQuantity + delta);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (amount < 0) {
      setErrorMsg('Amount must be zero or positive.');
      return;
    }

    if (delta === 0) {
      setErrorMsg('No stock quantity change detected.');
      return;
    }

    if (!reason.trim()) {
      setErrorMsg('Audit reason is required for inventory adjustments.');
      return;
    }

    setSubmitting(true);
    try {
      await onAdjust(product.id, delta, movementType, reason.trim(), referenceId.trim());
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error adjusting inventory');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full overflow-hidden text-slate-100">
        <div className="bg-slate-800/90 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-amber-500/20 text-amber-400">
              <ArrowUpDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Adjust Stock Level</h3>
              <p className="text-xs text-slate-400">Warehouse Inventory Audit Ledger</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white rounded-lg p-1.5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          {errorMsg && (
            <div className="bg-rose-950/60 border border-rose-600/60 text-rose-200 px-3.5 py-2.5 rounded-lg flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Product Header */}
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <SkuBadge product={product} />
              <span className="text-xs text-slate-400 font-mono">
                Current: <strong className="text-white text-sm">{product.stockQuantity}</strong> units
              </span>
            </div>
            <h4 className="text-xs font-semibold text-slate-200 line-clamp-1 mt-1">{product.name}</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Location: {product.warehouseLocation}</p>
          </div>

          {/* Mode Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Adjustment Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAdjustmentType('add');
                  setMovementType('inbound');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  adjustmentType === 'add'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                }`}
              >
                + Add Units
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdjustmentType('remove');
                  setMovementType('outbound');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  adjustmentType === 'remove'
                    ? 'bg-rose-950/60 border-rose-500 text-rose-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                }`}
              >
                - Deduct Units
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdjustmentType('set');
                  setMovementType('audit_cycle');
                }}
                className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                  adjustmentType === 'set'
                    ? 'bg-amber-950/60 border-amber-500 text-amber-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                }`}
              >
                = Set Exact Count
              </button>
            </div>
          </div>

          {/* Amount input */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {adjustmentType === 'set' ? 'New Total Count' : 'Quantity Delta'}
              </label>
              <input
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-base font-bold text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Projected New Stock
              </label>
              <div className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-base font-bold text-emerald-400 font-mono flex items-center justify-between">
                <span>{projectedQuantity} units</span>
                <span className="text-xs text-slate-400">
                  {delta >= 0 ? `+${delta}` : `${delta}`}
                </span>
              </div>
            </div>
          </div>

          {/* Movement Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Audit Classification
            </label>
            <select
              value={movementType}
              onChange={(e) => setMovementType(e.target.value as MovementType)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            >
              <option value="audit_cycle">Cycle Count Reconciliation</option>
              <option value="inbound">Inbound Stock Delivery</option>
              <option value="outbound">Outbound Fulfillment</option>
              <option value="damaged">Damaged / Defective Discard</option>
              <option value="return">Customer Return to Inventory</option>
              <option value="adjustment">General Ledger Correction</option>
            </select>
          </div>

          {/* Audit Reference Code */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Audit Reference / Document #
            </label>
            <input
              type="text"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              placeholder="e.g. AUDIT-2026-09, RMA-491, PO-883"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Required Audit Justification *
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain reason for quantity variance..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-300 hover:text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || delta === 0}
              className="px-5 py-2 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? 'Applying...' : 'Commit Stock Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
