import React, { useState } from 'react';
import {
  Package,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Plus,
  Sparkles,
  Search,
  Filter,
  ArrowUpDown,
  Edit2,
  Trash2,
  Truck,
  FileText,
  Users,
  History,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  ListChecks,
  ShieldCheck,
  QrCode,
  MapPin,
  Award,
  FolderGit2,
  Cpu,
  Inbox,
} from 'lucide-react';
import {
  Product,
  Requisition,
  Shipment,
  StockMovement,
  UserProfile,
  SolarCategory,
  MovementType,
  RequisitionStatus,
} from '../types/inventory';
import { SkuBadge } from './SkuBadge';
import { ProductFormModal } from './ProductFormModal';
import { StockAdjustmentModal } from './StockAdjustmentModal';
import { RequisitionDetailModal } from './RequisitionDetailModal';
import { ShipmentModal } from './ShipmentModal';
import { SkuGeneratorModal } from './SkuGeneratorModal';
import { TotalFinancesView } from './TotalFinancesView';
import { ExcelSkuImportModal } from './ExcelSkuImportModal';
import { IntakeOperationsView } from './IntakeOperationsView';
import { PartnersNetworkView } from './PartnersNetworkView';
import { SafeHarborComplianceView } from './SafeHarborComplianceView';
import { SerialTraceabilityView } from './SerialTraceabilityView';
import { SiteVisitOperationsView } from './SiteVisitOperationsView';
import { ScorecardsRiskView } from './ScorecardsRiskView';
import { DocumentsAutomationView } from './DocumentsAutomationView';
import { PlatformAdminView } from './PlatformAdminView';
import { SEED_OUTBOUND_SHIPMENTS } from '../data/backlogSeedData';

export type AdminTab =
  | 'catalog'
  | 'finances'
  | 'intake'
  | 'partners'
  | 'compliance'
  | 'serials'
  | 'site_visits'
  | 'scorecards'
  | 'documents'
  | 'admin_sys'
  | 'requisitions'
  | 'shipments'
  | 'audit'
  | 'users';

interface AdminViewProps {
  products: Product[];
  requisitions: Requisition[];
  shipments: Shipment[];
  movements: StockMovement[];
  users: UserProfile[];
  operatorEmail: string;
  onAddProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Product>;
  onUpdateProduct: (id: string, updates: Partial<Product>, reason?: string) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onAdjustStock: (
    productId: string,
    delta: number,
    type: MovementType,
    reason: string,
    ref: string
  ) => Promise<void>;
  onUpdateRequisitionStatus: (id: string, status: RequisitionStatus) => Promise<void>;
  onSaveShipment: (shipment: Omit<Shipment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Shipment>;
  onReceiveShipment: (shipmentId: string) => Promise<void>;
  onUpdateUserRole: (userId: string, role: UserProfile['role']) => Promise<void>;
}

export const AdminView: React.FC<AdminViewProps> = ({
  products,
  requisitions,
  shipments,
  movements,
  users,
  operatorEmail,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAdjustStock,
  onUpdateRequisitionStatus,
  onSaveShipment,
  onReceiveShipment,
  onUpdateUserRole,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('catalog');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [selectedRequisition, setSelectedRequisition] = useState<Requisition | null>(null);
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [showSkuGenerator, setShowSkuGenerator] = useState(false);
  const [showExcelImport, setShowExcelImport] = useState(false);

  // Bulk import from Excel
  const handleBulkImportProducts = async (
    newProducts: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]
  ) => {
    for (const item of newProducts) {
      const existing = products.find(
        (p) => p.sku.toUpperCase() === item.sku.toUpperCase()
      );
      if (existing) {
        await onUpdateProduct(
          existing.id,
          {
            stockQuantity: existing.stockQuantity + item.stockQuantity,
            unitCost: item.unitCost,
            unitPrice: item.unitPrice,
            specifications: item.specifications || existing.specifications,
          },
          'Excel bulk import stock increment'
        );
      } else {
        await onAddProduct(item);
      }
    }
  };

  // Metric Computations
  const totalSkus = products.length;
  const totalStockUnits = products.reduce((acc, p) => acc + p.stockQuantity, 0);
  const totalInventoryValuation = products.reduce(
    (acc, p) => acc + p.stockQuantity * p.unitCost,
    0
  );
  const lowStockProducts = products.filter(
    (p) => p.stockQuantity <= p.reorderPoint || p.status === 'low_stock' || p.status === 'out_of_stock'
  );
  const pendingRequisitions = requisitions.filter((r) => r.status === 'pending');
  const activeInboundShipments = shipments.filter(
    (s) => s.status === 'in_transit' || s.status === 'dispatched'
  );

  // Filtering products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.specifications.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.warehouseLocation.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' || p.category === selectedCategory;

    const matchesStatus =
      selectedStatus === 'All' || p.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const exportCsv = () => {
    const headers = [
      'SKU',
      'Name',
      'Category',
      'Stock Quantity',
      'Allocated',
      'Available',
      'Reorder Point',
      'Unit Cost',
      'Unit Price',
      'Location',
      'Vendor',
      'Status',
    ];
    const rows = products.map((p) => [
      p.sku,
      `"${p.name.replace(/"/g, '""')}"`,
      p.category,
      p.stockQuantity,
      p.allocatedQuantity || 0,
      p.stockQuantity - (p.allocatedQuantity || 0),
      p.reorderPoint,
      p.unitCost,
      p.unitPrice,
      `"${p.warehouseLocation}"`,
      `"${p.vendorName}"`,
      p.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `counSOL_Solar_Inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome & KPI Metrics Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs uppercase font-mono font-bold text-amber-400 tracking-wider">
                Enterprise Inventory Control
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white mt-1">
              counSOL america Administrator Center
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Full Role-Based Access Control • Unique Solar SKU Registry • Warehouse Inventory Lifecycle
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowExcelImport(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 rounded-lg transition-colors shadow-sm"
              title="Import Excel or CSV files of SKUs with drag-and-drop panel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Import Excel SKUs
            </button>
            <button
              onClick={exportCsv}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" /> Export CSV
            </button>
            <button
              onClick={() => setShowSkuGenerator(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-amber-300 border border-amber-500/30 rounded-lg transition-colors"
            >
              <Sparkles className="w-4 h-4 text-amber-400" /> New Solar SKU
            </button>
            <button
              onClick={() => {
                setEditingProduct(null);
                setShowProductModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-md transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Solar Product
            </button>
          </div>
        </div>

        {/* 4 Key Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase">Total Solar SKUs</span>
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white mt-2 font-mono">{totalSkus}</div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span>{totalStockUnits.toLocaleString()}</span> units in warehouse
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase">Inventory Value</span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-2 font-mono">
              ${totalInventoryValuation.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Based on supplier acquisition cost</div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase">Low-Stock Alerts</span>
              <div
                className={`p-1.5 rounded-lg ${
                  lowStockProducts.length > 0
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div
              className={`text-2xl font-black mt-2 font-mono ${
                lowStockProducts.length > 0 ? 'text-rose-400' : 'text-slate-300'
              }`}
            >
              {lowStockProducts.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {lowStockProducts.length > 0 ? 'Requires vendor reorder' : 'All levels nominal'}
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase">Pending Orders</span>
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-cyan-400 mt-2 font-mono">
              {pendingRequisitions.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {activeInboundShipments.length} inbound vendor shipments
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs font-semibold">
        {/* Total Finances Tab - Explicit User Request */}
        <button
          onClick={() => setActiveTab('finances')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
            activeTab === 'finances'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span>Total Finances</span>
          <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
            Live
          </span>
        </button>

        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
            activeTab === 'catalog'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Master Catalog & SKUs ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('intake')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
            activeTab === 'intake'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Intake & Onboarding</span>
        </button>

        <button
          onClick={() => setActiveTab('partners')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
            activeTab === 'partners'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Partners Directory</span>
        </button>

        <button
          onClick={() => setActiveTab('compliance')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
            activeTab === 'compliance'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Safe Harbor 7-Point</span>
        </button>

        <button
          onClick={() => setActiveTab('serials')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
            activeTab === 'serials'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Serials & Logistics</span>
        </button>

        <button
          onClick={() => setActiveTab('site_visits')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
            activeTab === 'site_visits'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Site Visits QA</span>
        </button>

        <button
          onClick={() => setActiveTab('scorecards')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
            activeTab === 'scorecards'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Scorecards & Risk</span>
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
            activeTab === 'documents'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FolderGit2 className="w-4 h-4" />
          <span>Drive & Automation</span>
        </button>

        <button
          onClick={() => setActiveTab('admin_sys')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
            activeTab === 'admin_sys'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Security & APIs</span>
        </button>

        <button
          onClick={() => setActiveTab('requisitions')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
            activeTab === 'requisitions'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Requisitions</span>
          {pendingRequisitions.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-cyan-500 text-slate-950 font-black text-[10px]">
              {pendingRequisitions.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('shipments')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
            activeTab === 'shipments'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Vendor Shipments ({shipments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
            activeTab === 'audit'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Ledger</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all ${
            activeTab === 'users'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>RBAC Users</span>
        </button>
      </div>

      {/* TAB 1: MASTER CATALOG */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by unique SKU, solar model, specs, vendor, or warehouse bay..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500 placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-transparent text-slate-200 focus:outline-none text-xs"
                >
                  <option value="All">All Categories</option>
                  <option value="Panels & Modules">Panels & Modules</option>
                  <option value="Inverters">Inverters</option>
                  <option value="Battery Storage">Battery Storage</option>
                  <option value="Racking & Mounting">Racking & Mounting</option>
                  <option value="Charge Controllers">Charge Controllers</option>
                  <option value="Electrical BOS">Electrical BOS</option>
                  <option value="Monitoring & IoT">Monitoring & IoT</option>
                  <option value="Cables & Wiring">Cables & Wiring</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-transparent text-slate-200 focus:outline-none text-xs"
                >
                  <option value="All">All Statuses</option>
                  <option value="in_stock">In Stock</option>
                  <option value="low_stock">Low Stock Alert</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>
            </div>
          </div>

          {/* Catalog Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-850 text-slate-400 uppercase font-semibold tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Unique Solar SKU</th>
                    <th className="py-3 px-4">Product Description & Specs</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Bin Location</th>
                    <th className="py-3 px-3 text-center">In Stock</th>
                    <th className="py-3 px-3 text-center">Allocated</th>
                    <th className="py-3 px-3 text-right">Cost (Wholesale)</th>
                    <th className="py-3 px-3 text-right">MSRP / Price</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
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
                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-semibold text-white leading-tight">{p.name}</div>
                          <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {p.specifications}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Supplier: <span className="text-slate-400">{p.vendorName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-slate-400">
                          {p.warehouseLocation}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span
                            className={`font-mono font-bold text-sm ${
                              isLow ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            {p.stockQuantity}
                          </span>
                          <div className="text-[10px] text-slate-500">Min: {p.reorderPoint}</div>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap font-mono text-slate-400">
                          {p.allocatedQuantity || 0}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap font-mono text-slate-300">
                          ${p.unitCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap font-mono font-bold text-white">
                          ${p.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {p.status === 'out_of_stock' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 animate-pulse">
                              Low Stock
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setAdjustingProduct(p)}
                              title="Audit / Adjust Stock"
                              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
                            >
                              <ArrowUpDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setShowProductModal(true);
                              }}
                              title="Edit Record"
                              className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Remove SKU ${p.sku} from counSOL catalog?`)) {
                                  onDeleteProduct(p.id);
                                }
                              }}
                              title="Delete SKU"
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredProducts.length === 0 && (
                <div className="py-12 text-center text-slate-500">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold">No solar products found</p>
                  <p className="text-xs">Adjust your search filters or add a new solar product & SKU.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REQUISITIONS */}
      {activeTab === 'requisitions' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">Solar Project Equipment Requisitions</h3>
                <p className="text-xs text-slate-400">
                  End-User & Solar Contractor orders requiring admin approval, allocation & dispatch
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-850 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Req Number</th>
                    <th className="py-3 px-4">Project / Contractor</th>
                    <th className="py-3 px-4">Job Site Address</th>
                    <th className="py-3 px-3">Equipment Summary</th>
                    <th className="py-3 px-3 text-center">Units</th>
                    <th className="py-3 px-3 text-right">Subtotal</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Workflow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {requisitions.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">
                        {r.requisitionNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{r.projectName}</div>
                        <div className="text-[11px] text-slate-400">
                          {r.userName} ({r.userEmail})
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                        {r.jobSiteAddress}
                      </td>
                      <td className="py-3 px-3 max-w-xs truncate font-mono text-[11px] text-slate-300">
                        {r.itemsSummary}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-white">
                        {r.totalItemsCount}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                        ${r.totalEstimatedCost.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            r.status === 'pending'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : r.status === 'approved'
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                              : r.status === 'allocated'
                              ? 'bg-blue-950 text-blue-300 border border-blue-800'
                              : r.status === 'shipped'
                              ? 'bg-purple-950 text-purple-300 border border-purple-800'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}
                        >
                          {r.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedRequisition(r)}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-750 text-amber-400 border border-slate-700 rounded text-xs font-semibold transition-colors"
                        >
                          Review & Process
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {requisitions.length === 0 && (
                <div className="py-12 text-center text-slate-500">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold">No equipment requisitions on file</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VENDOR SHIPMENTS */}
      {activeTab === 'shipments' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">Inbound Vendor Restock Shipments</h3>
                <p className="text-xs text-slate-400">
                  Receive restock deliveries directly into counSOL warehouse inventory
                </p>
              </div>
              <button
                onClick={() => setShowShipmentModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Log Inbound Delivery
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-850 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Shipment #</th>
                    <th className="py-3 px-4">Supplier / Vendor</th>
                    <th className="py-3 px-4">Carrier & Tracking</th>
                    <th className="py-3 px-3">Cargo Items</th>
                    <th className="py-3 px-3 text-center">Units</th>
                    <th className="py-3 px-3">Estimated ETA</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Warehouse Receiving</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {shipments.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">
                        {s.shipmentNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">{s.vendorName}</td>
                      <td className="py-3 px-4">
                        <div className="text-slate-200 font-medium">{s.carrier}</div>
                        <div className="font-mono text-[10px] text-slate-400">{s.trackingNumber}</div>
                      </td>
                      <td className="py-3 px-3 max-w-xs truncate text-slate-300">
                        {s.itemsSummary}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-white">{s.totalUnits}</td>
                      <td className="py-3 px-3 font-mono text-slate-300">{s.estimatedDelivery}</td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            s.status === 'received_into_stock'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-cyan-950 text-cyan-300 border border-cyan-800 animate-pulse'
                          }`}
                        >
                          {s.status === 'received_into_stock' ? 'RECEIVED INTO STOCK' : 'IN TRANSIT'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {s.status !== 'received_into_stock' ? (
                          <button
                            onClick={() => {
                              if (confirm(`Receive ${s.totalUnits} units from ${s.shipmentNumber} into counSOL warehouse stock?`)) {
                                onReceiveShipment(s.id);
                              }
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition-colors flex items-center gap-1 ml-auto"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Receive to Stock
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-400 font-semibold">
                            Inventory Updated
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {shipments.length === 0 && (
                <div className="py-12 text-center text-slate-500">
                  <Truck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold">No shipments recorded</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LEDGER */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="px-6 py-4 border-b border-slate-800">
            <h3 className="font-bold text-white text-sm">Immutable Stock Movement Audit Trail</h3>
            <p className="text-xs text-slate-400">
              Complete traceable record of every inbound delivery, outbound dispatch, and physical count audit
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-850 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Solar SKU</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-3">Movement Type</th>
                  <th className="py-3 px-3 text-center">Delta</th>
                  <th className="py-3 px-3 text-center">Balance</th>
                  <th className="py-3 px-4">Reference / Reason</th>
                  <th className="py-3 px-4 text-right">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(m.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-400 whitespace-nowrap">
                      {m.sku}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-200">{m.productName}</td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          m.movementType === 'inbound'
                            ? 'bg-emerald-950 text-emerald-300'
                            : m.movementType === 'outbound'
                            ? 'bg-cyan-950 text-cyan-300'
                            : m.movementType === 'damaged'
                            ? 'bg-rose-950 text-rose-300'
                            : 'bg-amber-950 text-amber-300'
                        }`}
                      >
                        {m.movementType}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold whitespace-nowrap">
                      <span className={m.quantityDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {m.quantityDelta >= 0 ? `+${m.quantityDelta}` : m.quantityDelta}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-300 whitespace-nowrap">
                      {m.previousQuantity} &rarr; <strong className="text-white">{m.newQuantity}</strong>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <span className="font-mono text-[10px] text-slate-400 bg-slate-950 px-1 rounded mr-1">
                        {m.referenceId}
                      </span>
                      <span className="text-slate-300 text-[11px]">{m.reason}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {m.operatorEmail}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: RBAC & ACCOUNTS */}
      {activeTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="px-6 py-4 border-b border-slate-800">
            <h3 className="font-bold text-white text-sm">Role-Based Access Control (RBAC) User Registry</h3>
            <p className="text-xs text-slate-400">
              Manage permissions between Administrative, Vendor, and End-User accounts
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-850 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Organization / Company</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4 text-right">Role Management</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">{u.displayName}</td>
                    <td className="py-3 px-4 font-mono text-slate-300">{u.email}</td>
                    <td className="py-3 px-4 text-slate-400">{u.companyName}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          u.role === 'admin'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : u.role === 'vendor'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        }`}
                      >
                        {u.role === 'admin'
                          ? 'Administrative'
                          : u.role === 'vendor'
                          ? 'Vendor / Supplier'
                          : 'End-User / Contractor'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <select
                        value={u.role}
                        onChange={(e) => onUpdateUserRole(u.id, e.target.value as UserProfile['role'])}
                        className="bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="admin">Administrative</option>
                        <option value="vendor">Vendor</option>
                        <option value="end_user">End-User</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: TOTAL FINANCES - EXPLICIT USER REQUEST */}
      {activeTab === 'finances' && (
        <TotalFinancesView
          products={products}
          requisitions={requisitions}
          outboundShipments={SEED_OUTBOUND_SHIPMENTS}
        />
      )}

      {/* TAB: INTAKE & ONBOARDING (US-01 - US-05) */}
      {activeTab === 'intake' && <IntakeOperationsView />}

      {/* TAB: PARTNER DIRECTORY (US-06 - US-13) */}
      {activeTab === 'partners' && <PartnersNetworkView currentRole="admin" />}

      {/* TAB: SAFE HARBOR 7-POINT COMPLIANCE (US-14 - US-21) */}
      {activeTab === 'compliance' && <SafeHarborComplianceView />}

      {/* TAB: SERIAL TRACEABILITY & FREIGHT (US-22 - US-29) */}
      {activeTab === 'serials' && <SerialTraceabilityView />}

      {/* TAB: SITE VISITS QA (US-30 - US-35) */}
      {activeTab === 'site_visits' && <SiteVisitOperationsView />}

      {/* TAB: SCORECARDS & RISK (US-36 - US-41) */}
      {activeTab === 'scorecards' && <ScorecardsRiskView />}

      {/* TAB: DRIVE & AUTOMATION (US-42 - US-45) */}
      {activeTab === 'documents' && <DocumentsAutomationView />}

      {/* TAB: SECURITY & OPEN APIS (US-46 - US-50) */}
      {activeTab === 'admin_sys' && (
        <PlatformAdminView
          currentRole="admin"
          onSwitchRole={(r) => onUpdateUserRole('demo-user', r)}
        />
      )}

      {/* Modals */}
      {showProductModal && (
        <ProductFormModal
          product={editingProduct}
          existingProducts={products}
          onSave={async (data) => {
            if (editingProduct) {
              await onUpdateProduct(editingProduct.id, data);
            } else {
              await onAddProduct(data);
            }
          }}
          onClose={() => {
            setShowProductModal(false);
            setEditingProduct(null);
          }}
        />
      )}

      {adjustingProduct && (
        <StockAdjustmentModal
          product={adjustingProduct}
          onAdjust={onAdjustStock}
          onClose={() => setAdjustingProduct(null)}
        />
      )}

      {selectedRequisition && (
        <RequisitionDetailModal
          requisition={selectedRequisition}
          isAdmin={true}
          onUpdateStatus={onUpdateRequisitionStatus}
          onClose={() => setSelectedRequisition(null)}
        />
      )}

      {showShipmentModal && (
        <ShipmentModal
          products={products}
          vendorId="vendor-sunvolt"
          vendorName="SunVolt Dynamics Inc."
          isAdmin={true}
          onSaveShipment={onSaveShipment}
          onClose={() => setShowShipmentModal(false)}
        />
      )}

      {showSkuGenerator && (
        <SkuGeneratorModal
          existingProducts={products}
          onSelectSku={(sku) => {
            setEditingProduct(null);
            setShowProductModal(true);
          }}
          onClose={() => setShowSkuGenerator(false)}
        />
      )}

      {/* Excel SKU Import Modal (Explicit User Request) */}
      {showExcelImport && (
        <ExcelSkuImportModal
          existingProducts={products}
          onImportProducts={handleBulkImportProducts}
          onClose={() => setShowExcelImport(false)}
        />
      )}
    </div>
  );
};
