import { useState, useEffect } from "react";

export type LyricsTheme =
  | "album"
  | "obsidian"
  | "cyber"
  | "sunset"
  | "midnight"
  | "emerald"
  | "glass";

export type LyricsFontFamily = "sans" | "outfit" | "serif" | "mono";
export type LyricsFontSize = "sm" | "md" | "lg" | "xl";
export type LyricsHighlightStyle = "normal" | "stack" | "fisheye" | "verci-custom";
export type LyricsAlignment = "center" | "left";
export type LyricsBackgroundFx = "blur" | "mesh" | "radial" | "solid";
export type LyricsLineSpacing = "compact" | "normal" | "relaxed";

export interface LyricsSettings {
  theme: LyricsTheme;
  fontFamily: LyricsFontFamily;
  fontSize: LyricsFontSize;
  highlightStyle: LyricsHighlightStyle;
  alignment: LyricsAlignment;
  backgroundFx: LyricsBackgroundFx;
  lineSpacing: LyricsLineSpacing;
  showTranslation: boolean;
}

const DEFAULT_SETTINGS: LyricsSettings = {
  theme: "album",
  fontFamily: "outfit",
  fontSize: "lg",
  highlightStyle: "fisheye",
  alignment: "center",
  backgroundFx: "blur",
  lineSpacing: "normal",
  showTranslation: false,
};

const STORAGE_KEY = "harmony_verci_lyrics_settings_v1";

export function useLyricsSettings() {
  const [settings, setSettings] = useState<LyricsSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn("Failed to load lyrics settings from localStorage", e);
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn("Failed to save lyrics settings to localStorage", e);
    }
  }, [settings]);

  const updateSetting = <K extends keyof LyricsSettings>(
    key: K,
    value: LyricsSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return {
    settings,
    updateSetting,
    resetSettings,
  };
}
