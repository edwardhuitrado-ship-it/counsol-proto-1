import React, { useState } from 'react';
import { X, Sparkles, AlertCircle, CheckCircle2, Save } from 'lucide-react';
import { Product, SolarCategory } from '../types/inventory';
import { SkuGeneratorModal } from './SkuGeneratorModal';

interface ProductFormModalProps {
  product?: Product | null;
  existingProducts: Product[];
  onSave: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onClose: () => void;
  isVendor?: boolean;
  vendorId?: string;
  vendorName?: string;
}

const CATEGORIES: SolarCategory[] = [
  'Panels & Modules',
  'Inverters',
  'Battery Storage',
  'Racking & Mounting',
  'Charge Controllers',
  'Electrical BOS',
  'Monitoring & IoT',
  'Cables & Wiring',
];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  product,
  existingProducts,
  onSave,
  onClose,
  isVendor = false,
  vendorId = 'vendor-sunvolt',
  vendorName = 'SunVolt Dynamics Inc.',
}) => {
  const [sku, setSku] = useState(product?.sku || '');
  const [name, setName] = useState(product?.name || '');
  const [category, setCategory] = useState<SolarCategory>(product?.category || 'Panels & Modules');
  const [description, setDescription] = useState(product?.description || '');
  const [specifications, setSpecifications] = useState(product?.specifications || '');
  const [wattage, setWattage] = useState<number | string>(product?.wattage || '');
  const [voltage, setVoltage] = useState<number | string>(product?.voltage || '');
  const [stockQuantity, setStockQuantity] = useState<number>(product?.stockQuantity ?? 50);
  const [reorderPoint, setReorderPoint] = useState<number>(product?.reorderPoint ?? 15);
  const [unitCost, setUnitCost] = useState<number>(product?.unitCost ?? 100);
  const [unitPrice, setUnitPrice] = useState<number>(product?.unitPrice ?? 150);
  const [warehouseLocation, setWarehouseLocation] = useState(product?.warehouseLocation || 'Bay A - Rack 01');
  const [warrantyYears, setWarrantyYears] = useState<number | string>(product?.warrantyYears ?? 25);
  const [certification, setCertification] = useState(product?.certification || 'UL 61730, CEC Listed');
  const [vendor, setVendor] = useState(isVendor ? vendorName : product?.vendorName || 'SunVolt Dynamics Inc.');
  const [vendorCode, setVendorCode] = useState(isVendor ? vendorId : product?.vendorId || 'vendor-sunvolt');

  const [showSkuGenerator, setShowSkuGenerator] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // SKU duplicate check (ignore current product id if editing)
  const isDuplicateSku = existingProducts.some(
    (p) => p.sku.trim().toLowerCase() === sku.trim().toLowerCase() && p.id !== product?.id
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!sku.trim()) {
      setErrorMsg('Unique SKU number is required.');
      return;
    }

    if (isDuplicateSku) {
      setErrorMsg(`SKU "${sku}" is already in use by another solar product. SKUs must be unique.`);
      return;
    }

    if (!name.trim()) {
      setErrorMsg('Product name is required.');
      return;
    }

    setSaving(true);
    try {
      let status: Product['status'] = 'in_stock';
      if (stockQuantity <= 0) {
        status = 'out_of_stock';
      } else if (stockQuantity <= reorderPoint) {
        status = 'low_stock';
      }

      await onSave({
        sku: sku.trim().toUpperCase(),
        name: name.trim(),
        category,
        description: description.trim(),
        specifications: specifications.trim(),
        wattage: wattage ? Number(wattage) : undefined,
        voltage: voltage ? Number(voltage) : undefined,
        stockQuantity: Number(stockQuantity),
        allocatedQuantity: product?.allocatedQuantity || 0,
        reorderPoint: Number(reorderPoint),
        unitCost: Number(unitCost),
        unitPrice: Number(unitPrice),
        vendorId: vendorCode,
        vendorName: vendor,
        warehouseLocation: warehouseLocation.trim(),
        status,
        warrantyYears: warrantyYears ? Number(warrantyYears) : undefined,
        certification: certification.trim(),
      });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error saving solar product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
        <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden text-slate-100">
          {/* Header */}
          <div className="bg-slate-800/90 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">
                {product ? 'Edit Solar Hardware Record' : 'Register New Solar Product & SKU'}
              </h3>
              <p className="text-xs text-slate-400">counSOL america Inventory Catalog</p>
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

            {/* SKU Field with Generator & Unique check */}
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  Unique Solar SKU Number *
                </label>
                <button
                  type="button"
                  onClick={() => setShowSkuGenerator(true)}
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Auto-Generate SKU
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  placeholder="e.g. CS-MOD-550-BIF"
                  className={`w-full bg-slate-900 border rounded-lg px-3 py-2 font-mono text-sm tracking-wider font-semibold focus:outline-none ${
                    isDuplicateSku
                      ? 'border-rose-500 text-rose-300'
                      : sku
                      ? 'border-emerald-500 text-amber-300'
                      : 'border-slate-700 text-slate-100'
                  }`}
                  required
                />
                <div className="absolute right-3 top-2.5">
                  {sku && !isDuplicateSku && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  {isDuplicateSku && <AlertCircle className="w-4 h-4 text-rose-400" />}
                </div>
              </div>

              <div className="mt-1.5 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">
                  Standard format: <code>CS-[CATEGORY]-[SPECS]-[TYPE]</code>
                </span>
                {isDuplicateSku ? (
                  <span className="text-rose-400 font-medium">SKU already exists in catalog</span>
                ) : sku ? (
                  <span className="text-emerald-400 font-medium">Valid unique SKU</span>
                ) : null}
              </div>
            </div>

            {/* Product Title & Category */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Heliomax Bifacial 550W Dual-Glass Tier-1 Panel"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as SolarCategory)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description & Technical Specs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Technical Specifications Summary
                </label>
                <input
                  type="text"
                  value={specifications}
                  onChange={(e) => setSpecifications(e.target.value)}
                  placeholder="e.g. 550W STC, 49.8V Voc, 13.98A Isc, MC4"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Certifications & Standards
                </label>
                <input
                  type="text"
                  value={certification}
                  onChange={(e) => setCertification(e.target.value)}
                  placeholder="e.g. UL 1741-SB, IEEE 1547, CEC Listed"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Electrical ratings */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Power Rating (Watts)
                </label>
                <input
                  type="number"
                  value={wattage}
                  onChange={(e) => setWattage(e.target.value)}
                  placeholder="e.g. 550"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nominal Voltage (V)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={voltage}
                  onChange={(e) => setVoltage(e.target.value)}
                  placeholder="e.g. 49.8"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Warranty (Years)
                </label>
                <input
                  type="number"
                  value={warrantyYears}
                  onChange={(e) => setWarrantyYears(e.target.value)}
                  placeholder="e.g. 25"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Stock, Reorder Point, and Location */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-800/40 p-3 rounded-lg border border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Current Stock Units *
                </label>
                <input
                  type="number"
                  min="0"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Low-Stock Reorder Point *
                </label>
                <input
                  type="number"
                  min="1"
                  value={reorderPoint}
                  onChange={(e) => setReorderPoint(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Warehouse Bin Location *
                </label>
                <input
                  type="text"
                  value={warehouseLocation}
                  onChange={(e) => setWarehouseLocation(e.target.value)}
                  placeholder="e.g. Bay A - Rack 04 - Bin 02"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>

            {/* Pricing & Supplier */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Unit Cost ($ USD) {isVendor && '(Your Supply Price)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-mono">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={unitCost}
                    onChange={(e) => setUnitCost(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Catalog Price ($ USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-mono">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Vendor / Manufacturer
                </label>
                {isVendor ? (
                  <input
                    type="text"
                    value={vendorName}
                    disabled
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-400 cursor-not-allowed text-xs"
                  />
                ) : (
                  <input
                    type="text"
                    value={vendor}
                    onChange={(e) => {
                      setVendor(e.target.value);
                      setVendorCode(`vendor-${e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')}`);
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 text-xs"
                  />
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Description & Installation Notes
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Product characteristics, cell technology, compatibility notes..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 text-xs"
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
                disabled={saving || isDuplicateSku}
                className="px-5 py-2 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : product ? 'Save Changes' : 'Register Product & SKU'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showSkuGenerator && (
        <SkuGeneratorModal
          existingProducts={existingProducts}
          initialCategory={category}
          onSelectSku={(generated) => setSku(generated)}
          onClose={() => setShowSkuGenerator(false)}
        />
      )}
    </>
  );
};
