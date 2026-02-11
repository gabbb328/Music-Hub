import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Clock, Heart, Music2 } from "lucide-react";
import { Track } from "@/lib/mock-data";
import { useSavedTracks, useUserPlaylists, usePlayMutation } from "@/hooks/useSpotify";
import { SpotifyTrack } from "@/types/spotify";
import { formatTime } from "@/lib/mock-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LibraryContentProps {
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

const LibraryContent = ({ onPlayTrack }: LibraryContentProps) => {
  const { data: savedTracksData, isLoading: loadingSaved } = useSavedTracks(50);
  const { data: playlistsData, isLoading: loadingPlaylists } = useUserPlaylists();
  const playMutation = usePlayMutation();

  const savedTracks = savedTracksData?.items || [];
  const playlists = playlistsData?.items || [];

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

  const handlePlayPlaylist = (playlistUri: string) => {
    try {
      playMutation.mutate({
        contextUri: playlistUri
      });
    } catch (err) {
      console.error("Error playing playlist:", err);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Your Library</h1>
        <p className="text-muted-foreground text-lg">
          Your personal collection from Spotify
        </p>
      </div>

      <Tabs defaultValue="liked" className="w-full">
        <TabsList>
          <TabsTrigger value="liked">
            <Heart className="h-4 w-4 mr-2" />
            Liked Songs
          </TabsTrigger>
          <TabsTrigger value="playlists">
            <Music2 className="h-4 w-4 mr-2" />
            Playlists
          </TabsTrigger>
        </TabsList>

        {/* Liked Songs Tab */}
        <TabsContent value="liked" className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">
              Liked Songs
              {!loadingSaved && savedTracks.length > 0 && (
                <span className="ml-2 text-muted-foreground">({savedTracks.length})</span>
              )}
            </h2>
            {savedTracks.length > 0 && (
              <Button
                onClick={() => {
                  const track = savedTracks[0].track;
                  handlePlaySpotifyTrack(track);
                }}
                size="sm"
                className="gap-2"
              >
                <Play className="h-4 w-4 fill-current" />
                Play All
              </Button>
            )}
          </div>

          {loadingSaved ? (
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg animate-pulse">
                  <div className="w-12 h-12 bg-muted rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : savedTracks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Heart className="h-20 w-20 text-muted-foreground mb-4" />
              <h3 className="text-2xl font-semibold mb-2">No liked songs yet</h3>
              <p className="text-muted-foreground max-w-md">
                Songs you like on Spotify will appear here. Start adding some favorites!
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {savedTracks.map((item: any, index: number) => {
                const track = item.track;
                if (!track) return null;
                
                return (
                  <div
                    key={track.id + index}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors group cursor-pointer"
                    onClick={() => handlePlaySpotifyTrack(track)}
                  >
                    <div className="w-6 text-center text-muted-foreground text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="relative w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                      {track.album.images[0]?.url && (
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
                        {track.artists.map((a: any) => a.name).join(", ")}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground hidden md:block truncate max-w-[200px]">
                      {track.album.name}
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
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Playlists Tab */}
        <TabsContent value="playlists" className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">
              Your Playlists
              {!loadingPlaylists && playlists.length > 0 && (
                <span className="ml-2 text-muted-foreground">({playlists.length})</span>
              )}
            </h2>
          </div>

          {loadingPlaylists ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="aspect-square bg-muted rounded-lg mb-3" />
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : playlists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Music2 className="h-20 w-20 text-muted-foreground mb-4" />
              <h3 className="text-2xl font-semibold mb-2">No playlists yet</h3>
              <p className="text-muted-foreground max-w-md">
                Create playlists on Spotify and they will appear here
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {playlists.map((playlist: any) => (
                <Card 
                  key={playlist.id} 
                  className="group cursor-pointer transition-all hover:bg-accent/50"
                  onClick={() => handlePlayPlaylist(playlist.uri)}
                >
                  <CardContent className="p-4">
                    <div className="relative aspect-square mb-3 rounded-lg overflow-hidden bg-muted">
                      {playlist.images && playlist.images[0]?.url ? (
                        <img
                          src={playlist.images[0].url}
                          alt={playlist.name}
                          className="object-cover w-full h-full"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
                          <Music2 className="h-12 w-12 text-white" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button size="icon" className="rounded-full w-12 h-12">
                          <Play className="h-5 w-5 fill-current" />
                        </Button>
                      </div>
                    </div>
                    <h3 className="font-semibold truncate mb-1">{playlist.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {playlist.tracks.total} songs
                    </p>
                    {playlist.description && (
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {playlist.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LibraryContent;
