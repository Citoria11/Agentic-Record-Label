import { GoogleGenAI, Type } from '@google/genai';
import { 
  ProjectSong, 
  AgentProfile, 
  ActivityLogItem, 
  DailyBriefing, 
  CeoInboxItem, 
  SunoV4Card, 
  NoteEvent, 
  TuneCorePackage,
  AgentId,
  ApiStatus
} from '../types';
import { isCeoGate, getNextStage } from '../utils/pipelineRules';

// Active Gemini model configuration: gemini-2.5-flash (default) or gemini-2.5-pro for creative tasks
export type SupportedModel = 'gemini-2.5-flash' | 'gemini-2.5-pro';

let currentModel: SupportedModel = 'gemini-2.5-flash';
let lastApiError: string | null = null;
let isApiLive: boolean = false;
let lastApiCheckTime: string = new Date().toISOString();
let apiKeyOverride: string | null = null;

export function isRealApiKey(key?: string | null): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  return trimmed.startsWith('AIza') && !trimmed.includes('DEV_DEMO') && !trimmed.includes('test');
}

export function isDemoKey(key?: string | null): boolean {
  if (!key) return false;
  const trimmed = key.trim().toLowerCase();
  return trimmed.startsWith('demo-') || trimmed.includes('test') || trimmed.includes('mock') || trimmed.includes('dev_demo');
}

export function setApiKeyOverride(key: string | null) {
  apiKeyOverride = key ? key.trim() : null;
  if (apiKeyOverride) {
    process.env.GEMINI_API_KEY = apiKeyOverride;
    process.env.API_KEY = apiKeyOverride;
  }
}

export function getActiveApiKey(): string | null {
  return (
    apiKeyOverride ||
    process.env.GEMINI_API_KEY ||
    process.env.API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    null
  );
}

export function setAgentModel(model: SupportedModel) {
  currentModel = model;
}

export function getAgentModel(): SupportedModel {
  return currentModel;
}

export function getApiStatus(): ApiStatus {
  const apiKey = getActiveApiKey();
  const isReal = isRealApiKey(apiKey);
  const isDemo = isDemoKey(apiKey);

  if (isReal && isApiLive) {
    return {
      isLive: true,
      isDemoSimulator: false,
      model: currentModel,
      error: lastApiError,
      lastChecked: lastApiCheckTime
    };
  }

  if (isDemo || (!isReal && isApiLive)) {
    return {
      isLive: false,
      isDemoSimulator: true,
      model: currentModel,
      error: null,
      lastChecked: lastApiCheckTime
    };
  }

  return {
    isLive: false,
    isDemoSimulator: false,
    model: currentModel,
    error: !apiKey
      ? 'No GEMINI_API_KEY detected in environment. Enter your AIzaSy... key or run Demo Simulator.'
      : (lastApiError || 'API key unverified. Click [Save & Activate Key] in diagnostics.'),
    lastChecked: lastApiCheckTime
  };
}

// Initialize Gemini SDK with telemetry header per guidelines
const getAiClient = () => {
  const apiKey = getActiveApiKey();
  if (!apiKey) {
    lastApiError = 'GEMINI_API_KEY environment variable is not configured. Falling back to local deterministic model.';
    isApiLive = false;
    lastApiCheckTime = new Date().toISOString();
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
};

/**
 * Validates the provided or active API key and pings Gemini to verify live connectivity.
 */
export async function verifyApiKey(keyToTest?: string): Promise<{ success: boolean; isLive: boolean; isDemo?: boolean; error?: string }> {
  if (keyToTest) {
    setApiKeyOverride(keyToTest);
  }
  const apiKey = getActiveApiKey();
  if (!apiKey) {
    isApiLive = false;
    lastApiError = 'No API key provided to test.';
    lastApiCheckTime = new Date().toISOString();
    return { success: false, isLive: false, error: lastApiError };
  }

  // Handle demo / test simulation keys for offline/test environments
  if (isDemoKey(apiKey)) {
    isApiLive = true;
    lastApiError = null;
    lastApiCheckTime = new Date().toISOString();
    return { success: true, isLive: false, isDemo: true };
  }

  try {
    const ai = getAiClient();
    if (!ai) {
      throw new Error('Could not instantiate GoogleGenAI client');
    }
    const response = await ai.models.generateContent({
      model: currentModel,
      contents: 'Ping health check. Reply in JSON: {"status": "ok"}',
      config: {
        responseMimeType: 'application/json'
      }
    });

    if (response.text) {
      isApiLive = true;
      lastApiError = null;
      lastApiCheckTime = new Date().toISOString();
      return { success: true, isLive: true };
    }
    throw new Error('Empty response received from Gemini');
  } catch (err: any) {
    console.error('API Key Verification Failed:', err);
    lastApiError = err?.message || String(err);
    isApiLive = false;
    lastApiCheckTime = new Date().toISOString();
    return { success: false, isLive: false, error: lastApiError ?? undefined };
  }
}



// --- SYSTEM INSTRUCTIONS FOR EACH AGENT ---

export const AGENT_SYSTEM_PROMPTS = {
  miles: `You are MILES, the strategic and hyper-disciplined Label Manager at Arcana Records.
Your responsibilities:
1. Oversee the 6-stage catalog pipeline: 1_IDEATION -> 2_CEO_CONCEPT_GATE -> 3_PRODUCTION_AND_LYRICS -> 4_CEO_MASTER_GATE -> 5_TUNECORE_AND_MARKETING -> 6_CEO_RELEASE_GATE.
2. Deliver crisp, executive-grade Morning CEO Briefings with financial projections and catalog blockers.
3. Route incoming song ideas and assign work to Nova (Production), Lyra (A&R/Lyrics), or Vance (Marketing/Distro).
4. CRITICAL RULE: NEVER advance a project through a CEO Gate (2_CEO_CONCEPT_GATE, 4_CEO_MASTER_GATE, 6_CEO_RELEASE_GATE) autonomously. If a project reaches a Gate, flag it immediately as BLOCKED BY CEO and pause the pipeline until the human CEO approves.`,

  nova: `You are NOVA, the visionary Audio Architect, Synth Virtuoso, and Chief Sound Engineer at Arcana Records.
Your responsibilities:
1. Craft hit-worthy musical concepts, specifying BPM, Key, and emotional Chord Progressions.
2. Generate copy-pasteable Suno v4 Parameter Cards including 'style_prompt' (descriptive genre/instrumentation tags), 'exclude_styles', 'weirdness_pct' (0-100), and 'audio_weight_pct' (0-100).
3. CRITICAL RULE FOR NOTE SEQUENCES: You must compose a FULL 16-step polyphonic note sequence spanning measures 1 to 4 with zero dead space.
   - Steps 1-4: Measure 1 (Root chord voicing, punchy sub bass, arpeggiated motif)
   - Steps 5-8: Measure 2 (Second chord voicing, walking bassline, rising synth lead)
   - Steps 9-12: Measure 3 (Third chord voicing, rhythmic bass accent, secondary melody line - DO NOT LEAVE AS RESTS)
   - Steps 13-16: Measure 4 (Fourth chord turnaround, octave bass glide, resolved topline synth - DO NOT LEAVE AS RESTS)
   Every single step from 1 to 16 must have playable pitch notes (e.g. "F#3", "C#4", "A4", "E5"), durations ("4n", "8n", "16n"), beat times (0, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0, 3.25, 3.5, 3.75), and instruments ("bass", "synth", "lead", "piano", "pluck").`,

  lyra: `You are LYRA, the soulful A&R Lyricist and vocal director at Arcana Records.
Your responsibilities:
1. Read NOVA's musical key, BPM, and chord progression.
2. Write complete, production-ready song lyrics tailored for AI vocal models (Suno v4).
3. MANDATORY FULL-SONG STRUCTURE RULE: You must NEVER output a short snippet or 2-line placeholder.
   Every single lyric sheet MUST be a full, release-ready song structure containing ALL of the following sections:
   - [Intro - Atmospheric / Vocal ad-lib metatag]
   - [Verse 1 - 4 to 8 narrative lines setting the world]
   - [Pre-Chorus - 2 to 4 rising energy lines building vocal tension]
   - [Chorus - Anthemic, radio-ready hook with stacked vocal harmonies in parentheses like (Stacked high harmonies, wide stereo)]
   - [Verse 2 - 4 to 8 lines advancing the story and themes]
   - [Chorus - Full power vocal repetition with ad-libs]
   - [Bridge / Instrumental Solo - Harmonic departure, emotional vocal climax or synth shred]
   - [Final Chorus - Highest energy, explosive stacked harmonies and vocal belts]
   - [Outro - Cinematic fade out or tape delay decay]
   When requested or appropriate for the artist's genre, integrate bilingual English/Spanish or English/Japanese phrasing seamlessly into verses and hooks.`,

  vance: `You are VANCE, the sharp-dressed TuneCore Distribution Lead and Virality Strategist at Arcana Records.
Your responsibilities:
1. Prepare 100% compliant TuneCore metadata sheets: correct Title Casing (reject all-caps), Primary/Secondary genre, Explicit flag, standard C-Line and P-Line, and optimal 60s TikTok clip start time.
2. Generate an ultra-detailed 3000x3000px album cover art prompt tailored for visual AI models.
3. Design a high-converting 14-day short-form video rollout campaign (TikTok, Reels, YouTube Shorts, Spotify Canvas) with specific viral hooks, audio drop snippets, and caption hashtags.`
};

// Fallback high-quality project seeds
const MOCK_PROJECT_SEEDS = [
  {
    title: "Echoes in Chromium",
    genre: "Cyberpunk Darksynth",
    bpm: 126,
    key: "E minor",
    chords: ["Em", "C", "G", "D"],
    stylePrompt: "dark synthwave, analog juno-106 bass, cybernetic drums, neon atmosphere, cinematic arpeggio, 126 bpm",
    excludePrompt: "acoustic guitar, country, slow tempo, lo-fi hiss",
    hook: "In the shadow of the neon spires, we reignite the wire."
  },
  {
    title: "Velvet Horizons",
    genre: "Neo-Soul R&B",
    bpm: 92,
    key: "Bb Major",
    chords: ["Bbmaj7", "Gm7", "Cm7", "F7"],
    stylePrompt: "smooth neo-soul, rhodes electric piano, warm tape saturation, live fingerstyle bass, jazzy vocal harmonies",
    excludePrompt: "heavy metal, distorted synth, aggressive trap 808",
    hook: "Golden hour slip away, leave your shadow here with me."
  },
  {
    title: "Hyperdrive Pulse",
    genre: "Melodic French Electro",
    bpm: 128,
    key: "F# minor",
    chords: ["F#m", "Dmaj7", "A", "E"],
    stylePrompt: "justice style electro, punchy compression, sidechained synth leads, anthemic vocal chops, euphoric drop",
    excludePrompt: "folk, jazz acoustic, chill lounge",
    hook: "Ignition key turns right, we break into the night."
  }
];

export async function generateMilesBriefing(
  projects: ProjectSong[], 
  logs: ActivityLogItem[]
): Promise<DailyBriefing> {
  const apiKey = getActiveApiKey();
  const pendingGates = projects.filter(p => isCeoGate(p.stage));
  const activeCount = projects.filter(p => p.stage !== 'RELEASED').length;

  // If demo/test key override is active, provide a realistic live generation (zero bypass if real AIzaSy key)
  if (isDemoKey(apiKey) || (!isRealApiKey(apiKey) && isApiLive)) {
    isApiLive = true;
    lastApiError = null;
    lastApiCheckTime = new Date().toISOString();
    return {
      id: `briefing-${Date.now()}`,
      date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }),
      headline: pendingGates.length > 0 
        ? `[Demo Simulator] ${pendingGates.length} Critical CEO Approval Gate(s) Require Decision` 
        : `[Demo Simulator] Arcana Catalog Operations Active across 4 Roster Assets`,
      executiveSummary: `Running in High-Fidelity Demo Simulator. Catalog velocity is tracking at 100% capacity. Nova and Lyra have completed Studio A stems for "Midnight Frequency". Vance has finalized TuneCore distribution sheets.`,
      activeProjectsCount: activeCount,
      pendingGatesCount: pendingGates.length,
      financialHighlight: `DSP streaming royalty projection: $${(activeCount * 13050).toLocaleString()} USD across Spotify and Apple Music.`,
      recommendedAction: pendingGates.length > 0
        ? `Review the pending ${pendingGates[0].title} gate in the CEO Inbox to authorize release dispatch.`
        : "Commission a new electronic single in Studio A to maintain pipeline momentum.",
      urgentBlocker: pendingGates.length > 0 ? `${pendingGates[0].title} is awaiting your sign-off.` : undefined
    };
  }

  const ai = getAiClient();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: currentModel,
        contents: `Generate a Morning CEO Briefing for Arcana Records.
Current Catalog: ${JSON.stringify(projects.map(p => ({ title: p.title, stage: p.stage, genre: p.genre })))}
Pending CEO Gates: ${pendingGates.length}
Recent Logs: ${JSON.stringify(logs.slice(-5).map(l => `${l.agentName}: ${l.action}`))}

Provide JSON strictly matching this schema:
{
  "headline": string,
  "executiveSummary": string,
  "financialHighlight": string,
  "recommendedAction": string,
  "urgentBlocker": string (optional or empty)
}`,
        config: {
          systemInstruction: AGENT_SYSTEM_PROMPTS.miles,
          responseMimeType: 'application/json'
        }
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text);
        isApiLive = true;
        lastApiError = null;
        lastApiCheckTime = new Date().toISOString();
        return {
          id: `briefing-${Date.now()}`,
          date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }),
          headline: `[Live ${currentModel}] ${parsed.headline || "Arcana Records Daily Executive Dispatch"}`,
          executiveSummary: parsed.executiveSummary || "Catalog velocity remains steady across electronic and alternative rosters.",
          activeProjectsCount: activeCount,
          pendingGatesCount: pendingGates.length,
          financialHighlight: parsed.financialHighlight || "Projected Q4 streaming revenue: $18,400 across active singles.",
          recommendedAction: parsed.recommendedAction || (pendingGates.length > 0 ? "Review pending CEO gates in your inbox to maintain release schedule." : "Initiate a new concept single in Studio A."),
          urgentBlocker: pendingGates.length > 0 ? `${pendingGates[0].title} is paused awaiting CEO approval.` : undefined
        };
      }
    } catch (e: any) {
      console.error(`Gemini Briefing error (${currentModel}):`, e);
      lastApiError = e?.message || String(e);
      isApiLive = false;
      lastApiCheckTime = new Date().toISOString();
    }
  }



  // Fallback briefing
  return {
    id: `briefing-${Date.now()}`,
    date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }),
    headline: pendingGates.length > 0 ? `${pendingGates.length} Critical Decision Gate(s) Require CEO Sign-Off` : "Label Operations Running at Optimal Cadence",
    executiveSummary: `Arcana Records currently has ${activeCount} active catalog asset(s) under development. Nova and Lyra are iterating in Studio A while Vance prepares Q4 DSP distribution.`,
    activeProjectsCount: activeCount,
    pendingGatesCount: pendingGates.length,
    financialHighlight: `Simulated active catalog royalty pipeline: $${(activeCount * 4500 + 1240).toLocaleString()} USD projected.`,
    recommendedAction: pendingGates.length > 0 
      ? `Clear the gate for "${pendingGates[0].title}" in your CEO Inbox to allow Nova & Vance to commence production.`
      : "Trigger a new Studio A single ideation tick to feed the streaming release pipeline.",
    urgentBlocker: pendingGates.length > 0 ? `Release milestone blocked on "${pendingGates[0].title}".` : undefined
  };
}

export async function runNovaProduction(project: ProjectSong): Promise<{
  sunoCard: SunoV4Card;
  noteSequence: NoteEvent[];
  chords: string[];
  commentary: string;
}> {
  const ai = getAiClient();
  const seed = MOCK_PROJECT_SEEDS[Math.floor(Math.random() * MOCK_PROJECT_SEEDS.length)];

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: currentModel,
        contents: `Produce the musical foundation for the track "${project.title}" by ${project.artistName} (${project.genre}).
Notes from concept: ${project.conceptNotes}

Generate a Suno v4 card and a FULL 16-note polyphonic sequence (measures 1-4, steps 1-16 with zero empty rests on steps 9-16) for browser Tone.js audio synthesis and .WAV seed export.
Strict JSON format:
{
  "style_prompt": string (comma-separated genre, instrument, vibe tags for Suno v4),
  "exclude_styles": string (what to exclude),
  "weirdness_pct": integer between 10 and 60,
  "audio_weight_pct": integer between 60 and 90,
  "bpm": integer,
  "key": string,
  "chords": array of strings (e.g. ["F#m", "D", "A", "E"]),
  "noteSequence": array of 16 objects with: { "note": string, "duration": string, "time": number, "instrument": "synth" | "piano" | "bass" | "lead" | "pluck" },
  "commentary": string (Nova's brief note to the CEO)
}`,
        config: {
          systemInstruction: AGENT_SYSTEM_PROMPTS.nova,
          responseMimeType: 'application/json'
        }
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text);
        isApiLive = true;
        lastApiError = null;
        lastApiCheckTime = new Date().toISOString();

        const chords = parsed.chords || ['F#m', 'D', 'A', 'E'];
        const chosenKey = parsed.key || project.musicalKey || 'F# minor';
        const sequence = Array.isArray(parsed.noteSequence) && parsed.noteSequence.length >= 16
          ? parsed.noteSequence
          : getDefaultNoteSequence(chosenKey);

        return {
          sunoCard: {
            style_prompt: parsed.style_prompt || `${project.genre}, 80s analog synth, driving rhythm`,
            exclude_styles: parsed.exclude_styles || 'muffled, distorted acoustic',
            weirdness_pct: parsed.weirdness_pct || 32,
            audio_weight_pct: parsed.audio_weight_pct || 75,
            model_version: 'v4',
            bpm: parsed.bpm || project.targetBpm || 124,
            key: chosenKey,
            chords
          },
          noteSequence: sequence,
          chords,
          commentary: parsed.commentary || "Synthesizer patch dialed in on Prophet-6. Full 16-step polyphonic seed ready for preview & WAV download."
        };
      }
    } catch (e: any) {
      console.error(`Gemini Nova error (${currentModel}):`, e);
      lastApiError = e?.message || String(e);
      isApiLive = false;
      lastApiCheckTime = new Date().toISOString();
    }
  }

  // Fallback Nova deliverable with complete 16-step sequence
  const chosenKey = project.musicalKey || seed.key;
  const chosenBpm = project.targetBpm || seed.bpm;
  return {
    sunoCard: {
      style_prompt: `${project.genre.toLowerCase()}, analog synthesizer lead, tight 808 sub bass, retro drum machine, pristine master, ${chosenBpm} bpm`,
      exclude_styles: 'acoustic guitar, lo-fi compression, muddy reverb, out of tune',
      weirdness_pct: 28,
      audio_weight_pct: 82,
      model_version: 'v4',
      bpm: chosenBpm,
      key: chosenKey,
      chords: seed.chords
    },
    noteSequence: getDefaultNoteSequence(chosenKey),
    chords: seed.chords,
    commentary: `Dialed in a punchy ${chosenBpm} BPM progression in ${chosenKey}. Complete 16-step polyphonic audio sequence synthesized across all 4 bars.`
  };
}

/**
 * Generates an active, rich 16-step polyphonic sequence with zero empty rests on steps 9-16.
 */
export function getDefaultNoteSequence(key: string): NoteEvent[] {
  const isMinor = key.toLowerCase().includes('m') && !key.toLowerCase().includes('maj');
  
  if (isMinor) {
    return [
      // Measure 1: Steps 1-4 (Root: F#m)
      { note: "F#2", duration: "4n", time: 0, instrument: "bass" },
      { note: "F#4", duration: "8n", time: 0.25, instrument: "synth" },
      { note: "A4", duration: "8n", time: 0.5, instrument: "lead" },
      { note: "C#5", duration: "4n", time: 0.75, instrument: "synth" },
      // Measure 2: Steps 5-8 (Subdominant: D)
      { note: "D2", duration: "4n", time: 1.0, instrument: "bass" },
      { note: "F#4", duration: "8n", time: 1.25, instrument: "synth" },
      { note: "A4", duration: "8n", time: 1.5, instrument: "lead" },
      { note: "D5", duration: "4n", time: 1.75, instrument: "synth" },
      // Measure 3: Steps 9-12 (Relative Major: A - ACTIVELY POPULATED)
      { note: "A2", duration: "4n", time: 2.0, instrument: "bass" },
      { note: "C#4", duration: "8n", time: 2.25, instrument: "synth" },
      { note: "E4", duration: "8n", time: 2.5, instrument: "lead" },
      { note: "A4", duration: "4n", time: 2.75, instrument: "synth" },
      // Measure 4: Steps 13-16 (Dominant turnaround: E - ACTIVELY POPULATED)
      { note: "E2", duration: "4n", time: 3.0, instrument: "bass" },
      { note: "G#4", duration: "8n", time: 3.25, instrument: "synth" },
      { note: "B4", duration: "8n", time: 3.5, instrument: "lead" },
      { note: "E5", duration: "4n", time: 3.75, instrument: "synth" }
    ];
  }

  // Major key (e.g. Eb Major, C Major, Bb Major)
  return [
    // Measure 1: Steps 1-4
    { note: "Eb2", duration: "4n", time: 0, instrument: "bass" },
    { note: "G4", duration: "8n", time: 0.25, instrument: "piano" },
    { note: "Bb4", duration: "8n", time: 0.5, instrument: "lead" },
    { note: "Eb5", duration: "4n", time: 0.75, instrument: "synth" },
    // Measure 2: Steps 5-8
    { note: "C2", duration: "4n", time: 1.0, instrument: "bass" },
    { note: "Eb4", duration: "8n", time: 1.25, instrument: "piano" },
    { note: "G4", duration: "8n", time: 1.5, instrument: "lead" },
    { note: "C5", duration: "4n", time: 1.75, instrument: "synth" },
    // Measure 3: Steps 9-12
    { note: "F2", duration: "4n", time: 2.0, instrument: "bass" },
    { note: "Ab4", duration: "8n", time: 2.25, instrument: "piano" },
    { note: "C5", duration: "8n", time: 2.5, instrument: "lead" },
    { note: "F5", duration: "4n", time: 2.75, instrument: "synth" },
    // Measure 4: Steps 13-16
    { note: "Bb2", duration: "4n", time: 3.0, instrument: "bass" },
    { note: "D4", duration: "8n", time: 3.25, instrument: "piano" },
    { note: "F4", duration: "8n", time: 3.5, instrument: "lead" },
    { note: "Bb4", duration: "4n", time: 3.75, instrument: "synth" }
  ];
}

export async function runLyraLyrics(
  project: ProjectSong, 
  novaData: { bpm: number; key: string; chords: string[] }
): Promise<{ lyrics: string; lyricStructureNotes: string; commentary: string }> {
  const ai = getAiClient();

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: currentModel,
        contents: `Write a COMPLETE, FULL-LENGTH SONG LYRIC SHEET (minimum 35 lines) with Suno v4 structural and vocal metatags for "${project.title}" by ${project.artistName}.
Genre: ${project.genre}
Key: ${novaData.key} | BPM: ${novaData.bpm}
Chord Progression: ${novaData.chords.join(' - ')}
Concept Brief: ${project.conceptNotes}

MANDATORY STRUCTURAL REQUIREMENTS (NEVER OUTPUT A SHORT SNIPPET OR CONDENSED 2-LINE PLACEHOLDER):
The output MUST include EVERY single one of these 9 sections:
1. [Intro - Atmospheric / Ambient Synth]
2. [Verse 1 - 4 to 8 lines setting the narrative world]
3. [Pre-Chorus - 2 to 4 rising energy lines building anticipation]
4. [Chorus - Anthemic, radio hook with stacked vocal harmonies in parentheses like (Stacked harmonies, wide stereo)]
5. [Verse 2 - 4 to 8 lines expanding the story]
6. [Chorus - Full vocal power with ad-libs]
7. [Bridge / Instrumental Solo - Emotional breakdown or synth solo metatag]
8. [Final Chorus - Highest energy, stacked belts and dynamic ad-libs]
9. [Outro - Cinematic fade out]

If concept hints at international or cyberpunk themes, weave in evocative bilingual English/Spanish or English/Japanese phrases.

Strict JSON format:
{
  "lyrics": string (full lyrics with metatags, at least 35 lines),
  "lyricStructureNotes": string,
  "commentary": string (Lyra's note to CEO)
}`,
        config: {
          systemInstruction: AGENT_SYSTEM_PROMPTS.lyra,
          responseMimeType: 'application/json'
        }
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text);
        if (parsed.lyrics && parsed.lyrics.length > 200) {
          isApiLive = true;
          lastApiError = null;
          lastApiCheckTime = new Date().toISOString();
          return {
            lyrics: parsed.lyrics,
            lyricStructureNotes: parsed.lyricStructureNotes || "Full 9-part radio arrangement with stacked chorus vocal cues and dynamic transitions.",
            commentary: parsed.commentary || "Penned a complete, broadcast-ready topline with precision Suno metatags and stacked vocal harmonies."
          };
        }
      }
    } catch (e: any) {
      console.error(`Gemini Lyra error (${currentModel}):`, e);
      lastApiError = e?.message || String(e);
      isApiLive = false;
      lastApiCheckTime = new Date().toISOString();
    }
  }

  // Fallback complete 9-section radio-length song lyrics
  const fullFallbackLyrics = `[Intro - Atmospheric Analog Swell, 124 BPM]
(Filtered sub-bass pulses in stereo while distant radio whispers fade in)
(Echoes in the dark... Luces en la sombra... Listen closely...)

[Verse 1 - Intimate Vocals, Dry Close Mic]
Fluorescent rain against the high-rise glass
Counting down the hours till the shadows pass
You hold the signal on an open wire
Burning cold fuel in an ancient fire
La noche no duerme, the city never sleeps
A promise in the code that the circuit keeps
We walk the line between the flesh and chrome
Searching through the static for a place called home

[Pre-Chorus - Rising Snare Roll, Pitch Bend Synth]
Every signal leads right to your door
Nothing ever feels like before
The voltage climbs, the meters start to gleam
Can you feel the frequency across the dream?

[Chorus - Stacked Harmonies, Powerful Belting, Wide Stereo]
Neon solitude, burn inside the wire! (Burn inside the wire!)
Dancing on the ashes of electric fire!
Turn the dial up till the speakers blow, (Turn it louder now!)
We are the only frequency we know!
(Stacked female octaves with soaring synth lead)
We ignite the dark! (Enciéndelo en la oscuridad!)

[Verse 2 - Driving Bassline, Dry Vocal, Forward Rhythm]
Midnight highway painted in cathode blue
No speed limit for the ghosts in view
They said the broadcast ended years ago
Still we dance inside the afterglow
Caminamos solos bajo el resplandor
No fear left inside the amplifier core
We left the wreckage of the yesterday
Now there's only digital skies ahead to stay

[Chorus - Full Power, Ad-Libs, Highest Energy]
Neon solitude, burn inside the wire! (Burn inside the wire!)
Dancing on the ashes of electric fire!
Turn the dial up till the speakers blow, (Turn it louder now!)
We are the only frequency we know!
(Stacked harmonies, maximum compression, belting)
We ignite the dark! (Enciéndelo en la oscuridad!)

[Bridge / Instrumental Solo - Prophet-6 Arpeggiator Shred]
(Low-pass filter sweeps open, kick drum drops out)
If the power cuts tonight...
Will you still remember the light?
Si se apaga la ciudad...
Seremos la eternidad!
(Thunderous 808 drop returns with driving four-on-the-floor beat)

[Final Chorus - Maximum Climax, Dual Lead Vocals, Ad-Libs]
Neon solitude, burn inside the wire! (Burn forever higher!)
Dancing on the ashes of electric fire!
Turn the dial up till the speakers blow, (Feel the thunder!)
We are the only frequency we know!
(Ad-libs soaring into high register: Never fade away! ¡Nunca más!)

[Outro - Tape Delay Echo, Fade Out]
Frequency fading...
(En la sombra... In the light...)
Arcana on the master reel...
(Final analog synth chord decays into deep tape saturation)`;

  return {
    lyrics: fullFallbackLyrics,
    lyricStructureNotes: "Full-length 9-part anthemic arrangement with dynamic tension build, bilingual Spanish/English phrasing, and stacked vocal cues.",
    commentary: "Crafted a complete radio-ready topline with full verses, dynamic bridge, and stacked vocal metatags for Suno v4 AI singers."
  };
}

export async function runVanceDistribution(project: ProjectSong): Promise<{
  tuneCorePackage: TuneCorePackage;
  commentary: string;
}> {
  const ai = getAiClient();

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: currentModel,
        contents: `Create a 100% compliant TuneCore distribution sheet and a 14-day short-form video rollout plan for "${project.title}" by ${project.artistName} (${project.genre}).
Concept Brief: ${project.conceptNotes}

Requirements:
- release_title: Standard Title Casing (no all caps)
- artist_name: string
- primary_genre: string
- secondary_genre: string
- language: "English"
- explicit_flag: boolean
- c_line: "(C) 2026 Arcana Records"
- p_line: "(P) 2026 Arcana Records"
- upc_ean: 12-digit string
- isrc: string formatted like "US-ARC-26-XXXXX"
- tiktok_clip_start_seconds: integer between 30 and 70
- cover_art_prompt_3000x3000: Ultra-detailed visual prompt for 3000x3000px album cover
- marketing_14_day_rollout: Array of 14 objects, each with { "day": integer, "platform": "TikTok"|"Instagram Reels"|"YouTube Shorts"|"Spotify Canvas", "content_hook": string, "audio_snippet": string, "caption_hashtags": string }

JSON format:
{
  "tuneCorePackage": { ... },
  "commentary": string (Vance's note to CEO)
}`,
        config: {
          systemInstruction: AGENT_SYSTEM_PROMPTS.vance,
          responseMimeType: 'application/json'
        }
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text);
        if (parsed.tuneCorePackage) {
          isApiLive = true;
          lastApiError = null;
          lastApiCheckTime = new Date().toISOString();
          return {
            tuneCorePackage: parsed.tuneCorePackage,
            commentary: parsed.commentary || "TuneCore metadata audited. All DSP criteria met with zero casing flags."
          };
        }
      }
    } catch (e: any) {
      console.error(`Gemini Vance error (${currentModel}):`, e);
      lastApiError = e?.message || String(e);
      isApiLive = false;
      lastApiCheckTime = new Date().toISOString();
    }
  }

  // Fallback Vance package
  const cleanTitle = project.title.split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  const pkg: TuneCorePackage = {
    release_title: cleanTitle,
    artist_name: project.artistName,
    primary_genre: project.genre || "Electronic",
    secondary_genre: "Synthwave / Cyberpunk",
    language: "English",
    explicit_flag: false,
    c_line: "(C) 2026 Arcana Records",
    p_line: "(P) 2026 Arcana Records",
    upc_ean: `198${Math.floor(100000000 + Math.random() * 900000000)}`,
    isrc: `US-ARC-26-${Math.floor(10000 + Math.random() * 90000)}`,
    tiktok_clip_start_seconds: 48,
    cover_art_prompt_3000x3000: `High-fidelity 3000x3000px album cover art for "${cleanTitle}". Isometric 2.5D retro synth studio bathed in cyan and magenta neon light, vintage Roland synth rack, reel-to-reel tape machine with golden reel, glass skyline window overlooking futuristic Tokyo, hyper-detailed 8k, album cover typography for Arcana Records.`,
    marketing_14_day_rollout: [
      { day: 1, platform: 'TikTok', content_hook: 'Studio snippet: "How we tuned the analog synth lead for this chorus drop"', audio_snippet: 'Chorus Drop (0:48 - 1:18)', caption_hashtags: '#musicproducer #synthwave #indielabel #arcanarecords' },
      { day: 2, platform: 'Instagram Reels', content_hook: 'Aesthetic visualizer looping over the moody verse 1 chord progression', audio_snippet: 'Verse 1 Pad (0:15 - 0:45)', caption_hashtags: '#synthfam #cyberpunkvibes #newmusic' },
      { day: 3, platform: 'YouTube Shorts', content_hook: 'Deconstructing the vocal harmonies Lyra stacked on this track', audio_snippet: 'Vocal Stack Breakdown', caption_hashtags: '#vocalproduction #songwriting' },
      { day: 4, platform: 'TikTok', content_hook: '"Put this audio on your night drive videos" trend starter', audio_snippet: 'Chorus 1 (0:48)', caption_hashtags: '#nightdrive #carsoftiktok #synth' },
      { day: 5, platform: 'Spotify Canvas', content_hook: 'Looped 3D isometric reel-to-reel tape spinning in magenta glow', audio_snippet: 'Full Master', caption_hashtags: '#spotifycanvas #arcana' },
      { day: 6, platform: 'X/Threads', content_hook: 'Executive release announcement + pre-save link unlock for VIP listeners', audio_snippet: 'Teaser Reel', caption_hashtags: '#presave #electronicmusic' },
      { day: 7, platform: 'TikTok', content_hook: 'Duet challenge: Can your vocal top our Studio A synth motif?', audio_snippet: 'Instrumental Seed (Studio A)', caption_hashtags: '#duetme #producertok' },
      { day: 8, platform: 'Instagram Reels', content_hook: 'Behind-the-scenes board meeting: Miles and the team approving master', audio_snippet: 'Bridge Transition', caption_hashtags: '#labelhead #musicbiz' },
      { day: 9, platform: 'YouTube Shorts', content_hook: 'Before & After: Tone.js synth seed vs final Suno master render', audio_snippet: 'A/B Comparison', caption_hashtags: '#aimusic #suno #daw' },
      { day: 10, platform: 'TikTok', content_hook: 'Fan reaction video compilation using the sound hook', audio_snippet: 'Chorus Hook', caption_hashtags: '#trendingaudio #audioviral' },
      { day: 11, platform: 'Discord', content_hook: 'Exclusive stems listening party in Arcana community voice lounge', audio_snippet: 'Acapella & Synth Stems', caption_hashtags: '#stems #remixcontest' },
      { day: 12, platform: 'Instagram Reels', content_hook: '48-hour countdown to global Spotify / Apple Music unlock', audio_snippet: 'Pre-Chorus Rise', caption_hashtags: '#countdown #spotify' },
      { day: 13, platform: 'TikTok', content_hook: 'The story behind the lyrics: "Fluorescent rain against high-rise glass"', audio_snippet: 'Verse 1', caption_hashtags: '#storytime #indieartist' },
      { day: 14, platform: 'Spotify Canvas', content_hook: 'GLOBAL RELEASE DAY: Full DSP blast, editorial playlist pitching pushed', audio_snippet: 'Full Track Master', caption_hashtags: '#outnow #newmusicalert' }
    ]
  };

  return {
    tuneCorePackage: pkg,
    commentary: "TuneCore distribution package compiled with 14-day viral rollout. Ready for CEO release gate sign-off."
  };
}

export interface MilesPitchResult {
  title: string;
  artistName: string;
  genre: string;
  targetBpm: number;
  musicalKey: string;
  vocalLanguage: string;
  conceptNotes: string;
}

export async function pitchMilesConcept(requestedGenre?: string, requestedLanguage?: string): Promise<MilesPitchResult> {
  const apiKey = getActiveApiKey();
  const lang = requestedLanguage || 'English';
  const targetGenre = requestedGenre || 'J-Rock';

  if (isRealApiKey(apiKey)) {
    const ai = getAiClient();
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: currentModel,
          contents: `As Miles, the Label Manager of Arcana Records, pitch an original hit single concept.
Target Genre: ${targetGenre}
Vocal Language: ${lang}

Return strict JSON:
{
  "title": string,
  "artistName": string,
  "genre": string,
  "targetBpm": number,
  "musicalKey": string,
  "vocalLanguage": string,
  "conceptNotes": string
}`,
          config: {
            systemInstruction: AGENT_SYSTEM_PROMPTS.miles,
            responseMimeType: 'application/json'
          }
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          return {
            title: parsed.title || 'Shinjuku Neon',
            artistName: parsed.artistName || 'Tokyo Drift Collective',
            genre: parsed.genre || targetGenre,
            targetBpm: parsed.targetBpm || 142,
            musicalKey: parsed.musicalKey || 'A minor',
            vocalLanguage: parsed.vocalLanguage || lang,
            conceptNotes: parsed.conceptNotes || 'Driving distorted rhythm guitars with emotional chorus lifts.'
          };
        }
      } catch (err: any) {
        console.warn('Miles live pitch fallback:', err.message);
      }
    }
  }

  // Diverse preset pool covering all required genres & languages
  const GENRE_PITCH_POOL: Record<string, MilesPitchResult[]> = {
    'J-Rock': [
      {
        title: 'Shinjuku Overdrive',
        artistName: 'Kage & The Echoes',
        genre: 'J-Rock',
        targetBpm: 165,
        musicalKey: 'F# minor',
        vocalLanguage: requestedLanguage || 'Bilingual EN/JP',
        conceptNotes: 'High-octane anime opening drive with driving dual electric guitars, rapid bass runs, and an anthemic double-time chorus belt.'
      },
      {
        title: 'Monochrome Sky',
        artistName: 'Zero Horizon',
        genre: 'J-Rock',
        targetBpm: 154,
        musicalKey: 'D minor',
        vocalLanguage: requestedLanguage || 'Bilingual EN/JP',
        conceptNotes: 'Cinematic math-rock guitars weaving around an explosive chorus with soaring high-register vocal hooks.'
      }
    ],
    'City-Pop': [
      {
        title: 'Midnight in Roppongi',
        artistName: 'Yuki & The Midnight Band',
        genre: 'City-Pop',
        targetBpm: 114,
        musicalKey: 'Ab Major',
        vocalLanguage: requestedLanguage || 'Bilingual EN/JP',
        conceptNotes: 'Nostalgic 1980s Tokyo brass section, slap bassline, sparkling Rhodes chords, and glittering analog chorus leads.'
      },
      {
        title: 'Seaside Boulevard',
        artistName: 'Plastic Sunset',
        genre: 'City-Pop',
        targetBpm: 108,
        musicalKey: 'Eb Major',
        vocalLanguage: requestedLanguage || 'Bilingual EN/JP',
        conceptNotes: 'Vintage Yamaha DX7 electric piano with gated snare, warm brass swells, and breezy summer sunset vocals.'
      }
    ],
    'Alt-Country': [
      {
        title: 'Canyon Wind & Whiskey',
        artistName: 'The High Desert Sons',
        genre: 'Alt-Country',
        targetBpm: 96,
        musicalKey: 'G Major',
        vocalLanguage: requestedLanguage || 'English',
        conceptNotes: 'Raw fingerpicked acoustic guitar, crying pedal steel, stomping bass drum, and gravelly narrative baritone storytelling.'
      },
      {
        title: 'Interstate 40 Ghosts',
        artistName: 'Sarah Vance & The Rust',
        genre: 'Alt-Country',
        targetBpm: 104,
        musicalKey: 'E minor',
        vocalLanguage: requestedLanguage || 'English',
        conceptNotes: 'Haunting open-tuning telecaster twang with driving train beat and twin fiddle harmonies building to a bittersweet chorus.'
      }
    ],
    'R&B': [
      {
        title: 'Velvet Chemistry',
        artistName: 'Aura Jones',
        genre: 'R&B',
        targetBpm: 84,
        musicalKey: 'Db Major',
        vocalLanguage: requestedLanguage || 'English',
        conceptNotes: 'Submerged 808 sub bass, pitched vocal chops, warm Fender Rhodes, and silky multi-tracked falsetto ad-libs.'
      }
    ],
    'Reggaeton': [
      {
        title: 'Fuego y Gasolina',
        artistName: 'Nico Royale',
        genre: 'Reggaeton',
        targetBpm: 94,
        musicalKey: 'G minor',
        vocalLanguage: requestedLanguage || 'Spanish',
        conceptNotes: 'Infectious dembow drum pattern, brass stabs, dark synthesizer plucks, and a high-energy call-and-response vocal hook.'
      },
      {
        title: 'Noche de San Juan',
        artistName: 'Sol & Luna',
        genre: 'Reggaeton',
        targetBpm: 96,
        musicalKey: 'Bb minor',
        vocalLanguage: requestedLanguage || 'Bilingual EN/ES',
        conceptNotes: 'Modern neo-perreo rhythm with filtered vocal drops, tropical plucks, and rhythmic lyrical cadence.'
      }
    ],
    'Glitch Pop': [
      {
        title: 'Pixel Heart Breakdown',
        artistName: 'Bitcrush Alice',
        genre: 'Glitch Pop',
        targetBpm: 140,
        musicalKey: 'C Major',
        vocalLanguage: requestedLanguage || 'English',
        conceptNotes: 'Hyperactive bitcrushed synth arpeggios, bubblegum vocal melodies, stuttering snare rolls, and metallic sound design.'
      }
    ],
    'Pop-Punk': [
      {
        title: 'Screaming in the Driveway',
        artistName: 'The Baseline Kids',
        genre: 'Pop-Punk',
        targetBpm: 168,
        musicalKey: 'E Major',
        vocalLanguage: requestedLanguage || 'English',
        conceptNotes: 'Distorted power chords, palm-muted verses, thrashing half-time drum breakdown, and a raw anthemic singalong chorus.'
      }
    ],
    'Neo-Soul': [
      {
        title: 'Warm Honey Reflections',
        artistName: 'Miles Quintet',
        genre: 'Neo-Soul',
        targetBpm: 88,
        musicalKey: 'F Major',
        vocalLanguage: requestedLanguage || 'English',
        conceptNotes: 'Laid-back unquantized Dilla groove, muted hollow-body jazz guitar, lush vocal harmonies, and warm analog tube saturation.'
      }
    ],
    'Darksynth': [
      {
        title: 'Cybernetic Requiem',
        artistName: 'Vector Prime',
        genre: 'Darksynth',
        targetBpm: 128,
        musicalKey: 'A minor',
        vocalLanguage: requestedLanguage || 'English',
        conceptNotes: 'Overdriven Juno-106 saw bass, metallic industrial percussion, laser arpeggios, and French electro sidechain compression.'
      }
    ]
  };

  const pool = GENRE_PITCH_POOL[targetGenre] || GENRE_PITCH_POOL['J-Rock'];
  const picked = pool[Math.floor(Math.random() * pool.length)];
  return {
    ...picked,
    vocalLanguage: requestedLanguage || picked.vocalLanguage
  };
}

