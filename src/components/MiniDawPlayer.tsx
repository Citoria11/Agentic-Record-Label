import React, { useState, useEffect } from 'react';
import * as Tone from 'tone';
import { Play, Square, Download, Music, Sparkles, RefreshCw, Copy, Check, Sliders } from 'lucide-react';
import { ProjectSong, NoteEvent } from '../types';
import { AudioEngine } from '../services/audioEngine';
import { formatSunoPromptCard } from '../utils/sunoPromptFormatter';

interface MiniDawPlayerProps {
  project: ProjectSong;
  onUpdateNotes?: (notes: NoteEvent[]) => void;
  onClose?: () => void;
}

export const MiniDawPlayer: React.FC<MiniDawPlayerProps> = ({ project, onUpdateNotes, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(project.targetBpm || 124);
  const [activeNoteIdx, setActiveNoteIdx] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFileName, setDownloadFileName] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState<'synth' | 'lead' | 'bass' | 'piano'>('synth');
  const [exportLoopBars, setExportLoopBars] = useState<4 | 8>(4);

  const notes = project.noteSequence || [];

  useEffect(() => {
    AudioEngine.setNoteHighlightCallback((idx) => {
      setActiveNoteIdx(idx);
    });

    return () => {
      AudioEngine.stopSequence();
      AudioEngine.setNoteHighlightCallback(() => {});
    };
  }, []);

  const handleTogglePlay = async () => {
    // Explicit user gesture call to Tone.start() and AudioEngine.init()
    try {
      await Tone.start();
      await Tone.context.resume();
    } catch (err) {
      console.warn('Tone.start gesture error:', err);
    }

    if (isPlaying) {
      AudioEngine.stopSequence();
      setIsPlaying(false);
      setActiveNoteIdx(null);
    } else {
      if (notes.length === 0) return;
      await AudioEngine.playSequence(notes, bpm, true);
      setIsPlaying(true);
    }
  };

  const handleDownloadWav = async () => {
    try {
      setIsExporting(true);
      await Tone.start();
      const result = await AudioEngine.exportSequenceToWav(notes, bpm, project.title, exportLoopBars);
      setDownloadUrl(result.url);
      setDownloadFileName(result.fileName);

      // Trigger instant direct download in browser
      const link = document.createElement('a');
      link.href = result.url;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export WAV:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopySunoPrompt = () => {
    if (!project.sunoCard) return;
    const text = formatSunoPromptCard(project.sunoCard);
    navigator.clipboard.writeText(text);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handlePreviewPitch = async (pitch: string) => {
    try {
      await Tone.start();
      await Tone.context.resume();
    } catch (err) {
      console.warn('AudioContext resume on preview:', err);
    }
    AudioEngine.playSingleNote(pitch, '8n', selectedInstrument);
  };

  return (
    <div className="bg-slate-900 border border-cyan-500/30 rounded-xl p-5 shadow-2xl text-slate-100 flex flex-col gap-4 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]">
            <Music className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold tracking-wider text-cyan-300">STUDIO A // MINI DAW & SUNO SEED</h3>
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                Tone.js Audio Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              "{project.title}" • {project.musicalKey || 'F#m'} • {bpm} BPM • Nova's 16-Step Polyphonic Stem
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close Studio A DAW"
            className="text-slate-400 hover:text-white px-2 py-1 text-xs border border-slate-800 rounded bg-slate-950 hover:bg-slate-800 cursor-pointer"
          >
            ✕ CLOSE
          </button>
        )}
      </div>

      {/* Main Transport Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 p-3 rounded-lg border border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={handleTogglePlay}
            aria-label={isPlaying ? "Stop audio preview" : "Play audio preview"}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs tracking-wider transition-all shadow-md cursor-pointer ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/30'
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-4 h-4 fill-current" /> STOP PREVIEW
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" /> PLAY MOTIF
              </>
            )}
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs">
            <span className="text-slate-400">TEMPO:</span>
            <input
              type="range"
              min="60"
              max="160"
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-20 accent-cyan-400 cursor-pointer"
            />
            <span className="text-cyan-400 font-bold w-12 text-right">{bpm} BPM</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded border border-slate-800 text-xs">
            {(['synth', 'lead', 'bass', 'piano'] as const).map((inst) => (
              <button
                key={inst}
                onClick={() => setSelectedInstrument(inst)}
                className={`px-2 py-1 rounded capitalize transition-all cursor-pointer ${
                  selectedInstrument === inst
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {inst}
              </button>
            ))}
          </div>
        </div>

        {/* WAV Download button with 4-bar / 8-bar loop toggle */}
        <div className="flex items-center gap-2">
          {/* Loop Duration Selector */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400 text-[10px] px-1 uppercase">Loop:</span>
            <button
              onClick={() => setExportLoopBars(4)}
              className={`px-2 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                exportLoopBars === 4
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              4-Bar
            </button>
            <button
              onClick={() => setExportLoopBars(8)}
              className={`px-2 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                exportLoopBars === 8
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              8-Bar
            </button>
          </div>

          <button
            onClick={handleDownloadWav}
            disabled={isExporting}
            aria-label={`Download ${exportLoopBars}-Bar .WAV Seed for Suno`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs tracking-wider transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
          >
            {isExporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> RENDERING {exportLoopBars}-BAR WAV...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> [Download {exportLoopBars}-Bar .WAV Seed for Suno]
              </>
            )}
          </button>
        </div>
      </div>

      {/* Interactive 16-Step Piano Roll Visualizer */}
      <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-slate-400 pb-1 border-b border-slate-800/80">
          <span className="flex items-center gap-1 text-cyan-400 font-bold">
            <Sparkles className="w-3.5 h-3.5" /> FULL 16-STEP POLYPHONIC SEQUENCE (STEPS 1-16 ACTIVELY POPULATED)
          </span>
          <span className="text-slate-500">Measures 1-4 • 16th Note Grid • Zero Dead Space</span>
        </div>

        <div className="grid grid-cols-16 gap-1 py-2 overflow-x-auto min-w-[620px]">
          {Array.from({ length: 16 }).map((_, stepIdx) => {
            const stepNote = notes.find((n) => Math.round(n.time * 4) === stepIdx);
            const isCurrentStep = activeNoteIdx !== null && notes[activeNoteIdx] && Math.round(notes[activeNoteIdx].time * 4) === stepIdx;

            return (
              <div
                key={stepIdx}
                className={`h-24 rounded flex flex-col justify-between p-1 border transition-all text-center ${
                  isCurrentStep
                    ? 'bg-cyan-500/40 border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.6)] scale-105'
                    : stepNote
                    ? 'bg-slate-800/90 border-cyan-500/40 text-cyan-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-600'
                }`}
              >
                <span className="text-[10px] text-slate-500">{stepIdx + 1}</span>
                {stepNote ? (
                  <div
                    onClick={() => handlePreviewPitch(stepNote.note)}
                    title={`Click to preview ${stepNote.note}`}
                    className="cursor-pointer py-1 my-auto rounded bg-cyan-950/80 border border-cyan-500/50 hover:bg-cyan-900 text-[11px] font-bold text-cyan-300"
                  >
                    {stepNote.note}
                  </div>
                ) : (
                  <div className="my-auto text-[10px] opacity-20">-</div>
                )}
                <span className="text-[9px] text-slate-400 uppercase truncate">
                  {stepNote?.instrument || 'rest'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Chord Progression Tags */}
        {project.chordProgression && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60 text-xs">
            <span className="text-slate-400 font-sans">Chords:</span>
            <div className="flex items-center gap-1.5">
              {project.chordProgression.map((chord, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded bg-slate-900 text-cyan-300 border border-cyan-500/30 text-xs font-bold"
                >
                  {chord}
                </span>
              ))}
            </div>
            <span className="text-slate-500 text-xs ml-auto">
              Key: {project.musicalKey || project.sunoCard?.key || 'F# minor'}
            </span>
          </div>
        )}
      </div>

      {/* Suno v4 Prompt Card (Copy-Pasteable) */}
      {project.sunoCard && (
        <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400">SUNO v4 PARAMETER CARD</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                Ready for Suno Studio
              </span>
            </div>
            <button
              onClick={handleCopySunoPrompt}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-all cursor-pointer border border-slate-700"
            >
              {copiedPrompt ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy Parameter Card
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-900/80 p-2.5 rounded border border-slate-800/80">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Style Prompt</span>
              <p className="text-slate-200 font-mono text-[11px] mt-0.5 leading-relaxed bg-slate-950 p-2 rounded border border-slate-800">
                {project.sunoCard.style_prompt}
              </p>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Exclude Styles</span>
              <p className="text-rose-300/80 font-mono text-[11px] mt-0.5 leading-relaxed bg-slate-950 p-2 rounded border border-slate-800">
                {project.sunoCard.exclude_styles}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <div className="flex items-center gap-4">
              <span>
                Weirdness: <strong className="text-slate-200">{project.sunoCard.weirdness_pct}%</strong>
              </span>
              <span>
                Audio Weight: <strong className="text-slate-200">{project.sunoCard.audio_weight_pct}%</strong>
              </span>
            </div>
            <span className="text-[11px] text-cyan-400">
              💡 Tip: Upload the {exportLoopBars}-bar .WAV into Suno's "Audio Reference" box.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
