import React, { useState } from 'react';
import {
  ShieldCheck,
  Zap,
  Users,
  Activity,
  Lock,
  Cpu,
  Database,
  Globe,
  CheckCircle2,
  Server,
  Key,
  Layers,
  Sparkles,
} from 'lucide-react';
import { SystemHealthMetric } from '../types/backlog';
import { SEED_SYSTEM_HEALTH } from '../data/backlogSeedData';

interface PlatformAdminViewProps {
  currentRole: string;
  onSwitchRole: (role: any) => void;
}

export const PlatformAdminView: React.FC<PlatformAdminViewProps> = ({
  currentRole,
  onSwitchRole,
}) => {
  const [health, setHealth] = useState<SystemHealthMetric>(SEED_SYSTEM_HEALTH);
  const [apiWebhookUrl, setApiWebhookUrl] = useState('https://api.counsol.america/v1/webhooks/enphase-events');
  const [isCopied, setIsCopied] = useState(false);

  const testRoles = [
    { id: 'admin', label: 'CounSOL Administrator (Robert Wolff / Master)', desc: 'Unrestricted executive access to financials, partners, and triage.' },
    { id: 'compliance_manager', label: 'Compliance Manager', desc: 'IRS Notice 2026-15, 7-Point Safe Harbor checklists, and audit defense.' },
    { id: 'logistics_coordinator', label: 'Logistics Coordinator', desc: 'Carrier portal tracking (UPS / Old Dominion) and serial reconciliation.' },
    { id: 'field_rep', label: 'Field Representative', desc: 'Mobile site inspection recorder, offline sync, and DOA issue flagging.' },
    { id: 'client_rep', label: 'Client Representative', desc: 'Program dashboard for compliance rates, partner volume, and inspections.' },
    { id: 'vendor', label: 'Vendor / Supplier (SunVolt)', desc: 'Supplier portal with Safe Harbor addendums and inbound deliveries.' },
    { id: 'end_user', label: 'Installation Partner (Apex Solar)', desc: 'Isolated contractor view with project requisitions and serial scanning.' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Cpu className="w-4 h-4" />
            Platform Security & Administration
          </div>
          <h2 className="text-2xl font-bold text-white">
            System Administration & Open API Integrations
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Google SSO, role enforcement, sub-3-second latency verification, AES-256 encryption, and open API connectors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            Uptime: {health.uptimePercent}% (SLA Verified)
          </span>
        </div>
      </div>

      {/* Grid: Performance Telemetry & Security */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Query Latency</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {health.averageResponseTimeMs} ms
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Guaranteed &lt; 3.0s query threshold
            </div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Data Encryption</span>
            <Lock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2">
            <div className="text-lg font-bold text-cyan-300">
              AES-256 Verified
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              TLS 1.3 In-Transit & At-Rest
            </div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Automated Backups</span>
            <Database className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2">
            <div className="text-lg font-bold text-purple-300">
              Daily Point-in-Time
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Multi-Region Firestore Sync
            </div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Network Capacity</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-amber-400">
              {health.totalActivePartners} / 100+
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Scalable Partner Architecture
            </div>
          </div>
        </div>
      </div>

      {/* Role Administration & Switcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          Role-Based Access Enforcement & Persona Switcher
        </h3>
        <p className="text-xs text-slate-400">
          Enforces data isolation for external partners while empowering Robert Wolff or platform administrators to maintain daily operations.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {testRoles.map((role) => (
            <div
              key={role.id}
              onClick={() => onSwitchRole(role.id)}
              className={`p-3.5 rounded-xl border transition cursor-pointer space-y-1.5 ${
                currentRole === role.id
                  ? 'bg-amber-500/10 border-amber-500/60 shadow-md'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">{role.label}</span>
                {currentRole === role.id && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-bold uppercase">
                    Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{role.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Open APIs, Carrier Portals & Webhooks Hub */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Globe className="w-5 h-5 text-cyan-400" />
          Open APIs, Webhooks & Enterprise Integrations
        </h3>
        <p className="text-xs text-slate-400">
          Connects Google Workspace, Enphase Installer Platform, UPS Freight, Old Dominion, and accounting software without Microsoft dependencies.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {health.integrations.map((integ, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
            >
              <div className="space-y-1">
                <span className="font-bold text-slate-200">{integ.name}</span>
                <div className="text-[10px] text-slate-400 font-mono">
                  Last Sync: {new Date(integ.lastSync).toLocaleTimeString()}
                </div>
              </div>

              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {integ.status}
              </span>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
          <label className="text-[10px] uppercase font-bold text-slate-400 block">
            Public Inbound Webhook Endpoint
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={apiWebhookUrl}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-mono text-cyan-300"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(apiWebhookUrl);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
              }}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
            >
              {isCopied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
