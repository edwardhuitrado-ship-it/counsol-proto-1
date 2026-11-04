import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, CheckCircle2, Copy } from 'lucide-react';
import { SolarCategory, Product } from '../types/inventory';

interface SkuGeneratorModalProps {
  existingProducts: Product[];
  onSelectSku: (sku: string) => void;
  onClose: () => void;
  initialCategory?: SolarCategory;
}

const CATEGORY_CODES: Record<SolarCategory, string> = {
  'Panels & Modules': 'MOD',
  Inverters: 'INV',
  'Battery Storage': 'BAT',
  'Racking & Mounting': 'RCK',
  'Charge Controllers': 'CHG',
  'Electrical BOS': 'BOS',
  'Monitoring & IoT': 'IOT',
  'Cables & Wiring': 'CAB',
};

const TECH_SUBTYPES: Record<string, string[]> = {
  MOD: ['BIF (Bifacial)', 'TOP (TopCon)', 'PERC (Monocrystalline)', 'FLX (Flexible)', 'HJT (Heterojunction)'],
  INV: ['HYB (Hybrid Storage)', 'STR (String Inverter)', 'MIC (Microinverter)', 'CEN (Central Utility)'],
  BAT: ['LFP (LiFePO4 Rack)', 'HV (High-Voltage Cabinet)', 'WALL (Wall-mount Resi)', 'NMC (High Energy Density)'],
  RCK: ['TILE (Tile Roof)', 'SHNG (Asphalt Shingle)', 'SEAM (Metal Standing Seam)', 'BALL (Flat Roof Ballast)', 'GRND (Ground Mount)'],
  CHG: ['MPPT (Max Power Tracker)', 'PWM (Standard PWM)', 'OPT (DC Optimizer)'],
  BOS: ['CMB (Combiner Box)', 'RSD (Rapid Shutdown)', 'DISC (Safety Disconnect)', 'FUSE (Solar Fused Block)', 'SPD (Surge Protector)'],
  IOT: ['MTR (Revenue Meter)', 'GATE (Cellular/WiFi Gateway)', 'PYR (Irradiance Sensor)', 'WTH (Weather Station)'],
  CAB: ['PV10 (10 AWG PV Wire)', 'PV12 (12 AWG PV Wire)', 'MC4 (MC4 Connector Pack)', 'TRAY (Cable Management)'],
};

export const SkuGeneratorModal: React.FC<SkuGeneratorModalProps> = ({
  existingProducts,
  onSelectSku,
  onClose,
  initialCategory = 'Panels & Modules',
}) => {
  const [category, setCategory] = useState<SolarCategory>(initialCategory);
  const [rating, setRating] = useState<string>('550'); // wattage or specs code
  const [subType, setSubType] = useState<string>('BIF');
  const [revision, setRevision] = useState<string>('V1');

  const catCode = CATEGORY_CODES[category] || 'MOD';

  // Construct SKU
  const cleanRating = rating.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cleanSub = subType.split(' ')[0].replace(/[^A-Z0-9]/g, '');
  const cleanRev = revision.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

  const generatedSku = `CS-${catCode}-${cleanRating || 'STD'}-${cleanSub || 'GEN'}${
    cleanRev ? `-${cleanRev}` : ''
  }`;

  // Check uniqueness against existing products
  const isDuplicate = existingProducts.some(
    (p) => p.sku.toLowerCase() === generatedSku.toLowerCase()
  );

  const availableSubtypes = TECH_SUBTYPES[catCode] || ['STD (Standard)'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-100">
        <div className="bg-slate-800/90 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-amber-500/20 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Solar SKU Generator</h3>
              <p className="text-xs text-slate-400">counSOL Standardized Solar Hardware Encoding</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white rounded-lg p-1.5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              1. Solar Category
            </label>
            <select
              value={category}
              onChange={(e) => {
                const newCat = e.target.value as SolarCategory;
                setCategory(newCat);
                const code = CATEGORY_CODES[newCat];
                const firstSub = TECH_SUBTYPES[code]?.[0]?.split(' ')[0] || 'STD';
                setSubType(firstSub);
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
            >
              {Object.keys(CATEGORY_CODES).map((cat) => (
                <option key={cat} value={cat}>
                  {cat} ({CATEGORY_CODES[cat as SolarCategory]})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                2. Rating / Capacity / Size
              </label>
              <input
                type="text"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                placeholder="e.g. 550, 10K, 15K, 60A"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Wattage (e.g. 550W), kW (10K), or Amps (60A)
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                3. Technology Subtype
              </label>
              <select
                value={subType}
                onChange={(e) => setSubType(e.target.value.split(' ')[0])}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              >
                {availableSubtypes.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              4. Revision / Iteration Code
            </label>
            <input
              type="text"
              value={revision}
              onChange={(e) => setRevision(e.target.value)}
              placeholder="e.g. V1, V2, A, REV1"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Generated Result Box */}
          <div className="mt-4 bg-slate-950 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium">Unique Generated SKU:</span>
              {isDuplicate ? (
                <span className="flex items-center gap-1 text-xs text-rose-400 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" /> Already In Use!
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Guaranteed Unique
                </span>
              )}
            </div>

            <div className="flex items-center justify-between bg-slate-900 border border-slate-700/80 rounded-md p-3">
              <span className="font-mono text-base font-bold text-amber-400 tracking-wider">
                {generatedSku}
              </span>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(generatedSku)}
                className="text-slate-400 hover:text-amber-300 p-1 transition-colors"
                title="Copy to clipboard"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              counSOL Schema: <code>CS-[CATEGORY]-[SPECS]-[TECH]-[REV]</code>
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-300 hover:text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDuplicate}
              onClick={() => {
                onSelectSku(generatedSku);
                onClose();
              }}
              className="px-4 py-2 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Apply SKU to Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
