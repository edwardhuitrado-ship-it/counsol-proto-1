import React, { useState } from 'react';
import { Copy, Check, QrCode } from 'lucide-react';
import { BarcodeModal } from './BarcodeModal';
import { Product } from '../types/inventory';

interface SkuBadgeProps {
  product: Product;
  showBarcodeButton?: boolean;
}

export const SkuBadge: React.FC<SkuBadgeProps> = ({ product, showBarcodeButton = true }) => {
  const [copied, setCopied] = useState(false);
  const [showBarcode, setShowBarcode] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(product.sku);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <>
      <div className="inline-flex items-center gap-1.5 bg-slate-900 border border-amber-500/30 text-amber-300 px-2.5 py-1 rounded-md text-xs font-mono font-semibold tracking-wider shadow-xs group">
        <span className="text-amber-400">#</span>
        <span>{product.sku}</span>
        <button
          onClick={handleCopy}
          title="Copy SKU"
          className="text-slate-400 hover:text-amber-200 transition-colors p-0.5"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
        {showBarcodeButton && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowBarcode(true);
            }}
            title="View Barcode & Bin Label"
            className="text-slate-400 hover:text-cyan-300 transition-colors p-0.5"
          >
            <QrCode className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {showBarcode && (
        <BarcodeModal product={product} onClose={() => setShowBarcode(false)} />
      )}
    </>
  );
};
