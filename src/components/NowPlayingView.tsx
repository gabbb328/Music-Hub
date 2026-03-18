import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Heart, Share2, MoreHorizontal, Sparkles, BarChart3, Mic2, ListMusic,
  Info, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Clock, Timer, Volume2, Headphones, Music2, ChevronUp, Radio,
  Zap, Star, TrendingUp, Eye, EyeOff
} from "lucide-react";
import WaveformProgress from "./WaveformProgress";
import VisualizerCanvas from "./VisualizerCanvas";
import { formatTime } from "@/lib/mock-data";
import {
  usePlaybackState, useSaveTrackMutation, useRemoveTrackMutation,
  useQueue, usePlayMutation, usePauseMutation, useNextMutation,
  usePreviousMutation, useShuffleMutation, useRepeatMutation,
  useSeekMutation, useAudioFeatures, useCheckSavedTracks
} from "@/hooks/useSpotify";
import { useToast } from "@/hooks/use-toast";
import { lyricsStore } from "@/hooks/useLyricsStore";
import { getCurrentLineIndex } from "@/services/lyrics-api";
import type { usePlayerStore } from "@/hooks/usePlayerStore";

type NowPlayingProps = ReturnType<typeof usePlayerStore> & { onClose: () => void; onNavigate?: (s: string) => void; };
type PanelType = "lyrics" | "queue" | "analysis" | "info" | "timer" | null;

// ── Sleep timer ────────────────────────────────────────────────────────────────
function useSleepTimer(onEnd: () => void) {
  const [minutes, setMinutes] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [active, setActive] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = (mins: number) => {
    if (ref.current) clearInterval(ref.current);
    const secs = mins * 60;
    setMinutes(mins); setRemaining(secs); setActive(true);
    ref.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clearInterval(ref.current!); setActive(false); onEnd(); return 0; }
        return r - 1;
      });
    }, 1000);
  };

  const cancel = () => {
    if (ref.current) clearInterval(ref.current);
    setActive(false); setRemaining(0);
  };

  useEffect(() => () => { if (ref.current) clearInterval(ref.current); }, []);
  return { active, remaining, minutes, start, cancel };
}

export default function NowPlayingView(props: NowPlayingProps) {
  const { onClose, onNavigate } = props;
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [coverTaps, setCoverTaps] = useState(0);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const { toast } = useToast();

  const { data: playbackState } = usePlaybackState();
  const { data: queueData } = useQueue();
  const saveTrackMutation    = useSaveTrackMutation();
  const removeTrackMutation  = useRemoveTrackMutation();
  const playMutation         = usePlayMutation();
  const pauseMutation        = usePauseMutation();
  const nextMutation         = useNextMutation();
  const previousMutation     = usePreviousMutation();
  const shuffleMutation      = useShuffleMutation();
  const repeatMutation       = useRepeatMutation();
  const seekMutation         = useSeekMutation();

  const currentTrack = playbackState?.item;
  const { data: audioFeatures } = useAudioFeatures(currentTrack?.id || "");
  const { data: savedStatus }   = useCheckSavedTracks(currentTrack ? [currentTrack.id] : []);

  useEffect(() => { if (savedStatus?.[0] !== undefined) setIsLiked(savedStatus[0]); }, [savedStatus]);

  const pauseMutation2 = usePauseMutation();
  const sleepTimer = useSleepTimer(async () => {
    await pauseMutation2.mutateAsync();
    toast({ title: "⏱ Sleep timer", description: "Riproduzione fermata" });
  });

  const isPlaying   = playbackState?.is_playing || false;
  const progress    = playbackState ? (playbackState.progress_ms / (playbackState.item?.duration_ms || 1)) * 100 : 0;
  const shuffle     = playbackState?.shuffle_state || false;
  const repeat      = playbackState?.repeat_state === "track" ? "one" : playbackState?.repeat_state === "context" ? "all" : "off";
  const currentTime = playbackState?.progress_ms ? playbackState.progress_ms / 1000 : 0;

  const cachedLyrics = currentTrack ? lyricsStore.getLyrics(currentTrack.id) : null;
  const lyrics = cachedLyrics?.lines || [];
  const elapsed  = Math.floor((playbackState?.progress_ms || 0) / 1000);
  const duration = Math.floor((currentTrack?.duration_ms || 0) / 1000);

  // ── Lyrics sync ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!lyrics.length) return;
    const idx = getCurrentLineIndex(lyrics, currentTime);
    if (idx !== currentLineIndex) setCurrentLineIndex(idx);
  }, [currentTime, lyrics]);

  // Auto-scroll lyrics al centro
  useEffect(() => {
    const container = lyricsContainerRef.current;
    const line = lineRefs.current[currentLineIndex];
    if (!container || !line) return;
    const target = line.offsetTop - container.clientHeight / 2 + line.clientHeight / 2;
    container.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
  }, [currentLineIndex]);

  if (!currentTrack) return null;

  const coverUrl = currentTrack.album.images[0]?.url;
  const bpm = audioFeatures?.tempo ? Math.round(audioFeatures.tempo) : null;

  // Easter egg: 7 tap sulla copertina
  const handleCoverTap = () => {
    const next = coverTaps + 1;
    setCoverTaps(next);
    if (next >= 7) { setShowEasterEgg(true); setCoverTaps(0); }
  };

  const togglePanel = (p: PanelType) => setActivePanel(prev => prev === p ? null : p);

  // ── Controls ────────────────────────────────────────────────────────────────
  const handleTogglePlay = async () => {
    try { isPlaying ? await pauseMutation.mutateAsync() : await playMutation.mutateAsync({}); } catch (_) {}
  };
  const handleNext     = async () => { try { await nextMutation.mutateAsync(); } catch (_) {} };
  const handlePrevious = async () => { try { await previousMutation.mutateAsync(); } catch (_) {} };
  const handleShuffle  = async () => { try { await shuffleMutation.mutateAsync(!shuffle); } catch (_) {} };
  const handleRepeat   = async () => {
    try { await repeatMutation.mutateAsync(repeat === "off" ? "context" : repeat === "all" ? "track" : "off"); } catch (_) {}
  };
  const handleSeek     = async (p: number) => {
    try { await seekMutation.mutateAsync(Math.floor((p / 100) * currentTrack.duration_ms)); } catch (_) {}
  };
  const handleLike = async () => {
    try {
      if (isLiked) { await removeTrackMutation.mutateAsync(currentTrack.id); setIsLiked(false); toast({ title: "Rimosso dai preferiti" }); }
      else { await saveTrackMutation.mutateAsync(currentTrack.id); setIsLiked(true); toast({ title: "❤️ Aggiunto ai preferiti" }); }
    } catch (_) { toast({ title: "Errore", variant: "destructive" }); }
  };
  const handleShare = async () => {
    const url = currentTrack.external_urls?.spotify || `https://open.spotify.com/track/${currentTrack.id}`;
    if (navigator.share) { try { await navigator.share({ title: currentTrack.name, url }); } catch (_) {} }
    else { await navigator.clipboard.writeText(url); toast({ title: "✓ Link copiato!" }); }
  };

  const queueTracks = queueData?.queue?.slice(0, 8) || [];

  return (
    <motion.div
      initial={{ opacity: 0.6, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", stiffness: 320, damping: 34, mass: 0.9 }}
      className="fixed inset-0 z-[100] flex flex-col overflow-hidden"
    >
      {/* Background blur */}
      <motion.div key={currentTrack.id}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0">
        <img src={coverUrl} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-background/82 backdrop-blur-[80px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-background/25" />
      </motion.div>

      {/* Easter egg */}
      <AnimatePresence>
        {showEasterEgg && (
          <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-background/90 backdrop-blur-2xl"
            onClick={() => setShowEasterEgg(false)}>
            <div className="text-8xl mb-4">🎵</div>
            <p className="text-2xl font-bold text-primary mb-2">Easter Egg!</p>
            <p className="text-muted-foreground text-center px-8">Hai trovato il segreto! La musica è vita. 🎧</p>
            <div className="mt-6 flex gap-2 text-4xl animate-bounce">🎸 🥁 🎹 🎺 🎻</div>
            <p className="text-xs text-muted-foreground mt-4">Tocca per chiudere</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="relative flex items-center justify-between px-4 py-3 z-10 shrink-0">
        <button onClick={onClose} className="p-2 rounded-full text-foreground/70 hover:bg-foreground/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
          <X className="w-6 h-6" />
        </button>
        <p className="text-sm font-medium text-foreground/60 uppercase tracking-wider">In riproduzione</p>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowVisualizer(!showVisualizer)}
            className={`p-2 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors ${showVisualizer ? "text-primary bg-primary/10" : "text-foreground/70 hover:bg-foreground/10"}`}>
            <BarChart3 className="w-5 h-5" />
          </button>
          <button onClick={() => togglePanel("timer")}
            className={`p-2 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors ${activePanel === "timer" ? "text-primary bg-primary/10" : sleepTimer.active ? "text-amber-400" : "text-foreground/70 hover:bg-foreground/10"}`}>
            <Timer className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="relative flex-1 flex flex-col min-h-0 z-10 overflow-hidden">

        {/* Cover / Visualizer */}
        <div className="flex justify-center px-6 pt-2 pb-4 shrink-0">
          {showVisualizer ? (
            <div className="w-56 h-56 flex items-center justify-center">
              <VisualizerCanvas isPlaying={isPlaying} />
            </div>
          ) : (
            <motion.div key={currentTrack.id}
              initial={{ opacity: 0, scale: 0.82 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 26, mass: 0.9 }}
              className="relative cursor-pointer" onClick={handleCoverTap}>
              <img src={coverUrl} alt="" className="w-56 h-56 md:w-64 md:h-64 rounded-2xl object-cover shadow-2xl" />
              {isPlaying && (
                <motion.div className="absolute -inset-1 rounded-2xl border border-primary/30"
                  animate={{ opacity: [0.2, 0.6, 0.2] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }} />
              )}
              {/* BPM badge */}
              {bpm && (
                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                  <Zap className="w-3 h-3 text-primary" />
                  <span className="text-[11px] font-bold text-white tabular-nums">{bpm} BPM</span>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Track info + controls — scrollabile */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">

          {/* Track info */}
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold truncate">{currentTrack.name}</h2>
              <p className="text-base text-muted-foreground truncate">{currentTrack.artists.map((a: any) => a.name).join(", ")}</p>
              <p className="text-xs text-muted-foreground truncate">{currentTrack.album.name}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-3">
              <button onClick={handleLike}
                className={`p-2.5 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors ${isLiked ? "text-primary" : "text-muted-foreground"}`}>
                <Heart className={`w-6 h-6 ${isLiked ? "fill-current" : ""}`} />
              </button>
              <button onClick={handleShare}
                className="p-2.5 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Seek bar */}
          <div>
            <WaveformProgress progress={progress} isPlaying={isPlaying} onSeek={handleSeek} />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-muted-foreground tabular-nums">{formatTime(elapsed)}</span>
              {sleepTimer.active && (
                <span className="text-xs text-amber-400 flex items-center gap-1">
                  <Timer className="w-3 h-3" />{formatTime(sleepTimer.remaining)}
                </span>
              )}
              <span className="text-xs text-muted-foreground tabular-nums">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Transport */}
          <div className="flex items-center justify-center gap-4">
            <button onClick={handleShuffle} className={`p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition-colors ${shuffle ? "text-primary" : "text-muted-foreground"}`}>
              <Shuffle className="w-5 h-5" />
            </button>
            <button onClick={handlePrevious} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-foreground">
              <SkipBack className="w-6 h-6 fill-current" />
            </button>
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.88 }}
              transition={{ type: "spring", stiffness: 500, damping: 28, mass: 0.6 }}
              onClick={handleTogglePlay}
              className="w-14 h-14 rounded-full bg-foreground flex items-center justify-center shadow-xl">
              {isPlaying ? <Pause className="w-7 h-7 text-background" /> : <Play className="w-7 h-7 text-background ml-0.5" />}
            </motion.button>
            <button onClick={handleNext} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-foreground">
              <SkipForward className="w-6 h-6 fill-current" />
            </button>
            <button onClick={handleRepeat} className={`p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition-colors ${repeat !== "off" ? "text-primary" : "text-muted-foreground"}`}>
              {repeat === "one" ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
            </button>
          </div>

          {/* Quick panel buttons */}
          <div className="grid grid-cols-4 gap-2">
            {([
              { id: "lyrics" as PanelType, icon: Mic2, label: "Testi" },
              { id: "queue" as PanelType, icon: ListMusic, label: "Coda", action: () => { onNavigate?.("queue"); onClose(); } },
              { id: "analysis" as PanelType, icon: BarChart3, label: "Analisi" },
              { id: "info" as PanelType, icon: Info, label: "Info" },
            ] as const).map(({ id, icon: Icon, label, action }) => (
              <button key={id} onClick={action ?? (() => togglePanel(id))}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-[11px] font-medium transition-colors min-h-[56px] ${activePanel === id ? "bg-primary/15 text-primary" : "bg-secondary/40 text-muted-foreground hover:text-foreground"}`}>
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <AnimatePresence mode="wait">
            {activePanel === "lyrics" && (
              <motion.div key="lyrics" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              transition={{ type: "tween", duration: 0.28, ease: [0.45, 0, 0.55, 1] }}
                className="rounded-xl bg-secondary/30 backdrop-blur-sm overflow-hidden">
                {lyrics.length === 0 ? (
                  <div className="py-6 text-center text-muted-foreground text-sm">Testi non disponibili</div>
                ) : (
                  <div ref={lyricsContainerRef} className="max-h-48 overflow-y-auto px-4 py-3 space-y-1 scroll-smooth">
                    {/* spacer */}
                    <div style={{ height: "60px" }} />
                    {lyrics.map((line, i) => (
                      <div key={i} ref={el => { lineRefs.current[i] = el; }}
                        className={`text-center py-1.5 px-3 rounded-lg transition-all duration-300 ${i === currentLineIndex ? "text-primary font-bold text-base bg-primary/10" : i < currentLineIndex ? "text-muted-foreground/40 text-sm" : "text-foreground/60 text-sm"}`}>
                        {line.text || "♪"}
                      </div>
                    ))}
                    <div style={{ height: "60px" }} />
                  </div>
                )}
              </motion.div>
            )}

            {activePanel === "queue" && (
              <motion.div key="queue" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              transition={{ type: "tween", duration: 0.28, ease: [0.45, 0, 0.55, 1] }}
                className="rounded-xl bg-secondary/30 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/20">
                  <p className="text-sm font-semibold">Prossimi</p>
                  <button onClick={() => { onNavigate?.("queue"); onClose(); }}
                    className="text-xs text-primary hover:underline">Vedi tutto</button>
                </div>
                <div className="max-h-44 overflow-y-auto">
                  {queueTracks.length === 0 ? (
                    <p className="text-center py-4 text-sm text-muted-foreground">Coda vuota</p>
                  ) : queueTracks.map((t: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors">
                      <span className="text-xs text-muted-foreground w-4 tabular-nums">{i + 1}</span>
                      <div className="w-9 h-9 rounded-lg overflow-hidden bg-muted shrink-0">
                        {t.album?.images?.[0]?.url && <img src={t.album.images[0].url} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{t.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{t.artists?.[0]?.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activePanel === "analysis" && audioFeatures && (
              <motion.div key="analysis" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                transition={{ type: "tween", duration: 0.28, ease: [0.45, 0, 0.55, 1] }}
                className="rounded-xl bg-secondary/30 p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "BPM", value: Math.round(audioFeatures.tempo), unit: "" },
                    { label: "Tonalità", value: ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"][audioFeatures.key], unit: audioFeatures.mode ? " Mag" : " Min" },
                    { label: "Energia", value: Math.round(audioFeatures.energy * 100), unit: "%" },
                    { label: "Danzabilità", value: Math.round(audioFeatures.danceability * 100), unit: "%" },
                    { label: "Valenza", value: Math.round(audioFeatures.valence * 100), unit: "%" },
                    { label: "Battiti", value: `${audioFeatures.time_signature}/4`, unit: "" },
                  ].map(({ label, value, unit }) => (
                    <div key={label} className="bg-background/30 rounded-xl p-2.5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
                      <p className="text-lg font-bold text-primary">{value}{unit}</p>
                    </div>
                  ))}
                </div>
                {/* Mini bar chart */}
                <div className="space-y-1.5">
                  {[
                    { label: "Energy", v: audioFeatures.energy, color: "bg-red-500" },
                    { label: "Dance",  v: audioFeatures.danceability, color: "bg-blue-500" },
                    { label: "Vibe",   v: audioFeatures.valence, color: "bg-green-500" },
                    { label: "Acoustic", v: audioFeatures.acousticness, color: "bg-yellow-500" },
                  ].map(f => (
                    <div key={f.label} className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground w-14">{f.label}</span>
                      <div className="flex-1 h-1.5 bg-secondary/60 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${f.v * 100}%` }}
                          transition={{ delay: 0.1 }} className={`h-full ${f.color} rounded-full`} />
                      </div>
                      <span className="text-[10px] tabular-nums text-muted-foreground w-8 text-right">{Math.round(f.v * 100)}%</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activePanel === "info" && (
              <motion.div key="info" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                transition={{ type: "tween", duration: 0.28, ease: [0.45, 0, 0.55, 1] }}
                className="rounded-xl bg-secondary/30 p-4 space-y-2.5">
                {[
                  { label: "Album", value: currentTrack.album.name },
                  { label: "Artisti", value: currentTrack.artists.map((a: any) => a.name).join(", ") },
                  { label: "Data uscita", value: currentTrack.album.release_date },
                  { label: "Durata", value: formatTime(duration) },
                  { label: "Popolarità", value: `${currentTrack.popularity}%` },
                  ...(bpm ? [{ label: "BPM", value: `${bpm}` }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-start gap-3">
                    <span className="text-sm text-muted-foreground shrink-0">{label}</span>
                    <span className="text-sm font-medium text-right">{value}</span>
                  </div>
                ))}
              </motion.div>
            )}

            {activePanel === "timer" && (
              <motion.div key="timer" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                transition={{ type: "tween", duration: 0.28, ease: [0.45, 0, 0.55, 1] }}
                className="rounded-xl bg-secondary/30 p-4 space-y-3">
                <p className="text-sm font-semibold">⏱ Sleep Timer</p>
                {sleepTimer.active ? (
                  <div className="flex items-center justify-between">
                    <span className="text-amber-400 font-mono text-lg">{formatTime(sleepTimer.remaining)}</span>
                    <button onClick={sleepTimer.cancel}
                      className="px-3 py-1.5 rounded-lg bg-destructive/20 text-destructive text-xs font-semibold">
                      Annulla
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {[5, 10, 15, 20, 30, 45, 60, 90].map(m => (
                      <button key={m} onClick={() => { sleepTimer.start(m); setActivePanel(null); }}
                        className="py-2 rounded-xl bg-background/30 text-sm font-medium hover:bg-primary/20 hover:text-primary transition-colors">
                        {m < 60 ? `${m}m` : `${m/60}h`}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Play count placeholder */}
          {audioFeatures && (
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />Popularità: {currentTrack.popularity}%</span>
              {bpm && <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{bpm} BPM</span>}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
