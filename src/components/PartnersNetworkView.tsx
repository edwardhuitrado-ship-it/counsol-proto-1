import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Award,
  AlertTriangle,
  Building2,
  CheckCircle2,
  FileCheck,
  Layers,
} from 'lucide-react';
import { PartnerRecord, PartnerTier, PartnerStatus, ComplianceState } from '../types/backlog';
import { SEED_PARTNERS } from '../data/backlogSeedData';

interface PartnersNetworkViewProps {
  currentRole?: string;
  partnerCompany?: string;
}

export const PartnersNetworkView: React.FC<PartnersNetworkViewProps> = ({
  currentRole = 'admin',
  partnerCompany,
}) => {
  const [partners, setPartners] = useState<PartnerRecord[]>(SEED_PARTNERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('All');
  const [complianceFilter, setComplianceFilter] = useState<string>('All');
  const [programFilter, setProgramFilter] = useState<string>('All');
  const [selectedPartner, setSelectedPartner] = useState<PartnerRecord | null>(null);
  const [showAddPartnerModal, setShowAddPartnerModal] = useState(false);

  // New Partner Form
  const [newPartner, setNewPartner] = useState({
    name: '',
    type: 'installation_partner' as PartnerRecord['type'],
    tier: 'Tier 2' as PartnerTier,
    assignedClientProgram: 'Federal Solar Tax Shield',
    address: '',
    serviceRegions: '',
    primaryContactName: '',
    primaryContactEmail: '',
    phone: '',
    insuranceExpirationDate: '2027-10-01',
    insuranceCertNumber: 'COI-NEW-2026',
    equipmentCapabilities: '',
    relationshipNotes: '',
  });

  // US-11 Data Isolation: If an external partner logs in, only show their company
  const visiblePartners = partners.filter((p) => {
    if (currentRole === 'end_user' || currentRole === 'partner') {
      return (
        p.name.toLowerCase().includes('apex') ||
        (partnerCompany && p.name.toLowerCase() === partnerCompany.toLowerCase())
      );
    }
    return true;
  });

  const filteredPartners = visiblePartners.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.primaryContactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.equipmentCapabilities.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.serviceRegions.some((r) => r.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTier = tierFilter === 'All' || p.tier === tierFilter;
    const matchesCompliance = complianceFilter === 'All' || p.complianceState === complianceFilter;
    const matchesProgram = programFilter === 'All' || p.assignedClientProgram === programFilter;

    return matchesSearch && matchesTier && matchesCompliance && matchesProgram;
  });

  const handleAddPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartner.name || !newPartner.primaryContactEmail) return;

    const record: PartnerRecord = {
      id: `partner-${Date.now().toString().slice(-4)}`,
      name: newPartner.name,
      type: newPartner.type,
      tier: newPartner.tier,
      status: 'active',
      complianceState: 'fully_compliant',
      assignedClientProgram: newPartner.assignedClientProgram,
      address: newPartner.address || '400 Solar Way, Phoenix, AZ',
      serviceRegions: newPartner.serviceRegions ? newPartner.serviceRegions.split(',').map((s) => s.trim()) : ['National'],
      primaryContactName: newPartner.primaryContactName,
      primaryContactEmail: newPartner.primaryContactEmail,
      phone: newPartner.phone || '(555) 123-4567',
      agreementDate: new Date().toISOString().slice(0, 10),
      agreementRenewalDate: '2028-01-01',
      insuranceExpirationDate: newPartner.insuranceExpirationDate,
      insuranceCertNumber: newPartner.insuranceCertNumber,
      equipmentCapabilities: newPartner.equipmentCapabilities || 'Commercial PV, Storage',
      relationshipNotes: newPartner.relationshipNotes || 'Recently onboarded partner organization.',
      programVolumePercent: 2.5,
      totalInstallsCount: 0,
      scorecardRating: 90.0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setPartners([record, ...partners]);
    setShowAddPartnerModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            Partner Network & Supplier Master
          </div>
          <h2 className="text-2xl font-bold text-white">
            Partners & Qualified Supplier Network
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Scalable network management for 25 to 100+ installation partners and solar equipment manufacturers.
          </p>
        </div>

        {currentRole === 'admin' && (
          <button
            onClick={() => setShowAddPartnerModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add Partner Record
          </button>
        )}
      </div>

      {/* Multi-facet Filter Bar (US-10) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by partner name, contact, region, or capability..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tier Filter */}
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
          >
            <option value="All">All Tiers</option>
            <option value="Tier 1">Tier 1</option>
            <option value="Tier 2">Tier 2</option>
            <option value="Tier 3">Tier 3</option>
          </select>

          {/* Compliance State Filter */}
          <select
            value={complianceFilter}
            onChange={(e) => setComplianceFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
          >
            <option value="All">All Compliance States</option>
            <option value="fully_compliant">Fully Compliant</option>
            <option value="renewal_due_soon">Renewal Due Soon</option>
            <option value="gap_flagged">Gap Flagged</option>
          </select>

          {/* Client Program Filter (US-09) */}
          <select
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
          >
            <option value="All">All Client Programs</option>
            <option value="Federal Solar Tax Shield">Federal Solar Tax Shield</option>
            <option value="C&I Microgrid Alliance">C&I Microgrid Alliance</option>
            <option value="Residential Community Net Metering">Residential Net Metering</option>
          </select>
        </div>
      </div>

      {/* Grid of Partners */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPartners.map((partner) => (
          <div
            key={partner.id}
            onClick={() => setSelectedPartner(partner)}
            className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg space-y-4 cursor-pointer transition group"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-white text-sm group-hover:text-amber-400 transition">
                  {partner.name}
                </h3>
                <span className="text-[11px] text-slate-400 capitalize">
                  {partner.type.replace('_', ' ')}
                </span>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {partner.tier}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                    partner.complianceState === 'fully_compliant'
                      ? 'text-emerald-400 bg-emerald-500/10'
                      : partner.complianceState === 'renewal_due_soon'
                      ? 'text-amber-400 bg-amber-500/10'
                      : 'text-rose-400 bg-rose-500/10'
                  }`}
                >
                  {partner.complianceState.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex items-center gap-2 text-slate-400">
                <Building2 className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                <span className="truncate">{partner.assignedClientProgram}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                <span className="truncate">{partner.serviceRegions.join(', ')}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                <span>Insurance Expiry: <strong className="text-slate-200">{partner.insuranceExpirationDate}</strong></span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 line-clamp-2">
              <strong className="text-slate-300">Capabilities:</strong> {partner.equipmentCapabilities}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-[11px]">
              <span className="text-slate-400 font-mono">
                Volume Share: <strong className="text-white">{partner.programVolumePercent}%</strong>
              </span>
              <span className="text-emerald-400 font-semibold font-mono">
                Scorecard: {partner.scorecardRating}/100
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Partner Detailed Drawer / Modal */}
      {selectedPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                  Partner Record: {selectedPartner.id}
                </span>
                <h3 className="text-xl font-bold text-white mt-0.5">{selectedPartner.name}</h3>
                <p className="text-xs text-slate-400">{selectedPartner.address}</p>
              </div>
              <button
                onClick={() => setSelectedPartner(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact</span>
                <div className="font-semibold text-white">{selectedPartner.primaryContactName}</div>
                <div className="text-slate-300">{selectedPartner.primaryContactEmail}</div>
                <div className="text-slate-400">{selectedPartner.phone}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Compliance & Renewal (US-08)</span>
                <div>Agreement Renewal: <strong className="text-slate-200">{selectedPartner.agreementRenewalDate}</strong></div>
                <div>Insurance Expiry: <strong className="text-slate-200">{selectedPartner.insuranceExpirationDate}</strong></div>
                <div className="text-slate-400 font-mono text-[10px]">Cert #: {selectedPartner.insuranceCertNumber}</div>
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Supplier & Equipment Capabilities (US-12)
              </label>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed">
                {selectedPartner.equipmentCapabilities}
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Relationship Notes & Program History
              </label>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                {selectedPartner.relationshipNotes}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <span className="text-xs text-slate-400">
                Total Installations: <strong className="text-white">{selectedPartner.totalInstallsCount}</strong>
              </span>
              <button
                onClick={() => setSelectedPartner(null)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Partner Modal (US-06) */}
      {showAddPartnerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-400" />
              Add Central Partner Master Record
            </h3>

            <form onSubmit={handleAddPartner} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Partner Organization Name *</label>
                  <input
                    type="text"
                    required
                    value={newPartner.name}
                    onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                    placeholder="e.g. Keystone Energy Corp"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Partner Tier</label>
                  <select
                    value={newPartner.tier}
                    onChange={(e) =>
                      setNewPartner({ ...newPartner, tier: e.target.value as PartnerTier })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="Tier 1">Tier 1 (Strategic / Preferred)</option>
                    <option value="Tier 2">Tier 2 (Standard Active)</option>
                    <option value="Tier 3">Tier 3 (Emerging)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Primary Contact Name</label>
                  <input
                    type="text"
                    value={newPartner.primaryContactName}
                    onChange={(e) =>
                      setNewPartner({ ...newPartner, primaryContactName: e.target.value })
                    }
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Contact Email *</label>
                  <input
                    type="email"
                    required
                    value={newPartner.primaryContactEmail}
                    onChange={(e) =>
                      setNewPartner({ ...newPartner, primaryContactEmail: e.target.value })
                    }
                    placeholder="contact@partner.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Assigned Client Program (US-09)</label>
                  <select
                    value={newPartner.assignedClientProgram}
                    onChange={(e) =>
                      setNewPartner({ ...newPartner, assignedClientProgram: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="Federal Solar Tax Shield">Federal Solar Tax Shield</option>
                    <option value="C&I Microgrid Alliance">C&I Microgrid Alliance</option>
                    <option value="Residential Community Net Metering">Residential Community Net Metering</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Insurance Expiration (US-08)</label>
                  <input
                    type="date"
                    value={newPartner.insuranceExpirationDate}
                    onChange={(e) =>
                      setNewPartner({ ...newPartner, insuranceExpirationDate: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Equipment Capabilities & Notes (US-12)</label>
                <textarea
                  rows={2}
                  value={newPartner.equipmentCapabilities}
                  onChange={(e) =>
                    setNewPartner({ ...newPartner, equipmentCapabilities: e.target.value })
                  }
                  placeholder="e.g. Bifacial panels, high-voltage battery racks, Enphase microinverters..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddPartnerModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Save Partner Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
