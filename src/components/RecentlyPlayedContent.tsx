import { Clock, Play, ListPlus, Loader2, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRecentlyPlayed, usePlayMutation, useAddToQueueMutation } from "@/hooks/useSpotify";
import { useToast } from "@/hooks/use-toast";
import { formatTime } from "@/lib/mock-data";
import { motion } from "framer-motion";

export default function RecentlyPlayedContent() {
  const { data: recentData, isLoading } = useRecentlyPlayed(50);
  const playMutation = usePlayMutation();
  const addToQueueMutation = useAddToQueueMutation();
  const { toast } = useToast();

  const items = recentData?.items || [];

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

  const formatPlayedAt = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3">
            <Clock className="w-8 h-8 md:w-10 md:h-10 text-primary" />
            Ascoltati di recente
          </h1>
          <p className="text-muted-foreground">
            {items.length} {items.length === 1 ? 'brano' : 'brani'} riprodotti di recente
          </p>
        </div>

        {/* Tracks List */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 animate-pulse">
                <div className="w-12 h-12 bg-muted rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
                <div className="h-3 bg-muted rounded w-16" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Clock className="w-20 h-20 text-muted-foreground/30 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No recent tracks</h2>
            <p className="text-muted-foreground">
              Start listening to see your recent tracks here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item: any, index: number) => {
              const track = item.track;
              if (!track) return null;

              return (
                <div
                  key={`${track.id}-${index}`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors group"
                >
                  <div 
                    className="flex-1 flex items-center gap-4 cursor-pointer"
                    onClick={() => handlePlayTrack(track.uri, track.name)}
                  >
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
                    <span className="text-sm text-muted-foreground hidden lg:block">
                      {formatPlayedAt(item.played_at)}
                    </span>
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
                      onClick={(e) => handleAddToQueue(track.uri, track.name, e)}
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
