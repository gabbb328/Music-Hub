/**
 * GamesContent
 *
 * Hub dei giochi — sostituisce la voce "quiz" nel routing.
 * Tab: Music Quiz | Music Bingo | Classifica
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, Music2, Trophy, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import MusicQuizContent from "@/components/MusicQuizContent";
import MusicBingoContent from "@/components/MusicBingoContent";
import LeaderboardContent from "@/components/LeaderboardContent";

type GameTab = "quiz" | "bingo" | "leaderboard";

const TABS: Array<{ id: GameTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "quiz",        label: "Music Quiz",  icon: Gamepad2 },
  { id: "bingo",       label: "Music Bingo", icon: Music2   },
  { id: "leaderboard", label: "Classifica",  icon: Trophy   },
];

interface GamesContentProps {
  onStateChange?: (active: boolean) => void;
}

export default function GamesContent({ onStateChange }: GamesContentProps) {
  const [activeTab, setActiveTab] = useState<GameTab>("quiz");
  const [playerName, setPlayerName] = useState("");
  const [nameConfirmed, setNameConfirmed] = useState(false);

  // ── Schermata iniziale: inserimento nome ──────────────────

  if (!nameConfirmed) {
    return (
      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-md mx-auto flex flex-col items-center gap-8 pt-16">
          <div className="w-20 h-20 rounded-3xl bg-primary/15 flex items-center justify-center shadow-xl shadow-primary/10">
            <Gamepad2 className="w-10 h-10 text-primary" />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-black tracking-tight">
              <span className="text-gradient-primary">Music</span> Games
            </h1>
            <p className="text-muted-foreground">
              Sfida te stesso con Quiz e Bingo basati sulla tua libreria Spotify.
            </p>
          </div>

          <Card className="w-full p-6 space-y-4 border-border/40 bg-card/60 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm font-medium">
              <User className="w-4 h-4 text-muted-foreground" />
              <span>Come vuoi apparire in classifica?</span>
            </div>
            <Input
              placeholder="Il tuo nome (es. MusicMaster99)"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") setNameConfirmed(true); }}
              className="h-11"
              maxLength={24}
            />
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setNameConfirmed(true)}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:brightness-110 transition-all"
            >
              Entra nei giochi →
            </motion.button>
            <button
              onClick={() => { setPlayerName("Anonimo"); setNameConfirmed(true); }}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Salta — gioca come Anonimo
            </button>
          </Card>
        </div>
      </div>
    );
  }

  // ── Hub principale ────────────────────────────────────────

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
              <Gamepad2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Music Games</h1>
              <p className="text-muted-foreground text-sm">
                Ciao <span className="font-semibold text-foreground">{playerName}</span>! Scegli il tuo gioco.
              </p>
            </div>
          </div>
          <button
            onClick={() => setNameConfirmed(false)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <User className="w-3 h-3" /> Cambia nome
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1.5 p-1.5 bg-muted/40 rounded-2xl">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                layout
                className={[
                  "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/40",
                ].join(" ")}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Contenuto tab */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeTab === "quiz" && (
              <MusicQuizContent
                onStateChange={onStateChange}
                playerName={playerName}
              />
            )}
            {activeTab === "bingo" && (
              <MusicBingoContent playerName={playerName} />
            )}
            {activeTab === "leaderboard" && (
              <LeaderboardContent />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
