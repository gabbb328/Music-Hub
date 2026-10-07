import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Languages,
  Sliders,
  AlignCenter,
  AlignLeft,
  Minimize2,
  Sparkles,
  Palette,
  Type,
  Maximize,
  Check,
  RotateCcw,
  Music,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Track } from "@/lib/mock-data";
import {
  usePlaybackState,
  usePlayMutation,
  usePauseMutation,
  useNextMutation,
  usePreviousMutation,
  useSeekMutation,
} from "@/hooks/useSpotify";
import { formatTime } from "@/lib/mock-data";
import {
  getCurrentLineIndex,
  type LyricLine,
  parseWordParts,
  type FormattedWordPart,
} from "@/services/lyrics-api";
import {
  useLyricsSettings,
  type LyricsTheme,
  type LyricsFontFamily,
  type LyricsFontSize,
  type LyricsHighlightStyle,
  type LyricsAlignment,
  type LyricsBackgroundFx,
  type LyricsLineSpacing,
} from "@/hooks/useLyricsSettings";
import { extractColorsFromImage } from "@/services/color-extractor";

interface VerciLyricsOverlayProps {
  currentTrack: Track | null;
  lyrics: LyricLine[];
  isSynced: boolean;
  translatedLyrics: Map<number, string>;
  showTranslation: boolean;
  onToggleTranslation: () => void;
  onClose: () => void;
}

// ── Verci Contextual Keyword-to-Emoji Dictionary ──
const KEYWORD_EMOJI_MAP: Record<string, string> = {
  chances: "🎲",
  chance: "🎲",
  gamble: "🎲",
  dice: "🎲",
  blew: "💨",
  blow: "💨",
  wind: "💨",
  breeze: "💨",
  fly: "🕊️",
  sky: "🌌",
  star: "⭐",
  stars: "⭐",
  sun: "☀️",
  sunshine: "☀️",
  moon: "🌙",
  night: "🌙",
  dark: "🌑",
  fire: "🔥",
  flame: "🔥",
  burn: "🔥",
  heart: "❤️",
  love: "❤️",
  rain: "🌧️",
  tears: "💧",
  cry: "💧",
  car: "🚗",
  drive: "🚘",
  ride: "🏎️",
  time: "⏰",
  clock: "🕒",
  money: "💰",
  cash: "💵",
  rich: "💎",
  diamond: "💎",
  crown: "👑",
  king: "👑",
  queen: "👑",
  music: "🎵",
  song: "🎶",
  sing: "🎤",
  dance: "💃",
  party: "🎉",
  drink: "🥂",
  wine: "🍷",
  eyes: "👀",
  look: "👀",
  see: "👀",
  call: "📞",
  phone: "📱",
  home: "🏠",
  world: "🌍",
  earth: "🌍",
  space: "🚀",
  light: "💡",
  shine: "✨",
  gold: "🏆",
  win: "🏆",
  sea: "🌊",
  ocean: "🌊",
  run: "🏃",
  stop: "🛑",
};

function getWordEmoji(rawWord: string): string | null {
  const clean = rawWord.toLowerCase().replace(/[^\w]/g, "");
  if (!clean) return null;
  return KEYWORD_EMOJI_MAP[clean] || null;
}

// ── Chunk long lyric lines into short Verci-style phrases (max 4-5 words per line) ──
function chunkLyricLines(lines: LyricLine[], maxWordsPerChunk = 5): LyricLine[] {
  if (!lines || lines.length === 0) return [];
  const chunked: LyricLine[] = [];

  for (const line of lines) {
    if (!line.text.trim() || /^\[.*\]$/.test(line.text) || line.text.split(/\s+/).length <= maxWordsPerChunk) {
      chunked.push(line);
      continue;
    }

    const words = line.text.split(/\s+/);
    const lineDuration = Math.max(1, (line.endTime || line.time + 4) - line.time);
    const totalWords = words.length;

    for (let i = 0; i < totalWords; i += maxWordsPerChunk) {
      const chunkWords = words.slice(i, i + maxWordsPerChunk);
      const chunkRatioStart = i / totalWords;
      const chunkRatioEnd = (i + chunkWords.length) / totalWords;

      const chunkStartTime = line.time + chunkRatioStart * lineDuration;
      const chunkEndTime = line.time + chunkRatioEnd * lineDuration;

      chunked.push({
        time: chunkStartTime,
        endTime: chunkEndTime,
        text: chunkWords.join(" "),
      });
    }
  }

  return chunked;
}

export default function VerciLyricsOverlay({
  currentTrack: localTrack,
  lyrics: rawLyrics,
  isSynced,
  translatedLyrics,
  showTranslation,
  onToggleTranslation,
  onClose,
}: VerciLyricsOverlayProps) {
  const { settings, updateSetting, resetSettings } = useLyricsSettings();

  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [activeTime, setActiveTime] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [albumColors, setAlbumColors] = useState<{ primary: string; secondary: string; background: string } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideControlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: playbackState } = usePlaybackState();
  const currentTrack = playbackState?.item || localTrack;

  // Cover image URL & adaptive color extraction
  const coverUrl =
    (currentTrack as any)?.album?.images?.[0]?.url ||
    (currentTrack as any)?.cover ||
    "";
  const titleStr = (currentTrack as any)?.name || (currentTrack as any)?.title || "Brano sconosciuto";
  const artistStr =
    (currentTrack as any)?.artists?.[0]?.name ||
    (currentTrack as any)?.artist ||
    "Artista sconosciuto";

  useEffect(() => {
    if (coverUrl) {
      extractColorsFromImage(coverUrl)
        .then((palette) => {
          setAlbumColors({
            primary: palette.primary,
            secondary: palette.secondary,
            background: palette.background,
          });
        })
        .catch(() => setAlbumColors(null));
    }
  }, [coverUrl]);

  // Chunk lyrics depending on animation mode (Normal uses raw full lines, Verci modes chunk to max 5 words)
  const lyrics = useMemo(() => {
    if (settings.highlightStyle === "normal") {
      return rawLyrics;
    }
    return chunkLyricLines(rawLyrics, 5);
  }, [rawLyrics, settings.highlightStyle]);

  const playMutation = usePlayMutation();
  const pauseMutation = usePauseMutation();
  const nextMutation = useNextMutation();
  const previousMutation = usePreviousMutation();
  const seekMutation = useSeekMutation();

  const isPlaying = playbackState?.is_playing ?? false;
  const currentTime = playbackState?.progress_ms
    ? playbackState.progress_ms / 1000
    : 0;
  const durationTime = (currentTrack as any)?.duration_ms
    ? Math.floor((currentTrack as any).duration_ms / 1000)
    : (currentTrack as any)?.duration || 180;

  // Lock body scroll on mount
  useEffect(() => {
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Sync high-precision 60fps clock
  const syncRef = useRef<{ baseTime: number; updatedAt: number }>({
    baseTime: 0,
    updatedAt: performance.now(),
  });

  useEffect(() => {
    syncRef.current = { baseTime: currentTime, updatedAt: performance.now() };
    setActiveTime(currentTime);
  }, [currentTime]);

  useEffect(() => {
    if (!isPlaying) return;
    let animId: number;
    const tick = () => {
      const elapsed = (performance.now() - syncRef.current.updatedAt) / 1000;
      setActiveTime(syncRef.current.baseTime + elapsed + 0.08);
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  // Update current line
  useEffect(() => {
    if (lyrics.length > 0) {
      const idx = getCurrentLineIndex(lyrics, activeTime);
      if (idx !== currentLineIndex) setCurrentLineIndex(idx);
    }
  }, [activeTime, lyrics]);

  // Auto-center active line smoothly in container
  useEffect(() => {
    if (lyrics.length === 0 || !containerRef.current) return;
    const lineEl = lineRefs.current[currentLineIndex];
    if (lineEl && containerRef.current) {
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const lineRect = lineEl.getBoundingClientRect();
      const delta = lineRect.top - containerRect.top - containerRect.height / 2 + lineRect.height / 2;
      container.scrollTo({
        top: container.scrollTop + delta,
        behavior: "smooth",
      });
    }
  }, [currentLineIndex, lyrics.length]);

  // Controls auto-hide on inactivity
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    hideControlsTimerRef.current = setTimeout(() => {
      if (!isDrawerOpen) setShowControls(false);
    }, 4000);
  }, [isDrawerOpen]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    };
  }, [handleMouseMove]);

  // Keyboard navigation & ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === " ") {
        e.preventDefault();
        if (isPlaying) pauseMutation.mutate();
        else playMutation.mutate({});
      } else if (e.key === "ArrowLeft") {
        previousMutation.mutate();
      } else if (e.key === "ArrowRight") {
        nextMutation.mutate();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isPlaying, playMutation, pauseMutation, previousMutation, nextMutation]);

  // Right-edge hover zone handlers
  const handleRightZoneEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsDrawerOpen(true);
  };

  const handleRightZoneLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsDrawerOpen(false);
    }, 500);
  };

  const handleLineClick = (line: LyricLine) => {
    if (isSynced) {
      seekMutation.mutate(Math.floor(line.time * 1000));
    }
  };

  // Theme styles resolver
  const getThemeStyles = (theme: LyricsTheme) => {
    if (theme === "album" && albumColors) {
      return {
        bg: "bg-black",
        bgStyle: { backgroundColor: albumColors.background },
        textActive: "text-white drop-shadow-[0_0_35px_rgba(255,255,255,1)]",
        textNormal: "text-white/80",
        textPast: "text-white/30",
        accentBg: albumColors.primary,
        bannerBg: albumColors.secondary || albumColors.primary,
        glowColor: albumColors.primary,
      };
    }

    switch (theme) {
      case "obsidian":
        return {
          bg: "bg-[#09090b]",
          textActive: "text-purple-400 drop-shadow-[0_0_30px_rgba(168,85,247,1)]",
          textNormal: "text-zinc-300",
          textPast: "text-zinc-600",
          accentBg: "#a855f7",
          bannerBg: "#a855f7",
          glowColor: "rgba(168,85,247,0.9)",
        };
      case "cyber":
        return {
          bg: "bg-[#040914]",
          textActive: "text-cyan-300 drop-shadow-[0_0_35px_rgba(6,182,212,1)]",
          textNormal: "text-cyan-100/70",
          textPast: "text-cyan-900/60",
          accentBg: "#06b6d4",
          bannerBg: "#06b6d4",
          glowColor: "rgba(6,182,212,0.9)",
        };
      case "sunset":
        return {
          bg: "bg-[#18090a]",
          textActive: "text-amber-300 drop-shadow-[0_0_30px_rgba(251,191,36,1)]",
          textNormal: "text-amber-100/70",
          textPast: "text-rose-950/60",
          accentBg: "#f59e0b",
          bannerBg: "#e11d48",
          glowColor: "rgba(251,191,36,0.9)",
        };
      case "midnight":
        return {
          bg: "bg-[#020617]",
          textActive: "text-blue-300 drop-shadow-[0_0_30px_rgba(59,130,246,1)]",
          textNormal: "text-slate-300",
          textPast: "text-slate-700",
          accentBg: "#2563eb",
          bannerBg: "#2563eb",
          glowColor: "rgba(59,130,246,0.9)",
        };
      case "emerald":
        return {
          bg: "bg-[#02140d]",
          textActive: "text-emerald-300 drop-shadow-[0_0_30px_rgba(16,185,129,1)]",
          textNormal: "text-emerald-100/70",
          textPast: "text-emerald-950/60",
          accentBg: "#10b981",
          bannerBg: "#059669",
          glowColor: "rgba(16,185,129,0.9)",
        };
      case "glass":
        return {
          bg: "bg-zinc-950",
          textActive: "text-white drop-shadow-[0_0_25px_rgba(255,255,255,1)]",
          textNormal: "text-white/80",
          textPast: "text-white/30",
          accentBg: "#ffffff",
          bannerBg: "#e11d48",
          glowColor: "rgba(255,255,255,0.9)",
        };
      case "album":
      default:
        return {
          bg: "bg-black",
          textActive: "text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.95)]",
          textNormal: "text-white/80",
          textPast: "text-white/30",
          accentBg: "#e11d48",
          bannerBg: "#e11d48",
          glowColor: "rgba(225,29,72,0.95)",
        };
    }
  };

  const themeStyle = getThemeStyles(settings.theme);

  // Font family CSS stack resolver
  const getFontFamilyStyle = (font: LyricsFontFamily) => {
    switch (font) {
      case "outfit":
        return { fontFamily: "'Outfit', system-ui, sans-serif" };
      case "serif":
        return { fontFamily: "'Playfair Display', Georgia, serif" };
      case "mono":
        return { fontFamily: "'Fira Code', monospace" };
      case "sans":
      default:
        return { fontFamily: "system-ui, -apple-system, sans-serif" };
    }
  };

  // Dynamic Font size resolver with variant support (size only, no font-weight — each mode handles its own weight)
  const getFontSizeClasses = (
    size: LyricsFontSize,
    variant: "active" | "normal" | "small" | "large" = "normal"
  ) => {
    switch (size) {
      case "sm":
        if (variant === "large") return "text-4xl md:text-6xl";
        if (variant === "active") return "text-2xl md:text-4xl";
        if (variant === "small") return "text-base md:text-xl";
        return "text-xl md:text-3xl";
      case "md":
        if (variant === "large") return "text-5xl md:text-7xl";
        if (variant === "active") return "text-3xl md:text-5xl";
        if (variant === "small") return "text-lg md:text-2xl";
        return "text-2xl md:text-4xl";
      case "xl":
        if (variant === "large") return "text-7xl md:text-9xl";
        if (variant === "active") return "text-5xl md:text-7xl";
        if (variant === "small") return "text-2xl md:text-4xl";
        return "text-4xl md:text-6xl";
      case "lg":
      default:
        if (variant === "large") return "text-6xl md:text-8xl";
        if (variant === "active") return "text-4xl md:text-6xl";
        if (variant === "small") return "text-lg md:text-2xl";
        return "text-3xl md:text-5xl";
    }
  };

  // Line spacing resolver
  const getLineSpacingClass = (spacing: LyricsLineSpacing) => {
    switch (spacing) {
      case "compact":
        return "py-2 space-y-1";
      case "relaxed":
        return "py-6 space-y-3";
      case "normal":
      default:
        return "py-4 space-y-2";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      style={(themeStyle as any).bgStyle}
      className={`fixed inset-0 z-[99999] w-screen h-screen flex flex-col select-none overflow-hidden ${themeStyle.bg}`}
    >
      {/* ── Background Layer (Opaque Base + Optional Visual Effects) ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden bg-black z-0">
        {settings.backgroundFx === "blur" && coverUrl && (
          <div className="absolute inset-0 scale-125 transition-all duration-700">
            <img
              src={coverUrl}
              alt=""
              className="w-full h-full object-cover blur-[100px] opacity-35 mix-blend-screen"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40" />
          </div>
        )}

        {settings.backgroundFx === "mesh" && (
          <motion.div
            className="absolute inset-0 opacity-35"
            animate={{
              background: [
                "radial-gradient(circle at 20% 30%, rgba(168,85,247,0.4) 0%, transparent 65%), radial-gradient(circle at 80% 70%, rgba(6,182,212,0.4) 0%, transparent 65%)",
                "radial-gradient(circle at 70% 20%, rgba(251,191,36,0.4) 0%, transparent 65%), radial-gradient(circle at 30% 80%, rgba(236,72,153,0.4) 0%, transparent 65%)",
                "radial-gradient(circle at 20% 30%, rgba(168,85,247,0.4) 0%, transparent 65%), radial-gradient(circle at 80% 70%, rgba(6,182,212,0.4) 0%, transparent 65%)",
              ],
            }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        {settings.backgroundFx === "radial" && (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/40 via-black to-black" />
        )}
      </div>

      {/* ── Top Control Bar (Clean: Track info, Translation, Exit Fullscreen) ── */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/60 backdrop-blur-xl shrink-0"
          >
            {/* Track Info */}
            <div className="flex items-center gap-4 min-w-0">
              {coverUrl && (
                <img
                  src={coverUrl}
                  alt={titleStr}
                  className="w-12 h-12 rounded-xl object-cover shadow-2xl ring-1 ring-white/20 shrink-0"
                />
              )}
              <div className="min-w-0">
                <p className="font-extrabold text-white text-base truncate">
                  {titleStr}
                </p>
                <p className="text-xs text-white/60 truncate font-medium">
                  {artistStr}
                </p>
              </div>
            </div>

            {/* Quick Actions (Translation & Exit Fullscreen) */}
            <div className="flex items-center gap-3">
              {translatedLyrics.size > 0 && (
                <Button
                  size="sm"
                  variant={showTranslation ? "default" : "outline"}
                  onClick={onToggleTranslation}
                  className="h-8 px-3.5 text-xs gap-1.5 rounded-full text-white/90 hover:bg-white/15 border-white/20 font-semibold"
                >
                  <Languages className="w-3.5 h-3.5" />
                  <span>{showTranslation ? "Originale" : "Traduzione"}</span>
                </Button>
              )}

              {/* Exit Fullscreen Button */}
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="h-9 w-9 rounded-full text-white/90 hover:bg-white/20 hover:text-white relative z-[100010] cursor-pointer"
                title="Esci da Schermo Intero (ESC)"
              >
                <Minimize2 className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Verci Word-by-Word Animated Lyrics Body ── */}
      <div
        ref={containerRef}
        style={getFontFamilyStyle(settings.fontFamily)}
        className="relative z-10 flex-1 overflow-y-auto px-4 md:px-12 scrollbar-none"
      >
        <div className="min-h-full py-[40vh] flex flex-col justify-center">
          {lyrics.length === 0 ? (
            <div className="text-center py-20 text-white/60">
              <p className="text-base md:text-xl font-medium">
                testi di {currentTrack?.name || "brano"} di {currentTrack?.artists?.[0]?.name || (currentTrack as any)?.artist || "autore"} non disponibili
              </p>
            </div>
          ) : (
            <div className={`w-full max-w-5xl mx-auto flex flex-col ${
              settings.alignment === "center" ? "items-center text-center" : "items-start text-left"
            }`}>
              {lyrics.map((line, index) => {
                const isCurrentLine = index === currentLineIndex;
                const isPastLine = index < currentLineIndex;
                const translation = translatedLyrics.get(index);
                const trimmedText = line.text.trim();
                const isBreak =
                  !trimmedText ||
                  /^\[(?:instrumental|musica|solo|guitar solo|intro|outro|break|interlude|drop)\]$/i.test(trimmedText) ||
                  /^(?:instrumental|musica|\[instrumental\]|\[musica\]|♪)$/i.test(trimmedText);

                const hasSyncWords = line.words && line.words.length > 0;
                const rawTokens = hasSyncWords
                  ? line.words!.map((w) => w.text)
                  : trimmedText.split(/\s+/).filter(Boolean);

                const isEntireLineChorus = /^\s*\(.*\)\s*$/.test(trimmedText);
                let openParen = 0;
                const parsedWords: FormattedWordPart[] = rawTokens.map((w, i) => {
                  const opens = (w.match(/[\(\[]/g) || []).length;
                  const closes = (w.match(/[\)\]]/g) || []).length;
                  const isChorus = isEntireLineChorus || openParen > 0 || opens > 0;
                  openParen += opens;
                  openParen -= closes;
                  openParen = Math.max(0, openParen);
                  return parseWordParts(w, i, isChorus);
                });

                // Calculate progress within current line (0 to 1) with cap to prevent stretching over guitar solos
                const nextLine = lyrics[index + 1];
                const totalWordCount = Math.max(1, parsedWords.length);
                const estimatedSingingDuration = Math.min(
                  nextLine ? Math.max(1.8, nextLine.time - line.time) : 5.0,
                  Math.max(2.2, totalWordCount * 0.52)
                );
                const effectiveEndTime = line.endTime
                  ? Math.min(line.endTime, line.time + Math.max(2.0, totalWordCount * 0.8))
                  : (nextLine ? Math.min(nextLine.time, line.time + estimatedSingingDuration) : line.time + estimatedSingingDuration);
                const lineDuration = Math.max(0.4, effectiveEndTime - line.time);
                const lineProgress = Math.max(0, Math.min(1, (activeTime - line.time) / lineDuration));

                const activeWordIdx = isCurrentLine
                  ? Math.min(parsedWords.length - 1, Math.floor(lineProgress * parsedWords.length))
                  : -1;

                return (
                  <div
                    key={index}
                    ref={(el) => {
                      lineRefs.current[index] = el;
                    }}
                    onClick={() => handleLineClick(line)}
                    className={`w-full transition-all duration-300 ${getLineSpacingClass(
                      settings.lineSpacing
                    )} ${isSynced ? "cursor-pointer" : "cursor-default"}`}
                  >
                    {isBreak ? (
                      <div className="py-2 text-white/30 italic text-sm flex items-center justify-center">
                        <span>{trimmedText || "Strumentale"}</span>
                      </div>
                    ) : (
                      <div className={`space-y-1 ${
                        settings.alignment === "center" ? "flex flex-col items-center" : "flex flex-col items-start"
                      }`}>
                        {/* Translation */}
                        {showTranslation && translation && (
                          <p className="text-lg md:text-xl font-medium text-white/50 mb-1">
                            {translation}
                          </p>
                        )}

                        {/* ── 4 ANIMATION MODES RENDERER ── */}

                        {/* MODE 1: Standard Full Line Scrolling */}
                        {settings.highlightStyle === "normal" && (
                          <p
                            className={`transition-all duration-300 leading-snug ${getFontSizeClasses(
                              settings.fontSize
                            )} ${
                              isCurrentLine
                                ? themeStyle.textActive + " font-black"
                                : isPastLine
                                ? themeStyle.textPast + " font-medium opacity-40"
                                : themeStyle.textNormal + " font-semibold opacity-70"
                            }`}
                          >
                            {line.text}
                          </p>
                        )}

                        {/* MODE 2: Verci Stack (4-5 Words in Gradient Sizes as seen in image) */}
                        {settings.highlightStyle === "stack" && (
                          <div className={`flex flex-col items-center gap-2 ${
                            settings.alignment === "center" ? "justify-center" : "justify-start"
                          }`}>
                            {parsedWords.map((wInfo, wIdx) => {
                              const isCurrentWord = !wInfo.isPunctOnly && isCurrentLine && wIdx === activeWordIdx;
                              const isPastWord = isCurrentLine ? wIdx < activeWordIdx : isPastLine;
                              const emoji = getWordEmoji(wInfo.word);
                              const isSingleCap = wInfo.word.length === 1 && wInfo.word === wInfo.word.toUpperCase();

                              if (wInfo.isPunctOnly) {
                                return (
                                  <span key={wIdx} className="text-white/40 font-normal select-none">
                                    {wInfo.word}
                                  </span>
                                );
                              }

                              return (
                                <span key={wIdx} className="inline-flex items-baseline select-none">
                                  {wInfo.leadPunct && (
                                    <span className="text-white/40 font-normal select-none mr-0.5">
                                      {wInfo.leadPunct}
                                    </span>
                                  )}
                                  <motion.span
                                    animate={{
                                      scale: isCurrentWord ? 1.25 : 1,
                                      opacity: isCurrentWord ? 1 : isCurrentLine ? 0.8 : isPastWord ? 0.25 : 0.45,
                                    }}
                                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                    className={`inline-flex items-center select-none ${
                                      isCurrentWord
                                        ? isSingleCap
                                          ? `text-red-500 font-black ${getFontSizeClasses(settings.fontSize, "large")} drop-shadow-[0_0_25px_rgba(225,29,72,0.95)]`
                                          : `text-red-500 font-black ${getFontSizeClasses(settings.fontSize, "active")} drop-shadow-[0_0_20px_rgba(225,29,72,0.8)]`
                                        : isCurrentLine
                                        ? `text-white font-extrabold ${getFontSizeClasses(settings.fontSize, "normal")} opacity-80`
                                        : `text-white/30 font-medium ${getFontSizeClasses(settings.fontSize, "small")} opacity-40`
                                    }`}
                                  >
                                    {emoji && (
                                      <span className="mr-2 inline-block text-[0.85em] not-italic select-none">
                                        {emoji}
                                      </span>
                                    )}
                                    <span>{wInfo.word}</span>
                                  </motion.span>
                                  {wInfo.trailPunct && (
                                    <span className="text-white/40 font-normal select-none ml-0.5">
                                      {wInfo.trailPunct}
                                    </span>
                                  )}
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {/* MODE 3: Fisheye Lens Deformation Zoom */}
                        {settings.highlightStyle === "fisheye" && (
                          <div className={`flex flex-wrap items-baseline gap-x-4 gap-y-3 ${
                            settings.alignment === "center" ? "justify-center" : "justify-start"
                          }`}>
                            {parsedWords.map((wInfo, wIdx) => {
                              const isCurrentWord = !wInfo.isPunctOnly && isCurrentLine && wIdx === activeWordIdx;
                              const isPastWord = isCurrentLine ? wIdx < activeWordIdx : isPastLine;
                              const emoji = getWordEmoji(wInfo.word);

                              if (wInfo.isPunctOnly) {
                                return (
                                  <span key={wIdx} className="text-white/40 font-normal select-none">
                                    {wInfo.word}
                                  </span>
                                );
                              }

                              return (
                                <span key={wIdx} className="inline-flex items-baseline select-none">
                                  {wInfo.leadPunct && (
                                    <span className="text-white/40 font-normal select-none mr-0.5">
                                      {wInfo.leadPunct}
                                    </span>
                                  )}
                                  <motion.span
                                    animate={{
                                      scale: isCurrentWord ? 1.65 : isCurrentLine ? 1.05 : 0.9,
                                      rotate: isCurrentWord ? -2 : 0,
                                      y: isCurrentWord ? -10 : 0,
                                      opacity: isCurrentWord ? 1 : isCurrentLine ? 0.85 : isPastWord ? 0.25 : 0.45,
                                    }}
                                    transition={{ type: "spring", stiffness: 450, damping: 20 }}
                                    className={`inline-flex items-center transition-all duration-200 select-none ${
                                      isCurrentWord
                                        ? `text-white font-black ${getFontSizeClasses(settings.fontSize, "active")} drop-shadow-[0_0_35px_rgba(255,255,255,1)]`
                                        : isCurrentLine
                                        ? `text-white font-bold ${getFontSizeClasses(settings.fontSize, "normal")}`
                                        : `text-white/30 font-medium ${getFontSizeClasses(settings.fontSize, "small")}`
                                    }`}
                                  >
                                    {emoji && (
                                      <span className="mr-2 inline-block text-[0.85em] not-italic select-none">
                                        {emoji}
                                      </span>
                                    )}
                                    <span>{wInfo.word}</span>
                                  </motion.span>
                                  {wInfo.trailPunct && (
                                    <span className="text-white/40 font-normal select-none ml-0.5">
                                      {wInfo.trailPunct}
                                    </span>
                                  )}
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {/* MODE 4: Verci Kinetic Banner Badge Highlight */}
                        {settings.highlightStyle === "verci-custom" && (
                          <div className={`flex flex-wrap items-baseline gap-x-4 gap-y-3 ${
                            settings.alignment === "center" ? "justify-center" : "justify-start"
                          }`}>
                            {parsedWords.map((wInfo, wIdx) => {
                              const isCurrentWord = !wInfo.isPunctOnly && isCurrentLine && wIdx === activeWordIdx;
                              const isPastWord = isCurrentLine ? wIdx < activeWordIdx : isPastLine;
                              const emoji = getWordEmoji(wInfo.word);
                              const isSingleCap = wInfo.word.length === 1 && wInfo.word === wInfo.word.toUpperCase();

                              if (wInfo.isPunctOnly) {
                                return (
                                  <span key={wIdx} className="text-white/40 font-normal select-none">
                                    {wInfo.word}
                                  </span>
                                );
                              }

                              return (
                                <span key={wIdx} className="inline-flex items-baseline select-none">
                                  {wInfo.leadPunct && (
                                    <span className="text-white/40 font-normal select-none mr-0.5">
                                      {wInfo.leadPunct}
                                    </span>
                                  )}
                                  <motion.span
                                    animate={{
                                      scale: isCurrentWord ? 1.35 : isCurrentLine ? 1.05 : 0.95,
                                      y: isCurrentWord ? -6 : 0,
                                      opacity: isCurrentWord ? 1 : isCurrentLine ? 0.85 : isPastWord ? 0.25 : 0.45,
                                    }}
                                    transition={{ type: "spring", stiffness: 450, damping: 25 }}
                                    className={`inline-flex items-center transition-all duration-200 select-none ${
                                      isCurrentWord
                                        ? isSingleCap
                                          ? `text-red-500 font-black ${getFontSizeClasses(settings.fontSize, "large")} drop-shadow-[0_0_30px_rgba(225,29,72,0.95)]`
                                          : `bg-[#e11d48] text-white px-4 py-1.5 rounded-lg -skew-x-6 shadow-2xl font-black italic border border-white/30 ${getFontSizeClasses(settings.fontSize, "active")}`
                                        : isCurrentLine
                                        ? `text-white font-extrabold ${getFontSizeClasses(settings.fontSize, "normal")}`
                                        : isPastWord
                                        ? `text-white/25 font-medium ${getFontSizeClasses(settings.fontSize, "small")}`
                                        : `text-white/45 font-medium ${getFontSizeClasses(settings.fontSize, "small")}`
                                    }`}
                                  >
                                    {emoji && (
                                      <span className="mr-2 inline-block text-[0.85em] not-italic select-none drop-shadow">
                                        {emoji}
                                      </span>
                                    )}
                                    <span>{wInfo.word}</span>
                                  </motion.span>
                                  {wInfo.trailPunct && (
                                    <span className="text-white/40 font-normal select-none ml-0.5">
                                      {wInfo.trailPunct}
                                    </span>
                                  )}
                                </span>
                              );
                            })}
                          </div>
                        )}

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Auto-Hiding Player Controls ── */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative z-20 px-6 py-4 border-t border-white/10 bg-black/75 backdrop-blur-xl shrink-0 flex flex-col gap-2"
          >
            {/* Progress Slider */}
            <div className="flex items-center gap-3 w-full max-w-3xl mx-auto">
              <span className="text-xs font-mono text-white/60 w-10 text-right">
                {formatTime(Math.floor(activeTime))}
              </span>
              <input
                type="range"
                min={0}
                max={durationTime}
                value={Math.floor(activeTime)}
                onChange={(e) => seekMutation.mutate(Number(e.target.value) * 1000)}
                className="flex-1 h-1.5 bg-white/20 accent-primary rounded-lg cursor-pointer"
              />
              <span className="text-xs font-mono text-white/60 w-10">
                {formatTime(durationTime)}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-6">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => previousMutation.mutate()}
                className="h-10 w-10 text-white/80 hover:text-white hover:bg-white/15 rounded-full"
              >
                <SkipBack className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                onClick={() => (isPlaying ? pauseMutation.mutate() : playMutation.mutate({}))}
                className="h-12 w-12 rounded-full bg-white text-black hover:bg-white/90 shadow-xl"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                )}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => nextMutation.mutate()}
                className="h-10 w-10 text-white/80 hover:text-white hover:bg-white/15 rounded-full"
              >
                <SkipForward className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── RIGHT EDGE HOVER DETECTION BAND & TRIGGER TAB (Starts below top header) ── */}
      <div
        onMouseEnter={handleRightZoneEnter}
        onMouseLeave={handleRightZoneLeave}
        className="fixed top-20 right-0 w-16 h-[calc(100vh-5rem)] z-[100000] flex items-center justify-end pr-2 pointer-events-auto"
      >
        {/* Subtle Floating Tab Indicator */}
        <motion.button
          onClick={() => setIsDrawerOpen(true)}
          whileHover={{ scale: 1.1 }}
          className={`px-2 py-3.5 rounded-l-2xl border-l border-y backdrop-blur-2xl flex flex-col items-center gap-1 shadow-2xl transition-all ${
            isDrawerOpen
              ? "bg-white/25 text-white border-white/40"
              : "bg-black/80 text-white/70 hover:text-white border-white/20"
          }`}
          title="Sposta mouse qui a destra per personalizzare i testi"
        >
          <Sliders className="w-4 h-4 text-purple-400" />
          <span className="text-[10px] uppercase font-mono font-bold tracking-widest [writing-mode:vertical-rl] rotate-180">
            PERSONALIZZA
          </span>
        </motion.button>
      </div>

      {/* ── VERCI CUSTOMIZATION SIDEBAR DRAWER (SLIDES IN FROM RIGHT) ── */}
      <AnimatePresence>
        {isDrawerOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 32 }}
            onMouseEnter={handleRightZoneEnter}
            onMouseLeave={handleRightZoneLeave}
            className="fixed top-0 right-0 h-full w-80 md:w-96 z-[100001] bg-zinc-950/95 backdrop-blur-2xl border-l border-white/15 shadow-2xl p-6 flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 select-none text-white"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-lg tracking-tight">Personalizzazione Verci</h3>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={resetSettings}
                  title="Ripristina predefiniti"
                  className="h-8 w-8 text-white/60 hover:text-white rounded-full"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsDrawerOpen(false)}
                  className="h-8 w-8 text-white/60 hover:text-white rounded-full"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Customization Options List */}
            <div className="space-y-6 flex-1">
              {/* 🎨 Temi Visivi */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-purple-400" /> Tema Visivo
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "album" as LyricsTheme, name: "Adaptive Cover", color: "bg-gradient-to-r from-pink-500 to-purple-600" },
                    { id: "obsidian" as LyricsTheme, name: "Verci Obsidian", color: "bg-zinc-900 border border-purple-500/50" },
                    { id: "cyber" as LyricsTheme, name: "Cyber Glow", color: "bg-gradient-to-r from-cyan-500 to-blue-600" },
                    { id: "sunset" as LyricsTheme, name: "Sunset Gold", color: "bg-gradient-to-r from-amber-500 to-rose-600" },
                    { id: "midnight" as LyricsTheme, name: "Midnight Blue", color: "bg-gradient-to-r from-blue-700 to-indigo-900" },
                    { id: "emerald" as LyricsTheme, name: "Emerald Forest", color: "bg-gradient-to-r from-emerald-600 to-teal-800" },
                    { id: "glass" as LyricsTheme, name: "Frost Glass", color: "bg-white/10 border border-white/30 backdrop-blur" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => updateSetting("theme", t.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition-all ${
                        settings.theme === t.id
                          ? "border-primary bg-primary/20 text-white font-bold ring-2 ring-primary/40"
                          : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${t.color}`} />
                        <span>{t.name}</span>
                      </div>
                      {settings.theme === t.id && <Check className="w-3.5 h-3.5 text-primary" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* ✨ Stile Animazione (THE 4 MODES) */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-pink-400" /> Stile Animazione
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "normal" as LyricsHighlightStyle, name: "1. Testo Intero" },
                    { id: "stack" as LyricsHighlightStyle, name: "2. Verci Stack" },
                    { id: "fisheye" as LyricsHighlightStyle, name: "3. Fisheye Zoom" },
                    { id: "verci-custom" as LyricsHighlightStyle, name: "4. Verci Banner" },
                  ].map((h) => (
                    <button
                      key={h.id}
                      onClick={() => updateSetting("highlightStyle", h.id)}
                      className={`p-2.5 text-xs font-medium rounded-xl border text-center transition-all ${
                        settings.highlightStyle === h.id
                          ? "border-pink-500 bg-pink-500/20 text-pink-300 font-bold ring-2 ring-pink-500/30"
                          : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      {h.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 🔤 Carattere / Font Family */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-cyan-400" /> Stile Carattere
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "outfit" as LyricsFontFamily, name: "Outfit Display", sample: "Aa" },
                    { id: "sans" as LyricsFontFamily, name: "System Sans", sample: "Aa" },
                    { id: "serif" as LyricsFontFamily, name: "Editorial Serif", sample: "Aa" },
                    { id: "mono" as LyricsFontFamily, name: "Fira Code", sample: "Aa" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => updateSetting("fontFamily", f.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition-all ${
                        settings.fontFamily === f.id
                          ? "border-cyan-400 bg-cyan-400/20 text-white font-bold ring-2 ring-cyan-400/30"
                          : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      <span>{f.name}</span>
                      <span className="font-mono text-xs opacity-60">{f.sample}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 🔠 Dimensione Testo / Font Size */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                  <Maximize className="w-3.5 h-3.5 text-amber-400" /> Dimensione Testo
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "sm" as LyricsFontSize, label: "SM" },
                    { id: "md" as LyricsFontSize, label: "MD" },
                    { id: "lg" as LyricsFontSize, label: "LG" },
                    { id: "xl" as LyricsFontSize, label: "XL" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => updateSetting("fontSize", s.id)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        settings.fontSize === s.id
                          ? "border-amber-400 bg-amber-400/20 text-amber-300 ring-2 ring-amber-400/30"
                          : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 📐 Allineamento Testo */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                  <AlignCenter className="w-3.5 h-3.5 text-emerald-400" /> Allineamento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "center" as LyricsAlignment, label: "Centrato", icon: AlignCenter },
                    { id: "left" as LyricsAlignment, label: "A Sinistra", icon: AlignLeft },
                  ].map((a) => (
                    <button
                      key={a.id}
                      onClick={() => updateSetting("alignment", a.id)}
                      className={`flex items-center justify-center gap-2 py-2.5 text-xs font-medium rounded-xl border transition-all ${
                        settings.alignment === a.id
                          ? "border-emerald-400 bg-emerald-400/20 text-emerald-300 font-bold ring-2 ring-emerald-400/30"
                          : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                      }`}
                    >
                      <a.icon className="w-4 h-4" />
                      <span>{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 🌌 Effetto Sfondo */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Effetti Sfondo
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "blur" as LyricsBackgroundFx, label: "Copertina Sfocata" },
                    { id: "mesh" as LyricsBackgroundFx, label: "Mesh Animata" },
                    { id: "radial" as LyricsBackgroundFx, label: "Radial Glow" },
                    { id: "solid" as LyricsBackgroundFx, label: "Sfondo Solido" },
                  ].map((b) => (
                    <button
                      key={b.id}
                      onClick={() => updateSetting("backgroundFx", b.id)}
                      className={`p-2.5 text-xs font-medium rounded-xl border text-center transition-all ${
                        settings.backgroundFx === b.id
                          ? "border-indigo-400 bg-indigo-400/20 text-indigo-300 font-bold ring-2 ring-indigo-400/30"
                          : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 📏 Interlinea Spacing */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-white/50">
                  Interlinea
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "compact" as LyricsLineSpacing, label: "Stretta" },
                    { id: "normal" as LyricsLineSpacing, label: "Normale" },
                    { id: "relaxed" as LyricsLineSpacing, label: "Ampia" },
                  ].map((sp) => (
                    <button
                      key={sp.id}
                      onClick={() => updateSetting("lineSpacing", sp.id)}
                      className={`py-2 text-xs font-medium rounded-xl border text-center transition-all ${
                        settings.lineSpacing === sp.id
                          ? "border-white bg-white/20 text-white font-bold"
                          : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                      }`}
                    >
                      {sp.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="pt-4 mt-6 border-t border-white/10 text-[11px] text-white/40 text-center">
              Le impostazioni vengono salvate automaticamente per la tua prossima sessione.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
