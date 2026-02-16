import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Play, Music, User, AlertCircle, Loader2, MoreVertical, ListPlus } from "lucide-react";
import { Track } from "@/lib/mock-data";
import { useSearch, usePlayMutation, useAddToQueueMutation } from "@/hooks/useSpotify";
import { SpotifyTrack } from "@/types/spotify";
import { formatTime } from "@/lib/mock-data";
import { useDebounce } from "@/hooks/use-mobile";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface SearchContentProps {
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

const SearchContent = ({ onPlayTrack }: SearchContentProps) => {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);
  const playMutation = usePlayMutation();
  const addToQueueMutation = useAddToQueueMutation();
  const { toast } = useToast();

  const {
    data: searchResults,
    isLoading,
    error,
    isFetching,
  } = useSearch(debouncedQuery, ["track", "artist", "album", "playlist"], 20);

  const handlePlaySpotifyTrack = async (spotifyTrack: SpotifyTrack) => {
    try {
      toast({
        title: "Playing...",
        description: `${spotifyTrack.name} by ${spotifyTrack.artists[0]?.name}`,
      });

      await playMutation.mutateAsync({
        uris: [spotifyTrack.uri],
      });

      const track = convertSpotifyTrack(spotifyTrack);
      onPlayTrack(track);

      toast({
        title: "Now Playing",
        description: `${spotifyTrack.name}`,
      });
    } catch (err: any) {
      console.error("Error playing track:", err);

      let errorMessage = "Could not play track";
      if (err.message?.includes("Premium")) {
        errorMessage = "Spotify Premium required to play music";
      } else if (err.message?.includes("device")) {
        errorMessage = "No active device found. Open Spotify on a device first.";
      }

      toast({
        title: "Playback Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleAddToQueue = async (spotifyTrack: SpotifyTrack, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      toast({
        title: "Adding to queue...",
        description: spotifyTrack.name,
      });

      await addToQueueMutation.mutateAsync(spotifyTrack.uri);

      toast({
        title: "✓ Added to queue",
        description: `${spotifyTrack.name} by ${spotifyTrack.artists[0]?.name}`,
      });
    } catch (err: any) {
      console.error("Error adding to queue:", err);
      
      toast({
        title: "Failed to add to queue",
        description: "Make sure you have an active device",
        variant: "destructive",
      });
    }
  };

  const tracks = (searchResults?.tracks?.items || []).filter(Boolean);
  const artists = (searchResults?.artists?.items || []).filter(Boolean);
  const albums = (searchResults?.albums?.items || []).filter(Boolean);
  const playlists = (searchResults?.playlists?.items || []).filter(Boolean);

  const hasResults = tracks.length > 0 || artists.length > 0 || albums.length > 0 || playlists.length > 0;
  const showSearch = debouncedQuery.trim().length >= 2;

  const TrackRow = ({ track }: { track: SpotifyTrack }) => (
    <div
      className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors group"
    >
      <div 
        className="flex-1 flex items-center gap-4 cursor-pointer"
        onClick={() => handlePlaySpotifyTrack(track)}
      >
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
            {track.artists.map((a) => a.name).join(", ")}
          </p>
        </div>
        <span className="text-sm text-muted-foreground hidden md:block">
          {formatTime(Math.floor(track.duration_ms / 1000))}
        </span>
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => handlePlaySpotifyTrack(track)}
          disabled={playMutation.isPending}
        >
          <Play className="h-4 w-4 fill-current" />
        </Button>
        
        <Button
          size="icon"
          variant="ghost"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => handleAddToQueue(track, e)}
          disabled={addToQueueMutation.isPending}
        >
          <ListPlus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Search</h1>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search for songs, artists, albums..."
            className="pl-10 h-12 text-lg"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {(isLoading || isFetching) && showSearch && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
          )}
        </div>

        {query.length > 0 && query.length < 2 && (
          <p className="text-sm text-muted-foreground">
            Type at least 2 characters to search...
          </p>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to search. Please try again or check your connection.
          </AlertDescription>
        </Alert>
      )}

      {!showSearch ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search className="h-20 w-20 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Search Spotify</h2>
          <p className="text-muted-foreground">
            Find your favorite songs, artists, albums, and playlists
          </p>
        </div>
      ) : !hasResults && !isLoading && !isFetching ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search className="h-20 w-20 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No results found</h2>
          <p className="text-muted-foreground">
            Try different keywords or check your spelling
          </p>
        </div>
      ) : hasResults ? (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5 max-w-md">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="tracks">Songs</TabsTrigger>
            <TabsTrigger value="artists">Artists</TabsTrigger>
            <TabsTrigger value="albums">Albums</TabsTrigger>
            <TabsTrigger value="playlists">Playlists</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6 mt-6">
            {/* Top Result */}
            {tracks.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold">Top Result</h2>
                <Card className="max-w-md overflow-hidden group">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div 
                        className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0 cursor-pointer"
                        onClick={() => handlePlaySpotifyTrack(tracks[0])}
                      >
                        {tracks[0].album.images[0]?.url && (
                          <img
                            src={tracks[0].album.images[0].url}
                            alt={tracks[0].name}
                            className="object-cover w-full h-full"
                            loading="lazy"
                          />
                        )}
                      </div>
                      <div 
                        className="flex-1 min-w-0 pt-2 cursor-pointer"
                        onClick={() => handlePlaySpotifyTrack(tracks[0])}
                      >
                        <h3 className="text-3xl font-bold truncate mb-2">
                          {tracks[0].name}
                        </h3>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Music className="h-4 w-4" />
                          <span className="truncate">
                            {tracks[0].artists[0]?.name}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          size="icon"
                          className="rounded-full w-12 h-12 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handlePlaySpotifyTrack(tracks[0])}
                          disabled={playMutation.isPending}
                        >
                          <Play className="h-5 w-5 fill-current" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="rounded-full w-12 h-12 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleAddToQueue(tracks[0], e)}
                          disabled={addToQueueMutation.isPending}
                        >
                          <ListPlus className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* Songs */}
            {tracks.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold">Songs</h2>
                <div className="space-y-2">
                  {tracks.slice(0, 5).map((track: SpotifyTrack) => (
                    <TrackRow key={track.id} track={track} />
                  ))}
                </div>
              </section>
            )}

            {/* Artists */}
            {artists.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold">Artists</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {artists.slice(0, 6).map((artist: any) => (
                    <Card key={artist.id} className="group cursor-pointer hover:bg-accent/50">
                      <CardContent className="p-4 text-center">
                        <div className="relative aspect-square mb-3 rounded-full overflow-hidden bg-muted mx-auto">
                          {artist.images[0]?.url && (
                            <img
                              src={artist.images[0].url}
                              alt={artist.name}
                              className="object-cover w-full h-full"
                              loading="lazy"
                            />
                          )}
                        </div>
                        <h3 className="font-semibold truncate">{artist.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                          <User className="h-3 w-3" />
                          Artist
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </TabsContent>

          <TabsContent value="tracks" className="space-y-2 mt-6">
            {tracks.map((track: SpotifyTrack) => (
              <TrackRow key={track.id} track={track} />
            ))}
          </TabsContent>

          <TabsContent value="artists" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {artists.map((artist: any) => (
                <Card key={artist.id} className="group cursor-pointer hover:bg-accent/50">
                  <CardContent className="p-4 text-center">
                    <div className="relative aspect-square mb-3 rounded-full overflow-hidden bg-muted mx-auto">
                      {artist.images[0]?.url && (
                        <img
                          src={artist.images[0].url}
                          alt={artist.name}
                          className="object-cover w-full h-full"
                          loading="lazy"
                        />
                      )}
                    </div>
                    <h3 className="font-semibold truncate">{artist.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                      <User className="h-3 w-3" />
                      Artist
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="albums" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {albums.map((album: any) => (
                <Card key={album.id} className="group cursor-pointer hover:bg-accent/50">
                  <CardContent className="p-4">
                    <div className="relative aspect-square mb-3 rounded-lg overflow-hidden bg-muted">
                      {album.images[0]?.url && (
                        <img
                          src={album.images[0].url}
                          alt={album.name}
                          className="object-cover w-full h-full"
                          loading="lazy"
                        />
                      )}
                    </div>
                    <h3 className="font-semibold truncate">{album.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {album.artists[0]?.name}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="playlists" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {playlists.map((playlist: any) => (
                <Card key={playlist.id} className="group cursor-pointer hover:bg-accent/50">
                  <CardContent className="p-4">
                    <div className="relative aspect-square mb-3 rounded-lg overflow-hidden bg-muted">
                      {playlist.images[0]?.url && (
                        <img
                          src={playlist.images[0].url}
                          alt={playlist.name}
                          className="object-cover w-full h-full"
                          loading="lazy"
                        />
                      )}
                    </div>
                    <h3 className="font-semibold truncate">{playlist.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      By {playlist.owner.display_name}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      ) : null}
    </div>
  );
};

export default SearchContent;
