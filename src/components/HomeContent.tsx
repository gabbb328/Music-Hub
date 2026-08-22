import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Clock, Settings, Sparkle, ChevronLeft, ChevronRight } from "lucide-react";
import { Track } from "@/lib/mock-data";
import {
  useRecentlyPlayed,
  useTopTracks,
  useUserPlaylists,
  useUserProfile,
  usePlaybackState,
} from "@/hooks/useSpotify";
import { SpotifyTrack } from "@/types/spotify";
import { formatTime } from "@/lib/mock-data";
import { LIST_CONTAINER, LIST_ITEM, SPRING_ITEM } from "@/lib/animations";
import { groupRecentTracks } from "@/lib/spotify-utils";
import { useTheme } from "@/contexts/ThemeContext";
import { detectEasterEgg } from "@/hooks/useEasterEgg";

interface HomeContentProps {
  onPlayTrack: (track: Track) => void;
  onOpenSettings?: () => void;
  onOpenProfile?: () => void;
  onOpenAI?: () => void;
  onActivateEgg?: (egg: any) => void;
  onNavigateToSearch?: (query: string) => void;
}

const convertSpotifyTrack = (spotifyTrack: SpotifyTrack): Track => ({
  id: spotifyTrack.id,
  title: spotifyTrack.name,
  artist: spotifyTrack.artists[0]?.name || "Unknown Artist",
  album: spotifyTrack.album.name,
  cover: spotifyTrack.album.images[0]?.url || "",
  duration: Math.floor(spotifyTrack.duration_ms / 1000),
  bpm: undefined,
});

const SkeletonCard = () => (
  <Card>
    <CardContent className="p-3">
      <div className="aspect-square skeleton rounded-lg mb-2" />
      <div className="h-3 skeleton rounded w-3/4 mb-1" />
      <div className="h-2 skeleton rounded w-1/2" />
    </CardContent>
  </Card>
);

/* ---------------------------------------------------------------------- */
/* Gemini-style AI button: rainbow gradient border glow + scattering stars */
/* ---------------------------------------------------------------------- */

interface SparkleParticle {
  id: number;
  angle: number;
  distance: number;
  size: number;
  color: string;
  delay: number;
}

const STAR_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#FFD93D",
  "#A78BFA",
  "#60A5FA",
  "#F472B6",
  "#34D399",
  "#FB923C",
];

let sparkleIdCounter = 0;

const FourPointStar = ({ color, size }: { color: string; size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 0 3px ${color}90)` }}
  >
    <path
      d="M12 0C12 6.6 12 12 12 12C12 12 6.6 12 0 12C6.6 12 12 12 12 12C12 12 12 17.4 12 24C12 17.4 12 12 12 12C12 12 17.4 12 24 12C17.4 12 12 12 12 12C12 12 12 6.6 12 0Z"
      fill={color}
    />
  </svg>
);

const GeminiAIButton = ({ onOpenAI }: { onOpenAI?: () => void }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [sparkles, setSparkles] = useState<SparkleParticle[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);

    const newSparkles: SparkleParticle[] = Array.from({ length: 10 }, () => ({
      id: sparkleIdCounter++,
      angle: Math.random() * 360,
      distance: 28 + Math.random() * 34,
      size: 6 + Math.random() * 8,
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      delay: Math.random() * 0.25,
    }));

    setSparkles((prev) => [...prev, ...newSparkles]);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    // scompaiono dopo circa 1 secondo dalla loro comparsa
    timeoutRef.current = setTimeout(() => {
      setSparkles((prev) =>
        prev.filter((s) => !newSparkles.some((ns) => ns.id === s.id)),
      );
    }, 1000);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  return (
    <div
      id="lyra-ai-btn"
      className="relative w-12 h-12 flex items-center justify-center shrink-0"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Bordo animato arcobaleno stile Gemini */}
      <motion.div
        className="absolute inset-[-3px] rounded-full pointer-events-none"
        style={{
          background:
            "conic-gradient(from 0deg, #FF6B6B, #FFD93D, #34D399, #4ECDC4, #60A5FA, #A78BFA, #F472B6, #FF6B6B)",
          filter: "blur(3px)",
          opacity: isHovered ? 1 : 0,
        }}
        animate={
          isHovered ? { rotate: 360, opacity: 1 }: {rotate: 0,opacity: 0}
        }
        transition={{
          rotate: {
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          },
          opacity: {
            duration: 0.3,
          },
        }}
      />

      {/* Secondo bordo, più nitido, in controrotazione per effetto "fade" cangiante */}
      <motion.div
        className="absolute inset-[-1px] rounded-full pointer-events-none"
        style={{
          background:
            "conic-gradient(from 90deg, #A78BFA, #60A5FA, #4ECDC4, #34D399, #FFD93D, #FF6B6B, #F472B6, #A78BFA)",
          opacity: isHovered ? 0.9 : 0,
        }}
        animate={isHovered ? { rotate: 360 } : { rotate: 0 }}
        transition={{
          rotate: {
            duration: 4,
            repeat: Infinity,
            ease: "linear",
          },
          opacity: {
            duration: 0.3,
          },
        }}
      />

      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
          mass: 0.5,
        }}
        onClick={() => onOpenAI?.()}
        className="relative z-10 w-12 h-12 rounded-full border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground"
      >
        <Sparkle className="w-5 h-5" />
      </motion.button>

      {/* Stelline che si disperdono intorno al bottone */}
      <div className="absolute inset-0 pointer-events-none overflow-visible">
        <AnimatePresence>
          {sparkles.map((sparkle) => {
            const rad = (sparkle.angle * Math.PI) / 180;
            const targetX = Math.cos(rad) * sparkle.distance;
            const targetY = Math.sin(rad) * sparkle.distance;

            return (
              <motion.div
                key={sparkle.id}
                initial={{
                  x: 0,
                  y: 0,
                  opacity: 0,
                  scale: 0.3,
                  rotate: 0,
                }}
                animate={{
                  x: targetX,
                  y: targetY,
                  opacity: [0, 1, 1, 0],
                  scale: [0.3, 1, 1, 0.5],
                  rotate: 180,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  delay: sparkle.delay,
                  duration: 0.9,
                  ease: [0.16, 1, 0.3, 1],
                  opacity: {
                    delay: sparkle.delay,
                    duration: 0.9,
                    times: [0, 0.2, 0.7, 1],
                  },
                }}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  marginLeft: -sparkle.size / 2,
                  marginTop: -sparkle.size / 2,
                }}
              >
                <FourPointStar color={sparkle.color} size={sparkle.size} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------------- */
/* HomeContent                                                            */
/* ---------------------------------------------------------------------- */

function HomeContent({
  onPlayTrack,
  onOpenSettings,
  onOpenProfile,
  onOpenAI,
  onActivateEgg,
  onNavigateToSearch,
}: HomeContentProps) {
  const { data: recentlyPlayed, isLoading: loadingRecent } =
    useRecentlyPlayed(50);
  const { data: topTracks, isLoading: loadingTop } =
    useTopTracks("medium_term");
  const { data: userProfile } = useUserProfile();
  const { data: playlists, isLoading: loadingPlaylists } = useUserPlaylists();
  const { data: playbackState } = usePlaybackState();
  const { uiStyle } = useTheme();
  
  const userAvatar = (userProfile as any)?.images?.[0]?.url || null;
  const userInitial = ((userProfile as any)?.display_name || "U").charAt(0).toUpperCase();

  const isGlass = uiStyle === "glass";
  
  const textContainerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.03 } },
    exit: { opacity: 0, transition: { staggerChildren: 0.03, staggerDirection: 1, when: "afterChildren" } }
  };
  
  const textLetterVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -40, transition: { duration: 0.25, ease: "easeIn" } }
  };

  const recentScrollRef = useRef<HTMLDivElement>(null);
  const topTracksScrollRef = useRef<HTMLDivElement>(null);

  const scrollContainer = (ref: React.RefObject<HTMLDivElement>, direction: "left" | "right") => {
    if (ref.current) {
      const scrollAmount = ref.current.clientWidth * 0.8;
      ref.current.scrollBy({ left: direction === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
    }
  };

  const heroTrack = playbackState?.item || recentlyPlayed?.items?.[0]?.track;
  
  const currentDay = new Date().getDate();
  const mockChartData = Array.from({ length: 30 }).map((_, i) => {
    if (i + 1 > currentDay) return 0;
    return 20 + ((i * 17) % 60) + Math.random() * 20;
  });

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const detectedEgg = detectEasterEgg(searchQuery);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (detectedEgg) {
        onActivateEgg?.(detectedEgg);
        setSearchQuery("");
      } else if (searchQuery.trim().length >= 2) {
        onNavigateToSearch?.(searchQuery);
      }
    }
  };

  useEffect(() => {
    if (isGlass) {
      const timer = setTimeout(() => setShowSearch(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [isGlass]);

  const handlePlaySpotifyTrack = (spotifyTrack: SpotifyTrack) => {
    onPlayTrack(convertSpotifyTrack(spotifyTrack));
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 relative">
      {/* Header */}
      <motion.div
        className={`flex items-start justify-between pointer-events-none ${
          isGlass
            ? "sticky top-[-25px] z-[60] -mx-6 px-6 pt-4 pb-3 backdrop-blur-xl shadow-sm transition-all duration-300 ease-in-out"
            : "mb-8"
        }`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "tween", duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex-1 flex items-center min-w-0 pr-4 overflow-hidden h-[52px] pointer-events-auto">
          <AnimatePresence mode="wait">
            {!showSearch || !isGlass ? (
              <motion.div
                key="welcome"
                variants={textContainerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-1"
              >
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight flex whitespace-pre">
                  {"Welcome to Music Hub".split("").map((char, index) => (
                    <motion.span key={index}>{char}</motion.span>
                  ))}
                </h1>
              </motion.div>
            ) : (
              <motion.div
                key="search"
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full flex items-center"
              >
                <div className="relative w-full max-w-3xl">
                  <input
                    type="text"
                    placeholder="Cerca brani, artisti o podcast... (Premi Invio per cercare)"
                    className={`w-full bg-secondary/50 border border-border rounded-full px-5 py-3 text-sm focus:outline-none focus:border-primary transition-colors pl-11 shadow-sm ${
                      detectedEgg
                        ? "border-primary/60 ring-1 ring-primary/30 bg-primary/5"
                        : ""
                    }`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {detectedEgg ? (
                      <motion.div
                        animate={{ rotate: 360, scale: [1, 1.3, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      >
                        <Sparkle className="h-5 w-5 text-primary" />
                      </motion.div>
                    ) : (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                      </svg>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex gap-2 shrink-0 z-[70] items-start relative pointer-events-auto">
          <GeminiAIButton onOpenAI={onOpenAI} />
          {isGlass ? (
            <motion.button
              id="profile-btn"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => onOpenProfile?.()}
              className="w-12 h-12 rounded-full overflow-hidden hover:ring-2 hover:ring-primary/60 transition-all flex items-center justify-center shrink-0 bg-transparent border-none"
              title="Profilo"
            >
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt="profilo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-primary/40 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-foreground">
                    {userInitial}
                  </span>
                </div>
              )}
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
                mass: 0.5,
              }}
              onClick={() => onOpenSettings?.()}
              className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground flex bg-transparent"
            >
              <Settings className="w-5 h-5" />
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* HERO SECTION (Solo Glass) */}
      {isGlass && (
        <section className="mt-8 mb-12 flex items-center justify-between gap-6 overflow-hidden">
          {/* Brano in riproduzione */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 200,
              delay: 0.1,
            }}
            className="flex items-center gap-4 min-w-0 flex-1"
          >
            {heroTrack ? (
              <>
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-lg ring-1 ring-white/10">
                  <img
                    src={heroTrack.album?.images[0]?.url}
                    alt={heroTrack.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">
                    In ascolto
                  </p>
                  <h3 className="font-bold text-xl truncate leading-tight text-foreground">
                    {heroTrack.name}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {heroTrack.artists?.map((a: any) => a.name).join(", ")}
                  </p>
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                Nessun brano recente trovato.
              </div>
            )}
          </motion.div>
          {/* Grafico mensile mock */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 200,
              delay: 0.2,
            }}
            className="hidden sm:flex items-end gap-1.5 h-16 shrink-0"
          >
            {mockChartData.map((val, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${val}%` }}
                transition={{
                  type: "spring",
                  damping: 20,
                  stiffness: 100,
                  delay: 0.3 + i * 0.01,
                }}
                className="w-1.5 sm:w-2 rounded-t-sm bg-primary/40 hover:bg-primary transition-colors cursor-pointer"
                title={`Giorno ${i + 1}: ${val > 0 ? "Attivo" : "Futuro"}`}
              />
            ))}
          </motion.div>
        </section>
      )}

      {/* Recently Played */}
      <section className="space-y-4">
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "tween",
            duration: 0.28,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.05,
          }}
        >
          <h2 className="text-2xl font-semibold tracking-tight">
            Recently Played
          </h2>
          {isGlass && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => scrollContainer(recentScrollRef, "left")}
                className="p-1.5 rounded-full hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scrollContainer(recentScrollRef, "right")}
                className="p-1.5 rounded-full hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </motion.div>

        {loadingRecent ? (
          <div
            className={
              isGlass
                ? "flex gap-4 overflow-hidden"
                : "grid grid-cols-2 min-[400px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
            }
          >
            {[...Array(isGlass ? 8 : 12)].map((_, i) => (
              <div key={i} className={isGlass ? "w-36 shrink-0" : ""}>
                <SkeletonCard />
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            ref={recentScrollRef}
            className={
              isGlass
                ? "flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x"
                : "grid grid-cols-2 min-[400px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
            }
            variants={LIST_CONTAINER}
            initial="hidden"
            animate="visible"
          >
            {groupRecentTracks(recentlyPlayed?.items || [])
              .slice(0, 12)
              .map((item: any) => {
                const track = item.track;
                return (
                  <motion.div
                    key={track.id + item.played_at}
                    variants={LIST_ITEM}
                    transition={SPRING_ITEM}
                    className={isGlass ? "w-[140px] shrink-0 snap-start" : ""}
                  >
                    <Card
                      className="group cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => handlePlaySpotifyTrack(track)}
                    >
                      <CardContent className="p-3">
                        <div className="relative aspect-square mb-2 rounded-lg overflow-hidden bg-muted">
                          {track.album.images[0]?.url && (
                            <img
                              src={track.album.images[0].url}
                              alt={track.name}
                              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                            />
                          )}
                          {item.count > 1 && (
                            <div className="absolute bottom-1 right-1 bg-primary/90 text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg border border-primary-foreground/20 z-10 backdrop-blur-sm">
                              x{item.count}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                            <motion.div
                              initial={{ scale: 0.7, opacity: 0 }}
                              whileHover={{ scale: 1 }}
                              className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center"
                            >
                              <Play className="h-4 w-4 fill-current text-background" />
                            </motion.div>
                          </div>
                        </div>
                        <h3 className="font-semibold text-sm truncate">
                          {track.name}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {track.artists[0]?.name}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
          </motion.div>
        )}
      </section>

      {/* Top Tracks */}
      <section className="space-y-4">
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "tween",
            duration: 0.28,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.1,
          }}
        >
          <h2 className="text-2xl font-semibold tracking-tight">
            Your Top Tracks
          </h2>
          {isGlass && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => scrollContainer(topTracksScrollRef, "left")}
                className="p-1.5 rounded-full hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scrollContainer(topTracksScrollRef, "right")}
                className="p-1.5 rounded-full hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </motion.div>

        {loadingTop ? (
          <div className={isGlass ? "flex gap-4 overflow-hidden" : "space-y-2"}>
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={
                  isGlass
                    ? "w-36 shrink-0"
                    : "flex items-center gap-4 p-3 rounded-lg"
                }
              >
                {isGlass ? (
                  <SkeletonCard />
                ) : (
                  <>
                    <div className="w-12 h-12 skeleton rounded" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 skeleton rounded w-1/3" />
                      <div className="h-3 skeleton rounded w-1/4" />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (topTracks?.items ?? []).length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            <p>Nessun brano trovato.</p>
          </div>
        ) : (
          <motion.div
            ref={topTracksScrollRef}
            className={
              isGlass
                ? "flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x"
                : "space-y-1"
            }
            variants={LIST_CONTAINER}
            initial="hidden"
            animate="visible"
          >
            {(topTracks?.items ?? [])
              .slice(0, 10)
              .map((track: SpotifyTrack, index: number) => (
                <motion.div
                  key={track.id}
                  variants={LIST_ITEM}
                  transition={SPRING_ITEM}
                  className={isGlass ? "w-[150px] shrink-0 snap-start" : ""}
                >
                  {isGlass ? (
                    <Card
                      className="group cursor-pointer hover:bg-accent/50 transition-colors relative h-full flex flex-col"
                      onClick={() => handlePlaySpotifyTrack(track)}
                    >
                      <CardContent className="p-3 flex flex-col h-full">
                        <div className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full bg-background/80 backdrop-blur-md text-foreground flex items-center justify-center text-xs font-bold shadow-md">
                          {index + 1}
                        </div>
                        <div className="relative aspect-square mb-3 rounded-lg overflow-hidden bg-muted">
                          {track.album.images[0]?.url && (
                            <img
                              src={track.album.images[0].url}
                              alt={track.name}
                              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                            />
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                            <motion.div
                              initial={{ scale: 0.7, opacity: 0 }}
                              whileHover={{ scale: 1 }}
                              className="w-12 h-12 rounded-full bg-foreground flex items-center justify-center"
                            >
                              <Play className="h-5 w-5 fill-current text-background" />
                            </motion.div>
                          </div>
                        </div>
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            <h3 className="font-semibold text-sm truncate">
                              {track.name}
                            </h3>
                            <p className="text-xs text-muted-foreground truncate">
                              {track.artists.map((a: any) => a.name).join(", ")}
                            </p>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground self-end font-medium">
                            {formatTime(Math.floor(track.duration_ms / 1000))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <motion.div
                      className="flex items-center gap-4 p-3 rounded-lg cursor-pointer group"
                      onClick={() => handlePlaySpotifyTrack(track)}
                      whileHover={{
                        backgroundColor: "hsl(var(--accent) / 0.5)",
                      }}
                      whileTap={{ scale: 0.99 }}
                      transition={{
                        type: "tween",
                        duration: 0.15,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      <div className="w-4 text-center text-muted-foreground font-medium text-sm">
                        {index + 1}
                      </div>
                      <div className="relative w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                        {track.album.images[0]?.url && (
                          <img
                            src={track.album.images[0].url}
                            alt={track.name}
                            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{track.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {track.artists.map((a: any) => a.name).join(", ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {formatTime(Math.floor(track.duration_ms / 1000))}
                      </div>
                      <motion.div
                        className="opacity-0 group-hover:opacity-100"
                        transition={{ duration: 0.15 }}
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-accent">
                          <Play className="h-4 w-4 fill-current" />
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
          </motion.div>
        )}
      </section>

      {/* Playlists */}
      <section className="space-y-4">
        <motion.h2
          className="text-2xl font-semibold tracking-tight"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "tween",
            duration: 0.28,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.15,
          }}
        >
          Your Playlists
        </motion.h2>

        {loadingPlaylists ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4"
            variants={LIST_CONTAINER}
            initial="hidden"
            animate="visible"
          >
            {playlists?.items?.slice(0, 10).map((playlist: any) => (
              <motion.div
                key={playlist.id}
                variants={LIST_ITEM}
                transition={SPRING_ITEM}
              >
                <Card className="group cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="relative aspect-square mb-3 rounded-lg overflow-hidden bg-muted">
                      {playlist.images[0]?.url && (
                        <img
                          src={playlist.images[0].url}
                          alt={playlist.name}
                          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <motion.div
                          className="w-12 h-12 rounded-full bg-foreground flex items-center justify-center"
                          whileTap={{ scale: 0.92 }}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 28,
                          }}
                        >
                          <Play className="h-5 w-5 fill-current text-background" />
                        </motion.div>
                      </div>
                    </div>
                    <h3 className="font-semibold truncate">{playlist.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {playlist.tracks.total} songs
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>
    </div>
  );
};

export default HomeContent;
