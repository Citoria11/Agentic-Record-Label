import { TuneCorePackage } from '../types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateTuneCorePackage(pkg: Partial<TuneCorePackage>): ValidationResult {
  const errors: string[] = [];

  if (!pkg.release_title || pkg.release_title.trim().length === 0) {
    errors.push('Release title is required.');
  } else if (pkg.release_title.length > 100) {
    errors.push('Release title cannot exceed 100 characters.');
  }

  // TuneCore casing check: Don't allow all caps unless short acronym
  if (pkg.release_title && pkg.release_title.length > 5 && pkg.release_title === pkg.release_title.toUpperCase()) {
    errors.push('Title must use standard casing (all-caps titles are rejected by DSPs).');
  }

  if (!pkg.artist_name || pkg.artist_name.trim().length === 0) {
    errors.push('Artist name is required.');
  }

  if (!pkg.primary_genre || pkg.primary_genre.trim().length === 0) {
    errors.push('Primary genre is required.');
  }

  if (!pkg.c_line || !pkg.c_line.includes('(C)') && !pkg.c_line.includes('©')) {
    errors.push('C-Line must include copyright notice (e.g., "(C) 2026 Arcana Records").');
  }

  if (!pkg.p_line || !pkg.p_line.includes('(P)') && !pkg.p_line.includes('℗')) {
    errors.push('P-Line must include phonogram notice (e.g., "(P) 2026 Arcana Records").');
  }

  if (typeof pkg.tiktok_clip_start_seconds !== 'number' || pkg.tiktok_clip_start_seconds < 0 || pkg.tiktok_clip_start_seconds > 180) {
    errors.push('TikTok clip start time must be between 0 and 180 seconds.');
  }

  if (!pkg.cover_art_prompt_3000x3000 || pkg.cover_art_prompt_3000x3000.length < 10) {
    errors.push('A high-resolution 3000x3000 cover art prompt is required.');
  }

  if (!Array.isArray(pkg.marketing_14_day_rollout) || pkg.marketing_14_day_rollout.length < 3) {
    errors.push('Marketing rollout plan must have at least 3 planned content days.');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function formatTuneCoreExport(pkg: TuneCorePackage): string {
  return [
    `=== TUNECORE METADATA SPECIFICATION ===`,
    `Release Title: ${pkg.release_title}`,
    `Artist: ${pkg.artist_name}`,
    `Primary Genre: ${pkg.primary_genre}`,
    `Secondary Genre: ${pkg.secondary_genre}`,
    `Language: ${pkg.language}`,
    `Explicit Lyrics: ${pkg.explicit_flag ? 'YES' : 'NO'}`,
    `Copyright (C) Line: ${pkg.c_line}`,
    `Phonogram (P) Line: ${pkg.p_line}`,
    `UPC/EAN: ${pkg.upc_ean || 'Auto-assign by TuneCore'}`,
    `ISRC: ${pkg.isrc || 'Auto-assign by TuneCore'}`,
    `TikTok / Short-form Clip Start: ${pkg.tiktok_clip_start_seconds}s`,
    ``,
    `=== 3000x3000 COVER ART DIRECTION ===`,
    pkg.cover_art_prompt_3000x3000,
    ``,
    `=== 14-DAY MARKETING & SOCIAL ROLLOUT ===`,
    ...pkg.marketing_14_day_rollout.map(
      (d) => `Day ${d.day} [${d.platform}]: "${d.content_hook}" (Audio: ${d.audio_snippet})`
    )
  ].join('\n');
}
