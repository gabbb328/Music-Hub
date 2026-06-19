/**
 * LeaderboardContent
 *
 * Classifica separata per Quiz e Bingo.
 * Dati: localStorage tramite useGameLeaderboard.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Medal, Gamepad2, Music2, Trash2, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useGameLeaderboard } from "@/hooks/useGameLeaderboard";
import type { GameType, LeaderboardEntry } from "@/hooks/useGameLeaderboard";

const MEDAL_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];
const MEDAL_LABELS = ["🥇", "🥈", "🥉"];

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function EntryRow({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  const isTop3 = rank <= 3;
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.04 }}
      className={[
        "flex items-center gap-4 px-4 py-3 rounded-xl border transition-colors",
        isTop3
          ? "bg-card border-border/60"
          : "bg-card/40 border-border/20 hover:border-border/40",
      ].join(" ")}
    >
      {/* Rank */}
      <div className="w-8 text-center shrink-0">
        {rank <= 3 ? (
          <span className="text-xl">{MEDAL_LABELS[rank - 1]}</span>
        ) : (
          <span className="text-sm font-bold text-muted-foreground">#{rank}</span>
        )}
      </div>

      {/* Nome */}
      <div className="flex-1 min-w-0">
        <p
          className="font-semibold truncate"
          style={isTop3 ? { color: MEDAL_COLORS[rank - 1] } : {}}
        >
          {entry.playerName}
        </p>
        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
          <Clock className="w-3 h-3" />
          {formatDate(entry.playedAt)}
        </p>
      </div>

      {/* Punteggio */}
      <div className="text-right shrink-0">
        <p className="text-lg font-black tabular-nums" style={isTop3 ? { color: MEDAL_COLORS[rank - 1] } : {}}>
          {entry.score}
        </p>
        <p className="text-xs text-muted-foreground">{entry.detail}</p>
      </div>
    </motion.div>
  );
}

export default function LeaderboardContent() {
  const { quizEntries, bingoEntries, clearLeaderboard } = useGameLeaderboard();
  const [tab, setTab] = useState<GameType>("quiz");
  const [confirmClear, setConfirmClear] = useState(false);

  const entries = tab === "quiz" ? quizEntries : bingoEntries;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-yellow-500" />
        </div>
        <h2 className="text-xl font-bold">Classifica</h2>
      </div>

      {/* Tab selector */}
      <div className="flex gap-2 p-1 bg-muted/50 rounded-xl w-fit">
        {(["quiz", "bingo"] as GameType[]).map((g) => (
          <button
            key={g}
            onClick={() => { setTab(g); setConfirmClear(false); }}
            className={[
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              tab === g
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {g === "quiz" ? <Gamepad2 className="w-4 h-4" /> : <Music2 className="w-4 h-4" />}
            {g === "quiz" ? "Music Quiz" : "Music Bingo"}
          </button>
        ))}
      </div>

      {/* Entries */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-2"
        >
          {entries.length === 0 ? (
            <Card className="p-10 text-center border-border/30 bg-card/30">
              <Medal className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                Nessun punteggio salvato per{" "}
                {tab === "quiz" ? "il Quiz" : "il Bingo"} ancora.
                <br />
                Gioca una partita per apparire qui!
              </p>
            </Card>
          ) : (
            entries.map((entry, i) => (
              <EntryRow key={entry.id} entry={entry} rank={i + 1} />
            ))
          )}
        </motion.div>
      </AnimatePresence>

      {/* Clear */}
      {entries.length > 0 && (
        <div className="pt-2">
          {confirmClear ? (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">Cancellare la classifica {tab === "quiz" ? "Quiz" : "Bingo"}?</span>
              <button
                onClick={() => { clearLeaderboard(tab); setConfirmClear(false); }}
                className="text-destructive font-medium hover:underline"
              >
                Sì, cancella
              </button>
              <button onClick={() => setConfirmClear(false)} className="text-muted-foreground hover:underline">
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-destructive/70 transition-colors"
            >
              <Trash2 className="w-3 h-3" /> Cancella classifica {tab === "quiz" ? "Quiz" : "Bingo"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
