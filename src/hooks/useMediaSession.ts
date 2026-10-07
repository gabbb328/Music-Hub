import { useEffect } from "react";
import { Track } from "./usePlayerStore";

interface MediaSessionActions {
  play: () => void;
  pause: () => void;
  stop?: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (time: number) => void;
  seekBackward?: (offset?: number) => void;
  seekForward?: (offset?: number) => void;
}

export function useMediaSession(
  currentTrack: Track | null,
  isPlaying: boolean,
  actions: MediaSessionActions,
  currentPosition?: number
) {
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    if (currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album || "Music Hub",
        artwork: [
          {
            src: currentTrack.cover || "/placeholder.svg",
            sizes: "96x96",
            type: "image/png",
          },
          {
            src: currentTrack.cover || "/placeholder.svg",
            sizes: "128x128",
            type: "image/png",
          },
          {
            src: currentTrack.cover || "/placeholder.svg",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: currentTrack.cover || "/placeholder.svg",
            sizes: "256x256",
            type: "image/png",
          },
          {
            src: currentTrack.cover || "/placeholder.svg",
            sizes: "384x384",
            type: "image/png",
          },
          {
            src: currentTrack.cover || "/placeholder.svg",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      });
    } else {
      navigator.mediaSession.metadata = null;
    }
  }, [currentTrack]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [isPlaying]);

  // Sincronizza la timeline / scrubber nativo della Touch Bar di macOS
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    if (typeof navigator.mediaSession.setPositionState !== "function") return;
    if (!currentTrack || !currentTrack.duration || currentTrack.duration <= 0) return;

    try {
      const validDuration = Math.max(0.1, currentTrack.duration);
      const pos = typeof currentPosition === "number" && !isNaN(currentPosition)
        ? Math.min(Math.max(0, currentPosition), validDuration)
        : 0;

      navigator.mediaSession.setPositionState({
        duration: validDuration,
        playbackRate: isPlaying ? 1 : 0,
        position: pos,
      });
    } catch {
      // Ignora errori di range o supporto parziale
    }
  }, [currentTrack, isPlaying, currentPosition]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    const session = navigator.mediaSession;

    session.setActionHandler("play", actions.play);
    session.setActionHandler("pause", actions.pause);
    session.setActionHandler("previoustrack", actions.prevTrack);
    session.setActionHandler("nexttrack", actions.nextTrack);

    try {
      session.setActionHandler("stop", actions.stop || actions.pause);
    } catch {}

    try {
      session.setActionHandler("seekbackward", (details) => {
        const offset = details.seekOffset || 10;
        if (actions.seekBackward) {
          actions.seekBackward(offset);
        } else if (typeof currentPosition === "number") {
          actions.seekTo(Math.max(0, currentPosition - offset));
        }
      });
    } catch {}

    try {
      session.setActionHandler("seekforward", (details) => {
        const offset = details.seekOffset || 10;
        if (actions.seekForward) {
          actions.seekForward(offset);
        } else if (typeof currentPosition === "number") {
          actions.seekTo(currentPosition + offset);
        }
      });
    } catch {}
    
    try {
      session.setActionHandler("seekto", (details) => {
        if (details.seekTime !== undefined) {
          actions.seekTo(details.seekTime);
        }
      });
    } catch (error) {
      console.log('Seekto action not supported');
    }

    return () => {
      session.setActionHandler("play", null);
      session.setActionHandler("pause", null);
      session.setActionHandler("previoustrack", null);
      session.setActionHandler("nexttrack", null);
      try { session.setActionHandler("stop", null); } catch {}
      try { session.setActionHandler("seekbackward", null); } catch {}
      try { session.setActionHandler("seekforward", null); } catch {}
      try { session.setActionHandler("seekto", null); } catch {}
    };
  }, [actions, currentPosition]);
}
