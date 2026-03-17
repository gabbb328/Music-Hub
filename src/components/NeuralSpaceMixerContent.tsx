// ─── NeuralSpaceMixerContent – main page ─────────────────────────────────────
import React, { useRef, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Play, Pause, Square, Download,
  Layers, Sparkles, Info, RotateCcw, Shuffle,
} from "lucide-react";
import { useSpatialMixer } from "@/hooks/useSpatialMixer";
import SpatialRoomView from "@/components/SpatialRoomView";
import StemDetailPanel from "@/components/StemDetailPanel";
import StemListPanel from "@/components/StemListPanel";
import { formatTime } from "@/lib/mock-data";
import type { ExportSettings } from "@/types/spatialMixer";

export default function NeuralSpaceMixerContent() {
  const mixer = useSpatialMixer();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = ""; // reset so same file can be re-imported
      await mixer.importFile(file);
    },
    [mixer],
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) await mixer.importFile(file);
    },
    [mixer],
  );

  const doExport = (format: "wav" | "mp3") => {
    setShowExportMenu(false);
    const settings: ExportSettings = {
      format,
      sampleRate: 44100,
      bitrateMp3: 320,
      normalize: true,
      exportStems: false,
    };
    mixer.exportMix(settings);
  };

  // ── IDLE / IMPORT SCREEN ─────────────────────────────────────────────────
  if (mixer.status === "idle") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-8 p-8 overflow-y-auto">
        <div className="text-center space-y-3 max-w-md">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
              <Layers className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Neural Space Mixer
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Import a track, separate its stems with AI, then drag each instrument
            into a 3-D spatial audio field — powered by real Web Audio API.
          </p>
        </div>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="w-full max-w-md border-2 border-dashed border-indigo-500/40 rounded-2xl p-10 flex flex-col items-center gap-4 cursor-pointer hover:border-indigo-500/70 hover:bg-indigo-500/5 transition-all"
        >
          <Upload className="w-10 h-10 text-indigo-400" />
          <div className="text-center">
            <p className="font-semibold text-foreground">Drop an audio file here</p>
            <p className="text-xs text-muted-foreground mt-1">MP3, WAV, FLAC, M4A supported</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.wav,.flac,.m4a,audio/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Demo button */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-muted-foreground">or try the demo (8 oscillator stems)</span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={mixer.loadDemo}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/20"
          >
            <Sparkles className="w-4 h-4" /> Load Demo (Live Audio)
          </motion.button>
        </div>

        {/* Legal notice */}
        <div className="flex items-start gap-2 max-w-md text-xs text-muted-foreground bg-secondary/40 rounded-xl p-4">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
          <span>
            For full stem separation, import a local audio file you own.
            Streaming services are only used for metadata — no audio is extracted from protected streams.
          </span>
        </div>
      </div>
    );
  }

  // ── ANALYSIS SCREEN ──────────────────────────────────────────────────────
  if (mixer.status === "importing" || mixer.status === "analyzing") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
          <Layers className="w-8 h-8 text-white" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-foreground">Analysing Track</h2>
          <p className="text-sm text-muted-foreground">{mixer.analysisStep}</p>
        </div>
        <div className="w-full max-w-sm bg-secondary/50 rounded-full h-2.5 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
            animate={{ width: `${mixer.analysisProgress}%` }}
            transition={{ ease: "easeOut", duration: 0.5 }}
          />
        </div>
        <p className="text-xs text-muted-foreground">{mixer.analysisProgress}%</p>
      </div>
    );
  }

  // ── EXPORTING SCREEN ─────────────────────────────────────────────────────
  if (mixer.status === "exporting") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-xl animate-pulse">
          <Download className="w-8 h-8 text-white" />
        </div>
        <p className="text-foreground font-semibold">Rendering mix…</p>
        <p className="text-xs text-muted-foreground">This may take a moment</p>
      </div>
    );
  }

  // ── READY / PLAYING SCREEN ───────────────────────────────────────────────
  const project = mixer.project!;
  const duration = project.songDuration;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

      {/* ── Top bar ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-card/40 backdrop-blur-xl shrink-0 flex-wrap gap-y-2">

        {/* Song info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {project.songCover ? (
            <img src={project.songCover} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-white" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{project.songTitle}</p>
            <p className="text-xs text-muted-foreground truncate">{project.songArtist}</p>
          </div>
        </div>

        {/* Transport */}
        <div className="flex items-center gap-2">
          <ControlBtn onClick={mixer.stop} icon={<Square className="w-4 h-4 fill-current" />} title="Stop" />
          <ControlBtn
            primary
            onClick={mixer.isPlaying ? mixer.pause : mixer.play}
            title={mixer.isPlaying ? "Pause" : "Play"}
            icon={mixer.isPlaying
              ? <Pause className="w-5 h-5 fill-current" />
              : <Play  className="w-5 h-5 fill-current ml-0.5" />}
          />
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 flex-1 min-w-0 max-w-xs">
          <span className="text-xs text-muted-foreground tabular-nums w-10 text-right shrink-0">
            {formatTime(Math.floor(mixer.playbackTime))}
          </span>
          <input
            type="range" min={0} max={duration} step={0.1}
            value={mixer.playbackTime}
            onChange={(e) => mixer.seek(Number(e.target.value))}
            className="flex-1 h-1 accent-indigo-500 cursor-pointer"
          />
          <span className="text-xs text-muted-foreground tabular-nums w-10 shrink-0">
            {formatTime(duration)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Export dropdown */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setShowExportMenu((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </motion.button>
            <AnimatePresence>
              {showExportMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden text-xs"
                >
                  {(["wav", "mp3"] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => doExport(fmt)}
                      className="w-full px-4 py-2 hover:bg-secondary/60 text-left uppercase font-semibold tracking-wider text-foreground"
                    >
                      {fmt}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* New / Reset */}
          <button
            onClick={() => { mixer.stop(); window.location.reload(); }}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            title="New project"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Reload stems in engine (shuffle demo pitches) */}
          <button
            onClick={() => mixer.loadDemo()}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            title="Reload demo"
          >
            <Shuffle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Main workspace ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Room view */}
        <div className="flex-1 flex items-center justify-center p-4 bg-[#080d1e] overflow-hidden">
          <SpatialRoomView
            stems={project.stems}
            selectedId={mixer.selectedStemId}
            onSelect={mixer.selectStem}
            onMove={mixer.moveStem}
          />
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {mixer.selectedStem && (
            <StemDetailPanel
              stem={mixer.selectedStem}
              onClose={() => mixer.selectStem(null)}
              onUpdate={mixer.updateStem}
              onReset={mixer.resetStemPosition}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ── Stem list strip ── */}
      <StemListPanel
        stems={project.stems}
        selectedId={mixer.selectedStemId}
        onSelect={mixer.selectStem}
        onToggleMute={mixer.toggleMute}
        onToggleSolo={mixer.toggleSolo}
        onVolumeChange={(id, v) => mixer.updateStem(id, { volume: v })}
      />
    </div>
  );
}

// ── Helper ────────────────────────────────────────────────────────────────────
function ControlBtn({
  onClick, icon, primary = false, title,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  primary?: boolean;
  title?: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      title={title}
      className={`flex items-center justify-center rounded-full transition-colors ${
        primary
          ? "w-10 h-10 bg-foreground text-background"
          : "w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-secondary/60"
      }`}
    >
      {icon}
    </motion.button>
  );
}
