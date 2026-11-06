import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Award,
  AlertTriangle,
  TrendingUp,
  Download,
  CheckCircle2,
  PieChart,
  Layers,
  FileSpreadsheet,
  FileText,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { PartnerScorecard } from '../types/backlog';
import { SEED_SCORECARDS } from '../data/backlogSeedData';

export const ScorecardsRiskView: React.FC = () => {
  const [scorecards, setScorecards] = useState<PartnerScorecard[]>(SEED_SCORECARDS);
  const [selectedScorecard, setSelectedScorecard] = useState<PartnerScorecard>(scorecards[0]);

  // Concentration Risk Check (US-40): flags if any partner volume > 25%
  const highRiskPartners = scorecards.filter((s) => s.volumeSharePercent > 25.0);

  // Export Scorecard to Excel / Google Sheets format (US-41)
  const handleExportScorecard = () => {
    const summaryData = [
      { Metric: 'Partner Name', Value: selectedScorecard.partnerName },
      { Metric: 'Client Program', Value: selectedScorecard.clientProgram },
      { Metric: 'Overall Calculated Score', Value: `${selectedScorecard.overallScore} / 100` },
      { Metric: 'Letter Grade', Value: selectedScorecard.letterGrade },
      { Metric: 'Program Volume Share (%)', Value: `${selectedScorecard.volumeSharePercent}%` },
      { Metric: 'Concentration Risk Warning', Value: selectedScorecard.isHighConcentrationRisk ? 'YES (Exceeds 25% threshold)' : 'NO' },
      { Metric: 'Evaluator', Value: selectedScorecard.evaluatorName },
    ];

    const questionsData = selectedScorecard.questions.map((q) => ({
      Category: q.category,
      Question: q.questionText,
      'Max Score': q.maxScore,
      'Awarded Score': q.awardedScore,
      Evidence: q.evidenceNotes || 'Verified during audit',
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), 'Summary');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(questionsData), '85_Framework_Questions');
    XLSX.writeFile(wb, `counSOL_Scorecard_${selectedScorecard.partnerName.replace(/\s+/g, '_')}_2026.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" />
            Scorecards & Concentration Risk
          </div>
          <h2 className="text-2xl font-bold text-white">
            Partner Scorecard Framework & Concentration Risk
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            85-question comprehensive evaluation, automated 0-100 scoring, client executive dashboards, and Sheets/PDF exports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportScorecard}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Scorecard (.xlsx / Sheets)
          </button>
        </div>
      </div>

      {/* Concentration Risk Alert Banner */}
      {highRiskPartners.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            </div>
            <div>
              <strong className="text-white block">Program Concentration Risk Triggered:</strong>
              <span>
                {highRiskPartners[0].partnerName} currently accounts for {highRiskPartners[0].volumeSharePercent}% of total program volume (threshold: 25.0%). Capacity rebalancing recommended across Great Lakes and Palmetto SunWorks.
              </span>
            </div>
          </div>
          <span className="font-mono text-[11px] bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800 text-amber-400">
            Action: Rebalance Allocations
          </span>
        </div>
      )}

      {/* Partner Scorecard Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-medium mr-2">Evaluated Partner:</span>
        {scorecards.map((sc) => (
          <button
            key={sc.id}
            onClick={() => setSelectedScorecard(sc)}
            className={`px-3 py-2 rounded-xl whitespace-nowrap transition font-semibold flex items-center gap-2 ${
              selectedScorecard.id === sc.id
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <span>{sc.partnerName}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 font-bold text-amber-400 font-mono">
              Grade {sc.letterGrade} ({sc.overallScore}%)
            </span>
          </button>
        ))}
      </div>

      {/* Scorecard Detailed Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 85 Questions Framework & Strengths/Improvements */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  Program Framework Scored Questions
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Full 85-question framework across Quality, Safety, Safe Harbor, Schedule, and Logistics.
                </p>
              </div>

              <div className="text-right">
                <span className="text-2xl font-bold font-mono text-emerald-400">
                  {selectedScorecard.overallScore}
                </span>
                <span className="text-xs text-slate-400 font-mono"> / 100</span>
                <div className="text-[10px] uppercase font-bold text-slate-400">
                  Rating: Grade {selectedScorecard.letterGrade}
                </div>
              </div>
            </div>

            {/* Questions Table */}
            <div className="space-y-2.5">
              {selectedScorecard.questions.map((q) => (
                <div
                  key={q.id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {q.category}
                    </span>
                    <p className="text-slate-200 font-medium pt-0.5">{q.questionText}</p>
                    {q.evidenceNotes && (
                      <span className="text-[11px] text-slate-400 italic">
                        Evidence: {q.evidenceNotes}
                      </span>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {q.awardedScore}
                    </span>
                    <span className="font-mono text-slate-500 text-xs"> / {q.maxScore}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Required Improvements & Action Plan */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Partner Required Improvements & Performance Roadmap
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                <span className="text-emerald-400 font-bold uppercase text-[10px] block">
                  Top Demonstrated Strengths
                </span>
                <ul className="space-y-1.5 text-slate-300">
                  {selectedScorecard.strengths.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                <span className="text-amber-400 font-bold uppercase text-[10px] block">
                  Required Action Plan Improvements
                </span>
                <ul className="space-y-1.5 text-slate-300">
                  {selectedScorecard.requiredImprovements.map((imp, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Client Executive Dashboard */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 text-xs">
            <h4 className="font-bold text-white flex items-center gap-2 text-sm">
              <Building className="w-4 h-4 text-amber-400" />
              Client Representative Dashboard
            </h4>
            <p className="text-[11px] text-slate-400">
              Executive program overview for client stakeholders and investors.
            </p>

            <div className="space-y-3">
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Program Compliance Rate</span>
                  <span className="font-mono font-bold text-emerald-400">96.8% Compliant</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="w-[96.8%] h-full bg-emerald-500 rounded-full" />
                </div>
              </div>

              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Volume Concentration (Apex)</span>
                  <span className="font-mono font-bold text-amber-400">28.5% (High)</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="w-[28.5%] h-full bg-amber-500 rounded-full" />
                </div>
              </div>

              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Inventory Serial Reconciliation</span>
                  <span className="font-mono font-bold text-cyan-400">98.2% Matched</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="w-[98.2%] h-full bg-cyan-500 rounded-full" />
                </div>
              </div>

              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Site QA Inspections Passed</span>
                  <span className="font-mono font-bold text-purple-400">42 / 44 Sites</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="w-[95.4%] h-full bg-purple-500 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
