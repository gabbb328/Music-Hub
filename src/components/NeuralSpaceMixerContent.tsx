import React, { useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Play, Pause, Square, Download, Layers,
  Sparkles, Info, RotateCcw, X,
  Volume2, VolumeX, Zap, ZapOff, Music,
} from "lucide-react";
import { useSpatialMixer } from "@/hooks/useSpatialMixer";
import SpatialRoomView from "@/components/SpatialRoomView";
import { formatTime } from "@/lib/mock-data";
import type { ExportSettings, Stem } from "@/types/spatialMixer";

export default function NeuralSpaceMixerContent() {
  const mixer       = useSpatialMixer();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    e.target.value = "";
    await mixer.importFile(f);
  }, [mixer]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) await mixer.importFile(f);
  }, [mixer]);

  const doExport = (format: "wav" | "mp3") => {
    setShowExport(false);
    mixer.exportMix({ format, sampleRate: 44100, bitrateMp3: 320, normalize: true, exportStems: false });
  };

  // ── IDLE ──────────────────────────────────────────────────────────────────
  if (mixer.status === "idle") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-5 overflow-y-auto">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-500/30">
              <Layers className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Neural Space Mixer
          </h1>
          <p className="text-muted-foreground text-xs leading-relaxed max-w-xs mx-auto">
            Importa un brano e posiziona ogni strumento nello spazio 3D.
            Trascina i nodi per sentirli da punti diversi.
          </p>
        </div>

        <div
          onDrop={handleDrop} onDragOver={e => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="w-full max-w-sm border-2 border-dashed border-indigo-500/40 rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-indigo-500/70 hover:bg-indigo-500/5 transition-all"
        >
          <Upload className="w-8 h-8 text-indigo-400" />
          <div className="text-center">
            <p className="font-semibold text-sm">Tocca per importare</p>
            <p className="text-xs text-muted-foreground mt-0.5">MP3 · WAV · FLAC · M4A</p>
          </div>
          <input ref={fileInputRef} type="file" accept=".mp3,.wav,.flac,.m4a,audio/*" className="hidden" onChange={handleFile} />
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <span className="text-xs text-muted-foreground">oppure prova la demo</span>
          <motion.button
            whileTap={{ scale: 0.95 }} onClick={mixer.loadDemo}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm shadow-lg min-h-[48px]"
          >
            <Sparkles className="w-4 h-4" /> Carica Demo (8 note live)
          </motion.button>
        </div>

        <div className="flex items-start gap-2 max-w-sm text-xs text-muted-foreground bg-secondary/40 rounded-xl p-3">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
          <span>
            Nella demo senti 8 note musicali distinte — trascinale e senti come cambiano posizione, volume e riverbero in tempo reale.
          </span>
        </div>
      </div>
    );
  }

  // ── ANALYZING ─────────────────────────────────────────────────────────────
  if (mixer.status === "importing" || mixer.status === "analyzing") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-5 p-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-xl animate-pulse">
          <Layers className="w-7 h-7 text-white" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold">Analisi in corso…</h2>
          <p className="text-sm text-muted-foreground">{mixer.analysisStep}</p>
        </div>
        <div className="w-full max-w-xs bg-secondary/50 rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
            animate={{ width: `${mixer.analysisProgress}%` }}
            transition={{ ease: "easeOut", duration: 0.4 }}
          />
        </div>
        <p className="text-xs text-muted-foreground">{mixer.analysisProgress}%</p>
      </div>
    );
  }

  if (mixer.status === "exporting") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-xl animate-bounce">
          <Download className="w-7 h-7 text-white" />
        </div>
        <p className="font-semibold">Rendering mix…</p>
      </div>
    );
  }

  // ── MAIN MIXER ────────────────────────────────────────────────────────────
  const project  = mixer.project!;
  const duration = project.songDuration;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">

      {/* ── TOP BAR ── */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50 bg-card/60 backdrop-blur-xl shrink-0 z-10">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0">
          <Layers className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate">{project.songTitle}</p>
          <p className="text-[10px] text-muted-foreground">{project.songArtist}</p>
        </div>

        {/* Transport */}
        <button onClick={mixer.stop} className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60">
          <Square className="w-4 h-4 fill-current" />
        </button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={mixer.isPlaying ? mixer.pause : mixer.play}
          className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center shrink-0"
        >
          {mixer.isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
        </motion.button>

        {/* Export */}
        <div className="relative shrink-0">
          <button onClick={() => setShowExport(v => !v)}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-indigo-600/80 text-white hover:bg-indigo-500">
            <Download className="w-4 h-4" />
          </button>
          <AnimatePresence>
            {showExport && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden min-w-[80px]">
                {(["wav","mp3"] as const).map(fmt => (
                  <button key={fmt} onClick={() => doExport(fmt)}
                    className="block w-full px-4 py-2.5 text-xs font-semibold uppercase hover:bg-secondary/60 text-left">
                    {fmt}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reset */}
        <button onClick={mixer.loadDemo} title="Nuova demo"
          className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 shrink-0">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* ── SEEK BAR ── */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-card/40 shrink-0 border-b border-border/30 z-10">
        <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">{formatTime(Math.floor(mixer.playbackTime))}</span>
        <input type="range" min={0} max={duration || 1} step={0.1} value={mixer.playbackTime}
          onChange={e => mixer.seek(Number(e.target.value))}
          className="flex-1 h-1.5 accent-indigo-500 cursor-pointer" />
        <span className="text-[10px] text-muted-foreground tabular-nums w-8">{formatTime(duration)}</span>
      </div>

      {/* ── ROOM VIEW ── */}
      <div className="flex-1 flex items-center justify-center bg-[#070c1a] overflow-hidden min-h-0 p-3">
        <SpatialRoomView
          stems={project.stems}
          selectedId={mixer.selectedStemId}
          onSelect={id => { mixer.selectStem(id); setShowDetail(true); }}
          onMove={mixer.moveStem}
        />
      </div>

      {/* ── STEM STRIP ── */}
      <StemStrip
        stems={project.stems}
        selectedId={mixer.selectedStemId}
        onSelect={id => { mixer.selectStem(id); setShowDetail(true); }}
        onToggleMute={mixer.toggleMute}
        onToggleSolo={mixer.toggleSolo}
        onVolumeChange={(id, v) => mixer.updateStem(id, { volume: v })}
      />

      {/* ── DETAIL BOTTOM SHEET ── */}
      <AnimatePresence>
        {showDetail && mixer.selectedStem && (
          <StemDetailSheet
            stem={mixer.selectedStem}
            onClose={() => setShowDetail(false)}
            onUpdate={mixer.updateStem}
            onReset={mixer.resetStemPosition}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Stem strip ───────────────────────────────────────────────────────────────
function StemStrip({ stems, selectedId, onSelect, onToggleMute, onToggleSolo, onVolumeChange }: {
  stems: Stem[]; selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleMute: (id: string) => void;
  onToggleSolo: (id: string) => void;
  onVolumeChange: (id: string, v: number) => void;
}) {
  return (
    <div className="h-[130px] shrink-0 border-t border-border/40 bg-card/50 backdrop-blur-xl overflow-x-auto overflow-y-hidden">
      <div className="flex gap-2 px-3 py-2 h-full" style={{ minWidth: "max-content" }}>
        {stems.map(stem => {
          const isSel = selectedId === stem.id;
          const col   = stem.color;
          return (
            <div key={stem.id} onClick={() => onSelect(stem.id)}
              className="w-[108px] shrink-0 flex flex-col gap-1.5 rounded-xl p-2 cursor-pointer select-none transition-transform active:scale-95"
              style={{
                background: isSel ? `${col}1a` : "rgba(10,15,35,0.85)",
                border: `1.5px solid ${isSel ? col + "88" : "rgba(99,102,241,0.12)"}`,
              }}
            >
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-md shrink-0 flex items-center justify-center" style={{ background: col + "25" }}>
                  <Music className="w-3 h-3" style={{ color: col }} />
                </div>
                <span className="text-[10px] font-semibold truncate" style={{ color: stem.muted ? "#475569" : "#e2e8f0" }}>
                  {stem.name}
                </span>
              </div>

              {stem.waveformData && stem.waveformData.length > 0 && (
                <div className="flex items-end gap-px h-[18px]">
                  {stem.waveformData.slice(0, 26).map((v, i) => (
                    <div key={i} className="flex-1 rounded-sm"
                      style={{ height: `${Math.max(8, v * 100)}%`, background: stem.muted ? "#334155" : col + "77", minWidth: 2 }} />
                  ))}
                </div>
              )}

              <input type="range" min={0} max={100} value={Math.round(stem.volume * 100)}
                onClick={e => e.stopPropagation()}
                onChange={e => { e.stopPropagation(); onVolumeChange(stem.id, Number(e.target.value) / 100); }}
                className="w-full h-1 rounded appearance-none cursor-pointer"
                style={{ background: `linear-gradient(to right, ${col} ${stem.volume * 100}%, rgba(100,116,139,0.25) ${stem.volume * 100}%)` }}
              />

              <div className="flex gap-1">
                <button onClick={e => { e.stopPropagation(); onToggleMute(stem.id); }}
                  className="flex-1 py-0.5 rounded text-[9px] font-bold"
                  style={{ background: stem.muted ? "#f8717120" : "rgba(51,65,85,0.5)", color: stem.muted ? "#f87171" : "#64748b" }}>
                  M
                </button>
                <button onClick={e => { e.stopPropagation(); onToggleSolo(stem.id); }}
                  className="flex-1 py-0.5 rounded text-[9px] font-bold"
                  style={{ background: stem.soloed ? "#facc1520" : "rgba(51,65,85,0.5)", color: stem.soloed ? "#facc15" : "#64748b" }}>
                  S
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Detail bottom sheet ──────────────────────────────────────────────────────
function StemDetailSheet({ stem, onClose, onUpdate, onReset }: {
  stem: Stem; onClose: () => void;
  onUpdate: (id: string, patch: Partial<Stem>) => void;
  onReset: (id: string) => void;
}) {
  const u   = (patch: Partial<Stem>) => onUpdate(stem.id, patch);
  const col = stem.color;

  return (
    <motion.div
      initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 320, damping: 32 }}
      className="absolute bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t border-border/40 bg-card/97 backdrop-blur-2xl max-h-[72vh] flex flex-col"
      style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.5)" }}
    >
      {/* Handle */}
      <div className="flex justify-center pt-2 pb-1 shrink-0">
        <div className="w-10 h-1 rounded-full bg-muted-foreground/25" />
      </div>

      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 pb-2.5 shrink-0 border-b border-border/25">
        <div className="w-3.5 h-3.5 rounded-full" style={{ background: col }} />
        <span className="font-bold text-sm flex-1 truncate">{stem.name}</span>
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {Math.round(stem.position.angle)}° · dist {Math.round(stem.position.distance * 100)}%
        </span>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scroll content */}
      <div className="overflow-y-auto flex-1 px-4 py-3 space-y-4">

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-2">
          <Chip label={stem.muted ? "Unmute" : "Mute"} active={stem.muted} color="#f87171"
            icon={stem.muted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            onClick={() => u({ muted: !stem.muted })} />
          <Chip label={stem.soloed ? "Unsolo" : "Solo"} active={stem.soloed} color="#facc15"
            icon={stem.soloed ? <Zap className="w-3.5 h-3.5" /> : <ZapOff className="w-3.5 h-3.5" />}
            onClick={() => u({ soloed: !stem.soloed })} />
          <Chip label="Reset pos" active={false} color="#818cf8"
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={() => onReset(stem.id)} />
        </div>

        <Row label="Volume" val={`${Math.round(stem.volume * 100)}%`}>
          <Sl value={stem.volume} min={0} max={1} step={0.01} color={col} onChange={v => u({ volume: v })} />
        </Row>

        <Row label="Pan manuale" val={stem.pan === 0 ? "Centro" : stem.pan > 0 ? `R${Math.round(stem.pan * 100)}` : `L${Math.round(-stem.pan * 100)}`}>
          <Sl value={(stem.pan + 1) / 2} min={0} max={1} step={0.01} color={col} center onChange={v => u({ pan: v * 2 - 1 })} />
        </Row>

        <Row label="Reverb send" val={`${Math.round(stem.reverbSend * 100)}%`}>
          <Sl value={stem.reverbSend} min={0} max={1} step={0.01} color="#818cf8" onChange={v => u({ reverbSend: v })} />
        </Row>

        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/55 font-semibold mb-2">EQ 3-Band</p>
          <div className="space-y-2">
            {(["low","mid","high"] as const).map((band, i) => {
              const colors = ["#fb923c","#facc15","#86efac"];
              const v = stem.eq[band];
              return (
                <div key={band} className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-7 capitalize">{band}</span>
                  <div className="flex-1">
                    <Sl value={v + 12} min={0} max={24} step={0.5} color={colors[i]} center onChange={r => u({ eq: { ...stem.eq, [band]: r - 12 } })} />
                  </div>
                  <span className="text-[10px] text-muted-foreground w-12 text-right tabular-nums">{v >= 0 ? "+" : ""}{v.toFixed(1)} dB</span>
                </div>
              );
            })}
          </div>
        </div>

        <Row label="Stereo Width" val={`${Math.round(stem.stereoWidth * 50)}%`}>
          <Sl value={stem.stereoWidth / 2} min={0} max={1} step={0.01} color={col} onChange={v => u({ stereoWidth: v * 2 })} />
        </Row>
      </div>
    </motion.div>
  );
}

// ─── Micro-components ─────────────────────────────────────────────────────────
function Row({ label, val, children }: { label: string; val: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/55 font-semibold">{label}</span>
        <span className="text-[10px] tabular-nums text-muted-foreground">{val}</span>
      </div>
      {children}
    </div>
  );
}

function Sl({ value, min, max, step, color, center = false, onChange }: {
  value: number; min: number; max: number; step: number; color: string;
  center?: boolean; onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="relative h-6 flex items-center">
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ background: `linear-gradient(to right, ${color} ${pct}%, rgba(100,116,139,0.2) ${pct}%)` }}
      />
      {center && <div className="absolute left-1/2 top-1/2 -translate-x-px -translate-y-1/2 w-px h-3 bg-muted-foreground/25 pointer-events-none" />}
    </div>
  );
}

function Chip({ label, active, color, icon, onClick }: {
  label: string; active: boolean; color: string; icon: React.ReactNode; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-semibold min-h-[48px]"
      style={{
        background: active ? color + "20" : "rgba(20,30,55,0.7)",
        color: active ? color : "#64748b",
        border: `1px solid ${active ? color + "40" : "transparent"}`,
      }}>
      {icon}{label}
    </button>
  );
}
