import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, SkipBack, SkipForward, Shuffle,
  Volume2, Volume1, VolumeX, Mic2, ListMusic,
  Monitor, Maximize2, ChevronUp,
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

type PlayerProps = ReturnType<typeof usePlayerStore> & {
  onExpandClick: () => void;
  onNavigate?: (section: string) => void;
  onOpenEggList?: () => void;
  superMode?: boolean;
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

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleTogglePlay = async () => {
    try {
      if (spotifyTrack) { isPlaying ? await pauseMutation.mutateAsync() : await playMutation.mutateAsync({}); }
      else localToggle();
    } catch { localToggle(); }
  };
  const handleNext = async () => {
    try { spotifyTrack ? await nextMutation.mutateAsync() : localNextTrack(); }
    catch { localNextTrack(); }
  };
  const handlePrevious = async () => {
    try { spotifyTrack ? await previousMutation.mutateAsync() : localPrevTrack(); }
    catch { localPrevTrack(); }
  };
  const handleVolumeChange = async (v: number) => {
    localSetVolume(v);
    if (spotifyTrack) { try { await setVolumeMutation.mutateAsync(v); } catch {} }
  };
  const handleSeek = async (p: number) => {
    localSetProgress(p);
    if (spotifyTrack) {
      try { await seekMutation.mutateAsync(Math.floor((p / 100) * spotifyTrack.duration_ms)); } catch {}
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
  } : {
    backdropFilter: "blur(20px) saturate(180%)",
    backgroundColor: "hsl(var(--card) / 0.4)",
    borderColor: "hsl(var(--border) / 0.5)",
  };

  const playBtnClass = "w-10 h-10 rounded-full flex items-center justify-center select-none touch-manipulation shrink-0";
  const playBtnStyle: React.CSSProperties = superMode
    ? { background: "linear-gradient(135deg,#FFD700,#FF8C00)", boxShadow: "0 0 18px rgba(255,215,0,0.55)" }
    : { background: "hsl(var(--foreground))" };

  return (
    <div
      className="h-16 md:h-24 border-t flex items-center px-2 md:px-4 gap-2 md:gap-4 z-50 shrink-0 transition-all duration-500"
      style={playerBarStyle}
    >
      {/* ── Cover + titolo ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 md:gap-3 w-auto md:w-72 min-w-0 flex-1 md:flex-none">
        <motion.button onClick={onExpandClick}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.93 }}
          className="relative shrink-0 cursor-pointer touch-manipulation">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentTrack.id}
              src={currentTrack.cover} alt={currentTrack.album}
              className="w-14 h-14 rounded-lg object-cover shadow-lg"
              initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              style={superMode ? { boxShadow: "0 0 14px rgba(255,215,0,0.5)" } : {}}
            />
          </AnimatePresence>
          {isPlaying && (
            <motion.div
              className="absolute inset-0 rounded-lg ring-2"
              style={{ '--tw-ring-color': superMode ? "rgba(255,215,0,0.55)" : undefined } as any}
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </motion.button>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate"
            style={{ color: superMode ? GOLD : undefined }}>
            {currentTrack.title}
          </p>
          <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
          {superMode && (
            <p className="text-[9px] font-bold tracking-widest"
              style={{ color: GOLD, opacity: 0.8 }}>
              ⚡ 1.5× SPEED
            </p>
          )}
        </div>

        <motion.button onClick={onExpandClick}
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          className="touch-manipulation"
          style={{ color: superMode ? GOLD_DIM : undefined }}>
          <ChevronUp className="w-4 h-4" />
        </motion.button>
      </div>

      {/* ── Desktop controls ────────────────────────────────────────────────── */}
      <div className="hidden md:flex flex-1 max-w-2xl mx-auto flex-col gap-1">
        <div className="flex items-center justify-center gap-4">
          <CtrlBtn onClick={handleToggleShuffle} active={shuffle} superMode={superMode}>
            <Shuffle className="w-4 h-4" />
          </CtrlBtn>
          <CtrlBtn onClick={handlePrevious} superMode={superMode}>
            <SkipBack className="w-4 h-4 fill-current" />
          </CtrlBtn>

          {/* Play/Pause con long press */}
          <motion.button
            {...playBtnHandlers}
            whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }}
            className={playBtnClass}
            style={playBtnStyle}
            title="Play/Pause — tieni premuto per Easter Eggs"
          >
            {isPlaying
              ? <Pause className="w-5 h-5" style={{ color: superMode ? "#000" : "hsl(var(--background))" }} />
              : <Play  className="w-5 h-5 ml-0.5" style={{ color: superMode ? "#000" : "hsl(var(--background))" }} />}
          </motion.button>

          <CtrlBtn onClick={handleNext} superMode={superMode}>
            <SkipForward className="w-4 h-4 fill-current" />
          </CtrlBtn>
          <RepeatControl repeat={repeat} onToggle={handleToggleRepeat} />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">{formatTime(elapsed)}</span>
          <div className="flex-1">
            <WaveformProgress progress={progress} isPlaying={isPlaying} onSeek={handleSeek} />
          </div>
          <span className="text-xs text-muted-foreground w-10 tabular-nums">{formatTime(currentTrack.duration)}</span>
        </div>
      </div>

      {/* ── Desktop right ───────────────────────────────────────────────────── */}
      <div className="hidden md:flex items-center gap-2 w-56 justify-end">
        <CtrlBtn onClick={() => onNavigate?.("lyrics")} superMode={superMode}><Mic2 className="w-4 h-4" /></CtrlBtn>
        <CtrlBtn onClick={() => onNavigate?.("queue")}  superMode={superMode}><ListMusic className="w-4 h-4" /></CtrlBtn>
        <CtrlBtn onClick={() => onNavigate?.("devices")} superMode={superMode}><Monitor className="w-4 h-4" /></CtrlBtn>

        <div className="flex items-center gap-1.5 ml-1">
          <button
            onClick={() => handleVolumeChange(volume === 0 ? 75 : 0)}
            className="shrink-0 transition-colors"
            style={{ color: superMode ? GOLD_DIM : "hsl(var(--muted-foreground))" }}
          >
            {volume === 0
              ? <VolumeX className="w-4 h-4" />
              : volume < 50
              ? <Volume1 className="w-4 h-4" />
              : <Volume2 className="w-4 h-4" />}
          </button>
          {/* Volume slider con track corretta — niente più barra bianca */}
          <VolumeSlider value={volume} onChange={handleVolumeChange} superMode={superMode} />
        </div>

        <CtrlBtn onClick={onExpandClick} superMode={superMode}><Maximize2 className="w-4 h-4" /></CtrlBtn>
      </div>

      {/* ── Mobile controls ─────────────────────────────────────────────────── */}
      <div className="flex md:hidden items-center justify-end gap-1">
        <motion.button
          {...playBtnHandlers}
          whileTap={{ scale: 0.9 }}
          className={playBtnClass}
          style={playBtnStyle}
        >
          {isPlaying
            ? <Pause className="w-5 h-5" style={{ color: superMode ? "#000" : "hsl(var(--background))" }} />
            : <Play  className="w-5 h-5 ml-0.5" style={{ color: superMode ? "#000" : "hsl(var(--background))" }} />}
        </motion.button>
        <CtrlBtn onClick={handleNext} superMode={superMode}>
          <SkipForward className="w-5 h-5 fill-current" />
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
