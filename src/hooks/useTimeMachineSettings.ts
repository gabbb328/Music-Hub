/**
 * useTimeMachineSettings
 *
 * Gestisce lo stato globale del Time Machine (on/off + era scelta)
 * persisto in localStorage così le impostazioni sopravvivono ai refresh.
 *
 * Usato sia da HomeContent (per applicare filtri) che da SettingsPanel (per controllarlo).
 */

import { useCallback, useEffect, useState } from "react";
import type { Era, EraConfig } from "@/types/features";

export const ERA_CONFIGS: EraConfig[] = [
  { id: "60s",      label: "Anni '60",  yearRange: [1960, 1969], filterClass: "era-60s",      accent: "#d97706", description: "Soul, Rock'n'Roll, la British Invasion" },
  { id: "70s",      label: "Anni '70",  yearRange: [1970, 1979], filterClass: "era-70s",      accent: "#b45309", description: "Disco, Funk, Progressive Rock" },
  { id: "80s",      label: "Anni '80",  yearRange: [1980, 1989], filterClass: "era-80s",      accent: "#7c3aed", description: "Synthpop, New Wave — CRT/Glitch" },
  { id: "90s",      label: "Anni '90",  yearRange: [1990, 1999], filterClass: "era-90s",      accent: "#065f46", description: "Grunge, Hip-Hop — bassa saturazione" },
  { id: "2000s",    label: "Anni 2000", yearRange: [2000, 2009], filterClass: "era-2000s",    accent: "#1d4ed8", description: "Nu-Metal, Emo, R&B, Pop digitale" },
  { id: "2010s",    label: "Anni 2010", yearRange: [2010, 2019], filterClass: "era-2010s",    accent: "#0891b2", description: "EDM, Trap, Indie, Streaming era" },
  { id: "cyberpunk",label: "Cyberpunk", yearRange: [2020, 2099], filterClass: "era-cyberpunk",accent: "#06b6d4", description: "Hyperpop, Dark Electro, Noise — neon" },
];

const CSS_FILTER_CLASSES = ERA_CONFIGS.map((e) => e.filterClass);
const STORAGE_KEY = "harmony_hub_time_machine";

interface TimeMachineState {
  enabled: boolean;
  eraIndex: number; // indice in ERA_CONFIGS
}

function loadState(): TimeMachineState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as TimeMachineState;
  } catch {}
  return { enabled: false, eraIndex: 3 }; // default: Anni '90, disattivato
}

function saveState(s: TimeMachineState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

export function useTimeMachineSettings() {
  const [state, setState] = useState<TimeMachineState>(loadState);

  const currentConfig = state.enabled ? (ERA_CONFIGS[state.eraIndex] ?? null) : null;

  // Applica / rimuovi classi CSS su <html>
  useEffect(() => {
    const root = document.documentElement;
    CSS_FILTER_CLASSES.forEach((cls) => root.classList.remove(cls));
    if (currentConfig) root.classList.add(currentConfig.filterClass);
    return () => CSS_FILTER_CLASSES.forEach((cls) => root.classList.remove(cls));
  }, [currentConfig]);

  // Persiste
  useEffect(() => { saveState(state); }, [state]);

  const setEnabled = useCallback((enabled: boolean) => {
    setState((prev) => ({ ...prev, enabled }));
  }, []);

  const setEraIndex = useCallback((eraIndex: number) => {
    setState((prev) => ({ ...prev, eraIndex, enabled: true }));
  }, []);

  /** Filtra tracce per era — usato in HomeContent */
  const filterTracksByEra = useCallback(
    <T extends { album: { release_date?: string } }>(tracks: T[]): T[] => {
      if (!currentConfig) return tracks;
      const [from, to] = currentConfig.yearRange;
      return tracks.filter((t) => {
        const year = parseInt((t.album as any).release_date?.slice(0, 4) ?? "0", 10);
        return year >= from && year <= to;
      });
    },
    [currentConfig]
  );

  return {
    enabled: state.enabled,
    eraIndex: state.eraIndex,
    currentConfig,
    setEnabled,
    setEraIndex,
    filterTracksByEra,
    eras: ERA_CONFIGS,
  };
}
