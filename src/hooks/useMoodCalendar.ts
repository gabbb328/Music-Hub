/**
 * useMoodCalendar — v2
 *
 * Aggiunge il rilevamento automatico del mood basato sui brani ascoltati oggi.
 *
 * Logica auto-detect:
 *  - Legge i brani recenti da Spotify (passati come parametro)
 *  - Conta i generi/caratteristiche inferite dal nome artista/track
 *  - Mappa a un MoodId e salva automaticamente per oggi
 *  - L'utente può sempre fare override manuale
 */

import { useCallback, useEffect, useState } from "react";
import type { MoodCalendarData, MoodEntry, MoodId } from "@/types/features";

const STORAGE_KEY = "harmony_hub_mood_calendar";

export const MOOD_COLORS: Record<MoodId, string> = {
  energetic: "#facc15",
  happy:     "#4ade80",
  relaxed:   "#60a5fa",
  moody:     "#a78bfa",
  party:     "#f472b6",
  focus:     "#34d399",
  custom:    "#fb923c",
};

export const MOOD_META: Record<MoodId, { label: string; emoji: string }> = {
  energetic: { label: "Energico",    emoji: "⚡" },
  happy:     { label: "Felice",      emoji: "😊" },
  relaxed:   { label: "Rilassato",   emoji: "☕" },
  moody:     { label: "Malinconico", emoji: "🌧️" },
  party:     { label: "Festivo",     emoji: "🎉" },
  focus:     { label: "Concentrato", emoji: "🎧" },
  custom:    { label: "Misto",       emoji: "🎨" },
};

// ── Keyword → mood mapping ────────────────────────────────────
// Analizza nome artista e titolo brano cercando keyword
const MOOD_KEYWORDS: Record<MoodId, string[]> = {
  energetic: ["rock", "metal", "punk", "run", "power", "gym", "workout", "fast", "speed", "rage", "fight", "beast", "hard", "heavy"],
  happy:     ["happy", "sunshine", "summer", "dance", "joy", "love", "wonderful", "beautiful", "smile", "fun", "good"],
  relaxed:   ["chill", "calm", "sleep", "soft", "acoustic", "lofi", "lo-fi", "ambient", "peaceful", "slow", "night", "rain", "coffee"],
  moody:     ["sad", "cry", "tears", "pain", "dark", "alone", "miss", "lost", "broken", "hurt", "lonely", "blue", "grey"],
  party:     ["party", "club", "disco", "edm", "rave", "beat", "bass", "banger", "hype", "trap", "bounce"],
  focus:     ["study", "focus", "work", "deep", "concentrate", "instrumental", "classical", "jazz", "piano", "productive"],
  custom:    [],
};

/**
 * Inferisce un MoodId da una lista di brani Spotify recenti.
 * Conta i punti per ogni mood e restituisce quello con punteggio più alto.
 */
export function inferMoodFromTracks(
  tracks: Array<{ name: string; artists: Array<{ name: string }> }>
): MoodId {
  const scores: Record<MoodId, number> = {
    energetic: 0, happy: 0, relaxed: 0,
    moody: 0, party: 0, focus: 0, custom: 0,
  };

  for (const track of tracks) {
    const text = [
      track.name,
      ...track.artists.map((a) => a.name),
    ].join(" ").toLowerCase();

    for (const [moodId, keywords] of Object.entries(MOOD_KEYWORDS) as [MoodId, string[]][]) {
      for (const kw of keywords) {
        if (text.includes(kw)) scores[moodId] += 1;
      }
    }
  }

  // Se nessun keyword ha fatto punti, uso "custom"
  const best = (Object.entries(scores) as [MoodId, number][])
    .sort((a, b) => b[1] - a[1])[0];

  if (best[1] === 0) return "custom";
  return best[0];
}

// ── Helpers storage ───────────────────────────────────────────

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadFromStorage(): MoodCalendarData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MoodCalendarData) : {};
  } catch {
    return {};
  }
}

function saveToStorage(data: MoodCalendarData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    console.warn("[MoodCalendar] localStorage non disponibile.");
  }
}

// ── Hook ──────────────────────────────────────────────────────

export function useMoodCalendar() {
  const [calendar, setCalendar] = useState<MoodCalendarData>(loadFromStorage);

  useEffect(() => {
    saveToStorage(calendar);
  }, [calendar]);

  const saveMood = useCallback(
    (
      moodId: MoodId,
      moodLabel: string,
      options?: { date?: string; tracks?: MoodEntry["tracks"]; note?: string }
    ) => {
      const date = options?.date ?? todayKey();
      const entry: MoodEntry = {
        date,
        moodId,
        moodLabel,
        color: MOOD_COLORS[moodId],
        tracks: options?.tracks,
        note: options?.note,
      };
      setCalendar((prev) => ({ ...prev, [date]: entry }));
    },
    []
  );

  /**
   * Salva automaticamente il mood di oggi calcolato dai brani recenti.
   * Non sovrascrive se l'utente ha già fatto un override manuale
   * (segnalato da entry.autoDetected === false).
   */
  const autoSaveMood = useCallback(
    (
      tracks: Array<{ name: string; artists: Array<{ name: string }> }>,
      trackRefs?: MoodEntry["tracks"]
    ) => {
      const today = todayKey();
      setCalendar((prev) => {
        // Se l'entry di oggi esiste ed è stata impostata manualmente, non toccare
        const existing = prev[today] as any;
        if (existing && existing.autoDetected === false) return prev;

        if (tracks.length === 0) return prev;

        const moodId = inferMoodFromTracks(tracks);
        const meta = MOOD_META[moodId];
        const entry: MoodEntry & { autoDetected: boolean } = {
          date: today,
          moodId,
          moodLabel: meta.label,
          color: MOOD_COLORS[moodId],
          tracks: trackRefs,
          note: prev[today]?.note,
          autoDetected: true,
        };
        return { ...prev, [today]: entry };
      });
    },
    []
  );

  /** Override manuale: marca autoDetected=false così non viene sovrascritto */
  const saveMoodManual = useCallback(
    (
      moodId: MoodId,
      options?: { date?: string; tracks?: MoodEntry["tracks"]; note?: string }
    ) => {
      const date = options?.date ?? todayKey();
      const meta = MOOD_META[moodId];
      const entry = {
        date,
        moodId,
        moodLabel: meta.label,
        color: MOOD_COLORS[moodId],
        tracks: options?.tracks,
        note: options?.note,
        autoDetected: false, // blocca future auto-sovrascritture
      };
      setCalendar((prev) => ({ ...prev, [date]: entry }));
    },
    []
  );

  const removeMood = useCallback((date: string) => {
    setCalendar((prev) => {
      const next = { ...prev };
      delete next[date];
      return next;
    });
  }, []);

  const updateNote = useCallback((date: string, note: string) => {
    setCalendar((prev) => {
      if (!prev[date]) return prev;
      return { ...prev, [date]: { ...prev[date], note } };
    });
  }, []);

  const clearAll = useCallback(() => setCalendar({}), []);

  const stats = useCallback(() => {
    const entries = Object.values(calendar);
    const counts: Record<string, number> = {};
    for (const e of entries) {
      counts[e.moodId] = (counts[e.moodId] ?? 0) + 1;
    }
    const mostFrequent = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return {
      total: entries.length,
      counts,
      mostFrequentMood: mostFrequent ? (mostFrequent[0] as MoodId) : null,
    };
  }, [calendar]);

  const todayEntry = (calendar[todayKey()] ?? null) as (MoodEntry & { autoDetected?: boolean }) | null;

  return {
    calendar,
    todayEntry,
    saveMood,
    saveMoodManual,
    autoSaveMood,
    removeMood,
    updateNote,
    clearAll,
    stats,
  };
}
