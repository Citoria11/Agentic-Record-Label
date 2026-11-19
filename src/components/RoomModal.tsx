import React from 'react';
import { RoomId, AgentProfile, ProjectSong } from '../types';
import { 
  X, 
  Building2, 
  Sliders, 
  Coffee, 
  TrendingUp, 
  Users, 
  Play, 
  Music, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { ROOM_COORDINATES } from './IsometricOffice';

interface RoomModalProps {
  roomId: RoomId;
  agents: AgentProfile[];
  projects: ProjectSong[];
  onClose: () => void;
  onOpenDaw: (project: ProjectSong) => void;
  onSelectAgent: (agent: AgentProfile) => void;
  onOpenInbox: () => void;
}

export const RoomModal: React.FC<RoomModalProps> = ({
  roomId,
  agents,
  projects,
  onClose,
  onOpenDaw,
  onSelectAgent,
  onOpenInbox
}) => {
  const roomInfo = ROOM_COORDINATES[roomId];
  const presentAgents = agents.filter((a) => a.currentRoom === roomId);
  const activeProjects = projects.filter((p) => p.stage !== 'RELEASED');

  const getRoomDetails = () => {
    switch (roomId) {
      case 'ceo_office':
        return {
          icon: <Building2 className="w-6 h-6 text-amber-400" />,
          accent: 'border-amber-500/40 text-amber-300',
          equipment: ['Mahogany Executive Desk', 'Gold Disc Displays', 'CEO Gate Authorization Terminal', 'Skyline Window Panes'],
          description: 'The executive command center of Arcana Records. All 3 CEO Approval Gates (Concept, Master, Release) terminate here for your final authorization.'
        };
      case 'studio_a':
        return {
          icon: <Sliders className="w-6 h-6 text-cyan-400" />,
          accent: 'border-cyan-500/40 text-cyan-300',
          equipment: ['Solid State Mixing Console', 'Prophet-6 & Moog Synthesizer Racks', 'Reel-to-Reel Tape Master Machine', 'Tone.js Interactive DAW Engine'],
          description: 'Chief audio sound lab operated by Nova. Generates 16-note synth sequences, chord progressions, and exportable .WAV seed files for Suno v4.'
        };
      case 'writers_lounge':
        return {
          icon: <Coffee className="w-6 h-6 text-fuchsia-400" />,
          accent: 'border-fuchsia-500/40 text-fuchsia-300',
          equipment: ['Vintage Velvet Sofa', 'Espresso Machine', 'Whiteboard with Metatag Rhyme Schemes', 'Acoustic Guitar & Vinyl Turntable'],
          description: 'A&R and lyric writing sanctuary run by Lyra. Employs precision structural metatags ([Intro], [Chorus - Stacked Harmonies], [Drop]) to steer AI vocalists.'
        };
      case 'marketing_desk':
        return {
          icon: <TrendingUp className="w-6 h-6 text-emerald-400" />,
          accent: 'border-emerald-500/40 text-emerald-300',
          equipment: ['Triple Ultrawide Curved Displays', 'TuneCore Direct Distro Portal', '3000x3000px Cover Art Billboard', 'TikTok Audio Virality Analytics Engine'],
          description: 'Distribution and virality command desk run by Vance. Audits title casing, generates DSP metadata sheets, and crafts 14-day TikTok/Reels campaign rollouts.'
        };
      case 'boardroom':
      default:
        return {
          icon: <Users className="w-6 h-6 text-blue-400" />,
          accent: 'border-blue-500/40 text-blue-300',
          equipment: ['Frosted Glass Conference Table', 'Wall Projector with Catalog Pipeline Velocity', 'Dry-Erase Quarterly Strategy Board', 'Water Cooler'],
          description: 'The strategy and executive sync room where Miles aligns label operations, checks streaming ROI, and plans the release calendar.'
        };
    }
  };

  const details = getRoomDetails();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none font-mono">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-slate-900 border flex items-center justify-center ${details.accent}`}>
              {details.icon}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wider">{roomInfo.name}</h3>
              <p className="text-[10px] text-slate-400 font-sans">{roomInfo.subtitle}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close room modal"
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4 text-xs">
          <p className="text-slate-300 font-sans leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
            {details.description}
          </p>

          {/* Installed Equipment */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Installed Workstation Hardware:</span>
            <div className="grid grid-cols-2 gap-2">
              {details.equipment.map((eq, i) => (
                <div key={i} className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] text-slate-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span className="truncate">{eq}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Personnel currently stationed in this room */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Agents in this Room:</span>
            {presentAgents.length === 0 ? (
              <span className="text-slate-500 text-[11px] italic bg-slate-950/60 p-2 rounded">
                Room currently unoccupied.
              </span>
            ) : (
              <div className="flex flex-col gap-1.5">
                {presentAgents.map((ag) => (
                  <div
                    key={ag.id}
                    onClick={() => {
                      onClose();
                      onSelectAgent(ag);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-400 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ag.accentColor }} />
                      <span className="font-bold text-white">{ag.name}</span>
                      <span className="text-[10px] text-slate-400 font-sans">({ag.role})</span>
                    </div>
                    <span className="text-[10px] text-cyan-400 flex items-center gap-1">
                      Inspect <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Room Specific Actions */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
            {roomId === 'studio_a' && activeProjects.length > 0 && (
              <button
                onClick={() => {
                  onClose();
                  onOpenDaw(activeProjects[0]);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" /> [Open Studio A DAW]
              </button>
            )}

            {roomId === 'ceo_office' && (
              <button
                onClick={() => {
                  onClose();
                  onOpenInbox();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5" /> [Open CEO Inbox]
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
