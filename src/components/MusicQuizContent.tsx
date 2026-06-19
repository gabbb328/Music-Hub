import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, Trophy, Music, Play, Check, X, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useTopTracks, usePlayMutation } from "@/hooks/useSpotify";
import { useSpotifyContext } from "@/contexts/SpotifyContext";
import { useToast } from "@/hooks/use-toast";
import { useGameLeaderboard } from "@/hooks/useGameLeaderboard";

interface Question {
  correctTrack: any;
  options: any[];
}

interface MusicQuizContentProps {
  onStateChange?: (active: boolean) => void;
  playerName: string;
}

export default function MusicQuizContent({ onStateChange, playerName }: MusicQuizContentProps) {
  const [gameState, setGameState] = useState<"setup" | "playing" | "results">("setup");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [answered, setAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [savedScore, setSavedScore] = useState(false);

  const { data: topTracksData, isLoading: loadingTracks } = useTopTracks("medium_term", 50);
  const { deviceId } = useSpotifyContext();
  const playMutation = usePlayMutation();
  const { toast } = useToast();
  const { addEntry } = useGameLeaderboard();

  const startQuiz = useCallback(() => {
    if (!topTracksData?.items || topTracksData.items.length < 4) {
      toast({ title: "Pochi brani", description: "Hai bisogno di almeno 4 brani nei tuoi preferiti per giocare.", variant: "destructive" });
      return;
    }

    const tracks = [...topTracksData.items].sort(() => Math.random() - 0.5);
    const newQuestions: Question[] = [];

    for (let i = 0; i < Math.min(10, tracks.length); i++) {
      const correctTrack = tracks[i];
      const otherOptions = tracks.filter(t => t.id !== correctTrack.id).sort(() => Math.random() - 0.5).slice(0, 3);
      const options = [correctTrack, ...otherOptions].sort(() => Math.random() - 0.5);
      newQuestions.push({ correctTrack, options });
    }

    setQuestions(newQuestions);
    setGameState("playing");
    setSavedScore(false);
    onStateChange?.(true);
    setCurrentIndex(0);
    setScore(0);
    loadQuestion(newQuestions, 0);
  }, [topTracksData, toast]);

  const loadQuestion = async (qs: Question[], idx: number) => {
    setAnswered(false);
    setSelectedOption(null);
    setTimeLeft(10);
    const q = qs[idx];
    if (!q) return;
    if (deviceId && q.correctTrack.uri) {
      try {
        await playMutation.mutateAsync({ deviceId, uris: [q.correctTrack.uri], offset: { position: 0 } });
      } catch (e) {
        console.error("Playback failed for quiz", e);
      }
    }
  };

  useEffect(() => {
    if (gameState !== "playing" || answered) return;
    if (timeLeft <= 0) { handleAnswer(null); return; }
    const t = setTimeout(() => setTimeLeft(tl => tl - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, gameState, answered]);

  const handleAnswer = (trackId: string | null) => {
    if (answered) return;
    setAnswered(true);
    setSelectedOption(trackId);
    const correct = questions[currentIndex]?.correctTrack.id;

    let newScore = score;
    if (trackId === correct) {
      newScore = score + 1;
      setScore(newScore);
      toast({ title: "✅ Corretto!" });
    } else {
      toast({ title: "❌ Sbagliato!", description: `Era: ${questions[currentIndex].correctTrack.name}`, variant: "destructive" });
    }

    setTimeout(() => {
      const nextIdx = currentIndex + 1;
      if (nextIdx < questions.length) {
        setCurrentIndex(nextIdx);
        loadQuestion(questions, nextIdx);
      } else {
        setGameState("results");
        onStateChange?.(false);
        // Salva in classifica automaticamente
        const name = playerName.trim() || "Anonimo";
        addEntry("quiz", name, newScore, `${newScore}/${questions.length}`);
        setSavedScore(true);
      }
    }, 2000);
  };

  const q = questions[currentIndex];

  return (
    <div className="space-y-6">
      {gameState === "setup" && (
        <Card className="p-8 border-border/40 bg-card/50 backdrop-blur-sm space-y-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Music className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Pronto per la sfida?</h2>
            <p className="text-muted-foreground max-w-md">
              10 brani dai tuoi preferiti — 10 secondi per indovinare mentre la musica suona!
            </p>
          </div>
          <Button
            onClick={startQuiz}
            disabled={loadingTracks || !deviceId}
            className="h-14 px-10 text-lg rounded-full shadow-lg shadow-primary/20"
          >
            {loadingTracks ? <Loader2 className="w-5 h-5 animate-spin" /> : "Inizia il Quiz"}
          </Button>
          {!deviceId && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <X className="w-3 h-3" /> Assicurati che Spotify sia attivo su un dispositivo.
            </p>
          )}
        </Card>
      )}

      {gameState === "playing" && q && (
        <div className="space-y-6">
          {/* Barra progresso */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Domanda {currentIndex + 1} / {questions.length}</span>
            <span className="font-bold text-primary">{score} pt</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-border overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${((currentIndex) / questions.length) * 100}%` }}
              transition={{ ease: "easeOut", duration: 0.4 }}
            />
          </div>

          <div className="relative h-56 rounded-3xl overflow-hidden border border-primary/20 shadow-2xl">
            <img src={q.correctTrack.album.images[0]?.url} className={`absolute inset-0 w-full h-full object-cover blur-3xl transition-opacity duration-700 ${answered ? "opacity-30" : "opacity-100"}`} />
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative h-full flex flex-col items-center justify-center text-center p-8 gap-4">
              <AnimatePresence mode="wait">
                {!answered ? (
                  <motion.div key="timer" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.2, opacity: 0 }}>
                    <div className="w-20 h-20 rounded-full border-4 border-white/20 flex items-center justify-center">
                      <span className={`text-4xl font-black ${timeLeft <= 3 ? "text-red-400 animate-pulse" : "text-white"}`}>{timeLeft}</span>
                    </div>
                    <p className="mt-3 text-white/70 font-medium uppercase tracking-widest text-xs">Qual è questo brano?</p>
                  </motion.div>
                ) : (
                  <motion.div key="answer" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col items-center gap-3">
                    <img src={q.correctTrack.album.images[0]?.url} className="w-24 h-24 rounded-xl shadow-2xl border-2 border-white/40" />
                    <div>
                      <h3 className="text-xl font-bold text-white">{q.correctTrack.name}</h3>
                      <p className="text-white/60 text-sm">{q.correctTrack.artists[0].name}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {q.options.map((opt) => {
              const isCorrect = opt.id === q.correctTrack.id;
              const isSelected = selectedOption === opt.id;
              return (
                <Button
                  key={opt.id}
                  variant="outline"
                  disabled={answered}
                  onClick={() => handleAnswer(opt.id)}
                  className={[
                    "h-16 text-base justify-start px-6 rounded-2xl border-2 transition-all",
                    answered && isCorrect ? "bg-green-600 border-green-400 text-white scale-[1.02]" : "",
                    answered && isSelected && !isCorrect ? "bg-red-600 border-red-400 text-white opacity-70" : "",
                  ].filter(Boolean).join(" ")}
                >
                  <div className="flex flex-col items-start text-left truncate flex-1">
                    <span className="font-bold truncate w-full">{opt.name}</span>
                    <span className="text-xs opacity-60 truncate w-full">{opt.artists[0].name}</span>
                  </div>
                  {answered && isCorrect && <Check className="ml-2 w-5 h-5 shrink-0" />}
                  {answered && isSelected && !isCorrect && <X className="ml-2 w-5 h-5 shrink-0" />}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {gameState === "results" && (
        <Card className="p-10 border-primary/30 bg-primary/5 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto">
            <Trophy className="w-10 h-10 text-yellow-500" />
          </div>
          <div>
            <h2 className="text-3xl font-black italic tracking-tighter">QUIZ COMPLETATO!</h2>
            <p className="text-5xl font-black text-primary mt-2">{score} / {questions.length}</p>
            <p className="text-muted-foreground mt-2">
              {score === questions.length ? "Perfetto! Sei un enciclopedia musicale 🎯" :
               score >= 7 ? "Ottimo lavoro! 🔥" :
               score >= 4 ? "Non male, continua ad ascoltare 🎧" :
               "Ci vuole allenamento! 💪"}
            </p>
          </div>
          {savedScore && <p className="text-xs text-muted-foreground">✅ Punteggio salvato in classifica come <strong>{playerName || "Anonimo"}</strong></p>}
          <Button onClick={() => setGameState("setup")} className="h-12 px-8 rounded-full gap-2">
            <RefreshCw className="w-4 h-4" /> Gioca Ancora
          </Button>
        </Card>
      )}
    </div>
  );
}
