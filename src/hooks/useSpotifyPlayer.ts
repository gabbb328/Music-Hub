import { useEffect, useState, useCallback } from "react";
import { getToken } from "@/services/spotify-auth";
import { getActiveProvider, universalAudioEngine, MUSIC_PROVIDERS } from "@/services/music-providers";

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
  const activeProvider = getActiveProvider();
  const [player, setPlayer] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string>(activeProvider !== "spotify" ? `device-${activeProvider}` : "");
  const [isReady, setIsReady] = useState(activeProvider !== "spotify");
  const [isPaused, setIsPaused] = useState(activeProvider !== "spotify" ? !universalAudioEngine.getIsPlaying() : true);
  const [currentTrack, setCurrentTrack] = useState<any>(activeProvider !== "spotify" ? universalAudioEngine.getCurrentTrack() : null);

  // ── Se il provider NON è Spotify: usa Universal Audio Engine ──────────────────
  useEffect(() => {
    if (activeProvider !== "spotify") {
      setIsReady(true);
      setDeviceId(`device-${activeProvider}`);
      setIsPaused(!universalAudioEngine.getIsPlaying());
      setCurrentTrack(universalAudioEngine.getCurrentTrack());

      const unsubscribe = universalAudioEngine.subscribe(() => {
        setIsPaused(!universalAudioEngine.getIsPlaying());
        setCurrentTrack(universalAudioEngine.getCurrentTrack());
      });

      return () => {
        unsubscribe();
      };
    }
  }, [activeProvider]);

  // ── Se il provider È Spotify: usa Web Playback SDK ufficiale ───────────────────
  useEffect(() => {
    if (activeProvider !== "spotify") return;

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
  }, [activeProvider]);

  const togglePlay = useCallback(() => {
    if (activeProvider !== "spotify") {
      universalAudioEngine.togglePlay();
      return;
    }
    if (player) player.togglePlay();
  }, [player, activeProvider]);

  const nextTrack = useCallback(() => {
    if (activeProvider !== "spotify") {
      universalAudioEngine.next();
      return;
    }
    if (player) player.nextTrack();
  }, [player, activeProvider]);

  const previousTrack = useCallback(() => {
    if (activeProvider !== "spotify") {
      universalAudioEngine.previous();
      return;
    }
    if (player) player.previousTrack();
  }, [player, activeProvider]);

  const seek = useCallback((positionMs: number) => {
    if (activeProvider !== "spotify") {
      universalAudioEngine.seek(positionMs);
      return;
    }
    if (player) player.seek(positionMs);
  }, [player, activeProvider]);

  const setVolume = useCallback((volume: number) => {
    if (activeProvider !== "spotify") {
      universalAudioEngine.setVolume(volume);
      return;
    }
    if (player) player.setVolume(volume / 100);
  }, [player, activeProvider]);

  return {
    player: activeProvider !== "spotify" ? universalAudioEngine : player,
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
