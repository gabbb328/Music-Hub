import { useEffect, useState, useCallback } from "react";
import { getToken } from "@/services/spotify-auth";

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: any;
  }
}

export interface WebPlaybackState {
  paused: boolean;
  position: number;
  duration: number;
  track_window: {
    current_track: any;
    previous_tracks: any[];
    next_tracks: any[];
  };
}

export const useSpotifyPlayer = () => {
  const [player, setPlayer] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string>("");
  const [isReady, setIsReady] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [currentTrack, setCurrentTrack] = useState<any>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;

    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: "Harmony Hub Web Player",
        getOAuthToken: (cb: (token: string) => void) => {
          cb(token);
        },
        volume: 0.5,
      });

      // Ready
      player.addListener("ready", ({ device_id }: { device_id: string }) => {
        console.log("Ready with Device ID", device_id);
        setDeviceId(device_id);
        setIsReady(true);
      });

      // Not Ready
      player.addListener("not_ready", ({ device_id }: { device_id: string }) => {
        console.log("Device ID has gone offline", device_id);
        setIsReady(false);
      });

      // Player state changed
      player.addListener("player_state_changed", (state: WebPlaybackState | null) => {
        if (!state) return;

        setCurrentTrack(state.track_window.current_track);
        setIsPaused(state.paused);
      });

      // Error handling
      player.addListener("initialization_error", ({ message }: { message: string }) => {
        console.error("Initialization Error:", message);
      });

      player.addListener("authentication_error", ({ message }: { message: string }) => {
        console.error("Authentication Error:", message);
      });

      player.addListener("account_error", ({ message }: { message: string }) => {
        console.error("Account Error:", message);
      });

      player.addListener("playback_error", ({ message }: { message: string }) => {
        console.error("Playback Error:", message);
      });

      player.connect();
      setPlayer(player);
    };

    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, []);

  const togglePlay = useCallback(() => {
    if (player) {
      player.togglePlay();
    }
  }, [player]);

  const nextTrack = useCallback(() => {
    if (player) {
      player.nextTrack();
    }
  }, [player]);

  const previousTrack = useCallback(() => {
    if (player) {
      player.previousTrack();
    }
  }, [player]);

  const seek = useCallback((positionMs: number) => {
    if (player) {
      player.seek(positionMs);
    }
  }, [player]);

  const setVolume = useCallback((volume: number) => {
    if (player) {
      player.setVolume(volume / 100);
    }
  }, [player]);

  return {
    player,
    deviceId,
    isReady,
    isPaused,
    currentTrack,
    togglePlay,
    nextTrack,
    previousTrack,
    seek,
    setVolume,
  };
};
