import React from 'react';
import { X, Printer, CheckCircle2, ShieldCheck, MapPin } from 'lucide-react';
import { Product } from '../types/inventory';

interface BarcodeModalProps {
  product: Product;
  onClose: () => void;
}

export const BarcodeModal: React.FC<BarcodeModalProps> = ({ product, onClose }) => {
  // Generate faux barcode vertical bars based on SKU characters
  const generateBars = (str: string) => {
    const bars: { width: number; height: number; space: number }[] = [];
    for (let i = 0; i < str.length * 3; i++) {
      const code = str.charCodeAt(i % str.length);
      bars.push({
        width: (code % 3) + 1.5,
        height: 48 + ((code * 7) % 16),
        space: (code % 2) + 1.5,
      });
    }
    return bars;
  };

  const bars = generateBars(product.sku);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full overflow-hidden text-slate-100">
        {/* Header */}
        <div className="bg-slate-800/80 px-6 py-4 border-b border-slate-700/80 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              counSOL Warehouse Tag
            </h3>
            <p className="text-xs text-slate-400">Unique SKU & Bin Identification Label</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white rounded-lg p-1.5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Label Preview Card */}
        <div className="p-6">
          <div className="bg-white text-slate-900 rounded-lg p-5 border-2 border-dashed border-slate-300 shadow-inner">
            {/* Top brand & SKU */}
            <div className="flex items-center justify-between border-b pb-2 mb-3">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-amber-600 uppercase">
                  counSOL america
                </span>
                <p className="text-xs font-semibold text-slate-700">Solar Inventory Spec</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono font-medium">
                  {product.category}
                </span>
              </div>
            </div>

            {/* Product Title */}
            <h4 className="font-bold text-sm leading-tight line-clamp-2 text-slate-900 mb-1">
              {product.name}
            </h4>
            <p className="text-xs text-slate-500 line-clamp-1 mb-3">{product.specifications}</p>

            {/* Barcode Graphic */}
            <div className="bg-slate-50 border border-slate-200 rounded p-3 text-center my-3">
              <div className="flex justify-center items-end h-14 gap-0.5 overflow-hidden px-2">
                {bars.map((b, i) => (
                  <div
                    key={i}
                    className="bg-black"
                    style={{
                      width: `${b.width}px`,
                      height: `${b.height}px`,
                      marginRight: `${b.space}px`,
                    }}
                  />
                ))}
              </div>
              <p className="font-mono text-sm tracking-widest font-black text-slate-900 mt-2">
                *{product.sku}*
              </p>
            </div>

            {/* Warehouse Bay & Stock Info */}
            <div className="grid grid-cols-2 gap-2 text-xs border-t pt-2.5 mt-2 bg-slate-50/70 p-2 rounded">
              <div className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Location</div>
                  <div className="font-semibold text-slate-800">{product.warehouseLocation}</div>
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Status / Qty</div>
                <div className="font-semibold text-slate-800 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  {product.stockQuantity} units available
                </div>
              </div>
            </div>

            {product.certification && (
              <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Certifications: {product.certification}</span>
              </div>
            )}
          </div>

          <div className="mt-5 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Verified SKU in counSOL database
            </span>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-3 py-1.5 rounded-md transition-colors"
            >
              <Printer className="w-4 h-4" /> Print Label
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
