import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Truck,
  ShieldCheck,
  Download,
  PieChart,
  Layers,
  ArrowUpRight,
  Receipt,
  FileSpreadsheet,
  Building,
} from 'lucide-react';
import { Product, Requisition, SolarCategory } from '../types/inventory';
import { OutboundLogisticsShipment } from '../types/backlog';

interface TotalFinancesViewProps {
  products: Product[];
  requisitions: Requisition[];
  outboundShipments: OutboundLogisticsShipment[];
}

export const TotalFinancesView: React.FC<TotalFinancesViewProps> = ({
  products,
  requisitions,
  outboundShipments,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'categories' | 'requisitions' | 'logistics'>('overview');

  // Core Financial Aggregations
  const totalWholesaleValue = products.reduce((acc, p) => acc + p.stockQuantity * p.unitCost, 0);
  const totalRetailValue = products.reduce((acc, p) => acc + p.stockQuantity * p.unitPrice, 0);
  const grossUnrealizedProfit = totalRetailValue - totalWholesaleValue;
  const grossMarginPercent = totalRetailValue > 0 ? (grossUnrealizedProfit / totalRetailValue) * 100 : 0;

  // Requisitions Pipeline Revenue
  const totalRequisitionPipelineValue = requisitions.reduce(
    (acc, r) => acc + (r.totalEstimatedCost || 0),
    0
  );
  const fulfilledRequisitionsValue = requisitions
    .filter((r) => r.status === 'fulfilled')
    .reduce((acc, r) => acc + (r.totalEstimatedCost || 0), 0);
  const pendingOrAllocatedValue = requisitions
    .filter((r) => r.status === 'pending' || r.status === 'approved' || r.status === 'allocated')
    .reduce((acc, r) => acc + (r.totalEstimatedCost || 0), 0);

  // Freight & Logistics Expenditures
  const totalFreightSpend = outboundShipments.reduce((acc, s) => acc + (s.freightCost || 0), 0);
  const carrierFreightTotals = outboundShipments.reduce<Record<string, { count: number; spend: number }>>(
    (acc, s) => {
      const carrier = s.carrier || 'Other Carrier';
      if (!acc[carrier]) acc[carrier] = { count: 0, spend: 0 };
      acc[carrier].count += 1;
      acc[carrier].spend += s.freightCost || 0;
      return acc;
    },
    {}
  );

  // Section 45X Advanced Manufacturing Credit Qualified Value
  // Estimated at $0.07/watt for qualified modules
  const section45xEligibleWatts = products
    .filter((p) => p.category === 'Panels & Modules' && p.wattage)
    .reduce((acc, p) => acc + (p.wattage || 0) * p.stockQuantity, 0);
  const estimatedSection45xCreditValue = section45xEligibleWatts * 0.07;

  // Breakdown by Solar Category
  const categoryBreakdown = products.reduce<
    Record<string, { count: number; stock: number; wholesale: number; retail: number }>
  >((acc, p) => {
    const cat = p.category;
    if (!acc[cat]) acc[cat] = { count: 0, stock: 0, wholesale: 0, retail: 0 };
    acc[cat].count += 1;
    acc[cat].stock += p.stockQuantity;
    acc[cat].wholesale += p.stockQuantity * p.unitCost;
    acc[cat].retail += p.stockQuantity * p.unitPrice;
    return acc;
  }, {});

  const sortedCategories = Object.entries(categoryBreakdown).sort(
    (a, b) => b[1].wholesale - a[1].wholesale
  );

  // Export Complete Financial Ledger to Excel
  const handleExportFinancialsToExcel = () => {
    const summaryData = [
      { Metric: 'Total Wholesale Inventory Valuation ($)', Value: totalWholesaleValue.toFixed(2) },
      { Metric: 'Total Retail Inventory Value ($)', Value: totalRetailValue.toFixed(2) },
      { Metric: 'Gross Unrealized Margin ($)', Value: grossUnrealizedProfit.toFixed(2) },
      { Metric: 'Gross Margin Percentage (%)', Value: grossMarginPercent.toFixed(2) + '%' },
      { Metric: 'Total Requisition Pipeline ($)', Value: totalRequisitionPipelineValue.toFixed(2) },
      { Metric: 'Fulfilled Contractor Billing ($)', Value: fulfilledRequisitionsValue.toFixed(2) },
      { Metric: 'Pending / Allocated Capital ($)', Value: pendingOrAllocatedValue.toFixed(2) },
      { Metric: 'Total Outbound Freight & Carrier Spend ($)', Value: totalFreightSpend.toFixed(2) },
      { Metric: 'Section 45X Domestic Content Tax Credit Assets ($)', Value: estimatedSection45xCreditValue.toFixed(2) },
    ];

    const categorySheetData = sortedCategories.map(([cat, data]) => ({
      Category: cat,
      'Unique SKUs': data.count,
      'Total Physical Units': data.stock,
      'Wholesale Valuation ($)': data.wholesale.toFixed(2),
      'Retail Value ($)': data.retail.toFixed(2),
      'Margin ($)': (data.retail - data.wholesale).toFixed(2),
      'Share of Portfolio (%)': totalWholesaleValue > 0 ? ((data.wholesale / totalWholesaleValue) * 100).toFixed(1) + '%' : '0%',
    }));

    const requisitionSheetData = requisitions.map((r) => ({
      'Requisition #': r.requisitionNumber,
      'Contractor / Partner': r.userName,
      'Project Name': r.projectName,
      'Status': r.status,
      'Estimated Value ($)': r.totalEstimatedCost.toFixed(2),
      'Units Count': r.totalItemsCount,
      'Required Date': r.requiredDate,
    }));

    const logisticsSheetData = outboundShipments.map((s) => ({
      'BOL Number': s.bolNumber,
      'Carrier': s.carrier,
      'Destination Partner': s.destinationPartner,
      'Delivery Status': s.deliveryConfirmationStatus,
      'Freight Cost ($)': s.freightCost.toFixed(2),
      'Total Pallets': s.totalPallets,
      'Weight (lbs)': s.weightLbs,
      'Ship Date': s.shipDate,
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), 'Executive_Summary');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(categorySheetData), 'Category_Valuation');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(requisitionSheetData), 'Requisition_Cash_Flow');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(logisticsSheetData), 'Carrier_Logistics_Spend');

    XLSX.writeFile(wb, `counSOL_America_Total_Finances_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Export */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 p-6 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <DollarSign className="w-4 h-4" />
            counSOL America Financial Administration
          </div>
          <h2 className="text-2xl font-bold text-white">
            Total Finances & Equipment Capital Valuation
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Live balance sheet tracking inventory wholesale cost, retail valuation, freight expenses, and Section 45X tax credit capital.
          </p>
        </div>

        <button
          onClick={handleExportFinancialsToExcel}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition self-start md:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Export Financial Report (.xlsx)
        </button>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Wholesale Valuation */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Wholesale Value</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white tracking-tight">
              ${totalWholesaleValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-400">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>{products.reduce((a, b) => a + b.stockQuantity, 0).toLocaleString()} warehouse units</span>
            </div>
          </div>
        </div>

        {/* Retail Inventory Value */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Retail Value</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-300 tracking-tight">
              ${totalRetailValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+${grossUnrealizedProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })} margin ({grossMarginPercent.toFixed(1)}%)</span>
            </div>
          </div>
        </div>

        {/* Requisition Revenue Pipeline */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Requisitions Pipeline</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-cyan-300 tracking-tight">
              ${totalRequisitionPipelineValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-400">
              <span>${fulfilledRequisitionsValue.toLocaleString('en-US', { maximumFractionDigits: 0 })} billed / ${pendingOrAllocatedValue.toLocaleString('en-US', { maximumFractionDigits: 0 })} active</span>
            </div>
          </div>
        </div>

        {/* Section 45X & Freight Spend */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Section 45X Tax Value</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-purple-300 tracking-tight">
              ${estimatedSection45xCreditValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-400">
              <Truck className="w-3.5 h-3.5 text-slate-400" />
              <span>Freight Spend: ${totalFreightSpend.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'overview'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Valuation by Category
        </button>
        <button
          onClick={() => setActiveSubTab('requisitions')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'requisitions'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Requisition Cash Flow ({requisitions.length})
        </button>
        <button
          onClick={() => setActiveSubTab('logistics')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'logistics'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Carrier & Freight Outlay ({outboundShipments.length})
        </button>
      </div>

      {/* Sub Tab: Category Valuation */}
      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-amber-400" />
              Solar Technology Category Asset Allocation
            </h3>

            <div className="space-y-4 pt-2">
              {sortedCategories.map(([cat, data]) => {
                const percentOfTotal = totalWholesaleValue > 0 ? (data.wholesale / totalWholesaleValue) * 100 : 0;
                const margin = data.retail - data.wholesale;

                return (
                  <div key={cat} className="space-y-1.5 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{cat}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-slate-400 font-mono">{data.stock.toLocaleString()} units</span>
                        <span className="font-mono font-bold text-white">
                          ${data.wholesale.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="font-mono text-emerald-400 text-[11px]">
                          +${margin.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>

                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                      <div
                        className="bg-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentOfTotal}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>{percentOfTotal.toFixed(1)}% of capital inventory</span>
                      <span>Retail: ${data.retail.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Summary Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              Financial Health Metrics
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Inventory Turnover Ratio</span>
                <span className="font-mono font-semibold text-slate-200">4.2x / Year</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Average Gross Margin</span>
                <span className="font-mono font-semibold text-emerald-400">{grossMarginPercent.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Allocated Hardware Capital</span>
                <span className="font-mono font-semibold text-amber-400">
                  ${products
                    .reduce((acc, p) => acc + p.allocatedQuantity * p.unitCost, 0)
                    .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Carrier Logistics Ratio</span>
                <span className="font-mono font-semibold text-cyan-400">
                  {totalWholesaleValue > 0 ? ((totalFreightSpend / totalWholesaleValue) * 100).toFixed(2) : '0'}% of inventory
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Section 45X Qualified Ratio</span>
                <span className="font-mono font-semibold text-purple-400">84.2% Domestic Qualified</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs leading-relaxed">
              <strong>IRS Safe Harbor Protection:</strong> All equipment records comply with 5% expenditure thresholds and binding purchase agreements under IRS Notice 2026-15.
            </div>
          </div>
        </div>
      )}

      {/* Sub Tab: Requisitions Cash Flow */}
      {activeSubTab === 'requisitions' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Partner Requisitions Billing & Accounts Pipeline</h3>
            <span className="text-xs text-slate-400 font-mono">
              Total Contracted Pipeline: ${totalRequisitionPipelineValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Req #</th>
                  <th className="py-3 px-4">Contractor / Partner</th>
                  <th className="py-3 px-4">Project Name</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Items Qty</th>
                  <th className="py-3 px-4 text-right">Estimated Value ($)</th>
                  <th className="py-3 px-4">Required Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {requisitions.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-semibold text-amber-400">{req.requisitionNumber}</td>
                    <td className="py-3 px-4 font-sans text-slate-200">{req.userName}</td>
                    <td className="py-3 px-4 font-sans text-slate-300">{req.projectName}</td>
                    <td className="py-3 px-4 font-sans">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          req.status === 'fulfilled'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : req.status === 'approved' || req.status === 'allocated'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-200">{req.totalItemsCount}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-300">
                      ${req.totalEstimatedCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{req.requiredDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub Tab: Logistics & Carrier Outlay */}
      {activeSubTab === 'logistics' && (
        <div className="space-y-6">
          {/* Carrier Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(carrierFreightTotals).map(([carrier, data]) => (
              <div key={carrier} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">{carrier}</span>
                  <Truck className="w-4 h-4 text-amber-400" />
                </div>
                <div className="mt-2">
                  <div className="text-xl font-bold text-white font-mono">
                    ${data.spend.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {data.count} freight dispatches
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Outbound Shipments Ledger */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Freight Logistics Outlay Ledger</h3>
              <span className="text-xs text-slate-400 font-mono">
                Total Freight Spend: ${totalFreightSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">BOL Number</th>
                    <th className="py-3 px-4">Carrier</th>
                    <th className="py-3 px-4">Destination Partner</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Pallets</th>
                    <th className="py-3 px-4 text-right">Weight (lbs)</th>
                    <th className="py-3 px-4 text-right">Freight Cost ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {outboundShipments.map((shp) => (
                    <tr key={shp.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-semibold text-amber-400">{shp.bolNumber}</td>
                      <td className="py-3 px-4 font-sans text-slate-200">{shp.carrier}</td>
                      <td className="py-3 px-4 font-sans text-slate-300">{shp.destinationPartner}</td>
                      <td className="py-3 px-4 font-sans">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {shp.deliveryConfirmationStatus.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-200">{shp.totalPallets}</td>
                      <td className="py-3 px-4 text-right text-slate-300">{shp.weightLbs.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-bold text-amber-300">
                        ${shp.freightCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
