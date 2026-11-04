import React, { useState } from 'react';
import { X, Sun, Zap, Battery, CheckCircle2, AlertTriangle, Plus } from 'lucide-react';
import { Product, RequisitionItem } from '../types/inventory';

interface SolarKitCalculatorModalProps {
  products: Product[];
  onAddItemsToCart: (items: RequisitionItem[]) => void;
  onClose: () => void;
}

export const SolarKitCalculatorModal: React.FC<SolarKitCalculatorModalProps> = ({
  products,
  onAddItemsToCart,
  onClose,
}) => {
  const [systemKw, setSystemKw] = useState<number>(10); // 10kW system
  const [batteryHours, setBatteryHours] = useState<number>(4); // 4 hours backup
  const [panelSku, setPanelSku] = useState<string>('CS-MOD-550-BIF');
  const [inverterSku, setInverterSku] = useState<string>('CS-INV-10K-HYB');
  const [batterySku, setBatterySku] = useState<string>('CS-BAT-15K-LFP');

  const selectedPanel = products.find((p) => p.sku === panelSku) || products[0];
  const selectedInverter = products.find((p) => p.sku === inverterSku);
  const selectedBattery = products.find((p) => p.sku === batterySku);
  const racking = products.find((p) => p.sku === 'CS-RCK-UNIV-TILE');
  const combiner = products.find((p) => p.sku === 'CS-BOS-CMB-06STR');

  // Calculations
  const panelWattage = selectedPanel?.wattage || 550;
  const panelsNeeded = Math.ceil((systemKw * 1000) / panelWattage);
  const actualKw = ((panelsNeeded * panelWattage) / 1000).toFixed(2);

  // Inverter needed
  const invertersNeeded = Math.ceil(systemKw / 10);

  // Batteries needed
  const targetKwh = systemKw * batteryHours;
  const batteryKwhPerUnit = 15.36;
  const batteriesNeeded = batteryHours > 0 ? Math.max(1, Math.ceil(targetKwh / batteryKwhPerUnit)) : 0;

  // Racking needed: 24 rails per kit handles ~16 modules
  const rackingKitsNeeded = Math.ceil(panelsNeeded / 16);

  // Combiners needed: 1 per 6 strings (approx 24-30 modules)
  const combinersNeeded = Math.ceil(panelsNeeded / 24);

  // Bill of Materials
  const kitItems: RequisitionItem[] = [
    {
      productId: selectedPanel.id,
      sku: selectedPanel.sku,
      name: selectedPanel.name,
      quantity: panelsNeeded,
      unitPrice: selectedPanel.unitPrice,
    },
  ];

  if (selectedInverter) {
    kitItems.push({
      productId: selectedInverter.id,
      sku: selectedInverter.sku,
      name: selectedInverter.name,
      quantity: invertersNeeded,
      unitPrice: selectedInverter.unitPrice,
    });
  }

  if (batteriesNeeded > 0 && selectedBattery) {
    kitItems.push({
      productId: selectedBattery.id,
      sku: selectedBattery.sku,
      name: selectedBattery.name,
      quantity: batteriesNeeded,
      unitPrice: selectedBattery.unitPrice,
    });
  }

  if (racking) {
    kitItems.push({
      productId: racking.id,
      sku: racking.sku,
      name: racking.name,
      quantity: rackingKitsNeeded,
      unitPrice: racking.unitPrice,
    });
  }

  if (combinersNeeded > 0 && combiner) {
    kitItems.push({
      productId: combiner.id,
      sku: combiner.sku,
      name: combiner.name,
      quantity: combinersNeeded,
      unitPrice: combiner.unitPrice,
    });
  }

  const totalCost = kitItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);

  // Check inventory stock sufficiency
  const stockShortages = kitItems.filter((item) => {
    const prod = products.find((p) => p.id === item.productId);
    return !prod || prod.stockQuantity < item.quantity;
  });

  const handleApply = () => {
    onAddItemsToCart(kitItems);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-3xl w-full my-8 overflow-hidden text-slate-100">
        <div className="bg-slate-800/90 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Solar System Kit Builder & Stock Sizing</h3>
              <p className="text-xs text-slate-400">
                Automated equipment sizing, SKU bill-of-materials & live warehouse check
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white rounded-lg p-1.5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Quick presets */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">
              System Size Presets:
            </span>
            {[5, 10, 20, 50, 100].map((kw) => (
              <button
                key={kw}
                onClick={() => setSystemKw(kw)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  systemKw === kw
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {kw} kW {kw >= 50 ? '(Commercial)' : '(Residential)'}
              </button>
            ))}
          </div>

          {/* Sizing Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Custom Target Array (kW DC)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={systemKw}
                  onChange={(e) => setSystemKw(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-500"
                />
                <span className="text-sm font-semibold text-slate-400">kW</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Battery Storage Backup (Hours)
              </label>
              <select
                value={batteryHours}
                onChange={(e) => setBatteryHours(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value={0}>Grid-Tie Only (No Battery)</option>
                <option value={2}>2 Hours (~30 kWh)</option>
                <option value={4}>4 Hours (~60 kWh)</option>
                <option value={8}>8 Hours (~120 kWh)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Preferred Solar Module SKU
              </label>
              <select
                value={panelSku}
                onChange={(e) => setPanelSku(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              >
                <option value="CS-MOD-550-BIF">CS-MOD-550-BIF (550W Bifacial)</option>
                <option value="CS-MOD-420-TOP">CS-MOD-420-TOP (420W TopCon)</option>
                <option value="CS-MOD-670-PERC">CS-MOD-670-PERC (670W Utility)</option>
              </select>
            </div>
          </div>

          {/* Sizing Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-3.5">
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium mb-1">
                <Sun className="w-4 h-4" /> Solar PV Array
              </div>
              <div className="text-xl font-bold text-white">{panelsNeeded} Panels</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Calculated: {actualKw} kW DC</div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-3.5">
              <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-medium mb-1">
                <Zap className="w-4 h-4" /> Power Conversion
              </div>
              <div className="text-xl font-bold text-white">{invertersNeeded} Inverter(s)</div>
              <div className="text-[11px] text-slate-400 mt-0.5">10kW Hybrid split-phase</div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-3.5">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium mb-1">
                <Battery className="w-4 h-4" /> Storage Capacity
              </div>
              <div className="text-xl font-bold text-white">
                {batteriesNeeded > 0 ? `${batteriesNeeded} Module(s)` : 'None'}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {batteriesNeeded > 0
                  ? `${(batteriesNeeded * 15.36).toFixed(1)} kWh LiFePO4`
                  : 'Pure grid-tied'}
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-3.5">
              <div className="flex items-center gap-1.5 text-xs text-purple-400 font-medium mb-1">
                Estimated Price
              </div>
              <div className="text-xl font-bold text-white">${totalCost.toLocaleString()}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Hardware BOM total</div>
            </div>
          </div>

          {/* Generated Bill of Materials Table with Warehouse Stock Check */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Automated Kit Bill of Materials (BOM)
              </h4>
              {stockShortages.length === 0 ? (
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> All Items In Stock at counSOL Warehouse
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-amber-400 font-semibold">
                  <AlertTriangle className="w-4 h-4" /> {stockShortages.length} item(s) have low stock
                </span>
              )}
            </div>

            <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-950">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/80 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-center">Kit Qty</th>
                    <th className="py-2.5 px-3 text-center">Warehouse Stock</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Ext. Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {kitItems.map((item) => {
                    const prod = products.find((p) => p.id === item.productId);
                    const inStock = prod ? prod.stockQuantity : 0;
                    const isDeficit = inStock < item.quantity;
                    return (
                      <tr key={item.productId} className="hover:bg-slate-900/50">
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-400">
                          {item.sku}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 line-clamp-1 max-w-xs">{item.name}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-white">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              isDeficit
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            }`}
                          >
                            {inStock} available
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                          ${item.unitPrice.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                          ${(item.quantity * item.unitPrice).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <span className="text-xs text-slate-400">
              * Quantities calculated per NEC solar wire & string sizing guidelines.
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
                type="button"
                onClick={handleApply}
                className="px-5 py-2 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors flex items-center gap-2 shadow-md"
              >
                <Plus className="w-4 h-4" /> Add Complete Kit to Requisition Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
