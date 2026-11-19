import React, { useState } from 'react';
import { AgentProfile, ProjectSong } from '../types';
import { X, Send, Bot, Sparkles, Sliders, CheckCircle, ShieldAlert } from 'lucide-react';

interface AgentChatModalProps {
  agent: AgentProfile;
  projects: ProjectSong[];
  onClose: () => void;
  onOpenDaw?: (project: ProjectSong) => void;
}

export const AgentChatModal: React.FC<AgentChatModalProps> = ({
  agent,
  projects,
  onClose,
  onOpenDaw
}) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'agent'; text: string; time: string }>>([
    {
      role: 'agent',
      text: `Hello Boss. ${agent.name} here. Currently stationed at ${agent.currentRoom.replace(/_/g, ' ')}. ${agent.thoughtBubble}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const userMsg = inputText.trim();
    setInputText('');
    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        text: userMsg,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    setIsTyping(true);

    // Provide tailored replies matching the agent's persona and responsibilities
    setTimeout(() => {
      let reply = '';
      if (agent.id === 'miles') {
        reply = `Understood, CEO. I've noted: "${userMsg}". I'll factor this into our next catalog routing cycle. Remember to clear any pending gates in your Inbox so the pipeline doesn't stall.`;
      } else if (agent.id === 'nova') {
        reply = `Heard loud and clear! Tuning the synthesizer oscillators in Studio A right now. Check the Mini DAW Player to preview the 16-note motif and download the .WAV seed for Suno.`;
      } else if (agent.id === 'lyra') {
        reply = `On it! I'm weaving those themes into our next vocal arrangement with [Intro], [Chorus - Stacked Harmonies], and dynamic metatags for Suno.`;
      } else {
        reply = `Copy that, Chief. I'm aligning the DSP metadata and setting up the 14-day TikTok sound launch. We'll make sure the 60s drop time hits right on beat.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'agent',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsTyping(false);
    }, 700);
  };

  const currentProject = projects.find((p) => p.id === agent.assignedProjectId) || projects[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none font-mono">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md"
              style={{ backgroundColor: agent.accentColor }}
            >
              {agent.name.substring(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wider">{agent.name}</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {agent.role}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                Room: {agent.currentRoom.replace(/_/g, ' ')} • Completed Tasks: {agent.tasksCompleted}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close agent modal"
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Agent Bio & Status Pill */}
        <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">STATUS:</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              agent.status === 'BLOCKED BY CEO'
                ? 'bg-rose-950 text-rose-300 border border-rose-600'
                : agent.status === 'WORKING'
                ? 'bg-amber-950 text-amber-300 border border-amber-600'
                : 'bg-emerald-950 text-emerald-300 border border-emerald-600'
            }`}>
              {agent.status}
            </span>
          </div>

          {agent.id === 'nova' && onOpenDaw && currentProject && (
            <button
              onClick={() => {
                onClose();
                onOpenDaw(currentProject);
              }}
              className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 hover:bg-cyan-900 transition-all cursor-pointer"
            >
              <Sliders className="w-3 h-3" /> Open DAW
            </button>
          )}
        </div>

        {/* Chat Log */}
        <div className="flex-1 p-4 overflow-y-auto max-h-[340px] flex flex-col gap-2.5 text-xs">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col gap-1 max-w-[85%] ${
                m.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
              }`}
            >
              <div className="flex items-center gap-1.5 text-[9px] text-slate-500">
                <span>{m.role === 'user' ? 'CEO' : agent.name}</span>
                <span>•</span>
                <span>{m.time}</span>
              </div>
              <div
                className={`p-3 rounded-xl leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-cyan-600 text-white rounded-br-none'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none font-sans'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="text-[11px] text-slate-500 italic flex items-center gap-1">
              <Sparkles className="w-3 h-3 animate-spin text-cyan-400" /> {agent.name} is formulating response...
            </div>
          )}
        </div>

        {/* Direct CEO Instruction Input */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
          <input
            type="text"
            placeholder={`Issue direct instruction or question to ${agent.name}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 text-xs rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className="px-3.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold transition-all cursor-pointer flex items-center gap-1 text-xs"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
