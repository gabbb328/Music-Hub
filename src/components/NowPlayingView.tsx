import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  X,
  Heart,
  Share2,
  MoreHorizontal,
  Sparkles,
  BarChart3,
  Mic2,
  ListMusic,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Timer,
  Volume2,
  Volume1,
  VolumeX,
  Zap,
  Star,
  TrendingUp,
  Disc3,
  Users,
  Video,
  Copy,
  ChevronDown,
  ChevronRight,
  Smartphone,
  Speaker,
  Laptop,
  Check,
  Radio,
  Tv,
  Monitor,
  Maximize2,
  Languages,
  Loader2,
} from "lucide-react";
import VinylNowPlayingView from "./VinylNowPlayingView";
import IpodNowPlayingView from "./IpodNowPlayingView";
import VisualizerCanvas from "./VisualizerCanvas";
import GemOverlay from "./GemOverlay";
import { useGemOverlay } from "@/hooks/useGemOverlay";
import { useSessionContext } from "@/contexts/SessionContext";
import { formatTime } from "@/lib/mock-data";
import {
  usePlaybackState,
  useSaveTrackMutation,
  useRemoveTrackMutation,
  useQueue,
  usePlayMutation,
  usePauseMutation,
  useNextMutation,
  usePreviousMutation,
  useShuffleMutation,
  useRepeatMutation,
  useSeekMutation,
  useAudioFeatures,
  useCheckSavedTracks,
  useAvailableDevices,
  useTransferPlaybackMutation,
  useSetVolumeMutation,
} from "@/hooks/useSpotify";
import { useToast } from "@/hooks/use-toast";
import { lyricsStore } from "@/hooks/useLyricsStore";
import {
  getCurrentLineIndex,
  fetchSyncedLyrics,
  type LyricLine,
} from "@/services/lyrics-api";
import { useIpodPersistence } from "@/hooks/useIpodPersistence";
import type { usePlayerStore } from "@/hooks/usePlayerStore";
import { useVideoFinder } from "@/hooks/useVideoFinder";
import { extractColorsFromImage } from "@/services/color-extractor";

import { useVocalRemover } from "@/hooks/useVocalRemover";
import { translateText } from "@/services/translation-api";

type NowPlayingProps = ReturnType<typeof usePlayerStore> & {
  onClose: () => void;
  onNavigate?: (s: string) => void;
  onStateChange?: (active: boolean) => void;
};

type DesktopPanelType = "lyrics" | "queue" | "video";

// ── Sleep timer hook ──────────────────────────────────────────────────────────
function useSleepTimer(
  onEnd: () => void,
  onStateChange?: (active: boolean) => void,
) {
  const [minutes, setMinutes] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [active, setActive] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = (mins: number) => {
    if (ref.current) clearInterval(ref.current);
    const secs = mins * 60;
    setMinutes(mins);
    setRemaining(secs);
    setActive(true);
    onStateChange?.(true);
    ref.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(ref.current!);
          setActive(false);
          onEnd();
          onStateChange?.(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
  };

  const cancel = () => {
    if (ref.current) clearInterval(ref.current);
    setActive(false);
    setRemaining(0);
    onStateChange?.(false);
  };

  useEffect(() => () => {
    if (ref.current) clearInterval(ref.current);
  }, []);

  return { active, remaining, minutes, start, cancel };
}

export default function NowPlayingView(
  props: NowPlayingProps & { isQuizActive?: boolean },
) {
  const { onClose, onNavigate, onStateChange, isQuizActive = false } = props;
  const { vinylMode, setVinylMode, ipodMode, setIpodMode } =
    useIpodPersistence();
  const [showVisualizer, setShowVisualizer] = useState(false);

  // Responsive state
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : true,
  );
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Mobile view mode: "artwork" (default BitChord player) | "lyrics" | "queue"
  const [mobileMode, setMobileMode] = useState<"artwork" | "lyrics" | "queue">(
    "artwork",
  );

  // Desktop active panel: default "lyrics"
  const [desktopPanel, setDesktopPanel] = useState<DesktopPanelType>("lyrics");

  // Bottom sheets
  const [showDeviceSheet, setShowDeviceSheet] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showTimerMenu, setShowTimerMenu] = useState(false);

  // GEM Overlay / Listen Along session
  const { listenAlongSessionId, setListenAlongSessionId, forceResetSession } =
    useSessionContext();
  const [nowPlayingJoinId, setNowPlayingJoinId] = useState("");
  const gemUserId = useMemo(
    () => `user-${Math.random().toString(36).slice(2, 8)}`,
    [],
  );

  // Rain drops emoji on artwork
  interface RainDrop {
    id: string;
    emoji: string;
    x: number;
  }
  const [rainDrops, setRainDrops] = useState<RainDrop[]>([]);
  const triggerShower = useCallback((emoji: string) => {
    const dropsToAdd: RainDrop[] = Array.from({ length: 10 }).map(() => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      emoji,
      x: 6 + Math.random() * 88,
    }));
    setRainDrops((prev) => [...prev, ...dropsToAdd]);
    setTimeout(() => {
      setRainDrops((prev) =>
        prev.filter((d) => !dropsToAdd.find((nd) => nd.id === d.id)),
      );
    }, 5500);
  }, []);

  const { reactions: gemReactions, sendReaction } = useGemOverlay({
    sessionId: listenAlongSessionId,
    userId: gemUserId,
  });
  const prevGemLenRef = useRef(0);
  useEffect(() => {
    if (gemReactions.length > prevGemLenRef.current) {
      const latest = gemReactions[gemReactions.length - 1];
      triggerShower(latest.emoji);
    }
    prevGemLenRef.current = gemReactions.length;
  }, [gemReactions, triggerShower]);

  // Track info & queries
  const { data: playbackState } = usePlaybackState();
  const { data: queueData } = useQueue();
  const { data: availableDevices } = useAvailableDevices();
  const currentTrack = playbackState?.item;

  const saveTrackMutation = useSaveTrackMutation();
  const removeTrackMutation = useRemoveTrackMutation();
  const playMutation = usePlayMutation();
  const pauseMutation = usePauseMutation();
  const nextMutation = useNextMutation();
  const previousMutation = usePreviousMutation();
  const shuffleMutation = useShuffleMutation();
  const repeatMutation = useRepeatMutation();
  const seekMutation = useSeekMutation();
  const transferPlaybackMutation = useTransferPlaybackMutation();
  const setVolumeMutation = useSetVolumeMutation();

  const { data: audioFeatures } = useAudioFeatures(currentTrack?.id || "");
  const { data: savedStatus } = useCheckSavedTracks(
    currentTrack ? [currentTrack.id] : [],
  );

  const [isLiked, setIsLiked] = useState(false);
  useEffect(() => {
    if (savedStatus?.[0] !== undefined) setIsLiked(savedStatus[0]);
  }, [savedStatus]);

  const { toast } = useToast();
  const pauseMutation2 = usePauseMutation();
  const sleepTimer = useSleepTimer(async () => {
    await pauseMutation2.mutateAsync();
    toast({ title: "Sleep timer", description: "Riproduzione fermata" });
  }, onStateChange);

  // Playback values
  const isPlaying = playbackState?.is_playing || false;
  const currentTime = playbackState?.progress_ms
    ? playbackState.progress_ms / 1000
    : 0;

  // High precision smooth time for fluid, non-skipping Karaoke synchronization
  const [smoothTime, setSmoothTime] = useState(currentTime);
  const syncRef = useRef<{ baseTime: number; updatedAt: number }>({
    baseTime: currentTime,
    updatedAt: performance.now(),
  });

  useEffect(() => {
    syncRef.current = { baseTime: currentTime, updatedAt: performance.now() };
    setSmoothTime(currentTime);
  }, [currentTime]);

  useEffect(() => {
    if (!isPlaying) return;
    let animId: number;
    const tick = () => {
      const now = performance.now();
      const diff = (now - syncRef.current.updatedAt) / 1000;
      setSmoothTime(syncRef.current.baseTime + diff);
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  const elapsed = Math.floor((playbackState?.progress_ms || 0) / 1000);
  const duration = Math.floor((currentTrack?.duration_ms || 0) / 1000);
  const progressPercent = duration > 0 ? (elapsed / duration) * 100 : 0;
  const shuffle = playbackState?.shuffle_state || false;
  const repeat =
    playbackState?.repeat_state === "track"
      ? "one"
      : playbackState?.repeat_state === "context"
        ? "all"
        : "off";

  // Volume slider local state for fluid drag
  const [volumeSliderVal, setVolumeSliderVal] = useState<number>(
    playbackState?.device?.volume_percent ?? 70,
  );
  useEffect(() => {
    if (playbackState?.device?.volume_percent !== undefined) {
      setVolumeSliderVal(playbackState.device.volume_percent);
    }
  }, [playbackState?.device?.volume_percent]);

  const handleVolumeChange = (newVal: number) => {
    setVolumeSliderVal(newVal);
    setVolumeMutation.mutate(newVal);
  };

  // Video finder
  const trackName = currentTrack?.name || "";
  const trackArtist = currentTrack?.artists?.[0]?.name || "";
  const videoUrl = useVideoFinder(trackName, trackArtist);
  const bpm = audioFeatures?.tempo ? Math.round(audioFeatures.tempo) : null;
  const coverUrl = currentTrack?.album?.images?.[0]?.url;

  // Background palette
  const [albumPalette, setAlbumPalette] = useState<{
    primary: string;
    secondary: string;
    background: string;
  } | null>(null);

  useEffect(() => {
    if (!coverUrl) return;
    let active = true;
    extractColorsFromImage(coverUrl)
      .then((p) => {
        if (active) setAlbumPalette(p);
      })
      .catch(() => {
        if (active) setAlbumPalette(null);
      });
    return () => {
      active = false;
    };
  }, [coverUrl]);

  // Lyrics state & auto-fetch
  const [lyricsList, setLyricsList] = useState<LyricLine[]>(() => {
    return currentTrack ? lyricsStore.getLyrics(currentTrack.id)?.lines || [] : [];
  });
  const [currentLineIndex, setCurrentLineIndex] = useState(0);

  // Karaoke state from hook
  const { isKaraokeActive, toggleKaraoke } = useVocalRemover();

  // Translation state
  const [showTranslation, setShowTranslation] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedLyrics, setTranslatedLyrics] = useState<Map<number, string>>(
    () => {
      if (!currentTrack) return new Map();
      return lyricsStore.getTranslation(currentTrack.id) || new Map();
    },
  );

  // Video cover mode state (replacing visualizer)
  const [showVideoCover, setShowVideoCover] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);

  const sendVideoCommand = (command: "playVideo" | "pauseVideo") => {
    const iframes = document.querySelectorAll<HTMLIFrameElement>("iframe[title='Music Video']");
    iframes.forEach((iframe) => {
      iframe.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: command, args: "" }),
        "*",
      );
    });
  };

  const handleToggleVideoCover = async (targetState?: boolean) => {
    const next = targetState !== undefined ? targetState : !showVideoCover;
    if (next) {
      if (isPlaying) {
        try {
          await pauseMutation.mutateAsync();
        } catch (_) {}
      }
      setIsVideoPlaying(true);
      setShowVideoCover(true);
    } else {
      setShowVideoCover(false);
    }
  };

  const isVideoActive = showVideoCover || (!isMobile && desktopPanel === "video");
  const isCurrentlyPlaying = isVideoActive ? isVideoPlaying : isPlaying;

  const getVideoEmbedUrl = () => {
    const startSec = Math.max(0, Math.floor(elapsed));
    if (videoUrl) {
      const base = videoUrl.replace("youtube.com/embed", "www.youtube-nocookie.com/embed");
      const sep = base.includes("?") ? "&" : "?";
      return `${base}${sep}autoplay=1&enablejsapi=1&start=${startSec}&rel=0`;
    }
    return `https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(
      (currentTrack?.name || "") +
        " " +
        (currentTrack?.artists?.[0]?.name || "") +
        " official video",
    )}&autoplay=1&enablejsapi=1&start=${startSec}&rel=0`;
  };

  useEffect(() => {
    if (desktopPanel === "video" && isPlaying) {
      pauseMutation.mutateAsync().catch(() => {});
      setIsVideoPlaying(true);
    }
  }, [desktopPanel]);

  useEffect(() => {
    if (isPlaying && isVideoActive) {
      sendVideoCommand("pauseVideo");
      setIsVideoPlaying(false);
    }
  }, [isPlaying]);

  // Reset translation on track change
  useEffect(() => {
    setShowVideoCover(false);
    if (!currentTrack) {
      setTranslatedLyrics(new Map());
      setShowTranslation(false);
      return;
    }
    const cached = lyricsStore.getTranslation(currentTrack.id);
    if (cached) {
      setTranslatedLyrics(cached);
    } else {
      setTranslatedLyrics(new Map());
      setShowTranslation(false);
    }
  }, [currentTrack?.id]);

  const handleToggleTranslation = async () => {
    if (showTranslation) {
      setShowTranslation(false);
      return;
    }
    if (translatedLyrics.size > 0) {
      setShowTranslation(true);
      return;
    }
    if (!lyricsList.length) {
      toast({ title: "Nessun testo da tradurre" });
      return;
    }

    setIsTranslating(true);
    const systemLang = navigator.language?.split("-")[0] || "it";
    toast({
      title: "Traduzione testi...",
      description: `Traduzione in corso (${systemLang.toUpperCase()})`,
    });

    try {
      const map = new Map<number, string>();
      const validLines: { idx: number; text: string }[] = [];
      for (let i = 0; i < lyricsList.length; i++) {
        const text = lyricsList[i].text.trim();
        if (text && !text.includes("♪")) {
          validLines.push({ idx: i, text });
        }
      }

      // Batch in groups of 8 lines joined by newline to translate reliably without rate limits
      const BATCH_SIZE = 8;
      for (let b = 0; b < validLines.length; b += BATCH_SIZE) {
        const batch = validLines.slice(b, b + BATCH_SIZE);
        const combined = batch.map((item) => item.text).join("\n");
        const res = await translateText(combined, systemLang);
        if (res && res.translatedText) {
          const splitRes = res.translatedText.split("\n");
          batch.forEach((item, bIdx) => {
            const lineTrans = splitRes[bIdx]?.trim() || item.text;
            map.set(item.idx, lineTrans);
          });
        } else {
          for (const item of batch) {
            const single = await translateText(item.text, systemLang);
            if (single) map.set(item.idx, single.translatedText);
          }
        }
        setTranslatedLyrics(new Map(map));
        await new Promise((r) => setTimeout(r, 120));
      }

      setTranslatedLyrics(new Map(map));
      if (currentTrack) {
        lyricsStore.setTranslation(currentTrack.id, map);
      }
      setShowTranslation(true);
      toast({ title: `✓ Tradotte ${map.size} righe` });
    } catch {
      toast({ title: "Errore durante la traduzione", variant: "destructive" });
    } finally {
      setIsTranslating(false);
    }
  };

  // Floating circular action buttons for Translation and Karaoke
  const renderLyricsActionButtons = () => (
    <div className="absolute bottom-5 right-5 flex items-center gap-3 z-30 pointer-events-auto">
      {/* Translation Button */}
      <motion.button
        whileHover={!isMobile ? { scale: 1.08 } : undefined}
        whileTap={{ scale: 0.92 }}
        onClick={handleToggleTranslation}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all backdrop-blur-xl border ${
          showTranslation
            ? "bg-white text-black border-white shadow-lg"
            : "bg-black/60 hover:bg-black/80 text-white/80 hover:text-white border-white/20 shadow-md"
        }`}
        title={showTranslation ? "Nascondi traduzione" : "Traduci testo in italiano"}
        aria-label="Traduzione testo"
      >
        {isTranslating ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Languages className="w-5 h-5" />
        )}
      </motion.button>

      {/* Karaoke Mode Button */}
      <motion.button
        whileHover={!isMobile ? { scale: 1.08 } : undefined}
        whileTap={{ scale: 0.92 }}
        onClick={toggleKaraoke}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all backdrop-blur-xl border ${
          isKaraokeActive
            ? "bg-white text-black border-white shadow-lg"
            : "bg-black/60 hover:bg-black/80 text-white/80 hover:text-white border-white/20 shadow-md"
        }`}
        title={isKaraokeActive ? "Disattiva Karaoke Mode" : "Attiva Karaoke Mode"}
        aria-label="Modalità Karaoke"
      >
        <Mic2 className="w-5 h-5" />
      </motion.button>
    </div>
  );

  // Render a lyric line with word-by-word bouncy karaoke animation when active
  const renderLyricLineContent = (line: LyricLine, i: number, isCurrent: boolean) => {
    if (!line.text.trim()) return <span>♪</span>;

    if (isCurrent && isKaraokeActive) {
      const nextLine = lyricsList[i + 1];
      const totalWords = line.text.split(/\s+/).filter(Boolean);
      if (totalWords.length === 0) return <span>{line.text}</span>;

      const estimatedDuration = nextLine
        ? Math.max(1.2, Math.min(nextLine.time - line.time, totalWords.length * 0.6))
        : Math.max(2.0, totalWords.length * 0.6);

      const elapsedInLine = Math.max(0, smoothTime - line.time);
      const lineProgress = Math.min(1, elapsedInLine / estimatedDuration);

      // Natural word index progression weighted by character count
      const weights = totalWords.map((w) => Math.max(1, Math.min(w.length, 7)));
      const totalWeight = weights.reduce((sum, w) => sum + w, 0) || 1;
      const targetWeight = totalWeight * lineProgress;
      let accWeight = 0;
      let activeWordIdx = 0;
      for (let w = 0; w < weights.length; w++) {
        accWeight += weights[w];
        if (targetWeight <= accWeight) {
          activeWordIdx = w;
          break;
        }
      }

      return (
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 py-1">
          {totalWords.map((word, wIdx) => {
            const isWordActive = wIdx === activeWordIdx;
            const isWordPast = wIdx < activeWordIdx;
            return (
              <motion.span
                key={wIdx}
                animate={{
                  scale: isWordActive ? 1.25 : 1,
                  y: isWordActive ? -4 : 0,
                }}
                transition={{ duration: 0.12, ease: "easeOut" }}
                className={`inline-block font-extrabold transition-colors duration-100 select-none ${
                  isWordActive
                    ? "text-white drop-shadow-md"
                    : isWordPast
                      ? "text-white/95"
                      : "text-white/40"
                }`}
              >
                {word}
              </motion.span>
            );
          })}
        </div>
      );
    }

    return <span>{line.text}</span>;
  };

  const lastFetchedTrackIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentTrack) {
      setLyricsList([]);
      lastFetchedTrackIdRef.current = null;
      return;
    }
    const trackId = currentTrack.id;
    if (lastFetchedTrackIdRef.current === trackId) {
      return;
    }
    lastFetchedTrackIdRef.current = trackId;

    const cached = lyricsStore.getLyrics(trackId);
    if (cached) {
      setLyricsList(cached.lines);
      return;
    }

    const durationSec = Math.floor((currentTrack.duration_ms || 0) / 1000);
    let active = true;
    fetchSyncedLyrics(
      currentTrack.name,
      currentTrack.artists?.[0]?.name || "",
      durationSec,
    )
      .then(({ lines, synced }) => {
        if (!active) return;
        lyricsStore.setLyrics(trackId, { lines: lines || [], synced: !!synced });
        setLyricsList(lines || []);
      })
      .catch(() => {
        if (!active) return;
        lyricsStore.setLyrics(trackId, { lines: [], synced: false });
        setLyricsList([]);
      });

    return () => {
      active = false;
    };
  }, [currentTrack?.id]);

  // Sync current lyric line index using high-resolution smoothTime
  useEffect(() => {
    if (!lyricsList.length) return;
    const idx = getCurrentLineIndex(lyricsList, smoothTime);
    if (idx !== currentLineIndex) setCurrentLineIndex(idx);
  }, [smoothTime, lyricsList, currentLineIndex]);

  // Auto-scroll lyrics containers
  const mobileLyricsContainerRef = useRef<HTMLDivElement>(null);
  const desktopLyricsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = (container: HTMLDivElement | null) => {
      if (!container) return;
      const activeEl = container.querySelector(
        '[data-active="true"]',
      ) as HTMLElement | null;
      if (!activeEl) return;
      const target =
        activeEl.offsetTop -
        container.clientHeight / 2 +
        activeEl.clientHeight / 2;
      container.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
    };
    scrollContainer(mobileLyricsContainerRef.current);
    scrollContainer(desktopLyricsContainerRef.current);
  }, [currentLineIndex]);

  // Easter egg: 7 taps on cover
  const [coverTaps, setCoverTaps] = useState(0);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const handleCoverTap = () => {
    const next = coverTaps + 1;
    setCoverTaps(next);
    if (next >= 7) {
      setShowEasterEgg(true);
      setCoverTaps(0);
    }
  };

  // Reset rain on song change
  useEffect(() => {
    setRainDrops([]);
  }, [currentTrack?.id]);

  if (!currentTrack) return null;

  // iPod mode & Vinyl mode early returns
  if (ipodMode) {
    return (
      <motion.div
        initial={{ opacity: 0.6, y: "100%" }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 34, mass: 0.9 }}
        className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-background"
      >
        <div
          className="relative flex items-center justify-between px-4 py-3 z-50 bg-background/40 backdrop-blur-xl border-b border-white/5"
          style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}
        >
          <button
            onClick={() => {
              setIpodMode(false);
              onClose();
            }}
            className="p-2 rounded-full text-foreground/70 hover:bg-foreground/10"
          >
            <X className="w-5 h-5" />
          </button>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            iPod Mode
          </p>
          <button
            onClick={() => setIpodMode(false)}
            className="p-2 rounded-full text-foreground/70 hover:bg-foreground/10"
          >
            <Disc3 className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 min-h-0">
          <IpodNowPlayingView />
        </div>
      </motion.div>
    );
  }

  if (vinylMode) {
    return (
      <motion.div
        initial={{ opacity: 0.6, y: "100%" }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 34, mass: 0.9 }}
        drag={isMobile ? "y" : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.7 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 80 || info.velocity.y > 350) {
            setVinylMode(false);
          }
        }}
        className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-background touch-pan-y"
      >
        <div
          className="relative flex items-center justify-between px-4 py-3 z-50 bg-background/40 backdrop-blur-xl border-b border-white/5"
          style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}
        >
          <button
            onClick={() => {
              setVinylMode(false);
              onClose();
            }}
            className="p-2 rounded-full text-foreground/70 hover:bg-foreground/10 active:scale-90 transition-transform"
            aria-label="Chiudi player"
            title="Chiudi player"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
          <div className="flex flex-col items-center">
            <div className="w-10 h-1 bg-white/30 rounded-full mb-1" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Modalità Vinile
            </p>
          </div>
          <button
            onClick={() => setVinylMode(false)}
            className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/90 text-xs font-bold active:scale-90 transition-all flex items-center gap-1.5"
            title="Torna alla modalità standard"
          >
            <Disc3 className="w-4 h-4 text-primary" />
            <span>Standard</span>
          </button>
        </div>
        <div className="flex-1 min-h-0">
          <VinylNowPlayingView />
        </div>
      </motion.div>
    );
  }

  // Transport handlers
  const handleTogglePlay = async () => {
    if (isVideoActive) {
      if (isVideoPlaying) {
        sendVideoCommand("pauseVideo");
        setIsVideoPlaying(false);
      } else {
        sendVideoCommand("playVideo");
        setIsVideoPlaying(true);
      }
      return;
    }
    try {
      isPlaying
        ? await pauseMutation.mutateAsync()
        : await playMutation.mutateAsync({});
    } catch (_) {}
  };
  const handleNext = async () => {
    try {
      await nextMutation.mutateAsync();
    } catch (_) {}
  };
  const handlePrevious = async () => {
    try {
      await previousMutation.mutateAsync();
    } catch (_) {}
  };
  const handleShuffle = async () => {
    try {
      await shuffleMutation.mutateAsync(!shuffle);
    } catch (_) {}
  };
  const handleRepeat = async () => {
    try {
      await repeatMutation.mutateAsync(
        repeat === "off" ? "context" : repeat === "all" ? "track" : "off",
      );
    } catch (_) {}
  };
  const handleSeek = async (percentage: number) => {
    try {
      await seekMutation.mutateAsync(
        Math.floor((percentage / 100) * currentTrack.duration_ms),
      );
    } catch (_) {}
  };
  const handleSeekSeconds = async (seconds: number) => {
    try {
      await seekMutation.mutateAsync(Math.floor(seconds * 1000));
    } catch (_) {}
  };
  const handleLike = async () => {
    try {
      if (isLiked) {
        await removeTrackMutation.mutateAsync(currentTrack.id);
        setIsLiked(false);
        toast({ title: "Rimosso dai preferiti" });
      } else {
        await saveTrackMutation.mutateAsync(currentTrack.id);
        setIsLiked(true);
        toast({ title: "❤️ Aggiunto ai preferiti" });
      }
    } catch (_) {
      toast({ title: "Errore", variant: "destructive" });
    }
  };
  const handleShare = async () => {
    const url =
      currentTrack.external_urls?.spotify ||
      `https://open.spotify.com/track/${currentTrack.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: currentTrack.name, url });
      } catch (_) {}
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "✓ Link copiato!" });
    }
  };

  const queueTracks = queueData?.queue?.slice(0, 16) || [];
  const remainingTimeStr = `-${formatTime(Math.max(0, duration - elapsed))}`;

  // CD Jewel Case artwork element
  const renderArtworkElement = (sizeClass: string, isDesktop: boolean) => (
    <motion.div
      layoutId="now-playing-artwork"
      key={currentTrack.id}
      initial={{ opacity: 0, scale: 0.9, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      whileHover={isDesktop ? { scale: 1.02 } : undefined}
      whileTap={{ scale: 0.98 }}
      className={`relative cursor-pointer select-none rounded-2xl ${sizeClass} mx-auto`}
      onClick={handleCoverTap}
      style={{
        boxShadow:
          "0 24px 50px -12px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.14) inset",
      }}
    >
      {/* Album Artwork Image */}
      <img
        src={coverUrl}
        alt={currentTrack.name}
        className="w-full h-full object-cover rounded-2xl"
      />

      {/* CD Jewel Case Glossy Reflection & Spine Effect */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none bg-gradient-to-tr from-transparent via-white/10 to-transparent border border-white/20" />
      <div className="absolute left-0 top-0 bottom-0 w-3 rounded-l-2xl pointer-events-none bg-gradient-to-r from-white/30 via-white/5 to-transparent border-r border-black/30" />

      {/* Playing Animated Glow Ring */}
      {isPlaying && (
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-white/40 pointer-events-none"
          animate={{
            opacity: [0.25, 0.75, 0.25],
            scale: [1, 1.015, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* BPM Pill */}
      {bpm && (
        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1 border border-white/10 shadow-lg">
          <Zap className="w-3 h-3 text-primary animate-pulse" />
          <span className="text-[11px] font-bold text-white tabular-nums tracking-wide">
            {bpm} BPM
          </span>
        </div>
      )}

      {/* Rain emoji shower */}
      <AnimatePresence>
        {rainDrops.map((drop) => (
          <motion.span
            key={drop.id}
            className="absolute pointer-events-none text-3xl drop-shadow-lg select-none z-20"
            style={{
              left: `${drop.x}%`,
              bottom: 0,
              transform: "translateX(-50%)",
            }}
            initial={{ opacity: 0, y: 0, scale: 0.4 }}
            animate={{
              opacity: [0, 1, 1, 0.7, 0],
              y: ["0%", "-120%", "-240%", "-350%", "-450%"],
              scale: [0.4, 1.2, 1, 0.9, 0.7],
            }}
            transition={{ duration: 4.8, ease: "easeOut" }}
          >
            {drop.emoji}
          </motion.span>
        ))}
      </AnimatePresence>
    </motion.div>
  );

  const isAnySheetOpen = showDeviceSheet || showMoreMenu || showTimerMenu;

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%", scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: "100%", scale: 0.92 }}
      transition={{ type: "spring", stiffness: 340, damping: 32, mass: 0.85 }}
      drag={isMobile && !isAnySheetOpen ? "y" : false}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.7 }}
      onDragEnd={(_, info) => {
        if (info.offset.y > 100 || info.velocity.y > 400) {
          onClose();
        }
      }}
      className="fixed inset-0 z-[100] flex flex-col overflow-hidden text-white bg-background select-none touch-pan-y"
    >
      {/* ── Fluid Luminous Blurred Background ("Sfondo sfumato in quel modo") ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
        {coverUrl ? (
          <>
            <motion.img
              key={currentTrack.id}
              src={coverUrl}
              alt=""
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 0.75, scale: 1.4 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="w-full h-full object-cover blur-[85px] brightness-[0.7] saturate-[1.8]"
            />
            {albumPalette && (
              <>
                <motion.div
                  animate={{
                    x: ["-8%", "8%", "-8%"],
                    y: ["-8%", "8%", "-8%"],
                  }}
                  transition={{
                    duration: 18,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute -top-1/3 -left-1/4 w-[90vw] h-[90vw] rounded-full blur-[100px] opacity-45 mix-blend-screen"
                  style={{ background: albumPalette.primary }}
                />
                <motion.div
                  animate={{
                    x: ["8%", "-8%", "8%"],
                    y: ["8%", "-8%", "8%"],
                  }}
                  transition={{
                    duration: 22,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute -bottom-1/3 -right-1/4 w-[90vw] h-[90vw] rounded-full blur-[100px] opacity-40 mix-blend-screen"
                  style={{ background: albumPalette.secondary }}
                />
              </>
            )}
            {/* Contrast-enhancing Vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/35" />
            <div className="absolute inset-0 bg-black/15 backdrop-blur-[12px]" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 to-black" />
        )}
      </div>

      {/* Easter Egg Overlay */}
      <AnimatePresence>
        {showEasterEgg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-black/90 backdrop-blur-2xl"
            onClick={() => setShowEasterEgg(false)}
          >
            <div className="text-8xl mb-4 animate-bounce">🎵</div>
            <p className="text-3xl font-bold text-primary mb-2">Easter Egg!</p>
            <p className="text-muted-foreground text-center px-8 text-base">
              Hai trovato il segreto di Harmony Hub! 🎧
            </p>
            <div className="mt-6 flex gap-3 text-4xl">🎸 🥁 🎹 🎺 🎻</div>
            <p className="text-xs text-muted-foreground/80 mt-6">
              Tocca per chiudere
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════════
          MOBILE LAYOUT (< 768px): Exact BitChord Mobile Experience
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="md:hidden relative flex-1 flex flex-col min-h-0 z-10 overflow-hidden">
        {/* Top Drag Handle */}
        <div
          className="pt-2 pb-1 flex flex-col items-center shrink-0 cursor-grab active:cursor-grabbing touch-none"
          style={{ paddingTop: "max(10px, env(safe-area-inset-top))" }}
          onClick={onClose}
        >
          <div className="w-12 h-1.5 bg-white/40 hover:bg-white/60 rounded-full transition-colors" />
        </div>

        {/* Mobile Header Bar */}
        <div className="flex items-center justify-between px-4 py-1 shrink-0">
          {mobileMode === "artwork" ? (
            <>
              <button
                onClick={onClose}
                className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 active:scale-90 transition-all"
                aria-label="Chiudi"
              >
                <ChevronDown className="w-6 h-6" />
              </button>
              <div className="text-center min-w-0 px-2 flex-1">
                <p className="text-[11px] font-semibold text-white/50 uppercase tracking-widest truncate">
                  In riproduzione
                </p>
                <p className="text-xs font-medium text-white/80 truncate">
                  {currentTrack.album?.name || "Music Hub"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleToggleVideoCover()}
                  className={`p-2 rounded-full transition-all active:scale-90 ${
                    showVideoCover
                      ? "text-primary bg-primary/20"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                  aria-label="Video musicale"
                  title="Video musicale"
                >
                  <Video className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowTimerMenu(true)}
                  className={`p-2 rounded-full transition-all active:scale-90 ${
                    sleepTimer.active
                      ? "text-amber-400 bg-amber-400/20"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                  aria-label="Sleep timer"
                >
                  <Timer className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowMoreMenu(true)}
                  className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 active:scale-90 transition-all"
                  aria-label="Altro"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            /* Header in Lyrics or Queue Mode (BitChord Mini Header) */
            <div className="flex items-center justify-between w-full py-1">
              <div
                onClick={() => setMobileMode("artwork")}
                className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
              >
                <motion.div
                  layoutId="now-playing-artwork"
                  className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-white/20 shadow-md group-hover:scale-105 transition-transform"
                >
                  <img
                    src={coverUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </motion.div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-white truncate leading-tight">
                    {isQuizActive ? "Guess the Title" : currentTrack.name}
                  </h4>
                  <p className="text-xs text-white/70 truncate">
                    {isQuizActive
                      ? "Guess the Artist"
                      : currentTrack.artists?.map((a: any) => a.name).join(", ")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  onClick={handleLike}
                  className={`p-2.5 rounded-full active:scale-90 transition-transform ${
                    isLiked ? "text-amber-400" : "text-white/70 hover:text-white"
                  }`}
                >
                  <Star className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                </button>
                <button
                  onClick={() => setShowMoreMenu(true)}
                  className="p-2.5 rounded-full text-white/70 hover:text-white active:scale-90 transition-transform"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Main Mobile Content Area ── */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-2 flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {mobileMode === "artwork" ? (
              <motion.div
                key="mobile-art-view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="flex-1 flex flex-col justify-center my-auto space-y-4"
              >
                {/* Centered Large CD Artwork or Video */}
                <div className="py-2">
                  {showVideoCover && isMobile ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.3 }}
                      className="relative -mx-6 w-[calc(100%+3rem)] h-[58vh] max-h-[520px] overflow-hidden my-auto flex items-center justify-center bg-transparent border-none"
                      style={{
                        maskImage:
                          "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)",
                        WebkitMaskImage:
                          "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)",
                      }}
                    >
                      <iframe
                        className="w-full h-full border-0 pointer-events-auto"
                        src={getVideoEmbedUrl()}
                        title="Music Video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                      <button
                        onClick={() => handleToggleVideoCover(false)}
                        className="absolute top-3 right-6 p-2 rounded-full bg-black/60 text-white/90 hover:text-white backdrop-blur-md border border-white/20 z-10 active:scale-90 transition-transform"
                        title="Torna alla copertina"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </motion.div>
                  ) : (
                    renderArtworkElement("w-[72vw] max-w-[320px] aspect-square", false)
                  )}
                </div>

                {/* Track Name + Artist + Star & Dots */}
                <div className="flex items-center justify-between pt-1">
                  <div className="min-w-0 flex-1 pr-3">
                    <h2
                      className={`text-2xl font-bold text-white tracking-tight leading-tight truncate ${
                        isQuizActive ? "blur-sm" : ""
                      }`}
                    >
                      {isQuizActive ? "Guess the Title" : currentTrack.name}
                    </h2>
                    <p
                      className={`text-base text-white/70 font-medium truncate mt-0.5 ${
                        isQuizActive ? "blur-sm" : ""
                      }`}
                    >
                      {isQuizActive
                        ? "Guess the Artist"
                        : currentTrack.artists
                            ?.map((a: any) => a.name)
                            .join(", ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <motion.button
                      onClick={handleLike}
                      whileTap={{ scale: 0.8 }}
                      className={`p-2.5 rounded-full backdrop-blur-md border border-white/10 transition-all ${
                        isLiked
                          ? "bg-amber-400/20 text-amber-400 border-amber-400/30"
                          : "bg-white/10 text-white/70 hover:text-white"
                      }`}
                      aria-label="Preferito"
                    >
                      <Star
                        className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`}
                      />
                    </motion.button>
                    <motion.button
                      onClick={() => setShowMoreMenu(true)}
                      whileTap={{ scale: 0.8 }}
                      className="p-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/70 hover:text-white transition-all"
                      aria-label="Opzioni"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>

                {/* Lyrics Single-Line Teaser Bar */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setMobileMode("lyrics")}
                  className="w-full text-left px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/10 flex items-center justify-between group transition-all shadow-md"
                >
                  <span className="text-sm font-semibold text-white/90 truncate flex-1 pr-2">
                    {lyricsList.length > 0 && lyricsList[currentLineIndex]
                      ? lyricsList[currentLineIndex].text
                      : "Visualizza testi..."}
                  </span>
                  <ChevronRight className="w-4 h-4 text-white/50 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
                </motion.button>
              </motion.div>
            ) : mobileMode === "lyrics" ? (
              /* Full Screen Synced Karaoke Lyrics View (Mobile) */
              <motion.div
                key="mobile-lyrics-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.28 }}
                className="flex-1 min-h-0 relative flex flex-col pt-2"
              >
                <div
                  ref={mobileLyricsContainerRef}
                  className="flex-1 overflow-y-auto px-2 py-4 space-y-4 scroll-smooth"
                  style={{
                    maskImage: "linear-gradient(to bottom, transparent 0%, black 8%, black 88%, transparent 100%)",
                    WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 8%, black 88%, transparent 100%)",
                  }}
                >
                  <div style={{ height: "40px" }} />
                  {lyricsList.length === 0 ? (
                    <div className="py-16 text-center text-white/60 font-medium">
                      Testi non disponibili per questo brano
                    </div>
                  ) : (
                    lyricsList.map((line, i) => {
                      const isActive = i === currentLineIndex;
                      const isPast = i < currentLineIndex;
                      return (
                        <motion.div
                          key={i}
                          data-active={isActive ? "true" : undefined}
                          onClick={() => handleSeekSeconds(line.time)}
                          className={`cursor-pointer transition-all duration-300 py-1.5 px-3 rounded-xl ${
                            isActive
                              ? "text-white font-extrabold text-2xl md:text-3xl drop-shadow-md scale-[1.02]"
                              : isPast
                                ? "text-white/35 font-semibold text-xl"
                                : "text-white/55 font-semibold text-xl active:text-white/80"
                          }`}
                        >
                          <div>{renderLyricLineContent(line, i, isActive)}</div>
                          {showTranslation && translatedLyrics.get(i) && (
                            <p
                              className={`mt-0.5 font-normal italic transition-opacity ${
                                isActive ? "text-white/80 text-base" : "text-white/40 text-sm"
                              }`}
                            >
                              {translatedLyrics.get(i)}
                            </p>
                          )}
                        </motion.div>
                      );
                    })
                  )}
                  <div style={{ height: "80px" }} />
                </div>

                {/* Floating Action Buttons */}
                {lyricsList.length > 0 && renderLyricsActionButtons()}
              </motion.div>
            ) : (
              /* Queue View (Mobile) */
              <motion.div
                key="mobile-queue-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.28 }}
                className="flex-1 min-h-0 flex flex-col pt-2"
              >
                <h3 className="text-lg font-bold text-white mb-2">Coda</h3>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  <div className="p-3 rounded-xl bg-white/15 border border-white/20 mb-3 flex items-center gap-3">
                    <img
                      src={coverUrl}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase font-bold text-primary tracking-wider block">
                        In riproduzione
                      </span>
                      <p className="text-sm font-bold text-white truncate">
                        {currentTrack.name}
                      </p>
                      <p className="text-xs text-white/70 truncate">
                        {currentTrack.artists?.[0]?.name}
                      </p>
                    </div>
                  </div>
                  <h4 className="text-xs uppercase font-bold text-white/50 tracking-wider">
                    Prossimi
                  </h4>
                  {queueTracks.map((t: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <span className="text-xs text-white/40 w-4 font-mono">
                        {idx + 1}
                      </span>
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-white/10">
                        {t.album?.images?.[0]?.url && (
                          <img
                            src={t.album.images[0].url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white truncate">
                          {t.name}
                        </p>
                        <p className="text-xs text-white/60 truncate">
                          {t.artists?.[0]?.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Fixed Bottom Controls on Mobile ── */}
          <div className="pt-2 pb-3 space-y-3 shrink-0">
            {/* Progress Bar with Current and Remaining Time */}
            <div className="space-y-1">
              <div
                className="relative h-2 bg-white/20 rounded-full cursor-pointer flex items-center"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const p = ((e.clientX - rect.left) / rect.width) * 100;
                  handleSeek(Math.max(0, Math.min(100, p)));
                }}
              >
                <div
                  className="absolute left-0 top-0 bottom-0 bg-white rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs font-mono font-medium text-white/60 tabular-nums px-0.5">
                <span>{formatTime(elapsed)}</span>
                <span>{remainingTimeStr}</span>
              </div>
            </div>

            {/* Playback Transport Buttons */}
            <div className="flex items-center justify-between px-2">
              <button
                onClick={handleShuffle}
                className={`p-2 rounded-full transition-all active:scale-90 ${
                  shuffle ? "text-primary" : "text-white/60 hover:text-white"
                }`}
                aria-label="Riproduzione casuale"
              >
                <Shuffle className="w-5 h-5" />
              </button>

              <button
                onClick={handlePrevious}
                className="p-3 text-white/90 hover:text-white active:scale-90 transition-transform"
                aria-label="Brano precedente"
              >
                <SkipBack className="w-7 h-7 fill-current" />
              </button>

              {/* Large Play/Pause Spring Button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 450, damping: 25 }}
                onClick={handleTogglePlay}
                className="w-16 h-16 rounded-full bg-white text-black shadow-2xl flex items-center justify-center shadow-black/50"
                aria-label={isCurrentlyPlaying ? "Pausa" : "Riproduci"}
              >
                {isCurrentlyPlaying ? (
                  <Pause className="w-8 h-8 fill-current text-black" />
                ) : (
                  <Play className="w-8 h-8 fill-current text-black ml-1" />
                )}
              </motion.button>

              <button
                onClick={handleNext}
                className="p-3 text-white/90 hover:text-white active:scale-90 transition-transform"
                aria-label="Brano successivo"
              >
                <SkipForward className="w-7 h-7 fill-current" />
              </button>

              <button
                onClick={handleRepeat}
                className={`p-2 rounded-full transition-all active:scale-90 ${
                  repeat !== "off"
                    ? "text-primary"
                    : "text-white/60 hover:text-white"
                }`}
                aria-label="Ripeti"
              >
                {repeat === "one" ? (
                  <Repeat1 className="w-5 h-5" />
                ) : (
                  <Repeat className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Volume Slider Bar with speaker icons */}
            <div className="flex items-center gap-3 px-3 py-1">
              <Volume1 className="w-4 h-4 text-white/50 shrink-0" />
              <input
                type="range"
                min={0}
                max={100}
                value={volumeSliderVal}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-full h-1 bg-white/20 rounded-full appearance-none accent-white cursor-pointer"
              />
              <Volume2 className="w-4 h-4 text-white/80 shrink-0" />
            </div>

            {/* Bottom BitChord Action Bar: Lyrics | Output Device Pill | Queue */}
            <div className="flex items-center justify-between pt-1 px-2">
              <button
                onClick={() =>
                  setMobileMode((m) => (m === "lyrics" ? "artwork" : "lyrics"))
                }
                className={`p-2.5 rounded-xl transition-all active:scale-90 ${
                  mobileMode === "lyrics"
                    ? "bg-white/25 text-white shadow-md"
                    : "text-white/60 hover:text-white"
                }`}
                aria-label="Testo"
              >
                <Mic2 className="w-5 h-5" />
              </button>

              {/* Center Device Pill ("Gabriele's Phone") */}
              <button
                onClick={() => setShowDeviceSheet(true)}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 flex items-center gap-2 active:scale-95 transition-all text-xs font-semibold text-white/90 max-w-[200px]"
              >
                <Smartphone className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate">
                  {playbackState?.device?.name || "Questo dispositivo"}
                </span>
              </button>

              <button
                onClick={() =>
                  setMobileMode((m) => (m === "queue" ? "artwork" : "queue"))
                }
                className={`p-2.5 rounded-xl transition-all active:scale-90 ${
                  mobileMode === "queue"
                    ? "bg-white/25 text-white shadow-md"
                    : "text-white/60 hover:text-white"
                }`}
                aria-label="Coda di riproduzione"
              >
                <ListMusic className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          TABLET & DESKTOP LAYOUT (>= 768px):
          - Sfondo sfumato in quel modo
          - L'icona / immagine a destra ("l'icona a destra perché sì voglio anche l'immagine che deve essere in quel modo")
          - Sinistra: Testi grandi Apple Music / Coda / Mood / Jam / Video
          - Tutte le animazioni
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="hidden md:flex relative flex-1 flex-col min-h-0 z-10 overflow-hidden">
        {/* Desktop Top Header Bar */}
        <div
          className="flex items-center justify-between px-8 py-4 shrink-0"
          style={{ paddingTop: "max(16px, env(safe-area-inset-top))" }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white backdrop-blur-md border border-white/10 transition-all active:scale-90"
              aria-label="Chiudi"
            >
              <X className="w-5 h-5" />
            </button>
            <span className="text-xs font-semibold uppercase tracking-widest text-white/60">
              In riproduzione
            </span>
          </div>

          {/* Quick modes */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setVinylMode(true)}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white backdrop-blur-md border border-white/10 transition-all"
              title="Vinyl Mode"
            >
              <Disc3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIpodMode(true)}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white backdrop-blur-md border border-white/10 transition-all"
              title="iPod Mode"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="5" y="1" width="10" height="18" rx="2" />
                <rect x="7" y="3" width="6" height="7" rx="1" />
                <circle cx="10" cy="15" r="2.2" />
              </svg>
            </button>
            <button
              onClick={() => handleToggleVideoCover()}
              className={`p-2.5 rounded-full backdrop-blur-md border border-white/10 transition-all ${
                showVideoCover
                  ? "bg-white text-black font-bold shadow-md"
                  : "bg-white/10 text-white/80 hover:bg-white/20"
              }`}
              title="Video Musicale"
            >
              <Video className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowTimerMenu(true)}
              className={`p-2.5 rounded-full backdrop-blur-md border border-white/10 transition-all ${
                sleepTimer.active
                  ? "bg-amber-400 text-black font-bold"
                  : "bg-white/10 text-white/80 hover:bg-white/20"
              }`}
              title="Sleep Timer"
            >
              <Timer className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Desktop Split View: LEFT = Artwork & Controls, RIGHT = Lyrics/Panels */}
        <div className="flex-1 min-h-0 flex flex-row items-center justify-between px-8 lg:px-14 pb-8 gap-8 lg:gap-14 max-w-7xl mx-auto w-full">
          {/* ── LEFT COLUMN: Artwork & Primary Controls ── */}
          <div className="w-full md:w-[380px] lg:w-[440px] shrink-0 flex flex-col justify-between py-2 space-y-6">
            {/* Large CD Artwork with Jewel Case OR Video Player */}
            <div className="w-full flex justify-center">
              {showVideoCover && !isMobile ? (
                <div
                  className="w-full max-w-md aspect-video rounded-3xl overflow-hidden relative border-none bg-transparent"
                  style={{
                    maskImage:
                      "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
                    WebkitMaskImage:
                      "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
                  }}
                >
                  <iframe
                    className="w-full h-full border-0 rounded-2xl"
                    src={getVideoEmbedUrl()}
                    title="Music Video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                  <button
                    onClick={() => handleToggleVideoCover(false)}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white/80 hover:text-white backdrop-blur-md border border-white/20 z-10"
                    title="Torna alla copertina"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : showVisualizer ? (
                <div className="w-72 h-72 md:w-80 md:h-80 flex items-center justify-center bg-black/40 rounded-2xl border border-white/15">
                  <VisualizerCanvas isPlaying={isPlaying} />
                </div>
              ) : (
                renderArtworkElement("w-72 h-72 md:w-80 md:h-80 lg:w-96 lg:h-96", true)
              )}
            </div>

            {/* Track Info & Like/Share Buttons */}
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1 pr-4">
                <h2
                  className={`text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-tight truncate ${
                    isQuizActive ? "blur-sm" : ""
                  }`}
                >
                  {isQuizActive ? "Guess the Title" : currentTrack.name}
                </h2>
                <p
                  className={`text-base lg:text-lg text-white/70 font-medium truncate mt-1 ${
                    isQuizActive ? "blur-sm" : ""
                  }`}
                >
                  {isQuizActive
                    ? "Guess the Artist"
                    : currentTrack.artists?.map((a: any) => a.name).join(", ")}
                </p>
                <p className="text-xs text-white/40 truncate mt-0.5">
                  {currentTrack.album?.name}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleLike}
                  className={`p-3 rounded-full backdrop-blur-md border border-white/15 transition-all ${
                    isLiked
                      ? "bg-amber-400/20 text-amber-400 border-amber-400/30"
                      : "bg-white/10 text-white/70 hover:text-white"
                  }`}
                >
                  <Star className={`w-6 h-6 ${isLiked ? "fill-current" : ""}`} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleShare}
                  className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-white/70 hover:text-white transition-all"
                >
                  <Share2 className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* Desktop Progress Bar */}
            <div className="space-y-1.5">
              <div
                className="relative h-2 bg-white/20 rounded-full cursor-pointer flex items-center group"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const p = ((e.clientX - rect.left) / rect.width) * 100;
                  handleSeek(Math.max(0, Math.min(100, p)));
                }}
              >
                <div
                  className="absolute left-0 top-0 bottom-0 bg-white rounded-full group-hover:bg-primary transition-colors"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs font-mono font-medium text-white/60 tabular-nums px-0.5">
                <span>{formatTime(elapsed)}</span>
                <span>{remainingTimeStr}</span>
              </div>
            </div>

            {/* Desktop Playback Controls */}
            <div className="flex items-center justify-between px-3">
              <button
                onClick={handleShuffle}
                className={`p-2.5 rounded-full transition-all active:scale-90 ${
                  shuffle ? "text-primary" : "text-white/60 hover:text-white"
                }`}
                title="Shuffle"
              >
                <Shuffle className="w-5 h-5" />
              </button>
              <button
                onClick={handlePrevious}
                className="p-3 text-white/90 hover:text-white active:scale-90 transition-transform"
                title="Precedente"
              >
                <SkipBack className="w-7 h-7 fill-current" />
              </button>
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: "spring", stiffness: 450, damping: 25 }}
                onClick={handleTogglePlay}
                className="w-16 h-16 rounded-full bg-white text-black shadow-2xl flex items-center justify-center hover:bg-white/90"
                title={isCurrentlyPlaying ? "Pausa" : "Play"}
              >
                {isCurrentlyPlaying ? (
                  <Pause className="w-8 h-8 fill-current text-black" />
                ) : (
                  <Play className="w-8 h-8 fill-current text-black ml-1" />
                )}
              </motion.button>
              <button
                onClick={handleNext}
                className="p-3 text-white/90 hover:text-white active:scale-90 transition-transform"
                title="Successivo"
              >
                <SkipForward className="w-7 h-7 fill-current" />
              </button>
              <button
                onClick={handleRepeat}
                className={`p-2.5 rounded-full transition-all active:scale-90 ${
                  repeat !== "off"
                    ? "text-primary"
                    : "text-white/60 hover:text-white"
                }`}
                title="Ripeti"
              >
                {repeat === "one" ? (
                  <Repeat1 className="w-5 h-5" />
                ) : (
                  <Repeat className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Desktop Volume Slider */}
            <div className="flex items-center gap-3 px-3 py-1">
              <Volume1 className="w-4 h-4 text-white/50 shrink-0" />
              <input
                type="range"
                min={0}
                max={100}
                value={volumeSliderVal}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-full h-1.5 bg-white/20 rounded-full appearance-none accent-white cursor-pointer"
              />
              <Volume2 className="w-4 h-4 text-white/80 shrink-0" />
            </div>

            {/* Device Indicator & Quick Pill */}
            <div className="flex items-center justify-between px-2 pt-1 text-xs text-white/70">
              <button
                onClick={() => setShowDeviceSheet(true)}
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <Smartphone className="w-4 h-4 text-primary" />
                <span className="font-semibold truncate max-w-[200px]">
                  {playbackState?.device?.name || "Questo computer"}
                </span>
              </button>
              {bpm && (
                <span className="font-mono text-white/50 font-bold">
                  {bpm} BPM
                </span>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN: Content Panels (Testi / Coda / Video) ── */}
          <div className="flex-1 h-full min-h-0 flex flex-col justify-between py-2 overflow-hidden">
            {/* Desktop Navigation Tabs: ONLY Testi, Coda, Video */}
            <div className="flex items-center gap-2 pb-4 shrink-0 overflow-x-auto no-scrollbar">
              {[
                { id: "lyrics" as DesktopPanelType, label: "Testi", icon: Mic2 },
                { id: "queue" as DesktopPanelType, label: "Coda", icon: ListMusic },
                { id: "video" as DesktopPanelType, label: "Video", icon: Video },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setDesktopPanel(id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all backdrop-blur-md border ${
                    desktopPanel === id
                      ? "bg-white/25 text-white border-white/30 shadow-lg"
                      : "bg-white/5 text-white/60 hover:text-white border-white/5 hover:bg-white/10"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Desktop Panel Dynamic Display */}
            <div
              className={`flex-1 min-h-0 relative overflow-hidden flex flex-col ${
                desktopPanel === "lyrics" || desktopPanel === "video"
                  ? "bg-transparent border-none p-0"
                  : "rounded-2xl bg-black/20 backdrop-blur-xl border border-white/10 p-6"
              }`}
            >
              <AnimatePresence mode="wait">
                {desktopPanel === "lyrics" ? (
                  /* Desktop Apple Music-style Synced Lyrics - Sfumato nello sfondo senza box */
                  <motion.div
                    key="desktop-lyrics"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1 min-h-0 relative flex flex-col"
                  >
                    <div
                      ref={desktopLyricsContainerRef}
                      className="flex-1 overflow-y-auto px-4 space-y-6 scroll-smooth select-text"
                      style={{
                        maskImage:
                          "linear-gradient(to bottom, transparent 0%, black 10%, black 85%, transparent 100%)",
                        WebkitMaskImage:
                          "linear-gradient(to bottom, transparent 0%, black 10%, black 85%, transparent 100%)",
                      }}
                    >
                      <div style={{ height: "40px" }} />
                      {lyricsList.length === 0 ? (
                        <div className="py-24 text-center text-white/50 text-lg">
                          Testi non disponibili per questo brano
                        </div>
                      ) : (
                        lyricsList.map((line, i) => {
                          const isActive = i === currentLineIndex;
                          const isPast = i < currentLineIndex;
                          return (
                            <motion.div
                              key={i}
                              data-active={isActive ? "true" : undefined}
                              onClick={() => handleSeekSeconds(line.time)}
                              whileHover={{ x: 6 }}
                              className={`cursor-pointer transition-all duration-300 py-2 px-4 rounded-xl ${
                                isActive
                                  ? "text-white font-black text-3xl lg:text-4xl drop-shadow-xl scale-[1.01]"
                                  : isPast
                                    ? "text-white/30 font-bold text-2xl lg:text-3xl"
                                    : "text-white/50 font-bold text-2xl lg:text-3xl hover:text-white/80"
                              }`}
                            >
                              <div>{renderLyricLineContent(line, i, isActive)}</div>
                              {showTranslation && translatedLyrics.get(i) && (
                                <p
                                  className={`mt-1 font-medium italic transition-opacity ${
                                    isActive
                                      ? "text-white/80 text-xl lg:text-2xl"
                                      : "text-white/40 text-base lg:text-lg"
                                  }`}
                                >
                                  {translatedLyrics.get(i)}
                                </p>
                              )}
                            </motion.div>
                          );
                        })
                      )}
                      <div style={{ height: "100px" }} />
                    </div>

                    {/* Floating circular action buttons: Translation & Karaoke */}
                    {lyricsList.length > 0 && renderLyricsActionButtons()}
                  </motion.div>
                ) : desktopPanel === "queue" ? (
                  /* Desktop Queue */
                  <motion.div
                    key="desktop-queue"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1 min-h-0 flex flex-col"
                  >
                    <h3 className="text-xl font-bold mb-4">Prossimi brani</h3>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                      {queueTracks.map((t: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          <span className="text-sm font-mono text-white/40 w-6">
                            {idx + 1}
                          </span>
                          <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-white/10">
                            {t.album?.images?.[0]?.url && (
                              <img
                                src={t.album.images[0].url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-white truncate">
                              {t.name}
                            </p>
                            <p className="text-xs text-white/70 truncate">
                              {t.artists?.[0]?.name}
                            </p>
                          </div>
                          <span className="text-xs font-mono text-white/50">
                            {t.duration_ms
                              ? formatTime(Math.floor(t.duration_ms / 1000))
                              : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  /* Desktop Video */
                  <motion.div
                    key="desktop-video"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1 w-full h-full rounded-2xl overflow-hidden relative"
                    style={{
                      maskImage:
                        "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
                      WebkitMaskImage:
                        "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
                    }}
                  >
                    {!isMobile && !showVideoCover && (
                      <iframe
                        className="w-full h-full border-0 rounded-2xl"
                        src={getVideoEmbedUrl()}
                        title="Music Video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* ── Audio Output Device Bottom Sheet (Styled like BitChord sec 133) ── */}
      <AnimatePresence>
        {showDeviceSheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-md flex items-end justify-center touch-none"
            onClick={() => setShowDeviceSheet(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 60 || info.velocity.y > 250) {
                  setShowDeviceSheet(false);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[#141416] border-t border-white/10 rounded-t-3xl p-6 text-white space-y-4 shadow-2xl touch-pan-y"
            >
              <div className="w-12 h-1.5 bg-white/40 rounded-full mx-auto cursor-grab active:cursor-grabbing" />
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Audio output</h3>
                <button
                  onClick={() => setShowDeviceSheet(false)}
                  className="p-1 rounded-full text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Devices list */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableDevices && availableDevices.length > 0 ? (
                  availableDevices.map((d: any) => {
                    const isCurrent =
                      d.id === playbackState?.device?.id || d.is_active;
                    return (
                      <div
                        key={d.id}
                        onClick={async () => {
                          try {
                            await transferPlaybackMutation.mutateAsync({
                              deviceId: d.id,
                              play: isPlaying,
                            });
                            toast({ title: `Audio trasferito a ${d.name}` });
                            setShowDeviceSheet(false);
                          } catch (_) {}
                        }}
                        className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all ${
                          isCurrent
                            ? "bg-white/15 border border-white/20"
                            : "bg-white/5 hover:bg-white/10 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Smartphone className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-bold text-sm text-white">
                              {d.name}
                            </p>
                            <p className="text-xs text-white/50">
                              {isCurrent ? "In riproduzione qui" : d.type}
                            </p>
                          </div>
                        </div>
                        {isCurrent && (
                          <Check className="w-5 h-5 text-primary font-bold" />
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 rounded-2xl bg-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-bold text-sm text-white">
                          {playbackState?.device?.name || "Questo dispositivo"}
                        </p>
                        <p className="text-xs text-white/50">In riproduzione qui</p>
                      </div>
                    </div>
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                )}
              </div>

              {/* Volume inside output sheet */}
              <div className="pt-2 border-t border-white/10 space-y-2">
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Volume
                </p>
                <div className="flex items-center gap-3">
                  <Volume1 className="w-4 h-4 text-white/50 shrink-0" />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={volumeSliderVal}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    className="w-full h-1.5 bg-white/20 rounded-full appearance-none accent-white cursor-pointer"
                  />
                  <Volume2 className="w-4 h-4 text-white/80 shrink-0" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── More Options Menu Bottom Sheet ── */}
      <AnimatePresence>
        {showMoreMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-md flex items-end justify-center touch-none"
            onClick={() => setShowMoreMenu(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 60 || info.velocity.y > 250) {
                  setShowMoreMenu(false);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[#141416] border-t border-white/10 rounded-t-3xl p-6 text-white space-y-3 shadow-2xl touch-pan-y"
            >
              <div className="w-12 h-1.5 bg-white/40 rounded-full mx-auto cursor-grab active:cursor-grabbing" />
              <div className="flex items-center gap-3 pb-2 border-b border-white/10">
                <img
                  src={coverUrl}
                  alt=""
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm truncate">{currentTrack.name}</p>
                  <p className="text-xs text-white/60 truncate">
                    {currentTrack.artists?.[0]?.name}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {[
                  {
                    icon: Share2,
                    label: "Condividi",
                    action: () => {
                      handleShare();
                      setShowMoreMenu(false);
                    },
                  },
                  {
                    icon: Timer,
                    label: "Sleep Timer",
                    action: () => {
                      setShowMoreMenu(false);
                      setShowTimerMenu(true);
                    },
                  },
                  {
                    icon: Disc3,
                    label: "Modalità Vinile",
                    action: () => {
                      setVinylMode(true);
                      setShowMoreMenu(false);
                    },
                  },
                  {
                    icon: Monitor,
                    label: "Modalità iPod",
                    action: () => {
                      setIpodMode(true);
                      setShowMoreMenu(false);
                    },
                  },
                  {
                    icon: Video,
                    label: showVideoCover ? "Mostra Copertina" : "Video Musicale",
                    action: () => {
                      handleToggleVideoCover();
                      setShowMoreMenu(false);
                    },
                  },
                  {
                    icon: Copy,
                    label: "Copia Link",
                    action: () => {
                      navigator.clipboard.writeText(
                        currentTrack.external_urls?.spotify ||
                          `https://open.spotify.com/track/${currentTrack.id}`,
                      );
                      toast({ title: "Link copiato!" });
                      setShowMoreMenu(false);
                    },
                  },
                ].map(({ icon: Icon, label, action }) => (
                  <button
                    key={label}
                    onClick={action}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-sm font-medium transition-colors text-left"
                  >
                    <Icon className="w-4 h-4 text-primary" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Sleep Timer Sheet ── */}
      <AnimatePresence>
        {showTimerMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-md flex items-end justify-center touch-none"
            onClick={() => setShowTimerMenu(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 60 || info.velocity.y > 250) {
                  setShowTimerMenu(false);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[#141416] border-t border-white/10 rounded-t-3xl p-6 text-white space-y-4 shadow-2xl touch-pan-y"
            >
              <div className="w-12 h-1.5 bg-white/40 rounded-full mx-auto cursor-grab active:cursor-grabbing" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="w-5 h-5 text-amber-400" />
                  <h3 className="text-xl font-bold">Sleep Timer</h3>
                </div>
                <button
                  onClick={() => setShowTimerMenu(false)}
                  className="p-1 rounded-full text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {sleepTimer.active ? (
                <div className="p-4 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-amber-400/80 font-semibold uppercase tracking-wider">
                      Timer attivo
                    </p>
                    <p className="text-2xl font-mono font-bold text-amber-400 mt-1">
                      {formatTime(sleepTimer.remaining)}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      sleepTimer.cancel();
                      setShowTimerMenu(false);
                      toast({ title: "Timer annullato" });
                    }}
                    className="px-4 py-2 rounded-xl bg-destructive/20 text-destructive text-sm font-bold hover:bg-destructive/30"
                  >
                    Annulla
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15, 20, 30, 45, 60, 90].map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        sleepTimer.start(m);
                        setShowTimerMenu(false);
                        toast({ title: `Timer impostato: ${m} minuti` });
                      }}
                      className="py-3 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-bold text-white transition-all active:scale-95 text-center"
                    >
                      {m < 60 ? `${m}m` : `${m / 60}h`}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
