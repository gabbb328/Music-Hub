import { useState, useCallback } from "react";

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  cover: string;
  duration: number;
  bpm?: number;
}

export interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  volume: number;
  shuffle: boolean;
  repeat: "off" | "all" | "one";
  queue: Track[];
}

export function usePlayerStore() {
  const [state, setState] = useState<PlayerState>({
    currentTrack: null,
    isPlaying: false,
    progress: 0,
    volume: 75,
    shuffle: false,
    repeat: "off",
    queue: [],
  });

  const play = useCallback(() => setState((s) => ({ ...s, isPlaying: true })), []);
  const pause = useCallback(() => setState((s) => ({ ...s, isPlaying: false })), []);
  const toggle = useCallback(() => setState((s) => ({ ...s, isPlaying: !s.isPlaying })), []);

  const setProgress = useCallback((p: number) => setState((s) => ({ ...s, progress: p })), []);
  const setVolume = useCallback((v: number) => setState((s) => ({ ...s, volume: v })), []);

  const toggleShuffle = useCallback(() => setState((s) => ({ ...s, shuffle: !s.shuffle })), []);
  const toggleRepeat = useCallback(() =>
    setState((s) => ({
      ...s,
      repeat: s.repeat === "off" ? "all" : s.repeat === "all" ? "one" : "off",
    })), []);

  const playTrack = useCallback((track: Track) => {
    setState((s) => ({ 
      ...s, 
      currentTrack: track, 
      isPlaying: true, 
      progress: 0,
      queue: s.queue.length === 0 ? [track] : s.queue
    }));
  }, []);

  const nextTrack = useCallback(() => {
    setState((s) => {
      if (!s.currentTrack || s.queue.length === 0) return s;
      const idx = s.queue.findIndex((t) => t.id === s.currentTrack!.id);
      if (idx === -1) return s;
      const next = s.queue[(idx + 1) % s.queue.length];
      return { ...s, currentTrack: next, progress: 0 };
    });
  }, []);

  const prevTrack = useCallback(() => {
    setState((s) => {
      if (!s.currentTrack || s.queue.length === 0) return s;
      const idx = s.queue.findIndex((t) => t.id === s.currentTrack!.id);
      if (idx === -1) return s;
      const prev = s.queue[(idx - 1 + s.queue.length) % s.queue.length];
      return { ...s, currentTrack: prev, progress: 0 };
    });
  }, []);

  return { 
    ...state, 
    play, 
    pause, 
    toggle, 
    setProgress, 
    setVolume, 
    toggleShuffle, 
    toggleRepeat, 
    playTrack, 
    nextTrack, 
    prevTrack 
  };
}
