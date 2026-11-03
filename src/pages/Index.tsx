import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SpotifyProvider } from "@/contexts/SpotifyContext";
import { SessionProvider } from "@/contexts/SessionContext";
import { useLyricsPreloader } from "@/hooks/useLyricsPreloader";
import { useDynamicTheme } from "@/hooks/useDynamicTheme";
import { useTimeMachineSettings } from "@/hooks/useTimeMachineSettings";
import Sidebar from "@/components/Sidebar";
import { trackFeatureUsage } from "@/hooks/useFeatureUsage";
import MobileNav from "@/components/MobileNav";
import PlayerBar from "@/components/PlayerBar";
import HomeContent from "@/components/HomeContent";
import NowPlayingView from "@/components/NowPlayingView";
import SearchContent from "@/components/SearchContent";
import LibraryContent from "@/components/LibraryContent";
import AIDJContent from "@/components/AIDJContent";
import LyricsContent from "@/components/LyricsContent";
import StatsContent from "@/components/StatsContent";
import DevicesContent from "@/components/DevicesContent";
import QueueContent from "@/components/QueueContent";
import RadioContent from "@/components/RadioContent";
import LikedSongsContent from "@/components/LikedSongsContent";
import RecentlyPlayedContent from "@/components/RecentlyPlayedContent";
import PlaylistDetail from "@/components/PlaylistDetail";
import RecognizeContent from "@/components/RecognizeContent";
import EqualizerContent from "@/components/EqualizerContent";
import SettingsPanel from "@/components/SettingsPanel";
import ProfilePanel from "@/components/ProfilePanel";
import MoreContent from "@/components/MoreContent";
import SamsungBudsContent from "@/components/SamsungBudsContent";
import AboutContent from "@/components/AboutContent";
import AudioSettingsContent from "@/components/AudioSettingsContent";
import GamesContent from "@/components/GamesContent";
import MoodGeneratorContent from "@/components/MoodGeneratorContent";
import MoodCalendarContent from "@/components/MoodCalendarContent";
import ListenAlongContent from "@/components/ListenAlongContent";
import ChangelogContent from "@/components/ChangelogContent";
import "@/time-machine-filters.css";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import NeuralSpaceMixerContent from "@/components/NeuralSpaceMixerContent";
import { useMediaSession } from "@/hooks/useMediaSession";
import {
  usePlaybackState,
  usePlayMutation,
  usePauseMutation,
  useNextMutation,
  usePreviousMutation,
  useSeekMutation,
} from "@/hooks/useSpotify";
import EasterEggOverlay, { EasterEggList } from "@/components/EasterEggOverlay";
import VersionUpdatePage from "@/components/VersionUpdatePage";
import AIPanel from "@/components/AIPanel";
import ExtensionsContent from "@/components/ExtensionsContent";
import { APP_VERSION } from "@/hooks/version";
import type { EasterEggType } from "@/hooks/useEasterEgg";
import { useSpotifyContext } from "@/contexts/SpotifyContext";
//import TouchBar from "@/components/TouchBar";
import { useTheme } from "@/contexts/ThemeContext";
import { Crown, Zap, Smartphone, ChevronRight } from "lucide-react";
import { useAlexa } from "@/hooks/useAlexa";
import { useDeviceType } from "@/hooks/use-mobile";

const KONAMI_KEYS = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];
const KONAMI_SWIPES = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
];

function SuperModeOverlay({
  active,
  onEnd,
}: {
  active: boolean;
  onEnd: () => void;
}) {
  const [remaining, setRemaining] = useState(20);
  const isAlexa = useAlexa();

  useEffect(() => {
    if (!active || isAlexa) {
      setRemaining(20);
      return;
    }
    setRemaining(20);
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(t);
          onEnd();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [active, isAlexa]);

  if (!active || isAlexa) return null;

  return (
    <>
      <motion.div
        key="super-bg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 5 }}
      >
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              "radial-gradient(ellipse at 15% 50%, rgba(255,215,0,0.22) 0%, rgba(255,140,0,0.1) 45%, transparent 70%)",
              "radial-gradient(ellipse at 85% 25%, rgba(255,215,0,0.22) 0%, rgba(255,140,0,0.1) 45%, transparent 70%)",
              "radial-gradient(ellipse at 50% 85%, rgba(255,215,0,0.22) 0%, rgba(255,140,0,0.1) 45%, transparent 70%)",
              "radial-gradient(ellipse at 15% 50%, rgba(255,215,0,0.22) 0%, rgba(255,140,0,0.1) 45%, transparent 70%)",
            ],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-0"
          style={{ border: "1.5px solid rgba(255,215,0,0.25)" }}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
        {Array.from({ length: 10 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `${5 + i * 9.5}%`,
              bottom: "4rem",
              width: 4 + (i % 3) * 2,
              height: 4 + (i % 3) * 2,
              background: `hsla(${42 + (i % 4) * 5},100%,55%,0.85)`,
              boxShadow: "0 0 6px rgba(255,215,0,0.5)",
            }}
            animate={{
              y: [0, -(window.innerHeight * 0.85)],
              opacity: [0, 0.9, 0.8, 0],
            }}
            transition={{
              duration: 2.5 + (i % 4) * 0.7,
              repeat: Infinity,
              delay: i * 0.28,
              ease: "easeOut",
            }}
          />
        ))}
      </motion.div>

      <motion.div
        key="super-badge"
        initial={{ opacity: 0, scale: 0.4, y: -24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.4, y: -24 }}
        transition={{ type: "spring", stiffness: 450, damping: 22 }}
        className="fixed top-14 md:top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 rounded-full select-none"
        style={{
          zIndex: 48,
          pointerEvents: "none",
          background: "linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)",
          boxShadow:
            "0 0 28px rgba(255,215,0,0.55), 0 3px 10px rgba(0,0,0,0.35)",
        }}
      >
        <motion.span
          animate={{ rotate: [0, 18, -18, 0] }}
          transition={{ duration: 0.45, repeat: Infinity }}
        >
          <Crown size={15} color="#000" strokeWidth={2.5} />
        </motion.span>
        <span className="text-black font-black text-xs tracking-widest uppercase">
          SUPER MODE
        </span>
        <motion.span
          animate={{ scale: [1, 1.35, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          <Zap size={14} color="#000" strokeWidth={2.5} />
        </motion.span>
        <span className="text-black/60 font-mono text-[10px] font-bold tabular-nums ml-0.5">
          {remaining}s
        </span>
      </motion.div>
    </>
  );
}

const IndexInner = () => {
  const isAlexa = useAlexa();
  const player = usePlayerStore();
  const { uiStyle } = useTheme();
  const isGlass = uiStyle === "glass";

  const { isIOS, playbackState: spPb } = useSpotifyContext();

  const deviceType = useDeviceType();
  const isMobile = deviceType === "mobile";
  const isTablet = deviceType === "tablet";
  const isDesktop = deviceType === "desktop";
  const [showTabletLateralPlayer, setShowTabletLateralPlayer] = useState(false);

  const [activeSection, setActiveSection] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNowPlaying, setShowNowPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [settingsTab, setSettingsTab] = useState<
    "aspetto" | "audio" | "cuffie"
  >("aspetto");
  const [activeEgg, setActiveEgg] = useState<EasterEggType>(null);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [showEggList, setShowEggList] = useState(false);
  const [superMode, setSuperMode] = useState(false);

  const konamiRef = useRef<string[]>([]);
  const swipeRef = useRef<string[]>([]);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const superTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const superActiveRef = useRef(false);

  useLyricsPreloader();
  useDynamicTheme();
  useTimeMachineSettings();

  useEffect(() => {
    if (activeSection) {
      trackFeatureUsage(activeSection);
    }
  }, [activeSection]);

  const { data: playbackState } = usePlaybackState();
  const playMutation = usePlayMutation();
  const pauseMutation = usePauseMutation();
  const nextMutation = useNextMutation();
  const previousMutation = usePreviousMutation();
  const seekMutation = useSeekMutation();

  const spotifyTrack = playbackState?.item;
  const isPlaying = playbackState?.is_playing ?? player.isPlaying;

  const currentTrack = spotifyTrack
    ? {
        id: spotifyTrack.id,
        title: spotifyTrack.name,
        artist: spotifyTrack.artists[0]?.name || "Unknown Artist",
        album: spotifyTrack.album.name,
        cover: spotifyTrack.album.images[0]?.url || "",
        duration: Math.floor(spotifyTrack.duration_ms / 1000),
      }
    : player.currentTrack;

  // Posizione corrente in secondi (per la Touch Bar e il MediaSession scrubber)
  const currentPositionSec = spotifyTrack
    ? (playbackState?.progress_ms || 0) / 1000
    : ((player.progress || 0) / 100) * (currentTrack?.duration || 0);

  const mediaActions = {
    play: () => (spotifyTrack ? playMutation.mutate({}) : player.play()),
    pause: () => (spotifyTrack ? pauseMutation.mutate() : player.pause()),
    stop: () => (spotifyTrack ? pauseMutation.mutate() : player.pause()),
    nextTrack: () =>
      spotifyTrack ? nextMutation.mutate() : player.nextTrack(),
    prevTrack: () =>
      spotifyTrack ? previousMutation.mutate() : player.prevTrack(),
    seekTo: (time: number) => {
      if (spotifyTrack) seekMutation.mutate(Math.floor(time * 1000));
      else player.setProgress((time / (currentTrack?.duration || 1)) * 100);
    },
    seekBackward: (offset = 10) => {
      const to = Math.max(0, currentPositionSec - offset);
      if (spotifyTrack) seekMutation.mutate(Math.floor(to * 1000));
      else player.setProgress((to / (currentTrack?.duration || 1)) * 100);
    },
    seekForward: (offset = 10) => {
      const to = Math.min(
        currentTrack?.duration || 0,
        currentPositionSec + offset,
      );
      if (spotifyTrack) seekMutation.mutate(Math.floor(to * 1000));
      else player.setProgress((to / (currentTrack?.duration || 1)) * 100);
    },
  };

  useMediaSession(currentTrack, isPlaying, mediaActions, currentPositionSec);

  const handleDismissEgg = useCallback(() => setActiveEgg(null), []);

  const activateSuperMode = () => {
    if (superActiveRef.current) return;
    superActiveRef.current = true;
    setSuperMode(true);
    document
      .querySelectorAll<HTMLMediaElement>("audio, video")
      .forEach((el) => {
        try {
          el.playbackRate = 1.5;
        } catch {}
      });
    if (superTimerRef.current) clearTimeout(superTimerRef.current);
    superTimerRef.current = setTimeout(() => deactivateSuperMode(), 20000);
  };

  const deactivateSuperMode = () => {
    superActiveRef.current = false;
    setSuperMode(false);
    document
      .querySelectorAll<HTMLMediaElement>("audio, video")
      .forEach((el) => {
        try {
          el.playbackRate = 1;
        } catch {}
      });
    if (superTimerRef.current) clearTimeout(superTimerRef.current);
  };

  useEffect(
    () => () => {
      if (superTimerRef.current) clearTimeout(superTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      konamiRef.current = [...konamiRef.current, e.key].slice(
        -KONAMI_KEYS.length,
      );
      if (konamiRef.current.join(",") === KONAMI_KEYS.join(",")) {
        konamiRef.current = [];
        activateSuperMode();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []); // eslint-disable-line

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      touchStartRef.current = { x: t.clientX, y: t.clientY };
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStartRef.current.x;
      const dy = t.clientY - touchStartRef.current.y;
      const adx = Math.abs(dx),
        ady = Math.abs(dy);
      touchStartRef.current = null;
      if (Math.max(adx, ady) < 55) return;
      const dir =
        adx > ady
          ? dx > 0
            ? "ArrowRight"
            : "ArrowLeft"
          : dy > 0
            ? "ArrowDown"
            : "ArrowUp";
      swipeRef.current = [...swipeRef.current, dir].slice(
        -KONAMI_SWIPES.length,
      );
      if (swipeRef.current.join(",") === KONAMI_SWIPES.join(",")) {
        swipeRef.current = [];
        activateSuperMode();
      }
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  const renderContent = () => {
    if (activeSection.startsWith("playlist-")) {
      return (
        <PlaylistDetail
          playlistId={activeSection.replace("playlist-", "")}
          onBack={() => setActiveSection("library")}
        />
      );
    }
    switch (activeSection) {
      case "extensions":
        return <ExtensionsContent onSectionChange={setActiveSection} />;
      case "search":
        return (
          <SearchContent
            onPlayTrack={player.playTrack}
            onActivateEgg={setActiveEgg}
            initialQuery={searchQuery}
          />
        );
      case "library":
        return (
          <LibraryContent
            onPlayTrack={player.playTrack}
            onOpenPlaylist={(id) => setActiveSection(`playlist-${id}`)}
          />
        );
      case "ai-dj":
        return <AIDJContent />;
      case "lyrics":
        return <LyricsContent currentTrack={player.currentTrack} />;
      case "stats":
        return <StatsContent />;
      case "devices":
        return <DevicesContent />;
      case "samsung-buds":
        return <SamsungBudsContent />;
      case "queue":
        return (
          <QueueContent
            queue={player.queue}
            currentTrack={player.currentTrack}
            onPlayTrack={player.playTrack}
          />
        );
      case "radio":
        return <RadioContent />;
      case "recognize":
        return <RecognizeContent />;
      case "equalizer":
        return <EqualizerContent />;
      case "liked":
        return <LikedSongsContent />;
      case "recent":
        return <RecentlyPlayedContent />;
      case "neural-mixer":
        return <NeuralSpaceMixerContent />;
      case "about":
        return <AboutContent />;
      case "audio-settings":
        return <AudioSettingsContent />;
      case "quiz":
      case "games":
        return <GamesContent onStateChange={setIsQuizActive} />;
      case "mood":
        return <MoodGeneratorContent />;
      case "mood-calendar":
        return <MoodCalendarContent />;
      case "listen-along":
        return <ListenAlongContent />;
      case "changelog":
        return <ChangelogContent />;
      case "more":
        return (
          <MoreContent
            onSectionChange={setActiveSection}
            onOpenSettings={() => setShowSettings(true)}
            onOpenProfile={() => setShowProfile(true)}
            onOpenAI={() => setShowAIPanel(true)}
          />
        );
      default:
        return (
          <HomeContent
            onPlayTrack={player.playTrack}
            onOpenSettings={() => setShowSettings(true)}
            onOpenProfile={() => setShowProfile(true)}
            onOpenAI={() => setShowAIPanel(true)}
            onActivateEgg={(egg) => {
              setActiveEgg(egg);
              if (egg === "music" || egg === "disco" || egg === "love") {
                player.playTrack({
                  id: "easter-egg-track",
                  title:
                    egg === "music"
                      ? "Secret Track"
                      : egg === "disco"
                        ? "Disco Fever"
                        : "Love Song",
                  artist: "Easter Egg",
                  album: "Secrets",
                  cover:
                    "https://images.unsplash.com/photo-1614680376593-902f74cf0d41",
                  duration: 180,
                });
              }
            }}
            onNavigateToSearch={(q) => {
              setSearchQuery(q);
              setActiveSection("search");
            }}
          />
        );
    }
  };

  const hasTrack = !!currentTrack;

  return (
    <div
      className={`flex flex-col h-screen overflow-hidden bg-background transition-colors duration-700 ${superMode ? "super-mode" : ""} ${isGlass ? "theme-glass" : ""}`}
    >
      {/* Blob di sfondo animati — visibili solo in Glass mode */}
      {isGlass && !isAlexa && (
        <>
          <div className="glass-blob glass-blob-1" />
          <div className="glass-blob glass-blob-2" />
          <div className="glass-blob glass-blob-3" />
          {/* Sparkle stars decorativi */}
          <div
            className="glass-sparkle"
            style={{
              top: "8%",
              right: "6%",
              width: 16,
              height: 16,
              animationDuration: "3s",
              animationDelay: "0s",
            }}
          >
            <svg viewBox="0 0 24 24" fill="white">
              <path d="M12 2L13.5 9.5L21 11L13.5 12.5L12 20L10.5 12.5L3 11L10.5 9.5Z" />
            </svg>
          </div>
          <div
            className="glass-sparkle"
            style={{
              bottom: "12%",
              right: "3%",
              width: 10,
              height: 10,
              animationDuration: "4s",
              animationDelay: "1.5s",
            }}
          >
            <svg viewBox="0 0 24 24" fill="white">
              <path d="M12 2L13.5 9.5L21 11L13.5 12.5L12 20L10.5 12.5L3 11L10.5 9.5Z" />
            </svg>
          </div>
        </>
      )}

      {isIOS && !spPb?.device && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-500/15 border-b border-amber-500/25 text-sm">
          <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-amber-200 text-xs leading-snug flex-1">
            <span className="font-semibold">Apri l'app Spotify</span> sul tuo
            iPhone e avvia la riproduzione — poi torna qui per controllarlo.
          </p>
        </div>
      )}

      <AnimatePresence>
        {activeEgg && (
          <EasterEggOverlay egg={activeEgg} onDismiss={handleDismissEgg} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showEggList && (
          <EasterEggList
            onClose={() => setShowEggList(false)}
            onActivate={(egg) => {
              setActiveEgg(egg);
              setShowEggList(false);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {superMode && (
          <SuperModeOverlay active={superMode} onEnd={deactivateSuperMode} />
        )}
      </AnimatePresence>

      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {isDesktop && (
          <Sidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            onOpenSettings={() => {
              setSettingsTab("aspetto");
              setShowSettings(true);
            }}
          />
        )}
        <main
          className={`flex-1 flex flex-col min-w-0 overflow-hidden relative transition-[padding] duration-300 ${
            isMobile
              ? hasTrack
                ? "pb-4"
                : "pb-0"
              : isTablet
                ? "pb-0"
                : "pb-0"
          }`}
        >
          {isAlexa ? (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {renderContent()}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                className="flex-1 flex flex-col min-h-0 overflow-hidden transform-gpu will-change-transform"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 0.16,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Sfumatura sul fondo che dissolve il contenuto scrollabile — funziona sempre.
              backdrop-filter non è usabile qui (conflitti con overflow-hidden e stacking context).
              Il gradiente from-background crea il fade affidabile su qualsiasi browser/tema. */}
          {(isMobile || isTablet) && (
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute bottom-0 left-0 right-0 z-40 transition-[height] duration-300 ${
                isMobile && hasTrack ? "h-40" : "h-28"
              }`}
              style={{
                background:
                  "linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background)) 15%, transparent 100%)",
              }}
            />
          )}
        </main>
        {/* Desktop Vertical Player in Glass mode */}
        {isDesktop && isGlass && hasTrack && (
          <div className="hidden lg:flex flex-col w-80 shrink-0 border-l border-white/10 glass-surface z-50">
            <PlayerBar
              {...player}
              onExpandClick={() => setShowNowPlaying(true)}
              onNavigate={setActiveSection}
              onOpenEggList={() => setShowEggList(true)}
              superMode={superMode}
              isQuizActive={isQuizActive}
              isVertical={true}
            />
          </div>
        )}

        {/* Tablet Lateral Drawer Player (In-flow flex item: resizes the open page side-by-side) */}
        <AnimatePresence initial={false}>
          {isTablet && hasTrack && showTabletLateralPlayer && (
            <motion.aside
              key="tablet-lateral-drawer"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              className="shrink-0 h-full overflow-hidden border-l border-border/40 dark:border-white/10 bg-background/95 dark:bg-card/95 backdrop-blur-2xl flex flex-col z-40 relative shadow-2xl"
            >
              <div className="w-80 h-full flex flex-col pt-3 pb-4">
                <div className="flex items-center justify-between px-5 py-2.5 border-b border-border/30 shrink-0">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    In Riproduzione
                  </span>
                  <button
                    onClick={() => setShowTabletLateralPlayer(false)}
                    className="p-1.5 rounded-full hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="Chiudi pannello laterale"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto">
                  <PlayerBar
                    {...player}
                    onExpandClick={() => setShowNowPlaying(true)}
                    onNavigate={(s) => setActiveSection(s)}
                    onOpenEggList={() => setShowEggList(true)}
                    superMode={superMode}
                    isQuizActive={isQuizActive}
                    isVertical={true}
                  />
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop Horizontal Player in Normal/Classic mode */}
      {isDesktop && !isGlass && hasTrack && (
        <div className="hidden lg:block border-t border-border bg-card/95 backdrop-blur-md z-50">
          <PlayerBar
            {...player}
            onExpandClick={() => setShowNowPlaying(true)}
            onNavigate={setActiveSection}
            onOpenEggList={() => setShowEggList(true)}
            superMode={superMode}
            isQuizActive={isQuizActive}
            isVertical={false}
            variant="desktop"
          />
        </div>
      )}

      {/* Mobile Floating Pills Layout (Stacked vertically) */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none pb-[env(safe-area-inset-bottom)] px-3 mb-2 flex flex-col items-center gap-2">
          {hasTrack && (
            <div className="pointer-events-auto w-full max-w-md">
              <PlayerBar
                {...player}
                onExpandClick={() => setShowNowPlaying(true)}
                onNavigate={setActiveSection}
                onOpenEggList={() => setShowEggList(true)}
                superMode={superMode}
                isQuizActive={isQuizActive}
                variant="pill"
                layout="mobile"
              />
            </div>
          )}
          <div className="pointer-events-auto w-full max-w-md">
            <MobileNav
              activeSection={activeSection}
              onSectionChange={setActiveSection}
              onOpenSettings={() => setShowSettings(true)}
              embedded={true}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Tablet Floating Pills Layout (Side-by-side in same line; player bar disappears when lateral is open) */}
      {isTablet && (
        <div
          className="fixed bottom-0 left-0 z-50 pointer-events-none pb-[env(safe-area-inset-bottom)] px-4 mb-3 transition-[right] duration-300 ease-out"
          style={{ right: showTabletLateralPlayer ? "320px" : "0px" }}
        >
          <div className="flex flex-row items-center justify-center gap-3 w-full max-w-3xl mx-auto">
            <div className="pointer-events-auto flex-1 max-w-sm shrink-0">
              <MobileNav
                activeSection={activeSection}
                onSectionChange={setActiveSection}
                onOpenSettings={() => setShowSettings(true)}
                embedded={true}
                className="w-full"
              />
            </div>
            {hasTrack && !showTabletLateralPlayer && (
              <div className="pointer-events-auto flex-1 max-w-md shrink-0">
                <PlayerBar
                  {...player}
                  onExpandClick={() => setShowNowPlaying(true)}
                  onNavigate={setActiveSection}
                  onOpenEggList={() => setShowEggList(true)}
                  superMode={superMode}
                  isQuizActive={isQuizActive}
                  variant="pill"
                  layout="tablet"
                  isLateralOpen={showTabletLateralPlayer}
                  onToggleLateral={() => setShowTabletLateralPlayer(true)}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {!isAlexa && (
        <>
          <AnimatePresence>
            {showNowPlaying && (
              <NowPlayingView
                {...player}
                onClose={() => setShowNowPlaying(false)}
                onNavigate={(s) => {
                  setActiveSection(s);
                  setShowNowPlaying(false);
                }}
                isQuizActive={isQuizActive}
              />
            )}
          </AnimatePresence>
          <SettingsPanel
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            initialTab={settingsTab}
            onOpenProfile={() => setShowProfile(true)}
          />
          <ProfilePanel
            isOpen={showProfile}
            onClose={() => setShowProfile(false)}
          />
          <AIPanel isOpen={showAIPanel} onClose={() => setShowAIPanel(false)} />
          {/*<TouchBar
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            currentPosition={currentPositionSec}
            activeSection={activeSection}
            onPlay={() => mediaActions.play()}
            onPause={() => mediaActions.pause()}
            onStop={() => mediaActions.stop?.()}
            onNext={() => mediaActions.nextTrack()}
            onPrev={() => mediaActions.prevTrack()}
            onSeek={(t) => mediaActions.seekTo(t)}
            onOpenAI={() => setShowAIPanel(true)}
            onSectionChange={setActiveSection}
          />*/}
        </>
      )}
    </div>
  );
};

const Index = () => (
  <SessionProvider>
    <SpotifyProvider>
      <IndexInner />
    </SpotifyProvider>
  </SessionProvider>
);

export default Index;
