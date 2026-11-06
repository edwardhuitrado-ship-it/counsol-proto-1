import React, { useState } from 'react';
import {
  FolderGit2,
  Folder,
  Search,
  Filter,
  Zap,
  Mail,
  FileText,
  Copy,
  Check,
  Calendar,
  ExternalLink,
  Plus,
  Play,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  ManagedDocument,
  AutomationWorkflowRule,
  CommunicationTemplate,
} from '../types/backlog';
import {
  SEED_DOCUMENTS,
  SEED_AUTOMATION_RULES,
  SEED_COMMS_TEMPLATES,
} from '../data/backlogSeedData';

export const DocumentsAutomationView: React.FC = () => {
  const [documents, setDocuments] = useState<ManagedDocument[]>(SEED_DOCUMENTS);
  const [automationRules, setAutomationRules] = useState<AutomationWorkflowRule[]>(SEED_AUTOMATION_RULES);
  const [templates, setTemplates] = useState<CommunicationTemplate[]>(SEED_COMMS_TEMPLATES);
  const [activeSubTab, setActiveSubTab] = useState<'documents' | 'automation' | 'robert_desk'>('documents');

  // Search & Filters for Documents (US-43)
  const [searchDocQuery, setSearchDocQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Robert Wolff Comms Desk State (US-45)
  const [selectedTemplate, setSelectedTemplate] = useState<CommunicationTemplate>(templates[0]);
  const [partnerNameVar, setPartnerNameVar] = useState('Apex Solar Contractors LLC');
  const [contactNameVar, setContactNameVar] = useState('Elena Rostova');
  const [clientProgramVar, setClientProgramVar] = useState('Federal Solar Tax Shield');
  const [isCopied, setIsCopied] = useState(false);

  // Toggle automation rule (US-44)
  const handleToggleRule = (ruleId: string) => {
    setAutomationRules(
      automationRules.map((r) =>
        r.id === ruleId ? { ...r, isEnabled: !r.isEnabled } : r
      )
    );
  };

  // Trigger manual rule test (US-44)
  const handleTriggerRule = (rule: AutomationWorkflowRule) => {
    alert(`Automation trigger test executed for "${rule.name}". Notification dispatched to ${rule.recipient}.`);
  };

  // Filtered Documents
  const filteredDocs = documents.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(searchDocQuery.toLowerCase()) ||
      (d.partnerName && d.partnerName.toLowerCase().includes(searchDocQuery.toLowerCase())) ||
      (d.supplierName && d.supplierName.toLowerCase().includes(searchDocQuery.toLowerCase())) ||
      d.googleDrivePath.toLowerCase().includes(searchDocQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || d.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || d.checklistStatus === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Render variable-replaced text for Robert Wolff's templates (US-45)
  const formattedBody = selectedTemplate.bodyTemplate
    .replace(/{{PARTNER_NAME}}/g, partnerNameVar)
    .replace(/{{CONTACT_NAME}}/g, contactNameVar)
    .replace(/{{CLIENT_PROGRAM}}/g, clientProgramVar)
    .replace(/{{PROJECT_NAME}}/g, 'Sundance Solar Park')
    .replace(/{{SITE_ADDRESS}}/g, '19800 W Buckeye Rd, Buckeye, AZ')
    .replace(/{{REQUIRED_DATE}}/g, '2026-11-20')
    .replace(/{{ITEMS_SUMMARY}}/g, '60x Bifacial 550W Panels, 2x 10kW Hybrid Inverters')
    .replace(/{{ESTIMATED_VALUE}}/g, '$42,500.00');

  const formattedSubject = selectedTemplate.subjectTemplate
    .replace(/{{PARTNER_NAME}}/g, partnerNameVar)
    .replace(/{{CLIENT_PROGRAM}}/g, clientProgramVar)
    .replace(/{{PROJECT_NAME}}/g, 'Sundance Solar Park');

  const handleCopyText = () => {
    navigator.clipboard.writeText(`${formattedSubject}\n\n${formattedBody}`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <FolderGit2 className="w-4 h-4" />
            Documents, Automation & Executive Comms
          </div>
          <h2 className="text-2xl font-bold text-white">
            Google Drive Repository & Workflow Automation Engine
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Linked partner folders, multi-attribute document search, trigger rules, and Robert Wolff's communication desk.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('robert_desk')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition"
          >
            <Mail className="w-4 h-4" />
            Robert Wolff Comms Desk
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('documents')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'documents'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Google Drive Repository ({documents.length})
        </button>
        <button
          onClick={() => setActiveSubTab('automation')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'automation'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Workflow Automation Rules ({automationRules.length})
        </button>
        <button
          onClick={() => setActiveSubTab('robert_desk')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeSubTab === 'robert_desk'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Robert Wolff Communications & SOWs
        </button>
      </div>

      {/* Subtab 1: Google Drive Linked Repository */}
      {activeSubTab === 'documents' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchDocQuery}
                onChange={(e) => setSearchDocQuery(e.target.value)}
                placeholder="Search by title, partner name, supplier, or path..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="all">All Document Types</option>
                <option value="certifications">Certifications</option>
                <option value="insurance_records">Insurance Certificates</option>
                <option value="contracts">Contracts & SOWs</option>
                <option value="scorecards">Scorecards</option>
                <option value="program_reports">Program Reports</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value="all">All Checklist Statuses</option>
                <option value="compliant">Compliant</option>
                <option value="pending_review">Pending Review</option>
                <option value="action_required">Action Required</option>
              </select>
            </div>
          </div>

          {/* Documents Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Document Title</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Associated Partner / Supplier</th>
                    <th className="py-3 px-4">Google Drive Location</th>
                    <th className="py-3 px-4">Expiration</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Size</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-sans font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-amber-400 flex-shrink-0" />
                          <span>{doc.title}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-sans capitalize text-slate-400">
                        {doc.category.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-200">
                        {doc.partnerName || doc.supplierName || 'counSOL Program'}
                      </td>
                      <td className="py-3 px-4 text-cyan-400 text-[11px] truncate max-w-xs">
                        {doc.googleDrivePath}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {doc.expirationDate || 'No Expiry'}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            doc.checklistStatus === 'compliant'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {doc.checklistStatus.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-300">
                        {doc.fileSizeMb} MB
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: Event-Driven Automation Rules */}
      {activeSubTab === 'automation' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                Automated Event-Driven Workflows Engine
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Trigger alerts and background actions without manual reminders when forms, documents, or shipments change.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {automationRules.map((rule) => (
              <div
                key={rule.id}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{rule.name}</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                      {rule.triggerEvent.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{rule.conditionDescription}</p>
                  <div className="text-[11px] text-slate-400 pt-1">
                    Action: <strong className="text-emerald-400">{rule.actionType}</strong> → {rule.recipient}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleTriggerRule(rule)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition"
                  >
                    <Play className="w-3.5 h-3.5 text-amber-400" />
                    Test Trigger
                  </button>

                  <button
                    onClick={() => handleToggleRule(rule.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      rule.isEnabled
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {rule.isEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtab 3: Robert Wolff Communications & SOW Desk (US-45) */}
      {activeSubTab === 'robert_desk' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Template Selection */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3 text-xs">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Mail className="w-4 h-4 text-amber-400" />
              Standard Executive Templates
            </h4>

            <div className="space-y-2">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl)}
                  className={`w-full text-left p-3 rounded-xl border transition space-y-1 ${
                    selectedTemplate.id === tpl.id
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-md'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold text-white text-xs">{tpl.title}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-mono">
                    {tpl.type.replace('_', ' ')}
                  </div>
                </button>
              ))}
            </div>

            {/* Customization Inputs */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-400 block">
                Target Organization Variables
              </label>
              <div>
                <span className="text-[11px] text-slate-400 block">Partner Name:</span>
                <input
                  type="text"
                  value={partnerNameVar}
                  onChange={(e) => setPartnerNameVar(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Contact Name:</span>
                <input
                  type="text"
                  value={contactNameVar}
                  onChange={(e) => setContactNameVar(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* Right 2 Columns: Draft Preview & Dispatch */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Robert Wolff Draft Desk & SOW Exhibit Generator (US-45)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Consistent, legally structured engagement agreements, SOWs, and compliance updates.
                </p>
              </div>

              <button
                onClick={handleCopyText}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
              >
                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {isCopied ? 'Copied to Clipboard' : 'Copy Complete SOW / Email'}
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                  Subject Line:
                </span>
                <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-amber-300 font-medium">
                  {formattedSubject}
                </div>
              </div>

              <div>
                <span className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                  Draft Body / Agreement Terms:
                </span>
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-line min-h-[220px]">
                  {formattedBody}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
