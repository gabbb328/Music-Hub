/**
 * useGameLeaderboard
 *
 * Classifica locale (localStorage) separata per "quiz" e "bingo".
 * Nessun backend — puramente client-side.
 *
 * Storage key: "harmony_hub_leaderboard"
 */

import { useCallback, useEffect, useState } from "react";

export type GameType = "quiz" | "bingo";

export interface LeaderboardEntry {
  id: string;
  gameType: GameType;
  playerName: string;
  score: number;
  /** Per il quiz: risposte corrette su tot domande — es. "8/10" */
  detail: string;
  playedAt: number; // timestamp ms
}

type LeaderboardStore = Record<GameType, LeaderboardEntry[]>;

const STORAGE_KEY = "harmony_hub_leaderboard";
const MAX_ENTRIES_PER_GAME = 20;

// ── Helpers ───────────────────────────────────────────────────

function load(): LeaderboardStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { quiz: [], bingo: [] };
    const parsed = JSON.parse(raw) as Partial<LeaderboardStore>;
    return {
      quiz: parsed.quiz ?? [],
      bingo: parsed.bingo ?? [],
    };
  } catch {
    return { quiz: [], bingo: [] };
  }
}

function save(data: LeaderboardStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    console.warn("[Leaderboard] localStorage non disponibile.");
  }
}

// ── Hook ──────────────────────────────────────────────────────

export function useGameLeaderboard() {
  const [store, setStore] = useState<LeaderboardStore>(load);

  useEffect(() => {
    save(store);
  }, [store]);

  /** Aggiunge un nuovo punteggio e ordina per score desc */
  const addEntry = useCallback(
    (
      gameType: GameType,
      playerName: string,
      score: number,
      detail: string
    ) => {
      const entry: LeaderboardEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        gameType,
        playerName,
        score,
        detail,
        playedAt: Date.now(),
      };

      setStore((prev) => {
        const updated = [entry, ...prev[gameType]]
          .sort((a, b) => b.score - a.score)
          .slice(0, MAX_ENTRIES_PER_GAME);
        return { ...prev, [gameType]: updated };
      });
    },
    []
  );

  /** Cancella la classifica di un gioco (o entrambe) */
  const clearLeaderboard = useCallback((gameType?: GameType) => {
    if (gameType) {
      setStore((prev) => ({ ...prev, [gameType]: [] }));
    } else {
      setStore({ quiz: [], bingo: [] });
    }
  }, []);

  const quizEntries = store.quiz;
  const bingoEntries = store.bingo;

  return { quizEntries, bingoEntries, addEntry, clearLeaderboard };
}
