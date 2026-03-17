import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Play, ListPlus, Loader2, Music, MoreVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlaylist, usePlayMutation, useAddToQueueMutation } from "@/hooks/useSpotify";
import { useToast } from "@/hooks/use-toast";
import { formatTime } from "@/lib/mock-data";

interface PlaylistDetailProps {
  playlistId: string;
  onBack: () => void;
}

export default function PlaylistDetail({ playlistId, onBack }: PlaylistDetailProps) {
  const { data: playlist, isLoading } = usePlaylist(playlistId);
  const playMutation       = usePlayMutation();
  const addToQueueMutation = useAddToQueueMutation();
  const { toast } = useToast();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Riproduce l'intera playlist dal contesto Spotify (shuffle off, parte dall'inizio)
  const handlePlayAll = async () => {
    if (!playlist?.uri) return;
    try {
      await playMutation.mutateAsync({ contextUri: playlist.uri });
      toast({ title: "▶ In riproduzione", description: playlist.name });
    } catch {
      toast({ title: "Errore", description: "Nessun dispositivo attivo", variant: "destructive" });
    }
  };

  // Riproduce UNA traccia NEL CONTESTO della playlist — così Spotify
  // continua automaticamente con i brani successivi della playlist
  const handlePlayTrack = async (trackUri: string, trackName: string, trackIndex: number) => {
    if (!playlist?.uri) return;
    try {
      // context_uri + offset → Spotify riparte dal brano scelto e continua la playlist
      await playMutation.mutateAsync({
        contextUri: playlist.uri,
        offset: { position: trackIndex },
      } as any);
      toast({ title: "▶ " + trackName });
    } catch {
      // Fallback: riproduci solo la traccia singola
      try {
        await playMutation.mutateAsync({ uris: [trackUri] });
      } catch {
        toast({ title: "Errore", description: "Nessun dispositivo attivo", variant: "destructive" });
      }
    }
    setActiveMenu(null);
  };

  // Aggiunge una traccia in coda senza cambiare il contesto corrente
  const handleAddToQueue = async (trackUri: string, trackName: string) => {
    try {
      await addToQueueMutation.mutateAsync(trackUri);
      toast({ title: "✓ Aggiunto alla coda", description: trackName });
    } catch {
      toast({ title: "Errore", description: "Nessun dispositivo attivo", variant: "destructive" });
    }
    setActiveMenu(null);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <Music className="w-20 h-20 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground">Playlist non trovata</p>
        <Button onClick={onBack} className="mt-4">Indietro</Button>
      </div>
    );
  }

  const tracks = playlist.tracks?.items ?? [];

  return (
    <div className="flex-1 overflow-y-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

        {/* ── Hero ── */}
        <div className="relative">
          {/* Cover sfocata come sfondo */}
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
              {/* Cover */}
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-xl overflow-hidden bg-muted shrink-0 shadow-2xl">
                {playlist.images?.[0]?.url
                  ? <img src={playlist.images[0].url} alt={playlist.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center"><Music className="w-16 h-16 text-white/50" /></div>
                }
              </div>

              {/* Info */}
              <div className="flex-1 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Playlist</p>
                <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{playlist.name}</h1>
                {playlist.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2" dangerouslySetInnerHTML={{ __html: playlist.description }} />
                )}
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{playlist.owner?.display_name}</span>
                  {" · "}{playlist.tracks?.total ?? tracks.length} brani
                </p>
                {/* Bottone Play grande — facile su mobile */}
                <Button size="lg" onClick={handlePlayAll} disabled={playMutation.isPending} className="rounded-full mt-2 min-h-[48px] px-8">
                  {playMutation.isPending
                    ? <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    : <Play className="w-5 h-5 mr-2 fill-current" />}
                  Riproduci tutto
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Track list ── */}
        <div className="px-2 pb-8 space-y-1">
          {tracks.map((item: any, index: number) => {
            const track = item?.track;
            if (!track) return null;
            const isMenuOpen = activeMenu === track.id;

            return (
              <div
                key={`${track.id}-${index}`}
                className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/40 active:bg-secondary/60 transition-colors"
              >
                {/* Cover — clicca per riprodurre */}
                <button
                  className="relative w-11 h-11 rounded-lg overflow-hidden bg-muted shrink-0 focus:outline-none"
                  onClick={() => handlePlayTrack(track.uri, track.name, index)}
                >
                  {track.album?.images?.[0]?.url && (
                    <img src={track.album.images[0].url} alt="" className="object-cover w-full h-full" loading="lazy" />
                  )}
                </button>

                {/* Info — clicca per riprodurre */}
                <button
                  className="flex-1 min-w-0 text-left focus:outline-none"
                  onClick={() => handlePlayTrack(track.uri, track.name, index)}
                >
                  <p className="font-medium text-sm truncate">{track.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {track.artists?.map((a: any) => a.name).join(", ")}
                  </p>
                </button>

                {/* Durata */}
                <span className="text-xs text-muted-foreground tabular-nums shrink-0 hidden sm:block">
                  {formatTime(Math.floor(track.duration_ms / 1000))}
                </span>

                {/* Menu azione — SEMPRE visibile su mobile come ⋮ */}
                <div className="relative shrink-0">
                  <button
                    onClick={() => setActiveMenu(isMenuOpen ? null : track.id)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {/* Dropdown azioni */}
                  {isMenuOpen && (
                    <>
                      {/* Backdrop per chiudere */}
                      <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                      <div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-xl shadow-2xl overflow-hidden min-w-[180px]">
                        <button
                          onClick={() => handlePlayTrack(track.uri, track.name, index)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-secondary/60 transition-colors text-left"
                        >
                          <Play className="w-4 h-4 fill-current" /> Riproduci
                        </button>
                        <button
                          onClick={() => handleAddToQueue(track.uri, track.name)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-secondary/60 transition-colors text-left"
                        >
                          <Plus className="w-4 h-4" /> Aggiungi alla coda
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
