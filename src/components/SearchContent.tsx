import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Play, User, AlertCircle, Loader2, MoreVertical, Plus, Sparkles } from "lucide-react";
import { Track } from "@/lib/mock-data";
import { useSearch, usePlayMutation, useAddToQueueMutation } from "@/hooks/useSpotify";
import { SpotifyTrack } from "@/types/spotify";
import { formatTime } from "@/lib/mock-data";
import { useDebounce } from "@/hooks/use-mobile";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { detectEasterEgg, type EasterEggType } from "@/hooks/useEasterEgg";
import { AnimatePresence, motion } from "framer-motion";

interface SearchContentProps {
  onPlayTrack: (track: Track) => void;
  onActivateEgg?: (egg: EasterEggType) => void; // ← sollevato a Index
}

const toTrack = (t: SpotifyTrack): Track => ({
  id: t.id, title: t.name,
  artist: t.artists[0]?.name || "Unknown Artist",
  album: t.album.name, cover: t.album.images[0]?.url || "",
  duration: Math.floor(t.duration_ms / 1000),
});

const HINTS: Record<string, string> = {
  duh:     'Premi Invio per il "duh" di Billie Eilish...',
  party:   "Sembra che tu voglia fare festa...",
  rainbow: "Un arcobaleno sta per apparire...",
  lgbt:    "Pride mode in arrivo...",
  matrix:  "Pillola rossa o pillola blu?",
  disco:   "Disco fever detected...",
  nyan:    "Nyan Cat incoming...",
  hack:    "Entrando nel mainframe...",
  love:    "Love is in the air...",
  music:   "Music is life...",
};

const EXACT_KEYWORDS = [
  "duh","party","festa","confetti","rainbow","arcobaleno",
  "lgbt","pride","gay","matrix","disco","dance","ballo",
  "nyan","nyancat","hack","hacker","love","amore","heart",
  "music","musica","🎵",
];

const SearchContent = ({ onPlayTrack, onActivateEgg }: SearchContentProps) => {
  const [query, setQuery]             = useState("");
  const [activeMenu, setActiveMenu]   = useState<string | null>(null);
  const [hintVisible, setHintVisible] = useState(false);
  const debouncedQuery = useDebounce(query, 400);
  const playMutation   = usePlayMutation();
  const addMutation    = useAddToQueueMutation();
  const { toast }      = useToast();

  const detectedEgg = detectEasterEgg(query);

  // Hint dopo 600ms
  useEffect(() => {
    if (detectedEgg) {
      const t = setTimeout(() => setHintVisible(true), 600);
      return () => clearTimeout(t);
    }
    setHintVisible(false);
  }, [detectedEgg]);

  // Auto-attivazione su keyword esatta dopo 1.2s
  useEffect(() => {
    if (!detectedEgg) return;
    const exact = EXACT_KEYWORDS.includes(query.trim().toLowerCase());
    if (!exact) return;
    const t = setTimeout(() => {
      setQuery(""); // Clear query BEFORE activating to prevent re-trigger
      setHintVisible(false);
      onActivateEgg?.(detectedEgg);
    }, 1200);
    return () => clearTimeout(t);
  }, [detectedEgg, query, onActivateEgg]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && detectedEgg) {
      e.preventDefault();
      setQuery(""); // Clear query BEFORE activating to prevent re-trigger
      setHintVisible(false);
      onActivateEgg?.(detectedEgg);
    }
  };

  const { data: results, isLoading, error, isFetching } = useSearch(
    detectedEgg ? "" : debouncedQuery,
    ["track","artist","album","playlist"], 20
  );

  const handlePlay = async (track: SpotifyTrack) => {
    try {
      await playMutation.mutateAsync({ uris: [track.uri] });
      onPlayTrack(toTrack(track));
      toast({ title: "▶ " + track.name });
    } catch (e: any) {
      toast({
        title: "Errore",
        description: e?.message?.includes("Premium") ? "Richiede Spotify Premium" : "Nessun dispositivo attivo",
        variant: "destructive",
      });
    }
    setActiveMenu(null);
  };

  const handleAddToQueue = async (track: SpotifyTrack) => {
    try {
      await addMutation.mutateAsync(track.uri);
      toast({ title: "✓ Aggiunto alla coda", description: track.name });
    } catch {
      toast({ title: "Errore", description: "Nessun dispositivo attivo", variant: "destructive" });
    }
    setActiveMenu(null);
  };

  const tracks    = (results?.tracks?.items    || []).filter(Boolean) as SpotifyTrack[];
  const artists   = (results?.artists?.items   || []).filter(Boolean) as any[];
  const albums    = (results?.albums?.items    || []).filter(Boolean) as any[];
  const playlists = (results?.playlists?.items || []).filter(Boolean) as any[];
  const hasResults = tracks.length > 0 || artists.length > 0 || albums.length > 0 || playlists.length > 0;
  const showSearch = !detectedEgg && debouncedQuery.trim().length >= 2;

  const TrackRow = ({ track }: { track: SpotifyTrack }) => {
    const isOpen = activeMenu === track.id;
    return (
      <div className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/40 active:bg-secondary/60 transition-colors">
        <button className="w-11 h-11 rounded-lg overflow-hidden bg-muted shrink-0 focus:outline-none"
          onClick={() => handlePlay(track)}>
          {track.album.images[0]?.url && <img src={track.album.images[0].url} alt="" className="object-cover w-full h-full" loading="lazy" />}
        </button>
        <button className="flex-1 min-w-0 text-left focus:outline-none" onClick={() => handlePlay(track)}>
          <p className="font-medium text-sm truncate">{track.name}</p>
          <p className="text-xs text-muted-foreground truncate">{track.artists.map(a => a.name).join(", ")}</p>
        </button>
        <span className="text-xs text-muted-foreground tabular-nums hidden sm:block shrink-0">
          {formatTime(Math.floor(track.duration_ms / 1000))}
        </span>
        <div className="relative shrink-0">
          <button onClick={() => setActiveMenu(isOpen ? null : track.id)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
          {isOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
              <div className="absolute right-0 top-full mt-1 z-50 bg-card border border-border rounded-xl shadow-2xl overflow-hidden min-w-[180px]">
                <button onClick={() => handlePlay(track)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-secondary/60 text-left">
                  <Play className="w-4 h-4 fill-current" /> Riproduci
                </button>
                <button onClick={() => handleAddToQueue(track)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-secondary/60 text-left">
                  <Plus className="w-4 h-4" /> Aggiungi alla coda
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Cerca</h1>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Cerca canzoni, artisti, album…"
            className={`pl-10 h-12 text-base transition-all duration-300 ${
              detectedEgg ? "border-primary/60 ring-1 ring-primary/30 bg-primary/5" : ""
            }`}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {(isLoading || isFetching) && showSearch ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : detectedEgg ? (
              <motion.div animate={{ rotate: 360, scale: [1, 1.3, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}>
                <Sparkles className="h-5 w-5 text-primary" />
              </motion.div>
            ) : null}
          </div>
        </div>

        {/* Hint easter egg */}
        <AnimatePresence>
          {hintVisible && detectedEgg && HINTS[detectedEgg] && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-sm">
                <Sparkles className="w-4 h-4 text-primary shrink-0" />
                <span className="text-primary font-medium">{HINTS[detectedEgg]}</span>
                <span className="text-muted-foreground text-xs ml-auto hidden sm:block">premi Invio</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {query.length > 0 && query.length < 2 && !detectedEgg && (
          <p className="text-sm text-muted-foreground">Digita almeno 2 caratteri…</p>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Ricerca fallita. Controlla la connessione.</AlertDescription>
        </Alert>
      )}

      {!showSearch && !detectedEgg ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="h-16 w-16 text-muted-foreground/25 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Cerca su Spotify</h2>
          <p className="text-sm text-muted-foreground">Canzoni, artisti, album e playlist</p>
        </div>
      ) : !hasResults && !isLoading && !isFetching && showSearch ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <Search className="h-14 w-14 text-muted-foreground/25 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Nessun risultato</h2>
          <p className="text-sm text-muted-foreground">Prova parole chiave diverse</p>
        </div>
      ) : hasResults && showSearch ? (
        <Tabs defaultValue="all">
          <TabsList className="grid grid-cols-5 w-full max-w-sm">
            <TabsTrigger value="all">Tutti</TabsTrigger>
            <TabsTrigger value="tracks">Brani</TabsTrigger>
            <TabsTrigger value="artists">Artisti</TabsTrigger>
            <TabsTrigger value="albums">Album</TabsTrigger>
            <TabsTrigger value="playlists">Playlist</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-5 mt-4">
            {tracks.length > 0 && (
              <section>
                <h2 className="text-base font-semibold mb-2">Brani</h2>
                <div className="space-y-1">
                  {tracks.slice(0, 6).map(t => <TrackRow key={t.id} track={t} />)}
                </div>
              </section>
            )}
            {artists.length > 0 && (
              <section>
                <h2 className="text-base font-semibold mb-2">Artisti</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {artists.slice(0, 6).map((a: any) => (
                    <div key={a.id} className="text-center">
                      <div className="aspect-square rounded-full overflow-hidden bg-muted mb-1.5 mx-auto">
                        {a.images?.[0]?.url && <img src={a.images[0].url} alt="" className="object-cover w-full h-full" loading="lazy" />}
                      </div>
                      <p className="text-xs font-medium truncate">{a.name}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </TabsContent>

          <TabsContent value="tracks" className="space-y-1 mt-4">
            {tracks.map(t => <TrackRow key={t.id} track={t} />)}
          </TabsContent>

          <TabsContent value="artists" className="mt-4">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {artists.map((a: any) => (
                <div key={a.id} className="text-center">
                  <div className="aspect-square rounded-full overflow-hidden bg-muted mb-2 mx-auto">
                    {a.images?.[0]?.url && <img src={a.images[0].url} alt="" className="object-cover w-full h-full" loading="lazy" />}
                  </div>
                  <p className="text-xs font-medium truncate">{a.name}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                    <User className="w-2.5 h-2.5" />Artista
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="albums" className="mt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {albums.map((a: any) => (
                <Card key={a.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardContent className="p-3">
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-2">
                      {a.images?.[0]?.url && <img src={a.images[0].url} alt="" className="object-cover w-full h-full" loading="lazy" />}
                    </div>
                    <p className="font-medium text-sm truncate">{a.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.artists?.[0]?.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="playlists" className="mt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {playlists.map((p: any) => (
                <Card key={p.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardContent className="p-3">
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-2">
                      {p.images?.[0]?.url && <img src={p.images[0].url} alt="" className="object-cover w-full h-full" loading="lazy" />}
                    </div>
                    <p className="font-medium text-sm truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground truncate">Di {p.owner?.display_name}</p>
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
