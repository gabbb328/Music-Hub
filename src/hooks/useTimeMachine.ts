import { useCallback, useEffect, useState } from "react";
import type { Era, EraConfig } from "@/types/features";
import type { SpotifyTrack } from "@/types/spotify";

export const ERA_CONFIGS: EraConfig[] = [
  {
    id: "60s",
    label: "Anni '60",
    yearRange: [1960, 1969],
    filterClass: "era-60s",
    accent: "#d97706",
    description: "Soul, Rock'n'Roll, la British Invasion",
  },
  {
    id: "70s",
    label: "Anni '70",
    yearRange: [1970, 1979],
    filterClass: "era-70s",
    accent: "#b45309",
    description: "Disco, Funk, Progressive Rock",
  },
  {
    id: "80s",
    label: "Anni '80",
    yearRange: [1980, 1989],
    filterClass: "era-80s",
    accent: "#7c3aed",
    description: "Synthpop, New Wave, Hair Metal — stile CRT/Glitch",
  },
  {
    id: "90s",
    label: "Anni '90",
    yearRange: [1990, 1999],
    filterClass: "era-90s",
    accent: "#065f46",
    description: "Grunge, Hip-Hop, Britpop — bassa saturazione",
  },
  {
    id: "2000s",
    label: "Anni 2000",
    yearRange: [2000, 2009],
    filterClass: "era-2000s",
    accent: "#1d4ed8",
    description: "Nu-Metal, Emo, R&B, Pop digitale",
  },
  {
    id: "2010s",
    label: "Anni 2010",
    yearRange: [2010, 2019],
    filterClass: "era-2010s",
    accent: "#0891b2",
    description: "EDM, Trap, Indie, Streaming era",
  },
  {
    id: "cyberpunk",
    label: "Cyberpunk",
    yearRange: [2020, 2099],
    filterClass: "era-cyberpunk",
    accent: "#06b6d4",
    description: "Hyperpop, Dark Electro, Noise — glitch neon",
  },
];

const CSS_FILTER_CLASSES = ERA_CONFIGS.map((e) => e.filterClass);


export function useTimeMachine() {
  const [activeEra, setActiveEra] = useState<Era | null>(null);
  const [sliderIndex, setSliderIndex] = useState<number>(3); // default: Anni '90

  const currentConfig = activeEra
    ? ERA_CONFIGS.find((e) => e.id === activeEra) ?? null
    : null;

  useEffect(() => {
    const root = document.documentElement;
    CSS_FILTER_CLASSES.forEach((cls) => root.classList.remove(cls));
    if (activeEra) {
      const config = ERA_CONFIGS.find((e) => e.id === activeEra);
      if (config) root.classList.add(config.filterClass);
    }
    return () => {
      CSS_FILTER_CLASSES.forEach((cls) => root.classList.remove(cls));
    };
  }, [activeEra]);

  const handleSliderChange = useCallback((index: number) => {
    setSliderIndex(index);
    const era = ERA_CONFIGS[index];
    if (era) setActiveEra(era.id);
  }, []);

  const resetEra = useCallback(() => {
    setActiveEra(null);
  }, []);

  const filterTracksByEra = useCallback(
    (tracks: Array<SpotifyTrack & { album: { release_date?: string } }>): typeof tracks => {
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
    activeEra,
    currentConfig,
    sliderIndex,
    handleSliderChange,
    resetEra,
    filterTracksByEra,
    eras: ERA_CONFIGS,
  };
}
