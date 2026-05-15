import { useState } from "react";
import { Sparkles, Smile, Cloud, Zap, Coffee, Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSpotifyContext } from "@/contexts/SpotifyContext";
import * as spotifyApi from "@/services/spotify-api";
import { usePlayMutation } from "@/hooks/useSpotify";
import { useToast } from "@/hooks/use-toast";
import MoodPlaylistPanel from "./MoodPlaylistPanel";

export default function MoodGeneratorContent() {
  const { deviceId } = useSpotifyContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  
  // Stati per il pannello
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [generatedTracks, setGeneratedTracks] = useState<any[]>([]);
  const [currentMoodName, setCurrentMoodName] = useState("");

  // Stati per il mood personalizzato
  const [energy, setEnergy] = useState(50);
  const [positivity, setPositivity] = useState(50);
  const [acoustic, setAcoustic] = useState(50);

  const moods = [
    { id: "energetic", label: "Energico", icon: Zap, color: "text-yellow-400", query: "workout upbeat" },
    { id: "happy",     label: "Felice",   icon: Smile, color: "text-green-400", query: "happy feel good" },
    { id: "relaxed",   label: "Rilassato", icon: Coffee, color: "text-blue-400", query: "relax chill" },
    { id: "moody",     label: "Malinconico", icon: Cloud, color: "text-purple-400", query: "sad melancholy" },
    { id: "party",     label: "Festa",    icon: Sparkles, color: "text-pink-400", query: "party dance club" },
    { id: "focus",     label: "Studio",   icon: Loader2, color: "text-emerald-400", query: "focus study lo-fi" },
  ];

  const generateCustomQuery = () => {
    const keywords = [];
    if (energy > 70) keywords.push("workout", "upbeat");
    else if (energy < 30) keywords.push("sleep", "calm");
    else keywords.push("pop");

    if (positivity > 70) keywords.push("happy", "joy");
    else if (positivity < 30) keywords.push("sad", "moody");

    if (acoustic > 70) keywords.push("acoustic", "unplugged");
    else if (acoustic < 30) keywords.push("electronic", "synth");

    return keywords.join(" ");
  };

  const handleGenerate = async (moodId: string, label: string, query: string) => {
    if (!deviceId) {
      toast({ title: "Nessun dispositivo attivo", description: "Avvia Spotify su un dispositivo per generare la playlist.", variant: "destructive" });
      return;
    }

    setLoading(moodId);
    try {
      // Workaround: cerchiamo playlist corrispondenti al mood e peschiamo brani da lì.
      const searchRes = await spotifyApi.search(query, ["playlist"], 10);
      const playlists = searchRes.playlists?.items;
      
      if (!playlists || playlists.length === 0) {
        throw new Error("No playlists found for mood.");
      }

      // Scegli una playlist a caso tra le trovate
      const randomPlaylist = playlists[Math.floor(Math.random() * playlists.length)];
      
      // Recupera le tracce della playlist
      const tracksData = await spotifyApi.getAllPlaylistTracks(randomPlaylist.id);
      
      // Filtra tracce valide, mescolale e prendine fino a 20
      let validTracks = tracksData.filter(t => t.track && t.track.uri);
      validTracks = validTracks.sort(() => 0.5 - Math.random()).slice(0, 20);

      if (validTracks.length > 0) {
        setGeneratedTracks(validTracks.map(t => t.track));
        setCurrentMoodName(label);
        setIsPanelOpen(true);
        toast({ title: `Playlist generata!`, description: `Abbiamo trovato ${validTracks.length} brani perfetti per te.` });
      } else {
        throw new Error("No tracks found in playlist.");
      }
    } catch (error) {
      console.error("Mood generation failed:", error);
      toast({ title: "Errore", description: "Impossibile generare la playlist. Riprova.", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mood Generator</h1>
            <p className="text-muted-foreground">Musica perfetta per ogni tuo stato d'animo.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {moods.map((mood) => (
            <Card 
              key={mood.id} 
              className="p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-accent/50 transition-colors border-border/40 group relative overflow-hidden"
              onClick={() => handleGenerate(mood.id, mood.label, mood.query)}
            >
              {loading === mood.id ? (
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
              ) : (
                <mood.icon className={`w-10 h-10 ${mood.color} group-hover:scale-110 transition-transform`} />
              )}
              <span className="font-medium">{mood.label}</span>
              {loading === mood.id && (
                <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] flex items-center justify-center" />
              )}
            </Card>
          ))}
        </div>
        {/* Mood Personalizzato */}
        <Card className="p-6 md:p-8 mt-8 border-border/40 bg-secondary/10">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-6">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2 mb-1">
                  <Play className="w-5 h-5 text-primary" /> Mood Personalizzato
                </h2>
                <p className="text-sm text-muted-foreground">Regola i parametri per creare una miscela unica.</p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Calmo</span><span>Energia</span><span>Frenetico</span>
                  </div>
                  <input type="range" min="0" max="100" value={energy} onChange={e => setEnergy(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none bg-secondary accent-primary cursor-pointer" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Triste</span><span>Positività</span><span>Felice</span>
                  </div>
                  <input type="range" min="0" max="100" value={positivity} onChange={e => setPositivity(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none bg-secondary accent-primary cursor-pointer" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Elettronico</span><span>Strumenti</span><span>Acustico</span>
                  </div>
                  <input type="range" min="0" max="100" value={acoustic} onChange={e => setAcoustic(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none bg-secondary accent-primary cursor-pointer" />
                </div>
              </div>
            </div>

            <div className="md:w-64 flex flex-col items-center justify-center p-6 bg-background rounded-2xl border border-border/40 shrink-0 text-center">
              <Sparkles className="w-12 h-12 text-primary mb-4 opacity-80" />
              <h3 className="font-bold mb-2">Crea il tuo Mix</h3>
              <p className="text-xs text-muted-foreground mb-6">Cercheremo playlist basate sulle tue preferenze esatte.</p>
              <Button 
                className="w-full rounded-xl font-bold shadow-lg active:scale-95 transition-transform"
                onClick={() => handleGenerate("custom", "Mix Personalizzato", generateCustomQuery())}
                disabled={loading === "custom"}
              >
                {loading === "custom" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2 fill-current" />}
                Genera
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <MoodPlaylistPanel 
        isOpen={isPanelOpen} 
        onClose={() => setIsPanelOpen(false)} 
        tracks={generatedTracks} 
        moodName={currentMoodName} 
      />
    </div>
  );
}
