import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { 
  generateMilesBriefing, 
  pitchMilesConcept,
  runNovaProduction, 
  runLyraLyrics, 
  runVanceDistribution,
  getApiStatus,
  setAgentModel,
  getAgentModel,
  setApiKeyOverride,
  getActiveApiKey,
  verifyApiKey,
  SupportedModel
} from './src/services/agentOrchestrator';

import { ProjectSong, AgentProfile, ActivityLogItem, CeoInboxItem, AgentId } from './src/types';
import { isCeoGate, advanceProject, rejectProjectGate } from './src/utils/pipelineRules';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Auto-verify if key exists on boot
  const bootKey = getActiveApiKey();
  if (bootKey) {
    verifyApiKey(bootKey).catch((e) => console.warn('Boot key test note:', e.message));
  }

  // Health check endpoint with live API status
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'Arcana Records OS API',
      hasGeminiKey: Boolean(getActiveApiKey()),
      apiStatus: getApiStatus(),
      timestamp: new Date().toISOString()
    });
  });

  // Set / override Gemini API Key and test connection live
  app.post('/api/key/override', async (req, res) => {
    try {
      const { apiKey } = req.body;
      if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
        setApiKeyOverride(null);
        return res.json({ success: true, apiStatus: getApiStatus() });
      }

      const trimmedKey = apiKey.trim();
      setApiKeyOverride(trimmedKey);

      // Persist to .env if writable so server restarts retain the key
      try {
        const envPath = path.join(process.cwd(), '.env');
        fs.writeFileSync(envPath, `GEMINI_API_KEY="${trimmedKey}"\nAPI_KEY="${trimmedKey}"\n`, 'utf8');
      } catch (err) {
        console.warn('Could not write .env file:', err);
      }

      const verification = await verifyApiKey(trimmedKey);
      res.json({
        success: verification.success,
        isLive: verification.isLive,
        error: verification.error,
        apiStatus: getApiStatus()
      });
    } catch (err: any) {
      console.error('Error in /api/key/override:', err);
      res.status(500).json({ error: err.message, apiStatus: getApiStatus() });
    }
  });

  // Switch active Gemini model (gemini-2.5-flash <-> gemini-2.5-pro)
  app.post('/api/model/switch', (req, res) => {
    const { model } = req.body;
    if (model === 'gemini-2.5-flash' || model === 'gemini-2.5-pro') {
      setAgentModel(model as SupportedModel);
      res.json({ success: true, apiStatus: getApiStatus() });
    } else {
      res.status(400).json({ error: 'Invalid model. Use gemini-2.5-flash or gemini-2.5-pro' });
    }
  });


  // Miles Morning Briefing
  app.post('/api/agent/briefing', async (req, res) => {
    try {
      const { projects = [], logs = [] } = req.body;
      const briefing = await generateMilesBriefing(projects, logs);
      res.json({ success: true, briefing, apiStatus: getApiStatus() });
    } catch (err: any) {
      console.error('Error in /api/agent/briefing:', err);
      res.status(500).json({ error: err.message || 'Briefing generation failed', apiStatus: getApiStatus() });
    }
  });

  // Miles Pitches Concept for New Single
  app.post('/api/agent/miles/pitch', async (req, res) => {
    try {
      const { genre, vocalLanguage } = req.body;
      const pitch = await pitchMilesConcept(genre, vocalLanguage);
      res.json({ success: true, pitch, apiStatus: getApiStatus() });
    } catch (err: any) {
      console.error('Error in /api/agent/miles/pitch:', err);
      res.status(500).json({ error: err.message || 'Miles pitch failed', apiStatus: getApiStatus() });
    }
  });


  // Nova Music Production
  app.post('/api/agent/nova/produce', async (req, res) => {
    try {
      const { project } = req.body;
      if (!project) {
        return res.status(400).json({ error: 'project is required' });
      }
      const result = await runNovaProduction(project);
      res.json({ success: true, ...result, apiStatus: getApiStatus() });
    } catch (err: any) {
      console.error('Error in /api/agent/nova/produce:', err);
      res.status(500).json({ error: err.message || 'Production failed', apiStatus: getApiStatus() });
    }
  });

  // Lyra Lyricist
  app.post('/api/agent/lyra/lyrics', async (req, res) => {
    try {
      const { project, novaData } = req.body;
      if (!project || !novaData) {
        return res.status(400).json({ error: 'project and novaData are required' });
      }
      const result = await runLyraLyrics(project, novaData);
      res.json({ success: true, ...result, apiStatus: getApiStatus() });
    } catch (err: any) {
      console.error('Error in /api/agent/lyra/lyrics:', err);
      res.status(500).json({ error: err.message || 'Lyrics generation failed', apiStatus: getApiStatus() });
    }
  });

  // Vance TuneCore Distribution
  app.post('/api/agent/vance/distro', async (req, res) => {
    try {
      const { project } = req.body;
      if (!project) {
        return res.status(400).json({ error: 'project is required' });
      }
      const result = await runVanceDistribution(project);
      res.json({ success: true, ...result, apiStatus: getApiStatus() });
    } catch (err: any) {
      console.error('Error in /api/agent/vance/distro:', err);
      res.status(500).json({ error: err.message || 'Distribution package failed', apiStatus: getApiStatus() });
    }
  });

  // Label Tick Heartbeat (Orchestrator across all active projects and agents)
  app.post('/api/label/tick', async (req, res) => {
    try {
      const { projects = [], agents = [], logs = [] } = req.body;
      let updatedProjects: ProjectSong[] = [...projects];
      let updatedAgents: AgentProfile[] = [...agents];
      let newLogs: ActivityLogItem[] = [];
      let newInboxItems: CeoInboxItem[] = [];

      // Check if there is an active project that can be worked on
      let workedOnAny = false;

      for (let i = 0; i < updatedProjects.length; i++) {
        let p = { ...updatedProjects[i] };

        // 1. If currently at a CEO Gate, agents are BLOCKED
        if (isCeoGate(p.stage)) {
          // Verify an inbox item exists for it
          newInboxItems.push({
            id: `gate-${p.id}-${p.stage}-${Date.now()}`,
            projectId: p.id,
            projectTitle: p.title,
            gateType: p.stage as any,
            submittedBy: p.stage === '2_CEO_CONCEPT_GATE' ? 'miles' : p.stage === '4_CEO_MASTER_GATE' ? 'nova' : 'vance',
            title: `Gate Review: ${p.stage.replace(/_/g, ' ')}`,
            summary: `Project "${p.title}" has reached a mandatory CEO decision gate. Autonomous progress is paused until approved.`,
            createdAt: new Date().toISOString(),
            status: 'PENDING'
          });

          // Set Miles or responsible agent to BLOCKED BY CEO
          updatedAgents = updatedAgents.map(a => {
            if (a.id === 'miles' || (p.stage === '4_CEO_MASTER_GATE' && a.id === 'nova') || (p.stage === '6_CEO_RELEASE_GATE' && a.id === 'vance')) {
              return {
                ...a,
                status: 'BLOCKED BY CEO' as const,
                statusMessage: `Awaiting CEO approval for "${p.title}"`,
                thoughtBubble: `Paused at ${p.stage}. Waiting for boss's greenlight...`
              };
            }
            return a;
          });
          continue;
        }

        // 2. If at 1_IDEATION -> Miles finishes ideation concept, advances to 2_CEO_CONCEPT_GATE
        if (p.stage === '1_IDEATION') {
          workedOnAny = true;
          // Miles working in Boardroom
          p = advanceProject(p); // Now at 2_CEO_CONCEPT_GATE!
          updatedProjects[i] = p;

          updatedAgents = updatedAgents.map(a => {
            if (a.id === 'miles') {
              return {
                ...a,
                currentRoom: 'ceo_office' as const,
                status: 'BLOCKED BY CEO' as const,
                statusMessage: `Submitted concept for "${p.title}" to CEO Inbox`,
                thoughtBubble: `Concept finalized. Waiting for CEO approval before booking Studio A.`,
                tasksCompleted: a.tasksCompleted + 1
              };
            }
            return a;
          });

          newLogs.push({
            id: `log-${Date.now()}-1`,
            timestamp: new Date().toLocaleTimeString(),
            agentId: 'miles',
            agentName: 'Miles (Label Manager)',
            action: `Finalized concept for "${p.title}" and placed in CEO Concept Gate.`,
            roomId: 'ceo_office',
            projectId: p.id,
            projectTitle: p.title
          });

          newInboxItems.push({
            id: `gate-${p.id}-2_CEO_CONCEPT_GATE-${Date.now()}`,
            projectId: p.id,
            projectTitle: p.title,
            gateType: '2_CEO_CONCEPT_GATE',
            submittedBy: 'miles',
            title: `Concept Approval: "${p.title}"`,
            summary: `Target BPM ${p.targetBpm}, Key ${p.musicalKey}. Concept: ${p.conceptNotes}`,
            createdAt: new Date().toISOString(),
            status: 'PENDING'
          });
          break; // Process one major transition per tick to keep animations clear
        }

        // 3. If at 3_PRODUCTION_AND_LYRICS -> Nova produces music & Lyra writes lyrics!
        if (p.stage === '3_PRODUCTION_AND_LYRICS') {
          workedOnAny = true;
          // Step 1: Nova produces audio seed and Suno card
          const novaResult = await runNovaProduction(p);
          p.sunoCard = novaResult.sunoCard;
          p.noteSequence = novaResult.noteSequence;
          p.chordProgression = novaResult.chords;

          // Step 2: Lyra writes lyrics
          const lyraResult = await runLyraLyrics(p, {
            bpm: novaResult.sunoCard.bpm,
            key: novaResult.sunoCard.key,
            chords: novaResult.chords
          });
          p.lyrics = lyraResult.lyrics;
          p.lyricStructureNotes = lyraResult.lyricStructureNotes;

          // Advance to 4_CEO_MASTER_GATE!
          p = advanceProject(p);
          updatedProjects[i] = p;

          updatedAgents = updatedAgents.map(a => {
            if (a.id === 'nova') {
              return {
                ...a,
                currentRoom: 'studio_a' as const,
                status: 'BLOCKED BY CEO' as const,
                statusMessage: `Master audio seed generated for "${p.title}"`,
                thoughtBubble: `Prophet synth patches rendered! Download the WAV seed for Suno.`,
                tasksCompleted: a.tasksCompleted + 1
              };
            }
            if (a.id === 'lyra') {
              return {
                ...a,
                currentRoom: 'writers_lounge' as const,
                status: 'BLOCKED BY CEO' as const,
                statusMessage: `Lyrics and metatags complete for "${p.title}"`,
                thoughtBubble: `Wrote anthemic choruses with stacked vocal metatags for Suno.`,
                tasksCompleted: a.tasksCompleted + 1
              };
            }
            return a;
          });

          newLogs.push({
            id: `log-${Date.now()}-2`,
            timestamp: new Date().toLocaleTimeString(),
            agentId: 'nova',
            agentName: 'Nova (Audio Architect)',
            action: `Generated Suno v4 card & synthesized 16-note audio seed in Studio A for "${p.title}".`,
            roomId: 'studio_a',
            projectId: p.id,
            projectTitle: p.title
          });

          newLogs.push({
            id: `log-${Date.now()}-3`,
            timestamp: new Date().toLocaleTimeString(),
            agentId: 'lyra',
            agentName: 'Lyra (A&R Lyricist)',
            action: `Completed song lyrics with Suno vocal metatags for "${p.title}". Advanced to CEO Master Gate.`,
            roomId: 'writers_lounge',
            projectId: p.id,
            projectTitle: p.title
          });

          newInboxItems.push({
            id: `gate-${p.id}-4_CEO_MASTER_GATE-${Date.now()}`,
            projectId: p.id,
            projectTitle: p.title,
            gateType: '4_CEO_MASTER_GATE',
            submittedBy: 'nova',
            title: `Master & Lyric Approval: "${p.title}"`,
            summary: `Nova's Suno v4 card + Audio Seed WAV and Lyra's lyric structure are complete. Need CEO sign-off on production.`,
            createdAt: new Date().toISOString(),
            status: 'PENDING'
          });
          break;
        }

        // 4. If at 5_TUNECORE_AND_MARKETING -> Vance generates TuneCore distribution & rollout!
        if (p.stage === '5_TUNECORE_AND_MARKETING') {
          workedOnAny = true;
          const vanceResult = await runVanceDistribution(p);
          p.tuneCorePackage = vanceResult.tuneCorePackage;
          p.royaltyForecastUsd = Math.floor(12000 + Math.random() * 28000);
          p.simulatedStreams = Math.floor(150000 + Math.random() * 650000);

          // Advance to 6_CEO_RELEASE_GATE
          p = advanceProject(p);
          updatedProjects[i] = p;

          updatedAgents = updatedAgents.map(a => {
            if (a.id === 'vance') {
              return {
                ...a,
                currentRoom: 'marketing_desk' as const,
                status: 'BLOCKED BY CEO' as const,
                statusMessage: `TuneCore package & 14-day campaign ready for "${p.title}"`,
                thoughtBubble: `Metadata audited. 3000x3000 cover art prompt generated. Awaiting release gate.`,
                tasksCompleted: a.tasksCompleted + 1
              };
            }
            return a;
          });

          newLogs.push({
            id: `log-${Date.now()}-4`,
            timestamp: new Date().toLocaleTimeString(),
            agentId: 'vance',
            agentName: 'Vance (TuneCore & Marketing)',
            action: `Compiled TuneCore distribution sheet, 14-day video rollout, and 3000x3000 art prompt for "${p.title}".`,
            roomId: 'marketing_desk',
            projectId: p.id,
            projectTitle: p.title
          });

          newInboxItems.push({
            id: `gate-${p.id}-6_CEO_RELEASE_GATE-${Date.now()}`,
            projectId: p.id,
            projectTitle: p.title,
            gateType: '6_CEO_RELEASE_GATE',
            submittedBy: 'vance',
            title: `Global Release Approval: "${p.title}"`,
            summary: `TuneCore DSP metadata package ready. 14-day social rollout mapped. Final CEO release authorization required.`,
            createdAt: new Date().toISOString(),
            status: 'PENDING'
          });
          break;
        }
      }

      if (!workedOnAny) {
        // Routine check or agents idle/walking
        newLogs.push({
          id: `log-${Date.now()}-idle`,
          timestamp: new Date().toLocaleTimeString(),
          agentId: 'miles',
          agentName: 'Miles (Label Manager)',
          action: 'Catalog sweep complete. All active projects in review or awaiting CEO decisions.',
          roomId: 'boardroom'
        });
      }

      res.json({
        success: true,
        updatedProjects,
        updatedAgents,
        newLogs,
        newInboxItems,
        apiStatus: getApiStatus()
      });
    } catch (err: any) {
      console.error('Error in /api/label/tick:', err);
      res.status(500).json({ error: err.message || 'Tick processing failed', apiStatus: getApiStatus() });
    }
  });

  // Mount Vite or static
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Arcana Records OS Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
