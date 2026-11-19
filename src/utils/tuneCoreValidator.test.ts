import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTuneCorePackage } from './tuneCoreValidator';
import { formatSunoPromptCard, validateSunoLyrics } from './sunoPromptFormatter';

test('validateTuneCorePackage catches all caps titles and missing C-Line', () => {
  const badPkg = {
    release_title: 'ALL CAPS TITLE IS REJECTED',
    artist_name: 'Nova Vox',
    primary_genre: 'Electronic',
    c_line: 'No copyright mark here',
    p_line: '(P) 2026 Arcana Records',
    tiktok_clip_start_seconds: 45,
    cover_art_prompt_3000x3000: 'A cool neon sphere',
    marketing_14_day_rollout: []
  };

  const res = validateTuneCorePackage(badPkg as any);
  assert.equal(res.valid, false);
  assert.ok(res.errors.some(e => e.includes('casing')));
  assert.ok(res.errors.some(e => e.includes('C-Line')));
  assert.ok(res.errors.some(e => e.includes('at least 3 planned content days')));
});

test('validateTuneCorePackage accepts compliant distribution package', () => {
  const goodPkg = {
    release_title: 'Midnight Frequency',
    artist_name: 'The Glitch Trio',
    primary_genre: 'Electronic / Synthwave',
    secondary_genre: 'Cyberpunk Lo-fi',
    language: 'English',
    explicit_flag: false,
    c_line: '(C) 2026 Arcana Records',
    p_line: '(P) 2026 Arcana Records',
    upc_ean: '198273645123',
    isrc: 'US-ARC-26-00101',
    tiktok_clip_start_seconds: 52,
    cover_art_prompt_3000x3000: 'High resolution isometric cyberpunk record label workstation, 8k synthwave',
    marketing_14_day_rollout: [
      { day: 1, platform: 'TikTok' as const, content_hook: 'Behind the beat in Studio A', audio_snippet: 'Drop at 0:52', caption_hashtags: '#synthwave' },
      { day: 2, platform: 'Instagram Reels' as const, content_hook: 'Lyra lyric reveal', audio_snippet: 'Chorus harmony', caption_hashtags: '#indiemusic' },
      { day: 3, platform: 'Spotify Canvas' as const, content_hook: 'Looped visual', audio_snippet: 'Main hook', caption_hashtags: '#newmusic' }
    ]
  };

  const res = validateTuneCorePackage(goodPkg);
  assert.equal(res.valid, true);
  assert.equal(res.errors.length, 0);
});

test('validateSunoLyrics checks structural and vocal metatags', () => {
  const lyricSample = `
[Intro - Atmospheric Synth Swell]
Static in the dark, frequencies ignite.

[Verse 1 - Palm Muted]
Tracing wire circuits down the avenue.
Midnight pulses keep the signal true.

[Chorus - Stacked Harmonies]
We are the ghost in the machine,
Breathing electric between the screens!

[Outro - Fade Out]
Digital heartbeat fades.
  `;

  const meta = validateSunoLyrics(lyricSample);
  assert.equal(meta.hasMetatags, true);
  assert.equal(meta.metatagCount, 4);
  assert.ok(meta.tagsFound.includes('[Intro - Atmospheric Synth Swell]'));
  assert.ok(meta.tagsFound.includes('[Chorus - Stacked Harmonies]'));
});

test('formatSunoPromptCard formats parameters cleanly', () => {
  const card = {
    style_prompt: 'dark synthwave, analog juno-106, french electro bass, driving 124 bpm',
    exclude_styles: 'acoustic guitar, country, slow, muddy',
    weirdness_pct: 35,
    audio_weight_pct: 80,
    model_version: 'v4',
    bpm: 124,
    key: 'F#m',
    chords: ['F#m', 'D', 'A', 'E']
  };

  const formatted = formatSunoPromptCard(card);
  assert.ok(formatted.includes('Suno v4'));
  assert.ok(formatted.includes('Key: F#m | BPM: 124'));
  assert.ok(formatted.includes('Progression: F#m - D - A - E'));
  assert.ok(formatted.includes('Weirdness: 35%'));
  assert.ok(formatted.includes('Audio Weight / Seed Influence: 80%'));
});
