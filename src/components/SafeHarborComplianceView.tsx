import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  Upload,
  Clock,
  History,
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  Download,
  Calendar,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { SafeHarborAssessment, SafeHarborChecklistItem } from '../types/backlog';
import { SEED_SAFE_HARBOR_ASSESSMENTS } from '../data/backlogSeedData';

export const SafeHarborComplianceView: React.FC = () => {
  const [assessments, setAssessments] = useState<SafeHarborAssessment[]>(SEED_SAFE_HARBOR_ASSESSMENTS);
  const [selectedAssessment, setSelectedAssessment] = useState<SafeHarborAssessment>(assessments[0]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileSizeMb, setUploadedFileSizeMb] = useState(15.4);

  // Toggle checklist item
  const handleToggleChecklist = (pointNum: number) => {
    const updatedChecklist = selectedAssessment.checklist.map((item) =>
      item.pointNumber === pointNum ? { ...item, satisfied: !item.satisfied } : item
    );

    const allSatisfied = updatedChecklist.every((i) => i.satisfied);
    const newStatus = allSatisfied ? 'compliant' : 'gap_identified';

    const newVersion = {
      version: selectedAssessment.versionHistory.length + 1,
      modifiedBy: 'compliance@counsol.america',
      timestamp: new Date().toISOString(),
      changeSummary: `Updated Point #${pointNum} evaluation status. Overall status: ${newStatus}.`,
    };

    const updatedAssessment: SafeHarborAssessment = {
      ...selectedAssessment,
      checklist: updatedChecklist,
      overallStatus: newStatus,
      hasMissingOrConflictingEvidence: !allSatisfied,
      versionHistory: [newVersion, ...selectedAssessment.versionHistory],
    };

    setSelectedAssessment(updatedAssessment);
    setAssessments(assessments.map((a) => (a.id === updatedAssessment.id ? updatedAssessment : a)));
  };

  // Upload document up to 50MB (US-18)
  const handleUploadDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedFileName) return;

    const newDoc = {
      id: `doc-${Date.now().toString().slice(-4)}`,
      name: uploadedFileName.endsWith('.pdf') ? uploadedFileName : `${uploadedFileName}.pdf`,
      sizeMb: uploadedFileSizeMb,
      uploadedAt: new Date().toISOString(),
    };

    const newVersion = {
      version: selectedAssessment.versionHistory.length + 1,
      modifiedBy: 'vendor.contact@sunvolt.com',
      timestamp: new Date().toISOString(),
      changeSummary: `Uploaded supporting document: ${newDoc.name} (${newDoc.sizeMb} MB). Defensible for IRS audit.`,
    };

    const updated: SafeHarborAssessment = {
      ...selectedAssessment,
      documents: [newDoc, ...selectedAssessment.documents],
      versionHistory: [newVersion, ...selectedAssessment.versionHistory],
    };

    setSelectedAssessment(updated);
    setAssessments(assessments.map((a) => (a.id === updated.id ? updated : a)));
    setShowUploadModal(false);
    setUploadedFileName('');
  };

  const compliantCount = selectedAssessment.checklist.filter((i) => i.satisfied).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            Safe Harbor & IRS Statutory Compliance
          </div>
          <h2 className="text-2xl font-bold text-white">
            Safe Harbor 7-Point Compliance & Audit Defense
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            IRS Notice 2026-15 & 2025-08 documentation, FEOC non-contamination verification, and Section 45X credits.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition self-start md:self-auto"
        >
          <Upload className="w-4 h-4" />
          Upload Compliance Evidence (Up to 50 MB)
        </button>
      </div>

      {/* Expiration Alerts Warning Banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          </div>
          <div>
            <strong className="text-white block">Compliance Renewal Alerts:</strong>
            <span>SolTerra Advanced Energy General Liability insurance expires within 28 days (Dec 1, 2026). Renewal notice dispatched.</span>
          </div>
        </div>
        <span className="font-mono text-[11px] bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800 text-amber-400">
          30-Day Critical Window
        </span>
      </div>

      {/* Partner Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 text-xs font-medium mr-2">Evaluated Supplier:</span>
        {assessments.map((a) => (
          <button
            key={a.id}
            onClick={() => setSelectedAssessment(a)}
            className={`px-3 py-2 rounded-xl whitespace-nowrap transition font-semibold flex items-center gap-2 ${
              selectedAssessment.id === a.id
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <span>{a.partnerName}</span>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                a.overallStatus === 'compliant'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {a.overallStatus.replace('_', ' ')}
            </span>
          </button>
        ))}
      </div>

      {/* Main Grid: 7-Point Checklist & Evidence / History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Point Checklist Evaluator (US-14, US-15, US-16, US-17) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Seven-Point Safe Harbor Checklist Protocol
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Consistent evaluation framework applied across every supplier and equipment vendor.
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono font-bold text-white">
                  {compliantCount} / 7 Criteria Satisfied
                </span>
                <div className="w-24 h-2 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${(compliantCount / 7) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Checklist Items */}
            <div className="space-y-3">
              {selectedAssessment.checklist.map((item) => (
                <div
                  key={item.pointNumber}
                  className={`p-4 rounded-xl border transition ${
                    item.satisfied
                      ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      : 'bg-rose-500/5 border-rose-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleChecklist(item.pointNumber)}
                        className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition ${
                          item.satisfied
                            ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                            : 'border-slate-600 hover:border-slate-400'
                        }`}
                      >
                        {item.satisfied && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-amber-400">
                            Point #{item.pointNumber}:
                          </span>
                          <span className="font-semibold text-white text-xs">{item.title}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {item.irsGuidance}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {item.description}
                        </p>
                        {item.evidenceDocName && (
                          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 pt-1">
                            <FileText className="w-3 h-3" />
                            <span>Evidence: {item.evidenceDocName}</span>
                          </div>
                        )}
                        {item.notes && (
                          <div className="text-[11px] text-slate-400 italic">
                            Note: {item.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${
                        item.satisfied
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {item.satisfied ? 'Satisfied' : 'Pending Gap'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Gap Analysis Summary Box */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <AlertCircle className="w-4 h-4" />
                <span>Vendor Evidence Gap Analysis Engine</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {selectedAssessment.gapAnalysisSummary}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: IRS Notice Basis & Immutable Version History (US-15, US-16, US-21) */}
        <div className="space-y-6">
          {/* Regulatory Standards Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 text-xs">
            <h4 className="font-bold text-white flex items-center gap-2 text-sm">
              <FileCheck className="w-4 h-4 text-amber-400" />
              IRS Basis & Tax Credit Distinctions
            </h4>

            <div className="space-y-3">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  IRS Notice 2026-15 Standard
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {selectedAssessment.irs2026NoticeNotes}
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  IRS Notice 2025-08 Predecessor Continuity
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {selectedAssessment.irs2025NoticePredecessorNotes}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block">FEOC Verified:</span>
                  <strong className={selectedAssessment.isFeocCompliant ? 'text-emerald-400' : 'text-rose-400'}>
                    {selectedAssessment.isFeocCompliant ? '100% Non-FEOC' : 'Contamination Risk'}
                  </strong>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block">Section 45X:</span>
                  <strong className={selectedAssessment.section45xCompliant ? 'text-emerald-400' : 'text-amber-400'}>
                    {selectedAssessment.section45xCompliant ? 'Domestic Credit' : 'Pending Review'}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Immutable Version History for IRS/Client Audit */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 text-xs">
            <h4 className="font-bold text-white flex items-center gap-2 text-sm">
              <History className="w-4 h-4 text-cyan-400" />
              Immutable Version Audit Trail
            </h4>
            <p className="text-[11px] text-slate-400">
              Cryptographically timestamped change history for IRS audit defense.
            </p>

            <div className="space-y-2.5 max-h-56 overflow-y-auto font-mono text-[11px] pr-1">
              {selectedAssessment.versionHistory.map((v) => (
                <div
                  key={v.version}
                  className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-1"
                >
                  <div className="flex items-center justify-between text-slate-400 text-[10px]">
                    <span className="text-amber-400 font-bold">Revision v{v.version}.0</span>
                    <span>{new Date(v.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-slate-300 font-sans">{v.changeSummary}</div>
                  <div className="text-[10px] text-slate-500">By: {v.modifiedBy}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal (US-18: Up to 50 MB) */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-amber-400" />
              Upload Supporting Compliance Evidence (Up to 50 MB)
            </h3>

            <form onSubmit={handleUploadDocument} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Document Title / File Name *</label>
                <input
                  type="text"
                  required
                  value={uploadedFileName}
                  onChange={(e) => setUploadedFileName(e.target.value)}
                  placeholder="e.g. Polysilicon_Origin_Affidavit_2026.pdf"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Document Size (Simulated up to 50 MB)</label>
                <input
                  type="number"
                  min="0.1"
                  max="50"
                  step="0.1"
                  value={uploadedFileSizeMb}
                  onChange={(e) => setUploadedFileSizeMb(parseFloat(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                Uploaded documents are saved to the immutable version history ledger with SHA-256 fingerprinting for IRS review.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Save Evidence to Audit Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
