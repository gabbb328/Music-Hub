import { useState } from "react";
import { Heart, Play, ListPlus, Loader2, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useSavedTracks,
  usePlayMutation,
  useAddToQueueMutation,
} from "@/hooks/useSpotify";
import { useToast } from "@/hooks/use-toast";
import { formatTime } from "@/lib/mock-data";
import { motion } from "framer-motion";

export default function LikedSongsContent() {
  const { data: savedTracksData, isLoading } = useSavedTracks();
  const playMutation = usePlayMutation();
  const addToQueueMutation = useAddToQueueMutation();
  const { toast } = useToast();

  const tracks = savedTracksData?.items || [];

  const handlePlayTrack = async (uri: string, trackName: string) => {
    try {
      toast({
        title: "Playing...",
        description: trackName,
      });

      await playMutation.mutateAsync({ uris: [uri] });

      toast({
        title: "Now Playing",
        description: trackName,
      });
    } catch (error) {
      console.error("Play error:", error);
      toast({
        title: "Playback Error",
        description: "Make sure you have an active device",
        variant: "destructive",
      });
    }
  };

  const handlePlayAll = async () => {
    if (tracks.length === 0) return;

    try {
      toast({
        title: "Playing Liked Songs...",
        description: `${tracks.length} tracks`,
      });

      const uris = tracks.slice(0, 100).map((item: any) => item.track.uri);
      await playMutation.mutateAsync({ uris });

      toast({
        title: "Now Playing",
        description: "Your liked songs",
      });
    } catch (error) {
      console.error("Play all error:", error);
      toast({
        title: "Playback Error",
        description: "Make sure you have an active device",
        variant: "destructive",
      });
    }
  };

  const handleAddToQueue = async (
    uri: string,
    trackName: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();

    try {
      await addToQueueMutation.mutateAsync(uri);
      toast({
        title: "✓ Added to queue",
        description: trackName,
      });
    } catch (error) {
      console.error("Add to queue error:", error);
      toast({
        title: "Failed to add to queue",
        description: "Make sure you have an active device",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3">
              <Heart className="w-8 h-8 md:w-10 md:h-10 text-primary fill-primary" />
              Brani che ti piacciono
            </h1>
            <p className="text-muted-foreground">
              {tracks.length} {tracks.length === 1 ? "brano" : "brani"}
            </p>
          </div>

          {tracks.length > 0 && (
            <Button
              size="lg"
              onClick={handlePlayAll}
              disabled={playMutation.isPending}
              className="rounded-full"
            >
              {playMutation.isPending ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Play className="w-5 h-5 mr-2 fill-current" />
              )}
              Play All
            </Button>
          )}
        </div>

        {/* Tracks List */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-3 animate-pulse"
              >
                <div className="w-8 text-center">
                  <div className="h-4 bg-muted rounded w-4 mx-auto" />
                </div>
                <div className="w-12 h-12 bg-muted rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
                <div className="h-3 bg-muted rounded w-12" />
              </div>
            ))}
          </div>
        ) : tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Heart className="w-20 h-20 text-muted-foreground/30 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No liked songs yet</h2>
            <p className="text-muted-foreground">
              Start liking songs to build your collection
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {tracks.map((item: any, index: number) => {
              const track = item.track;
              if (!track) return null;

              return (
                <div
                  key={track.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors group"
                >
                  <div
                    className="flex-1 flex items-center gap-4 cursor-pointer"
                    onClick={() => handlePlayTrack(track.uri, track.name)}
                  >
                    <div className="w-8 text-center text-sm text-muted-foreground font-medium">
                      {index + 1}
                    </div>
                    <div className="relative w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                      {track.album?.images?.[0]?.url && (
                        <img
                          src={track.album.images[0].url}
                          alt={track.name}
                          className="object-cover w-full h-full"
                          loading="lazy"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{track.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {track.artists?.map((a: any) => a.name).join(", ")}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground truncate hidden md:block max-w-xs">
                      {track.album?.name}
                    </p>
                    <span className="text-sm text-muted-foreground hidden sm:block">
                      {formatTime(Math.floor(track.duration_ms / 1000))}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handlePlayTrack(track.uri, track.name)}
                      disabled={playMutation.isPending}
                    >
                      <Play className="h-4 w-4 fill-current" />
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) =>
                        handleAddToQueue(track.uri, track.name, e)
                      }
                      disabled={addToQueueMutation.isPending}
                    >
                      <ListPlus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
