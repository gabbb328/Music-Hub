import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, Share2, MoreHorizontal, Sparkles, BarChart3, Mic2, ListMusic, Clock, Info, GripVertical } from "lucide-react";
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1 } from "lucide-react";
import WaveformProgress from "./WaveformProgress";
import VisualizerCanvas from "./VisualizerCanvas";
import { formatTime } from "@/lib/mock-data";
import { 
  usePlaybackState, 
  useSaveTrackMutation, 
  useRemoveTrackMutation, 
  useQueue,
  usePlayMutation,
  usePauseMutation,
  useNextMutation,
  usePreviousMutation,
  useShuffleMutation,
  useRepeatMutation,
  useSeekMutation
} from "@/hooks/useSpotify";
import { useToast } from "@/hooks/use-toast";
import { lyricsStore } from "@/hooks/useLyricsStore";
import { getCurrentLineIndex } from "@/services/lyrics-api";
import type { usePlayerStore } from "@/hooks/usePlayerStore";

type NowPlayingProps = ReturnType<typeof usePlayerStore> & {
  onClose: () => void;
};

type WidgetType = 'lyrics' | 'queue' | 'analysis' | 'info';

interface Widget {
  id: WidgetType;
  label: string;
  icon: typeof Mic2;
}

const availableWidgets: Widget[] = [
  { id: 'queue', label: 'Queue', icon: ListMusic },
  { id: 'lyrics', label: 'Lyrics', icon: Mic2 },
  { id: 'analysis', label: 'Analysis', icon: BarChart3 },
  { id: 'info', label: 'Info', icon: Info },
];

export default function NowPlayingView(props: NowPlayingProps) {
  const { onClose } = props;
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [widgets, setWidgets] = useState<WidgetType[]>(['queue', 'lyrics']);
  const [hoveredWidget, setHoveredWidget] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  
  const { toast } = useToast();
  const { data: playbackState } = usePlaybackState();
  const { data: queueData } = useQueue();
  const saveTrackMutation = useSaveTrackMutation();
  const removeTrackMutation = useRemoveTrackMutation();
  const playMutation = usePlayMutation();
  const pauseMutation = usePauseMutation();
  const nextMutation = useNextMutation();
  const previousMutation = usePreviousMutation();
  const shuffleMutation = useShuffleMutation();
  const repeatMutation = useRepeatMutation();
  const seekMutation = useSeekMutation();
  
  const currentTrack = playbackState?.item;
  const isPlaying = playbackState?.is_playing || false;
  const progress = playbackState ? (playbackState.progress_ms / playbackState.item?.duration_ms) * 100 : 0;
  const shuffle = playbackState?.shuffle_state || false;
  const repeat = playbackState?.repeat_state === "track" ? "one" : playbackState?.repeat_state === "context" ? "all" : "off";
  const currentTime = playbackState?.progress_ms ? playbackState.progress_ms / 1000 : 0;

  if (!currentTrack) return null;

  const elapsed = Math.floor((playbackState?.progress_ms || 0) / 1000);
  const duration = Math.floor(currentTrack.duration_ms / 1000);
  const coverUrl = currentTrack.album.images[0]?.url;
  
  const queueTracks = queueData?.queue?.slice(0, 5) || [];
  const cachedLyrics = lyricsStore.getLyrics(currentTrack.id);
  const lyrics = cachedLyrics?.lines || [];

  useEffect(() => {
    if (lyrics.length > 0 && isPlaying) {
      const newIndex = getCurrentLineIndex(lyrics, currentTime);
      if (newIndex !== currentLineIndex) {
        setCurrentLineIndex(newIndex);
      }
    }
  }, [currentTime, lyrics, isPlaying]);

  const handleTogglePlay = async () => {
    try {
      if (isPlaying) {
        await pauseMutation.mutateAsync();
      } else {
        await playMutation.mutateAsync({});
      }
    } catch (err) {
      console.error("Toggle play error:", err);
    }
  };

  const handleNext = async () => {
    try {
      await nextMutation.mutateAsync();
    } catch (err) {
      console.error("Next error:", err);
    }
  };

  const handlePrevious = async () => {
    try {
      await previousMutation.mutateAsync();
    } catch (err) {
      console.error("Previous error:", err);
    }
  };

  const handleToggleShuffle = async () => {
    try {
      await shuffleMutation.mutateAsync(!shuffle);
    } catch (err) {
      console.error("Shuffle error:", err);
    }
  };

  const handleToggleRepeat = async () => {
    try {
      const newRepeat = repeat === "off" ? "context" : repeat === "all" ? "track" : "off";
      await repeatMutation.mutateAsync(newRepeat);
    } catch (err) {
      console.error("Repeat error:", err);
    }
  };

  const handleSeek = async (newProgress: number) => {
    try {
      const positionMs = Math.floor((newProgress / 100) * currentTrack.duration_ms);
      await seekMutation.mutateAsync(positionMs);
    } catch (err) {
      console.error("Seek error:", err);
    }
  };

  const handleLike = async () => {
    if (!currentTrack) return;
    
    try {
      if (isLiked) {
        await removeTrackMutation.mutateAsync(currentTrack.id);
        setIsLiked(false);
        toast({ title: "Removed from Liked Songs" });
      } else {
        await saveTrackMutation.mutateAsync(currentTrack.id);
        setIsLiked(true);
        toast({ title: "✓ Added to Liked Songs", description: currentTrack.name });
      }
    } catch (error) {
      toast({ title: "Error", description: "Could not update liked status", variant: "destructive" });
    }
  };

  const handleShare = async () => {
    if (!currentTrack) return;
    
    const shareUrl = currentTrack.external_urls?.spotify || `https://open.spotify.com/track/${currentTrack.id}`;
    const shareText = `${currentTrack.name} - ${currentTrack.artists[0]?.name}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: currentTrack.name, text: shareText, url: shareUrl });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: "✓ Link copied!", description: "Spotify link copied to clipboard" });
      } catch (err) {
        toast({ title: "Share", description: shareUrl });
      }
    }
  };

  const handleWidgetDrop = (widgetId: WidgetType, position: 'top' | 'bottom') => {
    const newWidgets = [...widgets];
    const currentIndex = widgets.indexOf(widgetId);
    const targetIndex = position === 'top' ? 0 : 1;
    
    if (currentIndex !== -1) {
      newWidgets.splice(currentIndex, 1);
    }
    
    newWidgets.splice(targetIndex, 0, widgetId);
    setWidgets(newWidgets.slice(0, 2));
  };

  const renderWidget = (widgetType: WidgetType) => {
    switch (widgetType) {
      case 'queue':
        return (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground/70">Up Next</h3>
            {queueTracks.length > 0 ? (
              <div className="space-y-2">
                {queueTracks.map((track: any, i: number) => (
                  <div key={`${track.id}-${i}`} className="flex items-center gap-3 p-2 rounded-lg bg-background/20 backdrop-blur-sm">
                    <div className="w-10 h-10 rounded bg-muted/30 overflow-hidden">
                      {track.album?.images?.[0]?.url && (
                        <img src={track.album.images[0].url} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{track.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{track.artists?.[0]?.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Queue is empty</p>
            )}
          </div>
        );
      case 'lyrics':
        if (lyrics.length === 0) {
          return (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground/70">Lyrics</h3>
              <div className="space-y-3 text-center py-4">
                <p className="text-sm text-muted-foreground">Lyrics loading...</p>
                <p className="text-lg font-semibold text-primary">♪ ♪ ♪</p>
              </div>
            </div>
          );
        }

        const prevLine = lyrics[currentLineIndex - 1];
        const currentLine = lyrics[currentLineIndex];
        const nextLine = lyrics[currentLineIndex + 1];

        return (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground/70">Lyrics</h3>
            <div className="space-y-2 text-center py-2">
              {prevLine && (
                <p className="text-sm text-muted-foreground/40 truncate">{prevLine.text}</p>
              )}
              {currentLine && (
                <p className="text-lg font-bold text-primary truncate">{currentLine.text}</p>
              )}
              {nextLine && (
                <p className="text-sm text-muted-foreground/60 truncate">{nextLine.text}</p>
              )}
            </div>
          </div>
        );
      case 'analysis':
        return (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground/70">Audio Analysis</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-lg bg-background/20 backdrop-blur-sm">
                <p className="text-xs text-muted-foreground mb-1">Energy</p>
                <p className="text-lg font-bold text-primary">85%</p>
              </div>
              <div className="p-3 rounded-lg bg-background/20 backdrop-blur-sm">
                <p className="text-xs text-muted-foreground mb-1">Tempo</p>
                <p className="text-lg font-bold text-primary">128 BPM</p>
              </div>
            </div>
          </div>
        );
      case 'info':
        return (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground/70">Track Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Album</span>
                <span className="font-medium truncate ml-2">{currentTrack.album.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Release</span>
                <span className="font-medium">{currentTrack.album.release_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium">{formatTime(duration)}</span>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-[100] flex flex-col overflow-hidden"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTrack.id}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <img src={coverUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-background/80 backdrop-blur-[80px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/30" />
        </motion.div>
      </AnimatePresence>

      <div className="relative flex items-center justify-between px-6 py-4 z-10">
        <motion.button onClick={onClose} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          className="p-2 rounded-full text-foreground/70 hover:text-foreground hover:bg-foreground/10 transition-colors">
          <X className="w-6 h-6" />
        </motion.button>
        <p className="text-sm font-medium text-foreground/70 uppercase tracking-wider">Now Playing</p>
        <div className="flex items-center gap-1">
          <motion.button onClick={() => setShowVisualizer(!showVisualizer)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            className={`p-2 rounded-full transition-colors ${showVisualizer ? "text-primary bg-primary/10" : "text-foreground/70 hover:text-foreground hover:bg-foreground/10"}`}>
            <BarChart3 className="w-6 h-6" />
          </motion.button>
          <motion.button onClick={() => setShowMenu(!showMenu)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            className={`p-2 rounded-full transition-colors ${showMenu ? "text-primary bg-primary/10" : "text-foreground/70 hover:text-foreground hover:bg-foreground/10"}`}>
            <MoreHorizontal className="w-6 h-6" />
          </motion.button>
        </div>
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center px-8 z-10">
        {showVisualizer ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-80 h-80 flex items-center justify-center">
            <VisualizerCanvas isPlaying={isPlaying} />
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={currentTrack.id}
              initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotateY: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative">
              <img src={coverUrl} alt={currentTrack.album.name} className="w-80 h-80 rounded-2xl object-cover shadow-2xl" />
              {isPlaying && (
                <motion.div className="absolute -inset-1 rounded-2xl glow-primary opacity-30"
                  animate={{ opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 3, repeat: Infinity }} />
              )}
            </motion.div>
          </AnimatePresence>
        )}

        <div className="mt-10 text-center w-full max-w-md">
          <div className="flex items-center justify-between">
            <div className="text-left min-w-0 flex-1">
              <motion.h2 key={currentTrack.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="text-2xl font-bold text-foreground truncate">
                {currentTrack.name}
              </motion.h2>
              <p className="text-lg text-muted-foreground mt-1">{currentTrack.artists[0]?.name}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <motion.button 
                onClick={handleLike}
                whileHover={{ scale: 1.2 }} 
                whileTap={{ scale: 0.8 }}
                disabled={saveTrackMutation.isPending || removeTrackMutation.isPending}
                className={`p-2 transition-colors ${isLiked ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}>
                <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
              </motion.button>
              <motion.button 
                onClick={handleShare}
                whileHover={{ scale: 1.2 }} 
                whileTap={{ scale: 0.8 }}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                <Share2 className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          <div className="mt-6">
            <WaveformProgress progress={progress} isPlaying={isPlaying} onSeek={handleSeek} />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-muted-foreground tabular-nums">{formatTime(elapsed)}</span>
              <span className="text-xs text-muted-foreground tabular-nums">{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 mt-6">
            <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={handleToggleShuffle}
              className={`p-2 ${shuffle ? "text-primary" : "text-muted-foreground hover:text-foreground"} transition-colors`}>
              <Shuffle className="w-5 h-5" />
            </motion.button>
            <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={handlePrevious} className="p-2 text-foreground">
              <SkipBack className="w-6 h-6 fill-current" />
            </motion.button>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleTogglePlay}
              className="w-16 h-16 rounded-full bg-foreground flex items-center justify-center shadow-xl">
              {isPlaying ? <Pause className="w-7 h-7 text-background" /> : <Play className="w-7 h-7 text-background ml-1" />}
            </motion.button>
            <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={handleNext} className="p-2 text-foreground">
              <SkipForward className="w-6 h-6 fill-current" />
            </motion.button>
            <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={handleToggleRepeat}
              className={`p-2 ${repeat !== "off" ? "text-primary" : "text-muted-foreground hover:text-foreground"} transition-colors`}>
              {repeat === "one" ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
            </motion.button>
          </div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full glass-surface">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">
              Mood: <span className="text-foreground font-medium">Energetic</span>
            </span>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110]"
              onClick={() => setShowMenu(false)}
            />
            
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full md:w-[600px] z-[120] flex overflow-hidden"
            >
              <div 
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${coverUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(120px) saturate(0.6)',
                }}
              />
              <div className="absolute inset-0 bg-background/90" />

              <div className="relative flex-1 flex">
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Customize View</h2>
                    <button onClick={() => setShowMenu(false)} className="p-2 hover:bg-foreground/10 rounded-full transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div 
                      className="space-y-2"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const widgetId = e.dataTransfer.getData('widgetId') as WidgetType;
                        if (widgetId) handleWidgetDrop(widgetId, 'top');
                      }}
                    >
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Top Widget</h3>
                      <div className="p-4 rounded-xl border-2 border-primary/30 bg-primary/5 backdrop-blur-sm min-h-[140px]">
                        {renderWidget(widgets[0])}
                      </div>
                    </div>

                    <div 
                      className="space-y-2"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const widgetId = e.dataTransfer.getData('widgetId') as WidgetType;
                        if (widgetId) handleWidgetDrop(widgetId, 'bottom');
                      }}
                    >
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Bottom Widget</h3>
                      <div className="p-4 rounded-xl border-2 border-primary/30 bg-primary/5 backdrop-blur-sm min-h-[140px]">
                        {renderWidget(widgets[1])}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-20 border-l border-border/50 p-3 space-y-3 overflow-y-auto bg-black/30 backdrop-blur-sm">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-center mb-2">Widgets</p>
                  
                  {availableWidgets.map((widget) => {
                    const Icon = widget.icon;
                    const isInUse = widgets.includes(widget.id);
                    
                    return (
                      <div key={widget.id} className="relative group">
                        <button
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('widgetId', widget.id);
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onMouseEnter={() => setHoveredWidget(widget.id)}
                          onMouseLeave={() => setHoveredWidget(null)}
                          className={`
                            w-full aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 p-2
                            transition-all duration-200 cursor-grab active:cursor-grabbing
                            hover:scale-105 hover:-translate-y-0.5 active:scale-95
                            ${isInUse 
                              ? 'bg-primary/20 border-2 border-primary shadow-lg shadow-primary/20' 
                              : 'bg-background/30 border-2 border-border/30 hover:border-primary/50'
                            }
                          `}
                        >
                          <Icon className={`w-6 h-6 ${isInUse ? 'text-primary' : 'text-foreground/70'}`} />
                          <GripVertical className="w-3 h-3 text-foreground/30" />
                        </button>
                        
                        {hoveredWidget === widget.id && (
                          <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 pointer-events-none z-50 whitespace-nowrap">
                            <div className="bg-popover border border-border rounded-lg px-3 py-1.5 text-xs shadow-xl">
                              {widget.label}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
