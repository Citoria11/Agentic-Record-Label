import { AgentProfile, ProjectSong, ActivityLogItem, CeoInboxItem, DailyBriefing, StudioCommsMessage } from '../types';


export const INITIAL_AGENTS: AgentProfile[] = [
  {
    id: 'miles',
    name: 'MILES',
    role: 'Label Manager & Strategist',
    avatarColor: 'from-amber-500 to-amber-700',
    accentColor: '#f59e0b',
    homeRoom: 'ceo_office',
    currentRoom: 'ceo_office',
    status: 'IDLE',
    statusMessage: 'Reviewing Q4 streaming KPIs and CEO gate queue',
    thoughtBubble: 'Next single needs 124 BPM. Checking CEO inbox items.',
    bio: 'Ex-major label A&R turned autonomous manager. Strict on budgets, timing, and CEO sign-offs.',
    tasksCompleted: 42
  },
  {
    id: 'nova',
    name: 'NOVA',
    role: 'Lead Producer & Audio Coder',
    avatarColor: 'from-cyan-400 to-blue-600',
    accentColor: '#06b6d4',
    homeRoom: 'studio_a',
    currentRoom: 'studio_a',
    status: 'IDLE',
    statusMessage: 'Tuning Prophet-6 analog oscillator filter bank',
    thoughtBubble: 'Suno v4 audio seed sounds immaculate. Ready for preview.',
    bio: 'Obsessed with French touch, darksynth, and modular synthesis. Generates playable Tone.js seeds.',
    tasksCompleted: 68
  },
  {
    id: 'lyra',
    name: 'LYRA',
    role: 'A&R Lyricist & Vocal Director',
    avatarColor: 'from-fuchsia-400 to-pink-600',
    accentColor: '#d946ef',
    homeRoom: 'writers_lounge',
    currentRoom: 'writers_lounge',
    status: 'IDLE',
    statusMessage: 'Writing chorus rhymes and Suno vocal inflection metatags',
    thoughtBubble: 'Added [Chorus - Stacked Harmonies] tags for maximum vocal lift.',
    bio: 'Poet and vocal arranger. Embeds precision metatags to command AI voice generators.',
    tasksCompleted: 54
  },
  {
    id: 'vance',
    name: 'VANCE',
    role: 'TuneCore Distro & Growth Lead',
    avatarColor: 'from-emerald-400 to-teal-600',
    accentColor: '#10b981',
    homeRoom: 'marketing_desk',
    currentRoom: 'marketing_desk',
    status: 'IDLE',
    statusMessage: 'Verifying DSP metadata and scheduling TikTok sound drops',
    thoughtBubble: '3000x3000 cover art prompt rendered. Title casing compliant.',
    bio: 'Growth hacker and digital distributor. Ensures zero DSP rejections on TuneCore.',
    tasksCompleted: 39
  }
];

export const INITIAL_PROJECTS: ProjectSong[] = [
  {
    id: 'song-101',
    title: 'Neon Solitude',
    artistName: 'CyberDusk',
    genre: 'Cyberpunk Synthwave',
    stage: '3_PRODUCTION_AND_LYRICS',
    targetBpm: 124,
    musicalKey: 'F# minor',
    conceptNotes: 'Driving night ride aesthetic with heavy arpeggiators and melancholic topline.',
    createdAt: '2026-11-01T08:00:00Z',
    updatedAt: '2026-11-04T12:00:00Z',
    chordProgression: ['F#m', 'D', 'A', 'E'],
    sunoCard: {
      style_prompt: 'cyberpunk synthwave, analog juno-106 bass, driving 124 bpm, neon atmosphere, cinematic arpeggio, wide stereo master',
      exclude_styles: 'acoustic guitar, country, slow tempo, lo-fi hiss',
      weirdness_pct: 30,
      audio_weight_pct: 85,
      model_version: 'v4',
      bpm: 124,
      key: 'F# minor',
      chords: ['F#m', 'D', 'A', 'E']
    },
    noteSequence: [
      { note: "F#3", duration: "4n", time: 0, instrument: "bass" },
      { note: "F#4", duration: "8n", time: 0.25, instrument: "synth" },
      { note: "A4", duration: "8n", time: 0.5, instrument: "lead" },
      { note: "C#5", duration: "4n", time: 0.75, instrument: "synth" },
      { note: "D3", duration: "4n", time: 1.0, instrument: "bass" },
      { note: "F#4", duration: "8n", time: 1.25, instrument: "synth" },
      { note: "A4", duration: "8n", time: 1.5, instrument: "lead" },
      { note: "D5", duration: "4n", time: 1.75, instrument: "synth" },
      { note: "A2", duration: "4n", time: 2.0, instrument: "bass" },
      { note: "E4", duration: "8n", time: 2.25, instrument: "synth" },
      { note: "A4", duration: "8n", time: 2.5, instrument: "lead" },
      { note: "C#5", duration: "4n", time: 2.75, instrument: "synth" },
      { note: "E3", duration: "4n", time: 3.0, instrument: "bass" },
      { note: "G#4", duration: "8n", time: 3.25, instrument: "synth" },
      { note: "B4", duration: "8n", time: 3.5, instrument: "lead" },
      { note: "E5", duration: "4n", time: 3.75, instrument: "synth" }
    ],
    lyrics: `[Intro - Atmospheric Synth Swell, 124 BPM]
(Filtered sub-pulse builds in stereo)

[Verse 1 - Intimate Vocals, Dry]
Reflections flicker in the rainy glass
A thousand phantom cars that glide on past
We built a city out of glass and wire
Feeding the circuit with a ghost's desire

[Pre-Chorus - Snare Build, Rising Pitch]
Every signal leads right to your door
Nothing ever feels like before
Can you feel the voltage rise?

[Chorus - Stacked Harmonies, Powerful Belting]
Neon solitude, burn inside the wire!
Dancing on the ashes of electric fire!
Turn the dial up till the speakers blow,
We are the only frequency we know!

[Drop / Synth Lead Solo - Prophet-6 Arp]

[Outro - Reverb Decay]
Just neon solitude...
Fading into morning light.`,
    royaltyForecastUsd: 18500,
    simulatedStreams: 340000
  },
  {
    id: 'song-102',
    title: 'Midnight Frequency',
    artistName: 'The Glitch Trio',
    genre: 'Darksynth Electro',
    stage: '4_CEO_MASTER_GATE',
    blockedByGate: '4_CEO_MASTER_GATE',
    targetBpm: 128,
    musicalKey: 'A minor',
    conceptNotes: 'High-energy French electro bassline with Justice style distortion and vocoder hook.',
    createdAt: '2026-10-28T09:00:00Z',
    updatedAt: '2026-11-04T10:30:00Z',
    chordProgression: ['Am', 'F', 'C', 'G'],
    sunoCard: {
      style_prompt: 'french touch electro, distorted bass guitar, punchy 808 snare, vocoder vocal chops, 128 bpm, anthemic festival drop',
      exclude_styles: 'acoustic, folk, smooth jazz, lo-fi',
      weirdness_pct: 40,
      audio_weight_pct: 78,
      model_version: 'v4',
      bpm: 128,
      key: 'A minor',
      chords: ['Am', 'F', 'C', 'G']
    },
    noteSequence: [
      // Measure 1: Steps 1-4 (Am)
      { note: "A2", duration: "4n", time: 0, instrument: "bass" },
      { note: "C4", duration: "8n", time: 0.25, instrument: "synth" },
      { note: "E4", duration: "8n", time: 0.5, instrument: "lead" },
      { note: "A4", duration: "4n", time: 0.75, instrument: "synth" },
      // Measure 2: Steps 5-8 (F)
      { note: "F2", duration: "4n", time: 1.0, instrument: "bass" },
      { note: "A3", duration: "8n", time: 1.25, instrument: "synth" },
      { note: "C4", duration: "8n", time: 1.5, instrument: "lead" },
      { note: "F4", duration: "4n", time: 1.75, instrument: "synth" },
      // Measure 3: Steps 9-12 (C - Fully Populated)
      { note: "C3", duration: "4n", time: 2.0, instrument: "bass" },
      { note: "E4", duration: "8n", time: 2.25, instrument: "synth" },
      { note: "G4", duration: "8n", time: 2.5, instrument: "lead" },
      { note: "C5", duration: "4n", time: 2.75, instrument: "synth" },
      // Measure 4: Steps 13-16 (G - Fully Populated)
      { note: "G2", duration: "4n", time: 3.0, instrument: "bass" },
      { note: "B3", duration: "8n", time: 3.25, instrument: "synth" },
      { note: "D4", duration: "8n", time: 3.5, instrument: "lead" },
      { note: "G4", duration: "4n", time: 3.75, instrument: "synth" }
    ],
    lyrics: `[Intro - Vocoder Chops & Analog Siren, 128 BPM]
Midnight... frequency... ignite the grid.
(Resonance sweeps wide... All systems go...)
(Dans la nuit... Into the overdrive...)

[Verse 1 - Driving French Touch Bassline, Dry Vocal]
Paris underground, the sub-woofers shake the concrete wall
Static through the headphone cable waiting for the call
Red diodes blinking in the shadow of the mixing board
A million volts of analog that nobody can afford
Les lumières s'allument, the city streets catch flame
Every silhouette is dancing to an unforgotten name
We cut the limiter, we let the signal bleed
Pumping out the only medicine we'll ever need

[Pre-Chorus - Rising Pitch Sweep, Pumping Compression]
Faders creeping up against the red
Forget the promises the daylight said
Can you feel the compression start to lock?
Twelve o'clock, we synchronize the master clock!

[Chorus - Explosive Drop, Stacked Harmonies, Heavy Distortion]
Break the limiter, push the red line! (Push it all the way!)
We own the frequency, we own the time! (We take the night!)
Turn the saturation till the meters scream,
Living high voltage inside the dream!
(Stacked vocal chops: Midnight! Frequency! Jamais s'arrêter!)
We own the frequency, we own the time!

[Verse 2 - Gritty Electro Lead, Pumping 808]
Tire screech on the boulevard, headlights in the mist
A manifesto written on a vinyl record disc
They said electro died a decade in the past
Now look at the arena floor, moving twice as fast
Des milliers de voix, shouting at the stage
A brand new chapter written on the digital page
We keep the rhythm locked, the sidechain never bends
This is the frequency where the horizon ends

[Chorus - Full Vocal Power, Ad-Libs, Highest Energy]
Break the limiter, push the red line! (Push it all the way!)
We own the frequency, we own the time! (We take the night!)
Turn the saturation till the meters scream,
Living high voltage inside the dream!
(Stacked vocal chops: Midnight! Frequency! Jamais s'arrêter!)
We own the frequency, we own the time!

[Bridge / Instrumental Solo - Distorted Bass Guitar Shred & Synth Duel]
(Drums drop out, resonant vocoder solo leads into white noise sweep)
Quand le monde dort, nous sommes les maîtres du son...
(When the world sleeps, we rule the sound...)
(Filter cutoff opens wide to 20kHz)
THREE... TWO... ONE... DROP THE BASS!
(Maximum French Touch drop hits with maximum distortion)

[Final Chorus - Climax, Dual Vocals, Peak Intensity]
Break the limiter, push the red line! (Higher! Higher!)
We own the frequency, we own the time! (Own the time!)
Turn the saturation till the meters scream,
Living high voltage inside the dream!
(Soaring ad-libs: We will never fall! Toujours debout!)

[Outro - Tape Delay Breakdown, Echo Decay]
Midnight... frequency...
Arcana Studio A... tape reel spins into silence...
(Fade out on sustained distorted sub bass)`,
    royaltyForecastUsd: 24200,
    simulatedStreams: 520000
  },
  {
    id: 'song-103',
    title: 'Velvet Horizon',
    artistName: 'Velvet Zero',
    genre: 'Neo-Soul Lo-Fi',
    stage: '2_CEO_CONCEPT_GATE',
    blockedByGate: '2_CEO_CONCEPT_GATE',
    targetBpm: 88,
    musicalKey: 'Eb Major',
    conceptNotes: 'Late-night chill release for playlist placement. Rhodes piano with warm tape flutter and silky female vocals.',
    createdAt: '2026-11-03T14:00:00Z',
    updatedAt: '2026-11-04T09:15:00Z',
    chordProgression: ['Ebmaj7', 'Cm7', 'Fm7', 'Bb7'],
    noteSequence: [
      { note: "Eb2", duration: "4n", time: 0, instrument: "bass" },
      { note: "G4", duration: "8n", time: 0.25, instrument: "piano" },
      { note: "Bb4", duration: "8n", time: 0.5, instrument: "lead" },
      { note: "Eb5", duration: "4n", time: 0.75, instrument: "synth" },
      { note: "C2", duration: "4n", time: 1.0, instrument: "bass" },
      { note: "Eb4", duration: "8n", time: 1.25, instrument: "piano" },
      { note: "G4", duration: "8n", time: 1.5, instrument: "lead" },
      { note: "C5", duration: "4n", time: 1.75, instrument: "synth" },
      { note: "F2", duration: "4n", time: 2.0, instrument: "bass" },
      { note: "Ab4", duration: "8n", time: 2.25, instrument: "piano" },
      { note: "C5", duration: "8n", time: 2.5, instrument: "lead" },
      { note: "F5", duration: "4n", time: 2.75, instrument: "synth" },
      { note: "Bb2", duration: "4n", time: 3.0, instrument: "bass" },
      { note: "D4", duration: "8n", time: 3.25, instrument: "piano" },
      { note: "F4", duration: "8n", time: 3.5, instrument: "lead" },
      { note: "Bb4", duration: "4n", time: 3.75, instrument: "synth" }
    ],
    royaltyForecastUsd: 9500,
    simulatedStreams: 180000
  },
  {
    id: 'song-104',
    title: 'Ghost Protocol',
    artistName: 'K-99',
    genre: 'Industrial Cyber Techno',
    stage: '1_IDEATION',
    targetBpm: 135,
    musicalKey: 'D minor',
    conceptNotes: 'Fast underground club banger designed for European DJ sets and fitness playlists.',
    createdAt: '2026-11-04T15:00:00Z',
    updatedAt: '2026-11-04T15:00:00Z',
    noteSequence: [
      { note: "D2", duration: "4n", time: 0, instrument: "bass" },
      { note: "F4", duration: "8n", time: 0.25, instrument: "synth" },
      { note: "A4", duration: "8n", time: 0.5, instrument: "lead" },
      { note: "D5", duration: "4n", time: 0.75, instrument: "synth" },
      { note: "G2", duration: "4n", time: 1.0, instrument: "bass" },
      { note: "Bb3", duration: "8n", time: 1.25, instrument: "synth" },
      { note: "D4", duration: "8n", time: 1.5, instrument: "lead" },
      { note: "G4", duration: "4n", time: 1.75, instrument: "synth" },
      { note: "A2", duration: "4n", time: 2.0, instrument: "bass" },
      { note: "C#4", duration: "8n", time: 2.25, instrument: "synth" },
      { note: "E4", duration: "8n", time: 2.5, instrument: "lead" },
      { note: "A4", duration: "4n", time: 2.75, instrument: "synth" },
      { note: "D2", duration: "4n", time: 3.0, instrument: "bass" },
      { note: "F4", duration: "8n", time: 3.25, instrument: "synth" },
      { note: "A4", duration: "8n", time: 3.5, instrument: "lead" },
      { note: "D5", duration: "4n", time: 3.75, instrument: "synth" }
    ]
  }
];

export const INITIAL_INBOX: CeoInboxItem[] = [
  {
    id: 'inbox-gate-102',
    projectId: 'song-102',
    projectTitle: 'Midnight Frequency',
    gateType: '4_CEO_MASTER_GATE',
    submittedBy: 'nova',
    title: 'CEO Master Gate Sign-off: "Midnight Frequency"',
    summary: 'Nova and Lyra finished production. Audio seed rendered in Studio A (128 BPM, A minor). Suno v4 card & lyrics ready for CEO Master Sign-off to advance to Vance for TuneCore DSP packaging.',
    createdAt: '2026-11-04T10:30:00Z',
    status: 'PENDING'
  },
  {
    id: 'inbox-gate-103',
    projectId: 'song-103',
    projectTitle: 'Velvet Horizon',
    gateType: '2_CEO_CONCEPT_GATE',
    submittedBy: 'miles',
    title: 'CEO Concept Gate Sign-off: "Velvet Horizon"',
    summary: 'Miles compiled concept brief: Neo-Soul Lo-Fi, 88 BPM, targeted for Chillhop and Lofi Beats editorial playlists. Awaiting CEO greenlight to book Nova and Lyra in Studio A.',
    createdAt: '2026-11-04T09:15:00Z',
    status: 'PENDING'
  }
];

export const INITIAL_LOGS: ActivityLogItem[] = [
  {
    id: 'log-seed-1',
    timestamp: '16:30:10',
    agentId: 'miles',
    agentName: 'MILES',
    action: 'Compiled Arcana Records Q4 Executive Dispatch. Routed concept single to CEO Inbox.',
    roomId: 'ceo_office',
    projectId: 'song-103',
    projectTitle: 'Velvet Horizon'
  },
  {
    id: 'log-seed-2',
    timestamp: '16:35:45',
    agentId: 'nova',
    agentName: 'NOVA',
    action: 'Synthesized 16-note audio motif for "Midnight Frequency" using Prophet-6 emulator in Studio A.',
    roomId: 'studio_a',
    projectId: 'song-102',
    projectTitle: 'Midnight Frequency'
  },
  {
    id: 'log-seed-3',
    timestamp: '16:40:20',
    agentId: 'lyra',
    agentName: 'LYRA',
    action: 'Arranged Suno vocal inflection metatags and dynamic chorus for "Midnight Frequency". Paused at CEO Master Gate.',
    roomId: 'writers_lounge',
    projectId: 'song-102',
    projectTitle: 'Midnight Frequency'
  },
  {
    id: 'log-seed-4',
    timestamp: '16:45:00',
    agentId: 'vance',
    agentName: 'VANCE',
    action: 'Ran DSP title casing audit. Prepared 14-day TikTok rollout template at Marketing Desk.',
    roomId: 'marketing_desk'
  }
];

export const INITIAL_BRIEFING: DailyBriefing = {
  id: 'briefing-init',
  date: 'Wednesday, Nov 4, 2026',
  headline: '2 Critical CEO Approval Gates Awaiting Sign-Off in Arcana Inbox',
  executiveSummary: 'Arcana Records pipeline is healthy with 4 singles across electronic and neo-soul categories. "Midnight Frequency" is ready for Master Gate approval; "Velvet Horizon" awaits Concept approval.',
  activeProjectsCount: 4,
  pendingGatesCount: 2,
  financialHighlight: 'Projected streaming revenue: $52,200 across active singles roster.',
  recommendedAction: 'Clear pending CEO Gates in the Inbox tab to unblock Nova and Vance for immediate TuneCore dispatch.',
  urgentBlocker: '"Midnight Frequency" paused at 4_CEO_MASTER_GATE.'
};

export const INITIAL_STUDIO_COMMS: StudioCommsMessage[] = [
  {
    id: 'comms-1',
    timestamp: '16:32:15',
    fromAgentId: 'miles',
    toAgentId: 'nova',
    projectTitle: 'Midnight Frequency',
    roomFrom: 'ceo_office',
    roomTo: 'studio_a',
    message: 'CEO approved concept brief for "Midnight Frequency". Head into Studio A and dial in the 128 BPM analog synths.'
  },
  {
    id: 'comms-2',
    timestamp: '16:38:45',
    fromAgentId: 'nova',
    toAgentId: 'lyra',
    projectTitle: 'Midnight Frequency',
    roomFrom: 'studio_a',
    roomTo: 'writers_lounge',
    message: 'Prophet chords & full 16-step polyphonic seed synthesized. Handing off stems to Writers Lounge for topline lyrics.'
  },
  {
    id: 'comms-3',
    timestamp: '16:40:20',
    fromAgentId: 'lyra',
    toAgentId: 'vance',
    projectTitle: 'Midnight Frequency',
    roomFrom: 'writers_lounge',
    roomTo: 'marketing_desk',
    message: 'Complete 9-section lyric sheet ready with stacked chorus harmonies & bilingual cues. Take it to Marketing for TuneCore packaging.'
  },
  {
    id: 'comms-4',
    timestamp: '16:45:00',
    fromAgentId: 'vance',
    toAgentId: 'ceo',
    projectTitle: 'Midnight Frequency',
    roomFrom: 'marketing_desk',
    roomTo: 'ceo_office',
    message: 'TuneCore metadata audited & 3000x3000px art prompt rendered. Placed at Gate 4 for CEO Master sign-off.'
  }
];

