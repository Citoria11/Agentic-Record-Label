import React, { useState } from 'react';
import { AgentProfile, RoomId, ProjectSong, StudioCommsMessage } from '../types';
import { AgentSprite } from './AgentSprite';
import { 
  Building2, 
  Disc, 
  Sliders, 
  Coffee, 
  TrendingUp, 
  Users, 
  Sparkles, 
  Maximize2,
  Radio,
  ChevronDown,
  ChevronUp,
  Terminal,
  MessageSquareCode
} from 'lucide-react';

interface IsometricOfficeProps {
  agents: AgentProfile[];
  projects: ProjectSong[];
  onSelectAgent: (agent: AgentProfile) => void;
  onSelectRoom: (roomId: RoomId) => void;
  activeMovingAgentId?: string | null;
  studioComms?: StudioCommsMessage[];
}


// Isometric anchor coordinates for each room center (in a 1000x650 viewport)
export const ROOM_COORDINATES: Record<RoomId, { x: number; y: number; name: string; subtitle: string }> = {
  ceo_office: { 
    x: 230, 
    y: 190, 
    name: 'CEO Office', 
    subtitle: 'Executive Suite & Gate Authorization' 
  },
  studio_a: { 
    x: 770, 
    y: 200, 
    name: 'Studio A (Production)', 
    subtitle: 'Mixing Console, Synths & Tone.js DAW' 
  },
  boardroom: { 
    x: 500, 
    y: 330, 
    name: 'Boardroom', 
    subtitle: 'Executive Strategy & Pipeline Roadmaps' 
  },
  writers_lounge: { 
    x: 230, 
    y: 470, 
    name: 'Writers Lounge', 
    subtitle: 'A&R Lyricist, Toplines & Metatags' 
  },
  marketing_desk: { 
    x: 770, 
    y: 480, 
    name: 'Marketing & Distro Desk', 
    subtitle: 'TuneCore Packaging & 14-Day Rollout' 
  }
};

export const IsometricOffice: React.FC<IsometricOfficeProps> = ({
  agents,
  projects,
  onSelectAgent,
  onSelectRoom,
  activeMovingAgentId,
  studioComms = []
}) => {
  const [hoveredRoom, setHoveredRoom] = useState<RoomId | null>(null);
  const [isCommsExpanded, setIsCommsExpanded] = useState<boolean>(true);

  // Group agents by room to calculate slight offsets if multiple agents share a room
  const getAgentPosition = (agent: AgentProfile) => {

    const base = ROOM_COORDINATES[agent.currentRoom] || ROOM_COORDINATES.boardroom;
    const sameRoomAgents = agents.filter(a => a.currentRoom === agent.currentRoom);
    const indexInRoom = sameRoomAgents.findIndex(a => a.id === agent.id);

    // Apply slight staggered offset so they don't occlude each other
    const offsets = [
      { dx: 0, dy: 10 },
      { dx: -35, dy: 30 },
      { dx: 35, dy: 25 },
      { dx: 0, dy: 50 }
    ];
    const offset = offsets[indexInRoom] || { dx: 0, dy: 0 };

    return {
      x: base.x + offset.dx,
      y: base.y + offset.dy
    };
  };

  const activeProjectsCount = projects.filter(p => p.stage !== 'RELEASED').length;

  return (
    <div className="relative w-full h-[620px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl select-none">
      {/* Background Ambience / Ambient Neon Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/30 via-slate-950 to-slate-950 pointer-events-none" />

      {/* Cyberpunk Top Bar Overlay */}
      <div className="absolute top-4 left-5 z-20 flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-800 shadow-lg">
        <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-400">
          <Disc className="w-4 h-4 animate-spin text-cyan-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-mono tracking-wider text-slate-100">ARCANA RECORDS HQ</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-700 font-mono">
              2.5D ISOMETRIC
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans">
            Autonomous Label Floorplan • 4 Active AI Agents • {activeProjectsCount} Singles in Pipeline
          </p>
        </div>
      </div>

      {/* Room Quick-Navigation Pills */}
      <div className="absolute top-4 right-5 z-20 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 text-[11px] font-mono">
        {(Object.keys(ROOM_COORDINATES) as RoomId[]).map((rId) => (
          <button
            key={rId}
            onClick={() => onSelectRoom(rId)}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              hoveredRoom === rId
                ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {rId === 'ceo_office' && <Building2 className="w-3 h-3 text-amber-400" />}
            {rId === 'studio_a' && <Sliders className="w-3 h-3 text-cyan-400" />}
            {rId === 'boardroom' && <Users className="w-3 h-3 text-blue-400" />}
            {rId === 'writers_lounge' && <Coffee className="w-3 h-3 text-pink-400" />}
            {rId === 'marketing_desk' && <TrendingUp className="w-3 h-3 text-emerald-400" />}
            <span>{ROOM_COORDINATES[rId].name.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* SVG Isometric Floorplan Canvas */}
      <svg
        viewBox="0 0 1000 650"
        className="w-full h-full object-contain pointer-events-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Gradients for isometric room floors */}
          <linearGradient id="ceoFloor" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#291811" />
            <stop offset="100%" stopColor="#140a06" />
          </linearGradient>

          <linearGradient id="studioFloor" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#082f49" />
            <stop offset="100%" stopColor="#0c1929" />
          </linearGradient>

          <linearGradient id="boardroomFloor" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          <linearGradient id="writersFloor" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b0764" />
            <stop offset="100%" stopColor="#1e0538" />
          </linearGradient>

          <linearGradient id="marketingFloor" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#064e3b" />
            <stop offset="100%" stopColor="#022c22" />
          </linearGradient>

          {/* Wall gradients */}
          <linearGradient id="isoWallLeft" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
          <linearGradient id="isoWallRight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>

        {/* Global Hallway / Floor Foundation Base */}
        <path
          d="M 500 70 L 960 300 L 500 580 L 40 300 Z"
          fill="#090d16"
          stroke="#1e293b"
          strokeWidth="3"
        />

        {/* ---------------- 1. CEO OFFICE (Top Left) ---------------- */}
        <g
          onClick={() => onSelectRoom('ceo_office')}
          onMouseEnter={() => setHoveredRoom('ceo_office')}
          onMouseLeave={() => setHoveredRoom(null)}
          className="cursor-pointer transition-all duration-300 group"
        >
          {/* Floor Tile (Isometric Rhombus) */}
          <polygon
            points="230 110, 420 200, 230 290, 40 200"
            fill="url(#ceoFloor)"
            stroke={hoveredRoom === 'ceo_office' ? '#f59e0b' : '#78350f'}
            strokeWidth={hoveredRoom === 'ceo_office' ? '2.5' : '1.5'}
          />

          {/* Back Wall with Panoramic Cyberpunk Glass Skyline */}
          <polygon points="40 200, 230 110, 230 50, 40 140" fill="#140e0a" stroke="#451a03" strokeWidth="1" />
          {/* Window panes with neon skyline */}
          <polygon points="50 190, 220 110, 220 65, 50 145" fill="#080e1a" opacity="0.8" />
          <line x1="80" y1="180" x2="80" y2="125" stroke="#06b6d4" strokeWidth="3" opacity="0.4" />
          <line x1="120" y1="165" x2="120" y2="105" stroke="#f43f5e" strokeWidth="4" opacity="0.5" />
          <line x1="160" y1="145" x2="160" y2="90" stroke="#a855f7" strokeWidth="5" opacity="0.4" />

          {/* Gold Records Framed on CEO Wall */}
          <circle cx="100" cy="140" r="7" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" />
          <circle cx="100" cy="140" r="2.5" fill="#1e293b" />
          <circle cx="130" cy="125" r="7" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" />
          <circle cx="130" cy="125" r="2.5" fill="#1e293b" />

          {/* Executive Mahogany Desk */}
          <polygon points="190 200, 270 160, 290 170, 210 210" fill="#78350f" stroke="#92400e" strokeWidth="1" />
          {/* Desk shadow */}
          <polygon points="210 210, 290 170, 290 185, 210 225" fill="#451a03" />
          {/* Executive Chair */}
          <rect x="235" y="145" width="18" height="20" rx="3" fill="#1c1917" stroke="#44403c" />
          {/* CEO Terminal & Champagne bucket */}
          <rect x="230" y="170" width="10" height="7" rx="1" fill="#06b6d4" opacity="0.9" />

          {/* Room Title Plate */}
          <text x="140" y="275" fill="#fcd34d" fontSize="12" fontWeight="bold" fontFamily="monospace">
            [CEO OFFICE]
          </text>
        </g>

        {/* ---------------- 2. STUDIO A (Top Right) ---------------- */}
        <g
          onClick={() => onSelectRoom('studio_a')}
          onMouseEnter={() => setHoveredRoom('studio_a')}
          onMouseLeave={() => setHoveredRoom(null)}
          className="cursor-pointer transition-all duration-300 group"
        >
          {/* Floor Tile */}
          <polygon
            points="770 120, 960 210, 770 300, 580 210"
            fill="url(#studioFloor)"
            stroke={hoveredRoom === 'studio_a' ? '#06b6d4' : '#0369a1'}
            strokeWidth={hoveredRoom === 'studio_a' ? '2.5' : '1.5'}
          />

          {/* Back Acoustic Wall */}
          <polygon points="770 120, 960 210, 960 150, 770 60" fill="#0a192f" stroke="#075985" strokeWidth="1" />
          {/* Acoustic Foam Hexagons / Panels */}
          <line x1="800" y1="100" x2="800" y2="135" stroke="#0284c7" strokeWidth="2" strokeDasharray="3,3" />
          <line x1="830" y1="115" x2="830" y2="150" stroke="#0284c7" strokeWidth="2" strokeDasharray="3,3" />
          <line x1="860" y1="130" x2="860" y2="165" stroke="#0284c7" strokeWidth="2" strokeDasharray="3,3" />

          {/* Studio Mixing Console */}
          <polygon points="710 200, 790 160, 830 180, 750 220" fill="#0f172a" stroke="#06b6d4" strokeWidth="1.5" />
          {/* Animated VU-Meter Glow */}
          <rect x="740" y="180" width="16" height="4" fill="#10b981" />
          <rect x="760" y="175" width="16" height="4" fill="#38bdf8" />
          <rect x="780" y="170" width="14" height="4" fill="#f43f5e" />

          {/* Synthesizer Rack (Prophet-6 / Moog) */}
          <polygon points="850 170, 890 190, 890 220, 850 200" fill="#0284c7" opacity="0.6" />
          {/* Reel-to-Reel Tape Machine */}
          <circle cx="830" cy="140" r="8" fill="#e2e8f0" stroke="#0284c7" strokeWidth="1.5" />
          <circle cx="848" cy="150" r="8" fill="#e2e8f0" stroke="#0284c7" strokeWidth="1.5" />

          {/* Studio Monitors with Sound Wave Pulses */}
          <rect x="715" y="170" width="8" height="14" rx="1.5" fill="#1e293b" stroke="#38bdf8" />
          <rect x="800" y="150" width="8" height="14" rx="1.5" fill="#1e293b" stroke="#38bdf8" />

          {/* Room Title Plate */}
          <text x="690" y="285" fill="#38bdf8" fontSize="12" fontWeight="bold" fontFamily="monospace">
            [STUDIO A // AUDIO ENGINE]
          </text>
        </g>

        {/* ---------------- 3. CENTRAL BOARDROOM (Center) ---------------- */}
        <g
          onClick={() => onSelectRoom('boardroom')}
          onMouseEnter={() => setHoveredRoom('boardroom')}
          onMouseLeave={() => setHoveredRoom(null)}
          className="cursor-pointer transition-all duration-300 group"
        >
          {/* Floor Tile */}
          <polygon
            points="500 240, 680 330, 500 420, 320 330"
            fill="url(#boardroomFloor)"
            stroke={hoveredRoom === 'boardroom' ? '#60a5fa' : '#334155'}
            strokeWidth={hoveredRoom === 'boardroom' ? '2.5' : '1.5'}
          />

          {/* Glass Conference Table */}
          <polygon
            points="460 330, 540 290, 570 305, 490 345"
            fill="#38bdf8"
            fillOpacity="0.25"
            stroke="#38bdf8"
            strokeWidth="1.5"
          />

          {/* Executive Chairs around conference table */}
          <circle cx="450" cy="315" r="4" fill="#64748b" />
          <circle cx="480" cy="300" r="4" fill="#64748b" />
          <circle cx="550" cy="320" r="4" fill="#64748b" />
          <circle cx="520" cy="345" r="4" fill="#64748b" />

          {/* Wall Projector Display with "ARCANA PIPELINE" */}
          <polygon points="460 210, 540 210, 540 240, 460 240" fill="#0f172a" stroke="#60a5fa" strokeWidth="1" />
          <text x="470" y="230" fill="#93c5fd" fontSize="9" fontWeight="bold" fontFamily="monospace">
            PIPELINE
          </text>

          {/* Water Cooler */}
          <rect x="360" y="300" width="8" height="18" rx="2" fill="#93c5fd" opacity="0.7" />

          {/* Room Title Plate */}
          <text x="445" y="405" fill="#93c5fd" fontSize="12" fontWeight="bold" fontFamily="monospace">
            [BOARDROOM]
          </text>
        </g>

        {/* ---------------- 4. WRITERS LOUNGE (Bottom Left) ---------------- */}
        <g
          onClick={() => onSelectRoom('writers_lounge')}
          onMouseEnter={() => setHoveredRoom('writers_lounge')}
          onMouseLeave={() => setHoveredRoom(null)}
          className="cursor-pointer transition-all duration-300 group"
        >
          {/* Floor Tile */}
          <polygon
            points="230 380, 420 470, 230 560, 40 470"
            fill="url(#writersFloor)"
            stroke={hoveredRoom === 'writers_lounge' ? '#f43f5e' : '#881337'}
            strokeWidth={hoveredRoom === 'writers_lounge' ? '2.5' : '1.5'}
          />

          {/* Plush Velvet Couch (Purple / Rose) */}
          <polygon points="160 460, 240 420, 255 435, 175 475" fill="#831843" stroke="#f43f5e" strokeWidth="1.5" />
          {/* Couch backrest */}
          <polygon points="160 460, 240 420, 240 405, 160 445" fill="#be185d" />

          {/* Acoustic Guitar on Stand */}
          <ellipse cx="270" cy="450" rx="6" ry="10" fill="#d97706" />
          <line x1="270" y1="440" x2="270" y2="420" stroke="#78350f" strokeWidth="2" />

          {/* Espresso Machine & Coffee Mug */}
          <rect x="110" y="445" width="16" height="14" rx="2" fill="#1c1917" stroke="#fb7185" />
          <circle cx="135" cy="460" r="3" fill="#fecdd3" />

          {/* Whiteboard with Rhymes & Metatags */}
          <polygon points="80 395, 150 430, 150 475, 80 440" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1" />
          <line x1="90" y1="420" x2="135" y2="442" stroke="#e11d48" strokeWidth="1.5" />
          <line x1="95" y1="432" x2="140" y2="454" stroke="#475569" strokeWidth="1.5" />

          {/* Room Title Plate */}
          <text x="135" y="545" fill="#fb7185" fontSize="12" fontWeight="bold" fontFamily="monospace">
            [WRITERS LOUNGE]
          </text>
        </g>

        {/* ---------------- 5. MARKETING & DISTRO DESK (Bottom Right) ---------------- */}
        <g
          onClick={() => onSelectRoom('marketing_desk')}
          onMouseEnter={() => setHoveredRoom('marketing_desk')}
          onMouseLeave={() => setHoveredRoom(null)}
          className="cursor-pointer transition-all duration-300 group"
        >
          {/* Floor Tile */}
          <polygon
            points="770 390, 960 480, 770 570, 580 480"
            fill="url(#marketingFloor)"
            stroke={hoveredRoom === 'marketing_desk' ? '#10b981' : '#065f46'}
            strokeWidth={hoveredRoom === 'marketing_desk' ? '2.5' : '1.5'}
          />

          {/* Distro Multi-Monitor Workstation Desk */}
          <polygon points="710 470, 790 430, 830 450, 750 490" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
          {/* Curved Ultrawide Monitors displaying TuneCore feeds */}
          <rect x="740" y="440" width="14" height="9" rx="1" fill="#047857" stroke="#34d399" />
          <rect x="760" y="430" width="18" height="11" rx="1" fill="#10b981" stroke="#a7f3d0" />
          <rect x="785" y="420" width="14" height="9" rx="1" fill="#059669" stroke="#34d399" />

          {/* 3000x3000px Cover Art Billboard Stand */}
          <polygon points="860 430, 920 460, 920 515, 860 485" fill="#0f172a" stroke="#10b981" strokeWidth="1.5" />
          <rect x="872" y="455" width="36" height="36" fill="#10b981" opacity="0.3" />
          <text x="875" y="475" fill="#34d399" fontSize="8" fontWeight="bold" fontFamily="monospace">
            3000x3000px
          </text>

          {/* Room Title Plate */}
          <text x="680" y="555" fill="#34d399" fontSize="12" fontWeight="bold" fontFamily="monospace">
            [MARKETING // TUNECORE]
          </text>
        </g>
      </svg>

      {/* Render 4 Animated 3D-Style Agent Sprites */}
      {agents.map((agent) => {
        const coords = getAgentPosition(agent);
        const isMoving = activeMovingAgentId === agent.id;
        return (
          <AgentSprite
            key={agent.id}
            agent={agent}
            coords={coords}
            onClick={onSelectAgent}
            isMoving={isMoving}
          />
        );
      })}

      {/* Hovered Room Info Overlay (compact pill above comms) */}
      <div className={`absolute left-5 z-20 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] font-mono transition-all duration-200 ${
        isCommsExpanded ? 'bottom-[148px]' : 'bottom-11'
      }`}>
        <Sparkles className="w-3 h-3 text-cyan-400" />
        <span className="text-slate-300">
          {hoveredRoom ? (
            <>
              Inspect <strong className="text-white">{ROOM_COORDINATES[hoveredRoom].name}</strong> — {ROOM_COORDINATES[hoveredRoom].subtitle}
            </>
          ) : (
            'Click any room or agent to inspect workstations and trigger operations.'
          )}
        </span>
      </div>

      {/* Collapsible Live Studio Comms Bar (Agent-to-Agent Handoff Log) */}
      <div className="absolute bottom-0 inset-x-0 z-30 flex flex-col bg-slate-950/95 border-t border-slate-800 shadow-2xl backdrop-blur-md">
        {/* Toggle Ribbon Header */}
        <div
          onClick={() => setIsCommsExpanded(!isCommsExpanded)}
          className="h-8 px-4 flex items-center justify-between bg-slate-900/90 hover:bg-slate-900 border-b border-slate-800/80 cursor-pointer select-none transition-all"
        >
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold tracking-wider text-slate-200">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span>LIVE STUDIO COMMS // AGENT HANDOFF LOG</span>
            </div>
            <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
              {studioComms.length} EVENTS
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-400 text-[10px] font-mono hover:text-slate-200">
            <span>{isCommsExpanded ? '▼ Hide Comms' : '▲ Show Comms'}</span>
            {isCommsExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </div>
        </div>

        {/* Scrollable Dialogue List */}
        {isCommsExpanded && (
          <div className="h-32 p-2.5 overflow-y-auto flex flex-col gap-1.5 font-mono text-[11px] bg-slate-950/80">
            {studioComms.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-[10px]">
                Waiting for agent tick or CEO approval to capture live dialogue...
              </div>
            ) : (
              studioComms.slice(-6).map((comm) => {
                const getSenderBadge = (agentId: string) => {
                  switch (agentId) {
                    case 'miles':
                      return { label: 'MILES [MGR]', color: 'text-amber-400 bg-amber-950/60 border-amber-800/60' };
                    case 'nova':
                      return { label: 'NOVA [PROD]', color: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60' };
                    case 'lyra':
                      return { label: 'LYRA [A&R]', color: 'text-pink-400 bg-pink-950/60 border-pink-800/60' };
                    case 'vance':
                      return { label: 'VANCE [MKTG]', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60' };
                    default:
                      return { label: agentId.toUpperCase(), color: 'text-slate-300 bg-slate-800 border-slate-700' };
                  }
                };

                const getRecipientLabel = (toId: string) => {
                  switch (toId) {
                    case 'ceo':
                      return 'CEO OFFICE DOOR';
                    case 'nova':
                      return 'STUDIO A';
                    case 'lyra':
                      return 'WRITERS LOUNGE';
                    case 'vance':
                      return 'MARKETING DESK';
                    case 'miles':
                      return 'BOARDROOM';
                    default:
                      return toId.toUpperCase();
                  }
                };

                const sender = getSenderBadge(comm.fromAgentId);

                return (
                  <div
                    key={comm.id}
                    className="flex items-start gap-2 py-1 px-2 rounded bg-slate-900/60 border border-slate-800/60 hover:border-slate-700 transition-all"
                  >
                    <span className="text-[10px] text-slate-500 shrink-0 font-mono mt-0.5">
                      [{comm.timestamp}]
                    </span>

                    <span className={`px-1.5 py-0.2 rounded border text-[10px] font-bold shrink-0 font-mono ${sender.color}`}>
                      {sender.label}
                    </span>

                    <span className="text-slate-500 text-[10px] shrink-0 font-mono">
                      ➔ {getRecipientLabel(comm.toAgentId)}:
                    </span>

                    <span className="text-slate-200 font-sans text-[11px] flex-1 leading-tight">
                      "{comm.message}"
                    </span>

                    {comm.projectTitle && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono shrink-0">
                        {comm.projectTitle}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

