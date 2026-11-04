import React, { useState } from 'react';
import {
  Sun,
  Search,
  Filter,
  ShoppingCart,
  Plus,
  Minus,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  FileText,
  AlertCircle,
  Truck,
  Box,
  Trash2,
} from 'lucide-react';
import { Product, Requisition, RequisitionItem, SolarCategory } from '../types/inventory';
import { SkuBadge } from './SkuBadge';
import { SolarKitCalculatorModal } from './SolarKitCalculatorModal';

interface EndUserViewProps {
  products: Product[];
  requisitions: Requisition[];
  userId: string;
  userName: string;
  userEmail: string;
  companyName: string;
  onSubmitRequisition: (
    requisition: Omit<Requisition, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<Requisition>;
}

export const EndUserView: React.FC<EndUserViewProps> = ({
  products,
  requisitions,
  userId,
  userName,
  userEmail,
  companyName,
  onSubmitRequisition,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'orders'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showKitModal, setShowKitModal] = useState(false);
  const [showCartDrawer, setShowCartDrawer] = useState(false);

  // Cart state
  const [cart, setCart] = useState<RequisitionItem[]>([]);

  // Project Requisition Form
  const [projectName, setProjectName] = useState('');
  const [jobSiteAddress, setJobSiteAddress] = useState('');
  const [requiredDate, setRequiredDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Cart operations
  const addToCart = (product: Product, quantity = 1) => {
    const existing = cart.find((i) => i.productId === product.id);
    if (existing) {
      setCart(
        cart.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + quantity } : i
        )
      );
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          sku: product.sku,
          name: product.name,
          quantity,
          unitPrice: product.unitPrice,
        },
      ]);
    }
  };

  const updateCartQty = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      setCart(cart.filter((i) => i.productId !== productId));
    } else {
      setCart(cart.map((i) => (i.productId === productId ? { ...i, quantity: newQty } : i)));
    }
  };

  const handleAddKitItems = (items: RequisitionItem[]) => {
    const merged = [...cart];
    for (const item of items) {
      const idx = merged.findIndex((m) => m.productId === item.productId);
      if (idx >= 0) {
        merged[idx].quantity += item.quantity;
      } else {
        merged.push(item);
      }
    }
    setCart(merged);
    setShowCartDrawer(true);
  };

  const totalCartUnits = cart.reduce((acc, i) => acc + i.quantity, 0);
  const totalCartCost = cart.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);

  // Submit Requisition
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (cart.length === 0) {
      setErrorMsg('Your project cart is empty.');
      return;
    }
    if (!projectName.trim() || !jobSiteAddress.trim()) {
      setErrorMsg('Please specify Project Name and Job Site Delivery Address.');
      return;
    }

    setSubmitting(true);
    try {
      const requisitionNumber = `REQ-${new Date().getFullYear()}-${Math.floor(
        1000 + Math.random() * 9000
      )}`;
      const itemsSummary = cart.map((i) => `${i.quantity}x ${i.sku}`).join(', ');

      await onSubmitRequisition({
        requisitionNumber,
        userId,
        userEmail,
        userName,
        projectName: projectName.trim(),
        jobSiteAddress: jobSiteAddress.trim(),
        requiredDate,
        status: 'pending',
        items: cart,
        itemsSummary,
        totalItemsCount: totalCartUnits,
        totalEstimatedCost: totalCartCost,
        notes: notes.trim(),
      });

      setCart([]);
      setProjectName('');
      setJobSiteAddress('');
      setNotes('');
      setShowCartDrawer(false);
      setActiveTab('orders');
      setSuccessMsg(`Requisition ${requisitionNumber} submitted successfully for review!`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error submitting requisition');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.specifications.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // User's requisitions
  const userRequisitions = requisitions.filter(
    (r) => r.userId === userId || r.userEmail === userEmail
  );

  return (
    <div className="space-y-6">
      {/* End-User Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-800/30 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400"></span>
              <span className="text-xs uppercase font-mono font-bold text-cyan-400 tracking-wider">
                Solar Contractor & Engineering Portal (RBAC: End-User)
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white mt-1">
              Welcome, {userName}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {companyName} • Browse Verified Solar Technology Hardware & Submit Project Equipment Orders
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowKitModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-amber-400 border border-amber-500/30 rounded-lg transition-colors"
            >
              <Sun className="w-4 h-4" /> Solar Kit Sizing Calculator
            </button>
            <button
              onClick={() => setShowCartDrawer(true)}
              className="relative flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-md transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Project Cart ({totalCartUnits})</span>
              {cart.length > 0 && (
                <span className="ml-1 bg-slate-950 text-amber-400 px-1.5 py-0.2 rounded-full font-mono text-[10px]">
                  ${totalCartCost.toLocaleString()}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Success / Alert notice */}
        {successMsg && (
          <div className="mt-4 bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 px-4 py-3 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button
              onClick={() => setSuccessMsg('')}
              className="text-emerald-400 hover:text-white text-xs font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            activeTab === 'catalog'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Sun className="w-4 h-4" />
          <span>Solar Hardware Catalog ({filteredProducts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            activeTab === 'orders'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>My Project Requisitions ({userRequisitions.length})</span>
        </button>
      </div>

      {/* TAB 1: CATALOG */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          {/* Search & Category Filter */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search solar modules, hybrid inverters, LiFePO4 batteries, racking..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500 placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="All">All Solar Categories</option>
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
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((p) => {
              const inStock = p.stockQuantity > 0;
              const cartItem = cart.find((i) => i.productId === p.id);

              return (
                <div
                  key={p.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between transition-all shadow-md group"
                >
                  <div>
                    {/* Top SKU Badge & Status */}
                    <div className="flex items-center justify-between mb-2">
                      <SkuBadge product={p} />
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.stockQuantity > p.reorderPoint
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : p.stockQuantity > 0
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {p.stockQuantity > 0 ? `${p.stockQuantity} in warehouse` : 'Backordered'}
                      </span>
                    </div>

                    <div className="text-[10px] text-amber-400/90 font-semibold uppercase tracking-wider mb-1">
                      {p.category}
                    </div>

                    <h3 className="font-bold text-white text-sm leading-snug group-hover:text-amber-300 transition-colors">
                      {p.name}
                    </h3>

                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">{p.description}</p>

                    {/* Specs pill list */}
                    <div className="mt-3 bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5 text-[11px] space-y-1">
                      <div className="text-slate-300 font-mono line-clamp-1">{p.specifications}</div>
                      {p.warrantyYears && (
                        <div className="text-slate-500 text-[10px]">
                          Warranty: <strong className="text-slate-300">{p.warrantyYears} Years</strong>{' '}
                          • {p.certification || 'Certified'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pricing and Cart Action */}
                  <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">
                        Project Price
                      </div>
                      <div className="text-lg font-black text-white font-mono">
                        ${p.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    {cartItem ? (
                      <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1 border border-slate-700">
                        <button
                          onClick={() => updateCartQty(p.id, cartItem.quantity - 1)}
                          className="w-7 h-7 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono font-bold text-xs px-1 text-amber-400">
                          {cartItem.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQty(p.id, cartItem.quantity + 1)}
                          className="w-7 h-7 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(p, 1)}
                        disabled={!inStock}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold text-xs transition-colors shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add to Order
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              <Sun className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold">No solar products matched your search.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="px-6 py-4 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">My Project Equipment Requisitions</h3>
              <p className="text-xs text-slate-400">
                Track approval, stock allocation, and dispatch to your job sites
              </p>
            </div>

            <div className="divide-y divide-slate-800">
              {userRequisitions.map((req) => (
                <div key={req.id} className="p-5 hover:bg-slate-850/40 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-amber-400 text-sm">
                          {req.requisitionNumber}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            req.status === 'pending'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : req.status === 'approved'
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                              : req.status === 'allocated'
                              ? 'bg-blue-950 text-blue-300 border border-blue-800'
                              : req.status === 'shipped'
                              ? 'bg-purple-950 text-purple-300 border border-purple-800'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}
                        >
                          {req.status.toUpperCase()}
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-base mt-1">{req.projectName}</h4>
                    </div>

                    <div className="text-right">
                      <div className="text-emerald-400 font-mono font-bold text-base">
                        ${req.totalEstimatedCost.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {req.totalItemsCount} total equipment units
                      </div>
                    </div>
                  </div>

                  {/* Progress Pipeline */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-5 gap-2 text-center text-[10px] font-semibold">
                    <div
                      className={`p-1.5 rounded ${
                        ['pending', 'approved', 'allocated', 'shipped', 'fulfilled'].includes(
                          req.status
                        )
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      1. Submitted
                    </div>
                    <div
                      className={`p-1.5 rounded ${
                        ['approved', 'allocated', 'shipped', 'fulfilled'].includes(req.status)
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      2. Approved
                    </div>
                    <div
                      className={`p-1.5 rounded ${
                        ['allocated', 'shipped', 'fulfilled'].includes(req.status)
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      3. Stock Allocated
                    </div>
                    <div
                      className={`p-1.5 rounded ${
                        ['shipped', 'fulfilled'].includes(req.status)
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      4. In Transit
                    </div>
                    <div
                      className={`p-1.5 rounded ${
                        req.status === 'fulfilled'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      5. Fulfilled
                    </div>
                  </div>

                  {/* Details row */}
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      <span>{req.jobSiteAddress}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Required by: {req.requiredDate}</span>
                    </div>
                  </div>

                  {/* Items summary */}
                  <div className="mt-2 text-xs font-mono text-slate-300 bg-slate-950 p-2 rounded border border-slate-800">
                    {req.itemsSummary}
                  </div>
                </div>
              ))}

              {userRequisitions.length === 0 && (
                <div className="py-12 text-center text-slate-500">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold">You have not submitted any project orders yet.</p>
                  <button
                    onClick={() => setActiveTab('catalog')}
                    className="mt-3 px-3 py-1.5 bg-amber-500 text-slate-950 rounded-lg text-xs font-bold"
                  >
                    Browse Solar Catalog
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REQUISITION CART DRAWER / MODAL */}
      {showCartDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-xl w-full my-8 overflow-hidden text-slate-100">
            <div className="bg-slate-800/90 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-base font-semibold text-white">Project Equipment Requisition</h3>
                  <p className="text-xs text-slate-400">Review bill of materials & submit order</p>
                </div>
              </div>
              <button
                onClick={() => setShowCartDrawer(false)}
                className="text-slate-400 hover:text-white rounded-lg p-1.5 transition-colors"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitOrder} className="p-6 space-y-4 text-sm">
              {errorMsg && (
                <div className="bg-rose-950/60 border border-rose-600/60 text-rose-200 px-3.5 py-2.5 rounded-lg flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Cart items list */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs"
                  >
                    <div className="flex-1 pr-2">
                      <div className="font-mono font-bold text-amber-400">{item.sku}</div>
                      <div className="text-slate-200 line-clamp-1">{item.name}</div>
                      <div className="text-slate-500 text-[10px] font-mono">
                        ${item.unitPrice.toLocaleString()} each
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-slate-800 rounded p-0.5 border border-slate-700">
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.productId, item.quantity - 1)}
                          className="w-5 h-5 rounded bg-slate-700 flex items-center justify-center text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono font-bold px-1.5">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.productId, item.quantity + 1)}
                          className="w-5 h-5 rounded bg-slate-700 flex items-center justify-center text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="w-20 text-right font-mono font-bold text-white">
                        ${(item.quantity * item.unitPrice).toLocaleString()}
                      </div>

                      <button
                        type="button"
                        onClick={() => updateCartQty(item.productId, 0)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {cart.length === 0 && (
                  <div className="text-center py-6 text-slate-500 text-xs">Your cart is empty.</div>
                )}
              </div>

              {/* Total Row */}
              {cart.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-semibold">
                  <span className="text-slate-400">Total Units: {totalCartUnits}</span>
                  <span className="font-mono font-bold text-base text-emerald-400">
                    Total: ${totalCartCost.toLocaleString()}
                  </span>
                </div>
              )}

              {/* Project Destination Fields */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Solar Project Name *
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. Phoenix Logistics 120kW Rooftop Solar"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Job Site Delivery Address *
                  </label>
                  <input
                    type="text"
                    value={jobSiteAddress}
                    onChange={(e) => setJobSiteAddress(e.target.value)}
                    placeholder="e.g. 5020 Industrial Parkway, Dock 3, Phoenix, AZ 85040"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Required On-Site Date *
                  </label>
                  <input
                    type="date"
                    value={requiredDate}
                    onChange={(e) => setRequiredDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Installation & Offloading Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Liftgate required, offloading time restrictions, contact site supervisor..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCartDrawer(false)}
                  className="px-4 py-2 text-xs text-slate-300 hover:text-white transition-colors"
                >
                  Keep Browsing
                </button>
                <button
                  type="submit"
                  disabled={submitting || cart.length === 0}
                  className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {submitting ? 'Submitting...' : 'Submit Requisition to counSOL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Solar Kit Calculator Modal */}
      {showKitModal && (
        <SolarKitCalculatorModal
          products={products}
          onAddItemsToCart={handleAddKitItems}
          onClose={() => setShowKitModal(false)}
        />
      )}
    </div>
  );
};
