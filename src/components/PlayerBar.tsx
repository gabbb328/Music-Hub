import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, SkipBack, SkipForward, Shuffle,
  Volume2, Volume1, VolumeX, Mic2, ListMusic,
  Monitor, Maximize2, ChevronUp, ChevronRight, Lock,
} from "lucide-react";
import WaveformProgress from "./WaveformProgress";
import RepeatControl from "./RepeatControl";
import { formatTime } from "@/lib/mock-data";
import type { usePlayerStore } from "@/hooks/usePlayerStore";
import {
  usePlaybackState, usePlayMutation, usePauseMutation,
  useNextMutation, usePreviousMutation, useSetVolumeMutation,
  useSeekMutation, useShuffleMutation, useRepeatMutation
} from "@/hooks/useSpotify";

import { useAccountTier } from "@/hooks/useAccountTier";
import { getActiveProvider, MUSIC_PROVIDERS } from "@/services/music-providers";
import { MusicServiceLogo } from "@/components/MusicServiceLogos";

type PlayerProps = ReturnType<typeof usePlayerStore> & {
  onExpandClick: () => void;
  onNavigate?: (section: string) => void;
  onOpenEggList?: () => void;
  superMode?: boolean;
  isQuizActive?: boolean;
  isVertical?: boolean;
  variant?: "desktop" | "pill";
  layout?: "mobile" | "tablet" | "desktop";
  isLateralOpen?: boolean;
  onToggleLateral?: () => void;
  className?: string;
};

// ── Volume slider con track colorata corretta ─────────────────────────────────
// Soluzione robusta cross-browser: div con background gradient + input range
// trasparente sopra. Funziona su Chrome, Safari, Firefox, iOS, Android.
function VolumeSlider({
  value,
  onChange,
  superMode,
}: {
  value: number;
  onChange: (v: number) => void;
  superMode: boolean;
}) {
  const fillColor  = superMode ? "#FFD700" : "hsl(var(--primary))";
  const trackColor = "rgba(100,116,139,0.3)";
  const pct        = `${value}%`;

  return (
    <div className="relative w-20 flex items-center" style={{ height: 20 }}>
      {/* Track visuale */}
      <div
        className="absolute inset-x-0 rounded-full pointer-events-none"
        style={{
          height: 4,
          top: "50%",
          transform: "translateY(-50%)",
          background: `linear-gradient(to right, ${fillColor} ${pct}, ${trackColor} ${pct})`,
          transition: "background 0ms",
        }}
      />
      {/* Input trasparente sopra la track */}
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="relative w-full cursor-pointer"
        style={{
          WebkitAppearance: "none",
          appearance: "none",
          background: "transparent",
          margin: 0,
          padding: "8px 0",
          height: "auto",
          zIndex: 1,
        }}
      />
    </div>
  );
}

export default function PlayerBar(props: PlayerProps) {
  const {
    currentTrack: localTrack, isPlaying: localIsPlaying, progress: localProgress,
    volume: localVolume, shuffle: localShuffle, repeat: localRepeat,
    toggle: localToggle, setProgress: localSetProgress, setVolume: localSetVolume,
    toggleShuffle: localToggleShuffle, toggleRepeat: localToggleRepeat,
    nextTrack: localNextTrack, prevTrack: localPrevTrack,
    onExpandClick, onNavigate, onOpenEggList, superMode = false,
    isQuizActive = false, isVertical = false,
    variant = "desktop", layout = "desktop",
    isLateralOpen = false, onToggleLateral, className = "",
  } = props;

  // ── TUTTI gli hook prima di qualsiasi early return ─────────────────────────
  const { data: playbackState } = usePlaybackState();
  const playMutation      = usePlayMutation();
  const pauseMutation     = usePauseMutation();
  const nextMutation      = useNextMutation();
  const previousMutation  = usePreviousMutation();
  const setVolumeMutation = useSetVolumeMutation();
  const seekMutation      = useSeekMutation();
  const shuffleMutation   = useShuffleMutation();
  const repeatMutation    = useRepeatMutation();
  const { isFree } = useAccountTier();

  // Long press refs — PRIMA dell'early return
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);

  // ── Dati ───────────────────────────────────────────────────────────────────
  const spotifyTrack = playbackState?.item;
  const isPlaying = playbackState?.is_playing ?? localIsPlaying;
  const progress  = playbackState
    ? (playbackState.progress_ms / (playbackState.item?.duration_ms || 1)) * 100
    : localProgress;
  const volume    = playbackState?.device?.volume_percent ?? localVolume;
  const shuffle   = playbackState?.shuffle_state ?? localShuffle;
  const repeat    = playbackState?.repeat_state === "track" ? "one"
    : playbackState?.repeat_state === "context" ? "all"
    : localRepeat;

  const currentTrack = spotifyTrack ? {
    id: spotifyTrack.id, title: spotifyTrack.name,
    artist: spotifyTrack.artists[0]?.name || "Unknown Artist",
    album: spotifyTrack.album.name, cover: spotifyTrack.album.images[0]?.url || "",
    duration: Math.floor(spotifyTrack.duration_ms / 1000),
  } : localTrack;

  // Early return DOPO tutti gli hook
  if (!currentTrack) return null;

  const elapsed = spotifyTrack
    ? Math.floor((playbackState?.progress_ms || 0) / 1000)
    : (progress / 100) * currentTrack.duration;
  const safeProgress = Math.max(0, Math.min(100, Number.isFinite(progress) ? progress : 0));

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleTogglePlay = async () => {
    try {
      if (spotifyTrack) {
        if (isPlaying) {
          await pauseMutation.mutateAsync();
        } else {
          await playMutation.mutateAsync({});
        }
      } else {
        localToggle();
      }
    } catch { localToggle(); }
  };
  const handleNext = async () => {
    try { 
      if (spotifyTrack) {
        await nextMutation.mutateAsync();
      } else localNextTrack();
    } catch { localNextTrack(); }
  };
  const handlePrevious = async () => {
    try {
      if (spotifyTrack) {
        await previousMutation.mutateAsync();
      } else localPrevTrack();
    } catch { localPrevTrack(); }
  };
  const handleVolumeChange = async (v: number) => {
    localSetVolume(v);
    if (spotifyTrack) { try { await setVolumeMutation.mutateAsync(v); } catch {} }
  };
  const handleSeek = async (p: number) => {
    localSetProgress(p);
    if (spotifyTrack) {
      try {
        const ms = Math.floor((p / 100) * spotifyTrack.duration_ms);
        await seekMutation.mutateAsync(ms);
      } catch {}
    }
  };
  const handleToggleShuffle = async () => {
    if (spotifyTrack) { try { await shuffleMutation.mutateAsync(!shuffle); } catch {} }
    localToggleShuffle();
  };
  const handleToggleRepeat = async () => {
    if (spotifyTrack) {
      try { await repeatMutation.mutateAsync(repeat === "off" ? "context" : repeat === "all" ? "track" : "off"); } catch {}
    }
    localToggleRepeat();
  };

  // ── Long press play/pause: >700ms → egg list ──────────────────────────────
  // Usiamo onTouchStart/End direttamente (non pointer events)
  // per evitare conflitti con lo scroll su mobile
  const startLongPress = (e?: React.TouchEvent | React.MouseEvent) => {
    longPressFired.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      onOpenEggList?.();
    }, 700);
  };
  const endLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (!longPressFired.current) handleTogglePlay();
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressFired.current = true;
  };

  // Props long press — separati per mouse e touch per max compatibilità
  const playBtnHandlers = {
    // Desktop (mouse)
    onMouseDown:   (e: React.MouseEvent)  => { if (e.button === 0) startLongPress(e); },
    onMouseUp:     (e: React.MouseEvent)  => { if (e.button === 0) endLongPress(); },
    onMouseLeave:  ()                     => cancelLongPress(),
    // Mobile (touch) — NO preventDefault, non interferisce con altri gestures
    onTouchStart:  (e: React.TouchEvent)  => startLongPress(e),
    onTouchEnd:    (e: React.TouchEvent)  => { e.preventDefault(); endLongPress(); },
    onTouchCancel: ()                     => cancelLongPress(),
    onContextMenu: (e: React.MouseEvent)  => e.preventDefault(),
  };

  // ── Stili Super Mode ────────────────────────────────────────────────────────
  const GOLD = "#FFD700";
  const GOLD_DIM = "rgba(255,215,0,0.65)";

  const playerBarStyle: React.CSSProperties = superMode ? {
    background:    "linear-gradient(135deg, rgba(18,13,0,0.97), rgba(35,26,0,0.97))",
    borderColor:   "rgba(255,215,0,0.4)",
    backdropFilter:"blur(20px) saturate(180%)",
    boxShadow:     "0 -4px 40px rgba(255,215,0,0.18)",
  } : {};

  const playBtnClass = "w-10 h-10 rounded-full flex items-center justify-center select-none touch-manipulation shrink-0";
  const playBtnStyle: React.CSSProperties = superMode
    ? { background: "linear-gradient(135deg,#FFD700,#FF8C00)", boxShadow: "0 0 18px rgba(255,215,0,0.55)" }
    : { background: "hsl(var(--foreground))" };

  // ── 1. Modalità Pill Floating (Mobile & Tablet) ───────────────────────────
  if (variant === "pill") {
    return (
      <div
        className={`pointer-events-auto relative w-full h-16 rounded-full bg-background/85 dark:bg-background/80 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20 flex items-center justify-between px-2.5 sm:px-3 select-none overflow-hidden ${className}`}
        style={playerBarStyle}
        data-player-bar
      >
        {/* Cover + Titolo & Artista */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
          <motion.button
            onClick={onExpandClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            className="relative shrink-0 cursor-pointer touch-manipulation"
            title="Espandi Now Playing"
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={currentTrack.id}
                src={currentTrack.cover}
                alt={currentTrack.album}
                className={`w-11 h-11 rounded-full object-cover shadow-sm transition-all duration-300 ml-0.5 ${
                  isQuizActive ? "blur-md scale-90" : ""
                }`}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
                style={superMode ? { boxShadow: "0 0 12px rgba(255,215,0,0.5)" } : {}}
              />
            </AnimatePresence>
            {isPlaying && (
              <motion.div
                className="absolute inset-0 rounded-full ring-1 ring-primary/40 ml-0.5"
                style={{ '--tw-ring-color': superMode ? "rgba(255,215,0,0.55)" : undefined } as any}
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.button>

          <div
            className="min-w-0 flex-1 cursor-pointer touch-manipulation select-none"
            onClick={onExpandClick}
            title="Tocca per aprire Now Playing"
          >
            <p
              className="text-xs sm:text-sm font-semibold truncate leading-tight"
              style={{ color: superMode ? GOLD : undefined }}
            >
              {isQuizActive ? "Guess the Title" : currentTrack.title}
            </p>
            <div className="flex items-center gap-1.5 leading-tight mt-0.5">
              <p className="text-[11px] text-muted-foreground truncate">
                {isQuizActive ? "Guess the Artist" : currentTrack.artist}
              </p>
              {isFree && (
                <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-amber-400 bg-amber-500/15 px-1 py-0.2 rounded border border-amber-500/25 shrink-0">
                  <Lock className="w-2 h-2 text-amber-400" /> Free
                </span>
              )}
            </div>
            {/* Sottile barra di progresso */}
            <div className="mt-1 h-0.5 rounded-full bg-muted-foreground/20 overflow-hidden w-full max-w-[120px] sm:max-w-[160px]">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300"
                style={{
                  width: `${safeProgress}%`,
                  background: superMode ? GOLD : undefined,
                }}
              />
            </div>
          </div>
        </div>

        {/* Controlli a destra del pill */}
        <div className="flex items-center gap-1 shrink-0">
          <motion.button
            {...playBtnHandlers}
            whileTap={{ scale: 0.9 }}
            className={playBtnClass}
            style={playBtnStyle}
            title="Play / Pause"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" style={{ color: superMode ? "#000" : "hsl(var(--background))" }} />
            ) : (
              <Play className="w-5 h-5 ml-0.5" style={{ color: superMode ? "#000" : "hsl(var(--background))" }} />
            )}
          </motion.button>

          <CtrlBtn onClick={handleNext} superMode={superMode} title="Brano successivo">
            <SkipForward className="w-4 h-4 fill-current" />
          </CtrlBtn>

          {/* Freccetta a destra:
              - Su tablet: apre lateralmente
              - Su telefono: espande la now playing view */}
          {layout === "tablet" ? (
            <CtrlBtn
              onClick={onToggleLateral}
              active={isLateralOpen}
              superMode={superMode}
              title={isLateralOpen ? "Chiudi pannello laterale" : "Apri pannello laterale"}
            >
              <motion.div
                animate={{ rotate: isLateralOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="w-4 h-4" />
              </motion.div>
            </CtrlBtn>
          ) : (
            <CtrlBtn
              onClick={onExpandClick}
              superMode={superMode}
              title="Espandi Now Playing"
            >
              <ChevronUp className="w-4 h-4" />
            </CtrlBtn>
          )}
        </div>
      </div>
    );
  }

  // ── 2. Modalità Verticale (Glass Mode Desktop & Pannello Laterale Tablet) ─
  if (isVertical) {
    return (
      <div
        className={`z-50 transition-all duration-500 flex flex-col w-full h-full p-6 justify-center gap-6 sm:gap-8 select-none ${className}`}
        style={playerBarStyle}
        data-player-bar
      >
        {/* Cover + titolo verticale */}
        <div className="flex flex-col items-center text-center gap-5">
          <motion.button
            onClick={onExpandClick}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.93 }}
            className="relative shrink-0 cursor-pointer touch-manipulation"
            title="Espandi a schermo intero"
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={currentTrack.id}
                src={currentTrack.cover}
                alt={currentTrack.album}
                className={`object-cover shadow-2xl transition-all duration-500 w-48 h-48 sm:w-56 sm:h-56 rounded-2xl ${
                  isQuizActive ? "blur-md scale-90" : ""
                }`}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
                style={superMode ? { boxShadow: "0 0 20px rgba(255,215,0,0.5)" } : {}}
              />
            </AnimatePresence>
            {isPlaying && (
              <motion.div
                className="absolute inset-0 rounded-2xl ring-2 ring-primary/40"
                style={{ '--tw-ring-color': superMode ? "rgba(255,215,0,0.55)" : undefined } as any}
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.button>

          <div className={`min-w-0 w-full px-2 transition-all duration-500 ${isQuizActive ? "blur-sm" : ""}`}>
            <p
              className="text-lg font-bold mb-1 break-words [overflow-wrap:anywhere] [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] overflow-hidden"
              style={{ color: superMode ? GOLD : undefined }}
            >
              {isQuizActive ? "Guess the Title" : currentTrack.title}
            </p>
            <div className="flex items-center justify-center gap-1.5">
              <p className="text-sm text-muted-foreground break-words [overflow-wrap:anywhere] [display:-webkit-box] [-webkit-line-clamp:1] [-webkit-box-orient:vertical] overflow-hidden">
                {isQuizActive ? "Guess the Artist" : currentTrack.artist}
              </p>
              {isFree && (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-500/15 px-1.5 py-0.2 rounded border border-amber-500/25 shrink-0" title="Account Free: riproduzione anteprima 30s">
                  <Lock className="w-2.5 h-2.5 text-amber-400" /> Free
                </span>
              )}
            </div>
            {superMode && (
              <p className="text-[10px] font-bold tracking-widest mt-1" style={{ color: GOLD, opacity: 0.85 }}>
                ⚡ 1.5× SPEED
              </p>
            )}
          </div>
        </div>

        {/* Controlli playback */}
        <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
          <div className="flex items-center justify-center gap-4">
            <CtrlBtn onClick={handleToggleShuffle} active={shuffle} superMode={superMode}>
              <Shuffle className="w-4 h-4" />
            </CtrlBtn>
            <CtrlBtn onClick={handlePrevious} superMode={superMode}>
              <SkipBack className="w-4 h-4 fill-current" />
            </CtrlBtn>

            <motion.button
              {...playBtnHandlers}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.9 }}
              className={playBtnClass}
              style={playBtnStyle}
              title="Play/Pause — tieni premuto per Easter Eggs"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" style={{ color: superMode ? "#000" : "hsl(var(--background))" }} />
              ) : (
                <Play className="w-5 h-5 ml-0.5" style={{ color: superMode ? "#000" : "hsl(var(--background))" }} />
              )}
            </motion.button>

            <CtrlBtn onClick={handleNext} superMode={superMode}>
              <SkipForward className="w-4 h-4 fill-current" />
            </CtrlBtn>
            <RepeatControl repeat={repeat} onToggle={handleToggleRepeat} />
          </div>

          {/* Scrubber timeline */}
          <div className="space-y-1 w-full mt-2">
            <div
              className="relative h-1.5 bg-foreground/15 hover:bg-foreground/25 rounded-full cursor-pointer flex items-center group transition-colors"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const p = ((e.clientX - rect.left) / rect.width) * 100;
                handleSeek(Math.max(0, Math.min(100, p)));
              }}
            >
              <div
                className="absolute left-0 top-0 bottom-0 rounded-full transition-all"
                style={{
                  width: `${safeProgress}%`,
                  background: superMode ? GOLD : "hsl(var(--foreground))",
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground tabular-nums leading-none px-0.5">
              <span>{formatTime(elapsed)}</span>
              <span>{formatTime(currentTrack.duration)}</span>
            </div>
          </div>
        </div>

        {/* Azioni secondarie e volume */}
        <div className="flex flex-col items-center gap-3 w-full max-w-xs mx-auto">
          <div className="flex items-center justify-center gap-3">
            <CtrlBtn onClick={() => onNavigate?.("lyrics")} superMode={superMode} title="Testi">
              <Mic2 className="w-4 h-4" />
            </CtrlBtn>
            <CtrlBtn onClick={() => onNavigate?.("queue")} superMode={superMode} title="Coda">
              <ListMusic className="w-4 h-4" />
            </CtrlBtn>
            <CtrlBtn onClick={() => onNavigate?.("devices")} superMode={superMode} title="Dispositivi">
              <Monitor className="w-4 h-4" />
            </CtrlBtn>
            <CtrlBtn onClick={onExpandClick} superMode={superMode} title="A tutto schermo">
              <Maximize2 className="w-4 h-4" />
            </CtrlBtn>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleVolumeChange(volume === 0 ? 75 : 0)}
              className="shrink-0 transition-colors"
              style={{ color: superMode ? GOLD_DIM : "hsl(var(--muted-foreground))" }}
            >
              {volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : volume < 50 ? (
                <Volume1 className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <VolumeSlider value={volume} onChange={handleVolumeChange} superMode={superMode} />
          </div>
        </div>
      </div>
    );
  }

  // ── 3. Modalità Orizzontale Desktop (Classic Mode) ────────────────────────
  return (
    <div
      className={`w-full min-h-16 md:h-24 flex items-center px-4 gap-4 justify-between select-none ${className}`}
      style={playerBarStyle}
      data-player-bar
    >
      {/* ── Cover + titolo ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 w-72 min-w-0 shrink-0">
        <motion.button
          onClick={onExpandClick}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.93 }}
          className="relative shrink-0 cursor-pointer touch-manipulation"
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={currentTrack.id}
              src={currentTrack.cover}
              alt={currentTrack.album}
              className={`w-14 h-14 rounded-lg object-cover shadow-lg transition-all duration-500 ${
                isQuizActive ? "blur-md scale-90" : ""
              }`}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              style={superMode ? { boxShadow: "0 0 14px rgba(255,215,0,0.5)" } : {}}
            />
          </AnimatePresence>
          {isPlaying && (
            <motion.div
              className="absolute inset-0 rounded-lg ring-1 ring-primary/40"
              style={{ '--tw-ring-color': superMode ? "rgba(255,215,0,0.55)" : undefined } as any}
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </motion.button>

        <div className={`min-w-0 flex-1 transition-all duration-500 ${isQuizActive ? "blur-sm" : ""}`}>
          <p
            className="text-sm font-semibold leading-tight truncate"
            style={{ color: superMode ? GOLD : undefined }}
          >
            {isQuizActive ? "Guess the Title" : currentTrack.title}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-xs text-muted-foreground leading-tight truncate">
              {isQuizActive ? "Guess the Artist" : currentTrack.artist}
            </p>
            {isFree && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-500/15 px-1.5 py-0.2 rounded border border-amber-500/25 shrink-0" title="Account Free: riproduzione anteprima 30s">
                <Lock className="w-2.5 h-2.5 text-amber-400" /> Free
              </span>
            )}
          </div>
          {superMode && (
            <p className="text-[9px] font-bold tracking-widest mt-0.5" style={{ color: GOLD, opacity: 0.8 }}>
              ⚡ 1.5× SPEED
            </p>
          )}
        </div>
      </div>

      {/* ── Controlli centrali desktop ───────────────────────────────────────── */}
      <div className="flex flex-1 max-w-2xl mx-auto flex-col gap-2 w-full min-w-0">
        <div className="flex items-center justify-center gap-4">
          <CtrlBtn onClick={handleToggleShuffle} active={shuffle} superMode={superMode}>
            <Shuffle className="w-4 h-4" />
          </CtrlBtn>
          <CtrlBtn onClick={handlePrevious} superMode={superMode}>
            <SkipBack className="w-4 h-4 fill-current" />
          </CtrlBtn>

          <motion.button
            {...playBtnHandlers}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.9 }}
            className={playBtnClass}
            style={playBtnStyle}
            title="Play/Pause — tieni premuto per Easter Eggs"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" style={{ color: superMode ? "#000" : "hsl(var(--background))" }} />
            ) : (
              <Play className="w-5 h-5 ml-0.5" style={{ color: superMode ? "#000" : "hsl(var(--background))" }} />
            )}
          </motion.button>

          <CtrlBtn onClick={handleNext} superMode={superMode}>
            <SkipForward className="w-4 h-4 fill-current" />
          </CtrlBtn>
          <RepeatControl repeat={repeat} onToggle={handleToggleRepeat} />
        </div>

        <div className="space-y-1 min-w-0 w-full max-w-md mx-auto">
          <div
            className="relative h-1.5 bg-foreground/15 hover:bg-foreground/25 rounded-full cursor-pointer flex items-center group transition-colors"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const p = ((e.clientX - rect.left) / rect.width) * 100;
              handleSeek(Math.max(0, Math.min(100, p)));
            }}
          >
            <div
              className="absolute left-0 top-0 bottom-0 rounded-full transition-all"
              style={{
                width: `${safeProgress}%`,
                background: superMode ? GOLD : "hsl(var(--foreground))",
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground tabular-nums leading-none px-0.5">
            <span>{formatTime(elapsed)}</span>
            <span>{formatTime(currentTrack.duration)}</span>
          </div>
        </div>
      </div>

      {/* ── Controlli destri desktop ─────────────────────────────────────────── */}
      <div className="flex justify-end w-56 items-center gap-2">
        <CtrlBtn onClick={() => onNavigate?.("lyrics")} superMode={superMode} title="Testi">
          <Mic2 className="w-4 h-4" />
        </CtrlBtn>
        <CtrlBtn onClick={() => onNavigate?.("queue")} superMode={superMode} title="Coda">
          <ListMusic className="w-4 h-4" />
        </CtrlBtn>
        <CtrlBtn onClick={() => onNavigate?.("devices")} superMode={superMode} title="Dispositivi">
          <Monitor className="w-4 h-4" />
        </CtrlBtn>

        <div className="flex items-center gap-1.5 ml-1">
          <button
            onClick={() => handleVolumeChange(volume === 0 ? 75 : 0)}
            className="shrink-0 transition-colors"
            style={{ color: superMode ? GOLD_DIM : "hsl(var(--muted-foreground))" }}
          >
            {volume === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : volume < 50 ? (
              <Volume1 className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <VolumeSlider value={volume} onChange={handleVolumeChange} superMode={superMode} />
        </div>

        <CtrlBtn onClick={onExpandClick} superMode={superMode} title="A tutto schermo">
          <Maximize2 className="w-4 h-4" />
        </CtrlBtn>
      </div>
    </div>
  );
}

// ── Pulsante controllo generico ───────────────────────────────────────────────
function CtrlBtn({
  onClick, active = false, superMode = false,
  children, title,
}: {
  onClick?: () => void;
  active?: boolean;
  superMode?: boolean;
  children: React.ReactNode;
  title?: string;
}) {
  const GOLD     = "#FFD700";
  const GOLD_DIM = "rgba(255,215,0,0.55)";
  const color = active
    ? (superMode ? GOLD     : "hsl(var(--primary))")
    : (superMode ? GOLD_DIM : "hsl(var(--muted-foreground))");

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.88 }}
      transition={{ type: "spring", stiffness: 600, damping: 30, mass: 0.5 }}
      className="p-1.5 rounded-full transition-colors touch-manipulation"
      style={{ color }}
      title={title}
    >
      {children}
    </motion.button>
  );
}
