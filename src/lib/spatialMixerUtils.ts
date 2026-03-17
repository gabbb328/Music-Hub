// ─── Neural Space Mixer – Demo Data & Helpers ────────────────────────────────
import type { Stem, StemCategory, SpatialMixerProject } from "@/types/spatialMixer";

export const STEM_COLORS: Record<StemCategory, string> = {
  vocals:        "#a78bfa",   // violet
  backing_vocals:"#c084fc",   // purple
  drums:         "#f87171",   // red
  bass:          "#fb923c",   // orange
  guitar:        "#facc15",   // yellow
  piano:         "#34d399",   // emerald
  synth:         "#22d3ee",   // cyan
  strings:       "#60a5fa",   // blue
  percussion:    "#f472b6",   // pink
  fx:            "#94a3b8",   // slate
  other:         "#a3e635",   // lime
};

export const STEM_ICONS: Record<StemCategory, string> = {
  vocals:        "Mic2",
  backing_vocals:"Mic",
  drums:         "Drum",
  bass:          "Music2",
  guitar:        "Guitar",
  piano:         "Piano",
  synth:         "Waves",
  strings:       "Violin",
  percussion:    "CircleDot",
  fx:            "Sparkles",
  other:         "Music",
};

// ─── Angle/distance <-> x,y helpers ─────────────────────────────────────────

export function positionFromAngleDist(angleDeg: number, distance: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180; // 0° = top
  return {
    x: Math.cos(rad) * distance,
    y: Math.sin(rad) * distance,
    angle: angleDeg,
    distance,
  };
}

export function xyToAngleDist(x: number, y: number) {
  const distance = Math.min(Math.sqrt(x * x + y * y), 1);
  const rad = Math.atan2(y, x);
  let angle = (rad * 180) / Math.PI + 90;
  if (angle < 0) angle += 360;
  if (angle >= 360) angle -= 360;
  return { angle, distance };
}

// ─── Spatial gain helpers ────────────────────────────────────────────────────

export function distanceToGain(distance: number): number {
  // Non-linear attenuation: 0 → full, 1 → ~−18 dB
  return Math.pow(1 - distance * 0.85, 2);
}

export function distanceToPanWidth(distance: number): number {
  // Further away = more centred (less width)
  return 1 - distance * 0.6;
}

export function distanceToReverb(distance: number, reverbSend: number): number {
  const roomSimulation = distance * 0.8;
  return Math.min(reverbSend + roomSimulation, 1);
}

export function angleToPan(angleDeg: number): number {
  // 0° top → 0 pan, 90° right → +1, 270° left → -1
  const normalised = ((angleDeg + 270) % 360) / 360; // shift so left=-1 right=+1
  return (normalised * 2 - 1);
}

// ─── Demo project factory ─────────────────────────────────────────────────────

export function createDemoStems(): Stem[] {
  const defs: Array<{ name: string; category: StemCategory; angleDeg: number; dist: number }> = [
    { name: "Lead Vocals",    category: "vocals",        angleDeg: 0,   dist: 0.25 },
    { name: "Backing Vox",   category: "backing_vocals", angleDeg: 335, dist: 0.55 },
    { name: "Drums",         category: "drums",          angleDeg: 180, dist: 0.35 },
    { name: "Bass",          category: "bass",           angleDeg: 195, dist: 0.4  },
    { name: "Electric Guitar",category: "guitar",        angleDeg: 75,  dist: 0.6  },
    { name: "Piano",         category: "piano",          angleDeg: 290, dist: 0.5  },
    { name: "Synth Pad",     category: "synth",          angleDeg: 45,  dist: 0.75 },
    { name: "Strings",       category: "strings",        angleDeg: 260, dist: 0.7  },
  ];

  return defs.map((d, i) => ({
    id: `stem-${i}`,
    name: d.name,
    category: d.category,
    color: STEM_COLORS[d.category],
    icon: STEM_ICONS[d.category],
    position: positionFromAngleDist(d.angleDeg, d.dist),
    volume: 0.8,
    pan: 0,
    stereoWidth: 1,
    reverbSend: 0.15,
    delaySend: 0,
    eq: { low: 0, mid: 0, high: 0 },
    hpf: 0,
    lpf: 0,
    muted: false,
    soloed: false,
    locked: false,
    waveformData: generateFakeWaveform(),
  }));
}

function generateFakeWaveform(): number[] {
  const bars = 60;
  return Array.from({ length: bars }, () => Math.random() * 0.7 + 0.1);
}

export function createDemoProject(): SpatialMixerProject {
  return {
    id: "demo-project",
    songTitle: "Demo Track",
    songArtist: "Neural Space Mixer",
    songCover: "",
    songDuration: 213,
    stems: createDemoStems(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
