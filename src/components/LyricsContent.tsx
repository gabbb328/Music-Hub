import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic2, Disc, Lightbulb, Music, Loader2, Clock, Languages, AlignCenter, AlignLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Track } from "@/lib/mock-data";
import { usePlaybackState, useAudioFeatures, useSeekMutation } from "@/hooks/useSpotify";
import { formatTime } from "@/lib/mock-data";
import { fetchSyncedLyrics, getCurrentLineIndex, type LyricLine } from "@/services/lyrics-api";
import { translateText } from "@/services/translation-api";
import { useToast } from "@/hooks/use-toast";

interface LyricsContentProps { currentTrack: Track | null; }
type Mode = "lyrics" | "info" | "analysis";

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
    fetchSyncedLyrics(title, artist, duration).then(({ lines, synced }) => {
      setLyrics(lines);
      setIsSynced(synced);
      setLoadingLyrics(false);
    });
  }, [(currentTrack as any)?.id]);

  // ── Aggiorna riga corrente ────────────────────────────────────────────────
  useEffect(() => {
    if (lyrics.length > 0) {
      const idx = getCurrentLineIndex(lyrics, currentTime);
      if (idx !== currentLineIndex) setCurrentLineIndex(idx);
    }
  }, [currentTime, lyrics]);

  // ── Scroll al centro ──────────────────────────────────────────────────────
  const scrollToCurrentLine = useCallback(() => {
    if (!centerMode || userScrollRef.current) return;
    const container = containerRef.current;
    const line      = lineRefs.current[currentLineIndex];
    if (!container || !line) return;
    // Calcolo preciso: porta la riga esattamente al centro verticale del container
    const targetScroll = line.offsetTop - container.clientHeight / 2 + line.clientHeight / 2;
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
    toast({ title: "Translating…", description: "This may take a moment" });
    const map = new Map<number, string>();
    for (let i = 0; i < lyrics.length; i++) {
      const l = lyrics[i];
      if (l.text.trim() && !l.text.includes("♪")) {
        const res = await translateText(l.text, "it");
        if (res) map.set(i, res.translatedText);
      }
      if (i % 5 === 0) setTranslatedLyrics(new Map(map));
    }
    setTranslatedLyrics(map);
    setIsTranslating(false);
    setShowTranslation(true);
    toast({ title: "✓ Translation complete", description: `${map.size} lines translated` });
  };

  if (!currentTrack) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <Mic2 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Play a track to see lyrics</p>
        </div>
      </div>
    );
  }

  const spotifyTrack = playbackState?.item;

  return (
    <div className="flex-1 overflow-hidden flex flex-col">

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
            { id: "lyrics" as Mode, label: "Lyrics",   icon: Mic2      },
            { id: "info"   as Mode, label: "Info",      icon: Disc      },
            { id: "analysis" as Mode, label: "Analysis", icon: Lightbulb },
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
          <div ref={containerRef} onScroll={handleScroll} className="absolute inset-0 overflow-y-auto">
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
                {/* Spacer top: porta la prima riga al centro */}
                <div style={{ height: "50vh" }} aria-hidden />

                <AnimatePresence>
                  {userScrolling && centerMode && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="sticky top-2 z-10 mx-auto mb-2 py-1.5 px-3 bg-secondary/90 backdrop-blur-sm rounded-full text-center w-fit">
                      <p className="text-[10px] text-muted-foreground">Auto-scroll paused · resumes in 3s</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/*
                  FIX CENTRAMENTO:
                  - Il contenitore di tutte le righe è centrato orizzontalmente
                  - max-w-2xl limita la larghezza su schermi grandi
                  - text-center centra il testo dentro ogni riga
                  - mx-auto centra il blocco
                */}
                <div className="mx-auto w-full max-w-2xl px-4 space-y-1">
                  {lyrics.map((line, index) => {
                    const isCurrent = index === currentLineIndex;
                    const isPast    = index < currentLineIndex;
                    const translation = translatedLyrics.get(index);
                    const isBreak = !line.text.trim() ||
                      /^\[.*\]$/.test(line.text) || /^\(.*\)$/.test(line.text) ||
                      /instrumental|music/i.test(line.text);

                    return (
                      <div
                        key={index}
                        ref={el => { lineRefs.current[index] = el; }}
                        onClick={() => isSynced && handleLineClick(line)}
                        className={`
                          px-4 py-3 rounded-2xl transition-all duration-300 text-center
                          ${isSynced ? "cursor-pointer hover:bg-secondary/40 active:scale-[0.98]" : "cursor-default"}
                          ${isCurrent ? "bg-primary/10" : ""}
                        `}
                      >
                        {isBreak ? (
                          <div className="flex items-center justify-center gap-2 py-1">
                            <Music className={`w-4 h-4 ${isCurrent ? "text-primary" : "text-muted-foreground/30"}`} />
                            <span className={`text-sm italic ${isCurrent ? "text-primary" : "text-muted-foreground/30"}`}>
                              {line.text.trim() || "Instrumental"}
                            </span>
                            <Music className={`w-4 h-4 ${isCurrent ? "text-primary" : "text-muted-foreground/30"}`} />
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            {/* Traduzione (principale se attiva) */}
                            {showTranslation && translation && (
                              <p className={`leading-snug transition-all duration-300 font-medium ${
                                isCurrent
                                  ? "text-primary font-bold text-xl md:text-3xl scale-105"
                                  : isPast
                                    ? "text-muted-foreground/35 text-base md:text-xl"
                                    : "text-muted-foreground/55 text-base md:text-xl"
                              }`}>
                                {translation}
                              </p>
                            )}
                            {/* Testo originale */}
                            <p className={`leading-snug transition-all duration-300 font-medium ${
                              showTranslation && translation
                                ? "text-muted-foreground/35 text-xs"
                                : isCurrent
                                  ? "text-primary font-bold text-2xl md:text-3xl"
                                  : isPast
                                    ? "text-muted-foreground/35 text-lg md:text-xl"
                                    : "text-foreground/65 text-lg md:text-xl"
                            }`}>
                              {line.text}
                            </p>
                            {/* Timestamp solo sulla riga corrente */}
                            {isSynced && isCurrent && (
                              <p className="text-[10px] text-primary/50 font-mono mt-1">
                                {formatTime(Math.floor(line.time))}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Spacer bottom */}
                <div style={{ height: "50vh" }} aria-hidden />
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
      </div>
    </div>
  );
}
