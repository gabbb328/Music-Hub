import { useState } from "react";
import { motion } from "framer-motion";
import { Radio, Play, Music, Sparkles, TrendingUp, Heart, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTopTracks, useTopArtists, usePlayMutation } from "@/hooks/useSpotify";
import { useToast } from "@/hooks/use-toast";

interface RadioContentProps {
  onPlayTrack?: (track: any) => void;
}

export default function RadioContent({ onPlayTrack }: RadioContentProps) {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [isLoadingRadio, setIsLoadingRadio] = useState(false);
  const { data: topTracksData } = useTopTracks("short_term", 50);
  const { data: topArtistsData } = useTopArtists("short_term", 20);
  const playMutation = usePlayMutation();
  const { toast } = useToast();

  const topTracks = topTracksData?.items || [];
  const topArtists = topArtistsData?.items || [];

  // Extract unique genres from top artists
  const genres = Array.from(
    new Set(topArtists.flatMap((artist: any) => artist.genres))
  ).slice(0, 18); // More genres!

  const radioStations = [
    {
      id: "liked-mix",
      name: "Liked Songs Mix",
      description: "Based on your liked songs",
      icon: Heart,
      color: "from-pink-600 to-purple-600",
    },
    {
      id: "discover",
      name: "Discover Weekly",
      description: "Fresh finds for you",
      icon: Sparkles,
      color: "from-blue-600 to-cyan-600",
    },
    {
      id: "top-hits",
      name: "Your Top Hits",
      description: "Your most played tracks",
      icon: TrendingUp,
      color: "from-orange-600 to-red-600",
    },
  ];

  const handlePlayRadio = async (stationId: string) => {
    try {
      setIsLoadingRadio(true);
      toast({
        title: "Starting Radio...",
        description: "Creating your personalized station",
      });

      if (stationId === "liked-mix" && topTracks.length > 0) {
        const trackUris = topTracks.slice(0, 20).map((t: any) => t.uri);
        await playMutation.mutateAsync({ uris: trackUris });
      } else if (stationId === "top-hits" && topTracks.length > 0) {
        const trackUris = topTracks.slice(0, 30).map((t: any) => t.uri);
        await playMutation.mutateAsync({ uris: trackUris });
      } else if (stationId === "discover" && topTracks.length > 0) {
        const shuffledTracks = [...topTracks]
          .sort(() => Math.random() - 0.5)
          .slice(0, 25);
        const trackUris = shuffledTracks.map((t: any) => t.uri);
        await playMutation.mutateAsync({ uris: trackUris });
      }

      toast({
        title: "Radio Started!",
        description: "Enjoy your personalized station",
      });
    } catch (error) {
      console.error("Radio play error:", error);
      toast({
        title: "Failed to Start Radio",
        description: "Make sure you have an active device",
        variant: "destructive",
      });
    } finally {
      setIsLoadingRadio(false);
    }
  };

  const handleGenreRadio = async (genre: string) => {
    try {
      setSelectedGenre(genre);
      setIsLoadingRadio(true);
      
      toast({
        title: "Starting Genre Radio...",
        description: `Discovering ${genre} tracks`,
      });

      // Use Spotify Recommendations API to get tracks by genre
      const seedArtists = topArtists
        .filter((artist: any) => artist.genres.includes(genre))
        .slice(0, 2)
        .map((artist: any) => artist.id);

      const seedTracks = topTracks
        .slice(0, 3)
        .map((track: any) => track.id);

      // Build recommendations query
      const params = new URLSearchParams({
        limit: '50',
        seed_genres: genre,
      });

      if (seedArtists.length > 0) {
        params.append('seed_artists', seedArtists.join(','));
      }
      
      if (seedTracks.length > 0) {
        params.append('seed_tracks', seedTracks.slice(0, 2).join(','));
      }

      const token = localStorage.getItem('spotify_access_token');
      const response = await fetch(
        `https://api.spotify.com/v1/recommendations?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get recommendations');
      }

      const data = await response.json();
      
      if (data.tracks && data.tracks.length > 0) {
        const trackUris = data.tracks.map((t: any) => t.uri);
        await playMutation.mutateAsync({ uris: trackUris });
        
        toast({
          title: `${genre} Radio Started!`,
          description: `${data.tracks.length} recommended tracks`,
        });
      } else {
        // Fallback to library tracks
        const genreArtistIds = topArtists
          .filter((artist: any) => artist.genres.includes(genre))
          .map((artist: any) => artist.id)
          .slice(0, 5);

        const genreTracks = topTracks.filter((track: any) =>
          track.artists.some((artist: any) => genreArtistIds.includes(artist.id))
        );

        if (genreTracks.length > 0) {
          const trackUris = genreTracks.slice(0, 20).map((t: any) => t.uri);
          await playMutation.mutateAsync({ uris: trackUris });
          
          toast({
            title: `${genre} Radio Started!`,
            description: "From your library",
          });
        } else {
          toast({
            title: "No tracks found",
            description: "Try a different genre",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Genre radio error:", error);
      toast({
        title: "Failed to Start Radio",
        description: "Try a different genre or check your connection",
        variant: "destructive",
      });
    } finally {
      setIsLoadingRadio(false);
      setSelectedGenre(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3">
            <Radio className="w-8 h-8 md:w-10 md:h-10 text-primary" />
            Radio Stations
          </h1>
          <p className="text-base md:text-lg text-muted-foreground">
            Personalized radio with AI-powered recommendations
          </p>
        </div>

        {/* Personalized Stations */}
        <div className="space-y-4">
          <h2 className="text-xl md:text-2xl font-bold">For You</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {radioStations.map((station) => (
              <motion.div
                key={station.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="cursor-pointer overflow-hidden group">
                  <CardContent className="p-0">
                    <div className={`h-32 bg-gradient-to-br ${station.color} flex items-center justify-center relative overflow-hidden`}>
                      <station.icon className="w-16 h-16 text-white/90" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      <Button
                        size="icon"
                        className="absolute bottom-4 right-4 rounded-full w-12 h-12 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0"
                        onClick={() => handlePlayRadio(station.id)}
                        disabled={playMutation.isPending || isLoadingRadio}
                      >
                        {isLoadingRadio ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Play className="h-5 w-5 fill-current" />
                        )}
                      </Button>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-1">{station.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {station.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Genre Stations with Recommendations */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-xl md:text-2xl font-bold">Genre Stations</h2>
            <p className="text-sm text-muted-foreground">
              AI-powered recommendations • Not limited to your library
            </p>
          </div>
          {genres.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Music className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">
                Listen to more music to get personalized genre stations
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {genres.map((genre: string) => (
                <motion.button
                  key={genre}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleGenreRadio(genre)}
                  disabled={isLoadingRadio}
                  className={`
                    p-4 rounded-xl text-sm font-medium transition-all relative overflow-hidden
                    ${selectedGenre === genre && isLoadingRadio
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary hover:bg-secondary/80'
                    }
                    ${isLoadingRadio ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
                  `}
                >
                  {selectedGenre === genre && isLoadingRadio ? (
                    <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin" />
                  ) : (
                    <Radio className="w-5 h-5 mx-auto mb-2" />
                  )}
                  <span className="capitalize line-clamp-2">
                    {genre}
                  </span>
                  {selectedGenre === genre && isLoadingRadio && (
                    <span className="text-xs mt-1 block">Loading...</span>
                  )}
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-8 p-6 rounded-lg bg-secondary/50 border border-border">
          <div className="flex items-start gap-4">
            <Sparkles className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-lg mb-2">How Radio Works</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>Liked Songs Mix:</strong> Plays your favorite tracks</li>
                <li>• <strong>Your Top Hits:</strong> Your most played songs</li>
                <li>• <strong>Discover Weekly:</strong> Shuffled recommendations</li>
                <li>• <strong>Genre Stations:</strong> AI-powered recommendations based on genre</li>
                <li>• <strong>Smart Discovery:</strong> Finds tracks beyond your library</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
