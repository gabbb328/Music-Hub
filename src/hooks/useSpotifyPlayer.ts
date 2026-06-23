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

const IS_IOS =
  /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

export const useSpotifyPlayer = () => {
  const [player, setPlayer] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string>("");
  const [isReady, setIsReady] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [currentTrack, setCurrentTrack] = useState<any>(null);

  useEffect(() => {
    if (IS_IOS) {
      console.info("[SpotifyPlayer] iOS rilevato — Web Playback SDK non caricato. Uso API REST.");
      return;
    }

    const token = getToken();
    if (!token) return;

    if (document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]')) {
      return;
    }

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;

    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const token = getToken();
      if (!token) return;

      const playerInstance = new window.Spotify.Player({
        name: "Music Hub Web Player",
        getOAuthToken: (cb: (token: string) => void) => {
          const t = getToken();
          if (t) cb(t);
        },
        volume: 0.5,
      });

      playerInstance.addListener("ready", ({ device_id }: { device_id: string }) => {
        console.log("[SpotifyPlayer] Ready with Device ID", device_id);
        setDeviceId(device_id);
        setIsReady(true);
      });

      playerInstance.addListener("not_ready", ({ device_id }: { device_id: string }) => {
        console.log("[SpotifyPlayer] Device ID has gone offline", device_id);
        setIsReady(false);
      });

      playerInstance.addListener("player_state_changed", (state: WebPlaybackState | null) => {
        if (!state) return;
        setCurrentTrack(state.track_window.current_track);
        setIsPaused(state.paused);
      });

      playerInstance.addListener("initialization_error", ({ message }: { message: string }) => {
        console.error("[SpotifyPlayer] Initialization Error:", message);
      });
      playerInstance.addListener("authentication_error", ({ message }: { message: string }) => {
        console.error("[SpotifyPlayer] Authentication Error:", message);
      });
      playerInstance.addListener("account_error", ({ message }: { message: string }) => {
        console.error("[SpotifyPlayer] Account Error:", message);
      });
      playerInstance.addListener("playback_error", ({ message }: { message: string }) => {
        console.error("[SpotifyPlayer] Playback Error:", message);
      });

      playerInstance.connect();
      setPlayer(playerInstance);
    };

    return () => {
      setPlayer((prev: any) => {
        if (prev) {
          try { prev.disconnect(); } catch {}
        }
        return null;
      });
    };
  }, []);

  const togglePlay = useCallback(() => {
    if (player) player.togglePlay();
  }, [player]);

  const nextTrack = useCallback(() => {
    if (player) player.nextTrack();
  }, [player]);

  const previousTrack = useCallback(() => {
    if (player) player.previousTrack();
  }, [player]);

  const seek = useCallback((positionMs: number) => {
    if (player) player.seek(positionMs);
  }, [player]);

  const setVolume = useCallback((volume: number) => {
    if (player) player.setVolume(volume / 100);
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
    isIOS: IS_IOS,
  };
};
