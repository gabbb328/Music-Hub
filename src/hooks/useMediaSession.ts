import { useEffect } from "react";
import { Track } from "./usePlayerStore";

interface MediaSessionActions {
  play: () => void;
  pause: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (time: number) => void;
}

export function useMediaSession(
  currentTrack: Track | null,
  isPlaying: boolean,
  actions: MediaSessionActions
) {
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    if (currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album || "Harmony Hub",
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

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    const session = navigator.mediaSession;

    session.setActionHandler("play", actions.play);
    session.setActionHandler("pause", actions.pause);
    session.setActionHandler("previoustrack", actions.prevTrack);
    session.setActionHandler("nexttrack", actions.nextTrack);
    
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
      try {
        session.setActionHandler("seekto", null);
      } catch (error) {}
    };
  }, [actions]);
}
