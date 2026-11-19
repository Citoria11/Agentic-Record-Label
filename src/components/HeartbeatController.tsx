import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Play, 
  Pause, 
  RotateCw, 
  Activity, 
  AlertTriangle, 
  Clock, 
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';
import { ActivityLogItem } from '../types';

interface HeartbeatControllerProps {
  onRunTick: () => void;
  isTicking: boolean;
  activityLogs: ActivityLogItem[];
  autoTickInterval: number; // in seconds, 0 = paused
  onChangeAutoTickInterval: (seconds: number) => void;
}

export const HeartbeatController: React.FC<HeartbeatControllerProps> = ({
  onRunTick,
  isTicking,
  activityLogs,
  autoTickInterval,
  onChangeAutoTickInterval
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(autoTickInterval);

  useEffect(() => {
    setSecondsRemaining(autoTickInterval);
    if (autoTickInterval === 0) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          onRunTick();
          return autoTickInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoTickInterval, onRunTick]);

  const tickOptions = [
    { label: 'Paused', value: 0 },
    { label: 'Demo (8s)', value: 8 },
    { label: '30s Cadence', value: 30 },
    { label: '5m Standard', value: 300 },
    { label: '1h Production', value: 3600 }
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-4 font-mono">
      {/* Header & Heartbeat Pulse */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Heart className={`w-5 h-5 text-rose-500 fill-rose-500 ${isTicking ? 'animate-ping' : ''}`} />
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500 absolute top-0 left-0" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white tracking-wider">LABEL HEARTBEAT CONTROLLER</h4>
            <span className="text-[10px] text-slate-400 font-sans">
              Autonomous multi-agent loop orchestrator
            </span>
          </div>
        </div>

        {autoTickInterval > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] text-cyan-400">
            <Clock className="w-3 h-3 animate-spin" />
            <span>Next tick in: <strong>{secondsRemaining}s</strong></span>
          </div>
        )}
      </div>

      {/* Manual Trigger & Interval Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Manual Tick Button */}
        <button
          onClick={onRunTick}
          disabled={isTicking}
          aria-label="Run Label Tick"
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs tracking-wider transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
        >
          {isTicking ? (
            <>
              <RotateCw className="w-4 h-4 animate-spin" /> RUNNING LABEL TICK...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" /> [RUN LABEL TICK NOW]
            </>
          )}
        </button>

        {/* Auto-Tick Mode Dropdown */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 pl-2">AUTO-TICK:</span>
          <select
            value={autoTickInterval}
            onChange={(e) => onChangeAutoTickInterval(Number(e.target.value))}
            className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            {tickOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cost Safety Notice */}
      <div className="flex items-center gap-2 text-[10px] text-slate-400 bg-slate-950/70 p-2 rounded border border-slate-800/80 font-sans">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>
          Cost-guard active: Auto-Tick halts whenever a project reaches a CEO Gate (Concept, Master, Release).
        </span>
      </div>

      {/* Live Activity Log Stream */}
      <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-800">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1 text-slate-300">
            <Activity className="w-3.5 h-3.5 text-cyan-400" /> LIVE AGENT ACTIVITY STREAM
          </span>
          <span className="text-[10px] text-slate-500">{activityLogs.length} events logged</span>
        </div>

        <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
          {activityLogs.slice(0, 8).map((log) => (
            <div
              key={log.id}
              className="p-2 rounded bg-slate-950/80 border border-slate-800/70 text-[11px] flex flex-col gap-0.5 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-cyan-300">{log.agentName}</span>
                <span className="text-slate-500">{log.timestamp}</span>
              </div>
              <p className="text-slate-300 font-sans text-xs">{log.action}</p>
              {log.projectTitle && (
                <span className="text-[9px] text-slate-500 font-mono">
                  Target: {log.projectTitle} • Room: {log.roomId}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
