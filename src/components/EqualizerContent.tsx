import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SlidersHorizontal, Zap, Music2, RotateCcw, Power,
  ChevronDown, Waves, Activity, Volume2, VolumeX, Gauge,
  Minus, TrendingUp, TrendingDown, Mic, Music, Radio, Headphones,
  Coffee, Sparkles, Guitar, ArrowUp, ArrowDown, Target,
  type LucideIcon,
} from "lucide-react";
import { usePlaybackState } from "@/hooks/useSpotify";
import { useToast } from "@/hooks/use-toast";

// ── Bande EQ ──────────────────────────────────────────────────────────────────
const EQ_BANDS = [
  { freq: 32,    label: "32",  type: "lowshelf"  as BiquadFilterType },
  { freq: 64,    label: "64",  type: "peaking"   as BiquadFilterType },
  { freq: 125,   label: "125", type: "peaking"   as BiquadFilterType },
  { freq: 250,   label: "250", type: "peaking"   as BiquadFilterType },
  { freq: 500,   label: "500", type: "peaking"   as BiquadFilterType },
  { freq: 1000,  label: "1k",  type: "peaking"   as BiquadFilterType },
  { freq: 2000,  label: "2k",  type: "peaking"   as BiquadFilterType },
  { freq: 4000,  label: "4k",  type: "peaking"   as BiquadFilterType },
  { freq: 8000,  label: "8k",  type: "peaking"   as BiquadFilterType },
  { freq: 16000, label: "16k", type: "highshelf" as BiquadFilterType },
];

// ── Preset ────────────────────────────────────────────────────────────────────
const PRESET_ICONS: Record<string, LucideIcon> = {
  flat: Minus, bass: Volume2, treble: TrendingUp,
  vocal: Mic, rock: Zap, jazz: Music,
  electronic: Radio, classical: Music2, hiphop: Headphones,
  lounge: Coffee, nightclub: Sparkles, acoustic: Guitar,
};

const PRESETS: Record<string, { name: string; gains: number[] }> = {
  flat:       { name: "Flat",         gains: [0,0,0,0,0,0,0,0,0,0] },
  bass:       { name: "Bass Boost",   gains: [6,5,4,2,0,0,0,0,0,0] },
  treble:     { name: "Treble Boost", gains: [0,0,0,0,0,1,2,4,5,6] },
  vocal:      { name: "Vocal",        gains: [-2,-1,0,2,4,4,3,2,0,-1] },
  rock:       { name: "Rock",         gains: [4,3,2,0,-1,-1,0,2,3,4] },
  jazz:       { name: "Jazz",         gains: [3,2,1,3,0,0,0,-1,-1,-2] },
  electronic: { name: "Electronic",   gains: [5,4,2,0,-1,-1,0,2,4,5] },
  classical:  { name: "Classical",    gains: [4,3,2,0,-1,-2,-1,0,2,3] },
  hiphop:     { name: "Hip-Hop",      gains: [5,4,3,1,-1,-1,0,1,2,3] },
  lounge:     { name: "Lounge",       gains: [-1,0,2,3,2,0,-1,-2,-2,-2] },
  nightclub:  { name: "Nightclub",    gains: [6,5,3,1,-1,-1,0,2,4,5] },
  acoustic:   { name: "Acoustic",     gains: [3,2,2,3,2,1,1,2,2,3] },
};

const BAND_COLORS = [
  "#ef4444","#f97316","#f59e0b","#eab308","#84cc16",
  "#22c55e","#14b8a6","#06b6d4","#3b82f6","#8b5cf6"
];

// ── Audio Engine — si aggancia all'elemento audio del Spotify SDK ──────────────
// Il Spotify Web Playback SDK crea internamente un HTMLAudioElement.
// Usiamo createMediaElementSource per agganciare la Web Audio API direttamente
// senza mic, senza screen capture, senza nessun permesso aggiuntivo.
class AudioEngine {
  ctx: AudioContext | null = null;
  source: MediaElementAudioSourceNode | null = null;
  filters: BiquadFilterNode[] = [];
  analyser: AnalyserNode | null = null;
  preGain: GainNode | null = null;
  compressor: DynamicsCompressorNode | null = null;
  gainNode: GainNode | null = null;
  audioEl: HTMLAudioElement | null = null;

  // Cerca l'elemento audio creato dal Spotify SDK nel DOM
  private findSpotifyAudioElement(): HTMLAudioElement | null {
    // Il SDK Spotify inietta un <audio> nel body
    const all = Array.from(document.querySelectorAll("audio")) as HTMLAudioElement[];
    // Prendi quello con src spotify o quello in riproduzione
    return (
      all.find(a => a.src?.includes("spotify") || (!a.paused && a.duration > 0)) ||
      all[0] ||
      null
    );
  }

  async init(): Promise<"ok" | "no_audio"> {
    if (this.ctx) return "ok";

    const audioEl = this.findSpotifyAudioElement();
    if (!audioEl) return "no_audio";

    this.audioEl = audioEl;
    this.ctx = new AudioContext({ sampleRate: 44100 });

    // Aggancia l'elemento audio esistente — nessun permesso necessario
    try {
      this.source = this.ctx.createMediaElementSource(audioEl);
    } catch {
      // Se l'elemento è già agganciato (es. doppio init), chiudi e riprova
      await this.ctx.close();
      this.ctx = null;
      return "no_audio";
    }

    this.preGain = this.ctx.createGain();
    this.preGain.gain.value = 1.0;

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;

    this.filters = EQ_BANDS.map(band => {
      const f = this.ctx!.createBiquadFilter();
      f.type = band.type;
      f.frequency.value = band.freq;
      f.Q.value = 1.4;
      f.gain.value = 0;
      return f;
    });

    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -12;
    this.compressor.knee.value = 6;
    this.compressor.ratio.value = 4;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;

    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = 1.0;

    // source → preGain → filters → analyser → compressor → gainNode → speakers
    this.source.connect(this.preGain);
    let prev: AudioNode = this.preGain;
    for (const f of this.filters) { prev.connect(f); prev = f; }
    prev.connect(this.analyser);
    this.analyser.connect(this.compressor);
    this.compressor.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);

    // Risveglia il context se sospeso (autoplay policy)
    if (this.ctx.state === "suspended") await this.ctx.resume();

    return "ok";
  }

  setGain(i: number, v: number) {
    if (this.filters[i] && this.ctx)
      this.filters[i].gain.setTargetAtTime(v, this.ctx.currentTime, 0.01);
  }
  setPreGain(v: number) {
    if (this.preGain && this.ctx)
      this.preGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.01);
  }
  setOutputGain(v: number) {
    if (this.gainNode && this.ctx)
      this.gainNode.gain.setTargetAtTime(v, this.ctx.currentTime, 0.01);
  }
  setCompressor(enabled: boolean, threshold: number, ratio: number) {
    if (!this.compressor) return;
    this.compressor.threshold.value = enabled ? threshold : 0;
    this.compressor.ratio.value = enabled ? ratio : 1;
  }
  getSpectrum(): Uint8Array {
    if (!this.analyser) return new Uint8Array(0);
    const d = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(d);
    return d;
  }
  getWaveform(): Uint8Array {
    if (!this.analyser) return new Uint8Array(0);
    const d = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(d);
    return d;
  }
  destroy() {
    // Stacca il source dal contesto ma riconnetti l'audio direttamente
    // così Spotify continua a suonare anche dopo aver disattivato l'EQ
    if (this.source && this.ctx) {
      try {
        this.source.connect(this.ctx.destination);
      } catch {}
    }
    this.ctx?.close();
    this.ctx = null;
    this.source = null;
    this.filters = [];
    this.analyser = null;
    this.preGain = null;
    this.compressor = null;
    this.gainNode = null;
  }
}

let engine: AudioEngine | null = null;

// ══════════════════════════════════════════════════════════════════════════════
export default function EqualizerContent() {
  const [gains, setGains]                   = useState<number[]>(Array(10).fill(0));
  const [preGain, setPreGain]               = useState(0);
  const [outputGain, setOutputGain]         = useState(0);
  const [compEnabled, setCompEnabled]       = useState(true);
  const [compThreshold, setCompThreshold]   = useState(-12);
  const [compRatio, setCompRatio]           = useState(4);
  const [activePreset, setActivePreset]     = useState("flat");
  const [isActive, setIsActive]             = useState(false);
  const [showPresets, setShowPresets]       = useState(false);
  const [viewMode, setViewMode]             = useState<"spectrum" | "waveform">("spectrum");
  const [dragging, setDragging]             = useState<number | null>(null);
  const [isInit, setIsInit]                 = useState(false);
  const [statusMsg, setStatusMsg]           = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const { toast } = useToast();
  const { data: pb } = usePlaybackState();
  const currentTrack = pb?.item;

  // Cleanup all'unmount
  useEffect(() => {
    return () => {
      engine?.destroy();
      engine = null;
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  // ── Attiva EQ ──────────────────────────────────────────────────────────────
  const toggleActive = useCallback(async () => {
    if (isActive) {
      engine?.destroy();
      engine = null;
      cancelAnimationFrame(animRef.current);
      setIsActive(false);
      setStatusMsg("");
      toast({ title: "Equalizzatore disattivato" });
      return;
    }

    setIsInit(true);
    setStatusMsg("Connessione al player…");

    try {
      engine = new AudioEngine();
      const result = await engine.init();

      if (result === "no_audio") {
        engine = null;
        setStatusMsg("Avvia una canzone su Spotify, poi premi di nuovo Attiva.");
        setIsInit(false);
        return;
      }

      // Applica i valori correnti
      gains.forEach((g, i) => engine!.setGain(i, g));
      engine.setPreGain(Math.pow(10, preGain / 20));
      engine.setOutputGain(Math.pow(10, outputGain / 20));
      engine.setCompressor(compEnabled, compThreshold, compRatio);

      setIsActive(true);
      setStatusMsg("");
      toast({ title: "✓ Equalizzatore attivo", description: "EQ collegato al player Spotify" });
    } catch (err: any) {
      engine = null;
      setStatusMsg("Errore: " + err.message);
    } finally {
      setIsInit(false);
    }
  }, [isActive, gains, preGain, outputGain, compEnabled, compThreshold, compRatio, toast]);

  // ── Preset ────────────────────────────────────────────────────────────────
  const applyPreset = useCallback((key: string) => {
    const p = PRESETS[key];
    if (!p) return;
    setGains([...p.gains]);
    setActivePreset(key);
    setShowPresets(false);
    p.gains.forEach((g, i) => engine?.setGain(i, g));
  }, []);

  // ── Banda singola ─────────────────────────────────────────────────────────
  const setBand = useCallback((i: number, v: number) => {
    const c = Math.max(-12, Math.min(12, v));
    setGains(g => { const n = [...g]; n[i] = c; return n; });
    engine?.setGain(i, c);
    setActivePreset("custom");
  }, []);

  // ── Reset ─────────────────────────────────────────────────────────────────
  const resetAll = useCallback(() => {
    applyPreset("flat");
    setPreGain(0);
    setOutputGain(0);
    setCompEnabled(true);
    setCompThreshold(-12);
    setCompRatio(4);
    engine?.setPreGain(1);
    engine?.setOutputGain(1);
    engine?.setCompressor(true, -12, 4);
  }, [applyPreset]);

  // ── Canvas ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width  = canvas.offsetWidth  * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      if (!isActive || !engine) {
        // Griglia idle
        ctx.strokeStyle = "rgba(255,255,255,0.04)";
        ctx.lineWidth = 1;
        for (let i = 1; i < 6; i++) {
          const y = (H / 6) * i;
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }
        ctx.fillStyle = "rgba(255,255,255,0.1)";
        ctx.font = `${11 * devicePixelRatio}px system-ui`;
        ctx.textAlign = "center";
        ctx.fillText("Attiva l'equalizzatore per vedere il segnale", W / 2, H / 2);
        return;
      }

      if (viewMode === "spectrum") {
        const data = engine.getSpectrum();
        const bars = Math.min(data.length / 2, 128);
        const bw = W / bars;
        for (let i = 0; i < bars; i++) {
          const v = data[i] / 255;
          const bh = v * H;
          const hue = 240 - (i / bars) * 200;
          const grad = ctx.createLinearGradient(0, H - bh, 0, H);
          grad.addColorStop(0, `hsla(${hue},80%,65%,0.9)`);
          grad.addColorStop(1, `hsla(${hue},80%,40%,0.4)`);
          ctx.fillStyle = grad;
          ctx.fillRect(i * bw + 1, H - bh, bw - 2, bh);
        }
      } else {
        const data = engine.getWaveform();
        ctx.strokeStyle = "hsl(217,91%,60%)";
        ctx.lineWidth = 2 * devicePixelRatio;
        ctx.shadowColor = "hsl(217,91%,60%)";
        ctx.shadowBlur = 6 * devicePixelRatio;
        ctx.beginPath();
        const step = W / data.length;
        for (let i = 0; i < data.length; i++) {
          const y = (data[i] / 255) * H;
          i === 0 ? ctx.moveTo(0, y) : ctx.lineTo(i * step, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    };

    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [isActive, viewMode]);

  // ── Drag slider ───────────────────────────────────────────────────────────
  const startDrag = (index: number, e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    const onMove = (ev: PointerEvent) => {
      const pct = 1 - Math.max(0, Math.min(1, (ev.clientY - rect.top) / rect.height));
      setBand(index, pct * 24 - 12);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setDragging(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    setDragging(index);
  };

  const btnColor = isActive
    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
    : "bg-secondary text-foreground hover:bg-secondary/80";

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 relative">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-3xl transition-all duration-1000 ${isActive ? "bg-primary/8" : "bg-primary/3"}`} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <SlidersHorizontal className="w-6 h-6 text-primary" />
              Equalizzatore
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {currentTrack
                ? `${currentTrack.name} — ${currentTrack.artists[0]?.name}`
                : "Nessuna traccia in riproduzione"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={resetAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-secondary hover:bg-secondary/80 transition-colors">
              <RotateCcw className="w-3.5 h-3.5" />Reset
            </button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={toggleActive} disabled={isInit}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${btnColor}`}>
              {isInit
                ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                    <Waves className="w-4 h-4" />
                  </motion.div>
                : <Power className="w-4 h-4" />
              }
              {isInit ? "Connessione…" : isActive ? "Attivo" : "Attiva"}
            </motion.button>
          </div>
        </div>

        {/* Messaggi di stato */}
        {!isActive && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="glass-surface rounded-xl p-4 flex items-start gap-3 border border-primary/20 bg-primary/5">
            <Zap className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground leading-relaxed space-y-1">
              {statusMsg
                ? <p className="text-amber-400">{statusMsg}</p>
                : <>
                    <p>Premi <strong className="text-foreground">Attiva</strong> per collegare l'EQ direttamente al player Spotify.</p>
                    <p className="text-xs opacity-70">Nessun microfono richiesto — l'audio viene processato internamente.</p>
                  </>
              }
            </div>
          </motion.div>
        )}

        {/* Visualizzatore */}
        <div className="glass-surface rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Analizzatore</span>
            <div className="flex gap-1">
              {([
                { id: "spectrum" as const, icon: <Activity className="w-3.5 h-3.5" />, label: "Spettro" },
                { id: "waveform" as const, icon: <Waves className="w-3.5 h-3.5" />,    label: "Forma d'onda" },
              ]).map(v => (
                <button key={v.id} onClick={() => setViewMode(v.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${viewMode === v.id ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  {v.icon}{v.label}
                </button>
              ))}
            </div>
          </div>
          <canvas ref={canvasRef} className="w-full h-28 md:h-36" />
        </div>

        {/* EQ 10 Bande */}
        <div className="glass-surface rounded-2xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Equalizzatore 10 Bande
            </span>
            <div className="relative">
              <button onClick={() => setShowPresets(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-secondary hover:bg-secondary/80 transition-colors">
                <Music2 className="w-3.5 h-3.5" />
                {activePreset === "custom" ? "Custom" : PRESETS[activePreset]?.name ?? "Preset"}
                <ChevronDown className={`w-3 h-3 transition-transform ${showPresets ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {showPresets && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.95 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-full mt-1 w-52 rounded-xl bg-card border border-border shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-0.5 p-1.5">
                      {Object.entries(PRESETS).map(([key, p]) => {
                        const Icon = PRESET_ICONS[key] ?? Minus;
                        return (
                          <button key={key} onClick={() => applyPreset(key)}
                            className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                              activePreset === key ? "bg-primary/20 text-primary" : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                            }`}>
                            <Icon className="w-3.5 h-3.5 shrink-0" />{p.name}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Slider verticali */}
          <div className="flex items-stretch justify-between gap-1 md:gap-3" style={{ height: "220px" }}>
            {EQ_BANDS.map((band, i) => {
              const gain = gains[i];
              const pct  = ((gain + 12) / 24) * 100;
              const col  = BAND_COLORS[i];
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
                  <span className="text-[10px] md:text-xs font-mono font-bold tabular-nums leading-none"
                    style={{ color: gain !== 0 ? col : "var(--muted-foreground)" }}>
                    {gain > 0 ? `+${Math.round(gain)}` : Math.round(gain)}
                  </span>
                  <div className="relative flex-1 w-full cursor-ns-resize touch-none select-none"
                    onPointerDown={e => startDrag(i, e)}>
                    <div className="absolute inset-0 flex justify-center">
                      <div className="w-1.5 h-full rounded-full bg-secondary/60" />
                    </div>
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-border/60" />
                    <div className="absolute left-1/2 -translate-x-1/2 w-1.5 rounded-full transition-none"
                      style={{
                        backgroundColor: col, opacity: 0.75,
                        bottom: gain >= 0 ? "50%" : `${pct}%`,
                        top:    gain <  0 ? "50%" : `${100 - pct}%`,
                      }}
                    />
                    <motion.div
                      className="absolute left-1/2 -translate-x-1/2 w-4 h-4 md:w-5 md:h-5 rounded-full border-2 z-10"
                      style={{
                        borderColor: col,
                        backgroundColor: dragging === i ? col : "hsl(var(--card))",
                        bottom: `calc(${pct}% - 10px)`,
                        boxShadow: dragging === i ? `0 0 10px ${col}90` : "none",
                      }}
                      whileHover={{ scale: 1.25 }}
                    />
                  </div>
                  <span className="text-[9px] md:text-[11px] text-muted-foreground font-medium leading-none">
                    {band.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground/40 mt-2 px-0.5">
            <span>-12dB</span><span>-6dB</span><span>0</span><span>+6dB</span><span>+12dB</span>
          </div>
        </div>

        {/* Pannello professionale */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Guadagni */}
          <div className="glass-surface rounded-2xl p-5 space-y-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5" />Guadagni
            </span>
            {[
              {
                label: "Pre-Gain", desc: "Amplificazione prima degli EQ",
                value: preGain, min: -12, max: 12, step: 0.5,
                fmt: (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)} dB`,
                set: (v: number) => { setPreGain(v); engine?.setPreGain(Math.pow(10, v / 20)); },
              },
              {
                label: "Output Gain", desc: "Volume master post-processing",
                value: outputGain, min: -12, max: 6, step: 0.5,
                fmt: (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)} dB`,
                set: (v: number) => { setOutputGain(v); engine?.setOutputGain(Math.pow(10, v / 20)); },
              },
            ].map(({ label, desc, value, min, max, step, fmt, set }) => (
              <div key={label} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">{label}</label>
                  <span className="text-xs font-mono text-primary tabular-nums">{fmt(value)}</span>
                </div>
                <input type="range" min={min} max={max} step={step} value={value}
                  onChange={e => set(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer accent-primary"
                  style={{ background: `linear-gradient(to right, hsl(var(--primary)) ${((value - min) / (max - min)) * 100}%, hsl(var(--secondary)) ${((value - min) / (max - min)) * 100}%)` }}
                />
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>

          {/* Compressore */}
          <div className="glass-surface rounded-2xl p-5 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Gauge className="w-3.5 h-3.5" />Compressore / Limiter
              </span>
              <button
                onClick={() => setCompEnabled(v => {
                  const n = !v;
                  engine?.setCompressor(n, compThreshold, compRatio);
                  return n;
                })}
                className={`w-11 h-6 rounded-full transition-colors duration-200 flex items-center px-0.5 ${compEnabled ? "bg-primary" : "bg-secondary"}`}>
                <motion.div className="w-5 h-5 rounded-full bg-white shadow"
                  animate={{ x: compEnabled ? 20 : 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }} />
              </button>
            </div>
            {[
              {
                label: "Threshold", desc: "Livello sopra cui inizia la compressione",
                value: compThreshold, min: -40, max: 0, step: 1,
                fmt: (v: number) => `${v} dB`,
                set: (v: number) => { setCompThreshold(v); engine?.setCompressor(compEnabled, v, compRatio); },
              },
              {
                label: "Ratio", desc: "Intensità della compressione",
                value: compRatio, min: 1, max: 20, step: 0.5,
                fmt: (v: number) => `${v}:1`,
                set: (v: number) => { setCompRatio(v); engine?.setCompressor(compEnabled, compThreshold, v); },
              },
            ].map(({ label, desc, value, min, max, step, fmt, set }) => (
              <div key={label} className={`space-y-1.5 ${!compEnabled ? "opacity-40" : ""}`}>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">{label}</label>
                  <span className="text-xs font-mono text-primary tabular-nums">{fmt(value)}</span>
                </div>
                <input type="range" min={min} max={max} step={step} value={value}
                  disabled={!compEnabled}
                  onChange={e => set(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer accent-primary disabled:cursor-default"
                  style={{ background: `linear-gradient(to right, hsl(var(--primary)) ${((value - min) / (max - min)) * 100}%, hsl(var(--secondary)) ${((value - min) / (max - min)) * 100}%)` }}
                />
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Regolazione rapida */}
        <div className="glass-surface rounded-2xl p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-3">
            Regolazione Rapida
          </span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {([
              { icon: Volume2,      label: "Bass +3dB",   fn: () => [0,1,2].forEach(i => setBand(i, gains[i] + 3)) },
              { icon: VolumeX,      label: "Bass −3dB",   fn: () => [0,1,2].forEach(i => setBand(i, gains[i] - 3)) },
              { icon: TrendingUp,   label: "Treble +3dB", fn: () => [7,8,9].forEach(i => setBand(i, gains[i] + 3)) },
              { icon: TrendingDown, label: "Treble −3dB", fn: () => [7,8,9].forEach(i => setBand(i, gains[i] - 3)) },
              { icon: Target,       label: "Mid +2dB",    fn: () => [4,5,6].forEach(i => setBand(i, gains[i] + 2)) },
              { icon: Target,       label: "Mid −2dB",    fn: () => [4,5,6].forEach(i => setBand(i, gains[i] - 2)) },
              { icon: ArrowUp,      label: "All +2dB",    fn: () => gains.forEach((g, i) => setBand(i, g + 2)) },
              { icon: ArrowDown,    label: "All −2dB",    fn: () => gains.forEach((g, i) => setBand(i, g - 2)) },
            ] as { icon: LucideIcon; label: string; fn: () => void }[]).map(({ icon: Icon, label, fn }) => (
              <button key={label} onClick={fn}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-secondary/50 hover:bg-secondary text-xs font-medium text-foreground transition-colors">
                <Icon className="w-3.5 h-3.5 shrink-0" />{label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
