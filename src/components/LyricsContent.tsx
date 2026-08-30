import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic2,
  Disc,
  Lightbulb,
  Music,
  Loader2,
  Clock,
  Languages,
  AlignCenter,
  AlignLeft,
  Sparkles,
  Brain,
  BookOpen,
  Waves,
  BarChart3,
  Radio,
  Gauge,
  Music2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Track } from "@/lib/mock-data";
import { usePlaybackState, useSeekMutation } from "@/hooks/useSpotify";
import { formatTime } from "@/lib/mock-data";
import {
  fetchSyncedLyrics,
  getCurrentLineIndex,
  type LyricLine,
} from "@/services/lyrics-api";
import { translateText } from "@/services/translation-api";
import { useToast } from "@/hooks/use-toast";
import { gooeyToast } from "goey-toast";
import { useVocalRemover } from "@/hooks/useVocalRemover";
import {
  fetchSongTrivia,
  type TriviaResult,
  fetchSongAnalysis,
  type AIAnalysisResult,
} from "@/services/trivia-api";
import { lyricsStore } from "@/hooks/useLyricsStore";

interface LyricsContentProps {
  currentTrack: Track | null;
}
type Mode = "lyrics" | "info" | "analysis" | "trivia";

// ── Vocal pitch & tone detection heuristics ─────────────────────────────
const isChorusLike = (text: string): boolean => {
  return /^\(/.test(text.trim()) || /^\[/.test(text.trim());
};

const detectHighPitch = (word: string): boolean => {
  const w = word.replace(/[^a-zA-Z]/g, "");
  if (w.length < 2) return false;
  return w === w.toUpperCase() || word.includes("!");
};

const detectLowPitch = (word: string): boolean => {
  return /[…]$/.test(word) || /\*/.test(word) || word.startsWith("~");
};

const detectVibrato = (word: string): boolean => {
  return /([aeiouy])\1{2,}/i.test(word);
};

function getWeightedActiveIndex<T extends { text: string }>(
  words: T[],
  progress: number
): number {
  if (progress <= 0) return -1;
  if (progress >= 1) return words.length;
  const weights = words.map((word) =>
    Math.max(0.7, Math.sqrt(word.text.replace(/[^\w]/g, "").length || 1))
  );
  const total = weights.reduce((sum, weight) => sum + weight, 0) || 1;
  const target = total * progress;
  let acc = 0;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i];
    if (target < acc) return i;
  }
  return words.length;
}

export default function LyricsContent({
  currentTrack: localTrack,
}: LyricsContentProps) {
  const [mode, setMode] = useState<Mode>("lyrics");
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [translatedLyrics, setTranslatedLyrics] = useState<Map<number, string>>(
    new Map()
  );
  const [showTranslation, setShowTranslation] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [centerMode, setCenterMode] = useState(true);
  const [userScrolling, setUserScrolling] = useState(false);
  const [trivia, setTrivia] = useState<TriviaResult[]>([]);
  const [loadingTrivia, setLoadingTrivia] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const { isKaraokeActive, toggleKaraoke } = useVocalRemover();

  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const userScrollRef = useRef(false);
  const isProgrammaticScrollRef = useRef(false);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const playbackRateRef = useRef(1);

  const { data: playbackState } = usePlaybackState();
  const currentTrack = playbackState?.item || localTrack;
  const seekMutation = useSeekMutation();
  const { toast } = useToast();

  const isPlaying = playbackState?.is_playing;
  const currentTime = playbackState?.progress_ms
    ? playbackState.progress_ms / 1000
    : 0;

  // ── High-precision 60fps clock ──────────────────────────────────────────
  const [activeTime, setActiveTime] = useState(0);
  const syncRef = useRef<{ baseTime: number; updatedAt: number; rate: number }>({
    baseTime: 0,
    updatedAt: performance.now(),
    rate: 1,
  });

  const [containerHeight, setContainerHeight] = useState(400);

  // ── Background Screen Wake Lock API ───────────────────────────────────────
  useEffect(() => {
    if (mode !== "lyrics") return;
    let wakeLock: any = null;

    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await (navigator as any).wakeLock.request("screen");
          wakeLock.addEventListener("release", () => {});
        }
      } catch (err) {
        console.warn("Screen Wake Lock error:", err);
      }
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && mode === "lyrics") {
        requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, [mode]);

  useEffect(() => {
    const els = document.querySelectorAll<HTMLMediaElement>("audio, video");
    let rate = 1;
    els.forEach((el) => {
      if (el.playbackRate && el.playbackRate !== 1) rate = el.playbackRate;
    });
    playbackRateRef.current = rate;
    syncRef.current = { baseTime: currentTime, updatedAt: performance.now(), rate };
    setActiveTime(currentTime);
  }, [currentTime]);

  // High precision rAF tick
  useEffect(() => {
    if (!isPlaying) return;
    let animId: number;
    const tick = () => {
      const now = performance.now();
      const elapsed = (now - syncRef.current.updatedAt) / 1000;
      const rate = syncRef.current.rate;
      setActiveTime(syncRef.current.baseTime + elapsed * rate + 0.12 * rate);
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  // Dynamic container height tracker
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) setContainerHeight(entry.contentRect.height);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [lyrics]);

  // ── Load lyrics ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentTrack) return;
    const trackId = (currentTrack as any)?.id;
    const title = (currentTrack as any).name || (currentTrack as any).title || "";
    const artist =
      (currentTrack as any).artists?.[0]?.name ||
      (currentTrack as any).artist ||
      "";
    const duration = (currentTrack as any).duration_ms
      ? Math.floor((currentTrack as any).duration_ms / 1000)
      : (currentTrack as any).duration || 180;

    setLyrics([]);
    setTranslatedLyrics(new Map());
    setShowTranslation(false);
    setCurrentLineIndex(0);
    setActiveTime(0);

    const cached = trackId ? lyricsStore.getLyrics(trackId) : null;
    if (cached) {
      setLyrics(cached.lines);
      setIsSynced(cached.synced);
      setLoadingLyrics(false);
      const cachedTrans = lyricsStore.getTranslation(trackId);
      if (cachedTrans) setTranslatedLyrics(cachedTrans);
    } else {
      setLoadingLyrics(true);
      fetchSyncedLyrics(title, artist, duration).then(({ lines, synced }) => {
        setLyrics(lines);
        setIsSynced(synced);
        setLoadingLyrics(false);
        if (trackId) lyricsStore.setLyrics(trackId, { lines, synced });
      });
    }

    setLoadingTrivia(true);
    fetchSongTrivia(artist, title).then((res) => {
      setTrivia(res);
      setLoadingTrivia(false);
    });
    setLoadingAnalysis(true);
    fetchSongAnalysis(artist, title).then((res) => {
      setAnalysis(res);
      setLoadingAnalysis(false);
    });
  }, [(currentTrack as any)?.id]);

  // ── Update current line index ─────────────────────────────────────────────
  useEffect(() => {
    if (lyrics.length > 0) {
      const idx = getCurrentLineIndex(lyrics, activeTime);
      if (idx !== currentLineIndex) setCurrentLineIndex(idx);
    }
  }, [activeTime, lyrics]);

  // ── Discrete Line-by-Line Auto-Centering (Scrolls UP when line finishes) ──
  const scrollToLine = useCallback(
    (lineIndex: number, animate = true) => {
      if (!centerMode || userScrollRef.current || !containerRef.current) return;
      const container = containerRef.current;
      const lineEl = lineRefs.current[lineIndex];
      if (!lineEl) return;

      const containerRect = container.getBoundingClientRect();
      const lineRect = lineEl.getBoundingClientRect();

      const containerCenterY = containerRect.top + containerRect.height / 2;
      const lineCenterY = lineRect.top + lineRect.height / 2;
      const delta = lineCenterY - containerCenterY;

      const targetScroll = container.scrollTop + delta;

      isProgrammaticScrollRef.current = true;
      container.scrollTo({
        top: Math.max(0, targetScroll),
        behavior: animate ? "smooth" : "auto",
      });

      setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 450);
    },
    [centerMode]
  );

  // Center active line when currentLineIndex updates
  useEffect(() => {
    if (!centerMode || mode !== "lyrics" || lyrics.length === 0) return;
    scrollToLine(currentLineIndex, true);
  }, [currentLineIndex, centerMode, mode, lyrics.length, scrollToLine]);

  // Trigger smooth scroll slide-up as the line is finishing (~350ms before next line)
  useEffect(() => {
    if (!centerMode || mode !== "lyrics" || lyrics.length === 0 || !isPlaying) return;
    const currentLine = lyrics[currentLineIndex];
    const nextLine = lyrics[currentLineIndex + 1];
    if (!currentLine || !nextLine) return;

    const timeUntilNext = nextLine.time - activeTime;
    if (timeUntilNext <= 0.35 && timeUntilNext > 0) {
      scrollToLine(currentLineIndex + 1, true);
    }
  }, [activeTime, currentLineIndex, centerMode, mode, lyrics, isPlaying, scrollToLine]);

  const handleScroll = useCallback(() => {
    if (!centerMode || isProgrammaticScrollRef.current) return;
    userScrollRef.current = true;
    setUserScrolling(true);
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      userScrollRef.current = false;
      setUserScrolling(false);
      scrollToLine(currentLineIndex, true);
    }, 3000);
  }, [centerMode, currentLineIndex, scrollToLine]);

  const handleLineClick = async (line: LyricLine) => {
    try {
      await seekMutation.mutateAsync(Math.floor(line.time * 1000));
      userScrollRef.current = false;
      setUserScrolling(false);
    } catch {
      toast({
        title: "Seek non riuscito",
        description: "Assicurati che un dispositivo sia in riproduzione",
        variant: "destructive",
      });
    }
  };

  const handleTranslate = async () => {
    if (showTranslation) {
      setShowTranslation(false);
      return;
    }
    if (translatedLyrics.size > 0) {
      setShowTranslation(true);
      return;
    }
    setIsTranslating(true);
    const systemLang = navigator.language?.split("-")[0] || "it";

    const translatePromise = (async () => {
      const map = new Map<number, string>();
      for (let i = 0; i < lyrics.length; i++) {
        const l = lyrics[i];
        if (l.text.trim() && !l.text.includes("♪")) {
          const res = await translateText(l.text, systemLang);
          if (res) map.set(i, res.translatedText);
        }
        if (i % 5 === 0) setTranslatedLyrics(new Map(map));
      }
      setTranslatedLyrics(map);
      setShowTranslation(true);
      return map;
    })();

    try {
      gooeyToast.promise(translatePromise, {
        loading: `Traduzione in corso (${systemLang.toUpperCase()})`,
        success: (map: any) => `Traduzione completata (${map.size} righe)`,
        error: "Errore durante la traduzione",
      });
      await translatePromise;
    } catch {
      // toast error handled by promise
    } finally {
      setIsTranslating(false);
    }
  };

  if (!currentTrack) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <Mic2 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">
            Riproduci un brano per visualizzare il testo
          </p>
        </div>
      </div>
    );
  }

  const spotifyTrack = playbackState?.item;
  const trackDurationSeconds = (currentTrack as any).duration_ms
    ? Math.floor((currentTrack as any).duration_ms / 1000)
    : (currentTrack as any).duration || 180;

  return (
    <div className="flex-1 overflow-hidden flex flex-col animate-fade-in">
      {/* ── Elegant Header Layout ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 pt-4 pb-3 shrink-0 border-b border-border/30">
        {/* LEFT COLUMN: Track Info (Row 1) & Action Buttons (Row 2 under title) */}
        <div className="flex flex-col gap-2 min-w-0 flex-1">
          {/* Row 1: Image, Title, Artist, Synced Badge */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <img
                src={
                  (currentTrack as any).album?.images?.[0]?.url ||
                  (currentTrack as any).cover ||
                  ""
                }
                alt=""
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover shadow-md"
              />
              {isPlaying && (
                <motion.div
                  className="absolute inset-0 rounded-xl ring-2 ring-primary/50"
                  animate={{ opacity: [0.4, 0.9, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </div>
            <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap">
              <p className="font-bold text-sm sm:text-base truncate text-foreground">
                {(currentTrack as any).name || (currentTrack as any).title}
              </p>
              <span className="text-muted-foreground/60 font-normal text-xs">•</span>
              <p className="text-xs sm:text-sm text-muted-foreground truncate font-medium">
                {(currentTrack as any).artists?.[0]?.name ||
                  (currentTrack as any).artist}
              </p>
              {isSynced && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 shrink-0 border border-emerald-500/20 ml-1">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  <span className="text-[11px] font-semibold">Synced</span>
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Action Buttons placed directly UNDER Title & Artist */}
          {mode === "lyrics" && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none sm:pl-[3.75rem]">
              {isSynced && (
                <Button
                  size="sm"
                  variant={centerMode ? "default" : "outline"}
                  onClick={() => {
                    setCenterMode((v) => {
                      const next = !v;
                      if (next) {
                        userScrollRef.current = false;
                        setTimeout(() => scrollToLine(currentLineIndex, true), 50);
                      }
                      return next;
                    });
                  }}
                  className="h-6 px-2.5 text-[11px] gap-1 shrink-0 rounded-full"
                >
                  {centerMode ? (
                    <AlignCenter className="w-3 h-3" />
                  ) : (
                    <AlignLeft className="w-3 h-3" />
                  )}
                  {centerMode ? "Centered" : "Free"}
                </Button>
              )}
              {lyrics.length > 0 && !isTranslating && (
                <Button
                  size="sm"
                  variant={showTranslation ? "default" : "outline"}
                  onClick={handleTranslate}
                  className="h-6 px-2.5 text-[11px] gap-1 shrink-0 rounded-full"
                >
                  <Languages className="w-3 h-3" />
                  {showTranslation ? "Original" : "Translate"}
                </Button>
              )}
              <Button
                size="sm"
                variant={isKaraokeActive ? "default" : "outline"}
                onClick={toggleKaraoke}
                className={`h-6 px-2.5 text-[11px] gap-1 shrink-0 rounded-full transition-all ${
                  isKaraokeActive
                    ? "bg-pink-600 text-white hover:bg-pink-700 shadow-md shadow-pink-600/30"
                    : "text-muted-foreground"
                }`}
              >
                <Mic2 className="w-3 h-3" />
                {isKaraokeActive ? "Karaoke ON" : "Karaoke Mode"}
              </Button>
              {isTranslating && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  <Loader2 className="w-3 h-3 animate-spin text-primary" />
                  <span className="text-[11px] font-medium">Translating…</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Mode Navigation Tabs (Lyrics, About, Info, Analysis) */}
        <div className="flex items-center gap-0.5 p-1 rounded-full bg-secondary shrink-0 self-start sm:self-center overflow-x-auto">
          {[
            { id: "lyrics" as Mode, label: "Lyrics", icon: Mic2 },
            { id: "trivia" as Mode, label: "About", icon: Lightbulb },
            { id: "info" as Mode, label: "Info", icon: Disc },
            { id: "analysis" as Mode, label: "Analysis", icon: Music },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMode(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                mode === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-hidden relative">
        {/* ── LYRICS ── */}
        {mode === "lyrics" && (
          <div
            ref={containerRef}
            onScroll={handleScroll}
            className="absolute inset-0 overflow-y-auto pb-10"
          >
            {loadingLyrics ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
                <p className="text-sm text-muted-foreground">Loading lyrics…</p>
              </div>
            ) : lyrics.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-4 text-center">
                <Music className="w-14 h-14 text-muted-foreground/30 mb-3" />
                <h3 className="text-lg font-semibold mb-1">
                  Lyrics not available
                </h3>
                <p className="text-sm text-muted-foreground">
                  No lyrics found for this track
                </p>
              </div>
            ) : (
              <>
                {/* Vertical spacer ensuring 1st stanza starts dead center */}
                <div
                  style={{ height: `${containerHeight / 2}px` }}
                  aria-hidden
                />

                <AnimatePresence>
                  {userScrolling && centerMode && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="sticky top-2 z-10 mx-auto mb-2 py-1.5 px-3 bg-secondary/90 backdrop-blur-sm rounded-full text-center w-fit shadow-lg"
                    >
                      <p className="text-[10px] text-muted-foreground font-medium">
                        Auto-scroll paused · resumes in 3s
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mx-auto w-full max-w-4xl px-4 md:px-8 space-y-1 flex flex-col items-center md:items-start">
                  {lyrics.map((line, index) => {
                    const isCurrent = index === currentLineIndex;
                    const isPast = index < currentLineIndex;
                    const translation = translatedLyrics.get(index);
                    const isBreak =
                      !line.text.trim() ||
                      /^\[.*\]$/.test(line.text) ||
                      /^\(.*\)$/.test(line.text) ||
                      /instrumental|music/i.test(line.text);

                    const hasSyncWords = line.words && line.words.length > 0;
                    const words = hasSyncWords
                      ? line.words!.map((w) => w.text)
                      : line.text.split(/\s+/);

                    let openParen = 0;
                    const categorizedWords = words.map((w, i) => {
                      const opens = (w.match(/[\(\[]/g) || []).length;
                      const closes = (w.match(/[\)\]]/g) || []).length;
                      const isChorus = openParen > 0 || opens > 0;
                      openParen += opens;
                      openParen -= closes;
                      openParen = Math.max(0, openParen);

                      // Vocal pitch variation detection
                      const isHigh = detectHighPitch(w);
                      const isLow = detectLowPitch(w);
                      const isVib = detectVibrato(w);

                      return { text: w, index: i, isChorus, isHigh, isLow, isVib };
                    });

                    const mainWords = categorizedWords.filter((w) => !w.isChorus);
                    const chorusWords = categorizedWords.filter((w) => w.isChorus);

                    const nextLine = lyrics[index + 1];
                    const lineEndTime =
                      line.endTime ??
                      nextLine?.time ??
                      Math.min(
                        trackDurationSeconds,
                        line.time + Math.max(2.5, words.length * 0.45)
                      );
                    const lineDuration = Math.max(0.25, lineEndTime - line.time);
                    const lineProgress = Math.max(
                      0,
                      Math.min(1, (activeTime - line.time) / lineDuration)
                    );

                    let activeWordIndex = -1;
                    let activeMainIndex = -1;
                    let activeChorusIndex = -1;

                    let isStrictlySequential = false;
                    let isChorusAtEnd = false;
                    if (mainWords.length > 0 && chorusWords.length > 0) {
                      const firstChorus = categorizedWords.findIndex(
                        (w) => w.isChorus
                      );
                      const lastMain =
                        categorizedWords.length -
                        1 -
                        [...categorizedWords]
                          .reverse()
                          .findIndex((w) => !w.isChorus);
                      if (firstChorus > lastMain) {
                        isStrictlySequential = true;
                        isChorusAtEnd = true;
                      } else {
                        const lastChorus =
                          categorizedWords.length -
                          1 -
                          [...categorizedWords]
                            .reverse()
                            .findIndex((w) => w.isChorus);
                        const firstMain = categorizedWords.findIndex(
                          (w) => !w.isChorus
                        );
                        if (lastChorus < firstMain) {
                          isStrictlySequential = true;
                          isChorusAtEnd = false;
                        }
                      }
                    }

                    if (hasSyncWords) {
                      const nextFutureIndex = line.words!.findIndex(
                        (w) => w.time > activeTime
                      );
                      if (nextFutureIndex === -1) {
                        activeWordIndex = line.words!.length;
                      } else if (nextFutureIndex === 0) {
                        activeWordIndex = -1;
                      } else {
                        activeWordIndex = nextFutureIndex - 1;
                      }
                    } else {
                      if (isStrictlySequential) {
                        const globalActiveIndex = getWeightedActiveIndex(
                          categorizedWords,
                          lineProgress
                        );
                        if (isChorusAtEnd) {
                          if (globalActiveIndex < mainWords.length) {
                            activeMainIndex = globalActiveIndex;
                            activeChorusIndex = -1;
                          } else {
                            activeMainIndex = mainWords.length;
                            activeChorusIndex =
                              globalActiveIndex - mainWords.length;
                          }
                        } else {
                          if (globalActiveIndex < chorusWords.length) {
                            activeChorusIndex = globalActiveIndex;
                            activeMainIndex = -1;
                          } else {
                            activeChorusIndex = chorusWords.length;
                            activeMainIndex =
                              globalActiveIndex - chorusWords.length;
                          }
                        }
                      } else {
                        activeMainIndex = getWeightedActiveIndex(
                          mainWords,
                          lineProgress
                        );
                        activeChorusIndex = getWeightedActiveIndex(
                          chorusWords,
                          lineProgress
                        );
                      }
                    }

                    // ── Tone & Pitch color class generator ────────────────────
                    const getWordPitchStyle = (
                      wInfo: { isHigh: boolean; isLow: boolean; isVib: boolean },
                      isActive: boolean,
                      isPastWord: boolean,
                      isChorusWord = false
                    ): string => {
                      if (isPastWord) {
                        return isChorusWord
                          ? "text-muted-foreground/25 opacity-40"
                          : "text-muted-foreground/30 opacity-50";
                      }
                      if (isActive) {
                        if (wInfo.isHigh) {
                          return "text-amber-300 font-black drop-shadow-[0_0_16px_rgba(251,191,36,0.9)] animate-pulse";
                        }
                        if (wInfo.isLow) {
                          return "text-cyan-300 font-semibold italic drop-shadow-[0_0_14px_rgba(6,182,212,0.8)]";
                        }
                        if (wInfo.isVib) {
                          return "text-pink-400 font-extrabold drop-shadow-[0_0_18px_rgba(244,63,94,0.9)] animate-bounce-short";
                        }
                        return isChorusWord
                          ? "text-violet-300 font-bold drop-shadow-[0_0_12px_rgba(167,139,250,0.8)]"
                          : "text-primary font-black drop-shadow-[0_0_14px_hsl(var(--primary)/0.5)]";
                      }
                      return isChorusWord ? "text-foreground/50 italic" : "text-foreground/75";
                    };

                    return (
                      <div
                        key={index}
                        ref={(el) => {
                          lineRefs.current[index] = el;
                        }}
                        onClick={() => isSynced && handleLineClick(line)}
                        className={`
                          w-full px-4 py-3 rounded-2xl transition-all duration-300 flex flex-col items-center md:items-start justify-center text-center md:text-left
                          ${isSynced ? "cursor-pointer hover:bg-secondary/40 active:scale-[0.98]" : "cursor-default"}
                          ${isCurrent ? "bg-primary/10 border border-primary/20 shadow-[0_0_24px_rgba(0,0,0,0.2)]" : ""}
                        `}
                      >
                        {isBreak ? (
                          <div className="flex items-center justify-center md:justify-start gap-2 py-1 text-center md:text-left w-full">
                            <Music
                              className={`w-4 h-4 ${isCurrent ? "text-primary" : "text-muted-foreground/30"}`}
                            />
                            <span
                              className={`text-sm italic text-center md:text-left ${isCurrent ? "text-primary" : "text-muted-foreground/30"}`}
                            >
                              {line.text.trim() || "Instrumental"}
                            </span>
                            <Music
                              className={`w-4 h-4 ${isCurrent ? "text-primary" : "text-muted-foreground/30"}`}
                            />
                          </div>
                        ) : (
                          <div className="space-y-1.5 flex flex-col items-center md:items-start justify-center w-full text-center md:text-left">
                            {/* Translation */}
                            {showTranslation && translation && (
                              <p
                                className={`leading-snug transition-all duration-300 font-medium text-center md:text-left w-full md:w-auto px-2 md:px-0 ${
                                  isCurrent
                                    ? "text-primary/80 font-semibold text-base md:text-xl animate-fade-in"
                                    : isPast
                                      ? "text-muted-foreground/25 text-xs md:text-sm"
                                      : "text-muted-foreground/45 text-xs md:text-sm"
                                }`}
                              >
                                {translation}
                              </p>
                            )}

                            {/* Karaoke bouncy rendering (ONLY ACTIVE WHEN KARAOKE MODE IS ON) */}
                            {isCurrent && isKaraokeActive ? (
                              <div className="flex flex-col items-center md:items-start w-full gap-2">
                                {mainWords.length > 0 && (
                                  <div className="flex flex-wrap justify-center md:justify-start gap-x-2.5 gap-y-1.5 w-full md:w-auto text-center md:text-left px-2 md:px-0 py-1">
                                    {mainWords.map((wInfo, localIdx) => {
                                      const isWordActive = hasSyncWords
                                        ? wInfo.index === activeWordIndex
                                        : localIdx === activeMainIndex;
                                      const isWordPast = hasSyncWords
                                        ? wInfo.index < activeWordIndex
                                        : localIdx < activeMainIndex;
                                      return (
                                        <motion.span
                                          key={wInfo.index}
                                          animate={{
                                            scale: isWordActive ? (wInfo.isHigh ? 1.35 : 1.25) : 1,
                                            y: isWordActive ? -3 : 0,
                                          }}
                                          transition={{
                                            duration: 0.15,
                                            ease: "easeOut",
                                          }}
                                          className={`inline-block font-extrabold text-2xl md:text-4xl transition-colors duration-200 select-none ${getWordPitchStyle(
                                            wInfo,
                                            isWordActive,
                                            isWordPast
                                          )}`}
                                        >
                                          {wInfo.text}
                                        </motion.span>
                                      );
                                    })}
                                  </div>
                                )}

                                {chorusWords.length > 0 && (
                                  <div className="flex flex-wrap justify-center md:justify-start gap-x-2 gap-y-1 w-full md:w-auto text-center md:text-left px-2 md:px-0 py-0.5 opacity-90">
                                    {chorusWords.map((wInfo, localIdx) => {
                                      const isWordActive = hasSyncWords
                                        ? wInfo.index === activeWordIndex
                                        : localIdx === activeChorusIndex;
                                      const isWordPast = hasSyncWords
                                        ? wInfo.index < activeWordIndex
                                        : localIdx < activeChorusIndex;
                                      return (
                                        <motion.span
                                          key={wInfo.index}
                                          animate={{
                                            scale: isWordActive ? 1.18 : 1,
                                            y: isWordActive ? -1.5 : 0,
                                          }}
                                          transition={{
                                            duration: 0.15,
                                            ease: "easeOut",
                                          }}
                                          className={`inline-block font-bold italic text-xl md:text-3xl transition-colors duration-200 select-none ${getWordPitchStyle(
                                            wInfo,
                                            isWordActive,
                                            isWordPast,
                                            true
                                          )}`}
                                        >
                                          {wInfo.text}
                                        </motion.span>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            ) : (
                              /* Standard Plain Text Line Rendering (WHEN KARAOKE MODE IS OFF) */
                              <div className="flex flex-col items-center md:items-start w-full">
                                {mainWords.length > 0 && (
                                  <p
                                    className={`leading-snug transition-all duration-300 font-medium text-center md:text-left w-full md:w-auto px-2 md:px-0 ${
                                      isCurrent
                                        ? "text-primary font-bold text-2xl md:text-3xl"
                                        : isPast
                                          ? "text-muted-foreground/35 text-lg md:text-xl"
                                          : "text-foreground/65 text-lg md:text-xl"
                                    }`}
                                  >
                                    {mainWords.map((w) => w.text).join(" ")}
                                  </p>
                                )}
                                {chorusWords.length > 0 && (
                                  <p
                                    className={`leading-snug transition-all duration-300 font-medium text-center md:text-left w-full md:w-auto px-2 md:px-0 italic mt-1 ${
                                      isCurrent
                                        ? "text-primary/80 font-bold text-xl md:text-2xl"
                                        : isPast
                                          ? "text-muted-foreground/25 text-base md:text-lg"
                                          : "text-foreground/50 text-base md:text-lg"
                                    }`}
                                  >
                                    {chorusWords.map((w) => w.text).join(" ")}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Timestamp */}
                            {isSynced && isCurrent && (
                              <p className="text-[10px] text-primary/50 font-mono mt-1 text-center md:text-left w-full md:w-auto">
                                {formatTime(Math.floor(line.time))}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Bottom spacer */}
                <div
                  style={{ height: `${containerHeight / 2 + 60}px` }}
                  aria-hidden
                />
              </>
            )}
          </div>
        )}

        {/* ── INFO ── */}
        {mode === "info" && spotifyTrack && (
          <div className="absolute inset-0 overflow-y-auto p-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5 max-w-2xl mx-auto"
            >
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <img
                  src={spotifyTrack.album.images[0]?.url}
                  alt={spotifyTrack.album.name}
                  className="w-full sm:w-44 aspect-square rounded-xl object-cover shadow-xl"
                />
                <div className="flex-1 space-y-3 w-full">
                  <div>
                    <h2 className="text-xl font-bold break-words">
                      {spotifyTrack.name}
                    </h2>
                    <p className="text-muted-foreground break-words">
                      {spotifyTrack.artists.map((a: any) => a.name).join(", ")}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Album", value: spotifyTrack.album.name },
                      {
                        label: "Release",
                        value: spotifyTrack.album.release_date,
                      },
                      {
                        label: "Duration",
                        value: formatTime(
                          Math.floor(spotifyTrack.duration_ms / 1000)
                        ),
                      },
                    ].map(({ label, value }) => (
                      <div key={label} className="space-y-0.5">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-sm font-medium break-words">
                          {value}
                        </p>
                      </div>
                    ))}
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Popularity
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${spotifyTrack.popularity}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">
                          {spotifyTrack.popularity}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* ── TRIVIA / ABOUT ── */}
        {mode === "trivia" && (
          <div className="absolute inset-0 overflow-y-auto p-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 max-w-2xl mx-auto"
            >
              {loadingTrivia ? (
                <div className="flex items-center justify-center py-16 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Caricamento curiosità…</p>
                </div>
              ) : trivia.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Lightbulb className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">
                    Nessuna curiosità disponibile per questo brano
                  </p>
                </div>
              ) : (
                trivia.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <Card className="p-4 space-y-2 border border-border/40 shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{item.emoji || "🎵"}</span>
                          <h3 className="font-semibold text-sm">{item.title}</h3>
                        </div>
                        {item.type && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-mono">
                            {item.type.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.extract || item.content}
                      </p>
                      {item.source && (
                        <p className="text-[10px] text-muted-foreground/60 font-mono pt-1">
                          Fonte: {item.source}
                        </p>
                      )}
                    </Card>
                  </motion.div>
                ))
              )}
            </motion.div>
          </div>
        )}

        {/* ── ANALYSIS ── */}
        {mode === "analysis" && (
          <div className="absolute inset-0 overflow-y-auto p-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 max-w-2xl mx-auto"
            >
              {loadingAnalysis ? (
                <div className="flex items-center justify-center py-16 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Analisi musicale in corso…
                  </p>
                </div>
              ) : !analysis ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <BarChart3 className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">
                    Nessuna analisi disponibile
                  </p>
                </div>
              ) : (
                <>
                  {/* Technical Specs Header Card (BPM, Key, Style) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {analysis.bpm && (
                      <Card className="p-3 flex flex-col justify-center border border-primary/20 bg-primary/5">
                        <div className="flex items-center gap-1.5 text-xs text-primary font-medium mb-0.5">
                          <Gauge className="w-3.5 h-3.5 text-primary" /> Tempo / BPM
                        </div>
                        <p className="text-base font-bold tracking-tight">{analysis.bpm}</p>
                      </Card>
                    )}
                    {analysis.key && (
                      <Card className="p-3 flex flex-col justify-center border border-purple-500/20 bg-purple-500/5">
                        <div className="flex items-center gap-1.5 text-xs text-purple-400 font-medium mb-0.5">
                          <Music2 className="w-3.5 h-3.5 text-purple-400" /> Tonalità
                        </div>
                        <p className="text-base font-bold tracking-tight">{analysis.key}</p>
                      </Card>
                    )}
                    {analysis.style && (
                      <Card className="p-3 flex flex-col justify-center border border-amber-500/20 bg-amber-500/5 col-span-2 sm:col-span-1">
                        <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium mb-0.5">
                          <Disc className="w-3.5 h-3.5 text-amber-400" /> Genere
                        </div>
                        <p className="text-sm font-bold truncate">{analysis.style}</p>
                      </Card>
                    )}
                  </div>

                  {/* Instruments */}
                  {analysis.instruments && (
                    <Card className="p-4 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-emerald-400" />
                        <h3 className="font-semibold text-sm">Strumentazione & Sound Design</h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {analysis.instruments}
                      </p>
                    </Card>
                  )}

                  {/* Production & Structure */}
                  {analysis.description && (
                    <Card className="p-4 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-cyan-400" />
                        <h3 className="font-semibold text-sm">Arrangiamento & Struttura</h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {analysis.description}
                      </p>
                    </Card>
                  )}

                  {/* Mood */}
                  {analysis.mood && (
                    <Card className="p-4 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Waves className="w-4 h-4 text-pink-500" />
                        <h3 className="font-semibold text-sm">Mood & Atmosfera</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {analysis.mood}
                      </p>
                    </Card>
                  )}

                  {/* Themes */}
                  {analysis.themes && analysis.themes.length > 0 && (
                    <Card className="p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <h3 className="font-semibold text-sm">
                          Temi principali
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {analysis.themes.map((theme, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 bg-secondary rounded-full text-xs font-medium text-foreground"
                          >
                            {theme}
                          </span>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Summary / Interpretation */}
                  {analysis.summary && (
                    <Card className="p-4 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-violet-400" />
                        <h3 className="font-semibold text-sm">
                          Interpretazione Lirica
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {analysis.summary}
                      </p>
                    </Card>
                  )}

                  {/* Literary Devices */}
                  {analysis.literaryDevices &&
                    analysis.literaryDevices.length > 0 && (
                      <Card className="p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-emerald-400" />
                          <h3 className="font-semibold text-sm">
                            Figure Retoriche & Stile Lirico
                          </h3>
                        </div>
                        <ul className="space-y-1">
                          {analysis.literaryDevices.map((d, i) => (
                            <li
                              key={i}
                              className="text-sm text-muted-foreground flex items-start gap-2"
                            >
                              <span className="text-emerald-400 mt-0.5">•</span>
                              <span>{d}</span>
                            </li>
                          ))}
                        </ul>
                      </Card>
                    )}

                  {/* Cultural Context */}
                  {analysis.culturalContext && (
                    <Card className="p-4 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Radio className="w-4 h-4 text-blue-400" />
                        <h3 className="font-semibold text-sm">
                          Contesto Culturale & Impatto
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {analysis.culturalContext}
                      </p>
                    </Card>
                  )}
                </>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
