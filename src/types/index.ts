export type AgentId = 'miles' | 'nova' | 'lyra' | 'vance';

export type AgentStatus = 'IDLE' | 'WORKING' | 'BLOCKED BY CEO' | 'THINKING';

export type RoomId = 'ceo_office' | 'studio_a' | 'writers_lounge' | 'marketing_desk' | 'boardroom';

export type PipelineStage = 
  | '1_IDEATION'
  | '2_CEO_CONCEPT_GATE'
  | '3_PRODUCTION_AND_LYRICS'
  | '4_CEO_MASTER_GATE'
  | '5_TUNECORE_AND_MARKETING'
  | '6_CEO_RELEASE_GATE'
  | 'RELEASED';

export interface AgentProfile {
  id: AgentId;
  name: string;
  role: string;
  avatarColor: string;
  accentColor: string;
  homeRoom: RoomId;
  currentRoom: RoomId;
  status: AgentStatus;
  statusMessage: string;
  thoughtBubble: string;
  bio: string;
  assignedProjectId?: string;
  tasksCompleted: number;
}

export interface NoteEvent {
  note: string;
  duration: string;
  time: number; // in seconds or beats
  instrument?: 'synth' | 'piano' | 'bass' | 'lead' | 'pluck';
  velocity?: number;
}

export interface SunoV4Card {
  style_prompt: string;
  exclude_styles: string;
  weirdness_pct: number;
  audio_weight_pct: number;
  model_version: string;
  bpm: number;
  key: string;
  chords: string[];
}

export interface RolloutDayPlan {
  day: number;
  platform: 'TikTok' | 'Instagram Reels' | 'YouTube Shorts' | 'Spotify Canvas' | 'X/Threads' | 'Discord';
  content_hook: string;
  audio_snippet: string;
  caption_hashtags: string;
}

export interface TuneCorePackage {
  release_title: string;
  artist_name: string;
  primary_genre: string;
  secondary_genre: string;
  language: string;
  explicit_flag: boolean;
  c_line: string;
  p_line: string;
  upc_ean: string;
  isrc: string;
  tiktok_clip_start_seconds: number;
  cover_art_prompt_3000x3000: string;
  marketing_14_day_rollout: RolloutDayPlan[];
}

export interface ProjectSong {
  id: string;
  title: string;
  artistName: string;
  genre: string;
  stage: PipelineStage;
  targetBpm: number;
  musicalKey: string;
  conceptNotes: string;
  createdAt: string;
  updatedAt: string;
  
  // NOVA deliverables
  sunoCard?: SunoV4Card;
  chordProgression?: string[];
  noteSequence?: NoteEvent[];
  audioSeedWavUrl?: string;

  // LYRA deliverables
  lyrics?: string;
  lyricStructureNotes?: string;

  // VANCE deliverables
  tuneCorePackage?: TuneCorePackage;

  // CEO notes & Gate states
  blockedByGate?: PipelineStage;
  ceoFeedback?: string;
  royaltyForecastUsd?: number;
  simulatedStreams?: number;
  vocalLanguage?: 'English' | 'Spanish' | 'Bilingual EN/ES' | 'Bilingual EN/JP' | string;
}

export interface CeoInboxItem {
  id: string;
  projectId: string;
  projectTitle: string;
  gateType: '2_CEO_CONCEPT_GATE' | '4_CEO_MASTER_GATE' | '6_CEO_RELEASE_GATE';
  submittedBy: AgentId;
  title: string;
  summary: string;
  createdAt: string;
  status: 'PENDING' | 'APPROVED' | 'REVISED';
  ceoNotes?: string;
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  agentId: AgentId;
  agentName: string;
  action: string;
  roomId: RoomId;
  projectId?: string;
  projectTitle?: string;
  details?: string;
}

export interface DailyBriefing {
  id: string;
  date: string;
  headline: string;
  executiveSummary: string;
  activeProjectsCount: number;
  pendingGatesCount: number;
  financialHighlight: string;
  recommendedAction: string;
  urgentBlocker?: string;
}

export interface StudioCommsMessage {
  id: string;
  timestamp: string;
  fromAgentId: AgentId;
  toAgentId: AgentId | 'ceo';
  message: string;
  projectTitle?: string;
  roomFrom?: RoomId;
  roomTo?: RoomId;
}

export interface ApiStatus {
  isLive: boolean;
  isDemoSimulator?: boolean;
  model: 'gemini-2.5-flash' | 'gemini-2.5-pro';
  error: string | null;
  lastChecked?: string;
}

