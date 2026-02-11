import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  Volume1,
  VolumeX,
  Mic2,
  ListMusic,
  Monitor,
  Maximize2,
} from "lucide-react";
import WaveformProgress from "./WaveformProgress";
import { formatTime } from "@/lib/mock-data";
import type { usePlayerStore } from "@/hooks/usePlayerStore";
import { 
  usePlaybackState, 
  usePlayMutation, 
  usePauseMutation,
  useNextMutation,
  usePreviousMutation,
  useSetVolumeMutation,
  useSeekMutation,
  useShuffleMutation,
  useRepeatMutation
} from "@/hooks/useSpotify";

type PlayerProps = ReturnType<typeof usePlayerStore> & {
  onExpandClick: () => void;
};

export default function PlayerBar(props: PlayerProps) {
  const {
    currentTrack: localTrack,
    isPlaying: localIsPlaying,
    progress: localProgress,
    volume: localVolume,
    shuffle: localShuffle,
    repeat: localRepeat,
    toggle: localToggle,
    setProgress: localSetProgress,
    setVolume: localSetVolume,
    toggleShuffle: localToggleShuffle,
    toggleRepeat: localToggleRepeat,
    nextTrack: localNextTrack,
    prevTrack: localPrevTrack,
    onExpandClick,
  } = props;

  // Spotify hooks
  const { data: playbackState } = usePlaybackState();
  const playMutation = usePlayMutation();
  const pauseMutation = usePauseMutation();
  const nextMutation = useNextMutation();
  const previousMutation = usePreviousMutation();
  const setVolumeMutation = useSetVolumeMutation();
  const seekMutation = useSeekMutation();
  const shuffleMutation = useShuffleMutation();
  const repeatMutation = useRepeatMutation();

  // Use Spotify state if available, fallback to local
  const spotifyTrack = playbackState?.item;
  const isPlaying = playbackState?.is_playing ?? localIsPlaying;
  const progress = playbackState ? (playbackState.progress_ms / playbackState.item?.duration_ms) * 100 : localProgress;
  const volume = playbackState?.device?.volume_percent ?? localVolume;
  const shuffle = playbackState?.shuffle_state ?? localShuffle;
  const repeat = playbackState?.repeat_state === "track" ? "one" : playbackState?.repeat_state === "context" ? "all" : localRepeat;

  // Current track (prefer Spotify, fallback to local)
  const currentTrack = spotifyTrack ? {
    id: spotifyTrack.id,
    title: spotifyTrack.name,
    artist: spotifyTrack.artists[0]?.name || "Unknown Artist",
    album: spotifyTrack.album.name,
    cover: spotifyTrack.album.images[0]?.url || "",
    duration: Math.floor(spotifyTrack.duration_ms / 1000),
  } : localTrack;

  if (!currentTrack) return null;

  const elapsed = spotifyTrack 
    ? Math.floor((playbackState?.progress_ms || 0) / 1000)
    : (progress / 100) * currentTrack.duration;

  const handleTogglePlay = async () => {
    try {
      if (spotifyTrack) {
        if (isPlaying) {
          await pauseMutation.mutateAsync();
        } else {
          await playMutation.mutateAsync({});
        }
      } else {
        localToggle();
      }
    } catch (err) {
      console.error("Toggle play error:", err);
      localToggle(); // Fallback to local
    }
  };

  const handleNext = async () => {
    try {
      if (spotifyTrack) {
        await nextMutation.mutateAsync();
      } else {
        localNextTrack();
      }
    } catch (err) {
      console.error("Next track error:", err);
      localNextTrack();
    }
  };

  const handlePrevious = async () => {
    try {
      if (spotifyTrack) {
        await previousMutation.mutateAsync();
      } else {
        localPrevTrack();
      }
    } catch (err) {
      console.error("Previous track error:", err);
      localPrevTrack();
    }
  };

  const handleVolumeChange = async (newVolume: number) => {
    localSetVolume(newVolume);
    
    if (spotifyTrack) {
      try {
        await setVolumeMutation.mutateAsync(newVolume);
      } catch (err) {
        console.error("Volume change error:", err);
      }
    }
  };

  const handleSeek = async (newProgress: number) => {
    localSetProgress(newProgress);
    
    if (spotifyTrack) {
      try {
        const positionMs = Math.floor((newProgress / 100) * spotifyTrack.duration_ms);
        await seekMutation.mutateAsync(positionMs);
      } catch (err) {
        console.error("Seek error:", err);
      }
    }
  };

  const handleToggleShuffle = async () => {
    if (spotifyTrack) {
      try {
        await shuffleMutation.mutateAsync(!shuffle);
      } catch (err) {
        console.error("Shuffle error:", err);
      }
    }
    localToggleShuffle();
  };

  const handleToggleRepeat = async () => {
    if (spotifyTrack) {
      try {
        const newRepeat = repeat === "off" ? "context" : repeat === "all" ? "track" : "off";
        await repeatMutation.mutateAsync(newRepeat);
      } catch (err) {
        console.error("Repeat error:", err);
      }
    }
    localToggleRepeat();
  };

  return (
    <div className="h-24 glass-surface border-t border-border/50 flex items-center px-4 gap-4 z-50 shrink-0">
      {/* Track info */}
      <div className="flex items-center gap-3 w-72 min-w-0">
        <motion.button
          onClick={onExpandClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative shrink-0"
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={currentTrack.id}
              src={currentTrack.cover}
              alt={currentTrack.album}
              className="w-14 h-14 rounded-lg object-cover shadow-lg"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
            />
          </AnimatePresence>
          {isPlaying && (
            <motion.div
              className="absolute inset-0 rounded-lg ring-2 ring-primary/40"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </motion.button>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate text-foreground">
            {currentTrack.title}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {currentTrack.artist}
          </p>
        </div>
      </div>

      {/* Center controls */}
      <div className="flex-1 max-w-2xl mx-auto flex flex-col gap-1">
        <div className="flex items-center justify-center gap-4">
          <ControlBtn
            onClick={handleToggleShuffle}
            active={shuffle}
            icon={<Shuffle className="w-4 h-4" />}
          />
          <ControlBtn
            onClick={handlePrevious}
            icon={<SkipBack className="w-4 h-4 fill-current" />}
          />

          <motion.button
            onClick={handleTogglePlay}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-background" />
            ) : (
              <Play className="w-5 h-5 text-background ml-0.5" />
            )}
          </motion.button>

          <ControlBtn
            onClick={handleNext}
            icon={<SkipForward className="w-4 h-4 fill-current" />}
          />
          <ControlBtn
            onClick={handleToggleRepeat}
            active={repeat !== "off"}
            icon={
              repeat === "one" ? (
                <Repeat1 className="w-4 h-4" />
              ) : (
                <Repeat className="w-4 h-4" />
              )
            }
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">
            {formatTime(elapsed)}
          </span>
          <div className="flex-1">
            <WaveformProgress
              progress={progress}
              isPlaying={isPlaying}
              onSeek={handleSeek}
            />
          </div>
          <span className="text-xs text-muted-foreground w-10 tabular-nums">
            {formatTime(currentTrack.duration)}
          </span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 w-56 justify-end">
        <ControlBtn icon={<Mic2 className="w-4 h-4" />} />
        <ControlBtn icon={<ListMusic className="w-4 h-4" />} />
        <ControlBtn icon={<Monitor className="w-4 h-4" />} />

        <div className="flex items-center gap-1.5 ml-1">
          <button
            onClick={() => handleVolumeChange(volume === 0 ? 75 : 0)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {volume === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : volume < 50 ? (
              <Volume1 className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
            className="w-20 h-1 accent-foreground cursor-pointer"
            style={{
              background: `linear-gradient(to right, currentColor ${volume}%, rgb(107 114 128) ${volume}%)`
            }}
          />
        </div>

        <ControlBtn
          onClick={onExpandClick}
          icon={<Maximize2 className="w-4 h-4" />}
        />
      </div>
    </div>
  );
}

function ControlBtn({
  onClick,
  icon,
  active,
}: {
  onClick?: () => void;
  icon: React.ReactNode;
  active?: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      className={`p-1.5 rounded-full transition-colors ${
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
    </motion.button>
  );
}
