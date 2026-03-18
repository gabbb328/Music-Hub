import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SpotifyProvider } from "@/contexts/SpotifyContext";
import { useLyricsPreloader } from "@/hooks/useLyricsPreloader";
import { useDynamicTheme } from "@/hooks/useDynamicTheme";
import Sidebar from "@/components/Sidebar";
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
import MoreContent from "@/components/MoreContent";
import SamsungBudsContent from "@/components/SamsungBudsContent";
import AboutContent from "@/components/AboutContent";
import AudioSettingsContent from "@/components/AudioSettingsContent";
import { SpotifyStatus } from "@/components/SpotifyStatus";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import NeuralSpaceMixerContent from "@/components/NeuralSpaceMixerContent";
import { useMediaSession } from "@/hooks/useMediaSession";
import {
  usePlaybackState, usePlayMutation, usePauseMutation,
  useNextMutation, usePreviousMutation, useSeekMutation,
} from "@/hooks/useSpotify";
import EasterEggOverlay, { EasterEggList } from "@/components/EasterEggOverlay";
import type { EasterEggType } from "@/hooks/useEasterEgg";
import { Crown, Zap } from "lucide-react";

// ── Konami sequence: ↑↑↓↓←→←→BA ─────────────────────────────────────────────
const KONAMI_KEYS = [
  "ArrowUp","ArrowUp","ArrowDown","ArrowDown",
  "ArrowLeft","ArrowRight","ArrowLeft","ArrowRight",
  "b","a",
];
// Sequenza mobile (swipe): ↑↑↓↓←→←→
const KONAMI_SWIPES = [
  "ArrowUp","ArrowUp","ArrowDown","ArrowDown",
  "ArrowLeft","ArrowRight","ArrowLeft","ArrowRight",
];

// ── Super Mode Overlay ────────────────────────────────────────────────────────
function SuperModeOverlay({ active, onEnd }: { active: boolean; onEnd: () => void }) {
  const [remaining, setRemaining] = useState(20);

  useEffect(() => {
    if (!active) { setRemaining(20); return; }
    setRemaining(20);
    const t = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clearInterval(t); onEnd(); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [active]); // eslint-disable-line

  if (!active) return null;

  return (
    <>
      {/* Sfondo dorato — z:5, pointer-events none, sotto tutto */}
      <motion.div
        key="super-bg"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 5 }}
      >
        {/* Radiale animato */}
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              "radial-gradient(ellipse at 15% 50%, rgba(255,215,0,0.22) 0%, rgba(255,140,0,0.1) 45%, transparent 70%)",
              "radial-gradient(ellipse at 85% 25%, rgba(255,215,0,0.22) 0%, rgba(255,140,0,0.1) 45%, transparent 70%)",
              "radial-gradient(ellipse at 50% 85%, rgba(255,215,0,0.22) 0%, rgba(255,140,0,0.1) 45%, transparent 70%)",
              "radial-gradient(ellipse at 15% 50%, rgba(255,215,0,0.22) 0%, rgba(255,140,0,0.1) 45%, transparent 70%)",
            ]
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Bordo pulsante */}
        <motion.div
          className="absolute inset-0"
          style={{ border: "1.5px solid rgba(255,215,0,0.25)" }}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
        {/* Particelle dorate */}
        {Array.from({ length: 10 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `${5 + i * 9.5}%`,
              bottom: "4rem",
              width:  4 + (i % 3) * 2,
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

      {/* Badge centrato — pointer-events none */}
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
          boxShadow: "0 0 28px rgba(255,215,0,0.55), 0 3px 10px rgba(0,0,0,0.35)",
        }}
      >
        <motion.span animate={{ rotate: [0, 18, -18, 0] }} transition={{ duration: 0.45, repeat: Infinity }}>
          <Crown size={15} color="#000" strokeWidth={2.5} />
        </motion.span>
        <span className="text-black font-black text-xs tracking-widest uppercase">SUPER MODE</span>
        <motion.span animate={{ scale: [1, 1.35, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>
          <Zap size={14} color="#000" strokeWidth={2.5} />
        </motion.span>
        <span className="text-black/60 font-mono text-[10px] font-bold tabular-nums ml-0.5">{remaining}s</span>
      </motion.div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
const Index = () => {
  const player = usePlayerStore();
  const [activeSection, setActiveSection]   = useState("home");
  const [showNowPlaying, setShowNowPlaying] = useState(false);
  const [showSettings, setShowSettings]     = useState(false);
  const [activeEgg, setActiveEgg]           = useState<EasterEggType>(null);
  const [showEggList, setShowEggList]       = useState(false);
  const [superMode, setSuperMode]           = useState(false);

  // Refs per Konami / swipe
  const konamiRef     = useRef<string[]>([]);
  const swipeRef      = useRef<string[]>([]);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const superTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const superActiveRef = useRef(false); // ref sincrono per evitare doppia attivazione

  useLyricsPreloader();
  useDynamicTheme();

  const { data: playbackState } = usePlaybackState();
  const playMutation     = usePlayMutation();
  const pauseMutation    = usePauseMutation();
  const nextMutation     = useNextMutation();
  const previousMutation = usePreviousMutation();
  const seekMutation     = useSeekMutation();

  const spotifyTrack = playbackState?.item;
  const isPlaying    = playbackState?.is_playing ?? player.isPlaying;

  const currentTrack = spotifyTrack ? {
    id: spotifyTrack.id,
    title: spotifyTrack.name,
    artist: spotifyTrack.artists[0]?.name || "Unknown Artist",
    album: spotifyTrack.album.name,
    cover: spotifyTrack.album.images[0]?.url || "",
    duration: Math.floor(spotifyTrack.duration_ms / 1000),
  } : player.currentTrack;

  const mediaActions = {
    play:      () => spotifyTrack ? playMutation.mutate({}) : player.play(),
    pause:     () => spotifyTrack ? pauseMutation.mutate() : player.pause(),
    nextTrack: () => spotifyTrack ? nextMutation.mutate() : player.nextTrack(),
    prevTrack: () => spotifyTrack ? previousMutation.mutate() : player.prevTrack(),
    seekTo: (time: number) => {
      if (spotifyTrack) seekMutation.mutate(Math.floor(time * 1000));
      else player.setProgress((time / (currentTrack?.duration || 1)) * 100);
    }
  };

  useMediaSession(currentTrack, isPlaying, mediaActions);
  
  const handleDismissEgg = useCallback(() => setActiveEgg(null), []);

  // ── Attiva/disattiva Super Mode ────────────────────────────────────────────
  const activateSuperMode = () => {
    if (superActiveRef.current) return;
    superActiveRef.current = true;
    setSuperMode(true);
    // Velocità 1.5x su tutti gli audio/video HTML locali
    document.querySelectorAll<HTMLMediaElement>("audio, video")
      .forEach(el => { try { el.playbackRate = 1.5; } catch {} });
    if (superTimerRef.current) clearTimeout(superTimerRef.current);
    superTimerRef.current = setTimeout(() => deactivateSuperMode(), 20000);
  };

  const deactivateSuperMode = () => {
    superActiveRef.current = false;
    setSuperMode(false);
    document.querySelectorAll<HTMLMediaElement>("audio, video")
      .forEach(el => { try { el.playbackRate = 1; } catch {} });
    if (superTimerRef.current) clearTimeout(superTimerRef.current);
  };

  useEffect(() => () => { if (superTimerRef.current) clearTimeout(superTimerRef.current); }, []);

  // ── Konami Code — keyboard ─────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      konamiRef.current = [...konamiRef.current, e.key].slice(-KONAMI_KEYS.length);
      if (konamiRef.current.join(",") === KONAMI_KEYS.join(",")) {
        konamiRef.current = [];
        activateSuperMode();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []); // eslint-disable-line

  // ── Konami Code — swipe mobile ─────────────────────────────────────────────
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
      const adx = Math.abs(dx), ady = Math.abs(dy);
      touchStartRef.current = null;
      // Soglia minima per un swipe intenzionale
      if (Math.max(adx, ady) < 55) return;
      const dir = adx > ady
        ? (dx > 0 ? "ArrowRight" : "ArrowLeft")
        : (dy > 0 ? "ArrowDown"  : "ArrowUp");
      swipeRef.current = [...swipeRef.current, dir].slice(-KONAMI_SWIPES.length);
      if (swipeRef.current.join(",") === KONAMI_SWIPES.join(",")) {
        swipeRef.current = [];
        activateSuperMode();
      }
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend",   onTouchEnd,   { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend",   onTouchEnd);
    };
  }, []); // eslint-disable-line

  // ── Content router ─────────────────────────────────────────────────────────
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
      case "search":         return <SearchContent onPlayTrack={player.playTrack} onActivateEgg={setActiveEgg} />;
      case "library":        return <LibraryContent onPlayTrack={player.playTrack} onOpenPlaylist={id => setActiveSection(`playlist-${id}`)} />;
      case "ai-dj":          return <AIDJContent />;
      case "lyrics":         return <LyricsContent currentTrack={player.currentTrack} />;
      case "stats":          return <StatsContent />;
      case "devices":        return <DevicesContent />;
      case "samsung-buds":   return <SamsungBudsContent />;
      case "queue":          return <QueueContent queue={player.queue} currentTrack={player.currentTrack} onPlayTrack={player.playTrack} />;
      case "radio":          return <RadioContent />;
      case "recognize":      return <RecognizeContent />;
      case "equalizer":      return <EqualizerContent />;
      case "liked":          return <LikedSongsContent />;
      case "recent":         return <RecentlyPlayedContent />;
      case "neural-mixer":   return <NeuralSpaceMixerContent />;
      case "about":          return <AboutContent />;
      case "audio-settings": return <AudioSettingsContent />;
      case "more":           return <MoreContent onSectionChange={setActiveSection} onOpenSettings={() => setShowSettings(true)} />;
      default:               return <HomeContent onPlayTrack={player.playTrack} onOpenSettings={() => setShowSettings(true)} />;
    }
  };

  const hasTrack = !!currentTrack;

  return (
    <SpotifyProvider>
      {/*
        .super-mode sul root → sovrascrive CSS variables (--primary diventa oro)
        e applica stili globali a tutti i componenti figli
      */}
      <div className={`flex flex-col h-screen overflow-hidden bg-background transition-colors duration-700 ${superMode ? "super-mode" : ""}`}>
        <SpotifyStatus />

        {/* Easter egg sfondo + lista */}
        <AnimatePresence>
          {activeEgg && <EasterEggOverlay egg={activeEgg} onDismiss={handleDismissEgg} />}
        </AnimatePresence>
        <AnimatePresence>
          {showEggList && (
            <EasterEggList
              onClose={() => setShowEggList(false)}
              onActivate={(egg) => { setActiveEgg(egg); setShowEggList(false); }}
            />
          )}
        </AnimatePresence>

        {/* Super Mode overlay */}
        <AnimatePresence>
          {superMode && <SuperModeOverlay active={superMode} onEnd={deactivateSuperMode} />}
        </AnimatePresence>

        {/* Layout principale */}
        <div className={`flex flex-1 min-h-0 ${hasTrack ? "pb-[7.5rem]" : "pb-14"} md:pb-0`}>
          <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                className="flex-1 flex flex-col min-h-0 overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ type: "tween", duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {/* PlayerBar e MobileNav accorpati per evitare gap su mobile */}
        <div className="md:contents fixed bottom-0 left-0 right-0 z-50 flex flex-col pointer-events-none bg-background/80 backdrop-blur-xl border-t border-border/40 md:bg-transparent md:backdrop-blur-none md:border-t-0">
          <div className="md:relative md:z-auto md:static pointer-events-auto">
            <PlayerBar
              {...player}
              onExpandClick={() => setShowNowPlaying(true)}
              onNavigate={setActiveSection}
              onOpenEggList={() => setShowEggList(true)}
              superMode={superMode}
            />
          </div>
          <div className="pointer-events-auto">
            <MobileNav
              activeSection={activeSection}
              onSectionChange={setActiveSection}
              onOpenSettings={() => setShowSettings(true)}
            />
          </div>
        </div>

        <AnimatePresence>
          {showNowPlaying && (
            <NowPlayingView
              {...player}
              onClose={() => setShowNowPlaying(false)}
              onNavigate={(s) => { setActiveSection(s); setShowNowPlaying(false); }}
            />
          )}
        </AnimatePresence>

        <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
      </div>
    </SpotifyProvider>
  );
};

export default Index;
