import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Clock, Settings } from "lucide-react";
import { Track } from "@/lib/mock-data";
import { useRecentlyPlayed, useTopTracks, useUserPlaylists } from "@/hooks/useSpotify";
import { SpotifyTrack } from "@/types/spotify";
import { formatTime } from "@/lib/mock-data";
import { LIST_CONTAINER, LIST_ITEM, SPRING_ITEM } from "@/lib/animations";

interface HomeContentProps {
  onPlayTrack: (track: Track) => void;
  onOpenSettings?: () => void;
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

// Skeleton shimmer card
const SkeletonCard = () => (
  <Card>
    <CardContent className="p-3">
      <div className="aspect-square skeleton rounded-lg mb-2" />
      <div className="h-3 skeleton rounded w-3/4 mb-1" />
      <div className="h-2 skeleton rounded w-1/2" />
    </CardContent>
  </Card>
);

const HomeContent = ({ onPlayTrack, onOpenSettings }: HomeContentProps) => {
  const { data: recentlyPlayed, isLoading: loadingRecent } = useRecentlyPlayed(12);
  const { data: topTracks, isLoading: loadingTop } = useTopTracks("medium_term");
  const { data: playlists, isLoading: loadingPlaylists } = useUserPlaylists();

  const handlePlaySpotifyTrack = (spotifyTrack: SpotifyTrack) => {
    onPlayTrack(convertSpotifyTrack(spotifyTrack));
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8">

      {/* Header */}
      <motion.div
        className="flex items-start justify-between"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "tween", duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight">Welcome to Music Hub</h1>
          <p className="text-muted-foreground text-lg">Your personal music experience</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.5 }}
          onClick={() => onOpenSettings?.()}
          className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hidden md:flex"
        >
          <Settings className="w-5 h-5" />
        </motion.button>
      </motion.div>

      {/* Recently Played */}
      <section className="space-y-4">
        <motion.h2
          className="text-2xl font-semibold tracking-tight"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "tween", duration: 0.28, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
        >
          Recently Played
        </motion.h2>

        {loadingRecent ? (
          <div className="grid grid-cols-2 min-[400px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[...Array(12)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-2 min-[400px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
            variants={LIST_CONTAINER}
            initial="hidden"
            animate="visible"
          >
            {recentlyPlayed?.items?.slice(0, 12).map((item: any) => {
              const track = item.track;
              return (
                <motion.div
                  key={track.id + item.played_at}
                  variants={LIST_ITEM}
                  transition={SPRING_ITEM}
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
                      <h3 className="font-semibold text-sm truncate">{track.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">{track.artists[0]?.name}</p>
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
        <motion.h2
          className="text-2xl font-semibold tracking-tight"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "tween", duration: 0.28, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        >
          Your Top Tracks
        </motion.h2>

        {loadingTop ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg">
                <div className="w-12 h-12 skeleton rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 skeleton rounded w-1/3" />
                  <div className="h-3 skeleton rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            className="space-y-1"
            variants={LIST_CONTAINER}
            initial="hidden"
            animate="visible"
          >
            {topTracks?.items?.slice(0, 5).map((track: SpotifyTrack, index: number) => (
              <motion.div
                key={track.id}
                variants={LIST_ITEM}
                transition={SPRING_ITEM}
              >
                <motion.div
                  className="flex items-center gap-4 p-3 rounded-lg cursor-pointer group"
                  onClick={() => handlePlaySpotifyTrack(track)}
                  whileHover={{ backgroundColor: "hsl(var(--accent) / 0.5)" }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ type: "tween", duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="w-4 text-center text-muted-foreground font-medium text-sm">{index + 1}</div>
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
                    <p className="text-sm text-muted-foreground truncate">{track.artists.map(a => a.name).join(", ")}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {formatTime(Math.floor(track.duration_ms / 1000))}
                  </div>
                  <motion.div
                    className="opacity-0 group-hover:opacity-100"
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-accent">
                      <Play className="h-4 w-4 fill-current" />
                    </div>
                  </motion.div>
                </motion.div>
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
          transition={{ type: "tween", duration: 0.28, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        >
          Your Playlists
        </motion.h2>

        {loadingPlaylists ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
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
                          transition={{ type: "spring", stiffness: 500, damping: 28 }}
                        >
                          <Play className="h-5 w-5 fill-current text-background" />
                        </motion.div>
                      </div>
                    </div>
                    <h3 className="font-semibold truncate">{playlist.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{playlist.tracks.total} songs</p>
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
