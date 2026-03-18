import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Play, Pause, SkipForward, Loader2, Mic, Music2,
  TrendingUp, Zap, Radio, ChevronRight, RefreshCw, Headphones
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  useTopTracks, useTopArtists, usePlayMutation, usePauseMutation,
  useNextMutation, usePlaybackState, useAudioFeatures
} from "@/hooks/useSpotify";
import { useToast } from "@/hooks/use-toast";

// Chiama Claude API per consigli mix
async function getAIMixAdvice(currentTrack: any, audioFeatures: any, topTracks: any[]): Promise<string[]> {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: `Sei un DJ professionale e esperto di musica. Dai consigli brevi e pratici su come mixare brani. 
Rispondi SOLO con un JSON array di stringhe, senza markdown, senza backtick. 
Esempio: ["Consiglio 1", "Consiglio 2", "Consiglio 3", "Consiglio 4"]`,
        messages: [{
          role: "user",
          content: `Il brano in riproduzione è: "${currentTrack?.name}" di ${currentTrack?.artists?.[0]?.name}.
BPM: ${audioFeatures?.tempo ? Math.round(audioFeatures.tempo) : "sconosciuto"}.
Tonalità: ${audioFeatures ? ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"][audioFeatures.key] : "sconosciuta"} ${audioFeatures?.mode ? "Maggiore" : "Minore"}.
Energia: ${audioFeatures ? Math.round(audioFeatures.energy * 100) : "?"}%.

I 5 brani preferiti dell'utente: ${topTracks.slice(0,5).map((t: any) => `"${t.name}" di ${t.artists?.[0]?.name}`).join(", ")}.

Dai 4 consigli specifici su: quali brani mixare prima/dopo, tecniche di transizione, BPM compatibili, e mood da creare. Sii specifico con nomi di artisti/generi simili.`
        }]
      })
    });
    const data = await response.json();
    const text = data.content?.[0]?.text || "[]";
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (e) {
    return [
      "Cerca brani con BPM simile (±5%) per transizioni fluide",
      "Usa la stessa tonalità o una relativa per armonia",
      "Considera il mood: energia simile o graduale transizione",
      "I brani dello stesso artista o genere funzionano sempre"
    ];
  }
}

export default function AIDJContent({ onPlayTrack }: { onPlayTrack?: (t: any) => void } = {}) {
  const [isActive, setIsActive]       = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [energy, setEnergy]           = useState(70);
  const [variety, setVariety]         = useState(50);
  const [aiAdvice, setAiAdvice]       = useState<string[]>([]);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [adviceTimestamp, setAdviceTimestamp] = useState<Date | null>(null);

  const { data: topTracksData }  = useTopTracks("medium_term", 50);
  const { data: topArtistsData } = useTopArtists("medium_term", 20);
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
    if (variety < 50) pl = pl.slice(0, Math.max(10, Math.floor(pl.length * variety / 100)));
    else pl = pl.sort(() => Math.random() - 0.5);
    return pl.slice(0, 50).map((t: any) => t.uri).filter(Boolean);
  };

  const startDJ = async () => {
    const uris = generatePlaylist();
    if (!uris.length) { toast({ title: "Dati insufficienti", description: "Ascolta più musica per attivare l'AI DJ", variant: "destructive" }); return; }
    try {
      setIsActive(true);
      setCurrentMessage(djMessages[0]);
      await playMutation.mutateAsync({ uris });
      toast({ title: "🎛 AI DJ attivo!", description: "Mix personalizzato in corso" });
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

  const fetchAdvice = async () => {
    if (!currentTrack) { toast({ title: "Riproduci un brano prima", variant: "destructive" }); return; }
    setLoadingAdvice(true);
    try {
      const advice = await getAIMixAdvice(currentTrack, audioFeatures, topTracks);
      setAiAdvice(advice);
      setAdviceTimestamp(new Date());
    } finally { setLoadingAdvice(false); }
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

        {/* AI Mix Advice */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Consigli DJ (AI)
            </h3>
            <button onClick={fetchAdvice} disabled={loadingAdvice || !currentTrack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-xs font-semibold hover:bg-primary/30 transition-colors disabled:opacity-50">
              {loadingAdvice ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              {aiAdvice.length ? "Aggiorna" : "Genera consigli"}
            </button>
          </div>

          {loadingAdvice ? (
            <div className="flex items-center justify-center py-8 gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-sm">Claude sta analizzando il brano…</span>
            </div>
          ) : aiAdvice.length > 0 ? (
            <div className="space-y-2">
              {adviceTimestamp && (
                <p className="text-[10px] text-muted-foreground">Generato alle {adviceTimestamp.toLocaleTimeString()}</p>
              )}
              {aiAdvice.map((tip, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-secondary/40 border border-border/20">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                  </div>
                  <p className="text-sm leading-relaxed">{tip}</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground space-y-2">
              <Headphones className="w-10 h-10 opacity-30" />
              <p className="text-sm">Riproduci un brano e clicca "Genera consigli"</p>
              <p className="text-xs">Claude AI analizzerà BPM, tonalità e stile</p>
            </div>
          )}
        </div>

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
