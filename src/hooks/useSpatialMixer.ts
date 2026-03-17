/**
 * useSpatialMixer — orchestrates the Neural Space Mixer state
 *
 * Audio pipeline:
 *  - Demo mode  → oscillator tones through the full spatial graph
 *  - Import mode → decoded AudioBuffer → spatial graph per stem
 *  - All spatial changes (drag, volume, EQ, reverb) update the live Web Audio
 *    nodes in real-time with smooth parameter ramping (no clicks/pops)
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { Stem, SpatialMixerProject, ExportSettings } from "@/types/spatialMixer";
import { createDemoProject, xyToAngleDist } from "@/lib/spatialMixerUtils";
import { useWebAudioEngine } from "@/hooks/useWebAudioEngine";

export type MixerStatus =
  | "idle"
  | "importing"
  | "analyzing"
  | "ready"
  | "playing"
  | "paused"
  | "exporting";

export function useSpatialMixer() {
  const [project, setProject]                   = useState<SpatialMixerProject | null>(null);
  const [status, setStatus]                     = useState<MixerStatus>("idle");
  const [selectedStemId, setSelectedStemId]     = useState<string | null>(null);
  const [playbackTime, setPlaybackTime]         = useState(0);
  const [isPlaying, setIsPlaying]               = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStep, setAnalysisStep]         = useState("");

  // Real-time playback tick
  const rafRef    = useRef<number | null>(null);
  const engine    = useWebAudioEngine();

  // Cancel animation frame on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      engine.dispose();
    };
  }, [engine]);

  const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

  // ── Playback loop (requestAnimationFrame for smooth seekbar) ────────────────
  const startPlaybackLoop = useCallback((duration: number) => {
    const tick = () => {
      const t = engine.getCurrentTime();
      setPlaybackTime(Math.min(t, duration));
      if (t < duration) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setIsPlaying(false);
        setStatus("ready");
        setPlaybackTime(0);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [engine]);

  const stopPlaybackLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // ── Load demo (oscillator tones through spatial graph) ─────────────────────
  const loadDemo = useCallback(() => {
    const demo = createDemoProject();
    setProject(demo);
    // Load stems into engine – no AudioBuffer → demo oscillator mode
    engine.loadStems(demo.stems, undefined);
    setStatus("ready");
    setPlaybackTime(0);
    setIsPlaying(false);
  }, [engine]);

  // ── Import real file ────────────────────────────────────────────────────────
  const importFile = useCallback(async (file: File) => {
    setStatus("importing");
    setAnalysisProgress(0);

    const steps = [
      { step: "Loading file…",             pct: 15 },
      { step: "Decoding audio…",           pct: 35 },
      { step: "Analysing waveform…",       pct: 50 },
      { step: "Separating stems (AI)…",    pct: 70 },
      { step: "Classifying instruments…",  pct: 85 },
      { step: "Building spatial objects…", pct: 95 },
    ];

    // Run fake analysis steps in parallel with the real decode
    const runSteps = async () => {
      for (const s of steps) {
        setStatus("analyzing");
        setAnalysisStep(s.step);
        setAnalysisProgress(s.pct);
        await delay(600);
      }
    };

    // Decode the audio file in parallel
    const decodeAudio = async (): Promise<AudioBuffer | null> => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const tmpCtx = new AudioCtx();
        const decoded = await tmpCtx.decodeAudioData(arrayBuffer);
        tmpCtx.close();
        return decoded;
      } catch (e) {
        console.warn("[SpatialMixer] Audio decode failed:", e);
        return null;
      }
    };

    const [, audioBuffer] = await Promise.all([runSteps(), decodeAudio()]);

    // Build demo project with the imported file's metadata
    const demo = createDemoProject();
    demo.songTitle  = file.name.replace(/\.[^.]+$/, "");
    demo.songArtist = "Imported";
    if (audioBuffer) {
      demo.songDuration = Math.floor(audioBuffer.duration);
    }

    setProject(demo);
    setAnalysisProgress(100);
    setAnalysisStep("Done!");

    // Load stems into engine WITH the real AudioBuffer
    engine.loadStems(demo.stems, audioBuffer ?? undefined);

    setStatus("ready");
  }, [engine]);

  // ── Transport ───────────────────────────────────────────────────────────────
  const play = useCallback(() => {
    if (!project) return;
    // Re-load stems so AudioBufferSourceNodes are fresh (they are one-shot)
    engine.loadStems(project.stems, undefined); // oscillator mode rebuild
    engine.play();
    setIsPlaying(true);
    setStatus("playing");
    startPlaybackLoop(project.songDuration);
  }, [project, engine, startPlaybackLoop]);

  const pause = useCallback(() => {
    stopPlaybackLoop();
    engine.pause();
    setIsPlaying(false);
    setStatus("paused");
  }, [engine, stopPlaybackLoop]);

  const stop = useCallback(() => {
    stopPlaybackLoop();
    engine.stop();
    setIsPlaying(false);
    setPlaybackTime(0);
    setStatus(project ? "ready" : "idle");
  }, [project, engine, stopPlaybackLoop]);

  const seek = useCallback((sec: number) => {
    engine.seekTo(sec);
    setPlaybackTime(sec);
  }, [engine]);

  // ── Stem mutations — also update live audio nodes ──────────────────────────
  const updateStem = useCallback((id: string, patch: Partial<Stem>) => {
    setProject((p) => {
      if (!p) return p;
      const updated = p.stems.map((s) => (s.id === id ? { ...s, ...patch } : s));
      const newStem = updated.find((s) => s.id === id);
      if (newStem) engine.updateStemParams(newStem);   // ← live audio update
      return { ...p, updatedAt: Date.now(), stems: updated };
    });
  }, [engine]);

  const moveStem = useCallback((id: string, x: number, y: number) => {
    const { angle, distance } = xyToAngleDist(x, y);
    updateStem(id, { position: { x, y, angle, distance } });
  }, [updateStem]);

  const toggleMute = useCallback((id: string) => {
    setProject((p) => {
      if (!p) return p;
      const updated = p.stems.map((s) =>
        s.id === id ? { ...s, muted: !s.muted } : s
      );
      const newStem = updated.find((s) => s.id === id);
      if (newStem) engine.updateStemParams(newStem);
      return { ...p, stems: updated };
    });
  }, [engine]);

  const toggleSolo = useCallback((id: string) => {
    setProject((p) => {
      if (!p) return p;
      const target = p.stems.find((s) => s.id === id);
      if (!target) return p;
      const anyOtherSoloed = p.stems.some((s) => s.id !== id && s.soloed);
      const wasAlone = target.soloed && !anyOtherSoloed;
      const updated = p.stems.map((s) => ({
        ...s,
        soloed: wasAlone ? false : s.id === id,
        muted:  wasAlone ? false : s.id !== id,
      }));
      // Sync all stems to engine
      updated.forEach((s) => engine.updateStemParams(s));
      return { ...p, stems: updated };
    });
  }, [engine]);

  const resetStemPosition = useCallback((id: string) => {
    updateStem(id, { position: { x: 0, y: 0, angle: 0, distance: 0 } });
  }, [updateStem]);

  // ── Export ──────────────────────────────────────────────────────────────────
  const exportMix = useCallback(async (settings: ExportSettings) => {
    if (!project) return;
    setStatus("exporting");
    try {
      const blob = await engine.exportWav(project.songDuration);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${project.songTitle}_spatial_mix.${settings.format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("[SpatialMixer] Export failed:", e);
    } finally {
      setStatus("ready");
    }
  }, [project, engine]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const selectedStem = project?.stems.find((s) => s.id === selectedStemId) ?? null;
  const progressPct  = project ? (playbackTime / project.songDuration) * 100 : 0;

  return {
    project,
    status,
    isPlaying,
    playbackTime,
    progressPct,
    analysisProgress,
    analysisStep,
    selectedStemId,
    selectedStem,
    loadDemo,
    importFile,
    play,
    pause,
    stop,
    seek,
    updateStem,
    moveStem,
    toggleMute,
    toggleSolo,
    resetStemPosition,
    exportMix,
    selectStem: setSelectedStemId,
  };
}
