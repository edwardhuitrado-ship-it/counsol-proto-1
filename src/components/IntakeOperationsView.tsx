import React, { useState } from 'react';
import {
  Inbox,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserCheck,
  FileText,
  Upload,
  Send,
  Building,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import { IntakeSubmission, IntakeStatus, IntakeSubmissionType } from '../types/backlog';
import { SEED_INTAKES } from '../data/backlogSeedData';

interface IntakeOperationsViewProps {
  onAssignOwner?: (id: string, owner: string, status: IntakeStatus) => void;
}

export const IntakeOperationsView: React.FC<IntakeOperationsViewProps> = () => {
  const [intakes, setIntakes] = useState<IntakeSubmission[]>(SEED_INTAKES);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedIntake, setSelectedIntake] = useState<IntakeSubmission | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // New Intake Form State
  const [formData, setFormData] = useState({
    submissionType: 'client_intake' as IntakeSubmissionType,
    submitterName: '',
    organization: '',
    email: '',
    phone: '',
    serviceRegions: '',
    requestSummary: '',
    programDetails: '',
    assignedOwner: 'Robert Wolff',
  });

  const handleUpdateStatus = (id: string, newStatus: IntakeStatus, newOwner?: string) => {
    setIntakes((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: newStatus,
              assignedOwner: newOwner || item.assignedOwner,
            }
          : item
      )
    );
    if (selectedIntake && selectedIntake.id === id) {
      setSelectedIntake((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              assignedOwner: newOwner || prev.assignedOwner,
            }
          : null
      );
    }
  };

  const handleCreateSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.submitterName || !formData.email || !formData.organization) {
      alert('Please fill in required submitter name, email, and organization.');
      return;
    }

    const newEntry: IntakeSubmission = {
      id: `intake-${Date.now().toString().slice(-4)}`,
      submissionType: formData.submissionType,
      submitterName: formData.submitterName,
      organization: formData.organization,
      email: formData.email,
      phone: formData.phone || '(555) 000-0000',
      serviceRegions: formData.serviceRegions
        ? formData.serviceRegions.split(',').map((s) => s.trim())
        : ['National'],
      requestSummary: formData.requestSummary,
      programDetails: formData.programDetails,
      assignedOwner: formData.assignedOwner || 'Robert Wolff',
      status: 'new',
      submittedAt: new Date().toISOString(),
      reviewNotes: 'Newly received submission awaiting review.',
      documents: [],
    };

    setIntakes([newEntry, ...intakes]);
    setShowSubmitModal(false);
    setFormData({
      submissionType: 'client_intake',
      submitterName: '',
      organization: '',
      email: '',
      phone: '',
      serviceRegions: '',
      requestSummary: '',
      programDetails: '',
      assignedOwner: 'Robert Wolff',
    });
  };

  const filteredIntakes = intakes.filter((item) => {
    const matchesSearch =
      item.submitterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.requestSummary.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesType = typeFilter === 'all' || item.submissionType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Inbox className="w-4 h-4" />
            Intake Queue & Onboarding Triage
          </div>
          <h2 className="text-2xl font-bold text-white">
            Intake Queue & Onboarding Triage Desk
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Structured records for prospective clients, installation partners, and vendor compliance submissions.
          </p>
        </div>

        <button
          onClick={() => setShowSubmitModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          New Intake Submission (Form)
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search submitter, organization, or project details..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="action_needed">Action Needed</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Submission Types</option>
            <option value="client_intake">Client Intake</option>
            <option value="installation_partner">Installation Partner</option>
            <option value="vendor_compliance">Vendor Compliance</option>
          </select>
        </div>
      </div>

      {/* Intakes List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {filteredIntakes.map((intake) => (
            <div
              key={intake.id}
              onClick={() => setSelectedIntake(intake)}
              className={`p-4 rounded-xl border transition cursor-pointer ${
                selectedIntake?.id === intake.id
                  ? 'bg-amber-500/10 border-amber-500/60 shadow-lg'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">
                      {intake.organization}
                    </span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {intake.submissionType.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>{intake.submitterName}</span>
                    <span>•</span>
                    <span>{intake.email}</span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                    intake.status === 'approved'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : intake.status === 'under_review'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : intake.status === 'new'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {intake.status.replace('_', ' ')}
                </span>
              </div>

              <p className="text-xs text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                {intake.requestSummary}
              </p>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Owner: <strong className="text-slate-200">{intake.assignedOwner}</strong></span>
                </div>
                <span>Submitted {new Date(intake.submittedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Intake Detail Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-fit space-y-5">
          {selectedIntake ? (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                  Submission Detail: {selectedIntake.id}
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  {selectedIntake.organization}
                </h3>
                <p className="text-xs text-slate-400">{selectedIntake.submitterName}</p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedIntake.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedIntake.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Regions: {selectedIntake.serviceRegions.join(', ')}</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Request Summary
                </label>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed">
                  {selectedIntake.requestSummary}
                </div>
              </div>

              {selectedIntake.documents.length > 0 && (
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Attached Supporting Documents ({selectedIntake.documents.length})
                  </label>
                  <div className="space-y-1.5">
                    {selectedIntake.documents.map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50 border border-slate-800 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                          <span className="truncate text-slate-200">{doc.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {doc.sizeMb} MB
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Triage Action Controls (US-05) */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <label className="text-[10px] uppercase font-bold text-slate-400 block">
                  Assign Owner & Update Workflow Status
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={selectedIntake.assignedOwner}
                    onChange={(e) =>
                      handleUpdateStatus(selectedIntake.id, selectedIntake.status, e.target.value)
                    }
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="Robert Wolff">Robert Wolff</option>
                    <option value="Compliance Desk">Compliance Desk</option>
                    <option value="Field Ops Lead">Field Ops Lead</option>
                    <option value="Client Rep">Client Rep</option>
                  </select>

                  <select
                    value={selectedIntake.status}
                    onChange={(e) =>
                      handleUpdateStatus(selectedIntake.id, e.target.value as IntakeStatus)
                    }
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="new">New</option>
                    <option value="under_review">Under Review</option>
                    <option value="approved">Approved</option>
                    <option value="action_needed">Action Needed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedIntake.id, 'approved')}
                    className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                  >
                    Approve Record
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedIntake.id, 'action_needed')}
                    className="flex-1 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 font-bold text-xs transition"
                  >
                    Flag Action
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Inbox className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs">Select any intake submission from the list to review details and assign owners.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: New Intake Form (US-01, US-03, US-04) */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-400" />
              Submit CounSOL Intake & Onboarding Application
            </h3>

            <form onSubmit={handleCreateSubmission} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Submission Type</label>
                  <select
                    value={formData.submissionType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        submissionType: e.target.value as IntakeSubmissionType,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="client_intake">Prospective Client Intake</option>
                    <option value="installation_partner">Installation Partner Onboarding</option>
                    <option value="vendor_compliance">Vendor / Supplier Certifications</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Organization Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    placeholder="e.g. Horizon Clean Energy"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Primary Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.submitterName}
                    onChange={(e) => setFormData({ ...formData, submitterName: e.target.value })}
                    placeholder="e.g. Marcus Vance"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Contact Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@company.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Service Regions / Operating States</label>
                <input
                  type="text"
                  value={formData.serviceRegions}
                  onChange={(e) => setFormData({ ...formData, serviceRegions: e.target.value })}
                  placeholder="e.g. Texas, Arizona, California"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Request Summary / Scope *</label>
                <textarea
                  rows={3}
                  required
                  value={formData.requestSummary}
                  onChange={(e) => setFormData({ ...formData, requestSummary: e.target.value })}
                  placeholder="Describe program goals, MW capacity, equipment requirements, or compliance objectives..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Submit into System of Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
