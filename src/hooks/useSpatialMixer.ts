import { useState, useCallback, useRef, useEffect } from "react";
import type { Stem, SpatialMixerProject, ExportSettings } from "@/types/spatialMixer";
import { createDemoProject, xyToAngleDist } from "@/lib/spatialMixerUtils";
import { useWebAudioEngine } from "@/hooks/useWebAudioEngine";

export type MixerStatus = "idle" | "importing" | "analyzing" | "ready" | "playing" | "paused" | "exporting";

export function useSpatialMixer() {
  const [project, setProject]           = useState<SpatialMixerProject | null>(null);
  const [status, setStatus]             = useState<MixerStatus>("idle");
  const [selectedStemId, setSelectedStemId] = useState<string | null>(null);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [isPlaying, setIsPlaying]       = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStep, setAnalysisStep] = useState("");

  const rafRef      = useRef<number | null>(null);
  const durationRef = useRef(0);
  const engine      = useWebAudioEngine();

  const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    engine.dispose();
  }, []); // eslint-disable-line

  // ── Tick ─────────────────────────────────────────────────────────────────
  const startTick = useCallback(() => {
    const tick = () => {
      const t   = engine.getCurrentTime();
      const dur = durationRef.current;
      setPlaybackTime(Math.min(t, dur));
      if (t < dur) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        engine.stop();
        setIsPlaying(false);
        setStatus("ready");
        setPlaybackTime(0);
      }
    };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, [engine]);

  const stopTick = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  }, []);

  // ── loadDemo ──────────────────────────────────────────────────────────────
  const loadDemo = useCallback(() => {
    stopTick();
    engine.stop();
    const demo = createDemoProject();
    durationRef.current = demo.songDuration;
    setProject(demo);
    // Carica gli stem nell'engine — oscillatori demo
    engine.loadStems(demo.stems, undefined);
    setStatus("ready");
    setPlaybackTime(0);
    setIsPlaying(false);
    setSelectedStemId(null);
  }, [engine, stopTick]);

  // ── importFile ────────────────────────────────────────────────────────────
  const importFile = useCallback(async (file: File) => {
    stopTick();
    engine.stop();
    setStatus("importing");
    setAnalysisProgress(0);

    const steps = [
      { step: "Caricamento file…",      pct: 15 },
      { step: "Decodifica audio…",       pct: 35 },
      { step: "Analisi waveform…",       pct: 55 },
      { step: "Separazione stem (AI)…",  pct: 75 },
      { step: "Classificazione…",        pct: 90 },
      { step: "Costruzione mappa 3D…",   pct: 98 },
    ];

    const runSteps = async () => {
      for (const s of steps) {
        setStatus("analyzing");
        setAnalysisStep(s.step);
        setAnalysisProgress(s.pct);
        await delay(550);
      }
    };

    const decodeAudio = async (): Promise<AudioBuffer | null> => {
      try {
        const ab  = await file.arrayBuffer();
        const tmp = new AudioContext();
        const buf = await tmp.decodeAudioData(ab);
        tmp.close();
        return buf;
      } catch (e) {
        console.warn("[Mixer] decode failed", e);
        return null;
      }
    };

    const [, audioBuf] = await Promise.all([runSteps(), decodeAudio()]);

    const demo = createDemoProject();
    demo.songTitle  = file.name.replace(/\.[^.]+$/, "");
    demo.songArtist = "Importato";
    if (audioBuf) demo.songDuration = Math.floor(audioBuf.duration);

    durationRef.current = demo.songDuration;
    setProject(demo);
    engine.loadStems(demo.stems, audioBuf ?? undefined);
    setAnalysisProgress(100);
    setAnalysisStep("Fatto!");
    setStatus("ready");
    setPlaybackTime(0);
    setIsPlaying(false);
  }, [engine, stopTick]);

  // ── Transport ─────────────────────────────────────────────────────────────
  const play = useCallback(() => {
    if (!project) return;
    // Aggiorna snapshot degli stem nell'engine con i valori correnti di posizione
    engine.loadStems(project.stems, undefined);
    engine.play();
    setIsPlaying(true);
    setStatus("playing");
    startTick();
  }, [project, engine, startTick]);

  const pause = useCallback(() => {
    stopTick();
    engine.pause();
    setIsPlaying(false);
    setStatus("paused");
  }, [engine, stopTick]);

  const stop = useCallback(() => {
    stopTick();
    engine.stop();
    setIsPlaying(false);
    setPlaybackTime(0);
    setStatus(project ? "ready" : "idle");
  }, [project, engine, stopTick]);

  const seek = useCallback((sec: number) => {
    engine.seekTo(sec);
    setPlaybackTime(sec);
  }, [engine]);

  // ── Stem mutations ────────────────────────────────────────────────────────
  /**
   * updateStem — aggiorna lo stato React E i parametri audio in real-time.
   * Viene chiamato ad ogni drag del nodo nel radar.
   */
  const updateStem = useCallback((id: string, patch: Partial<Stem>) => {
    setProject(p => {
      if (!p) return p;
      const stems   = p.stems.map(s => s.id === id ? { ...s, ...patch } : s);
      const updated = stems.find(s => s.id === id);
      if (updated) engine.updateStemParams(updated); // ← aggiornamento audio immediato
      return { ...p, updatedAt: Date.now(), stems };
    });
  }, [engine]);

  const moveStem = useCallback((id: string, x: number, y: number) => {
    const { angle, distance } = xyToAngleDist(x, y);
    updateStem(id, { position: { x, y, angle, distance } });
  }, [updateStem]);

  const toggleMute = useCallback((id: string) => {
    setProject(p => {
      if (!p) return p;
      const stems   = p.stems.map(s => s.id === id ? { ...s, muted: !s.muted } : s);
      const updated = stems.find(s => s.id === id);
      if (updated) engine.updateStemParams(updated);
      return { ...p, stems };
    });
  }, [engine]);

  const toggleSolo = useCallback((id: string) => {
    setProject(p => {
      if (!p) return p;
      const t = p.stems.find(s => s.id === id);
      if (!t) return p;
      const wasAlone = t.soloed && !p.stems.some(s => s.id !== id && s.soloed);
      const stems = p.stems.map(s => ({
        ...s,
        soloed: wasAlone ? false : s.id === id,
        muted:  wasAlone ? false : s.id !== id,
      }));
      stems.forEach(s => engine.updateStemParams(s));
      return { ...p, stems };
    });
  }, [engine]);

  const resetStemPosition = useCallback((id: string) => {
    updateStem(id, { position: { x: 0, y: 0, angle: 0, distance: 0 } });
  }, [updateStem]);

  // ── Export ────────────────────────────────────────────────────────────────
  const exportMix = useCallback(async (settings: ExportSettings) => {
    if (!project) return;
    setStatus("exporting");
    try {
      const blob = await engine.exportWav(project.songDuration);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${project.songTitle}_spatial.${settings.format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("[Mixer] export error", e);
    } finally {
      setStatus("ready");
    }
  }, [project, engine]);

  const selectedStem = project?.stems.find(s => s.id === selectedStemId) ?? null;
  const progressPct  = project ? (playbackTime / project.songDuration) * 100 : 0;

  return {
    project, status, isPlaying, playbackTime, progressPct,
    analysisProgress, analysisStep, selectedStemId, selectedStem,
    loadDemo, importFile,
    play, pause, stop, seek,
    updateStem, moveStem, toggleMute, toggleSolo, resetStemPosition, exportMix,
    selectStem: setSelectedStemId,
  };
}
