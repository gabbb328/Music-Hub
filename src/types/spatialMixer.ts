// ─── Neural Space Mixer – Data Models ───────────────────────────────────────

export type StemCategory =
  | "vocals"
  | "backing_vocals"
  | "drums"
  | "bass"
  | "guitar"
  | "piano"
  | "synth"
  | "strings"
  | "percussion"
  | "fx"
  | "other";

export interface SpatialPosition {
  x: number;          // -1 … 1  (left/right in top-down view, normalised)
  y: number;          // -1 … 1  (far/near)
  angle: number;      // 0 … 360 degrees
  distance: number;   // 0 … 1  (0 = centre listener, 1 = room edge)
}

export interface StemEQ {
  low: number;   // -12 … +12 dB
  mid: number;
  high: number;
}

export interface Stem {
  id: string;
  name: string;
  category: StemCategory;
  color: string;
  icon: string;           // lucide icon name
  position: SpatialPosition;

  // Fader / routing
  volume: number;         // 0 … 1
  pan: number;            // -1 … 1
  stereoWidth: number;    // 0 … 2
  reverbSend: number;     // 0 … 1
  delaySend: number;      // 0 … 1
  eq: StemEQ;
  hpf: number;            // Hz  0 = off
  lpf: number;            // Hz  0 = off

  // State
  muted: boolean;
  soloed: boolean;
  locked: boolean;

  // Optional waveform preview (base64 or URL)
  waveformData?: number[];
}

export interface SpatialMixerProject {
  id: string;
  songTitle: string;
  songArtist: string;
  songCover?: string;
  songDuration: number;  // seconds
  songFileUri?: string;  // local file or object URL
  stems: Stem[];
  createdAt: number;
  updatedAt: number;
}

export interface ExportSettings {
  format: "wav" | "mp3";
  sampleRate: 44100 | 48000;
  bitrateMp3: 128 | 192 | 256 | 320;
  normalize: boolean;
  exportStems: boolean;
}

// ─── Engine interfaces (stubs – swap in real DSP later) ──────────────────────

export interface SourceSeparationEngine {
  separate(fileUri: string, mode: "4stem" | "6stem" | "advanced"): Promise<Stem[]>;
  cancel(): void;
  onProgress?: (step: string, pct: number) => void;
}

export interface SpatialAudioEngine {
  loadStems(stems: Stem[]): void;
  updateStem(id: string, params: Partial<Stem>): void;
  play(): void;
  pause(): void;
  stop(): void;
  seek(sec: number): void;
  getCurrentTime(): number;
  setMasterVolume(v: number): void;
  exportMix(settings: ExportSettings): Promise<Blob>;
  dispose(): void;
}
