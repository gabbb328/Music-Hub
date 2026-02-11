import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Clock } from "lucide-react";
import { Track } from "@/lib/mock-data";
import { useRecentlyPlayed, useTopTracks, useUserPlaylists } from "@/hooks/useSpotify";
import { SpotifyTrack } from "@/types/spotify";
import { formatTime } from "@/lib/mock-data";

interface HomeContentProps {
  onPlayTrack: (track: Track) => void;
}

// Converti SpotifyTrack in Track per compatibilità con i componenti esistenti
const convertSpotifyTrack = (spotifyTrack: SpotifyTrack): Track => ({
  id: spotifyTrack.id,
  title: spotifyTrack.name,
  artist: spotifyTrack.artists[0]?.name || "Unknown Artist",
  album: spotifyTrack.album.name,
  cover: spotifyTrack.album.images[0]?.url || "",
  duration: Math.floor(spotifyTrack.duration_ms / 1000),
  bpm: undefined,
});

const HomeContent = ({ onPlayTrack }: HomeContentProps) => {
  const { data: recentlyPlayed, isLoading: loadingRecent } = useRecentlyPlayed(6);
  const { data: topTracks, isLoading: loadingTop } = useTopTracks("medium_term");
  const { data: playlists, isLoading: loadingPlaylists } = useUserPlaylists();

  const handlePlaySpotifyTrack = (spotifyTrack: SpotifyTrack) => {
    const track = convertSpotifyTrack(spotifyTrack);
    onPlayTrack(track);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome back
        </h1>
        <p className="text-muted-foreground text-lg">
          Your personal music hub awaits
        </p>
      </div>

      {/* Recently Played */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Recently Played</h2>
        </div>
        
        {loadingRecent ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="aspect-square bg-muted rounded-lg mb-3" />
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {recentlyPlayed?.items?.slice(0, 6).map((item: any) => {
              const track = item.track;
              return (
                <Card 
                  key={track.id + item.played_at} 
                  className="group cursor-pointer transition-all hover:bg-accent/50"
                  onClick={() => handlePlaySpotifyTrack(track)}
                >
                  <CardContent className="p-4">
                    <div className="relative aspect-square mb-3 rounded-lg overflow-hidden bg-muted">
                      {track.album.images[0]?.url && (
                        <img
                          src={track.album.images[0].url}
                          alt={track.name}
                          className="object-cover w-full h-full"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button size="icon" className="rounded-full w-12 h-12">
                          <Play className="h-5 w-5 fill-current" />
                        </Button>
                      </div>
                    </div>
                    <h3 className="font-semibold truncate">{track.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {track.artists[0]?.name}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Your Top Tracks */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Your Top Tracks</h2>
        
        {loadingTop ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg animate-pulse">
                <div className="w-12 h-12 bg-muted rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {topTracks?.items?.slice(0, 5).map((track: SpotifyTrack, index: number) => (
              <div
                key={track.id}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors group cursor-pointer"
                onClick={() => handlePlaySpotifyTrack(track)}
              >
                <div className="w-4 text-center text-muted-foreground font-medium">
                  {index + 1}
                </div>
                <div className="relative w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                  {track.album.images[0]?.url && (
                    <img
                      src={track.album.images[0].url}
                      alt={track.name}
                      className="object-cover w-full h-full"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{track.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {track.artists.map(a => a.name).join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {formatTime(Math.floor(track.duration_ms / 1000))}
                </div>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Play className="h-4 w-4 fill-current" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Your Playlists */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Your Playlists</h2>
        
        {loadingPlaylists ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="aspect-square bg-muted rounded-lg mb-3" />
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {playlists?.items?.slice(0, 10).map((playlist: any) => (
              <Card 
                key={playlist.id} 
                className="group cursor-pointer transition-all hover:bg-accent/50"
              >
                <CardContent className="p-4">
                  <div className="relative aspect-square mb-3 rounded-lg overflow-hidden bg-muted">
                    {playlist.images[0]?.url && (
                      <img
                        src={playlist.images[0].url}
                        alt={playlist.name}
                        className="object-cover w-full h-full"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button size="icon" className="rounded-full w-12 h-12">
                        <Play className="h-5 w-5 fill-current" />
                      </Button>
                    </div>
                  </div>
                  <h3 className="font-semibold truncate">{playlist.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {playlist.tracks.total} songs
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomeContent;
