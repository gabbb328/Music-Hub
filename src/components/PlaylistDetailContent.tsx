import { useState } from "react";
import { motion } from "framer-motion";
import { Play, ListPlus, Loader2, Music, ArrowLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlaylist, usePlayMutation, useAddToQueueMutation } from "@/hooks/useSpotify";
import { useToast } from "@/hooks/use-toast";
import { formatTime } from "@/lib/mock-data";

interface PlaylistDetailContentProps {
  playlistId: string;
  onBack: () => void;
}

export default function PlaylistDetailContent({ playlistId, onBack }: PlaylistDetailContentProps) {
  const { data: playlist, isLoading } = usePlaylist(playlistId);
  const playMutation = usePlayMutation();
  const addToQueueMutation = useAddToQueueMutation();
  const { toast } = useToast();

  const handlePlayPlaylist = async () => {
    if (!playlist?.uri) return;

    try {
      toast({
        title: "Playing Playlist...",
        description: playlist.name,
      });

      await playMutation.mutateAsync({ context_uri: playlist.uri });

      toast({
        title: "Now Playing",
        description: playlist.name,
      });
    } catch (error) {
      console.error("Play playlist error:", error);
      toast({
        title: "Playback Error",
        description: "Make sure you have an active device",
        variant: "destructive",
      });
    }
  };

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
      console.error("Play track error:", error);
      toast({
        title: "Playback Error",
        description: "Make sure you have an active device",
        variant: "destructive",
      });
    }
  };

  const handleAddToQueue = async (uri: string, trackName: string, e: React.MouseEvent) => {
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

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center gap-4 animate-pulse">
            <div className="w-48 h-48 bg-muted rounded-lg" />
            <div className="flex-1 space-y-3">
              <div className="h-8 bg-muted rounded w-1/3" />
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="h-4 bg-muted rounded w-1/5" />
            </div>
          </div>
          {/* Tracks Skeleton */}
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 animate-pulse">
              <div className="w-12 h-12 bg-muted rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-3 bg-muted rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Music className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Playlist not found</p>
          <Button onClick={onBack} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const tracks = playlist.tracks?.items || [];
  const totalDuration = tracks.reduce((acc: number, item: any) => {
    return acc + (item.track?.duration_ms || 0);
  }, 0);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Playlist Header */}
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="relative w-full md:w-48 aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-purple-600 to-blue-600 flex-shrink-0">
            {playlist.images && playlist.images[0]?.url ? (
              <img
                src={playlist.images[0].url}
                alt={playlist.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music className="w-20 h-20 text-white/50" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">PLAYLIST</p>
              <h1 className="text-3xl md:text-5xl font-bold mb-4">{playlist.name}</h1>
              {playlist.description && (
                <p className="text-muted-foreground mb-4" dangerouslySetInnerHTML={{ __html: playlist.description }} />
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{playlist.owner?.display_name}</span>
                <span>•</span>
                <span>{tracks.length} {tracks.length === 1 ? 'song' : 'songs'}</span>
                {totalDuration > 0 && (
                  <>
                    <span>•</span>
                    <span>{Math.floor(totalDuration / 1000 / 60)} min</span>
                  </>
                )}
              </div>
            </div>

            <Button
              size="lg"
              onClick={handlePlayPlaylist}
              disabled={playMutation.isPending || tracks.length === 0}
              className="rounded-full"
            >
              {playMutation.isPending ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Play className="w-5 h-5 mr-2 fill-current" />
              )}
              Play Playlist
            </Button>
          </div>
        </div>

        {/* Tracks List */}
        {tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Music className="w-20 h-20 text-muted-foreground/30 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No tracks</h2>
            <p className="text-muted-foreground">This playlist is empty</p>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Header */}
            <div className="grid grid-cols-[auto_1fr_auto_auto] md:grid-cols-[auto_1fr_1fr_auto_auto] gap-4 px-4 py-2 text-sm text-muted-foreground border-b border-border">
              <div className="w-8 text-center">#</div>
              <div>TITLE</div>
              <div className="hidden md:block">ALBUM</div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
              </div>
              <div className="w-12"></div>
            </div>

            {/* Tracks */}
            {tracks.map((item: any, index: number) => {
              const track = item.track;
              if (!track) return null;

              return (
                <div
                  key={track.id + index}
                  className="grid grid-cols-[auto_1fr_auto_auto] md:grid-cols-[auto_1fr_1fr_auto_auto] gap-4 items-center px-4 py-3 rounded-lg hover:bg-accent/50 transition-colors group"
                >
                  <div className="w-8 text-center text-sm text-muted-foreground font-medium">
                    {index + 1}
                  </div>
                  
                  <div
                    className="flex items-center gap-3 cursor-pointer min-w-0"
                    onClick={() => handlePlayTrack(track.uri, track.name)}
                  >
                    <div className="relative w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                      {track.album?.images?.[0]?.url && (
                        <img
                          src={track.album.images[0].url}
                          alt={track.name}
                          className="object-cover w-full h-full"
                          loading="lazy"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium truncate">{track.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {track.artists?.map((a: any) => a.name).join(", ")}
                      </p>
                    </div>
                  </div>

                  <div className="hidden md:block min-w-0">
                    <p className="text-sm text-muted-foreground truncate">
                      {track.album?.name}
                    </p>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {formatTime(Math.floor(track.duration_ms / 1000))}
                  </div>

                  <div className="flex items-center gap-1 w-12 justify-end">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8"
                      onClick={() => handlePlayTrack(track.uri, track.name)}
                      disabled={playMutation.isPending}
                    >
                      <Play className="h-3 w-3 fill-current" />
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8"
                      onClick={(e) => handleAddToQueue(track.uri, track.name, e)}
                      disabled={addToQueueMutation.isPending}
                    >
                      <ListPlus className="h-3 w-3" />
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
