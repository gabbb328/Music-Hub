import { useCallback, useEffect, useState } from "react";

export type GameType = "quiz" | "bingo";

export interface LeaderboardEntry {
  id: string;
  gameType: GameType;
  playerName: string;
  score: number;
  detail: string;
  playedAt: number;
}

type LeaderboardStore = Record<GameType, LeaderboardEntry[]>;

const STORAGE_KEY = "harmony_hub_leaderboard";
const MAX_ENTRIES_PER_GAME = 20;

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

export function useGameLeaderboard() {
  const [store, setStore] = useState<LeaderboardStore>(load);

  useEffect(() => {
    save(store);
  }, [store]);

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
