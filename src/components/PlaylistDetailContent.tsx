import { useState } from "react";
import { motion } from "framer-motion";
import { Play, ListPlus, Loader2, Music, ArrowLeft, Clock, AlertCircle, MoreVertical, Plus } from "lucide-react";
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
  const playMutation       = usePlayMutation();
  const addToQueueMutation = useAddToQueueMutation();
  const { toast } = useToast();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const { data: playlist, isLoading: loadingPlaylist } = useQuery({
    queryKey: ["playlist", playlistId],
    queryFn: () => spotifyApi.getPlaylist(playlistId),
    enabled: !!getToken() && !!playlistId,
    staleTime: 60000,
  });

  const totalTrackCount: number = playlist?.tracks?.total ?? 0;
  const needsPagination = totalTrackCount > 100;

  const { data: allTracksData, isLoading: loadingAllTracks } = useQuery({
    queryKey: ["playlistAllTracks", playlistId],
    queryFn: () => spotifyApi.getAllPlaylistTracks(playlistId),
    enabled: !!getToken() && !!playlistId && needsPagination,
    staleTime: 60000,
  });

  const handlePlayAll = async () => {
    if (!playlist?.uri) return;
    try {
      await playMutation.mutateAsync({ contextUri: playlist.uri } as any);
      toast({ title: "▶ In riproduzione", description: playlist.name });
    } catch {
      toast({ title: "Errore", description: "Nessun dispositivo attivo", variant: "destructive" });
    }
  };

  // Riproduce nel contesto playlist → Spotify continua automaticamente
  const handlePlayTrack = async (trackUri: string, trackName: string, trackIndex: number) => {
    if (!playlist?.uri) return;
    try {
      await playMutation.mutateAsync({
        contextUri: playlist.uri,
        offset: { position: trackIndex },
      } as any);
      toast({ title: "▶ " + trackName });
    } catch {
      try {
        await playMutation.mutateAsync({ uris: [trackUri] });
      } catch {
        toast({ title: "Errore", description: "Nessun dispositivo attivo", variant: "destructive" });
      }
    }
    setActiveMenu(null);
  };

  const handleAddToQueue = async (trackUri: string, trackName: string) => {
    try {
      await addToQueueMutation.mutateAsync(trackUri);
      toast({ title: "✓ Aggiunto alla coda", description: trackName });
    } catch {
      toast({ title: "Errore", description: "Nessun dispositivo attivo", variant: "destructive" });
    }
    setActiveMenu(null);
  };

  if (loadingPlaylist) {
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-40 h-40 bg-muted rounded-xl" />
            <div className="flex-1 space-y-3">
              <div className="h-7 bg-muted rounded w-1/3" />
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="h-10 bg-muted rounded w-32 rounded-full" />
            </div>
          </div>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <div className="w-11 h-11 bg-muted rounded-lg" />
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
          <p className="text-muted-foreground">Playlist non trovata</p>
          <Button onClick={onBack} className="mt-4">Indietro</Button>
        </div>
      </div>
    );
  }

  const embeddedTracks: any[] = playlist.tracks?.items || [];
  const tracks = needsPagination ? (allTracksData ?? embeddedTracks) : embeddedTracks;
  const validTracks = tracks.filter((item: any) => item?.track != null).slice(0, TRACK_LIMIT);
  const hiddenCount = Math.max(0, tracks.filter((i: any) => i?.track).length - TRACK_LIMIT);
  const isFetchingMore = needsPagination && loadingAllTracks;

  const totalDuration = validTracks.reduce((acc: number, item: any) => acc + (item.track?.duration_ms || 0), 0);

  return (
    <div className="flex-1 overflow-y-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

        {/* ── Hero ── */}
        <div className="relative">
          {playlist.images?.[0]?.url && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <img src={playlist.images[0].url} alt="" className="w-full h-full object-cover blur-3xl opacity-20 scale-110" />
              <div className="absolute inset-0 bg-gradient-to-b from-background/30 to-background" />
            </div>
          )}

          <div className="relative px-4 pt-4 pb-6 space-y-4">
            <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium min-h-[44px]">
              <ArrowLeft className="w-4 h-4" /> Indietro
            </button>

            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-xl overflow-hidden bg-muted shrink-0 shadow-2xl">
                {playlist.images?.[0]?.url
                  ? <img src={playlist.images[0].url} alt={playlist.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center"><Music className="w-16 h-16 text-white/50" /></div>
                }
              </div>

              <div className="flex-1 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Playlist</p>
                <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{playlist.name}</h1>
                {playlist.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2" dangerouslySetInnerHTML={{ __html: playlist.description }} />
                )}
                <p className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground">{playlist.owner?.display_name}</span>
                  <span>·</span>
                  <span>
                    {totalTrackCount} brani
                    {isFetchingMore && <span className="text-primary ml-1 inline-flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />caricamento…</span>}
                  </span>
                  {totalDuration > 0 && (
                    <>
                      <span>·</span>
                      <span>{totalDuration >= 3600000 ? `${Math.floor(totalDuration/3600000)}h ${Math.floor((totalDuration%3600000)/60000)}m` : `${Math.floor(totalDuration/60000)} min`}</span>
                    </>
                  )}
                </p>
                <Button size="lg" onClick={handlePlayAll} disabled={playMutation.isPending || totalTrackCount === 0}
                  className="rounded-full mt-2 min-h-[48px] px-8">
                  {playMutation.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Play className="w-5 h-5 mr-2 fill-current" />}
                  Riproduci tutto
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Track list ── */}
        <div className="px-2 pb-8 space-y-1">
          {validTracks.map((item: any, index: number) => {
            const track = item.track;
            if (!track) return null;
            const isMenuOpen = activeMenu === `${track.id}-${index}`;

            return (
              <div key={`${track.id}-${index}`}
                className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/40 active:bg-secondary/60 transition-colors">

                {/* Cover */}
                <button
                  className="relative w-11 h-11 rounded-lg overflow-hidden bg-muted shrink-0 focus:outline-none"
                  onClick={() => handlePlayTrack(track.uri, track.name, index)}
                >
                  {track.album?.images?.[0]?.url && (
                    <img src={track.album.images[0].url} alt="" className="object-cover w-full h-full" loading="lazy" />
                  )}
                </button>

                {/* Info */}
                <button className="flex-1 min-w-0 text-left focus:outline-none"
                  onClick={() => handlePlayTrack(track.uri, track.name, index)}>
                  <p className="font-medium text-sm truncate">{track.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{track.artists?.map((a: any) => a.name).join(", ")}</p>
                </button>

                {/* Durata */}
                <span className="text-xs text-muted-foreground tabular-nums shrink-0 hidden sm:block">
                  {formatTime(Math.floor(track.duration_ms / 1000))}
                </span>

                {/* Menu ⋮ — sempre visibile */}
                <div className="relative shrink-0">
                  <button
                    onClick={() => setActiveMenu(isMenuOpen ? null : `${track.id}-${index}`)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {isMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                      <div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-xl shadow-2xl overflow-hidden min-w-[180px]">
                        <button onClick={() => handlePlayTrack(track.uri, track.name, index)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-secondary/60 transition-colors text-left">
                          <Play className="w-4 h-4 fill-current" /> Riproduci
                        </button>
                        <button onClick={() => handleAddToQueue(track.uri, track.name)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-secondary/60 transition-colors text-left">
                          <Plus className="w-4 h-4" /> Aggiungi alla coda
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading skeleton */}
          {isFetchingMore && (
            <div className="space-y-1 pt-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 animate-pulse">
                  <div className="w-11 h-11 bg-muted rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {hiddenCount > 0 && !isFetchingMore && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-start gap-3 p-4 mt-4 rounded-xl border border-amber-500/30 bg-amber-500/8">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Vengono mostrati i primi <strong className="text-foreground">{TRACK_LIMIT}</strong> brani su <strong className="text-foreground">{totalTrackCount}</strong>.
                Usa <strong>Riproduci tutto</strong> per ascoltare l'intera playlist.
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
