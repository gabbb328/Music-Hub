/**
 * TouchBar — emula la Touch Bar di macOS nell'interfaccia web.
 *
 * Viene mostrata SOLO su macOS (rilevato via userAgent / platform).
 * Si adatta alla sezione attiva:
 *   - Default/Home: ⏮ ⏯ ⏹ ⏭  + timeline + 🤖 LyraAI
 *   - Lyrics:       ⏮ ⏯ ⏭  + timeline più grande + A· info parole
 *   - Search:       ⌨ shortcut sezioni principali
 *   - Library/Liked/Recent: ⏮ ⏯ ⏭  + shortcuts sezioni
 *   - Stats/About:  solo info brano
 *   - Quiz/Games:   solo ⏮ ⏯ ⏭
 */

import { useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, SkipBack, SkipForward, Square,
  Sparkles, Music, Mic2, Search, Library,
  BarChart3, Radio, Heart, ListMusic, Shuffle, Repeat,
} from "lucide-react";
import type { Track } from "@/lib/mock-data";

// ─── Tipologia Touch Bar ────────────────────────────────────────────────────
type TouchBarMode =
  | "player"    // default: controlli playback + timeline + LyraAI
  | "lyrics"    // vista testi: timeline prominente
  | "search"    // ricerca: shortcut sezioni
  | "library"   // libreria: shortcut + playback
  | "games"     // quiz: solo playback essenziale
  | "stats";    // statistiche: info brano

interface TouchBarProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentPosition: number; // secondi
  activeSection: string;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  onOpenAI: () => void;
  onSectionChange: (section: string) => void;
}

// ─── Utilità ────────────────────────────────────────────────────────────────
function fmt(sec: number): string {
  const s = Math.floor(sec);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

function isMacOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  const platform = (navigator.platform || "").toLowerCase();
  // Escludi iPad (maxTouchPoints > 1 su iPad che si identifica come Mac in iPadOS 13+)
  const isIPad = navigator.maxTouchPoints > 1 && /mac/.test(platform);
  return /mac/.test(ua) && !isIPad;
}

function sectionToMode(activeSection: string): TouchBarMode {
  if (activeSection === "lyrics") return "lyrics";
  if (activeSection === "search") return "search";
  if (["library", "liked", "recent", "playlist"].some(s => activeSection.startsWith(s))) return "library";
  if (["quiz", "games"].includes(activeSection)) return "games";
  if (["stats", "about"].includes(activeSection)) return "stats";
  return "player";
}

// ─── Sottopulsante con label ─────────────────────────────────────────────────
function TbBtn({
  icon: Icon,
  label,
  onClick,
  active = false,
  accent = false,
  size = 14,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  active?: boolean;
  accent?: boolean;
  size?: number;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.88 }}
      whileHover={{ scale: 1.08 }}
      title={label}
      className="flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-md select-none cursor-pointer transition-colors"
      style={{
        minWidth: 36,
        background: active
          ? "rgba(255,255,255,0.22)"
          : accent
            ? "rgba(99,179,237,0.18)"
            : "rgba(255,255,255,0.06)",
        color: active ? "#fff" : accent ? "#90cdf4" : "rgba(255,255,255,0.75)",
        border: accent ? "1px solid rgba(99,179,237,0.35)" : "1px solid transparent",
      }}
    >
      <Icon size={size} strokeWidth={1.8} />
      <span style={{ fontSize: 9, lineHeight: 1.1, whiteSpace: "nowrap", opacity: 0.7 }}>{label}</span>
    </motion.button>
  );
}

// ─── Timeline scrubber ───────────────────────────────────────────────────────
function TbTimeline({
  current,
  duration,
  onSeek,
  prominent = false,
}: {
  current: number;
  duration: number;
  onSeek: (t: number) => void;
  prominent?: boolean;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const seek = useCallback(
    (clientX: number) => {
      if (!barRef.current || !duration) return;
      const rect = barRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      onSeek(ratio * duration);
    },
    [duration, onSeek]
  );

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    seek(e.clientX);
  };

  useEffect(() => {
    const move = (e: MouseEvent) => { if (dragging.current) seek(e.clientX); };
    const up = () => { dragging.current = false; };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, [seek]);

  const pct = duration > 0 ? (current / duration) * 100 : 0;
  const height = prominent ? 5 : 3;
  const thumbSize = prominent ? 11 : 8;

  return (
    <div className="flex items-center gap-1.5 flex-1 select-none" style={{ minWidth: prominent ? 180 : 100 }}>
      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", minWidth: 28, textAlign: "right" }}>{fmt(current)}</span>
      <div
        ref={barRef}
        onMouseDown={onMouseDown}
        className="relative flex-1 rounded-full cursor-pointer"
        style={{ height, background: "rgba(255,255,255,0.15)" }}
      >
        {/* Fill */}
        <div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #63b3ed, #9f7aea)",
            transition: dragging.current ? "none" : "width 0.3s linear",
          }}
        />
        {/* Thumb */}
        <div
          className="absolute rounded-full"
          style={{
            width: thumbSize,
            height: thumbSize,
            top: "50%",
            left: `${pct}%`,
            transform: "translate(-50%, -50%)",
            background: "#fff",
            boxShadow: "0 0 4px rgba(0,0,0,0.4)",
          }}
        />
      </div>
      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", minWidth: 28 }}>{fmt(duration)}</span>
    </div>
  );
}

// ─── Separatore ─────────────────────────────────────────────────────────────
function Sep() {
  return <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.12)", flexShrink: 0 }} />;
}

// ─── Componente principale ───────────────────────────────────────────────────
export default function TouchBar({
  currentTrack,
  isPlaying,
  currentPosition,
  activeSection,
  onPlay,
  onPause,
  onStop,
  onNext,
  onPrev,
  onSeek,
  onOpenAI,
  onSectionChange,
}: TouchBarProps) {
  // Mostra solo su macOS
  if (!isMacOS()) return null;

  const mode = sectionToMode(activeSection);
  const duration = currentTrack?.duration ?? 0;
  const togglePlay = isPlaying ? onPause : onPlay;

  // ── Contenuto per modalità ────────────────────────────────────────────────
  const renderContent = () => {
    switch (mode) {
      // ── LYRICS ──────────────────────────────────────────────────────────
      case "lyrics":
        return (
          <>
            <TbBtn icon={SkipBack} label="Indietro" onClick={onPrev} />
            <TbBtn icon={isPlaying ? Pause : Play} label={isPlaying ? "Pausa" : "Play"} onClick={togglePlay} accent />
            <TbBtn icon={SkipForward} label="Avanti" onClick={onNext} />
            <Sep />
            <TbTimeline current={currentPosition} duration={duration} onSeek={onSeek} prominent />
            <Sep />
            <TbBtn icon={Mic2} label="Testi" onClick={() => onSectionChange("lyrics")} active />
            <TbBtn icon={Sparkles} label="LyraAI" onClick={onOpenAI} accent />
          </>
        );

      // ── SEARCH ───────────────────────────────────────────────────────────
      case "search":
        return (
          <>
            <TbBtn icon={Search} label="Cerca" onClick={() => onSectionChange("search")} active />
            <Sep />
            <TbBtn icon={Music} label="Home" onClick={() => onSectionChange("home")} />
            <TbBtn icon={Library} label="Libreria" onClick={() => onSectionChange("library")} />
            <TbBtn icon={Heart} label="Salvate" onClick={() => onSectionChange("liked")} />
            <TbBtn icon={Radio} label="Radio" onClick={() => onSectionChange("radio")} />
            <Sep />
            {currentTrack && (
              <>
                <TbBtn icon={isPlaying ? Pause : Play} label={isPlaying ? "Pausa" : "Play"} onClick={togglePlay} accent />
                <TbBtn icon={SkipForward} label="Avanti" onClick={onNext} />
              </>
            )}
            <TbBtn icon={Sparkles} label="LyraAI" onClick={onOpenAI} accent />
          </>
        );

      // ── LIBRARY ──────────────────────────────────────────────────────────
      case "library":
        return (
          <>
            <TbBtn icon={SkipBack} label="Indietro" onClick={onPrev} />
            <TbBtn icon={isPlaying ? Pause : Play} label={isPlaying ? "Pausa" : "Play"} onClick={togglePlay} accent />
            <TbBtn icon={SkipForward} label="Avanti" onClick={onNext} />
            <Sep />
            <TbBtn icon={Library} label="Libreria" onClick={() => onSectionChange("library")} active={activeSection === "library"} />
            <TbBtn icon={Heart} label="Salvate" onClick={() => onSectionChange("liked")} active={activeSection === "liked"} />
            <TbBtn icon={ListMusic} label="Recenti" onClick={() => onSectionChange("recent")} active={activeSection === "recent"} />
            <TbBtn icon={Music} label="Coda" onClick={() => onSectionChange("queue")} active={activeSection === "queue"} />
            <Sep />
            <TbBtn icon={Sparkles} label="LyraAI" onClick={onOpenAI} accent />
          </>
        );

      // ── GAMES / QUIZ ─────────────────────────────────────────────────────
      case "games":
        return (
          <>
            <TbBtn icon={SkipBack} label="Indietro" onClick={onPrev} />
            <TbBtn icon={isPlaying ? Pause : Play} label={isPlaying ? "Pausa" : "Play"} onClick={togglePlay} accent />
            <TbBtn icon={Square} label="Stop" onClick={onStop} />
            <TbBtn icon={SkipForward} label="Avanti" onClick={onNext} />
          </>
        );

      // ── STATS ────────────────────────────────────────────────────────────
      case "stats":
        return (
          <>
            <TbBtn icon={BarChart3} label="Statistiche" onClick={() => onSectionChange("stats")} active={activeSection === "stats"} />
            <Sep />
            {currentTrack && (
              <>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {currentTrack.title} — {currentTrack.artist}
                </span>
                <Sep />
                <TbBtn icon={isPlaying ? Pause : Play} label={isPlaying ? "Pausa" : "Play"} onClick={togglePlay} accent />
              </>
            )}
            <TbBtn icon={Sparkles} label="LyraAI" onClick={onOpenAI} accent />
          </>
        );

      // ── PLAYER (default) ─────────────────────────────────────────────────
      default:
        return (
          <>
            <TbBtn icon={SkipBack} label="Indietro" onClick={onPrev} />
            <TbBtn icon={isPlaying ? Pause : Play} label={isPlaying ? "Pausa" : "Play"} onClick={togglePlay} accent />
            <TbBtn icon={Square} label="Stop" onClick={onStop} />
            <TbBtn icon={SkipForward} label="Avanti" onClick={onNext} />
            <Sep />
            <TbTimeline current={currentPosition} duration={duration} onSeek={onSeek} />
            <Sep />
            <TbBtn icon={Mic2} label="Testi" onClick={() => onSectionChange("lyrics")} active={activeSection === "lyrics"} />
            <TbBtn icon={Sparkles} label="LyraAI" onClick={onOpenAI} accent />
          </>
        );
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key={`tb-${mode}`}
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9999,
          // Simula la Touch Bar: barra sottile e compatta centrata in basso
          background: "linear-gradient(180deg, rgba(28,28,36,0.97) 0%, rgba(18,18,28,0.99) 100%)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderRadius: "12px 12px 0 0",
          borderTop: "1px solid rgba(255,255,255,0.10)",
          borderLeft: "1px solid rgba(255,255,255,0.06)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 -4px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)",
          padding: "6px 12px 8px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          minHeight: 44,
          maxWidth: "calc(100vw - 32px)",
          width: "max-content",
          // Mostra sopra la MobileNav solo su desktop Mac
          // Su mobile e tablet non mostriamo nulla (isMacOS garantisce solo desktop)
        }}
      >
        {/* Indicatore brano corrente (se presente) */}
        {currentTrack && mode !== "games" && (
          <div
            className="flex items-center gap-1.5 shrink-0"
            style={{ maxWidth: 110 }}
          >
            {currentTrack.cover ? (
              <img
                src={currentTrack.cover}
                alt={currentTrack.title}
                style={{ width: 22, height: 22, borderRadius: 4, objectFit: "cover", flexShrink: 0 }}
              />
            ) : (
              <Music size={14} style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />
            )}
            <div style={{ overflow: "hidden" }}>
              <p style={{ fontSize: 9, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 80, lineHeight: 1.2, fontWeight: 600 }}>
                {currentTrack.title}
              </p>
              <p style={{ fontSize: 8, color: "rgba(255,255,255,0.45)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 80, lineHeight: 1.2 }}>
                {currentTrack.artist}
              </p>
            </div>
          </div>
        )}
        {currentTrack && mode !== "games" && <Sep />}

        {/* Contenuto contestuale */}
        {renderContent()}
      </motion.div>
    </AnimatePresence>
  );
}
