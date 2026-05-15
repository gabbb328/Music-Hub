import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, Trophy, Music, Play, Check, X, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTopTracks, usePlayMutation } from "@/hooks/useSpotify";
import { useSpotifyContext } from "@/contexts/SpotifyContext";
import { useToast } from "@/hooks/use-toast";

interface Question {
  correctTrack: any;
  options: any[];
}

export default function MusicQuizContent({ onStateChange }: { onStateChange?: (active: boolean) => void }) {
  const [gameState, setGameState] = useState<"setup" | "playing" | "results">("setup");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [answered, setAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const { data: topTracksData, isLoading: loadingTracks } = useTopTracks("medium_term", 50);
  const { deviceId } = useSpotifyContext();
  const playMutation = usePlayMutation();
  const { toast } = useToast();

  const startQuiz = useCallback(() => {
    if (!topTracksData?.items || topTracksData.items.length < 4) {
      toast({ title: "Pochi brani", description: "Hai bisogno di almeno 4 brani nei tuoi preferiti per giocare.", variant: "destructive" });
      return;
    }

    const tracks = [...topTracksData.items].sort(() => Math.random() - 0.5);
    const newQuestions: Question[] = [];

    for (let i = 0; i < 10
      ; i++) {
      const correctTrack = tracks[i];
      const otherOptions = tracks.filter(t => t.id !== correctTrack.id).sort(() => Math.random() - 0.5).slice(0, 3);
      const options = [correctTrack, ...otherOptions].sort(() => Math.random() - 0.5);
      newQuestions.push({ correctTrack, options });
    }

    setQuestions(newQuestions);
    setGameState("playing");
    onStateChange?.(true);
    setCurrentIndex(0);
    setScore(0);
    nextQuestion(newQuestions[0]);
  }, [topTracksData, toast]);

  const nextQuestion = async (q: Question) => {
    setAnswered(false);
    setSelectedOption(null);
    setTimeLeft(10);
    
    if (deviceId && q.correctTrack.uri) {
      try {
        await playMutation.mutateAsync({ 
          deviceId, 
          uris: [q.correctTrack.uri],
          offset: { position: 0 }
        });
      } catch (e) {
        console.error("Playback failed for quiz", e);
      }
    }
  };

  useEffect(() => {
    if (gameState === "playing" && timeLeft > 0 && !answered) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !answered) {
      handleAnswer(null);
    }
  }, [timeLeft, gameState, answered]);

  const handleAnswer = (trackId: string | null) => {
    if (answered) return;
    setAnswered(true);
    setSelectedOption(trackId);
    
    if (trackId === questions[currentIndex].correctTrack.id) {
      setScore(s => s + 1);
      toast({ title: "Corretto!", variant: "default" });
    } else {
      toast({ title: "Sbagliato!", description: `Era: ${questions[currentIndex].correctTrack.name}`, variant: "destructive" });
    }

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        nextQuestion(questions[currentIndex + 1]);
      } else {
        setGameState("results");
        onStateChange?.(false);
      }
    }, 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
              <Gamepad2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Music Quiz</h1>
              <p className="text-muted-foreground">Metti alla prova la tua conoscenza musicale!</p>
            </div>
          </div>
          {gameState === "playing" && (
            <div className="text-right">
              <p className="text-sm font-bold uppercase text-muted-foreground">Punteggio</p>
              <p className="text-2xl font-black text-primary">{score} / {questions.length}</p>
            </div>
          )}
        </div>

        {gameState === "setup" && (
          <Card className="p-8 border-border/40 bg-card/50 backdrop-blur-sm space-y-6 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Music className="w-10 h-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Pronto per la sfida?</h2>
              <p className="text-muted-foreground max-w-md">
                Pescheremo 10 brani dai tuoi artisti preferiti. 
                Hai 10 secondi per indovinare il titolo mentre la musica suona!
              </p>
            </div>
            
            <Button 
              onClick={startQuiz} 
              disabled={loadingTracks || !deviceId}
              className="h-14 px-10 text-lg rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
            >
              {loadingTracks ? <Loader2 className="w-5 h-5 animate-spin" /> : "Inizia il Quiz"}
            </Button>
            
            {!deviceId && (
              <p className="text-xs text-destructive font-medium flex items-center gap-1">
                <X className="w-3 h-3" /> Assicurati che Spotify sia attivo su un dispositivo.
              </p>
            )}
          </Card>
        )}

        {gameState === "playing" && questions[currentIndex] && (
          <div className="space-y-8">
            <div className="relative h-64 rounded-3xl overflow-hidden border border-primary/20 shadow-2xl">
              {/* Sfondo sfocato copertina */}
              <div className="absolute inset-0">
                <img 
                  src={questions[currentIndex].correctTrack.album.images[0].url} 
                  className={`w-full h-full object-cover blur-3xl transition-opacity duration-1000 ${answered ? "opacity-40" : "opacity-100"}`} 
                />
                <div className="absolute inset-0 bg-black/40" />
              </div>
              
              <div className="relative h-full flex flex-col items-center justify-center text-center space-y-4 p-8">
                <AnimatePresence mode="wait">
                  {!answered ? (
                    <motion.div 
                      key="timer"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 1.2, opacity: 0 }}
                      className="relative"
                    >
                      <div className="w-24 h-24 rounded-full border-4 border-white/20 flex items-center justify-center">
                        <span className={`text-4xl font-black ${timeLeft <= 3 ? "text-red-500 animate-pulse" : "text-white"}`}>
                          {timeLeft}
                        </span>
                      </div>
                      <div className="mt-4 text-white/80 font-medium uppercase tracking-widest text-xs">
                        Chi è l'artista?
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="answer"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="flex flex-col items-center gap-4"
                    >
                      <img 
                        src={questions[currentIndex].correctTrack.album.images[0].url} 
                        className="w-32 h-32 rounded-xl shadow-2xl border-2 border-white/50"
                      />
                      <div className="space-y-1">
                        <h3 className="text-2xl font-bold text-white">{questions[currentIndex].correctTrack.name}</h3>
                        <p className="text-white/70">{questions[currentIndex].correctTrack.artists[0].name}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {questions[currentIndex].options.map((option) => {
                const isCorrect = option.id === questions[currentIndex].correctTrack.id;
                const isSelected = selectedOption === option.id;
                
                let variant: "outline" | "default" | "secondary" = "outline";
                if (answered) {
                  if (isCorrect) variant = "default";
                  else if (isSelected) variant = "secondary";
                }

                return (
                  <Button 
                    key={option.id} 
                    variant={variant}
                    disabled={answered}
                    onClick={() => handleAnswer(option.id)}
                    className={`h-20 text-lg justify-start px-8 rounded-2xl border-2 transition-all ${
                      answered && isCorrect ? "bg-green-600 border-green-400 text-white scale-105 z-10" : ""
                    } ${
                      answered && isSelected && !isCorrect ? "bg-red-600 border-red-400 text-white opacity-70" : ""
                    }`}
                  >
                    <div className="flex flex-col items-start text-left truncate">
                      <span className="font-bold truncate w-full">{option.name}</span>
                      <span className="text-sm opacity-60 truncate w-full">{option.artists[0].name}</span>
                    </div>
                    {answered && isCorrect && <Check className="ml-auto w-6 h-6" />}
                    {answered && isSelected && !isCorrect && <X className="ml-auto w-6 h-6" />}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {gameState === "results" && (
          <Card className="p-12 border-primary/30 bg-primary/5 text-center space-y-8 backdrop-blur-md">
            <div className="space-y-4">
              <div className="w-24 h-24 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto">
                <Trophy className="w-12 h-12 text-yellow-500" />
              </div>
              <h2 className="text-4xl font-black italic tracking-tighter">QUIZ COMPLETATO!</h2>
              <div className="space-y-1">
                <p className="text-muted-foreground uppercase font-bold tracking-widest text-xs">Il tuo punteggio finale</p>
                <p className="text-6xl font-black text-primary">{score} / {questions.length}</p>
              </div>
            </div>

            <p className="text-muted-foreground">
              {score === questions.length ? "Incredibile! Sei un vero esperto musicale." : 
               score >= 3 ? "Ottimo lavoro! Conosci bene la tua libreria." : 
               "Puoi fare di meglio! Continua ad ascoltare."}
            </p>

            <Button 
              onClick={() => setGameState("setup")} 
              className="h-14 px-10 rounded-full gap-2 text-lg"
            >
              <RefreshCw className="w-5 h-5" /> Gioca Ancora
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}

