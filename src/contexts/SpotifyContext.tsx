import React, { createContext, useContext, useEffect, useState } from "react";
import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer";
import { usePlaybackState, useAvailableDevices } from "@/hooks/useSpotify";
import { SpotifyPlaybackState } from "@/types/spotify";
import * as spotifyApi from "@/services/spotify-api";

interface SpotifyContextType {
  player: any;
  deviceId: string;
  isReady: boolean;
  playbackState: SpotifyPlaybackState | null;
  isPlaying: boolean;
  currentTrack: any;
  togglePlay: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  seek: (positionMs: number) => void;
  setVolume: (volume: number) => void;
  isIOS: boolean;
}

const SpotifyContext = createContext<SpotifyContextType | undefined>(undefined);

// ── Rileva iOS (stesso check di useSpotifyPlayer) ─────────────────────────────
const IS_IOS =
  /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

export const SpotifyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const webPlayer = useSpotifyPlayer();
  const { data: playbackState, refetch: refetchPlayback } = usePlaybackState();
  const { data: devicesData } = useAvailableDevices();
  const [isPlaying, setIsPlaying] = useState(false);
  const [iosTransferred, setIosTransferred] = useState(false);

  useEffect(() => {
    if (playbackState?.is_playing !== undefined) {
      setIsPlaying(playbackState.is_playing);
    } else if (webPlayer.isPaused !== undefined) {
      setIsPlaying(!webPlayer.isPaused);
    }
  }, [playbackState, webPlayer.isPaused]);

  // ── iOS: trasferisce automaticamente il playback al primo dispositivo ────────
  // Su iOS il Web Playback SDK non è disponibile, quindi "Harmony Hub Web Player"
  // non viene mai registrato. Tentiamo di trasferire il playback verso l'app
  // Spotify nativa sul dispositivo non appena un dispositivo è disponibile.
  useEffect(() => {
    if (!IS_IOS || iosTransferred) return;
    if (!devicesData?.devices?.length) return;

    const devices: any[] = devicesData.devices;

    // Se c'è già un dispositivo attivo, non facciamo nulla
    const alreadyActive = devices.find((d: any) => d.is_active);
    if (alreadyActive) {
      setIosTransferred(true);
      return;
    }

    // Preferisci "Smartphone" o il primo disponibile
    const target =
      devices.find((d: any) => d.type === "Smartphone") ||
      devices.find((d: any) => d.type === "Computer") ||
      devices[0];

    if (!target?.id) return;

    console.info("[SpotifyContext] iOS — trasferimento playback a:", target.name);
    spotifyApi.transferPlayback(target.id, false)
      .then(() => {
        setIosTransferred(true);
        setTimeout(() => refetchPlayback(), 1000);
      })
      .catch((err) => {
        console.warn("[SpotifyContext] Transfer playback fallito:", err.message);
        setIosTransferred(true); // evita retry infiniti
      });
  }, [IS_IOS, iosTransferred, devicesData, refetchPlayback]);

  const value: SpotifyContextType = {
    player: webPlayer.player,
    deviceId: webPlayer.deviceId,
    isReady: webPlayer.isReady,
    playbackState: playbackState || null,
    isPlaying,
    currentTrack: playbackState?.item || webPlayer.currentTrack,
    togglePlay: webPlayer.togglePlay,
    nextTrack: webPlayer.nextTrack,
    previousTrack: webPlayer.previousTrack,
    seek: webPlayer.seek,
    setVolume: webPlayer.setVolume,
    isIOS: IS_IOS,
  };

  return (
    <SpotifyContext.Provider value={value}>
      {children}
    </SpotifyContext.Provider>
  );
};

export const useSpotifyContext = () => {
  const context = useContext(SpotifyContext);
  if (context === undefined) {
    throw new Error("useSpotifyContext must be used within a SpotifyProvider");
  }
  return context;
};
