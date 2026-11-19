import React, { useState } from 'react';
import { ProjectSong, PipelineStage } from '../types';
import { 
  Plus, 
  Disc, 
  ShieldAlert, 
  Sparkles, 
  Play, 
  ExternalLink, 
  Music, 
  CheckCircle2, 
  Radio,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { isCeoGate } from '../utils/pipelineRules';

interface KanbanPipelineProps {
  projects: ProjectSong[];
  onSelectProject: (project: ProjectSong) => void;
  onOpenNewProjectModal: () => void;
  onClearDemoCatalog?: () => void;
  onRestoreDemoCatalog?: () => void;
}

const STAGES: { id: PipelineStage; label: string; isGate: boolean; color: string }[] = [

  { id: '1_IDEATION', label: '1. IDEATION', isGate: false, color: 'border-slate-700' },
  { id: '2_CEO_CONCEPT_GATE', label: '2. CEO CONCEPT GATE', isGate: true, color: 'border-amber-500/50' },
  { id: '3_PRODUCTION_AND_LYRICS', label: '3. PRODUCTION & LYRICS', isGate: false, color: 'border-cyan-500/50' },
  { id: '4_CEO_MASTER_GATE', label: '4. CEO MASTER GATE', isGate: true, color: 'border-cyan-400/60' },
  { id: '5_TUNECORE_AND_MARKETING', label: '5. TUNECORE & MARKETING', isGate: false, color: 'border-emerald-500/50' },
  { id: '6_CEO_RELEASE_GATE', label: '6. CEO RELEASE GATE', isGate: true, color: 'border-rose-500/60' },
  { id: 'RELEASED', label: 'GLOBAL RELEASED', isGate: false, color: 'border-purple-500/60' }
];

export const KanbanPipeline: React.FC<KanbanPipelineProps> = ({
  projects,
  onSelectProject,
  onOpenNewProjectModal,
  onClearDemoCatalog,
  onRestoreDemoCatalog
}) => {
  const [selectedGenreFilter, setSelectedGenreFilter] = useState<string>('ALL');

  const genres = ['ALL', ...Array.from(new Set(projects.map((p) => p.genre)))];

  const filteredProjects = selectedGenreFilter === 'ALL'
    ? projects
    : projects.filter((p) => p.genre === selectedGenreFilter);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-xs font-bold font-mono text-slate-100">
            CATALOG PIPELINE (6-STAGE WORKFLOW)
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
            {filteredProjects.length} TRACKS
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Genre Filter */}
          <select
            value={selectedGenreFilter}
            onChange={(e) => setSelectedGenreFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1 font-mono focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            {genres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          {/* Clear Demo Catalog Button */}
          {projects.length > 0 && onClearDemoCatalog && (
            <button
              onClick={onClearDemoCatalog}
              title="Wipe demo tracks to run only your original custom singles"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800 text-rose-300 text-xs font-mono transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> [🗑️ Clear Demo Catalog]
            </button>
          )}

          {/* Restore Demo Catalog Button */}
          {projects.length === 0 && onRestoreDemoCatalog && (
            <button
              onClick={onRestoreDemoCatalog}
              title="Restore the 4 pre-loaded demo tracks"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800 text-cyan-300 text-xs font-mono transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> [+ Restore Demo Roster]
            </button>
          )}

          <button
            onClick={onOpenNewProjectModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md shadow-cyan-500/20 transition-all cursor-pointer font-mono"
          >
            <Plus className="w-3.5 h-3.5" /> + NEW SINGLE
          </button>
        </div>
      </div>


      {/* Horizontal Scrolling Kanban Column Container */}
      <div className="flex-1 overflow-x-auto pb-3">
        <div className="flex gap-3 min-w-[1200px] h-full items-start">
          {STAGES.map((col) => {
            const columnProjects = filteredProjects.filter((p) => p.stage === col.id);

            return (
              <div
                key={col.id}
                className={`flex-1 min-w-[185px] max-w-[220px] bg-slate-900/60 rounded-xl p-2.5 border flex flex-col gap-2 ${col.color}`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="flex flex-col">
                    <span className={`text-[10px] font-bold font-mono tracking-wider ${
                      col.isGate ? 'text-amber-400' : 'text-slate-300'
                    }`}>
                      {col.label}
                    </span>
                    {col.isGate && (
                      <span className="text-[8px] text-rose-400 font-mono flex items-center gap-0.5">
                        <ShieldAlert className="w-2.5 h-2.5" /> CEO APPROVAL GATE
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    {columnProjects.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="flex flex-col gap-2 overflow-y-auto max-h-[460px] pr-0.5">
                  {columnProjects.length === 0 ? (
                    <div className="h-20 rounded-lg border border-dashed border-slate-800/80 flex items-center justify-center text-[10px] text-slate-600 font-mono">
                      No tracks here
                    </div>
                  ) : (
                    columnProjects.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => onSelectProject(p)}
                        className={`p-3 rounded-lg bg-slate-950 border transition-all cursor-pointer hover:scale-[1.02] shadow-md flex flex-col gap-2 ${
                          isCeoGate(p.stage)
                            ? 'border-rose-500/50 hover:border-rose-400'
                            : 'border-slate-800 hover:border-cyan-400'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex-1 pr-1">
                            <h5 className="text-xs font-bold text-white leading-snug">{p.title}</h5>
                            <span className="text-[10px] text-slate-400 font-sans">{p.artistName}</span>
                          </div>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300 font-mono">
                            {p.targetBpm}BPM
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400">
                          <span className="truncate">{p.genre}</span>
                          <span>•</span>
                          <span>{p.musicalKey}</span>
                        </div>

                        {/* Deliverable Badges */}
                        <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-slate-900">
                          {p.noteSequence && (
                            <span className="text-[8px] px-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center gap-0.5 font-mono">
                              <Music className="w-2 h-2" /> DAW SEED
                            </span>
                          )}
                          {p.lyrics && (
                            <span className="text-[8px] px-1 rounded bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-800 font-mono">
                              LYRICS
                            </span>
                          )}
                          {p.tuneCorePackage && (
                            <span className="text-[8px] px-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                              TUNECORE
                            </span>
                          )}
                        </div>

                        {isCeoGate(p.stage) && (
                          <div className="text-[9px] text-rose-300 bg-rose-950/60 p-1.5 rounded border border-rose-900 flex items-center gap-1 font-mono">
                            <ShieldAlert className="w-2.5 h-2.5 shrink-0" /> Paused: Gate Review
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
