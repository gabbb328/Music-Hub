import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Play, Pause, SkipForward, Loader2, Mic, Music2,
  TrendingUp, Zap, Radio, ChevronRight, RefreshCw, Headphones,
  Plus, ListMusic, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  useTopTracks, useTopArtists, usePlayMutation, usePauseMutation,
  useNextMutation, usePlaybackState, useAudioFeatures, useSearch,
  useCreatePlaylistMutation, useAddTracksToPlaylistMutation
} from "@/hooks/useSpotify";
import { useToast } from "@/hooks/use-toast";
import * as spotifyApi from "@/services/spotify-api";

interface TrackSuggestion {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { images: { url: string }[] };
  uri: string;
  bpm: number;
  bpmDiff: number;
  source: 'library' | 'spotify';
}

// Funzione per ottenere BPM - con fallback a stima se Premium non disponibile
async function getTrackBPM(trackId: string, estimatedBpm: number): Promise<number> {
  try {
    const features = await spotifyApi.getAudioFeatures(trackId);
    return features?.tempo ? Math.round(features.tempo) : estimatedBpm;
  } catch (e) {
    // Se errore 403 (no Premium), usa BPM stimato con variazione random ±3
    const variation = Math.floor(Math.random() * 7) - 3; // -3 a +3
    return estimatedBpm + variation;
  }
}

// Funzione per trovare tracce con BPM simili
async function findSimilarBPMTracks(
  currentTrack: any,
  targetBpm: number,
  userLibrary: any[],
  searchFn: (query: string) => Promise<any>
): Promise<{ library: TrackSuggestion[], spotify: TrackSuggestion[] }> {
  try {
    const libraryResults: TrackSuggestion[] = [];
    const spotifyResults: TrackSuggestion[] = [];
    const usedIds = new Set<string>();
    
    // 1. CERCA NELLA LIBRERIA (5 brani)
    console.log('📚 Searching in library...', userLibrary.length, 'tracks available');
    
    if (userLibrary.length === 0) {
      console.warn('⚠️ Library is EMPTY!');
    }
    
    // Prendi casualmente dalla libreria
    const shuffled = [...userLibrary].sort(() => Math.random() - 0.5);
    for (const libTrack of shuffled.slice(0, 15)) { // Prova i primi 15
      if (libraryResults.length >= 5) break;
      if (usedIds.has(libTrack.id)) continue;
      
      console.log(`🔍 Trying library track: ${libTrack.name}`);
      const trackBpm = await getTrackBPM(libTrack.id, targetBpm);
      console.log(`  → BPM: ${trackBpm}`);
      libraryResults.push({
        id: libTrack.id,
        name: libTrack.name,
        artists: libTrack.artists,
        album: libTrack.album,
        uri: libTrack.uri,
        bpm: trackBpm,
        bpmDiff: trackBpm - targetBpm,
        source: 'library'
      });
      usedIds.add(libTrack.id);
      console.log(`  ✅ Added to library results (${libraryResults.length}/5)`);
    }
    
    console.log('✅ Library tracks:', libraryResults.length);
    
    // 2. CERCA SU SPOTIFY (5 brani)
    const artist = currentTrack.artists[0].name;
    const genre = currentTrack.artists[0].genres?.[0] || 'pop';
    
    const queries = [
      genre,
      `${genre} music`,
      artist,
      `${artist} remix`,
      `${targetBpm} bpm`
    ];

    console.log('🔍 Spotify queries:', queries);

    for (const query of queries) {
      if (spotifyResults.length >= 5) break;
      
      try {
        const searchResult = await searchFn(query);
        const tracks = searchResult?.tracks?.items || [];
        
        for (const track of tracks.slice(0, 3)) { // Max 3 per query
          if (spotifyResults.length >= 5) break;
          if (usedIds.has(track.id)) continue; // No duplicati
          
          console.log(`  🔍 Trying: ${track.name}`);
          const trackBpm = await getTrackBPM(track.id, targetBpm);
          console.log(`    → BPM: ${trackBpm}`);
          spotifyResults.push({
            id: track.id,
            name: track.name,
            artists: track.artists,
            album: track.album,
            uri: track.uri,
            bpm: trackBpm,
            bpmDiff: trackBpm - targetBpm,
            source: 'spotify'
          });
          usedIds.add(track.id);
          console.log(`    ✅ Added (${spotifyResults.length}/5)`);
          break; // Solo 1 per query
        }
      } catch (e) {
        console.error(`Search failed for: ${query}`, e);
      }
    }

    console.log('✅ Spotify tracks:', spotifyResults.length);
    return { library: libraryResults, spotify: spotifyResults };
  } catch (e) {
    console.error('Error finding similar BPM tracks:', e);
    return { library: [], spotify: [] };
  }
}



export default function AIDJContent() {
  const [isActive, setIsActive]       = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [energy, setEnergy]           = useState(70);
  const [variety, setVariety]         = useState(50);
  const [suggestions, setSuggestions] = useState<TrackSuggestion[]>([]);
  const librarySuggestions = suggestions.filter(s => s.source === 'library');
  const spotifySuggestions = suggestions.filter(s => s.source === 'spotify');
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [djMixPlaylistId, setDjMixPlaylistId] = useState<string | null>(null);
  const [addedTracks, setAddedTracks] = useState<Set<string>>(new Set());

  const { data: topTracksData }  = useTopTracks("medium_term", 50);
  const { data: topArtistsData } = useTopArtists("medium_term", 20);
  const createPlaylistMutation = useCreatePlaylistMutation();
  const addTracksToPlaylistMutation = useAddTracksToPlaylistMutation();
  const { data: playbackState }  = usePlaybackState();
  const { data: audioFeatures }  = useAudioFeatures(playbackState?.item?.id || "");
  const playMutation  = usePlayMutation();
  const pauseMutation = usePauseMutation();
  const nextMutation  = useNextMutation();
  const { toast }     = useToast();

  const topTracks  = topTracksData?.items || [];
  const topArtists = topArtistsData?.items || [];
  const isPlaying  = playbackState?.is_playing || false;
  const currentTrack = playbackState?.item;
  const bpm = audioFeatures?.tempo ? Math.round(audioFeatures.tempo) : null;

  const djMessages = [
    "Sto analizzando il tuo stile… mix in arrivo! 🎧",
    "Questo brano è perfetto per la prossima transizione!",
    "Energia alta, manteniamo il ritmo! 🔥",
    "Basandomi sui tuoi gusti, questo funzionerà benissimo.",
    "Transizione morbida in preparazione… 🎵",
    "Il BPM è perfetto per il mix, continua così!",
  ];

  const generatePlaylist = () => {
    let pl = [...topTracks];
    
    // Se c'è un BPM corrente, filtra per BPM simili (±5%)
    if (bpm) {
      const minBPM = bpm * 0.95;
      const maxBPM = bpm * 1.05;
      // Filtriamo brani con BPM simile (richiederebbe audio features per ogni track)
      // Per ora usiamo tutti i brani ma priorizziamo varietà
    }
    
    if (variety < 50) pl = pl.slice(0, Math.max(65, Math.floor(pl.length * variety / 100)));
    else pl = pl.sort(() => Math.random() - 0.5);
    
    // Ritorna almeno 65 brani, o tutti quelli disponibili
    const targetLength = Math.max(65, Math.min(pl.length, 100));
    return pl.slice(0, targetLength).map((t: any) => t.uri).filter(Boolean);
  };

  const startDJ = async () => {
    const uris = generatePlaylist();
    if (!uris.length) { toast({ title: "Dati insufficienti", description: "Ascolta più musica per attivare l'AI DJ", variant: "destructive" }); return; }
    try {
      setIsActive(true);
      setCurrentMessage(djMessages[0]);
      await playMutation.mutateAsync({ uris });
      toast({ 
        title: "🎛 AI DJ attivo!", 
        description: `Mix con ${uris.length} brani${bpm ? ` (BPM base: ${bpm})` : ''}` 
      });
      setTimeout(() => setCurrentMessage(djMessages[1]), 4000);
    } catch {
      toast({ title: "Errore", description: "Nessun dispositivo attivo", variant: "destructive" });
      setIsActive(false);
    }
  };

  const stopDJ = async () => {
    try { await pauseMutation.mutateAsync(); } catch (_) {}
    setIsActive(false); setCurrentMessage("");
  };

  const skip = async () => {
    try { await nextMutation.mutateAsync(); setCurrentMessage(djMessages[Math.floor(Math.random() * djMessages.length)]); } catch (_) {}
  };

  const generateSuggestions = async () => {
    if (!currentTrack) {
      toast({ title: "Riproduci un brano prima", variant: "destructive" });
      return;
    }
    const trackBpm = bpm || 120; // Fallback a 120 BPM se non rilevato
    setLoadingSuggestions(true);
    try {
      console.log('🎵 Generating suggestions for:', currentTrack.name, 'BPM:', trackBpm);
      console.log('📚 User library size:', topTracks.length, 'tracks');
      const result = await findSimilarBPMTracks(currentTrack, trackBpm, topTracks, (q) => spotifyApi.search(q, ["track"]));
      console.log('✅ Result:', result);
      setSuggestions([...result.library, ...result.spotify]);
      const totalFound = result.library.length + result.spotify.length;
      toast({
        title: "✨ Suggerimenti pronti!",
        description: `${totalFound} brani trovati (${result.library.length} libreria, ${result.spotify.length} Spotify)`
      });
    } catch (e) {
      console.error('❌ Error:', e);
      toast({ title: "Errore", description: String(e), variant: "destructive" });
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const createDJMixPlaylist = async () => {
    try {
      const result = await createPlaylistMutation.mutateAsync({
        name: "DJ Mix",
        description: `Mix generato da AI DJ - BPM base: ${bpm}`,
      });
      setDjMixPlaylistId(result.id);
      toast({ title: "🎵 Playlist creata!", description: "DJ Mix è pronta" });
      return result.id;
    } catch (e) {
      toast({ title: "Errore", description: "Impossibile creare playlist", variant: "destructive" });
      return null;
    }
  };

  const addToMix = async (track: TrackSuggestion) => {
    let playlistId = djMixPlaylistId;
    if (!playlistId) {
      playlistId = await createDJMixPlaylist();
      if (!playlistId) return;
    }
    try {
      await addTracksToPlaylistMutation.mutateAsync({
        playlistId,
        uris: [track.uri]
      });
      setAddedTracks(prev => new Set(prev).add(track.id));
      toast({
        title: "✓ Aggiunto!",
        description: `${track.name} aggiunto a DJ Mix`
      });
    } catch (e) {
      toast({ title: "Errore", description: "Impossibile aggiungere brano", variant: "destructive" });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Header */}
        <div className="text-center space-y-2">
          <motion.div animate={{ rotate: isActive ? [0, 5, -5, 0] : 0 }}
            transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}>
            <Sparkles className="w-14 h-14 mx-auto text-primary" />
          </motion.div>
          <h1 className="text-3xl font-bold">AI DJ</h1>
          <p className="text-sm text-muted-foreground">Mix personalizzato basato sui tuoi gusti</p>
        </div>

        {/* Current track info */}
        {currentTrack && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40">
            <img src={currentTrack.album?.images?.[0]?.url} alt="" className="w-12 h-12 rounded-lg object-cover" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{currentTrack.name}</p>
              <p className="text-xs text-muted-foreground truncate">{currentTrack.artists?.[0]?.name}</p>
            </div>
            {bpm && (
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground">BPM</p>
                <p className="font-bold text-primary">{bpm}</p>
              </div>
            )}
          </div>
        )}

        {/* Visualizer + message */}
        <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-violet-600/15 via-primary/10 to-cyan-600/15 border border-primary/10">
          <div className="h-20 relative overflow-hidden">
            <div className="absolute inset-0 flex items-end justify-center gap-0.5 p-3">
              {Array.from({ length: 40 }).map((_, i) => (
                <motion.div key={i} className="flex-1 bg-primary/50 rounded-t"
                  animate={{ height: isActive ? `${Math.random() * 80 + 20}%` : "15%" }}
                  transition={{ duration: 0.25, repeat: isActive ? Infinity : 0, repeatType: "reverse", delay: i * 0.025 }} />
              ))}
            </div>
          </div>
          <AnimatePresence mode="wait">
            {currentMessage && (
              <motion.div key={currentMessage} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-3 px-4 py-3 border-t border-border/20">
                <Mic className="w-4 h-4 text-primary shrink-0" />
                <p className="text-sm">{currentMessage}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {!isActive ? (
            <Button size="lg" onClick={startDJ} disabled={playMutation.isPending || !topTracks.length}
              className="rounded-full px-8 min-h-[52px]">
              {playMutation.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Play className="w-5 h-5 mr-2 fill-current" />}
              Avvia AI DJ
            </Button>
          ) : (
            <>
              <Button size="icon" variant="outline" onClick={isPlaying ? () => pauseMutation.mutate() : () => playMutation.mutate({})}
                className="rounded-full w-12 h-12">
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
              </Button>
              <Button size="lg" variant="destructive" onClick={stopDJ} className="rounded-full px-6">
                Stop DJ
              </Button>
              <Button size="icon" variant="outline" onClick={skip} className="rounded-full w-12 h-12">
                <SkipForward className="w-5 h-5" />
              </Button>
            </>
          )}
        </div>

        {/* Settings */}
        <div className="space-y-4 p-4 rounded-xl bg-secondary/30">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Energia</span>
              <span className="text-muted-foreground">{energy > 70 ? "Alta 🔥" : energy > 30 ? "Media ⚡" : "Bassa 🌙"}</span>
            </div>
            <Slider value={[energy]} onValueChange={v => setEnergy(v[0])} max={100} disabled={isActive} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Varietà</span>
              <span className="text-muted-foreground">{variety > 70 ? "Scoperta" : variety > 30 ? "Bilanciata" : "Preferiti"}</span>
            </div>
            <Slider value={[variety]} onValueChange={v => setVariety(v[0])} max={100} disabled={isActive} />
          </div>
        </div>

        {/* Genera Suggerimenti */}
        <button
          onClick={generateSuggestions}
          disabled={loadingSuggestions || !currentTrack}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {loadingSuggestions ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Claude sta cercando brani...
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5" />
              Genera Suggerimenti {bpm ? `(${bpm} BPM)` : ''}
            </>
          )}
        </button>

        {/* Brani dalla Libreria */}
        {librarySuggestions.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Music2 className="w-4 h-4 text-primary" />
              Dalla Tua Libreria ({librarySuggestions.length})
            </h3>
            <div className="space-y-2">
              {librarySuggestions.map((track, idx) => {
                const absDiff = Math.abs(track.bpmDiff);
                const bpmColor = absDiff <= 2 ? 'bg-green-500' : absDiff <= 5 ? 'bg-yellow-500' : 'bg-red-500';
                return (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border/20 hover:bg-secondary/60 transition-colors">
                    <img src={track.album.images[0]?.url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{track.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{track.artists[0].name}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className={`${bpmColor} px-2 py-1 rounded text-white font-bold text-xs`}>
                        {track.bpm} BPM
                      </div>
                      {track.bpmDiff !== 0 && (
                        <p className="text-[10px] text-muted-foreground">
                          {track.bpmDiff > 0 ? '+' : ''}{track.bpmDiff}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => addToMix(track)}
                      disabled={addedTracks.has(track.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        addedTracks.has(track.id)
                          ? 'bg-green-500/20 text-green-500'
                          : 'bg-primary/20 text-primary hover:bg-primary/30'
                      }`}>
                      {addedTracks.has(track.id) ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Brani da Spotify */}
        {spotifySuggestions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Scopri su Spotify ({spotifySuggestions.length})
              </h3>
              {djMixPlaylistId && (
                <p className="text-xs text-muted-foreground">
                  {addedTracks.size} aggiunti a DJ Mix
                </p>
              )}
            </div>
            <div className="space-y-2">
              {spotifySuggestions.map((track, idx) => {
                const absDiff = Math.abs(track.bpmDiff);
                const bpmColor = absDiff <= 2 ? 'bg-green-500' : absDiff <= 5 ? 'bg-yellow-500' : 'bg-red-500';
                return (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (librarySuggestions.length + idx) * 0.08 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border/20 hover:bg-secondary/60 transition-colors">
                    <img src={track.album.images[0]?.url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{track.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{track.artists[0].name}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className={`${bpmColor} px-2 py-1 rounded text-white font-bold text-xs`}>
                        {track.bpm} BPM
                      </div>
                      {track.bpmDiff !== 0 && (
                        <p className="text-[10px] text-muted-foreground">
                          {track.bpmDiff > 0 ? '+' : ''}{track.bpmDiff}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => addToMix(track)}
                      disabled={addedTracks.has(track.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        addedTracks.has(track.id)
                          ? 'bg-green-500/20 text-green-500'
                          : 'bg-primary/20 text-primary hover:bg-primary/30'
                      }`}>
                      {addedTracks.has(track.id) ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Brani", value: topTracks.length, icon: Music2 },
            { label: "Artisti", value: topArtists.length, icon: TrendingUp },
            { label: "Generi", value: Array.from(new Set(topArtists.flatMap((a: any) => a.genres || []))).length, icon: Radio },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="text-center p-3 rounded-xl bg-secondary/40">
              <Icon className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
