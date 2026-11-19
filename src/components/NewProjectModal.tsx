import React, { useState } from 'react';
import { ProjectSong } from '../types';
import { X, Plus, Sparkles, Wand2, Globe } from 'lucide-react';

interface NewProjectModalProps {
  onClose: () => void;
  onCreate: (newProject: Partial<ProjectSong>) => void;
}

const QUICK_GENRES = [
  'J-Rock',
  'City-Pop',
  'Alt-Country',
  'R&B',
  'Reggaeton',
  'Glitch Pop',
  'Pop-Punk',
  'Neo-Soul',
  'Darksynth'
];

const VOCAL_LANGUAGES = [
  'English',
  'Spanish',
  'Bilingual EN/ES',
  'Bilingual EN/JP'
];

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [artistName, setArtistName] = useState('Arcana Collective');
  const [genre, setGenre] = useState('J-Rock');
  const [bpm, setBpm] = useState(154);
  const [musicalKey, setMusicalKey] = useState('F# minor');
  const [vocalLanguage, setVocalLanguage] = useState<'English' | 'Spanish' | 'Bilingual EN/ES' | 'Bilingual EN/JP'>('Bilingual EN/JP');
  const [conceptNotes, setConceptNotes] = useState('High-octane anime opening drive with driving dual electric guitars, rapid bass runs, and anthemic double-time chorus belt.');
  const [isPitching, setIsPitching] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreate({
      title: title.trim(),
      artistName: artistName.trim(),
      genre: genre.trim(),
      targetBpm: bpm,
      musicalKey: musicalKey.trim(),
      vocalLanguage,
      conceptNotes: conceptNotes.trim()
    });
  };

  const handleSelectGenreChip = (selectedGenre: string) => {
    setGenre(selectedGenre);
    // Suggest genre-appropriate BPM & defaults
    switch (selectedGenre) {
      case 'J-Rock':
        setBpm(160);
        setMusicalKey('F# minor');
        setVocalLanguage('Bilingual EN/JP');
        break;
      case 'City-Pop':
        setBpm(114);
        setMusicalKey('Ab Major');
        setVocalLanguage('Bilingual EN/JP');
        break;
      case 'Alt-Country':
        setBpm(98);
        setMusicalKey('G Major');
        setVocalLanguage('English');
        break;
      case 'R&B':
        setBpm(86);
        setMusicalKey('Db Major');
        setVocalLanguage('English');
        break;
      case 'Reggaeton':
        setBpm(94);
        setMusicalKey('G minor');
        setVocalLanguage('Spanish');
        break;
      case 'Glitch Pop':
        setBpm(140);
        setMusicalKey('C Major');
        setVocalLanguage('English');
        break;
      case 'Pop-Punk':
        setBpm(168);
        setMusicalKey('E Major');
        setVocalLanguage('English');
        break;
      case 'Neo-Soul':
        setBpm(88);
        setMusicalKey('F Major');
        setVocalLanguage('English');
        break;
      case 'Darksynth':
        setBpm(128);
        setMusicalKey('A minor');
        setVocalLanguage('English');
        break;
      default:
        break;
    }
  };

  // Miles Strategic Concept Pitcher
  const handleMilesPitch = async () => {
    setIsPitching(true);
    try {
      const res = await fetch('/api/agent/miles/pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genre, vocalLanguage })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.pitch) {
          setTitle(data.pitch.title);
          setArtistName(data.pitch.artistName);
          setGenre(data.pitch.genre);
          setBpm(data.pitch.targetBpm);
          setMusicalKey(data.pitch.musicalKey);
          if (data.pitch.vocalLanguage) {
            setVocalLanguage(data.pitch.vocalLanguage as any);
          }
          setConceptNotes(data.pitch.conceptNotes);
        }
      }
    } catch (err) {
      console.warn('Miles pitch failed:', err);
    } finally {
      setIsPitching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none font-mono">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-400">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wider">LAUNCH NEW SINGLE INITIATIVE</h3>
              <p className="text-[10px] text-slate-400 font-sans">
                Stage 1 (Ideation) • Directing Miles, Nova, Lyra & Vance
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close new single modal"
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 text-xs">
          {/* Miles Pitch Action Banner */}
          <div className="flex items-center justify-between bg-gradient-to-r from-amber-950/60 to-cyan-950/60 p-2.5 rounded-xl border border-amber-600/30">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <div>
                <span className="text-[11px] font-bold text-amber-300 block">MILES A&R STRATEGIST</span>
                <span className="text-[10px] text-slate-400 font-sans">Auto-generate hit titles & sonic briefs tailored to your genre</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleMilesPitch}
              disabled={isPitching}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-[10px] shadow-sm transition-all cursor-pointer font-mono"
            >
              <Wand2 className="w-3 h-3" />
              {isPitching ? 'PITCHING...' : '[✨ Let Miles Pitch a Concept]'}
            </button>
          </div>

          {/* Quick-Select Genre Chips */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
              SELECT GENRE PRESET OR TYPE CUSTOM:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_GENRES.map((g) => {
                const isSelected = genre.toLowerCase() === g.toLowerCase();
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => handleSelectGenreChip(g)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-mono transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Track Title & Artist Name */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400">TRACK TITLE</label>
              <input
                type="text"
                required
                placeholder="e.g. Shinjuku Overdrive"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-lg px-3 py-2 text-white font-mono focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400">ARTIST / PROJECT NAME</label>
              <input
                type="text"
                required
                placeholder="e.g. Kage & The Echoes"
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                className="bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-lg px-3 py-2 text-white font-mono focus:outline-none"
              />
            </div>
          </div>

          {/* Custom Genre, BPM, Musical Key & Vocal Language */}
          <div className="grid grid-cols-4 gap-2.5">
            <div className="flex flex-col gap-1 col-span-1">
              <label className="text-[10px] text-slate-400">GENRE (CUSTOM)</label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-lg px-2.5 py-2 text-white font-mono focus:outline-none text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400">BPM</label>
              <input
                type="number"
                min="60"
                max="195"
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-lg px-2.5 py-2 text-white font-mono focus:outline-none text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400">KEY</label>
              <input
                type="text"
                value={musicalKey}
                onChange={(e) => setMusicalKey(e.target.value)}
                className="bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-lg px-2.5 py-2 text-white font-mono focus:outline-none text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400 flex items-center gap-1">
                <Globe className="w-2.5 h-2.5 text-cyan-400" /> VOCAL LANG
              </label>
              <select
                value={vocalLanguage}
                onChange={(e) => setVocalLanguage(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-lg px-2 py-2 text-white font-mono focus:outline-none text-[11px] cursor-pointer"
              >
                {VOCAL_LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Concept Notes & Sonic Direction */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400">CONCEPT NOTES & SONIC DIRECTION</label>
            <textarea
              rows={2}
              value={conceptNotes}
              onChange={(e) => setConceptNotes(e.target.value)}
              placeholder="Sonic textures, vocal dynamics, drum style, reference moods..."
              className="bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-lg px-3 py-2 text-white font-sans focus:outline-none text-xs resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
            >
              [Create & Route to Miles]
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

