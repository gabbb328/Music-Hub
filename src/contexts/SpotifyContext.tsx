import React, { createContext, useContext, useEffect, useState } from "react";
import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer";
import { usePlaybackState } from "@/hooks/useSpotify";
import { SpotifyPlaybackState } from "@/types/spotify";

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
}

const SpotifyContext = createContext<SpotifyContextType | undefined>(undefined);

export const SpotifyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const webPlayer = useSpotifyPlayer();
  const { data: playbackState } = usePlaybackState();
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (playbackState?.is_playing !== undefined) {
      setIsPlaying(playbackState.is_playing);
    } else if (webPlayer.isPaused !== undefined) {
      setIsPlaying(!webPlayer.isPaused);
    }
  }, [playbackState, webPlayer.isPaused]);

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
