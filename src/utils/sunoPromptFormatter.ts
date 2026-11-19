import { SunoV4Card } from '../types';

export function formatSunoPromptCard(card: SunoV4Card): string {
  return [
    `=== SUNO v4 PARAMETER CARD ===`,
    `Model: Suno ${card.model_version || 'v4'}`,
    `Key: ${card.key} | BPM: ${card.bpm}`,
    `Progression: ${card.chords?.join(' - ') || 'N/A'}`,
    ``,
    `[STYLE PROMPT]`,
    card.style_prompt,
    ``,
    `[EXCLUDE STYLES]`,
    card.exclude_styles,
    ``,
    `[SLIDER PARAMETERS]`,
    `Weirdness: ${card.weirdness_pct}%`,
    `Audio Weight / Seed Influence: ${card.audio_weight_pct}%`
  ].join('\n');
}

export function validateSunoLyrics(lyrics: string): {
  hasMetatags: boolean;
  metatagCount: number;
  tagsFound: string[];
} {
  if (!lyrics) {
    return { hasMetatags: false, metatagCount: 0, tagsFound: [] };
  }

  const regex = /\[(.*?)\]/g;
  const matches = lyrics.match(regex) || [];
  return {
    hasMetatags: matches.length > 0,
    metatagCount: matches.length,
    tagsFound: matches.map(m => m.trim())
  };
}
