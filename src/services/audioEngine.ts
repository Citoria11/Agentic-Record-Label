import * as Tone from 'tone';
import audioBufferToWav from 'audiobuffer-to-wav';
import { NoteEvent } from '../types';

export class AudioEngine {
  private static isToneStarted = false;
  private static synth: Tone.PolySynth | null = null;
  private static bassSynth: Tone.MonoSynth | null = null;
  private static reverb: Tone.Reverb | null = null;
  private static part: Tone.Part | null = null;
  private static isPlaying = false;
  private static onNoteHighlightCallback: ((noteIndex: number | null) => void) | null = null;

  public static async init() {
    if (Tone.context.state !== 'running') {
      await Tone.start();
      await Tone.context.resume();
      this.isToneStarted = true;
    }

    if (!this.synth) {
      this.reverb = new Tone.Reverb({
        decay: 2.5,
        preDelay: 0.01,
        wet: 0.3
      }).toDestination();
      await this.reverb.generate();

      this.synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: {
          attack: 0.02,
          decay: 0.2,
          sustain: 0.3,
          release: 0.8
        }
      }).connect(this.reverb);

      this.bassSynth = new Tone.MonoSynth({
        oscillator: { type: 'sawtooth' },
        envelope: {
          attack: 0.01,
          decay: 0.3,
          sustain: 0.4,
          release: 0.4
        },
        filterEnvelope: {
          attack: 0.01,
          decay: 0.2,
          sustain: 0.2,
          release: 0.4,
          baseFrequency: 80,
          octaves: 2.5
        }
      }).toDestination();
    }
  }

  public static setNoteHighlightCallback(cb: (noteIndex: number | null) => void) {
    this.onNoteHighlightCallback = cb;
  }

  public static async playSequence(notes: NoteEvent[], bpm: number = 120, loop: boolean = true) {
    // Ensure audio context is started directly inside user gesture
    await this.init();
    this.stopSequence();

    Tone.getTransport().bpm.value = bpm;
    Tone.getTransport().cancel();

    // Map notes into Tone events
    const events = notes.map((item, idx) => ({
      time: item.time,
      note: item.note,
      duration: item.duration || '4n',
      instrument: item.instrument || 'synth',
      idx
    }));

    // Calculate total loop duration across 4 bars (time spans 0 to 3.75, so loop length is 4.0 beats/measures)
    const maxTime = Math.max(...notes.map(n => n.time), 3.75);
    const loopDuration = Math.max(Math.ceil(maxTime + 0.25), 4.0);

    this.part = new Tone.Part((time, value) => {
      if (value.instrument === 'bass' && this.bassSynth) {
        this.bassSynth.triggerAttackRelease(value.note, value.duration, time);
      } else if (this.synth) {
        this.synth.triggerAttackRelease(value.note, value.duration, time);
      }

      // Schedule UI animation highlight on piano roll
      Tone.getDraw().schedule(() => {
        if (this.onNoteHighlightCallback) {
          this.onNoteHighlightCallback(value.idx);
        }
      }, time);
    }, events);

    this.part.loop = loop;
    this.part.loopEnd = `${loopDuration}m`;
    this.part.start(0);

    Tone.getTransport().start();
    this.isPlaying = true;
  }

  public static stopSequence() {
    if (this.part) {
      this.part.stop();
      this.part.dispose();
      this.part = null;
    }
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
    this.isPlaying = false;
    if (this.onNoteHighlightCallback) {
      this.onNoteHighlightCallback(null);
    }
  }

  public static getPlaybackState() {
    return this.isPlaying;
  }

  public static async playSingleNote(note: string, duration: string = '8n', instrument: string = 'synth') {
    await this.init();
    if (instrument === 'bass' && this.bassSynth) {
      this.bassSynth.triggerAttackRelease(note, duration);
    } else if (this.synth) {
      this.synth.triggerAttackRelease(note, duration);
    }
  }

  /**
   * Generates a pristine stereo WAV audio file buffer offline and returns a downloadable Blob URL.
   * Supports exporting 4-bar or 8-bar loop iterations.
   */
  public static async exportSequenceToWav(
    notes: NoteEvent[],
    bpm: number = 120,
    title: string = 'Arcana_Seed',
    loopBars: 4 | 8 = 4
  ): Promise<{ blob: Blob; url: string; fileName: string }> {
    // 4 bars at 4/4 time = 16 quarter notes. In seconds: 16 * (60 / bpm). For 8 bars: 32 * (60 / bpm).
    const secondsPerMeasure = (4 * 60) / bpm;
    const renderDurationSeconds = loopBars * secondsPerMeasure;

    const renderedBuffer = await Tone.Offline(async () => {
      const offlineReverb = new Tone.Reverb({
        decay: 2.2,
        preDelay: 0.01,
        wet: 0.28
      }).toDestination();
      await offlineReverb.generate();

      const poly = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: {
          attack: 0.02,
          decay: 0.2,
          sustain: 0.35,
          release: 0.8
        }
      }).connect(offlineReverb);

      const bass = new Tone.MonoSynth({
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.4 },
        filterEnvelope: {
          attack: 0.01,
          decay: 0.2,
          sustain: 0.2,
          release: 0.4,
          baseFrequency: 80,
          octaves: 2.5
        }
      }).toDestination();

      Tone.getTransport().bpm.value = bpm;

      // Repeat notes if loopBars is 8
      const repeats = loopBars === 8 ? 2 : 1;
      const measureOffsetSeconds = 4 * (60 / bpm); // 4 bars = 1 iteration

      for (let r = 0; r < repeats; r++) {
        const loopOffset = r * measureOffsetSeconds * 4;
        notes.forEach((item) => {
          const timeInSeconds = loopOffset + item.time * (60 / bpm) * 4;
          if (item.instrument === 'bass') {
            bass.triggerAttackRelease(item.note, item.duration || '4n', timeInSeconds);
          } else {
            poly.triggerAttackRelease(item.note, item.duration || '4n', timeInSeconds);
          }
        });
      }
    }, renderDurationSeconds);

    // Convert AudioBuffer to WAV ArrayBuffer using audiobuffer-to-wav
    const wavArrayBuffer = audioBufferToWav(renderedBuffer.get() as any);
    const blob = new Blob([wavArrayBuffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const cleanTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${cleanTitle}_${bpm}BPM_${loopBars}Bar_SunoSeed.wav`;

    return { blob, url, fileName };
  }
}
