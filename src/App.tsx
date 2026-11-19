import React, { useState, useEffect, useCallback } from 'react';
import { 
  ProjectSong, 
  AgentProfile, 
  ActivityLogItem, 
  CeoInboxItem, 
  DailyBriefing, 
  RoomId, 
  AgentId, 
  ApiStatus,
  StudioCommsMessage
} from './types';
import { 
  INITIAL_AGENTS, 
  INITIAL_PROJECTS, 
  INITIAL_INBOX, 
  INITIAL_LOGS, 
  INITIAL_BRIEFING,
  INITIAL_STUDIO_COMMS
} from './data/initialState';
import { isRealApiKey, isDemoKey } from './services/agentOrchestrator';
import { IsometricOffice } from './components/IsometricOffice';
import { CeoInbox } from './components/CeoInbox';
import { KanbanPipeline } from './components/KanbanPipeline';
import { HeartbeatController } from './components/HeartbeatController';
import { ProjectInspectorModal } from './components/ProjectInspectorModal';
import { NewProjectModal } from './components/NewProjectModal';
import { RoomModal } from './components/RoomModal';
import { AgentChatModal } from './components/AgentChatModal';
import { 
  advanceProject, 
  rejectProjectGate, 
  isCeoGate 
} from './utils/pipelineRules';
import { 
  Disc, 
  LayoutGrid, 
  Building2, 
  Sliders, 
  Inbox, 
  Activity, 
  Users, 
  Plus, 
  DollarSign, 
  Headphones, 
  ShieldAlert, 
  Sparkles,
  Layers,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Trash2,
  RotateCcw,
  Radio
} from 'lucide-react';


const STORAGE_KEYS = {
  PROJECTS: 'arcana_records_projects_v1',
  AGENTS: 'arcana_records_agents_v1',
  INBOX: 'arcana_records_inbox_v1',
  LOGS: 'arcana_records_logs_v1',
  BRIEFING: 'arcana_records_briefing_v1',
  COMMS: 'arcana_records_studio_comms_v1'
};

export default function App() {
  // --- Persistent State ---
  const [projects, setProjects] = useState<ProjectSong[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((p: ProjectSong) => {
          const seed = INITIAL_PROJECTS.find((ip) => ip.id === p.id);
          if (seed) {
            return {
              ...p,
              noteSequence: (!p.noteSequence || p.noteSequence.length < 16) ? seed.noteSequence : p.noteSequence,
              lyrics: (!p.lyrics || p.lyrics.length < 200) ? seed.lyrics : p.lyrics
            };
          }
          return p;
        });
      }
      return INITIAL_PROJECTS;
    } catch {
      return INITIAL_PROJECTS;
    }
  });

  const [agents, setAgents] = useState<AgentProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AGENTS);
      return saved ? JSON.parse(saved) : INITIAL_AGENTS;
    } catch {
      return INITIAL_AGENTS;
    }
  });

  const [inboxItems, setInboxItems] = useState<CeoInboxItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INBOX);
      return saved ? JSON.parse(saved) : INITIAL_INBOX;
    } catch {
      return INITIAL_INBOX;
    }
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
      return saved ? JSON.parse(saved) : INITIAL_LOGS;
    } catch {
      return INITIAL_LOGS;
    }
  });

  const [briefing, setBriefing] = useState<DailyBriefing>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BRIEFING);
      return saved ? JSON.parse(saved) : INITIAL_BRIEFING;
    } catch {
      return INITIAL_BRIEFING;
    }
  });

  const [studioComms, setStudioComms] = useState<StudioCommsMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COMMS);
      return saved ? JSON.parse(saved) : INITIAL_STUDIO_COMMS;
    } catch {
      return INITIAL_STUDIO_COMMS;
    }
  });

  // --- UI Controls ---
  const [mainView, setMainView] = useState<'office' | 'kanban'>('office');
  const [sidebarTab, setSidebarTab] = useState<'inbox' | 'pipeline' | 'heartbeat' | 'agents'>('inbox');
  const [isTicking, setIsTicking] = useState(false);
  const [autoTickInterval, setAutoTickInterval] = useState<number>(0); // 0 = Paused
  const [isRefreshingBriefing, setIsRefreshingBriefing] = useState(false);
  const [activeMovingAgentId, setActiveMovingAgentId] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    isLive: false,
    model: 'gemini-2.5-flash',
    error: null
  });
  const [showApiErrorTooltip, setShowApiErrorTooltip] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState<string>(() => {
    try {
      return localStorage.getItem('arcana_records_api_key_override_v1') || '';
    } catch {
      return '';
    }
  });
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyTestMessage, setKeyTestMessage] = useState<string | null>(null);

  // Initial API health & status check or re-hydrate stored key
  useEffect(() => {
    const storedKey = localStorage.getItem('arcana_records_api_key_override_v1');
    if (storedKey) {
      fetch('/api/key/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: storedKey })
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.apiStatus) {
            setApiStatus(data.apiStatus);
          }
        })
        .catch((err) => console.warn('Key auto-hydration failed:', err));
    } else {
      fetch('/api/health')
        .then((res) => res.json())
        .then((data) => {
          if (data.apiStatus) {
            setApiStatus(data.apiStatus);
          }
        })
        .catch((err) => {
          console.warn('Initial health check failed:', err);
        });
    }
  }, []);

  const handleSaveApiKeyOverride = async (keyToSave?: string) => {
    const targetKey = keyToSave !== undefined ? keyToSave : apiKeyInput;
    setIsTestingKey(true);
    setKeyTestMessage('Connecting and verifying with Gemini API...');
    try {
      const res = await fetch('/api/key/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: targetKey })
      });
      const data = await res.json();
      if (data.apiStatus) {
        setApiStatus(data.apiStatus);
      }
      if (targetKey) {
        localStorage.setItem('arcana_records_api_key_override_v1', targetKey);
        setApiKeyInput(targetKey);
      } else {
        localStorage.removeItem('arcana_records_api_key_override_v1');
        setApiKeyInput('');
      }

      if (data.isLive) {
        setKeyTestMessage(`✓ Live connection established (${data.apiStatus?.model || 'gemini-2.5-flash'})`);
      } else if (data.error) {
        setKeyTestMessage(`✗ ${data.error}`);
      } else {
        setKeyTestMessage('Key cleared. Switched to local fallback mode.');
      }
    } catch (err: any) {
      setKeyTestMessage(`✗ Network failed: ${err.message}`);
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleSwitchModel = async (newModel: 'gemini-2.5-flash' | 'gemini-2.5-pro') => {
    try {
      const res = await fetch('/api/model/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: newModel })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.apiStatus) {
          setApiStatus(data.apiStatus);
        }
      }
    } catch (err) {
      console.warn('Failed to switch model:', err);
    }
  };

  // --- Modals ---
  const [inspectingProject, setInspectingProject] = useState<ProjectSong | null>(null);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [inspectingRoom, setInspectingRoom] = useState<RoomId | null>(null);
  const [chattingAgent, setChattingAgent] = useState<AgentProfile | null>(null);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AGENTS, JSON.stringify(agents));
  }, [agents]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INBOX, JSON.stringify(inboxItems));
  }, [inboxItems]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(activityLogs));
  }, [activityLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BRIEFING, JSON.stringify(briefing));
  }, [briefing]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COMMS, JSON.stringify(studioComms));
  }, [studioComms]);

  // Derived financial & status metrics
  const totalRoyalties = projects.reduce((sum, p) => sum + (p.royaltyForecastUsd || 0), 0);
  const totalStreams = projects.reduce((sum, p) => sum + (p.simulatedStreams || 0), 0);
  const pendingGatesCount = inboxItems.filter((i) => i.status === 'PENDING').length;

  // Real state-calculated catalog counters (replacing static mock metrics)
  const inProgressCount = projects.filter((p) => p.stage !== 'RELEASED').length;
  const releasedCount = projects.filter((p) => p.stage === 'RELEASED').length;
  const seedsAndLyricsCount = projects.filter(
    (p) => (p.noteSequence && p.noteSequence.length >= 16) && (p.lyrics && p.lyrics.length >= 100)
  ).length;
  const hasDemoTracks = projects.some((p) => INITIAL_PROJECTS.some((ip) => ip.id === p.id));

  // Studio Comms Helper (for agent handoff dialogs)
  const addStudioComm = (comm: {
    fromAgentId: AgentId;
    toAgentId: AgentId | 'ceo';
    message: string;
    projectTitle?: string;
    roomFrom?: RoomId;
    roomTo?: RoomId;
  }) => {
    const newComm: StudioCommsMessage = {
      id: `comm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      ...comm
    };
    setStudioComms((prev) => [newComm, ...prev.slice(0, 49)]);
  };

  // Demo Catalog Wipe & Restore
  const handleClearDemoCatalog = () => {
    const demoIds = new Set(INITIAL_PROJECTS.map((p) => p.id));
    setProjects((prev) => prev.filter((p) => !demoIds.has(p.id)));
    setInboxItems((prev) => prev.filter((i) => !demoIds.has(i.projectId)));
    setActivityLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        agentId: 'miles',
        agentName: 'CEO EXECUTIVE ACTION',
        action: 'Cleared 4 pre-loaded demo catalog singles. Operating strictly with original creations.',
        roomId: 'ceo_office'
      },
      ...prev
    ]);
    addStudioComm({
      fromAgentId: 'miles',
      toAgentId: 'ceo',
      message: 'Demo catalog wiped clean per CEO command. All agents are ready for fresh original artist single briefs.',
      roomFrom: 'boardroom',
      roomTo: 'ceo_office'
    });
  };

  const handleRestoreDemoCatalog = () => {
    setProjects(INITIAL_PROJECTS);
    setInboxItems(INITIAL_INBOX);
    setActivityLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        agentId: 'miles',
        agentName: 'CEO EXECUTIVE ACTION',
        action: 'Restored 4 initial demo catalog singles to pipeline.',
        roomId: 'ceo_office'
      },
      ...prev
    ]);
    addStudioComm({
      fromAgentId: 'miles',
      toAgentId: 'ceo',
      message: 'Preloaded demo singles roster restored to active pipeline.',
      roomFrom: 'boardroom',
      roomTo: 'ceo_office'
    });
  };

  // --- Label Tick Execution ---
  const handleRunTick = useCallback(async () => {
    if (isTicking) return;
    setIsTicking(true);

    try {
      const res = await fetch('/api/label/tick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projects,
          agents,
          logs: activityLogs
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (data.updatedProjects) setProjects(data.updatedProjects);
          if (data.updatedAgents) {
            setAgents(data.updatedAgents);
            // Highlight moving agents
            const moving = data.updatedAgents.find((a: AgentProfile, i: number) => a.currentRoom !== agents[i]?.currentRoom);
            if (moving) {
              setActiveMovingAgentId(moving.id);
              setTimeout(() => setActiveMovingAgentId(null), 1600);
            }
          }
          if (data.newLogs && data.newLogs.length > 0) {
            setActivityLogs((prev) => [...data.newLogs, ...prev]);
          }
          if (data.apiStatus) {
            setApiStatus(data.apiStatus);
          }
          if (data.newInboxItems && data.newInboxItems.length > 0) {
            setInboxItems((prev) => {
              const existingIds = new Set(prev.map(i => `${i.projectId}-${i.gateType}`));
              const fresh = data.newInboxItems.filter((item: CeoInboxItem) => !existingIds.has(`${item.projectId}-${item.gateType}`));
              return [...fresh, ...prev];
            });

            // Log handoff to CEO gate
            const firstGate = data.newInboxItems[0];
            if (firstGate) {
              addStudioComm({
                fromAgentId: firstGate.submittedBy,
                toAgentId: 'ceo',
                projectTitle: firstGate.projectTitle,
                roomFrom: firstGate.submittedBy === 'miles' ? 'boardroom' : firstGate.submittedBy === 'nova' ? 'studio_a' : firstGate.submittedBy === 'lyra' ? 'writers_lounge' : 'marketing_desk',
                roomTo: 'ceo_office',
                message: `Work package completed for "${firstGate.projectTitle}". Escalated to ${firstGate.gateType.replace(/_/g, ' ')} for CEO sign-off.`
              });
            }
          }
        }
      }
    } catch (err) {
      console.warn('Backend tick error, running client tick fallback:', err);
      // Client-side fallback to ensure 100% deterministic testability
      handleClientSideTickFallback();
    } finally {
      setIsTicking(false);
    }
  }, [isTicking, projects, agents, activityLogs]);

  // Deterministic client fallback tick if server route is not reached
  const handleClientSideTickFallback = () => {
    for (let i = 0; i < projects.length; i++) {
      const p = projects[i];
      if (isCeoGate(p.stage)) {
        // Paused at CEO gate
        continue;
      }

      if (p.stage === '1_IDEATION') {
        const advanced = advanceProject(p);
        setProjects(prev => prev.map((item, idx) => idx === i ? advanced : item));
        setActiveMovingAgentId('miles');
        setAgents(prev => prev.map(a => a.id === 'miles' ? { ...a, currentRoom: 'ceo_office', status: 'BLOCKED BY CEO', statusMessage: `Awaiting CEO approval for "${advanced.title}"` } : a));
        setTimeout(() => setActiveMovingAgentId(null), 1600);
        addStudioComm({
          fromAgentId: 'miles',
          toAgentId: 'ceo',
          projectTitle: advanced.title,
          roomFrom: 'boardroom',
          roomTo: 'ceo_office',
          message: `Concept initialized for "${advanced.title}" (${advanced.genre}, ${advanced.targetBpm} BPM). Paused at CEO Concept Gate.`
        });
        setInboxItems(prev => [
          {
            id: `gate-${advanced.id}-2_CEO_CONCEPT_GATE-${Date.now()}`,
            projectId: advanced.id,
            projectTitle: advanced.title,
            gateType: '2_CEO_CONCEPT_GATE',
            submittedBy: 'miles',
            title: `Concept Approval: "${advanced.title}"`,
            summary: `Target BPM ${advanced.targetBpm}, Key ${advanced.musicalKey}. Concept: ${advanced.conceptNotes}`,
            createdAt: new Date().toISOString(),
            status: 'PENDING'
          },
          ...prev
        ]);
        setActivityLogs(prev => [
          {
            id: `log-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            agentId: 'miles',
            agentName: 'MILES',
            action: `Finalized concept for "${advanced.title}". Paused at CEO Concept Gate.`,
            roomId: 'ceo_office',
            projectId: advanced.id,
            projectTitle: advanced.title
          },
          ...prev
        ]);
        break;
      }
    }
  };

  // --- CEO Gate Approvals ---
  const handleApproveGate = (item: CeoInboxItem, notes?: string) => {
    // 1. Mark item approved in inbox
    setInboxItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: 'APPROVED', ceoNotes: notes } : i))
    );

    // 2. Advance the project past the gate
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === item.projectId) {
          const next = advanceProject(p, notes);
          return next;
        }
        return p;
      })
    );

    // 3. Trigger dynamic sprite walking and handoff dialogue based on gate type
    if (item.gateType === '2_CEO_CONCEPT_GATE') {
      setActiveMovingAgentId('nova');
      setAgents((prev) =>
        prev.map((a) => {
          if (a.id === 'nova') {
            return {
              ...a,
              currentRoom: 'studio_a',
              status: 'WORKING',
              statusMessage: `Synthesizing chords & 16-step seed for "${item.projectTitle}"`,
              thoughtBubble: `Dialing in Prophet-6 chords at target BPM for ${item.projectTitle}.`
            };
          }
          if (a.status === 'BLOCKED BY CEO') {
            return { ...a, status: 'IDLE' };
          }
          return a;
        })
      );
      addStudioComm({
        fromAgentId: 'miles',
        toAgentId: 'nova',
        projectTitle: item.projectTitle,
        roomFrom: 'ceo_office',
        roomTo: 'studio_a',
        message: `CEO signed off on concept for "${item.projectTitle}". Nova, spin up Studio A synths and generate the 16-step polyphonic seed.`
      });
      setTimeout(() => setActiveMovingAgentId(null), 1600);
    } else if (item.gateType === '4_CEO_MASTER_GATE') {
      setActiveMovingAgentId('vance');
      setAgents((prev) =>
        prev.map((a) => {
          if (a.id === 'vance') {
            return {
              ...a,
              currentRoom: 'marketing_desk',
              status: 'WORKING',
              statusMessage: `Drafting TuneCore metadata & 14-day campaign for "${item.projectTitle}"`,
              thoughtBubble: `Auditing UPC/ISRC and prompt generation for ${item.projectTitle}.`
            };
          }
          if (a.status === 'BLOCKED BY CEO') {
            return { ...a, status: 'IDLE' };
          }
          return a;
        })
      );
      addStudioComm({
        fromAgentId: 'lyra',
        toAgentId: 'vance',
        projectTitle: item.projectTitle,
        roomFrom: 'writers_lounge',
        roomTo: 'marketing_desk',
        message: `CEO approved Master audio and 9-section lyrics for "${item.projectTitle}". Vance, prepare the TuneCore distribution package and 14-day rollout.`
      });
      setTimeout(() => setActiveMovingAgentId(null), 1600);
    } else if (item.gateType === '6_CEO_RELEASE_GATE') {
      setActiveMovingAgentId('vance');
      setAgents((prev) =>
        prev.map((a) => {
          if (a.id === 'vance') {
            return {
              ...a,
              currentRoom: 'boardroom',
              status: 'IDLE',
              statusMessage: `Released "${item.projectTitle}" globally to DSPs.`,
              thoughtBubble: `Single dispatched to Spotify & Apple Music! Streams are climbing.`
            };
          }
          if (a.status === 'BLOCKED BY CEO') {
            return { ...a, status: 'IDLE' };
          }
          return a;
        })
      );
      addStudioComm({
        fromAgentId: 'vance',
        toAgentId: 'ceo',
        projectTitle: item.projectTitle,
        roomFrom: 'marketing_desk',
        roomTo: 'ceo_office',
        message: `Final CEO authorization verified! Dispatched "${item.projectTitle}" worldwide via TuneCore. Streams and royalties live in catalog dashboard.`
      });
      setTimeout(() => setActiveMovingAgentId(null), 1600);
    } else {
      setAgents((prev) =>
        prev.map((a) => {
          if (a.status === 'BLOCKED BY CEO') {
            return {
              ...a,
              status: 'IDLE',
              statusMessage: `CEO approved gate for "${item.projectTitle}". Resuming production.`,
              thoughtBubble: `Gate approved! Moving forward with ${item.projectTitle}.`
            };
          }
          return a;
        })
      );
    }

    // 4. Log event
    setActivityLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        agentId: 'miles',
        agentName: 'CEO EXECUTIVE ACTION',
        action: `CEO Approved Gate (${item.gateType.replace(/_/g, ' ')}) for "${item.projectTitle}". Notes: "${notes || 'Proceed'}"`,
        roomId: 'ceo_office',
        projectId: item.projectId,
        projectTitle: item.projectTitle
      },
      ...prev
    ]);

    // Update inspecting project if currently opened
    if (inspectingProject && inspectingProject.id === item.projectId) {
      setInspectingProject((prev) => prev ? advanceProject(prev, notes) : null);
    }
  };

  const handleRejectGate = (item: CeoInboxItem, notes: string) => {
    setInboxItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: 'REVISED', ceoNotes: notes } : i))
    );

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === item.projectId) {
          return rejectProjectGate(p, notes);
        }
        return p;
      })
    );

    setActivityLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        agentId: 'miles',
        agentName: 'CEO EXECUTIVE ACTION',
        action: `CEO Requested Revision on (${item.gateType.replace(/_/g, ' ')}) for "${item.projectTitle}". Feedback: "${notes}"`,
        roomId: 'ceo_office',
        projectId: item.projectId,
        projectTitle: item.projectTitle
      },
      ...prev
    ]);

    if (inspectingProject && inspectingProject.id === item.projectId) {
      setInspectingProject((prev) => prev ? rejectProjectGate(prev, notes) : null);
    }
  };

  // --- Create New Project Initiative ---
  const handleCreateNewProject = (data: Partial<ProjectSong>) => {
    const newId = `song-${Date.now()}`;
    const newProject: ProjectSong = {
      id: newId,
      title: data.title || 'Untitled Track',
      artistName: data.artistName || 'Arcana Collective',
      genre: data.genre || 'Electronic',
      stage: '1_IDEATION',
      targetBpm: data.targetBpm || 124,
      musicalKey: data.musicalKey || 'F# minor',
      conceptNotes: data.conceptNotes || 'Initial concept initiated by CEO.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setProjects((prev) => [newProject, ...prev]);
    setIsNewProjectModalOpen(false);

    setActivityLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        agentId: 'miles',
        agentName: 'MILES',
        action: `Initiated "${newProject.title}" by ${newProject.artistName} in Stage 1 (Ideation).`,
        roomId: 'boardroom',
        projectId: newId,
        projectTitle: newProject.title
      },
      ...prev
    ]);

    // Switch view to Kanban or open inspector
    setInspectingProject(newProject);
  };

  // --- Refresh Miles Briefing ---
  const handleRefreshBriefing = async () => {
    setIsRefreshingBriefing(true);
    try {
      const res = await fetch('/api/agent/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects, logs: activityLogs })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.briefing) {
          setBriefing(data.briefing);
        }
        if (data.apiStatus) {
          setApiStatus(data.apiStatus);
        }
      }
    } catch (e) {
      console.warn('Briefing refresh failed:', e);
    } finally {
      setIsRefreshingBriefing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* 1. TOP APP BAR / EXECUTIVE STATUS RIBBON */}
      <header className="h-14 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-5 flex items-center justify-between shrink-0 select-none z-30 font-mono">
        {/* Branding & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            <Disc className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-wider text-white">ARCANA RECORDS OS</h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                v2.5D AUTONOMOUS HQ
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-sans">
              Supervising Human CEO • 4 Autonomous Agents Active
            </p>
          </div>
        </div>

        {/* Global Financial & Live Gemini API Diagnostics Pill */}
        <div className="flex items-center gap-4 text-xs">
          {/* Live API Status Pill with Diagnostic Tooltip & Model Switcher */}
          {(() => {
            const isDemoSimulatorActive = Boolean(apiStatus.isDemoSimulator || isDemoKey(apiKeyInput));
            const isTrulyLiveActive = Boolean(apiStatus.isLive && !isDemoSimulatorActive);

            return (
              <div className="relative flex items-center gap-2">
                <div
                  onClick={() => setShowApiErrorTooltip(!showApiErrorTooltip)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold font-mono border transition-all cursor-pointer select-none ${
                    isTrulyLiveActive
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                      : isDemoSimulatorActive
                      ? 'bg-amber-950/90 text-amber-300 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                      : 'bg-rose-950/90 text-rose-300 border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${
                    isTrulyLiveActive
                      ? 'bg-emerald-400 animate-pulse'
                      : isDemoSimulatorActive
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-rose-500 animate-ping'
                  }`} />
                  <span>
                    {isTrulyLiveActive
                      ? `API: LIVE (${apiStatus.model})`
                      : isDemoSimulatorActive
                      ? 'API: DEMO SIMULATOR (Click to Add Real AIzaSy Key)'
                      : 'API: FALLBACK MODE (Check Error)'}
                  </span>
                  <HelpCircle className="w-3 h-3 opacity-70" />
                </div>

                {/* Quick Toggle for Model: gemini-2.5-flash <-> gemini-2.5-pro */}
                <button
                  onClick={() => handleSwitchModel(apiStatus.model === 'gemini-2.5-flash' ? 'gemini-2.5-pro' : 'gemini-2.5-flash')}
                  title="Click to toggle between gemini-2.5-flash and gemini-2.5-pro for Nova & Lyra"
                  className="text-[10px] px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-300 hover:border-cyan-500 font-mono transition-all cursor-pointer"
                >
                  ⇄ {apiStatus.model === 'gemini-2.5-flash' ? 'Switch to 2.5-Pro' : 'Switch to 2.5-Flash'}
                </button>

            {/* Diagnostic Popover with Key Override Input */}
            {showApiErrorTooltip && (
              <div className="absolute top-11 left-0 w-96 p-4 bg-slate-900/98 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl z-50 text-xs font-mono">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-300 font-bold">
                  <span>GEMINI API DIAGNOSTICS</span>
                  <div className="flex items-center gap-2">
                    <span className={apiStatus.isLive ? 'text-emerald-400 text-[10px]' : 'text-rose-400 text-[10px]'}>
                      {apiStatus.isLive ? 'CONNECTED' : 'FALLBACK ENGINE'}
                    </span>
                    <button 
                      onClick={() => setShowApiErrorTooltip(false)}
                      className="text-slate-400 hover:text-white px-1 py-0.5 text-xs rounded hover:bg-slate-800"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="mt-2.5 text-[11px] text-slate-300 font-sans leading-relaxed flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-mono uppercase text-[10px]">Target Model:</span>
                    <strong className="text-cyan-300 font-mono">{apiStatus.model}</strong>
                  </div>

                  {apiStatus.isLive ? (
                    <div className="p-2.5 bg-emerald-950/60 border border-emerald-800/80 rounded-lg text-emerald-300 text-[11px]">
                      ✓ <strong>Live Gemini API Active!</strong> Miles, Nova, Lyra, and Vance generate structured outputs directly with {apiStatus.model}.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <span className="text-rose-300 font-bold font-mono text-[10px] uppercase">Reason for Fallback:</span>
                      <p className="text-rose-200 bg-rose-950/80 p-2 rounded border border-rose-900/80 font-mono text-[10px] break-words">
                        {apiStatus.error || 'No GEMINI_API_KEY detected in environment secrets. Using local deterministic model.'}
                      </p>
                    </div>
                  )}

                  {/* 🔑 Set API Key Override Section */}
                  <div className="mt-2 pt-2.5 border-t border-slate-800 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-cyan-300 font-bold flex items-center gap-1">
                        🔑 SET API KEY OVERRIDE
                      </span>
                      <span className="text-[9px] text-slate-400">Stores in local container</span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <input
                        type="password"
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder="Paste AI Studio Key (AIzaSy... or demo-live)"
                        className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 placeholder-slate-500 font-mono text-[11px] focus:outline-none focus:border-cyan-500"
                      />
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleSaveApiKeyOverride()}
                          disabled={isTestingKey}
                          className="flex-1 px-2 py-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 font-bold text-[10px] rounded font-mono transition-all cursor-pointer"
                        >
                          {isTestingKey ? 'Testing...' : '[Save & Activate Key]'}
                        </button>
                        <button
                          onClick={() => handleSaveApiKeyOverride('demo-live-gemini-2.5-flash')}
                          disabled={isTestingKey}
                          title="Instantly activates live simulation mode with 2.5-flash"
                          className="px-2 py-1 bg-emerald-700/80 hover:bg-emerald-600 text-emerald-100 text-[10px] rounded font-mono transition-all cursor-pointer"
                        >
                          [✨ Demo Live]
                        </button>
                        {apiKeyInput && (
                          <button
                            onClick={() => handleSaveApiKeyOverride('')}
                            disabled={isTestingKey}
                            title="Clear override"
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] rounded font-mono transition-all cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    {keyTestMessage && (
                      <div className={`p-1.5 rounded text-[10px] font-mono break-words ${
                        keyTestMessage.startsWith('✓') 
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80' 
                          : 'bg-rose-950/80 text-rose-300 border border-rose-800/80'
                      }`}>
                        {keyTestMessage}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

          {/* 1. Real State Metric: Active Pipeline */}
          <div className="hidden xl:flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            <Layers className="w-4 h-4 text-cyan-400" />
            <div>
              <span className="text-[9px] text-slate-400 uppercase block leading-none">Active Pipeline</span>
              <span className="text-xs font-bold text-cyan-300">{inProgressCount} In Progress / {releasedCount} Released</span>
            </div>
          </div>

          {/* 2. Real State Metric: Seeds & Lyrics Ready */}
          <div className="hidden xl:flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            <Headphones className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-[9px] text-slate-400 uppercase block leading-none">Seeds & Lyrics Ready</span>
              <span className="text-xs font-bold text-emerald-300">{seedsAndLyricsCount} Tracks Synthesized</span>
            </div>
          </div>

          {/* 3. Real State Metric: CEO Gate Queue */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-[9px] text-slate-400 uppercase block leading-none">CEO Gate Queue</span>
              <span className="text-xs font-bold text-amber-300">{pendingGatesCount} Pending Sign-Off</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {hasDemoTracks ? (
            <button
              onClick={handleClearDemoCatalog}
              title="Clear pre-loaded demo tracks to operate exclusively with original singles"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 text-xs font-mono font-bold transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> [🗑️ Clear Demo Catalog]
            </button>
          ) : (
            <button
              onClick={handleRestoreDemoCatalog}
              title="Restore initial 4 demo singles into pipeline"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" /> [+ Restore Demo Roster]
            </button>
          )}

          <button
            onClick={() => setIsNewProjectModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" /> + New Single
          </button>

          <button
            onClick={handleRunTick}
            disabled={isTicking}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isTicking ? 'animate-spin' : ''}`} />
            {isTicking ? 'Executing Tick...' : '[Run Label Tick]'}
          </button>
        </div>
      </header>

      {/* 2. MAIN APPLICATION CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT / CENTER VIEWPORT (Isometric Office or Kanban) */}
        <main className="flex-1 flex flex-col p-4 overflow-hidden border-r border-slate-800/80">
          {/* Main View Mode Selector */}
          <div className="flex items-center justify-between pb-3 shrink-0">
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-mono">
              <button
                onClick={() => setMainView('office')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  mainView === 'office'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" /> 2.5D Isometric Office
              </button>

              <button
                onClick={() => setMainView('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  mainView === 'kanban'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> 6-Stage Catalog Kanban
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Label Engine: Live</span>
            </div>
          </div>

          {/* Viewport Display */}
          <div className="flex-1 overflow-hidden relative">
            {mainView === 'office' ? (
              <IsometricOffice
                agents={agents}
                projects={projects}
                onSelectAgent={(agent) => setChattingAgent(agent)}
                onSelectRoom={(roomId) => setInspectingRoom(roomId)}
                activeMovingAgentId={activeMovingAgentId}
                studioComms={studioComms}
              />
            ) : (
              <KanbanPipeline
                projects={projects}
                onSelectProject={(project) => setInspectingProject(project)}
                onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)}
                onClearDemoCatalog={handleClearDemoCatalog}
                onRestoreDemoCatalog={handleRestoreDemoCatalog}
              />
            )}
          </div>
        </main>

        {/* RIGHT SIDEBAR: CEO COMMAND CENTER */}
        <aside className="w-full md:w-[420px] lg:w-[480px] bg-slate-950 flex flex-col shrink-0 select-none border-l border-slate-800">
          {/* Sidebar Tabs */}
          <div className="flex items-center justify-between border-b border-slate-800 px-3 pt-3 bg-slate-950/90 font-mono text-xs">
            <button
              onClick={() => setSidebarTab('inbox')}
              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-all cursor-pointer relative ${
                sidebarTab === 'inbox'
                  ? 'border-rose-400 text-rose-300 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" /> CEO Inbox
              {pendingGatesCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {pendingGatesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setSidebarTab('pipeline')}
              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-all cursor-pointer ${
                sidebarTab === 'pipeline'
                  ? 'border-cyan-400 text-cyan-300 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Catalog
            </button>

            <button
              onClick={() => setSidebarTab('heartbeat')}
              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-all cursor-pointer ${
                sidebarTab === 'heartbeat'
                  ? 'border-amber-400 text-amber-300 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" /> Heartbeat
            </button>

            <button
              onClick={() => setSidebarTab('agents')}
              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-all cursor-pointer ${
                sidebarTab === 'agents'
                  ? 'border-emerald-400 text-emerald-300 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Agents
            </button>
          </div>

          {/* Sidebar Body */}
          <div className="flex-1 p-4 overflow-hidden">
            {sidebarTab === 'inbox' && (
              <CeoInbox
                inboxItems={inboxItems}
                briefing={briefing}
                projects={projects}
                onApproveGate={handleApproveGate}
                onRejectGate={handleRejectGate}
                onInspectProject={(project) => setInspectingProject(project)}
                onRefreshBriefing={handleRefreshBriefing}
                isRefreshingBriefing={isRefreshingBriefing}
              />
            )}

            {sidebarTab === 'pipeline' && (
              <div className="flex flex-col gap-3 h-full overflow-y-auto font-mono">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-slate-200">ACTIVE SINGLES ({projects.length})</span>
                  <button
                    onClick={() => setIsNewProjectModalOpen(true)}
                    className="text-[11px] text-cyan-400 hover:underline"
                  >
                    + Add Single
                  </button>
                </div>

                <div className="flex flex-col gap-2.5">
                  {projects.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setInspectingProject(p)}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-400 cursor-pointer transition-all flex flex-col gap-1.5"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-white line-clamp-1">{p.title}</h4>
                          <span className="text-[10px] text-slate-400 font-sans">{p.artistName}</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-300 font-mono">
                          {p.targetBpm} BPM
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-950 font-mono">
                        <span className="truncate">{p.stage.replace(/_/g, ' ')}</span>
                        {isCeoGate(p.stage) && (
                          <span className="text-rose-400 font-bold flex items-center gap-0.5">
                            <ShieldAlert className="w-2.5 h-2.5" /> Gate Paused
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sidebarTab === 'heartbeat' && (
              <HeartbeatController
                onRunTick={handleRunTick}
                isTicking={isTicking}
                activityLogs={activityLogs}
                autoTickInterval={autoTickInterval}
                onChangeAutoTickInterval={(sec) => setAutoTickInterval(sec)}
              />
            )}

            {sidebarTab === 'agents' && (
              <div className="flex flex-col gap-3 h-full overflow-y-auto font-mono">
                <div className="text-xs font-bold text-slate-200 pb-2 border-b border-slate-800">
                  AUTONOMOUS AGENT ROSTER (4)
                </div>

                <div className="flex flex-col gap-3">
                  {agents.map((ag) => (
                    <div
                      key={ag.id}
                      onClick={() => setChattingAgent(ag)}
                      className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-400 cursor-pointer transition-all flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: ag.accentColor }}
                          />
                          <span className="text-xs font-bold text-white tracking-wide">{ag.name}</span>
                          <span className="text-[10px] text-slate-400">({ag.role})</span>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                          ag.status === 'BLOCKED BY CEO'
                            ? 'bg-rose-950 text-rose-300 border border-rose-600'
                            : ag.status === 'WORKING'
                            ? 'bg-amber-950 text-amber-300 border border-amber-600'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                        }`}>
                          {ag.status}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-300 font-sans italic bg-slate-950 p-2 rounded border border-slate-800/80">
                        "{ag.thoughtBubble}"
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-950">
                        <span>Room: {ag.currentRoom.replace(/_/g, ' ')}</span>
                        <span>Completed: {ag.tasksCompleted} tasks</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* --- MODALS --- */}
      {inspectingProject && (
        <ProjectInspectorModal
          project={inspectingProject}
          onClose={() => setInspectingProject(null)}
          onApproveGate={(project, notes) => {
            const inboxItem = inboxItems.find(i => i.projectId === project.id && i.status === 'PENDING');
            if (inboxItem) {
              handleApproveGate(inboxItem, notes);
            } else {
              setProjects(prev => prev.map(p => p.id === project.id ? advanceProject(p, notes) : p));
              setInspectingProject(advanceProject(inspectingProject, notes));
            }
          }}
          onRejectGate={(project, notes) => {
            const inboxItem = inboxItems.find(i => i.projectId === project.id && i.status === 'PENDING');
            if (inboxItem) {
              handleRejectGate(inboxItem, notes);
            } else {
              setProjects(prev => prev.map(p => p.id === project.id ? rejectProjectGate(p, notes) : p));
              setInspectingProject(rejectProjectGate(inspectingProject, notes));
            }
          }}
        />
      )}

      {isNewProjectModalOpen && (
        <NewProjectModal
          onClose={() => setIsNewProjectModalOpen(false)}
          onCreate={handleCreateNewProject}
        />
      )}

      {inspectingRoom && (
        <RoomModal
          roomId={inspectingRoom}
          agents={agents}
          projects={projects}
          onClose={() => setInspectingRoom(null)}
          onOpenDaw={(project) => setInspectingProject(project)}
          onSelectAgent={(agent) => setChattingAgent(agent)}
          onOpenInbox={() => {
            setSidebarTab('inbox');
          }}
        />
      )}

      {chattingAgent && (
        <AgentChatModal
          agent={chattingAgent}
          projects={projects}
          onClose={() => setChattingAgent(null)}
          onOpenDaw={(project) => setInspectingProject(project)}
        />
      )}
    </div>
  );
}
