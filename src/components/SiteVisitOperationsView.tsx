import React, { useState } from 'react';
import {
  MapPin,
  ClipboardCheck,
  Camera,
  Wifi,
  WifiOff,
  FileSpreadsheet,
  FileText,
  Mail,
  Send,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { SiteVisitRecord, SiteVisitActionItem } from '../types/backlog';
import { SEED_SITE_VISITS } from '../data/backlogSeedData';

export const SiteVisitOperationsView: React.FC = () => {
  const [siteVisits, setSiteVisits] = useState<SiteVisitRecord[]>(SEED_SITE_VISITS);
  const [selectedVisit, setSelectedVisit] = useState<SiteVisitRecord>(siteVisits[0]);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const [showNewVisitModal, setShowNewVisitModal] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);

  // New action item state
  const [newActionTask, setNewActionTask] = useState('');
  const [newActionOwner, setNewActionOwner] = useState('Elena Rostova (Apex Solar)');
  const [newActionDueDate, setNewActionDueDate] = useState('2026-11-15');

  // Toggle offline simulator (US-32)
  const handleToggleOffline = () => {
    setIsSimulatedOffline(!isSimulatedOffline);
  };

  // Synchronize offline data (US-32)
  const handleSynchronizeVisit = () => {
    setSiteVisits((prev) =>
      prev.map((v) =>
        v.id === selectedVisit.id
          ? { ...v, offlineSyncState: 'synced', status: 'completed' }
          : v
      )
    );
    setSelectedVisit((prev) => ({ ...prev, offlineSyncState: 'synced', status: 'completed' }));
    alert('Synchronized 100% of local field notes, photos, and compliance findings to CounSOL Cloud!');
  };

  // Add Action Item (US-34)
  const handleAddActionItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionTask) return;

    const newItem: SiteVisitActionItem = {
      id: `act-${Date.now().toString().slice(-4)}`,
      task: newActionTask,
      owner: newActionOwner,
      dueDate: newActionDueDate,
      status: 'open',
    };

    const updated = {
      ...selectedVisit,
      actionItems: [...selectedVisit.actionItems, newItem],
    };

    setSelectedVisit(updated);
    setSiteVisits(siteVisits.map((v) => (v.id === updated.id ? updated : v)));
    setNewActionTask('');
  };

  // Send Gmail Debrief (US-35)
  const handleSendGmailDebrief = () => {
    setEmailStatus('sending');
    setTimeout(() => {
      setEmailStatus('sent');
      const updated = {
        ...selectedVisit,
        debriefEmailDraft: {
          ...selectedVisit.debriefEmailDraft,
          isSent: true,
          sentAt: new Date().toISOString(),
        },
      };
      setSelectedVisit(updated);
      setSiteVisits(siteVisits.map((v) => (v.id === updated.id ? updated : v)));
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <MapPin className="w-4 h-4" />
            Site Visit Workflow & Field Inspection
          </div>
          <h2 className="text-2xl font-bold text-white">
            Site Visit Operations & Quality Assurance Desk
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Pre-visit safety preparation, mobile field inspection recorder, offline sync, post-visit reports, and Gmail debriefs.
          </p>
        </div>

        {/* Offline Toggle Simulator */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleOffline}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
              isSimulatedOffline
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
            }`}
            title="Demonstrate low-bandwidth / offline field synchronization"
          >
            {isSimulatedOffline ? <WifiOff className="w-4 h-4 text-rose-400" /> : <Wifi className="w-4 h-4 text-emerald-400" />}
            <span>Mode: {isSimulatedOffline ? 'Low-Bandwidth (Offline)' : 'Online Synced'}</span>
          </button>
        </div>
      </div>

      {/* Visits Carousel / List */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-medium mr-2">Inspected Project Sites:</span>
        {siteVisits.map((v) => (
          <button
            key={v.id}
            onClick={() => setSelectedVisit(v)}
            className={`px-3 py-2 rounded-xl whitespace-nowrap transition font-semibold flex items-center gap-2 ${
              selectedVisit.id === v.id
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <span>{v.visitNumber} - {v.partnerName}</span>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                v.offlineSyncState === 'synced'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              {v.offlineSyncState.replace('_', ' ')}
            </span>
          </button>
        ))}
      </div>

      {/* Main Grid: Pre-Visit & Field Notes / Photos & Action Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Inspection Data */}
        <div className="lg:col-span-2 space-y-5">
          {/* Pre-Visit Preparation Checklist */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-amber-400" />
                Pre-Visit Safety & Documentation Checklist
              </h3>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded font-bold uppercase">
                Field Ready
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-slate-200">PPE & Arc-Flash Safety Gear Verified</span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-slate-200">Site Safety Plan & Hazard Analysis Reviewed</span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-slate-200">Single Line Electrical Diagram on Mobile</span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-slate-200">Partner Insurance Certificate Confirmed Active</span>
              </div>
            </div>
          </div>

          {/* Field Responses, Notes & Photos */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Camera className="w-4 h-4 text-cyan-400" />
                  Field Inspection Notes & High-Resolution Photos
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Inspector: <strong className="text-slate-200">{selectedVisit.fieldRepName}</strong> on {selectedVisit.visitDate}
                </p>
              </div>

              {selectedVisit.offlineSyncState === 'pending_sync_local' && (
                <button
                  onClick={handleSynchronizeVisit}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition flex items-center gap-1.5"
                >
                  <Wifi className="w-3.5 h-3.5" />
                  Sync to Cloud Now
                </button>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans">
              {selectedVisit.fieldNotes}
            </div>

            {/* Photo Cards */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-400 block">
                Logged Photographic Evidence ({selectedVisit.photos.length})
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {selectedVisit.photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2"
                  >
                    <div className="h-24 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 text-xs font-mono">
                      [Photo Asset: {photo.category}]
                    </div>
                    <div className="text-[11px] text-slate-300 line-clamp-2">
                      {photo.caption}
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono">
                      {new Date(photo.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Post-Visit Report Generator (Google Slides / PDF) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                Structured Post-Visit Executive Report
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Ready for client review without manual reformatting (formatted for Google Slides & PDF deliverables).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => alert('Generated Google Slides Executive Briefing presentation deck.')}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs border border-slate-700 transition"
              >
                Google Slides Export
              </button>
              <button
                onClick={() => alert('Generated high-resolution PDF inspection report.')}
                className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
              >
                Download PDF Report
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Action Items & Gmail Debrief */}
        <div className="space-y-6">
          {/* Action Items Tracker */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 text-xs">
            <h4 className="font-bold text-white flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-amber-400" />
              Follow-Up Corrective Action Items
            </h4>

            <div className="space-y-2.5 max-h-56 overflow-y-auto">
              {selectedVisit.actionItems.map((act) => (
                <div
                  key={act.id}
                  className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white text-[11px]">{act.task}</span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                        act.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {act.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Owner: {act.owner}</span>
                    <span>Due: {act.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick add action item */}
            <form onSubmit={handleAddActionItem} className="pt-2 border-t border-slate-800 space-y-2">
              <input
                type="text"
                required
                value={newActionTask}
                onChange={(e) => setNewActionTask(e.target.value)}
                placeholder="Assign new follow-up action..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
              />
              <button
                type="submit"
                className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
              >
                + Assign Action Item
              </button>
            </form>
          </div>

          {/* Gmail Debrief Email Drafter */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 text-xs">
            <h4 className="font-bold text-white flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-emerald-400" />
              Gmail Partner Debrief Communications
            </h4>
            <p className="text-[11px] text-slate-400">
              Drafted automatically from visit findings for Robert Wolff and administrators.
            </p>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
              <div className="text-[11px] text-slate-400">
                To: <span className="text-white font-mono">{selectedVisit.debriefEmailDraft.recipientEmail}</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Subject: <span className="text-amber-300 font-medium">{selectedVisit.debriefEmailDraft.subject}</span>
              </div>
              <div className="text-[11px] text-slate-300 whitespace-pre-line border-t border-slate-800/80 pt-2 font-sans leading-relaxed">
                {selectedVisit.debriefEmailDraft.body}
              </div>
            </div>

            <button
              onClick={handleSendGmailDebrief}
              disabled={selectedVisit.debriefEmailDraft.isSent || emailStatus === 'sending'}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
              {selectedVisit.debriefEmailDraft.isSent
                ? 'Debrief Dispatched via Gmail'
                : emailStatus === 'sending'
                ? 'Sending via Gmail...'
                : 'Send Partner Debrief Email'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
