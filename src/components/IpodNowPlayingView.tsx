import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  usePlaybackState,
  usePlayMutation,
  usePauseMutation,
  useNextMutation,
  usePreviousMutation,
  useShuffleMutation,
  useRepeatMutation,
  useSeekMutation,
  useQueue,
  useAudioFeatures,
} from "@/hooks/useSpotify";
import { formatTime } from "@/lib/mock-data";
import { lyricsStore } from "@/hooks/useLyricsStore";
import { getCurrentLineIndex } from "@/services/lyrics-api";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTopTracks, useTopArtists, useUserPlaylists } from "@/hooks/useSpotify";
import { useIpodPersistence } from "@/hooks/useIpodPersistence";

// ─── Settings ────────────────────────────────────────────────────────────────
interface IpodSettings {
  bodyColor: string;
  screenColor: string;
  wheelColor: string;
  wheelCenterColor: string;
  textColor: string;
  accentColor: string;
}

const PRESET_COLORS: { name: string; settings: IpodSettings }[] = [
  {
    name: "Classic White",
    settings: {
      bodyColor: "#F0EEE8",
      screenColor: "#C8E8F0",
      wheelColor: "#E0DDD6",
      wheelCenterColor: "#F0EEE8",
      textColor: "#1a1a1a",
      accentColor: "#0070C9",
    },
  },
  {
    name: "Space Black",
    settings: {
      bodyColor: "#1C1C1E",
      screenColor: "#0a0a0a",
      wheelColor: "#2C2C2E",
      wheelCenterColor: "#1C1C1E",
      textColor: "#F5F5F7",
      accentColor: "#FF9F0A",
    },
  },
  {
    name: "Blue",
    settings: {
      bodyColor: "#1D4E89",
      screenColor: "#0a1628",
      wheelColor: "#2563AB",
      wheelCenterColor: "#1D4E89",
      textColor: "#E8F4FD",
      accentColor: "#60B3FF",
    },
  },
  {
    name: "RED",
    settings: {
      bodyColor: "#B91C1C",
      screenColor: "#1a0505",
      wheelColor: "#DC2626",
      wheelCenterColor: "#B91C1C",
      textColor: "#FEF2F2",
      accentColor: "#FCA5A5",
    },
  },
  {
    name: "Green",
    settings: {
      bodyColor: "#166534",
      screenColor: "#052e16",
      wheelColor: "#16A34A",
      wheelCenterColor: "#166534",
      textColor: "#F0FDF4",
      accentColor: "#4ADE80",
    },
  },
  {
    name: "Pink",
    settings: {
      bodyColor: "#DB2777",
      screenColor: "#1a0010",
      wheelColor: "#EC4899",
      wheelCenterColor: "#DB2777",
      textColor: "#FDF2F8",
      accentColor: "#F9A8D4",
    },
  },
  {
    name: "Silver",
    settings: {
      bodyColor: "#9CA3AF",
      screenColor: "#111827",
      wheelColor: "#D1D5DB",
      wheelCenterColor: "#9CA3AF",
      textColor: "#F9FAFB",
      accentColor: "#60A5FA",
    },
  },
  {
    name: "Gold",
    settings: {
      bodyColor: "#B45309",
      screenColor: "#1c1005",
      wheelColor: "#D97706",
      wheelCenterColor: "#B45309",
      textColor: "#FFFBEB",
      accentColor: "#FDE68A",
    },
  },
];

// ─── iPod Menu System ─────────────────────────────────────────────────────────
export type IpodScreen =
  | "nowplaying"
  | "menu"
  | "music"
  | "settings"
  | "colorpicker"
  | "lyrics"
  | "queue"
  | "artists"
  | "albums"
  | "songs"
  | "playlists"
  | "extras";

// ─── Click Wheel ──────────────────────────────────────────────────────────────
function ClickWheel({
  onMenuClick,
  onPlayPause,
  onNext,
  onPrev,
  onScrollUp,
  onScrollDown,
  onCenterClick,
  settings,
  scale,
}: {
  onMenuClick: () => void;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onScrollUp: () => void;
  onScrollDown: () => void;
  onCenterClick: () => void;
  settings: IpodSettings;
  scale?: number;
}) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const lastAngleRef = useRef<number | null>(null);
  const accumulatedRef = useRef(0);
  const TICK = 12; // gradi per "tick" di scroll (più basso = più sensibile)

  const getAngle = (e: Touch | MouseEvent, rect: DOMRect) => {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const x = (e as any).clientX - cx;
    const y = (e as any).clientY - cy;
    return Math.atan2(y, x) * (180 / Math.PI);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!e.touches[0]) return;
    const rect = wheelRef.current!.getBoundingClientRect();
    lastAngleRef.current = getAngle(e.touches[0] as any, rect);
    accumulatedRef.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (lastAngleRef.current === null || !e.touches[0]) return;
    const rect = wheelRef.current!.getBoundingClientRect();
    const angle = getAngle(e.touches[0] as any, rect);
    let delta = angle - lastAngleRef.current;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    lastAngleRef.current = angle;
    accumulatedRef.current += delta;
    if (accumulatedRef.current > TICK) {
      onScrollDown();
      accumulatedRef.current -= TICK;
    } else if (accumulatedRef.current < -TICK) {
      onScrollUp();
      accumulatedRef.current += TICK;
    }
  };

  const handleTouchEnd = () => {
    lastAngleRef.current = null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = wheelRef.current!.getBoundingClientRect();
    lastAngleRef.current = getAngle(e.nativeEvent, rect);
    accumulatedRef.current = 0;

    const onMove = (ev: MouseEvent) => {
      if (lastAngleRef.current === null) return;
      const angle = getAngle(ev, rect);
      let delta = angle - lastAngleRef.current;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      lastAngleRef.current = angle;
      accumulatedRef.current += delta;
      if (accumulatedRef.current > TICK) {
        onScrollDown();
        accumulatedRef.current -= TICK;
      } else if (accumulatedRef.current < -TICK) {
        onScrollUp();
        accumulatedRef.current += TICK;
      }
    };

    const onUp = () => {
      lastAngleRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const W = 200 * (scale || 1);
  const outerR = W / 2;
  const centerR = W * 0.2;

  return (
    <div
      ref={wheelRef}
      className="relative select-none flex-shrink-0"
      style={{ width: W, height: W }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
    >
      {/* Outer wheel */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at 35% 35%, ${settings.wheelColor}dd, ${settings.wheelColor}88)`,
          boxShadow: `inset 0 2px 6px rgba(255,255,255,0.3), inset 0 -2px 6px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.4)`,
        }}
      />

      {/* MENU button (top) */}
      <button
        className="absolute flex items-center justify-center font-bold text-xs tracking-widest transition-opacity hover:opacity-70 active:opacity-50"
        style={{
          top: "8%",
          left: "50%",
          transform: "translateX(-50%)",
          color: settings.textColor,
          fontSize: 10,
          letterSpacing: "0.12em",
          fontFamily: "'SF Pro Display', 'Helvetica Neue', sans-serif",
          textShadow: "0 1px 2px rgba(0,0,0,0.3)",
        }}
        onClick={(e) => {
          e.stopPropagation();
          onMenuClick();
        }}
      >
        MENU
      </button>

      {/* ⏭ Next (right) */}
      <button
        className="absolute flex items-center justify-center transition-opacity hover:opacity-70 active:opacity-50"
        style={{
          right: "8%",
          top: "50%",
          transform: "translateY(-50%)",
          color: settings.textColor,
        }}
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
      >
        <svg width="18" height="14" viewBox="0 0 18 14" fill="currentColor">
          <path d="M0 0 L9 7 L0 14Z" />
          <path d="M9 0 L18 7 L9 14Z" />
        </svg>
      </button>

      {/* ⏮ Prev (left) */}
      <button
        className="absolute flex items-center justify-center transition-opacity hover:opacity-70 active:opacity-50"
        style={{
          left: "8%",
          top: "50%",
          transform: "translateY(-50%)",
          color: settings.textColor,
        }}
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
      >
        <svg width="18" height="14" viewBox="0 0 18 14" fill="currentColor">
          <path d="M18 0 L9 7 L18 14Z" />
          <path d="M9 0 L0 7 L9 14Z" />
        </svg>
      </button>

      {/* ⏯ Play/Pause (bottom) */}
      <button
        className="absolute flex items-center justify-center transition-opacity hover:opacity-70 active:opacity-50"
        style={{
          bottom: "8%",
          left: "50%",
          transform: "translateX(-50%)",
          color: settings.textColor,
        }}
        onClick={(e) => {
          e.stopPropagation();
          onPlayPause();
        }}
      >
        <svg width="22" height="14" viewBox="0 0 22 14" fill="currentColor">
          {/* Play part */}
          <path d="M0 0 L8 7 L0 14Z" />
          {/* Pause part */}
          <rect x="10" y="0" width="4" height="14" rx="1" />
          <rect x="16" y="0" width="4" height="14" rx="1" />
        </svg>
      </button>

      {/* Center button */}
      <button
        className="absolute rounded-full transition-all hover:brightness-110 active:brightness-90 active:scale-95"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: centerR * 2,
          height: centerR * 2,
          background: `radial-gradient(circle at 40% 40%, ${settings.wheelCenterColor}ff, ${settings.wheelCenterColor}bb)`,
          boxShadow: `0 2px 8px rgba(0,0,0,0.4), inset 0 1px 3px rgba(255,255,255,0.3)`,
        }}
        onClick={(e) => {
          e.stopPropagation();
          onCenterClick();
        }}
      />
    </div>
  );
}

// ─── iPod Screen ──────────────────────────────────────────────────────────────
function IpodScreenContent({
  screen,
  track,
  isPlaying,
  progress,
  elapsed,
  duration,
  settings,
  menuIndex,
  lyrics,
  currentLineIndex,
  queue,
  audioFeatures,
  topTracks,
  topArtists,
  playlists,
  onMenuSelect,
}: {
  screen: IpodScreen;
  track: any;
  isPlaying: boolean;
  progress: number;
  elapsed: number;
  duration: number;
  settings: IpodSettings;
  menuIndex: number;
  lyrics: any[];
  currentLineIndex: number;
  queue: any[];
  audioFeatures: any;
  topTracks?: any[];
  topArtists?: any[];
  playlists?: any[];
  onMenuSelect: (idx: number) => void;
}) {
  const lyricsRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const itemRefs = useRef<(HTMLDivElement | HTMLButtonElement | null)[]>([]);

  // Centering for Menu
  useEffect(() => {
    const container = menuRef.current;
    const item = itemRefs.current[menuIndex];
    if (!container || !item) return;

    const target = item.offsetTop - container.clientHeight / 2 + item.clientHeight / 2;
    container.scrollTo({ top: Math.max(0, target), behavior: "auto" }); // "auto" for instant response during wheel scroll
  }, [menuIndex, screen]);

  useEffect(() => {
    const container = lyricsRef.current;
    const line = lineRefs.current[currentLineIndex];
    if (!container || !line) return;
    const target = line.offsetTop - container.clientHeight / 2 + line.clientHeight / 2;
    container.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
  }, [currentLineIndex]);

  const coverUrl = track?.album?.images?.[0]?.url;

  // ── Now Playing Screen ───────────────────────────────────────────────────
  if (screen === "nowplaying" && track) {
    return (
      <div className="flex flex-col h-full" style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', sans-serif" }}>
        {/* Title bar */}
        <div
          className="flex items-center justify-center px-2 py-1"
          style={{
            background: `linear-gradient(to bottom, ${settings.accentColor}cc, ${settings.accentColor}88)`,
            minHeight: 22,
          }}
        >
          <span
            className="text-center font-semibold truncate"
            style={{ color: "#fff", fontSize: 11, maxWidth: "90%" }}
          >
            {track.name}
          </span>
        </div>

        {/* Main Content Area (Split Layout) */}
        <div className="flex-1 flex flex-row items-center px-3 py-2 gap-4 min-h-0">
          {/* Album art (Left) */}
          <div className="flex-shrink-0">
            {coverUrl ? (
              <motion.img
                key={track.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                src={coverUrl}
                alt=""
                className="rounded shadow-2xl object-cover"
                style={{ 
                  width: "clamp(85px, 35vw, 130px)", 
                  height: "clamp(85px, 35vw, 130px)", 
                  boxShadow: "0 8px 30px rgba(0,0,0,0.7)",
                  border: `1px solid ${settings.textColor}11`
                }}
              />
            ) : (
              <div
                className="rounded flex items-center justify-center bg-zinc-800"
                style={{ width: 100, height: 100 }}
              >
                <span style={{ fontSize: 40 }}>🎵</span>
              </div>
            )}
          </div>

          {/* Info + Progress (Right) */}
          <div className="flex-1 min-w-0 flex flex-col justify-center space-y-3">
            {/* Track info */}
            <div className="space-y-0.5">
              <div 
                className="truncate font-bold leading-tight" 
                style={{ color: settings.textColor, fontSize: 13, letterSpacing: "-0.01em" }}
              >
                {track.name}
              </div>
              <div 
                className="truncate font-medium opacity-80" 
                style={{ color: settings.textColor, fontSize: 11 }}
              >
                {track.artists?.map((a: any) => a.name).join(", ")}
              </div>
              <div 
                className="truncate opacity-50" 
                style={{ color: settings.textColor, fontSize: 10 }}
              >
                {track.album?.name}
              </div>
            </div>

            {/* Progress Area */}
            <div className="w-full">
              <div
                className="rounded-full overflow-hidden"
                style={{ height: 4, background: `${settings.textColor}22` }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    width: `${progress}%`,
                    background: `linear-gradient(to right, ${settings.accentColor}, ${settings.accentColor}dd)`,
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className="flex justify-between mt-1.5 px-0.5 font-mono">
                <span style={{ color: `${settings.textColor}99`, fontSize: 9 }}>{formatTime(elapsed)}</span>
                <span style={{ color: isPlaying ? settings.accentColor : `${settings.textColor}99`, fontSize: 9 }}>
                  {isPlaying ? "▶" : "⏸"}
                </span>
                <span style={{ color: `${settings.textColor}99`, fontSize: 9 }}>-{formatTime(duration - elapsed)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Menu ────────────────────────────────────────────────────────────
  const MENUS: Record<string, { label: string; items: string[] }> = {
    menu: {
      label: "iPod",
      items: ["Music", "Lyrics", "Queue", "Extras", "Settings"],
    },
    music: {
      label: "Music",
      items: ["Now Playing", "Artists", "Albums", "Songs", "Playlists"],
    },
    settings: {
      label: "Settings",
      items: ["Color Theme", "About", "Reset Settings"],
    },
    extras: {
      label: "Extras",
      items: ["Track Info", "Audio Analysis", "Sleep Timer"],
    },
  };

  if (screen === "colorpicker") {
    return (
      <div className="flex flex-col h-full" style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', sans-serif" }}>
        <div
          className="flex items-center justify-between px-2 py-1"
          style={{
            background: `linear-gradient(to bottom, ${settings.accentColor}cc, ${settings.accentColor}88)`,
            minHeight: 22,
          }}
        >
          <span style={{ color: "#fff", fontSize: 10 }}>◀ Settings</span>
          <span style={{ color: "#fff", fontSize: 11, fontWeight: 600 }}>Color Theme</span>
          <span style={{ width: 40 }} />
        </div>
        <div ref={menuRef} className="flex-1 overflow-y-auto scroll-smooth">
          {PRESET_COLORS.map((p, i) => (
            <button
              key={p.name}
              ref={(el) => { itemRefs.current[i] = el; }}
              className="w-full flex items-center gap-2 px-3 py-1.5 transition-colors"
              style={{
                background: menuIndex === i ? settings.accentColor : "transparent",
                borderBottom: `1px solid ${settings.textColor}11`,
              }}
              onClick={() => onMenuSelect(i)}
            >
              <div
                className="rounded-full shrink-0"
                style={{
                  width: 14,
                  height: 14,
                  background: p.settings.bodyColor,
                  border: `2px solid ${p.settings.wheelColor}`,
                }}
              />
              <span
                style={{
                  color: menuIndex === i ? "#fff" : settings.textColor,
                  fontSize: 11,
                  fontWeight: menuIndex === i ? 600 : 400,
                }}
              >
                {p.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (screen === "lyrics") {
    return (
      <div className="flex flex-col h-full" style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', sans-serif" }}>
        <div
          className="flex items-center justify-center px-2 py-1"
          style={{
            background: `linear-gradient(to bottom, ${settings.accentColor}cc, ${settings.accentColor}88)`,
            minHeight: 22,
          }}
        >
          <span style={{ color: "#fff", fontSize: 11, fontWeight: 600 }}>Lyrics</span>
        </div>
        {lyrics.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <span style={{ color: `${settings.textColor}66`, fontSize: 10 }}>Not available</span>
          </div>
        ) : (
          <div ref={lyricsRef} className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 scroll-smooth">
            {lyrics.map((line: any, i: number) => (
              <div
                key={i}
                ref={(el) => { lineRefs.current[i] = el; }}
                className="text-center py-0.5 rounded transition-all duration-300"
                style={{
                  fontSize: i === currentLineIndex ? 11 : 10,
                  fontWeight: i === currentLineIndex ? 700 : 400,
                  color:
                    i === currentLineIndex
                      ? settings.accentColor
                      : i < currentLineIndex
                      ? `${settings.textColor}44`
                      : `${settings.textColor}88`,
                  background: i === currentLineIndex ? `${settings.accentColor}22` : "transparent",
                }}
              >
                {line.text || "♪"}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (screen === "queue") {
    return (
      <div className="flex flex-col h-full" style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', sans-serif" }}>
        <div
          className="flex items-center justify-center px-2 py-1"
          style={{
            background: `linear-gradient(to bottom, ${settings.accentColor}cc, ${settings.accentColor}88)`,
            minHeight: 22,
          }}
        >
          <span style={{ color: "#fff", fontSize: 11, fontWeight: 600 }}>Up Next</span>
        </div>
        <div ref={menuRef} className="flex-1 overflow-y-auto scroll-smooth">
          {queue.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <span style={{ color: `${settings.textColor}66`, fontSize: 10 }}>Queue empty</span>
            </div>
          ) : (
            queue.slice(0, 12).map((t: any, i: number) => (
              <div
                key={i}
                className="flex items-center gap-2 px-2 py-1.5"
                style={{ borderBottom: `1px solid ${settings.textColor}11` }}
              >
                <span style={{ color: `${settings.textColor}66`, fontSize: 9, width: 14 }}>{i + 1}</span>
                {t.album?.images?.[0]?.url && (
                  <img
                    src={t.album.images[0].url}
                    alt=""
                    className="rounded"
                    style={{ width: 24, height: 24, objectFit: "cover" }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="truncate" style={{ color: settings.textColor, fontSize: 10, fontWeight: 500 }}>
                    {t.name}
                  </div>
                  <div className="truncate" style={{ color: `${settings.textColor}66`, fontSize: 9 }}>
                    {t.artists?.[0]?.name}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // ── Lists Rendering (Artists, Songs, Playlists, Albums) ─────────────────
  if (["artists", "songs", "playlists", "albums"].includes(screen)) {
    let items: any[] = [];
    let title = "";
    
    if (screen === "artists") { items = topArtists || []; title = "Artists"; }
    else if (screen === "songs") { items = topTracks || []; title = "Songs"; }
    else if (screen === "playlists") { items = playlists || []; title = "Playlists"; }
    else if (screen === "albums") { 
      const albumMap = new Map();
      topTracks?.forEach(t => {
        if (t.album?.id && !albumMap.has(t.album.id)) albumMap.set(t.album.id, t.album);
      });
      items = Array.from(albumMap.values());
      title = "Albums";
    }

    return (
      <div className="flex flex-col h-full" style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', sans-serif" }}>
        <div className="flex items-center justify-center px-2 py-1" style={{ background: `linear-gradient(to bottom, ${settings.accentColor}cc, ${settings.accentColor}88)`, minHeight: 22 }}>
          <span style={{ color: "#fff", fontSize: 11, fontWeight: 600 }}>{title}</span>
        </div>
        <div ref={menuRef} className="flex-1 overflow-y-auto scroll-smooth">
          {items.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <span style={{ color: `${settings.textColor}66`, fontSize: 10 }}>Loading...</span>
            </div>
          ) : (
            items.map((item: any, i: number) => (
              <div 
                key={item.id} 
                ref={(el) => { itemRefs.current[i] = el; }}
                className="flex items-center gap-2 px-2 py-1.5 cursor-pointer" 
                style={{ background: menuIndex === i ? settings.accentColor : "transparent", borderBottom: `1px solid ${settings.textColor}11` }}
                onClick={() => onMenuSelect(i)}
              >
                {(item.images?.[0]?.url || item.url || item.cover) ? (
                  <img src={item.images?.[0]?.url || item.url || item.cover} alt="" className="rounded" style={{ width: 24, height: 24, objectFit: "cover" }} />
                ) : (
                  <div className="w-6 h-6 bg-secondary rounded flex items-center justify-center text-[10px]">🎵</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="truncate" style={{ color: menuIndex === i ? "#fff" : settings.textColor, fontSize: 10, fontWeight: 500 }}>
                    {item.name || item.title}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // Generic menu rendering
  const menuData = MENUS[screen as keyof typeof MENUS];
  if (menuData) {
    return (
      <div className="flex flex-col h-full" style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', sans-serif" }}>
        <div
          className="flex items-center justify-center px-2 py-1"
          style={{
            background: `linear-gradient(to bottom, ${settings.accentColor}cc, ${settings.accentColor}88)`,
            minHeight: 22,
          }}
        >
          <span style={{ color: "#fff", fontSize: 11, fontWeight: 600 }}>
            {menuData.label}
          </span>
        </div>
        <div ref={menuRef} className="flex-1 overflow-y-auto scroll-smooth">
          {menuData.items.map((item, i) => (
            <button
              key={item}
              ref={(el) => { itemRefs.current[i] = el; }}
              className="w-full flex items-center justify-between px-3 py-2 transition-colors"
              style={{
                background: menuIndex === i ? settings.accentColor : "transparent",
                borderBottom: `1px solid ${settings.textColor}11`,
              }}
              onClick={() => onMenuSelect(i)}
            >
              <span
                style={{
                  color: menuIndex === i ? "#fff" : settings.textColor,
                  fontSize: 11,
                  fontWeight: menuIndex === i ? 600 : 400,
                }}
              >
                {item}
              </span>
              <span
                style={{
                  color: menuIndex === i ? "rgba(255,255,255,0.7)" : `${settings.textColor}44`,
                  fontSize: 10,
                }}
              >
                ▶
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function IpodNowPlayingView() {
  const { data: pb } = usePlaybackState();
  const playM = usePlayMutation();
  const pauseM = usePauseMutation();
  const nextM = useNextMutation();
  const prevM = usePreviousMutation();
  const seekM = useSeekMutation();

  const { screen, setScreen, menuIndex, setMenuIndex, colorIndex, setColorIndex } = useIpodPersistence();
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const settings = PRESET_COLORS[colorIndex]?.settings || PRESET_COLORS[0].settings;

  const track = pb?.item;
  const isPlaying = pb?.is_playing || false;
  const progress = pb ? (pb.progress_ms / (pb.item?.duration_ms || 1)) * 100 : 0;
  const elapsed = Math.floor((pb?.progress_ms || 0) / 1000);
  const duration = Math.floor((track?.duration_ms || 0) / 1000);
  const currentTime = pb?.progress_ms ? pb.progress_ms / 1000 : 0;

  const { data: queueData } = useQueue();
  const { data: audioFeatures } = useAudioFeatures(track?.id || "");
  const { data: topTracksData } = useTopTracks("medium_term", 50);
  const { data: topArtistsData } = useTopArtists("medium_term", 50);
  const { data: playlistsData } = useUserPlaylists();

  const queue = queueData?.queue?.slice(0, 12) || [];
  const topTracks = topTracksData?.items || [];
  const topArtists = topArtistsData?.items || [];
  const playlists = playlistsData?.items || [];

  const cachedLyrics = track ? lyricsStore.getLyrics(track.id) : null;
  const lyrics = cachedLyrics?.lines || [];
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!lyrics.length) return;
    const idx = getCurrentLineIndex(lyrics, currentTime);
    if (idx !== currentLineIndex) setCurrentLineIndex(idx);
  }, [currentTime, lyrics]);

  // ── Navigation ────────────────────────────────────────────────────────────
  const MENU_ITEMS = ["Music", "Lyrics", "Queue", "Extras", "Settings"];
  const MUSIC_ITEMS = ["Now Playing", "Artists", "Albums", "Songs", "Playlists"];
  const SETTINGS_ITEMS = ["Color Theme", "About", "Reset Settings"];
  const EXTRAS_ITEMS = ["Track Info", "Audio Analysis", "Sleep Timer"];
  const COLOR_ITEMS = PRESET_COLORS.map((p) => p.name);

  const itemsForScreen = (): string[] => {
    if (screen === "menu") return MENU_ITEMS;
    if (screen === "music") return MUSIC_ITEMS;
    if (screen === "settings") return SETTINGS_ITEMS;
    if (screen === "extras") return EXTRAS_ITEMS;
    if (screen === "colorpicker") return COLOR_ITEMS;
    if (screen === "artists") return topArtists.map(a => a.name);
    if (screen === "songs") return topTracks.map(t => t.name);
    if (screen === "playlists") return playlists.map(p => p.name);
    if (screen === "albums") {
      const albumNames = new Set();
      topTracks.forEach(t => { if (t.album?.name) albumNames.add(t.album.name); });
      return Array.from(albumNames) as string[];
    }
    return [];
  };

  const handleScrollUp = () => {
    const items = itemsForScreen();
    if (items.length === 0) return;
    setMenuIndex((menuIndex - 1 + items.length) % items.length);
  };

  const handleScrollDown = () => {
    const items = itemsForScreen();
    if (items.length === 0) return;
    setMenuIndex((menuIndex + 1) % items.length);
  };

  const handleMenu = () => {
    if (screen === "nowplaying") { setScreen("menu"); setMenuIndex(0); return; }
    if (screen === "menu") { setScreen("nowplaying"); return; }
    if (screen === "music") { setScreen("menu"); setMenuIndex(0); return; }
    if (screen === "settings") { setScreen("menu"); setMenuIndex(4); return; }
    if (screen === "extras") { setScreen("menu"); setMenuIndex(3); return; }
    if (screen === "colorpicker") { setScreen("settings"); setMenuIndex(0); return; }
    if (["artists", "albums", "songs", "playlists"].includes(screen)) { setScreen("music"); setMenuIndex(0); return; }
    if (screen === "lyrics" || screen === "queue") { setScreen("menu"); setMenuIndex(0); return; }
    setScreen("menu"); setMenuIndex(0);
  };

  const handleCenterClick = () => {
    if (screen === "nowplaying") { setScreen("menu"); setMenuIndex(0); return; }

    if (screen === "menu") {
      // Music / Lyrics / Queue / Extras / Settings
      if (menuIndex === 0) { setScreen("music"); setMenuIndex(0); }
      else if (menuIndex === 1) { setScreen("lyrics"); }
      else if (menuIndex === 2) { setScreen("queue"); }
      else if (menuIndex === 3) { setScreen("extras"); setMenuIndex(0); }
      else if (menuIndex === 4) { setScreen("settings"); setMenuIndex(0); }
      return;
    }

    if (screen === "music") {
      if (menuIndex === 0) setScreen("nowplaying");
      else if (menuIndex === 1) { setScreen("artists"); setMenuIndex(0); }
      else if (menuIndex === 2) { setScreen("albums"); setMenuIndex(0); }
      else if (menuIndex === 3) { setScreen("songs"); setMenuIndex(0); }
      else if (menuIndex === 4) { setScreen("playlists"); setMenuIndex(0); }
      return;
    }

    if (["artists", "songs", "playlists", "albums"].includes(screen)) {
      let selectedItem;
      if (screen === "artists") selectedItem = topArtists[menuIndex];
      else if (screen === "songs") selectedItem = topTracks[menuIndex];
      else if (screen === "playlists") selectedItem = playlists[menuIndex];
      else if (screen === "albums") {
        const albumMap = new Map();
        topTracks.forEach(t => { if (!albumMap.has(t.album.id)) albumMap.set(t.album.id, t.album); });
        selectedItem = Array.from(albumMap.values())[menuIndex];
      }
      
      if (selectedItem?.uri) {
        playM.mutate({ 
          contextUri: (screen === "playlists" || screen === "albums") ? selectedItem.uri : undefined,
          uris: (screen !== "playlists" && screen !== "albums") ? [selectedItem.uri] : undefined
        });
        setScreen("nowplaying");
      }
      return;
    }

    if (screen === "settings") {
      if (menuIndex === 0) { setScreen("colorpicker"); setMenuIndex(colorIndex); }
      if (menuIndex === 2) { setColorIndex(0); }
      return;
    }

    if (screen === "colorpicker") {
      setColorIndex(menuIndex);
      setScreen("settings");
      setMenuIndex(0);
      return;
    }
  };

  const handleMenuSelect = (idx: number) => {
    setMenuIndex(idx);
    // Auto-select on click
    setTimeout(() => handleCenterClick(), 0);
  };

  // We need handleCenterClick to use the latest menuIndex when called via handleMenuSelect
  // So we pass idx directly:
  const handleMenuSelectDirect = (idx: number) => {
    if (screen === "menu") {
      if (idx === 0) { setScreen("music"); setMenuIndex(0); }
      else if (idx === 1) { setScreen("lyrics"); }
      else if (idx === 2) { setScreen("queue"); }
      else if (idx === 3) { setScreen("extras"); setMenuIndex(0); }
      else if (idx === 4) { setScreen("settings"); setMenuIndex(0); }
      return;
    }
    if (screen === "music") {
      if (idx === 0) setScreen("nowplaying");
      else if (idx === 1) { setScreen("artists"); setMenuIndex(0); }
      else if (idx === 2) { setScreen("albums"); setMenuIndex(0); }
      else if (idx === 3) { setScreen("songs"); setMenuIndex(0); }
      else if (idx === 4) { setScreen("playlists"); setMenuIndex(0); }
      return;
    }
    if (["artists", "songs", "playlists", "albums"].includes(screen)) {
      let selectedItem;
      if (screen === "artists") selectedItem = topArtists[idx];
      else if (screen === "songs") selectedItem = topTracks[idx];
      else if (screen === "playlists") selectedItem = playlists[idx];
      else if (screen === "albums") {
        const albumMap = new Map();
        topTracks.forEach(t => { if (!albumMap.has(t.album.id)) albumMap.set(t.album.id, t.album); });
        selectedItem = Array.from(albumMap.values())[idx];
      }
      
      if (selectedItem?.uri) {
        playM.mutate({ 
          contextUri: (screen === "playlists" || screen === "albums") ? selectedItem.uri : undefined,
          uris: (screen !== "playlists" && screen !== "albums") ? [selectedItem.uri] : undefined
        });
        setScreen("nowplaying");
      }
      return;
    }
    if (screen === "settings") {
      if (idx === 0) { setScreen("colorpicker"); setMenuIndex(colorIndex); }
      if (idx === 2) { setColorIndex(0); }
      return;
    }
    if (screen === "colorpicker") {
      setColorIndex(idx);
      setScreen("settings");
      setMenuIndex(0);
      return;
    }
  };

  const handlePlayPause = () => {
    isPlaying ? pauseM.mutate() : playM.mutate({});
  };

  if (!track) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ width: 260, height: 420, fontFamily: "sans-serif", color: "#888" }}
      >
        <span className="text-2xl animate-pulse">🎵</span>
      </div>
    );
  }

  // ── iPod Body ─────────────────────────────────────────────────────────────
  const BODY_W = 240;
  const BODY_H = 420;
  const SCREEN_W = 190;
  const SCREEN_H = 200;

  return (
    <div
      className="relative select-none flex flex-col items-center"
      style={{
        width: isMobile ? "100%" : BODY_W * 1.5,
        height: isMobile ? "100%" : BODY_H * 1.2,
        borderRadius: isMobile ? 0 : 28,
        background: `linear-gradient(160deg, ${settings.bodyColor}ff 0%, ${settings.bodyColor}cc 100%)`,
        boxShadow: isMobile ? "none" : `
          0 30px 80px rgba(0,0,0,0.6),
          0 10px 30px rgba(0,0,0,0.4),
          inset 0 1px 0 rgba(255,255,255,0.35),
          inset 0 -1px 0 rgba(0,0,0,0.2)
        `,
        padding: isMobile ? "40px 20px" : "16px 12px",
        gap: isMobile ? 32 : 16,
        position: isMobile ? "fixed" : "relative",
        inset: isMobile ? 0 : "auto",
        zIndex: isMobile ? 100 : "auto",
      }}
    >
      {/* Top pill / speaker grille */}
      <div
        className="absolute"
        style={{
          top: 8,
          left: "50%",
          transform: "translateX(-50%)",
          width: 60,
          height: 5,
          borderRadius: 10,
          background: `rgba(0,0,0,0.15)`,
        }}
      />

      {/* Screen bezel */}
      <div
        className="relative overflow-hidden"
        style={{
          width: isMobile ? "90%" : SCREEN_W * 1.4,
          height: isMobile ? "40%" : SCREEN_H * 1.4,
          borderRadius: 10,
          background: "#000",
          boxShadow: `inset 0 2px 8px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.3)`,
          marginTop: isMobile ? 20 : 10,
        }}
      >
        {/* Screen glare */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%)",
            borderRadius: 10,
          }}
        />
        {/* Actual screen */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ background: settings.screenColor, borderRadius: 10 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={screen}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="absolute inset-0"
            >
              <IpodScreenContent
                screen={screen}
                track={track}
                isPlaying={isPlaying}
                progress={progress}
                elapsed={elapsed}
                duration={duration}
                settings={settings}
                menuIndex={menuIndex}
                lyrics={lyrics}
                currentLineIndex={currentLineIndex}
                queue={queue}
                audioFeatures={audioFeatures}
                topTracks={topTracks}
                topArtists={topArtists}
                playlists={playlists}
                onMenuSelect={handleMenuSelectDirect}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Click Wheel */}
      <ClickWheel
        onMenuClick={handleMenu}
        onPlayPause={handlePlayPause}
        onNext={() => nextM.mutate()}
        onPrev={() => prevM.mutate()}
        onScrollUp={handleScrollUp}
        onScrollDown={handleScrollDown}
        onCenterClick={handleCenterClick}
        settings={settings}
        scale={isMobile ? 1.4 : 1.2}
      />

    </div>
  );
}
