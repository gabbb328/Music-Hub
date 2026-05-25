import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic2, Disc, Lightbulb, Music, Loader2, Clock, Languages, AlignCenter, AlignLeft, Sparkles, Brain, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Track } from "@/lib/mock-data";
import { usePlaybackState, useAudioFeatures, useSeekMutation } from "@/hooks/useSpotify";
import { formatTime } from "@/lib/mock-data";
import { fetchSyncedLyrics, getCurrentLineIndex, type LyricLine } from "@/services/lyrics-api";
import { translateText } from "@/services/translation-api";
import { useToast } from "@/hooks/use-toast";
import { useVocalRemover } from "@/hooks/useVocalRemover";
import { fetchSongTrivia, type TriviaResult } from "@/services/trivia-api";

interface LyricsContentProps { currentTrack: Track | null; }
type Mode = "lyrics" | "info" | "analysis" | "trivia";

export default function LyricsContent({ currentTrack: localTrack }: LyricsContentProps) {
  const [mode, setMode]                         = useState<Mode>("lyrics");
  const [lyrics, setLyrics]                     = useState<LyricLine[]>([]);
  const [translatedLyrics, setTranslatedLyrics] = useState<Map<number, string>>(new Map());
  const [showTranslation, setShowTranslation]   = useState(false);
  const [isTranslating, setIsTranslating]       = useState(false);
  const [isSynced, setIsSynced]                 = useState(false);
  const [loadingLyrics, setLoadingLyrics]       = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [centerMode, setCenterMode]             = useState(true);
  const [userScrolling, setUserScrolling]       = useState(false);
  const [trivia, setTrivia]                     = useState<TriviaResult[]>([]);
  const [loadingTrivia, setLoadingTrivia]       = useState(false);

  const { isKaraokeActive, toggleKaraoke } = useVocalRemover();

  const containerRef   = useRef<HTMLDivElement>(null);
  const lineRefs       = useRef<(HTMLDivElement | null)[]>([]);
  const userScrollRef  = useRef(false);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: playbackState }                          = usePlaybackState();
  const currentTrack                                     = playbackState?.item || localTrack;
  const { data: audioFeatures, isLoading: loadingFeat }  = useAudioFeatures((currentTrack as any)?.id || "");
  const seekMutation = useSeekMutation();
  const { toast }    = useToast();

  const isPlaying   = playbackState?.is_playing;
  const currentTime = playbackState?.progress_ms ? playbackState.progress_ms / 1000 : 0;

  // Real-time timer to drive smooth 60fps animations
  const [activeTime, setActiveTime] = useState(0);

  // Dynamic container height tracker for perfect pixel-centered vertical spacers
  const [containerHeight, setContainerHeight] = useState(300);

  // Sync activeTime with playbackState updates
  useEffect(() => {
    setActiveTime(currentTime);
  }, [currentTime]);

  // Tick activeTime locally if playing to guarantee smooth transition animations
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveTime(prev => prev + 0.1);
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Monitor exact container height dynamically to center the lyrics vertically
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [lyrics]);

  // ── Carica testo ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentTrack) return;
    const title    = (currentTrack as any).name   || (currentTrack as any).title   || "";
    const artist   = (currentTrack as any).artists?.[0]?.name || (currentTrack as any).artist || "";
    const duration = (currentTrack as any).duration_ms
      ? Math.floor((currentTrack as any).duration_ms / 1000)
      : (currentTrack as any).duration || 180;
    setLoadingLyrics(true);
    setLyrics([]);
    setTranslatedLyrics(new Map());
    setShowTranslation(false);
    setCurrentLineIndex(0);
    setActiveTime(0);
    
    fetchSyncedLyrics(title, artist, duration).then(({ lines, synced }) => {
      setLyrics(lines);
      setIsSynced(synced);
      setLoadingLyrics(false);
    });
    
    setLoadingTrivia(true);
    fetchSongTrivia(artist, title).then(res => {
      setTrivia(res);
      setLoadingTrivia(false);
    });
  }, [(currentTrack as any)?.id]);

  // ── Aggiorna riga corrente ────────────────────────────────────────────────
  useEffect(() => {
    if (lyrics.length > 0) {
      const idx = getCurrentLineIndex(lyrics, activeTime);
      if (idx !== currentLineIndex) setCurrentLineIndex(idx);
    }
  }, [activeTime, lyrics]);

  // ── Scroll al centro ──────────────────────────────────────────────────────
  const scrollToCurrentLine = useCallback(() => {
    if (!centerMode || userScrollRef.current) return;
    const container = containerRef.current;
    const line      = lineRefs.current[currentLineIndex];
    if (!container || !line) return;

    // Recursively accumulate offsets relative to the scrolling container to ensure dead-center placement
    let actualOffsetTop = 120;
    let currentEl: HTMLElement | null = line;
    while (currentEl && currentEl !== container) {
      actualOffsetTop += currentEl.offsetTop;
      currentEl = currentEl.offsetParent as HTMLElement | null;
    }

    const targetScroll = actualOffsetTop - container.clientHeight / 2 + line.clientHeight / 2;
    container.scrollTo({ top: Math.max(0, targetScroll), behavior: "smooth" });
  }, [centerMode, currentLineIndex]);

  useEffect(() => { scrollToCurrentLine(); }, [currentLineIndex, centerMode, scrollToCurrentLine]);

  const handleScroll = useCallback(() => {
    if (!centerMode) return;
    userScrollRef.current = true;
    setUserScrolling(true);
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      userScrollRef.current = false;
      setUserScrolling(false);
      scrollToCurrentLine();
    }, 3000);
  }, [centerMode, scrollToCurrentLine]);

  const handleLineClick = async (line: LyricLine) => {
    try {
      await seekMutation.mutateAsync(Math.floor(line.time * 1000));
      userScrollRef.current = false;
      setUserScrolling(false);
    } catch {
      toast({ title: "Seek failed", description: "Make sure a device is playing", variant: "destructive" });
    }
  };

  const handleTranslate = async () => {
    if (showTranslation) { setShowTranslation(false); return; }
    if (translatedLyrics.size > 0) { setShowTranslation(true); return; }
    setIsTranslating(true);
    
    const systemLang = (typeof navigator !== 'undefined' && navigator.language)
      ? navigator.language.split('-')[0]
      : "it";
    
    const langDisplay = systemLang.toUpperCase();
    
    toast({ 
      title: `Traduzione in corso (${langDisplay})…`, 
      description: "Traduzione intelligente in corso alla lingua del tuo sistema..." 
    });

    const map = new Map<number, string>();
    try {
      for (let i = 0; i < lyrics.length; i++) {
        const l = lyrics[i];
        if (l.text.trim() && !l.text.includes("♪")) {
          const res = await translateText(l.text, systemLang);
          if (res) map.set(i, res.translatedText);
        }
        if (i % 5 === 0) setTranslatedLyrics(new Map(map));
      }
      setTranslatedLyrics(map);
      setShowTranslation(true);
      toast({ title: "✓ Traduzione completata", description: `${map.size} righe tradotte in ${langDisplay}` });
    } catch (err) {
      toast({ 
        title: "Errore di traduzione", 
        description: "Impossibile tradurre i testi, riprova più tardi.", 
        variant: "destructive" 
      });
    } finally {
      setIsTranslating(false);
    }
  };

  if (!currentTrack) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <Mic2 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Riproduci un brano per visualizzare il testo</p>
        </div>
      </div>
    );
  }

  const spotifyTrack = playbackState?.item;

  return (
    <div className="flex-1 overflow-hidden flex flex-col animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 pt-4 pb-3 shrink-0 border-b border-border/30">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <img src={(currentTrack as any).album?.images?.[0]?.url || (currentTrack as any).cover || ""} alt=""
              className="w-11 h-11 rounded-lg object-cover shadow-md" />
            {isPlaying && (
              <motion.div className="absolute inset-0 rounded-lg ring-2 ring-primary/50"
                animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 2, repeat: Infinity }} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold truncate text-sm">{(currentTrack as any).name || (currentTrack as any).title}</p>
            <p className="text-xs text-muted-foreground truncate">{(currentTrack as any).artists?.[0]?.name || (currentTrack as any).artist}</p>
            {mode === "lyrics" && (
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {isSynced && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-green-500" />
                    <span className="text-[10px] text-green-500 font-medium">Synced</span>
                  </div>
                )}
                {isSynced && (
                  <Button size="sm" variant={centerMode ? "default" : "outline"}
                    onClick={() => {
                      setCenterMode(v => {
                        const next = !v;
                        if (next) { userScrollRef.current = false; setTimeout(() => scrollToCurrentLine(), 50); }
                        return next;
                      });
                    }}
                    className="h-6 px-2 text-[10px] gap-1">
                    {centerMode ? <AlignCenter className="w-2.5 h-2.5" /> : <AlignLeft className="w-2.5 h-2.5" />}
                    {centerMode ? "Centered" : "Free"}
                  </Button>
                )}
                {lyrics.length > 0 && !isTranslating && (
                  <Button size="sm" variant={showTranslation ? "default" : "outline"}
                    onClick={handleTranslate} className="h-6 px-2 text-[10px] gap-1">
                    <Languages className="w-2.5 h-2.5" />
                    {showTranslation ? "Original" : "Translate"}
                  </Button>
                )}
                <Button size="sm" variant={isKaraokeActive ? "default" : "outline"}
                  onClick={toggleKaraoke} className={`h-6 px-2 text-[10px] gap-1 ${isKaraokeActive ? "bg-pink-600 text-white hover:bg-pink-700" : "text-muted-foreground"}`}>
                  <Mic2 className="w-2.5 h-2.5" />
                  {isKaraokeActive ? "Karaoke ON" : "Karaoke Mode"}
                </Button>
                {isTranslating && (
                  <div className="flex items-center gap-1">
                    <Loader2 className="w-2.5 h-2.5 animate-spin text-primary" />
                    <span className="text-[10px] text-primary">Translating…</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0.5 p-1 rounded-full bg-secondary self-start sm:self-auto shrink-0">
          {([
            { id: "lyrics"   as Mode, label: "Lyrics",   icon: Mic2      },
            { id: "trivia"   as Mode  , label: "About",   icon: Lightbulb },
            { id: "info"     as Mode, label: "Info",     icon: Disc      },
            { id: "analysis" as Mode, label: "Analysis", icon: Music },
          ]).map(tab => (
            <button key={tab.id} onClick={() => setMode(tab.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                mode === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}>
              <tab.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-hidden relative">

        {/* ── LYRICS ── */}
        {mode === "lyrics" && (
          <div ref={containerRef} onScroll={handleScroll} className="absolute inset-0 overflow-y-auto pb-10">
            {loadingLyrics ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
                <p className="text-sm text-muted-foreground">Loading lyrics…</p>
              </div>
            ) : lyrics.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-4 text-center">
                <Music className="w-14 h-14 text-muted-foreground/30 mb-3" />
                <h3 className="text-lg font-semibold mb-1">Lyrics not available</h3>
                <p className="text-sm text-muted-foreground">No lyrics found for this track</p>
              </div>
            ) : (
              <>
                {/* Dynamic spacer that perfectly targets the vertical center of the container */}
                <div style={{ height: `${containerHeight / 2}px` }} aria-hidden />

                <AnimatePresence>
                  {userScrolling && centerMode && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="sticky top-2 z-10 mx-auto mb-2 py-1.5 px-3 bg-secondary/90 backdrop-blur-sm rounded-full text-center w-fit">
                      <p className="text-[10px] text-muted-foreground">Auto-scroll paused · resumes in 3s</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mx-auto w-full max-w-2xl px-4 md:px-8 space-y-1 flex flex-col items-center">
                  {lyrics.map((line, index) => {
                    const isCurrent = index === currentLineIndex;
                    const isPast    = index < currentLineIndex;
                    const translation = translatedLyrics.get(index);
                    const isBreak = !line.text.trim() ||
                      /^\[.*\]$/.test(line.text) || /^\(.*\)$/.test(line.text) ||
                      /instrumental|music/i.test(line.text);

                    // Split original line into individual words for karaoke zoom effect
                    const words = line.text.split(/\s+/);
                    const nextLine = lyrics[index + 1];
                    const lineDuration = nextLine ? nextLine.time - line.time : 4;
                    const lineProgress = Math.max(0, Math.min(1, (activeTime - line.time) / lineDuration));
                    const activeWordIndex = Math.floor(lineProgress * words.length);

                    return (
                      <div
                        key={index}
                        ref={el => { lineRefs.current[index] = el; }}
                        onClick={() => isSynced && handleLineClick(line)}
                        className={`
                          w-full px-4 py-3 rounded-2xl transition-all duration-300 text-center flex flex-col items-center justify-center
                          ${isSynced ? "cursor-pointer hover:bg-secondary/40 active:scale-[0.98]" : "cursor-default"}
                          ${isCurrent ? "bg-primary/10" : ""}
                        `}
                      >
                        {isBreak ? (
                          <div className="flex items-center justify-center gap-2 py-1 text-center w-full">
                            <Music className={`w-4 h-4 ${isCurrent ? "text-primary" : "text-muted-foreground/30"}`} />
                            <span className={`text-sm italic text-center ${isCurrent ? "text-primary" : "text-muted-foreground/30"}`}>
                              {line.text.trim() || "Instrumental"}
                            </span>
                            <Music className={`w-4 h-4 ${isCurrent ? "text-primary" : "text-muted-foreground/30"}`} />
                          </div>
                        ) : (
                          <div className="space-y-1.5 flex flex-col items-center justify-center w-full text-center">
                            {/* Subtitle Translation - Explicitly centered horizontally and given full width */}
                            {showTranslation && translation && (
                              <p className={`leading-snug transition-all duration-300 font-medium text-center w-full px-2 ${
                                isCurrent
                                  ? "text-primary/80 font-semibold text-base md:text-xl animate-fade-in"
                                  : isPast
                                    ? "text-muted-foreground/25 text-xs md:text-sm"
                                    : "text-muted-foreground/45 text-xs md:text-sm"
                              }`}>
                                {translation}
                              </p>
                            )}
                            
                            {/* Bouncy word-magnification Karaoke Rendering */}
                            {isCurrent && isSynced && isKaraokeActive ? (
                              <div className="flex flex-wrap justify-center gap-x-2 gap-y-1 w-full text-center px-4 py-1">
                                {words.map((word, wIdx) => {
                                  const isWordActive = wIdx === activeWordIndex;
                                  const isWordPast = wIdx < activeWordIndex;
                                  return (
                                    <motion.span
                                      key={wIdx}
                                      animate={{
                                        scale: isWordActive ? 1.25 : 1,
                                        y: isWordActive ? -2 : 0,
                                      }}
                                      transition={{ duration: 0.15, ease: "easeOut" }}
                                      className={`inline-block font-extrabold text-2xl md:text-4xl transition-colors duration-200 select-none text-center ${
                                        isWordActive
                                          ? "text-primary drop-shadow-[0_0_12px_hsl(var(--primary)/0.4)]"
                                          : isWordPast
                                            ? "text-muted-foreground/30"
                                            : "text-foreground/80"
                                      }`}
                                    >
                                      {word}
                                    </motion.span>
                                  );
                                })}
                              </div>
                            ) : (
                              /* Standard Plain Text Rendering - Centered horizontally explicitly inside <p> */
                              <p className={`leading-snug transition-all duration-300 font-medium text-center w-full px-2 ${
                                isCurrent
                                  ? "text-primary font-bold text-2xl md:text-3xl"
                                  : isPast
                                    ? "text-muted-foreground/35 text-lg md:text-xl"
                                    : "text-foreground/65 text-lg md:text-xl"
                              }`}>
                                {line.text}
                              </p>
                            )}

                            {/* Timestamp */}
                            {isSynced && isCurrent && (
                              <p className="text-[10px] text-primary/50 font-mono mt-1 text-center w-full">
                                {formatTime(Math.floor(line.time))}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Dynamic spacer that perfectly targets the vertical center of the container */}
                <div style={{ height: `${containerHeight / 2 + 650}px` }} aria-hidden />
              </>
            )}
          </div>
        )}

        {/* ── INFO ── */}
        {mode === "info" && spotifyTrack && (
          <div className="absolute inset-0 overflow-y-auto p-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <img src={spotifyTrack.album.images[0]?.url} alt={spotifyTrack.album.name}
                  className="w-full sm:w-44 aspect-square rounded-xl object-cover shadow-xl" />
                <div className="flex-1 space-y-3 w-full">
                  <div>
                    <h2 className="text-xl font-bold break-words">{spotifyTrack.name}</h2>
                    <p className="text-muted-foreground break-words">{spotifyTrack.artists.map((a: any) => a.name).join(", ")}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Album",    value: spotifyTrack.album.name },
                      { label: "Release",  value: spotifyTrack.album.release_date },
                      { label: "Duration", value: formatTime(Math.floor(spotifyTrack.duration_ms / 1000)) },
                    ].map(({ label, value }) => (
                      <div key={label} className="space-y-0.5">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-sm font-medium break-words">{value}</p>
                      </div>
                    ))}
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Popularity</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${spotifyTrack.popularity}%` }} />
                        </div>
                        <span className="text-xs font-medium">{spotifyTrack.popularity}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* ── ANALYSIS ── */}
        {mode === "analysis" && (
          <div className="absolute inset-0 overflow-y-auto p-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 max-w-2xl mx-auto">
              {loadingFeat ? (
                <div className="flex flex-col items-center justify-center h-40">
                  <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
                  <p className="text-sm text-muted-foreground">Loading analysis…</p>
                </div>
              ) : audioFeatures ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: "Energy",          value: audioFeatures.energy,          color: "bg-red-500" },
                      { label: "Danceability",     value: audioFeatures.danceability,     color: "bg-blue-500" },
                      { label: "Valence",          value: audioFeatures.valence,          color: "bg-green-500" },
                      { label: "Acousticness",     value: audioFeatures.acousticness,     color: "bg-yellow-500" },
                      { label: "Instrumentalness", value: audioFeatures.instrumentalness, color: "bg-purple-500" },
                      { label: "Speechiness",      value: audioFeatures.speechiness,      color: "bg-pink-500" },
                    ].map(f => (
                      <div key={f.label} className="p-3 rounded-xl bg-secondary/50">
                        <p className="text-xs text-muted-foreground mb-1.5">{f.label}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2.5 bg-secondary rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${f.value * 100}%` }}
                              transition={{ duration: 1, delay: 0.1 }} className={`h-full ${f.color} rounded-full`} />
                          </div>
                          <span className="text-xs font-bold w-8 text-right">{Math.round(f.value * 100)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Tempo",          value: `${Math.round(audioFeatures.tempo)} BPM` },
                      { label: "Key",            value: `${["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"][audioFeatures.key]} ${audioFeatures.mode === 1 ? "Major" : "Minor"}` },
                      { label: "Time Signature", value: `${audioFeatures.time_signature}/4` },
                      { label: "Loudness",       value: `${Math.round(audioFeatures.loudness)} dB` },
                    ].map(({ label, value }) => (
                      <div key={label} className="p-3 rounded-xl bg-secondary/50">
                        <p className="text-xs text-muted-foreground mb-1">{label}</p>
                        <p className="text-lg font-bold">{value}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <Music className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">Audio analysis not available</p>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* ── TRIVIA ── */}
        {mode === "trivia" && (
          <div className="absolute inset-0 overflow-y-auto p-4 md:p-6 bg-gradient-to-b from-transparent to-background/30">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-2xl mx-auto pb-10">
              
              {/* Header Banner */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600/10 via-primary/10 to-cyan-500/10 border border-primary/10 p-5 md:p-6 flex flex-col md:flex-row items-center gap-4 text-center md:text-left backdrop-blur-sm">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
                <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-inner shrink-0 relative">
                  <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                  <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-1 border border-dashed border-primary/30 rounded-2xl pointer-events-none"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <h2 className="text-xl font-bold tracking-tight">AI Insights & Curiosità</h2>
                    <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">
                      Live
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
                    Analisi intelligente in tempo reale per scoprire fatti incredibili, aneddoti storici e dettagli di produzione su questa canzone e sul suo interprete.
                  </p>
                </div>
              </div>

              {loadingTrivia ? (
                <div className="flex flex-col items-center justify-center h-52 space-y-4">
                  <div className="relative flex items-center justify-center">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <Sparkles className="w-5 h-5 text-cyan-400 absolute animate-pulse" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-semibold text-foreground">Elaborazione in corso...</p>
                    <p className="text-xs text-muted-foreground animate-pulse">Sintesi dei dati musicali in tempo reale...</p>
                  </div>
                </div>
              ) : trivia.length > 0 ? (
                <div className="grid grid-cols-1 gap-5">
                  {trivia.map((item, idx) => {
                    const isAI = item.type === 'ai';
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.08 }}
                      >
                        <Card className="p-6 border border-border/30 hover:border-primary/30 bg-card/25 backdrop-blur-md hover:bg-card/35 transition-all duration-300 relative group overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5">
                          
                          {/* Top accent line */}
                          <div className={`absolute top-0 inset-x-0 h-[2px] transition-all duration-300 ${
                            isAI ? "bg-gradient-to-r from-violet-500 via-primary to-cyan-400" : "bg-gradient-to-r from-muted-foreground/20 to-muted-foreground/10"
                          }`} />
                          
                          {/* Corner glow */}
                          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          
                          <div className="flex items-start gap-4">
                            <div className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${
                              isAI 
                                ? "bg-violet-500/10 border-violet-500/20 text-violet-400" 
                                : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                            }`}>
                              {isAI ? <Brain className="w-4.5 h-4.5" /> : <BookOpen className="w-4.5 h-4.5" />}
                            </div>
                            
                            <div className="space-y-2.5 flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                                <h3 className="font-bold text-base leading-snug group-hover:text-primary transition-colors pr-2">
                                  {item.title}
                                </h3>
                                
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border tracking-wide w-fit uppercase shrink-0 ${
                                  isAI 
                                    ? "bg-violet-500/10 text-violet-400 border-violet-500/20" 
                                    : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                                }`}>
                                  {isAI ? "AI Synthesized" : "Official Bio"}
                                </span>
                              </div>
                              
                              <p className="text-sm leading-relaxed text-muted-foreground font-normal">
                                {item.extract}
                              </p>
                              
                              <div className="pt-2 flex items-center justify-between text-[10px] text-muted-foreground/60 border-t border-border/10">
                                <span className="flex items-center gap-1">
                                  <Lightbulb className="w-3.5 h-3.5 text-yellow-500/70" />
                                  <span>Fonte verificata</span>
                                </span>
                                <span className="font-medium italic text-primary/70">
                                  {item.source}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                  <div className="p-4 bg-muted/40 rounded-full">
                    <Music className="w-10 h-10 text-muted-foreground/30" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">Nessuna curiosità trovata</p>
                    <p className="text-xs text-muted-foreground">Trivia non disponibile per questo brano in questo momento.</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
