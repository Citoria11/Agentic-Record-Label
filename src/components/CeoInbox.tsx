import React, { useState } from 'react';
import { CeoInboxItem, DailyBriefing, ProjectSong } from '../types';
import { 
  CheckCircle, 
  RotateCcw, 
  ShieldAlert, 
  FileText, 
  TrendingUp, 
  Calendar, 
  ExternalLink,
  Send,
  Sparkles,
  Inbox
} from 'lucide-react';

interface CeoInboxProps {
  inboxItems: CeoInboxItem[];
  briefing: DailyBriefing;
  projects: ProjectSong[];
  onApproveGate: (item: CeoInboxItem, notes?: string) => void;
  onRejectGate: (item: CeoInboxItem, notes: string) => void;
  onInspectProject: (project: ProjectSong) => void;
  onRefreshBriefing?: () => void;
  isRefreshingBriefing?: boolean;
}

export const CeoInbox: React.FC<CeoInboxProps> = ({
  inboxItems,
  briefing,
  projects,
  onApproveGate,
  onRejectGate,
  onInspectProject,
  onRefreshBriefing,
  isRefreshingBriefing
}) => {
  const [activeNotes, setActiveNotes] = useState<Record<string, string>>({});

  const pendingItems = inboxItems.filter((item) => item.status === 'PENDING');

  const handleNoteChange = (id: string, text: string) => {
    setActiveNotes((prev) => ({ ...prev, [id]: text }));
  };

  const getGateBadge = (gateType: string) => {
    switch (gateType) {
      case '2_CEO_CONCEPT_GATE':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-600 font-mono">
            GATE 2: CONCEPT SIGN-OFF
          </span>
        );
      case '4_CEO_MASTER_GATE':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-600 font-mono">
            GATE 4: MASTER & LYRIC SIGN-OFF
          </span>
        );
      case '6_CEO_RELEASE_GATE':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-600 font-mono">
            GATE 6: GLOBAL DSP RELEASE
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 font-mono">
            {gateType}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto pr-1">
      {/* 1. Miles Morning CEO Executive Dispatch Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border border-amber-500/30 rounded-xl p-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-bold font-mono text-amber-300 tracking-wider">
              MILES // MORNING CEO BRIEFING
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {briefing.date}
            </span>
            {onRefreshBriefing && (
              <button
                onClick={onRefreshBriefing}
                disabled={isRefreshingBriefing}
                aria-label="Refresh CEO briefing"
                className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 hover:bg-amber-900 transition-all cursor-pointer"
              >
                {isRefreshingBriefing ? 'Regenerating...' : 'Refresh'}
              </button>
            )}
          </div>
        </div>

        <h3 className="text-sm font-bold text-white mb-2 leading-snug">
          {briefing.headline}
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed mb-3">
          {briefing.executiveSummary}
        </p>

        <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 font-mono mb-2">
          <div>
            <span className="text-slate-400 block text-[9px] uppercase">Financial Forecast</span>
            <span className="text-emerald-400 font-bold">{briefing.financialHighlight}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[9px] uppercase">Pending Decision Gates</span>
            <span className="text-amber-400 font-bold">{briefing.pendingGatesCount} Gate(s) Paused</span>
          </div>
        </div>

        <div className="text-[11px] bg-amber-950/40 border border-amber-500/30 p-2 rounded text-amber-200">
          <strong>Recommended CEO Action:</strong> {briefing.recommendedAction}
        </div>
      </div>

      {/* 2. CEO Approval Queue Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Inbox className="w-4 h-4 text-rose-400" />
          <h4 className="text-xs font-bold font-mono tracking-wider text-slate-200 uppercase">
            CEO Approval Queue
          </h4>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            {pendingItems.length} PENDING
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          Autonomous progress paused until authorized
        </span>
      </div>

      {/* 3. Items Paused at CEO Gate */}
      {pendingItems.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center flex flex-col items-center justify-center gap-2">
          <CheckCircle className="w-8 h-8 text-emerald-400 opacity-60" />
          <p className="text-xs font-bold text-slate-200">All CEO Approval Gates Cleared</p>
          <p className="text-[11px] text-slate-400 max-w-xs">
            Agents have full autonomy to proceed. Trigger a Label Tick or add a new single to the pipeline.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pendingItems.map((item) => {
            const project = projects.find((p) => p.id === item.projectId);
            const notes = activeNotes[item.id] || '';

            return (
              <div
                key={item.id}
                className="bg-slate-900/90 border border-rose-500/40 rounded-xl p-4 shadow-xl flex flex-col gap-3 transition-all hover:border-rose-400"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      {getGateBadge(item.gateType)}
                      <span className="text-[10px] text-slate-400 font-mono">
                        Submitted by: {item.submittedBy.toUpperCase()}
                      </span>
                    </div>
                    <h5 className="text-sm font-bold text-white mt-1">
                      {item.projectTitle}
                    </h5>
                  </div>

                  {project && (
                    <button
                      onClick={() => onInspectProject(project)}
                      className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-all cursor-pointer font-mono"
                    >
                      Inspect <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed font-sans">
                  {item.summary}
                </p>

                {/* Optional CEO Notes / Directions Input */}
                <div className="flex flex-col gap-1">
                  <label htmlFor={`ceo-notes-${item.id}`} className="text-[10px] font-mono text-slate-400">
                    CEO FEEDBACK / REVISION NOTES (OPTIONAL):
                  </label>
                  <input
                    id={`ceo-notes-${item.id}`}
                    type="text"
                    placeholder="e.g., 'Approved, proceed to Studio A' or 'Speed up BPM by 4, tighten chorus rhymes'"
                    value={notes}
                    onChange={(e) => handleNoteChange(item.id, e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none font-mono"
                  />
                </div>

                {/* Gate Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
                  <button
                    onClick={() => onRejectGate(item, notes || 'CEO requested revision on musical concept.')}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-rose-950/80 hover:text-rose-200 text-slate-300 text-xs font-bold border border-slate-700 hover:border-rose-500 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> [Request Revision]
                  </button>

                  <button
                    onClick={() => onApproveGate(item, notes)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> [Approve & Advance]
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
