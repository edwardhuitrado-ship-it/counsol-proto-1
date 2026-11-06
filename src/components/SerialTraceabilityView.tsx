import React, { useState } from 'react';
import {
  QrCode,
  Barcode,
  Search,
  Truck,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { EquipmentSerialRecord, OutboundLogisticsShipment } from '../types/backlog';
import { SEED_SERIAL_NUMBERS, SEED_OUTBOUND_SHIPMENTS } from '../data/backlogSeedData';

export const SerialTraceabilityView: React.FC = () => {
  const [serials, setSerials] = useState<EquipmentSerialRecord[]>(SEED_SERIAL_NUMBERS);
  const [shipments, setShipments] = useState<OutboundLogisticsShipment[]>(SEED_OUTBOUND_SHIPMENTS);
  const [activeSubTab, setActiveSubTab] = useState<'serials' | 'shipments' | 'reconciliation'>('serials');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSerial, setSelectedSerial] = useState<EquipmentSerialRecord | null>(null);

  // New Serial Scan / Receipt Modal (US-22, US-23)
  const [showScanModal, setShowScanModal] = useState(false);
  const [newScan, setNewScan] = useState({
    serialNumber: '',
    sku: 'CS-MOD-550-BIF',
    productName: 'Heliomax Bifacial 550W Dual-Glass Tier-1 Solar Panel',
    shipmentId: 'SHP-2026-0824',
    partnerName: 'Apex Solar Contractors LLC',
    partnerReceiptDate: new Date().toISOString().slice(0, 10),
  });

  // DOA & Post-PTO Modal (US-25, US-26)
  const [defectModalTarget, setDefectModalTarget] = useState<{
    serial: EquipmentSerialRecord;
    type: 'doa' | 'post_pto';
  } | null>(null);
  const [defectDescription, setDefectDescription] = useState('');

  // Handle Point-of-Receipt Scan (US-22, US-23)
  const handleSaveScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScan.serialNumber) return;

    const barcodeVal = `||||| |||| ||||| ${newScan.serialNumber.slice(-6)}`;
    const newRecord: EquipmentSerialRecord = {
      id: `sn-${Date.now().toString().slice(-4)}`,
      serialNumber: newScan.serialNumber,
      barcode: barcodeVal,
      deviceId: `DEV-AUTO-${Date.now().toString().slice(-4)}`,
      sku: newScan.sku,
      productName: newScan.productName,
      shipmentId: newScan.shipmentId,
      vendorName: 'SunVolt Dynamics Inc.',
      partnerId: 'partner-apex',
      partnerName: newScan.partnerName,
      partnerReceiptDate: newScan.partnerReceiptDate,
      status: 'received_by_partner',
      enphaseStatus: 'Pending Provisioning',
      doaReported: false,
      postPtoIssueReported: false,
      reconciliationStatus: 'matched',
      carrierName: 'UPS Freight',
      carrierTrackingNumber: '1Z992A880194821',
    };

    setSerials([newRecord, ...serials]);
    setShowScanModal(false);
    setNewScan({
      serialNumber: '',
      sku: 'CS-MOD-550-BIF',
      productName: 'Heliomax Bifacial 550W Dual-Glass Tier-1 Solar Panel',
      shipmentId: 'SHP-2026-0824',
      partnerName: 'Apex Solar Contractors LLC',
      partnerReceiptDate: new Date().toISOString().slice(0, 10),
    });
  };

  // Flag DOA or Post-PTO defect (US-25, US-26)
  const handleConfirmDefect = () => {
    if (!defectModalTarget || !defectDescription) return;

    setSerials(
      serials.map((s) => {
        if (s.id === defectModalTarget.serial.id) {
          if (defectModalTarget.type === 'doa') {
            return {
              ...s,
              status: 'doa_defective',
              doaReported: true,
              doaReason: defectDescription,
              reconciliationStatus: 'flagged',
            };
          } else {
            return {
              ...s,
              status: 'post_pto_issue',
              postPtoIssueReported: true,
              postPtoIssueDescription: defectDescription,
            };
          }
        }
        return s;
      })
    );

    setDefectModalTarget(null);
    setDefectDescription('');
  };

  // Enphase Enlighten live sync simulation (US-24)
  const handleSyncEnphase = () => {
    alert('Connecting to Enphase Installer Platform API... Telemetry updated for all active microinverters and gateways!');
  };

  // Carrier Portal Refresh (US-28)
  const handleSyncCarrierPortals = () => {
    alert('Carrier APIs polled (UPS Freight & Old Dominion). Shipment tracking numbers synchronized in real-time!');
  };

  const filteredSerials = serials.filter(
    (s) =>
      s.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.productName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <QrCode className="w-4 h-4" />
            Serial Traceability & Carrier Logistics
          </div>
          <h2 className="text-2xl font-bold text-white">
            Serial Number Lifecycle & Outbound Freight Tracking
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Trace hardware from receipt to PTO, sync Enphase Enlighten telemetry, and reconcile carrier deliveries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowScanModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition"
          >
            <Barcode className="w-4 h-4" />
            Scan Serial at Receipt
          </button>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('serials')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeSubTab === 'serials'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Serial Number Lifecycle ({serials.length})
          </button>
          <button
            onClick={() => setActiveSubTab('shipments')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeSubTab === 'shipments'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Outbound Freight & Carriers ({shipments.length})
          </button>
          <button
            onClick={() => setActiveSubTab('reconciliation')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeSubTab === 'reconciliation'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Discrepancy Reconciliation Audit
          </button>
        </div>

        {activeSubTab === 'serials' && (
          <button
            onClick={handleSyncEnphase}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-slate-700 transition"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            Sync Enphase Enlighten API
          </button>
        )}

        {activeSubTab === 'shipments' && (
          <button
            onClick={handleSyncCarrierPortals}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold border border-slate-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            Poll UPS / Old Dominion Portals
          </button>
        )}
      </div>

      {/* Subtab 1: Serials Table & Lifecycle Drawer */}
      {activeSubTab === 'serials' && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search serial number, SKU, or installation partner..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Serial Number</th>
                    <th className="py-3 px-4">SKU / Model</th>
                    <th className="py-3 px-4">Installation Partner</th>
                    <th className="py-3 px-4">Receipt Date</th>
                    <th className="py-3 px-4">PTO Date</th>
                    <th className="py-3 px-4">Lifecycle Status</th>
                    <th className="py-3 px-4">Enphase Telemetry</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredSerials.map((serial) => (
                    <tr key={serial.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-amber-400">{serial.serialNumber}</div>
                        <div className="text-[10px] text-slate-500">{serial.barcode}</div>
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <div className="font-semibold text-white">{serial.sku}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{serial.productName}</div>
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-200">{serial.partnerName}</td>
                      <td className="py-3 px-4 text-slate-400">{serial.partnerReceiptDate}</td>
                      <td className="py-3 px-4 text-slate-400">{serial.ptoDate || 'Pending PTO'}</td>
                      <td className="py-3 px-4 font-sans">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            serial.status === 'pto_approved'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : serial.status === 'doa_defective'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : serial.status === 'post_pto_issue'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          }`}
                        >
                          {serial.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              serial.enphaseStatus.includes('Connected') || serial.enphaseStatus.includes('Active')
                                ? 'bg-emerald-400 animate-pulse'
                                : 'bg-slate-500'
                            }`}
                          />
                          <span className="text-slate-300">{serial.enphaseStatus}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-sans">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setDefectModalTarget({ serial, type: 'doa' })}
                            className="px-2 py-1 rounded text-[10px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20 transition"
                            title="Flag Defective on Arrival (US-25)"
                          >
                            DOA
                          </button>
                          <button
                            onClick={() => setDefectModalTarget({ serial, type: 'post_pto' })}
                            className="px-2 py-1 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition"
                            title="Record Post-PTO Issue (US-26)"
                          >
                            Post-PTO
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: Outbound Shipments Table (US-27, US-28) */}
      {activeSubTab === 'shipments' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Outbound Equipment Shipments & Carrier Telemetry</h3>
            <span className="text-xs text-slate-400 font-mono">
              UPS Freight & Old Dominion Live Portals
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">BOL #</th>
                  <th className="py-3 px-4">Destination Partner</th>
                  <th className="py-3 px-4">Carrier & Tracking</th>
                  <th className="py-3 px-4">Ship Date / ETA</th>
                  <th className="py-3 px-4">Delivery Status</th>
                  <th className="py-3 px-4 text-right">Freight Cost ($)</th>
                  <th className="py-3 px-4">Reconciled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {shipments.map((shp) => (
                  <tr key={shp.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-semibold text-amber-400">{shp.bolNumber}</td>
                    <td className="py-3 px-4 font-sans text-white">{shp.destinationPartner}</td>
                    <td className="py-3 px-4 font-sans">
                      <div className="font-semibold text-slate-200">{shp.carrier}</div>
                      <div className="text-[10px] font-mono text-cyan-400">{shp.trackingNumber}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {shp.shipDate} → {shp.estimatedDeliveryDate}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {shp.deliveryConfirmationStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-bold">
                      ${shp.freightCost.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      {shp.reconciledWithReceipts ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Matched
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5" /> Discrepancy
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 3: Discrepancy Reconciliation Audit */}
      {activeSubTab === 'reconciliation' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                4-Way Reconciliation Audit Engine
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Cross-references Shipment Logs, Partner Point-of-Receipt scans, Serial Numbers, and Safe Harbor records.
              </p>
            </div>
            <button
              onClick={() => alert('Audit verification completed: 2 reconciliation discrepancies resolved.')}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
            >
              Run Audit Verification
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Discrepancy #1: BOL-2026-99122 vs Receipt</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">
                  Attention Required
                </span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Carrier BOL reflects 30 units of CS-MOD-670-PERC delivered to LoneStar SolarGrid. Partner has scanned 29 units into point-of-receipt ledger. Serial SN-MOD670-2026-990145 pending verification.
              </p>
              <div className="pt-2 text-[10px] text-slate-400">
                Action: Automated reminder dispatched to Cody McCallister at LoneStar.
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Discrepancy #2: RMA Replacement Status</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                  In Progress
                </span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Unit SN-MOD420-2026-110944 flagged DOA at Palmetto SunWorks. SunVolt Dynamics has authorized RMA #SV-8841 with replacement panel queued for dispatch under BOL-2026-99124.
              </p>
              <div className="pt-2 text-[10px] text-slate-400">
                Safe Harbor integrity preserved: Replacement unit from identical non-FEOC production batch.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Point of Receipt Scan */}
      {showScanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Barcode className="w-5 h-5 text-amber-400" />
              Scan or Enter Serial Number at Point of Receipt
            </h3>

            <form onSubmit={handleSaveScan} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Equipment Serial Number *</label>
                <input
                  type="text"
                  required
                  value={newScan.serialNumber}
                  onChange={(e) => setNewScan({ ...newScan, serialNumber: e.target.value })}
                  placeholder="e.g. SN-HM550-2026-904128"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">SKU</label>
                  <select
                    value={newScan.sku}
                    onChange={(e) => setNewScan({ ...newScan, sku: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="CS-MOD-550-BIF">CS-MOD-550-BIF</option>
                    <option value="CS-MOD-420-TOP">CS-MOD-420-TOP</option>
                    <option value="CS-INV-10K-HYB">CS-INV-10K-HYB</option>
                    <option value="CS-BAT-15K-LFP">CS-BAT-15K-LFP</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Installation Partner</label>
                  <input
                    type="text"
                    value={newScan.partnerName}
                    onChange={(e) => setNewScan({ ...newScan, partnerName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Receipt Date</label>
                <input
                  type="date"
                  value={newScan.partnerReceiptDate}
                  onChange={(e) =>
                    setNewScan({ ...newScan, partnerReceiptDate: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowScanModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Save Serial to Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Flag DOA or Post-PTO */}
      {defectModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              {defectModalTarget.type === 'doa'
                ? 'Flag Unit as Defective on Arrival (DOA)'
                : 'Record Post-PTO Hardware Incident'}
            </h3>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300">
              Unit: <strong className="text-amber-400">{defectModalTarget.serial.serialNumber}</strong> ({defectModalTarget.serial.sku})
            </div>

            <div>
              <label className="text-slate-400 block mb-1 text-xs">
                Issue Documentation & Investigation Details *
              </label>
              <textarea
                rows={4}
                required
                value={defectDescription}
                onChange={(e) => setDefectDescription(e.target.value)}
                placeholder="Describe observed damage, transit conditions, cell anomalies, or inverter fault codes..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDefectModalTarget(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDefect}
                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs"
              >
                Log Incident & Notify Vendor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
