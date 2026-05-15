import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Plus, Clock, Disc3, Music2, Check, Sparkles, Loader2 } from "lucide-react";
import { usePlayMutation } from "@/hooks/useSpotify";
import { useSpotifyContext } from "@/contexts/SpotifyContext";
import * as spotifyApi from "@/services/spotify-api";
import { useToast } from "@/hooks/use-toast";

interface MoodPlaylistPanelProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: any[];
  moodName: string;
}

export default function MoodPlaylistPanel({ isOpen, onClose, tracks, moodName }: MoodPlaylistPanelProps) {
  const { deviceId } = useSpotifyContext();
  const playMutation = usePlayMutation();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const uris = tracks.map(t => t.uri);

  const handlePlayAll = async () => {
    if (!deviceId) {
      toast({ title: "Errore", description: "Nessun dispositivo attivo.", variant: "destructive" });
      return;
    }
    try {
      await playMutation.mutateAsync({ deviceId, uris });
      toast({ title: "In riproduzione", description: "La playlist sta per iniziare." });
    } catch (e) {
      toast({ title: "Errore", description: "Impossibile riprodurre la playlist.", variant: "destructive" });
    }
  };

  const handlePlayTrack = async (uri: string) => {
    if (!deviceId) return;
    try {
      await playMutation.mutateAsync({ deviceId, uris: [uri] });
      toast({ title: "In riproduzione", description: "Brano in riproduzione." });
    } catch (e) {}
  };

  const handleAddToQueue = async (uri: string) => {
    try {
      await spotifyApi.addToQueue(uri);
      toast({ title: "Aggiunto", description: "Brano aggiunto alla coda." });
    } catch (e) {
      toast({ title: "Errore", description: "Impossibile aggiungere alla coda.", variant: "destructive" });
    }
  };

  const handleSaveToSpotify = async () => {
    setIsSaving(true);
    try {
      const playlist = await spotifyApi.createPlaylist(`Mood: ${moodName}`, `Generata con Harmony Hub in base al mood: ${moodName}`);
      if (!playlist?.id) throw new Error("Creazione playlist fallita");
      
      await spotifyApi.addTracksToPlaylist(playlist.id, uris);
      setSaved(true);
      toast({ title: "Salvata!", description: "La playlist è ora nella tua libreria di Spotify." });
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error(error);
      toast({ title: "Errore", description: "Impossibile salvare la playlist.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  function formatDuration(ms: number) {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-background border-l border-border z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0 bg-secondary/20">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" /> {moodName}
                </h2>
                <p className="text-sm text-muted-foreground">{tracks.length} brani generati</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary/60 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 p-4 shrink-0 border-b border-border bg-background">
              <button 
                onClick={handlePlayAll}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 transition-all active:scale-95"
              >
                <Play className="w-5 h-5 fill-current" />
                Riproduci Tutto
              </button>
              <button 
                onClick={handleSaveToSpotify}
                disabled={isSaving || saved}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold shadow-lg transition-all active:scale-95 ${saved ? 'bg-green-600 text-white' : 'bg-secondary hover:bg-secondary/80 text-foreground'}`}
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : saved ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                {saved ? "Salvata" : "Salva su Spotify"}
              </button>
            </div>

            {/* Track List */}
            <div className="flex-1 overflow-y-auto p-2">
              {tracks.map((t, idx) => (
                <div key={t.id + idx} className="group flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/40 transition-colors">
                  <div className="relative w-12 h-12 rounded-md overflow-hidden shrink-0 bg-secondary flex items-center justify-center">
                    {t.album?.images?.[0]?.url ? (
                      <img src={t.album.images[0].url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Disc3 className="w-6 h-6 text-muted-foreground" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <button onClick={() => handlePlayTrack(t.uri)} className="p-2 rounded-full hover:bg-white/20 text-white transition-colors">
                        <Play className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{t.artists?.map((a:any) => a.name).join(", ")}</p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatDuration(t.duration_ms)}
                    </span>
                    <button onClick={() => handleAddToQueue(t.uri)} title="Aggiungi alla coda" className="p-2 rounded-full hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Bisogna importare Sparkles, Loader2 ecc che potrei aver dimenticato, vado a correggere.
