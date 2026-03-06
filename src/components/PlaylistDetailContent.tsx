import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, ListPlus, Loader2, Music, ArrowLeft, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlayMutation, useAddToQueueMutation } from "@/hooks/useSpotify";
import { useToast } from "@/hooks/use-toast";
import { formatTime } from "@/lib/mock-data";
import { getToken } from "@/services/spotify-auth";
import { useQuery } from "@tanstack/react-query";
import * as spotifyApi from "@/services/spotify-api";

const TRACK_LIMIT = 1500;

interface PlaylistDetailContentProps {
  playlistId: string;
  onBack: () => void;
}

export default function PlaylistDetailContent({ playlistId, onBack }: PlaylistDetailContentProps) {
  const playMutation = usePlayMutation();
  const addToQueueMutation = useAddToQueueMutation();
  const { toast } = useToast();

  // Step 1: fetch playlist metadata (includes first 100 tracks)
  const { data: playlist, isLoading: loadingPlaylist } = useQuery({
    queryKey: ["playlist", playlistId],
    queryFn: () => spotifyApi.getPlaylist(playlistId),
    enabled: !!getToken() && !!playlistId,
    staleTime: 60000,
  });

  const totalTrackCount: number = playlist?.tracks?.total ?? 0;
  const needsPagination = totalTrackCount > 100;

  // Step 2: if playlist has >100 tracks, fetch ALL pages
  // enabled fires as soon as playlist metadata is loaded and we know we need more
  const { data: allTracksData, isLoading: loadingAllTracks } = useQuery({
    queryKey: ["playlistAllTracks", playlistId],
    queryFn: () => spotifyApi.getAllPlaylistTracks(playlistId),
    enabled: !!getToken() && !!playlistId && needsPagination,
    staleTime: 60000,
  });

  const handlePlayPlaylist = async () => {
    if (!playlist?.uri) return;
    try {
      toast({ title: "Playing Playlist…", description: playlist.name });
      await playMutation.mutateAsync({ context_uri: playlist.uri });
      toast({ title: "Now Playing", description: playlist.name });
    } catch {
      toast({ title: "Playback Error", description: "Make sure you have an active device", variant: "destructive" });
    }
  };

  const handlePlayTrack = async (uri: string, trackName: string) => {
    try {
      toast({ title: "Playing…", description: trackName });
      await playMutation.mutateAsync({ uris: [uri] });
      toast({ title: "Now Playing", description: trackName });
    } catch {
      toast({ title: "Playback Error", description: "Make sure you have an active device", variant: "destructive" });
    }
  };

  const handleAddToQueue = async (uri: string, trackName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await addToQueueMutation.mutateAsync(uri);
      toast({ title: "✓ Added to queue", description: trackName });
    } catch {
      toast({ title: "Failed to add to queue", description: "Make sure you have an active device", variant: "destructive" });
    }
  };

  // Loading state: still fetching playlist metadata
  if (loadingPlaylist) {
    return (
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4 animate-pulse">
            <div className="w-48 h-48 bg-muted rounded-lg" />
            <div className="flex-1 space-y-3">
              <div className="h-8 bg-muted rounded w-1/3" />
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="h-4 bg-muted rounded w-1/5" />
            </div>
          </div>
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
          <Button onClick={onBack} className="mt-4">Go Back</Button>
        </div>
      </div>
    );
  }

  // Resolve which track list to use:
  // - If we need pagination and it's done: use allTracksData
  // - If we need pagination but still loading: show partial (embedded 100) with spinner
  // - If no pagination needed: use embedded tracks from playlist object
  const embeddedTracks: any[] = playlist.tracks?.items || [];
  let tracks: any[] = [];
  
  if (needsPagination) {
    tracks = allTracksData ?? embeddedTracks; // show partial while loading full
  } else {
    tracks = embeddedTracks;
  }

  // Filter out null tracks (Spotify sometimes returns null for removed tracks)
  const validTracks = tracks.filter((item: any) => item?.track != null);

  // Cap display at limit
  const displayTracks = validTracks.slice(0, TRACK_LIMIT);
  const hiddenCount = validTracks.length > TRACK_LIMIT ? validTracks.length - TRACK_LIMIT : 0;

  // Still fetching additional pages?
  const isFetchingMore = needsPagination && loadingAllTracks;

  const totalDuration = displayTracks.reduce((acc: number, item: any) => {
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
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Playlist Header */}
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="relative w-full md:w-48 aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-purple-600 to-blue-600 flex-shrink-0">
            {playlist.images?.[0]?.url ? (
              <img src={playlist.images[0].url} alt={playlist.name} className="w-full h-full object-cover" />
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
              <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                <span className="font-semibold text-foreground">{playlist.owner?.display_name}</span>
                <span>•</span>
                <span>
                  {totalTrackCount} {totalTrackCount === 1 ? "song" : "songs"}
                  {isFetchingMore && (
                    <span className="inline-flex items-center gap-1 ml-2 text-primary">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      loading all…
                    </span>
                  )}
                </span>
                {totalDuration > 0 && (
                  <>
                    <span>•</span>
                    <span>
                      {totalDuration >= 3600000
                        ? `${Math.floor(totalDuration / 3600000)}h ${Math.floor((totalDuration % 3600000) / 60000)}m`
                        : `${Math.floor(totalDuration / 60000)} min`}
                    </span>
                  </>
                )}
              </div>
            </div>

            <Button
              size="lg"
              onClick={handlePlayPlaylist}
              disabled={playMutation.isPending || totalTrackCount === 0}
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
        {displayTracks.length === 0 && !isFetchingMore ? (
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
              <div className="flex items-center gap-1"><Clock className="w-4 h-4" /></div>
              <div className="w-12"></div>
            </div>

            {/* Tracks */}
            {displayTracks.map((item: any, index: number) => {
              const track = item.track;
              if (!track) return null;
              return (
                <div
                  key={`${track.id}-${index}`}
                  className="grid grid-cols-[auto_1fr_auto_auto] md:grid-cols-[auto_1fr_1fr_auto_auto] gap-4 items-center px-4 py-3 rounded-lg hover:bg-accent/50 transition-colors group"
                >
                  <div className="w-8 text-center text-sm text-muted-foreground font-medium">{index + 1}</div>

                  <div className="flex items-center gap-3 cursor-pointer min-w-0" onClick={() => handlePlayTrack(track.uri, track.name)}>
                    <div className="relative w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                      {track.album?.images?.[0]?.url && (
                        <img src={track.album.images[0].url} alt={track.name} className="object-cover w-full h-full" loading="lazy" />
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
                    <p className="text-sm text-muted-foreground truncate">{track.album?.name}</p>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {formatTime(Math.floor(track.duration_ms / 1000))}
                  </div>

                  <div className="flex items-center gap-1 w-12 justify-end">
                    <Button size="icon" variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8"
                      onClick={() => handlePlayTrack(track.uri, track.name)}
                      disabled={playMutation.isPending}
                    >
                      <Play className="h-3 w-3 fill-current" />
                    </Button>
                    <Button size="icon" variant="ghost"
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

            {/* Loading more skeleton */}
            {isFetchingMore && (
              <div className="space-y-2 pt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-3 animate-pulse">
                    <div className="w-8 h-4 bg-muted rounded" />
                    <div className="w-10 h-10 bg-muted rounded" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-3 bg-muted rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Limit warning box — shown only when we hit the 1500 cap */}
            {hiddenCount > 0 && !isFetchingMore && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-4 p-5 mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10"
              >
                <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-400 mb-1">Limite di visualizzazione raggiunto</p>
                  <p className="text-sm text-muted-foreground">
                    Questa playlist ha <span className="font-medium text-foreground">{totalTrackCount}</span> canzoni,
                    ma vengono mostrate solo le prime <span className="font-medium text-foreground">{TRACK_LIMIT}</span> per
                    mantenere l'app reattiva. Altre <span className="font-medium text-foreground">{hiddenCount}</span> canzoni
                    sono nascoste. Puoi comunque riprodurre l'intera playlist con il pulsante <strong>Play Playlist</strong> in alto.
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
