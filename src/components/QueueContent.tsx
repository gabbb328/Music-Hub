import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, X, Music } from "lucide-react";
import { Track, formatTime } from "@/lib/mock-data";
import { useQueue, usePlayMutation } from "@/hooks/useSpotify";
import { SpotifyTrack } from "@/types/spotify";

interface QueueContentProps {
  queue: Track[];
  currentTrack: Track | null;
  onPlayTrack: (track: Track) => void;
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

const QueueContent = ({ queue: localQueue, currentTrack: localCurrentTrack, onPlayTrack }: QueueContentProps) => {
  const { data: queueData, isLoading } = useQueue();
  const playMutation = usePlayMutation();

  const currentTrack = queueData?.currently_playing || localCurrentTrack;
  const upcomingQueue = queueData?.queue || localQueue;

  const handlePlaySpotifyTrack = (spotifyTrack: SpotifyTrack) => {
    try {
      playMutation.mutate({
        uris: [spotifyTrack.uri]
      });
      const track = convertSpotifyTrack(spotifyTrack);
      onPlayTrack(track);
    } catch (err) {
      console.error("Error playing track:", err);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Queue</h1>
        <p className="text-muted-foreground">
          Your upcoming tracks
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-32" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-muted rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-1/3" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {/* Now Playing */}
          {currentTrack && (
            <Card>
              <CardHeader>
                <CardTitle>Now Playing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {(currentTrack.album?.images?.[0]?.url || currentTrack.cover) && (
                      <img
                        src={currentTrack.album?.images?.[0]?.url || currentTrack.cover}
                        alt={currentTrack.name || currentTrack.title}
                        className="object-cover w-full h-full"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">
                      {currentTrack.name || currentTrack.title}
                    </h3>
                    <p className="text-muted-foreground truncate">
                      {currentTrack.artists?.[0]?.name || currentTrack.artist}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {currentTrack.album?.name || currentTrack.album}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {formatTime(Math.floor((currentTrack.duration_ms || currentTrack.duration * 1000) / 1000))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next in Queue */}
          <Card>
            <CardHeader>
              <CardTitle>Next in Queue ({upcomingQueue.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingQueue.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Music className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Queue is empty</h3>
                  <p className="text-sm text-muted-foreground">
                    Add songs to your queue to see them here
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingQueue.map((track: any, index: number) => {
                    const isSpotifyTrack = 'uri' in track;
                    const trackData = isSpotifyTrack ? track : null;
                    
                    return (
                      <div
                        key={track.id + index}
                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors group"
                      >
                        <div className="w-8 text-center text-sm text-muted-foreground font-medium">
                          {index + 1}
                        </div>
                        <div className="relative w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                          {(track.album?.images?.[0]?.url || track.cover) && (
                            <img
                              src={track.album?.images?.[0]?.url || track.cover}
                              alt={track.name || track.title}
                              className="object-cover w-full h-full"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">
                            {track.name || track.title}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {track.artists?.[0]?.name || track.artist}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {formatTime(Math.floor((track.duration_ms || track.duration * 1000) / 1000))}
                          </span>
                          {isSpotifyTrack && (
                            <Button 
                              size="icon" 
                              variant="ghost"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handlePlaySpotifyTrack(trackData)}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default QueueContent;
