import React, { useState } from 'react';
import { ProjectSong, CeoInboxItem } from '../types';
import { MiniDawPlayer } from './MiniDawPlayer';
import { 
  X, 
  Music, 
  FileText, 
  Share2, 
  Sliders, 
  ShieldAlert, 
  CheckCircle, 
  Copy, 
  Check, 
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { formatSunoPromptCard, validateSunoLyrics } from '../utils/sunoPromptFormatter';
import { formatTuneCoreExport, validateTuneCorePackage } from '../utils/tuneCoreValidator';
import { isCeoGate } from '../utils/pipelineRules';

interface ProjectInspectorModalProps {
  project: ProjectSong;
  onClose: () => void;
  onApproveGate?: (project: ProjectSong, notes?: string) => void;
  onRejectGate?: (project: ProjectSong, notes: string) => void;
}

export const ProjectInspectorModal: React.FC<ProjectInspectorModalProps> = ({
  project,
  onClose,
  onApproveGate,
  onRejectGate
}) => {
  const [activeTab, setActiveTab] = useState<'daw' | 'suno' | 'lyrics' | 'tunecore'>('daw');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [revisionNotes, setRevisionNotes] = useState('');

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const lyricAnalysis = project.lyrics ? validateSunoLyrics(project.lyrics) : null;
  const tuneCoreValidation = project.tuneCorePackage ? validateTuneCorePackage(project.tuneCorePackage) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none font-mono">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-400">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">{project.title}</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {project.artistName}
                </span>
                {isCeoGate(project.stage) && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500 font-bold flex items-center gap-1 animate-pulse">
                    <ShieldAlert className="w-2.5 h-2.5" /> GATE PAUSED
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Stage: <strong className="text-cyan-300 font-mono">{project.stage}</strong> • Genre: {project.genre} • Key: {project.musicalKey} • {project.targetBpm} BPM
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close project modal"
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 pt-3 border-b border-slate-800 bg-slate-950/50">
          <button
            onClick={() => setActiveTab('daw')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'daw'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" /> Studio A DAW & WAV Seed
          </button>

          <button
            onClick={() => setActiveTab('suno')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'suno'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Suno v4 Prompt Card
          </button>

          <button
            onClick={() => setActiveTab('lyrics')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'lyrics'
                ? 'border-fuchsia-400 text-fuchsia-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Lyra's Lyrics & Metatags
          </button>

          <button
            onClick={() => setActiveTab('tunecore')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'tunecore'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" /> TuneCore & 14-Day Rollout
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'daw' && (
            <div className="flex flex-col gap-4">
              <MiniDawPlayer project={project} />
              
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400">
                <span className="text-cyan-300 font-bold block mb-1">NOVA'S SOUND DESIGN LOG</span>
                <p className="font-sans leading-relaxed">
                  Synthesized chord progression with analog chorus routing. Seed is arranged as a 4-bar seamless loop at {project.targetBpm} BPM.
                  Click <strong>[Download .WAV Seed for Suno]</strong> above to import this exact audio seed as the sonic reference for Suno v4 generation.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'suno' && (
            <div className="flex flex-col gap-4">
              {project.sunoCard ? (
                <>
                  <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-xs font-bold text-amber-400">SUNO v4 PARAMETER MATRIX</span>
                      <p className="text-[11px] text-slate-400 font-sans">
                        Configured specifically for Suno v4 audio generator
                      </p>
                    </div>

                    <button
                      onClick={() => handleCopy(formatSunoPromptCard(project.sunoCard!), 'suno')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all cursor-pointer"
                    >
                      {copiedText === 'suno' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedText === 'suno' ? 'Copied to Clipboard!' : 'Copy Entire Card'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Style Prompt</span>
                      <pre className="text-xs text-slate-100 font-mono bg-slate-900 p-3 rounded-lg border border-slate-800 whitespace-pre-wrap leading-relaxed">
                        {project.sunoCard.style_prompt}
                      </pre>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Exclude Styles</span>
                      <pre className="text-xs text-rose-300 font-mono bg-slate-900 p-3 rounded-lg border border-slate-800 whitespace-pre-wrap leading-relaxed">
                        {project.sunoCard.exclude_styles}
                      </pre>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs text-center">
                    <div>
                      <span className="text-slate-400 block text-[10px]">MODEL</span>
                      <span className="font-bold text-white">Suno {project.sunoCard.model_version}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">WEIRDNESS</span>
                      <span className="font-bold text-amber-400">{project.sunoCard.weirdness_pct}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">AUDIO WEIGHT</span>
                      <span className="font-bold text-cyan-400">{project.sunoCard.audio_weight_pct}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">PROGRESSION</span>
                      <span className="font-bold text-emerald-400">{project.sunoCard.chords.join(' - ')}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  Suno v4 card not yet generated. Advance project to Stage 3 or trigger Nova in Studio A.
                </div>
              )}
            </div>
          )}

          {activeTab === 'lyrics' && (
            <div className="flex flex-col gap-4">
              {project.lyrics ? (
                <>
                  <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-xs font-bold text-fuchsia-400">LYRA'S LYRIC TOPLINE & METATAGS</span>
                        <p className="text-[11px] text-slate-400 font-sans">
                          Tagged with vocal dynamics for Suno v4 AI vocalist
                        </p>
                      </div>
                      {lyricAnalysis && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-800 font-mono">
                          {lyricAnalysis.metatagCount} Metatags Detected
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleCopy(project.lyrics!, 'lyrics')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-fuchsia-500 hover:bg-fuchsia-400 text-slate-950 text-xs font-bold transition-all cursor-pointer"
                    >
                      {copiedText === 'lyrics' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedText === 'lyrics' ? 'Copied Lyrics!' : 'Copy Lyrics'}
                    </button>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <pre className="text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed max-h-[380px] overflow-y-auto pr-2">
                      {project.lyrics}
                    </pre>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  Lyrics not yet written. Advance to Stage 3 for Lyra to write the vocal arrangement.
                </div>
              )}
            </div>
          )}

          {activeTab === 'tunecore' && (
            <div className="flex flex-col gap-4">
              {project.tuneCorePackage ? (
                <>
                  <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-xs font-bold text-emerald-400">TUNECORE DISTRIBUTION SPECIFICATION</span>
                      <p className="text-[11px] text-slate-400 font-sans">
                        100% compliant DSP metadata package
                      </p>
                    </div>

                    <button
                      onClick={() => handleCopy(formatTuneCoreExport(project.tuneCorePackage!), 'tunecore')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all cursor-pointer"
                    >
                      {copiedText === 'tunecore' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedText === 'tunecore' ? 'Copied TuneCore Sheet!' : 'Copy Metadata Sheet'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">RELEASE TITLE</span>
                      <span className="font-bold text-white">{project.tuneCorePackage.release_title}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">PRIMARY GENRE</span>
                      <span className="font-bold text-emerald-400">{project.tuneCorePackage.primary_genre}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">C-LINE</span>
                      <span className="font-bold text-slate-300">{project.tuneCorePackage.c_line}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">TIKTOK DROP START</span>
                      <span className="font-bold text-cyan-400">{project.tuneCorePackage.tiktok_clip_start_seconds}s</span>
                    </div>
                  </div>

                  {/* 3000x3000 Cover Art Prompt */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">
                      3000x3000px Cover Art Prompt (Visual AI)
                    </span>
                    <p className="text-xs text-slate-200 bg-slate-900 p-3 rounded-lg border border-slate-800 font-sans leading-relaxed">
                      {project.tuneCorePackage.cover_art_prompt_3000x3000}
                    </p>
                  </div>

                  {/* 14-Day Viral Video Rollout */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-emerald-400">14-DAY SHORT-FORM VIDEO ROLLOUT</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {project.tuneCorePackage.marketing_14_day_rollout.map((day) => (
                        <div key={day.day} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs flex flex-col gap-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-emerald-400">Day {day.day} • {day.platform}</span>
                            <span className="text-slate-500 font-mono">{day.audio_snippet}</span>
                          </div>
                          <p className="text-slate-200 font-sans text-[11px]">"{day.content_hook}"</p>
                          <span className="text-[9px] text-slate-500 font-mono truncate">{day.caption_hashtags}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  TuneCore package not yet prepared. Advance project to Stage 5 for Vance to audit metadata.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with Gate Approval Actions if currently paused at Gate */}
        {isCeoGate(project.stage) && onApproveGate && (
          <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-rose-300 text-xs">
              <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
              <span>
                This project is currently paused at <strong>{project.stage}</strong>. Autonomous progress cannot continue until you grant approval or request revisions.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Optional CEO revision notes or instructions..."
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 text-xs rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              {onRejectGate && (
                <button
                  onClick={() => onRejectGate(project, revisionNotes || 'CEO requested revision.')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-200 text-xs font-bold border border-slate-700 hover:border-rose-500 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> [Request Revision]
                </button>
              )}
              <button
                onClick={() => onApproveGate(project, revisionNotes)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" /> [Approve & Advance Gate]
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
