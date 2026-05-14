import { useState } from "react";
import { Sparkles, Smile, Cloud, Zap, Coffee, Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSpotifyContext } from "@/contexts/SpotifyContext";
import * as spotifyApi from "@/services/spotify-api";
import { usePlayMutation } from "@/hooks/useSpotify";
import { useToast } from "@/hooks/use-toast";

export default function MoodGeneratorContent() {
  const { deviceId } = useSpotifyContext();
  const playMutation = usePlayMutation();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const moods = [
    { id: "energetic", label: "Energico", icon: Zap, color: "text-yellow-400", params: { min_energy: 0.7, min_valence: 0.5 } },
    { id: "happy",     label: "Felice",   icon: Smile, color: "text-green-400", params: { min_valence: 0.7 } },
    { id: "relaxed",   label: "Rilassato", icon: Coffee, color: "text-blue-400", params: { max_energy: 0.4, target_valence: 0.5 } },
    { id: "moody",     label: "Malinconico", icon: Cloud, color: "text-purple-400", params: { max_valence: 0.3 } },
  ];

  const handleMoodSelect = async (mood: typeof moods[0]) => {
    if (!deviceId) {
      toast({ title: "Nessun dispositivo attivo", description: "Avvia Spotify su un dispositivo per generare la playlist.", variant: "destructive" });
      return;
    }

    setLoading(mood.id);
    try {
      const recommendations = await spotifyApi.getRecommendations({
        limit: 20,
        ...mood.params,
        seed_genres: ["pop", "rock", "dance", "chill"] // Default seeds
      });

      if (recommendations.tracks && recommendations.tracks.length > 0) {
        const uris = recommendations.tracks.map((t: any) => t.uri);
        await playMutation.mutateAsync({ deviceId, uris });
        toast({ title: `Mood: ${mood.label}`, description: "Abbiamo generato una playlist per te!" });
      }
    } catch (error) {
      console.error("Mood generation failed:", error);
      toast({ title: "Errore", description: "Impossibile generare la playlist.", variant: "destructive" });
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
              onClick={() => handleMoodSelect(mood)}
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
      </div>
    </div>
  );
}
