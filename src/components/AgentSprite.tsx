import React, { useState } from 'react';
import { AgentProfile, RoomId } from '../types';
import { ShieldAlert, Activity, CheckCircle, MessageSquare } from 'lucide-react';

interface AgentSpriteProps {
  agent: AgentProfile;
  coords: { x: number; y: number };
  onClick?: (agent: AgentProfile) => void;
  isMoving?: boolean;
}

export const AgentSprite: React.FC<AgentSpriteProps> = ({ agent, coords, onClick, isMoving }) => {
  const [showThought, setShowThought] = useState(true);

  // Distinct sprite design elements per agent
  const getAgentVisual = () => {
    switch (agent.id) {
      case 'miles':
        return {
          headColor: '#fcd34d',
          hairColor: '#1e293b',
          suitColor: '#0f172a',
          accentColor: '#f59e0b',
          accessory: 'clipboard',
          label: 'MGR'
        };
      case 'nova':
        return {
          headColor: '#fed7aa',
          hairColor: '#06b6d4',
          suitColor: '#1e1b4b',
          accentColor: '#38bdf8',
          accessory: 'headphones',
          label: 'PROD'
        };
      case 'lyra':
        return {
          headColor: '#fecdd3',
          hairColor: '#ec4899',
          suitColor: '#4a044e',
          accentColor: '#f43f5e',
          accessory: 'mic',
          label: 'A&R'
        };
      case 'vance':
      default:
        return {
          headColor: '#e2e8f0',
          hairColor: '#10b981',
          suitColor: '#064e3b',
          accentColor: '#34d399',
          accessory: 'phone',
          label: 'MKTG'
        };
    }
  };

  const visual = getAgentVisual();

  const getStatusBadge = () => {
    if (agent.status === 'BLOCKED BY CEO') {
      return (
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-950/90 text-rose-300 border border-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse">
          <ShieldAlert className="w-2.5 h-2.5" /> BLOCKED BY CEO
        </span>
      );
    }
    if (agent.status === 'WORKING') {
      return (
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950/90 text-amber-300 border border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]">
          <Activity className="w-2.5 h-2.5 animate-spin" /> WORKING
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-600/40">
        <CheckCircle className="w-2.5 h-2.5" /> IDLE
      </span>
    );
  };

  return (
    <div
      onClick={() => onClick && onClick(agent)}
      style={{
        left: `${coords.x}px`,
        top: `${coords.y}px`,
        transform: 'translate(-50%, -100%)',
        transition: 'left 1.2s cubic-bezier(0.34, 1.56, 0.64, 1), top 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}
      className="absolute cursor-pointer z-30 group select-none pointer-events-auto"
    >
      {/* Speech Thought Bubble */}
      {showThought && agent.thoughtBubble && (
        <div className="absolute bottom-[92px] left-1/2 -translate-x-1/2 w-48 max-w-[200px] bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-lg p-2 shadow-xl pointer-events-none transition-all group-hover:scale-105 group-hover:border-cyan-400">
          <div className="text-[10px] text-slate-300 font-sans leading-tight line-clamp-2">
            "{agent.thoughtBubble}"
          </div>
          {/* Speech bubble beak */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-slate-900 border-r border-b border-slate-700 rotate-45" />
        </div>
      )}

      {/* Floating Nameplate & Status Badge */}
      <div className="flex flex-col items-center gap-1 mb-1">
        <div className="flex items-center gap-1.5 bg-slate-950/90 px-2 py-0.5 rounded-full border border-slate-700 shadow-md">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: visual.accentColor }} />
          <span className="text-xs font-bold text-white tracking-wide font-mono">{agent.name}</span>
          <span className="text-[9px] text-slate-400 font-mono">[{visual.label}]</span>
        </div>
        {getStatusBadge()}
      </div>

      {/* 3D-Style Voxel/Pixel Character Avatar */}
      <div className={`relative w-12 h-16 mx-auto ${isMoving ? 'animate-bounce' : 'hover:-translate-y-1 transition-transform'}`}>
        <svg viewBox="0 0 48 64" className="w-full h-full drop-shadow-[0_8px_8px_rgba(0,0,0,0.6)]">
          {/* Drop shadow on isometric floor */}
          <ellipse cx="24" cy="60" rx="16" ry="4" fill="rgba(0,0,0,0.5)" />

          {/* Legs with walking animation if moving */}
          <rect x="18" y="44" width="5" height="14" rx="2" fill="#0f172a" />
          <rect x="25" y="44" width="5" height="14" rx="2" fill="#1e293b" />
          {/* Shoes */}
          <rect x="16" y="55" width="7" height="4" rx="1.5" fill={visual.accentColor} />
          <rect x="25" y="55" width="7" height="4" rx="1.5" fill={visual.accentColor} />

          {/* Torso / Jacket */}
          <rect x="14" y="24" width="20" height="22" rx="3" fill={visual.suitColor} />
          {/* Inner shirt or tie */}
          <rect x="22" y="24" width="4" height="12" fill={visual.accentColor} />

          {/* Arms */}
          <rect x="10" y="26" width="5" height="15" rx="2" fill={visual.suitColor} />
          <rect x="33" y="26" width="5" height="15" rx="2" fill={visual.suitColor} />
          {/* Hands */}
          <circle cx="12" cy="42" r="2.5" fill={visual.headColor} />
          <circle cx="35" cy="42" r="2.5" fill={visual.headColor} />

          {/* Head */}
          <rect x="16" y="10" width="16" height="15" rx="3" fill={visual.headColor} />
          {/* Hair */}
          <path
            d="M 15 13 Q 24 5 33 13 L 33 11 Q 24 7 15 11 Z"
            fill={visual.hairColor}
          />
          <rect x="15" y="8" width="18" height="6" rx="2" fill={visual.hairColor} />

          {/* Eyes */}
          <rect x="19" y="15" width="3" height="3" rx="0.5" fill="#0f172a" />
          <rect x="26" y="15" width="3" height="3" rx="0.5" fill="#0f172a" />

          {/* Agent-specific accessories */}
          {visual.accessory === 'headphones' && (
            <path
              d="M 13 14 A 12 12 0 0 1 35 14"
              stroke="#06b6d4"
              strokeWidth="3"
              fill="none"
            />
          )}
          {visual.accessory === 'headphones' && (
            <>
              <rect x="12" y="14" width="3" height="6" rx="1" fill="#06b6d4" />
              <rect x="33" y="14" width="3" height="6" rx="1" fill="#06b6d4" />
            </>
          )}

          {visual.accessory === 'clipboard' && (
            <rect x="31" y="34" width="8" height="10" rx="1" fill="#f59e0b" />
          )}

          {visual.accessory === 'phone' && (
            <rect x="32" y="32" width="6" height="10" rx="1" fill="#10b981" />
          )}
        </svg>
      </div>
    </div>
  );
};
