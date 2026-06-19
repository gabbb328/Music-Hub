// ============================================================
// FEATURE TYPES — Harmony Hub Extended Features
// ============================================================

// ── FASE 1 · GEM Overlay ──────────────────────────────────────

/** Le emoji predefinite del GEM Overlay. Il tipo è string per supportare emoji personalizzate. */
export type GemEmoji = string;

export interface GemReaction {
  id: string;
  emoji: GemEmoji;
  userId: string;
  timestamp: number;
  /** Posizione X randomica 0-100 (%) */
  x: number;
}

export interface GemPayload {
  type: "GEM_REACTION";
  reaction: GemReaction;
}

// ── FASE 1 · Mood Calendar ────────────────────────────────────

export type MoodId =
  | "energetic"
  | "happy"
  | "relaxed"
  | "moody"
  | "party"
  | "focus"
  | "custom";

export interface MoodEntry {
  /** ISO date string, key usato nel localStorage — es. "2024-07-15" */
  date: string;
  moodId: MoodId;
  moodLabel: string;
  /** Hex colore associato al mood */
  color: string;
  /** Tracce ascoltate quel giorno (opzionale) */
  tracks?: Array<{ id: string; name: string; artist: string }>;
  /** Nota libera dell'utente */
  note?: string;
}

export type MoodCalendarData = Record<string, MoodEntry>;

// ── FASE 2 · Time Machine ─────────────────────────────────────

export type Era =
  | "60s"
  | "70s"
  | "80s"
  | "90s"
  | "2000s"
  | "2010s"
  | "cyberpunk";

export interface EraConfig {
  id: Era;
  label: string;
  /** Anni "reali" per il filtro sui brani */
  yearRange: [number, number];
  /** Classe CSS applicata al wrapper principale */
  filterClass: string;
  /** Palette colori per l'header/badge */
  accent: string;
  description: string;
}

// ── FASE 3 · Gamification ─────────────────────────────────────

export type QuizCategory = "artist" | "year" | "album" | "genre";

export interface QuizQuestion {
  id: string;
  category: QuizCategory;
  prompt: string;
  /** La risposta corretta */
  answer: string;
  /** Tre distrattori */
  distractors: string[];
  /** Traccia che ha generato la domanda */
  trackId: string;
  trackName: string;
  coverUrl: string;
}

export interface QuizSession {
  id: string;
  questions: QuizQuestion[];
  currentIndex: number;
  score: number;
  answers: Record<string, string | null>;
  startedAt: number;
  finishedAt?: number;
}

export type BingoGenre =
  | "Pop"
  | "Rock"
  | "Hip-Hop"
  | "Electronic"
  | "Jazz"
  | "Classical"
  | "R&B"
  | "Metal"
  | "Folk"
  | "Reggae"
  | "Latin"
  | "Country"
  | "Soul"
  | "Funk"
  | "Indie"
  | "Blues"
  | "Punk"
  | "Gospel"
  | "Ambient"
  | "Disco"
  | "Trap"
  | "K-Pop"
  | "Ska"
  | "FREE";

export interface BingoCell {
  genre: BingoGenre;
  marked: boolean;
  /** true solo per la cella centrale */
  isFree?: boolean;
}

export interface BingoCard {
  cells: BingoCell[][];
  /** Riga vinte */
  wonLines: number[];
  /** Colonne vinte */
  wonCols: number[];
  /** Diagonali vinte */
  wonDiags: Array<"main" | "anti">;
  hasWon: boolean;
}
