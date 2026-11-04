import React, { useState } from 'react';
import {
  Briefcase,
  Package,
  Truck,
  AlertTriangle,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { Product, Shipment } from '../types/inventory';
import { SkuBadge } from './SkuBadge';
import { ProductFormModal } from './ProductFormModal';
import { ShipmentModal } from './ShipmentModal';

interface VendorViewProps {
  products: Product[];
  shipments: Shipment[];
  vendorId: string;
  vendorName: string;
  onAddProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Product>;
  onSaveShipment: (shipment: Omit<Shipment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Shipment>;
}

export const VendorView: React.FC<VendorViewProps> = ({
  products,
  shipments,
  vendorId,
  vendorName,
  onAddProduct,
  onSaveShipment,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [showShipmentModal, setShowShipmentModal] = useState(false);

  // Vendor-isolated products
  const vendorProducts = products.filter(
    (p) => p.vendorId === vendorId || p.vendorName.toLowerCase() === vendorName.toLowerCase()
  );

  // Filtered by search
  const filteredProducts = vendorProducts.filter(
    (p) =>
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.specifications.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Vendor-isolated shipments
  const vendorShipments = shipments.filter((s) => s.vendorId === vendorId);

  // Low stock alerts for this vendor's SKUs at counSOL warehouse
  const lowStockAlerts = vendorProducts.filter((p) => p.stockQuantity <= p.reorderPoint);

  return (
    <div className="space-y-6">
      {/* Vendor Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border border-emerald-800/40 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
              <span className="text-xs uppercase font-mono font-bold text-emerald-400 tracking-wider">
                Authorized Supplier Portal (RBAC: Vendor)
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white mt-1">
              {vendorName}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              counSOL america Supply Chain • Inbound Restock Fulfillment & Catalog Line
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowProductModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-emerald-300 border border-emerald-500/30 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" /> Propose Solar SKU
            </button>
            <button
              onClick={() => setShowShipmentModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg shadow-md transition-colors"
            >
              <Truck className="w-4 h-4" /> Dispatch Restock Shipment
            </button>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase">
                Active Supplied SKUs
              </span>
              <Package className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white mt-2 font-mono">
              {vendorProducts.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Registered in counSOL inventory catalog
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase">
                Restock Demand Alerts
              </span>
              <div
                className={`p-1.5 rounded-lg ${
                  lowStockAlerts.length > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div
              className={`text-2xl font-black mt-2 font-mono ${
                lowStockAlerts.length > 0 ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {lowStockAlerts.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {lowStockAlerts.length > 0
                ? 'Warehouse stock below threshold'
                : 'All warehouse levels healthy'}
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase">
                In-Transit Shipments
              </span>
              <Truck className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-cyan-400 mt-2 font-mono">
              {vendorShipments.filter((s) => s.status === 'in_transit').length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              En route to counSOL central dock
            </div>
          </div>
        </div>
      </div>

      {/* Restock Alerts Callout if any */}
      {lowStockAlerts.length > 0 && (
        <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <div>
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Urgent Restock Notice from counSOL America
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  The following {lowStockAlerts.length} solar SKU(s) have depleted below safety reorder levels at counSOL central distribution.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowShipmentModal(true)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors shrink-0"
            >
              Ship Restock Batch Now
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-3 pt-3 border-t border-amber-500/20">
            {lowStockAlerts.map((p) => (
              <div
                key={p.id}
                className="bg-slate-900/90 border border-amber-500/20 rounded-lg p-2.5 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-mono font-bold text-amber-400">{p.sku}</span>
                  <div className="text-[11px] text-slate-300 line-clamp-1">{p.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-rose-400 font-bold font-mono text-sm">{p.stockQuantity}</div>
                  <div className="text-[10px] text-slate-400">Reorder at: {p.reorderPoint}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Supplier's Catalog Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-white text-sm">My Supplied Solar Hardware & SKUs</h3>
            <p className="text-xs text-slate-400">
              Only SKUs assigned to {vendorName} are displayed under your vendor account
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your supplied SKUs..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-850 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Solar SKU</th>
                <th className="py-3 px-4">Product Name & Specifications</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-center">counSOL Stock</th>
                <th className="py-3 px-3 text-center">Reorder Trigger</th>
                <th className="py-3 px-3 text-right">Supply Cost</th>
                <th className="py-3 px-3 text-center">Warehouse Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {filteredProducts.map((p) => {
                const isLow = p.stockQuantity <= p.reorderPoint;
                return (
                  <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <SkuBadge product={p} />
                    </td>
                    <td className="py-3 px-4 max-w-sm">
                      <div className="font-semibold text-white">{p.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{p.specifications}</div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap font-mono font-bold text-sm text-white">
                      {p.stockQuantity}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap font-mono text-slate-400">
                      {p.reorderPoint}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap font-mono font-semibold text-emerald-400">
                      ${p.unitCost.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {isLow ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 animate-pulse">
                          Reorder Needed
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          Sufficient Stock
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <div className="py-10 text-center text-slate-500 text-xs">
              No products found under this supplier profile.
            </div>
          )}
        </div>
      </div>

      {/* Inbound Shipments from this Vendor */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-sm">Dispatched Restock Shipments</h3>
            <p className="text-xs text-slate-400">
              Tracking deliveries dispatched from {vendorName} to counSOL distribution center
            </p>
          </div>
          <button
            onClick={() => setShowShipmentModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Dispatch Shipment
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-850 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Shipment #</th>
                <th className="py-3 px-4">Carrier & Tracking</th>
                <th className="py-3 px-3">Cargo Items</th>
                <th className="py-3 px-3 text-center">Total Units</th>
                <th className="py-3 px-3">Estimated ETA</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {vendorShipments.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                    {s.shipmentNumber}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{s.carrier}</div>
                    <div className="font-mono text-[10px] text-slate-400">{s.trackingNumber}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-300 max-w-xs truncate">
                    {s.itemsSummary}
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-white">{s.totalUnits}</td>
                  <td className="py-3 px-3 font-mono text-slate-300">{s.estimatedDelivery}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        s.status === 'received_into_stock'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                      }`}
                    >
                      {s.status === 'received_into_stock' ? 'RECEIVED INTO WAREHOUSE' : 'IN TRANSIT'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {vendorShipments.length === 0 && (
            <div className="py-10 text-center text-slate-500 text-xs">
              No shipments dispatched yet. Click &quot;Dispatch Restock Shipment&quot; to send inventory.
            </div>
          )}
        </div>
      </div>

      {showProductModal && (
        <ProductFormModal
          existingProducts={products}
          isVendor={true}
          vendorId={vendorId}
          vendorName={vendorName}
          onSave={async (data) => {
            await onAddProduct(data);
          }}
          onClose={() => setShowProductModal(false)}
        />
      )}

      {showShipmentModal && (
        <ShipmentModal
          products={products}
          vendorId={vendorId}
          vendorName={vendorName}
          isAdmin={false}
          onSaveShipment={onSaveShipment}
          onClose={() => setShowShipmentModal(false)}
        />
      )}
    </div>
  );
};
