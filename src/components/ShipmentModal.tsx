import React, { useState } from 'react';
import { X, Truck, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Product, Shipment, ShipmentItem } from '../types/inventory';

interface ShipmentModalProps {
  products: Product[];
  vendorId: string;
  vendorName: string;
  isAdmin: boolean;
  onSaveShipment: (shipment: Omit<Shipment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Shipment | void>;
  onClose: () => void;
}

export const ShipmentModal: React.FC<ShipmentModalProps> = ({
  products,
  vendorId,
  vendorName,
  isAdmin,
  onSaveShipment,
  onClose,
}) => {
  const [carrier, setCarrier] = useState('Freightliner Logistics');
  const [trackingNumber, setTrackingNumber] = useState(`TRK-${Math.floor(100000 + Math.random() * 900000)}`);
  const [estimatedDelivery, setEstimatedDelivery] = useState(
    new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState('Solar equipment restock shipment delivered to counSOL central receiving.');

  // Eligible products for this vendor (or all if admin)
  const vendorProducts = isAdmin
    ? products
    : products.filter((p) => p.vendorId === vendorId || !p.vendorId);

  const [items, setItems] = useState<ShipmentItem[]>([
    {
      productId: vendorProducts[0]?.id || '',
      sku: vendorProducts[0]?.sku || '',
      name: vendorProducts[0]?.name || '',
      quantity: 50,
    },
  ]);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAddItem = () => {
    if (vendorProducts.length === 0) return;
    const first = vendorProducts[0];
    setItems([
      ...items,
      {
        productId: first.id,
        sku: first.sku,
        name: first.name,
        quantity: 25,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemProductChange = (index: number, prodId: string) => {
    const prod = vendorProducts.find((p) => p.id === prodId);
    if (!prod) return;
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      productId: prod.id,
      sku: prod.sku,
      name: prod.name,
    };
    setItems(updated);
  };

  const handleItemQuantityChange = (index: number, qty: number) => {
    const updated = [...items];
    updated[index].quantity = Math.max(1, qty);
    setItems(updated);
  };

  const totalUnits = items.reduce((acc, i) => acc + i.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (items.length === 0) {
      setErrorMsg('Please add at least one solar product SKU to the shipment.');
      return;
    }

    setSaving(true);
    try {
      const itemsSummary = items.map((i) => `${i.quantity}x ${i.sku}`).join(', ');
      const shipmentNumber = `SHP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      await onSaveShipment({
        shipmentNumber,
        vendorId,
        vendorName,
        carrier,
        trackingNumber,
        estimatedDelivery,
        status: 'in_transit',
        items,
        itemsSummary,
        totalUnits,
        notes,
      });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error creating shipment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-xl w-full my-8 overflow-hidden text-slate-100">
        <div className="bg-slate-800/90 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-amber-500/20 text-amber-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Create Inbound Restock Shipment</h3>
              <p className="text-xs text-slate-400">counSOL Supplier Logistics Portal</p>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Vendor / Supplier
              </label>
              <input
                type="text"
                value={vendorName}
                disabled
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-400 cursor-not-allowed text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Freight Carrier *
              </label>
              <input
                type="text"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                placeholder="e.g. Old Dominion Freight, FedEx Freight"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                BOL / Tracking Number *
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500 text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Estimated Delivery ETA *
              </label>
              <input
                type="date"
                value={estimatedDelivery}
                onChange={(e) => setEstimatedDelivery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 text-xs"
                required
              />
            </div>
          </div>

          {/* Items Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Solar Product SKUs In Shipment
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add SKU
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800"
                >
                  <div className="flex-1">
                    <select
                      value={item.productId}
                      onChange={(e) => handleItemProductChange(idx, e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    >
                      {vendorProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.sku} — {p.name.slice(0, 45)}...
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-24">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemQuantityChange(idx, Number(e.target.value))}
                      placeholder="Qty"
                      className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs text-white text-center font-bold focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Delivery / Pallet Instructions
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <span className="text-xs text-slate-400 font-mono">
              Total Units to Dispatch:{' '}
              <strong className="text-emerald-400 text-sm">{totalUnits}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-slate-300 hover:text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors flex items-center gap-2 shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                {saving ? 'Creating...' : 'Dispatch Shipment Notice'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
