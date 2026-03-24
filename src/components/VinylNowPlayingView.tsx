import { useState, useEffect, useRef } from "react";
import { motion, PanInfo } from "framer-motion";
import { Music2 } from "lucide-react";
import {
  usePlaybackState,
  usePlayMutation,
  usePauseMutation,
  useNextMutation,
  usePreviousMutation,
} from "@/hooks/useSpotify";
import { extractColorsFromImage } from "@/services/color-extractor";

// ── Vinile SVG ──
function VinylDisc({
  size,
  rotation,
  colors,
  trackName,
  artistName,
  onClick,
}: {
  size: number;
  rotation: number;
  colors: { primary: string; secondary: string };
  trackName: string;
  artistName: string;
  onClick: () => void;
}) {
  const cx = size / 2;
  const labelR = size * 0.17;

  return (
    <motion.div
      className="rounded-full shadow-[0_20px_60px_rgba(0,0,0,0.8)] cursor-pointer"
      style={{ width: size, height: size }}
      animate={{ rotate: rotation }}
      transition={{ duration: 0, ease: "linear" }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="rounded-full"
      >
        {/* Base nera */}
        <circle cx={cx} cy={cx} r={cx} fill="#050505" />

        {/* Grooves (solchi) */}
        {Array.from({ length: 50 }, (_, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cx}
            r={cx * (0.98 - i * (0.6 / 50))}
            fill="none"
            stroke="rgba(255,255,255,0.03)"
            strokeWidth={0.5}
          />
        ))}

        {/* Riflesso luce realistico */}
        <defs>
          <linearGradient
            id="shine-vinyl-v2"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="rgba(255,255,255,0.07)" />
            <stop offset="50%" stopColor="transparent" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.07)" />
          </linearGradient>
        </defs>
        <circle cx={cx} cy={cx} r={cx} fill="url(#shine-vinyl-v2)" />

        {/* Label centrale (Etichetta) */}
        <circle cx={cx} cy={cx} r={labelR} fill={colors.secondary} />

        {/* Testo etichetta */}
        <g transform={`translate(${cx}, ${cx})`}>
          <text
            y={-labelR * 0.1}
            textAnchor="middle"
            fill="rgba(0,0,0,0.8)"
            fontSize={labelR * 0.22}
            fontWeight="900"
            fontFamily="Inter, system-ui"
            style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}
          >
            {trackName.length > 15 ? trackName.slice(0, 14) + "…" : trackName}
          </text>
          <text
            y={labelR * 0.25}
            textAnchor="middle"
            fill="rgba(0,0,0,0.5)"
            fontSize={labelR * 0.15}
            fontWeight="600"
            fontFamily="Inter, system-ui"
          >
            {artistName.length > 20
              ? artistName.slice(0, 18) + "…"
              : artistName}
          </text>
        </g>

        {/* Foro centrale */}
        <circle cx={cx} cy={cx} r={size * 0.012} fill="#000" />
      </svg>
    </motion.div>
  );
}

// ── Sleeve (Custodia) ──
function Sleeve({
  size,
  coverUrl,
  title,
  onClick,
}: {
  size: number;
  coverUrl: string;
  title: string;
  onClick: () => void;
}) {
  return (
    <motion.div
      className="relative shadow-[0_40px_80px_rgba(0,0,0,0.6)] overflow-hidden cursor-pointer"
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        backgroundColor: "#0a0a0a",
      }}
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
    >
      <img
        src={coverUrl}
        alt={title}
        className="w-full h-full object-cover opacity-80"
      />
      <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-black/20" />

      <div className="absolute bottom-6 w-full text-center">
        <p className="text-white/20 text-[8px] tracking-[0.4em] font-black uppercase">
          Harmony Hub
        </p>
      </div>
    </motion.div>
  );
}

// ── Tonearm (Puntina) ──
function Tonearm({ isPlaying, size }: { isPlaying: boolean; size: number }) {
  // Angolo di puntata: ~22 gradi quando in play, -10 quando fermo (parcheggio)
  const angle = isPlaying ? 22 : -10;

  return (
    <motion.div
      className="absolute z-[40] pointer-events-none"
      style={{
        top: "10%",
        right: "-10%",
        transformOrigin: "85% 15%",
      }}
      animate={{ rotate: angle }}
      transition={{ type: "spring", stiffness: 40, damping: 15 }}
    >
      <svg
        width={size * 0.5}
        height={size * 0.9}
        viewBox="0 0 100 200"
        style={{ overflow: "visible" }}
      >
        {/* Base del braccio */}
        <circle cx="85" cy="15" r="20" fill="#111" />
        <circle cx="85" cy="15" r="14" fill="#222" />
        <circle cx="85" cy="15" r="6" fill="#444" />

        {/* Il braccio (astina argentata) */}
        <rect x="82" y="15" width="6" height="160" fill="#ccc" rx="3" />
        <rect
          x="83.5"
          y="15"
          width="2"
          height="160"
          fill="rgba(255,255,255,0.3)"
          rx="1"
        />

        {/* Headshell (testina) */}
        <g transform="translate(68, 172) rotate(-15)">
          <rect x="0" y="0" width="30" height="40" rx="4" fill="#000" />
          <rect x="4" y="8" width="22" height="6" rx="2" fill="#1a1a1a" />
          {/* Pick-up */}
          <rect x="12" y="38" width="6" height="8" fill="#888" />
        </g>
      </svg>
    </motion.div>
  );
}

export default function VinylNowPlayingView() {
  const { data: pb } = usePlaybackState();
  const playM = usePlayMutation();
  const pauseM = usePauseMutation();
  const nextM = useNextMutation();
  const prevM = usePreviousMutation();

  const [rotation, setRotation] = useState(0);
  const [colors, setColors] = useState({
    primary: "#1DB954",
    secondary: "#1DB954",
  });
  const [isMobile, setIsMobile] = useState(false);
  const animRef = useRef<number>(0);
  const lastTRef = useRef<number>(0);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const track = pb?.item;
  const isPlaying = pb?.is_playing || false;
  const coverUrl = track?.album?.images?.[0]?.url || "";

  useEffect(() => {
    if (!coverUrl) return;
    extractColorsFromImage(coverUrl)
      .then((p) => {
        setColors({ primary: p.primary, secondary: p.primary });
      })
      .catch(() => {});
  }, [coverUrl]);

  useEffect(() => {
    if (!isPlaying) {
      cancelAnimationFrame(animRef.current);
      lastTRef.current = 0;
      return;
    }
    const step = (t: number) => {
      if (lastTRef.current) {
        const dt = (t - lastTRef.current) / 1000;
        setRotation((r) => (r + dt * 33 * 6) % 360);
      }
      lastTRef.current = t;
      animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animRef.current);
  }, [isPlaying]);

  if (!track)
    return (
      <div className="flex-1 flex items-center justify-center bg-black">
        <Music2 className="w-16 h-16 text-zinc-900 animate-pulse" />
      </div>
    );

  const togglePlay = () => (isPlaying ? pauseM.mutate() : playM.mutate({}));

  const handleSwipe = (_: any, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 80) {
      if (info.offset.x > 0) prevM.mutate();
      else nextM.mutate();
    }
  };

  const SLEEVE_SIZE = isMobile ? 320 : 440;
  const VINYL_SIZE = isMobile ? 300 : 420;

  return (
    <motion.div
      className="absolute inset-0 z-0 overflow-hidden flex items-center justify-center bg-black"
    >
      {/* Background (Static) */}
      <motion.div
        key={coverUrl}
        initial={{ opacity: 0, scale: 1.25 }}
        animate={{ opacity: 1, scale: 1.25 }}
        className="absolute -inset-20 bg-cover bg-center"
        style={{
          backgroundImage: `url(${coverUrl})`,
          filter: "blur(60px) brightness(0.25) saturate(0.8)",
        }}
        transition={{ duration: 1.8 }}
      />

      {/* Swipeable Assembly (Sleeve + Vinyl + Tonearm) */}
      <motion.div
        className="relative flex items-center justify-center w-full h-full cursor-grab active:cursor-grabbing"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleSwipe}
      >
        {/* Tilted Box (Sleeve + Vinyl) */}
        <motion.div
          className="relative flex items-center z-20"
          animate={{
            x: isMobile ? -80 : (isPlaying ? -60 : 0), // Shifted more on mobile to show vinyl
            rotate: -5,
            scale: isMobile ? 0.9 : 1
          }}
          transition={{ type: "spring", stiffness: 60, damping: 18 }}
        >
          {/* Sleeve */}
          <div className="z-20">
            <Sleeve
              size={SLEEVE_SIZE}
              coverUrl={coverUrl}
              title={track.name}
              onClick={togglePlay}
            />
          </div>

          {/* Vinyl Disc */}
          <motion.div
            className="absolute z-10"
            animate={{
              x: isMobile ? SLEEVE_SIZE * 0.45 : (isPlaying ? SLEEVE_SIZE * 0.52 : SLEEVE_SIZE * 0.08),
              opacity: 1,
            }}
            initial={false}
            style={{ left: 0 }}
            transition={{ type: "spring", stiffness: 70, damping: 20 }}
          >
            <VinylDisc
              size={VINYL_SIZE}
              rotation={rotation}
              colors={colors}
              trackName={track.name}
              artistName={track.artists[0]?.name || ""}
              onClick={togglePlay}
            />
          </motion.div>
        </motion.div>

        {/* Tonearm (Hidden on Mobile) */}
        {!isMobile && (
          <div 
            className="absolute z-[40] pointer-events-none"
            style={{ 
              top: "50%", 
              left: "50%", 
              transform: "translate(480px, -300px)" 
            }}
          >
            <Tonearm isPlaying={isPlaying} size={SLEEVE_SIZE} />
          </div>
        )}
      </motion.div>

      {/* Track Info */}
      <div className="absolute bottom-16 w-full text-center z-50 pointer-events-none px-10">
        <motion.div
          key={track.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-black text-white tracking-tighter mb-1 drop-shadow-2xl">
            {track.name}
          </h2>
          <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-[11px]">
            {track.artists[0]?.name}
          </p>
        </motion.div>
      </div>

      <div className="absolute bottom-6 w-full text-center pointer-events-none opacity-20">
        <span className="text-white text-[10px] uppercase tracking-[0.6em] font-black italic">
          Swipe to switch track
        </span>
      </div>
    </motion.div>
  );
}
