import React, { useState } from 'react';
import { X, CheckCircle2, Truck, Box, AlertCircle, FileText, MapPin, Calendar, Clock } from 'lucide-react';
import { Requisition, RequisitionStatus } from '../types/inventory';

interface RequisitionDetailModalProps {
  requisition: Requisition;
  isAdmin: boolean;
  onUpdateStatus: (id: string, status: RequisitionStatus) => Promise<void>;
  onClose: () => void;
}

export const RequisitionDetailModal: React.FC<RequisitionDetailModalProps> = ({
  requisition,
  isAdmin,
  onUpdateStatus,
  onClose,
}) => {
  const [updating, setUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleStatusChange = async (newStatus: RequisitionStatus) => {
    setUpdating(true);
    setErrorMsg('');
    try {
      await onUpdateStatus(requisition.id, newStatus);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update requisition');
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: RequisitionStatus) => {
    switch (status) {
      case 'pending':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">Pending Review</span>;
      case 'approved':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Approved</span>;
      case 'allocated':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">Stock Allocated</span>;
      case 'shipped':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">Dispatched / Shipped</span>;
      case 'fulfilled':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Fulfilled</span>;
      case 'rejected':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">Rejected</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden text-slate-100">
        <div className="bg-slate-800/90 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-base font-bold text-amber-400">
                {requisition.requisitionNumber}
              </span>
              {getStatusBadge(requisition.status)}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Solar Project Equipment Requisition</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white rounded-lg p-1.5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-sm">
          {errorMsg && (
            <div className="bg-rose-950/60 border border-rose-600/60 text-rose-200 px-3.5 py-2.5 rounded-lg flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Project Details */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-slate-500 uppercase font-semibold text-[10px]">Project Name</div>
              <div className="font-semibold text-white text-sm mt-0.5">{requisition.projectName}</div>
            </div>

            <div>
              <div className="text-slate-500 uppercase font-semibold text-[10px]">Requested By</div>
              <div className="font-semibold text-white mt-0.5">
                {requisition.userName} ({requisition.userEmail})
              </div>
            </div>

            <div className="flex items-start gap-1.5 md:col-span-2 mt-1">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-slate-500 uppercase font-semibold text-[10px]">Job Site Delivery Address</div>
                <div className="text-slate-200">{requisition.jobSiteAddress}</div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 mt-1">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <div>
                <span className="text-slate-500 text-[10px]">Target Date:</span>{' '}
                <strong className="text-slate-200">{requisition.requiredDate}</strong>
              </div>
            </div>

            <div className="flex items-center gap-1.5 mt-1">
              <Clock className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-slate-500 text-[10px]">Submitted:</span>{' '}
                <span className="text-slate-300">
                  {new Date(requisition.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Line items table */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-amber-400" /> Equipment Requisition Line Items
            </h4>
            <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-950">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/80 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3 text-center">Quantity</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Ext. Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {requisition.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/50">
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-400">{item.sku}</td>
                      <td className="py-2.5 px-3 text-slate-300">{item.name}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-white">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                        ${item.unitPrice.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-white">
                        ${(item.quantity * item.unitPrice).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-800/60 border-t border-slate-700 font-semibold text-xs">
                  <tr>
                    <td colSpan={2} className="py-2.5 px-3 text-slate-400">
                      Total Equipment Units: {requisition.totalItemsCount}
                    </td>
                    <td colSpan={2} className="py-2.5 px-3 text-right text-slate-300">
                      Estimated Project Subtotal:
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400 text-sm">
                      ${requisition.totalEstimatedCost.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {requisition.notes && (
            <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-800 text-xs">
              <div className="text-slate-400 font-semibold uppercase text-[10px] mb-1">Contractor Notes:</div>
              <div className="text-slate-300 italic">{requisition.notes}</div>
            </div>
          )}

          {/* Admin Workflow Action Buttons */}
          {isAdmin && (
            <div className="pt-4 border-t border-slate-800">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Administrative Approval & Fulfillment Actions:
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {requisition.status === 'pending' && (
                  <>
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => handleStatusChange('approved')}
                      className="px-3.5 py-1.5 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve Requisition
                    </button>
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => handleStatusChange('rejected')}
                      className="px-3.5 py-1.5 text-xs font-semibold bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900 rounded-lg transition-colors"
                    >
                      Reject
                    </button>
                  </>
                )}

                {requisition.status === 'approved' && (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => handleStatusChange('allocated')}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Box className="w-3.5 h-3.5" /> Allocate Warehouse Stock
                  </button>
                )}

                {requisition.status === 'allocated' && (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => handleStatusChange('shipped')}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Truck className="w-3.5 h-3.5" /> Dispatch & Deduct Stock
                  </button>
                )}

                {requisition.status === 'shipped' && (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => handleStatusChange('fulfilled')}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mark Project Fulfilled
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
