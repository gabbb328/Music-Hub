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

// ── Rileva iOS/iPadOS (Safari non supporta il Web Playback SDK) ──────────────
// Il Spotify Web Playback SDK richiede EME (Encrypted Media Extensions)
// che Safari su iOS non espone ai browser web. Su iOS usiamo solo l'API REST.
const IS_IOS =
  /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
  // iPadOS 13+ si identifica come MacIntel con touchpoints
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

export const useSpotifyPlayer = () => {
  const [player, setPlayer] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string>("");
  const [isReady, setIsReady] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [currentTrack, setCurrentTrack] = useState<any>(null);

  useEffect(() => {
    // Su iOS il Web Playback SDK non è supportato — non carichiamo lo script.
    // Il playback funziona tramite l'API REST di Spotify (Connect API):
    // l'utente deve avere l'app Spotify aperta su un altro dispositivo
    // oppure la PWA usa il "transfer playback" verso l'app Spotify mobile.
    if (IS_IOS) {
      console.info("[SpotifyPlayer] iOS rilevato — Web Playback SDK non caricato. Uso API REST.");
      return;
    }

    const token = getToken();
    if (!token) return;

    // Evita di aggiungere lo script più volte
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
        name: "Harmony Hub Web Player",
        getOAuthToken: (cb: (token: string) => void) => {
          const t = getToken();
          if (t) cb(t);
        },
        volume: 0.5,
      });

      // Ready
      playerInstance.addListener("ready", ({ device_id }: { device_id: string }) => {
        console.log("[SpotifyPlayer] Ready with Device ID", device_id);
        setDeviceId(device_id);
        setIsReady(true);
      });

      // Not Ready
      playerInstance.addListener("not_ready", ({ device_id }: { device_id: string }) => {
        console.log("[SpotifyPlayer] Device ID has gone offline", device_id);
        setIsReady(false);
      });

      // Player state changed
      playerInstance.addListener("player_state_changed", (state: WebPlaybackState | null) => {
        if (!state) return;
        setCurrentTrack(state.track_window.current_track);
        setIsPaused(state.paused);
      });

      // Error handling
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
      // Cleanup del player al dismount
      setPlayer((prev: any) => {
        if (prev) {
          try { prev.disconnect(); } catch {}
        }
        return null;
      });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
