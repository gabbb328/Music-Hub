import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic2, Disc, Lightbulb, Music, Loader2, Clock, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Track } from "@/lib/mock-data";
import { 
  usePlaybackState, 
  useAudioFeatures,
  useSeekMutation 
} from "@/hooks/useSpotify";
import { formatTime } from "@/lib/mock-data";
import { 
  fetchSyncedLyrics, 
  getCurrentLineIndex, 
  getDisplayLines,
  type LyricLine 
} from "@/services/lyrics-api";
import { translateText } from "@/services/translation-api";
import { useToast } from "@/hooks/use-toast";

interface LyricsContentProps {
  currentTrack: Track | null;
}

type Mode = "lyrics" | "info" | "analysis";

export default function LyricsContent({ currentTrack: localTrack }: LyricsContentProps) {
  const [mode, setMode] = useState<Mode>("lyrics");
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [translatedLyrics, setTranslatedLyrics] = useState<Map<number, string>>(new Map());
  const [showTranslation, setShowTranslation] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [loadingLyrics, setLoadingLyrics] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const currentLineRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  
  const { data: playbackState } = usePlaybackState();
  const currentTrack = playbackState?.item || localTrack;
  const { data: audioFeatures, isLoading: loadingFeatures } = useAudioFeatures(currentTrack?.id || "");
  const seekMutation = useSeekMutation();
  const { toast } = useToast();
  
  const isPlaying = playbackState?.is_playing;
  const currentTime = playbackState?.progress_ms ? playbackState.progress_ms / 1000 : 0;
  
  useEffect(() => {
    if (currentTrack) {
      const title = currentTrack.name || currentTrack.title;
      const artist = currentTrack.artists?.[0]?.name || currentTrack.artist;
      const duration = currentTrack.duration_ms 
        ? Math.floor(currentTrack.duration_ms / 1000)
        : currentTrack.duration || 180;
      
      setLoadingLyrics(true);
      setLyrics([]);
      setTranslatedLyrics(new Map());
      setShowTranslation(false);
      setCurrentLineIndex(0);
      setIsUserScrolling(false);
      
      fetchSyncedLyrics(title, artist, duration).then(({ lines, synced }) => {
        setLyrics(lines);
        setIsSynced(synced);
        setLoadingLyrics(false);
      });
    }
  }, [currentTrack?.id]);

  useEffect(() => {
    if (lyrics.length > 0 && isPlaying) {
      const newIndex = getCurrentLineIndex(lyrics, currentTime);
      if (newIndex !== currentLineIndex) {
        setCurrentLineIndex(newIndex);
      }
    }
  }, [currentTime, lyrics, isPlaying]);

  useEffect(() => {
    if (currentLineRef.current && lyricsContainerRef.current && !isUserScrolling) {
      currentLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentLineIndex, isUserScrolling]);

  const handleScroll = () => {
    setIsUserScrolling(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => setIsUserScrolling(false), 3000);
  };

  const handleLineClick = async (line: LyricLine) => {
    try {
      const positionMs = Math.floor(line.time * 1000);
      await seekMutation.mutateAsync(positionMs);
      setIsUserScrolling(false);
      
      toast({
        title: "✓ Jumped",
        description: line.text.substring(0, 50),
      });
    } catch (error) {
      toast({
        title: "Seek Failed",
        description: "Make sure a device is playing",
        variant: "destructive",
      });
    }
  };

  const handleTranslate = async () => {
    if (showTranslation) {
      setShowTranslation(false);
      return;
    }

    if (translatedLyrics.size === 0) {
      setIsTranslating(true);
      toast({
        title: "Translating...",
        description: "This may take a moment",
      });

      const newTranslations = new Map<number, string>();
      
      for (let i = 0; i < lyrics.length; i++) {
        const line = lyrics[i];
        if (line.text.trim() && !line.text.includes('♪')) {
          const result = await translateText(line.text, 'it');
          if (result) {
            newTranslations.set(i, result.translatedText);
          }
        }
        
        if (i % 5 === 0) {
          setTranslatedLyrics(new Map(newTranslations));
        }
      }

      setTranslatedLyrics(newTranslations);
      setIsTranslating(false);
      setShowTranslation(true);
      
      toast({
        title: "✓ Translation Complete",
        description: `${newTranslations.size} lines translated`,
      });
    } else {
      setShowTranslation(true);
    }
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
  const displayLines = getDisplayLines(lyrics, currentLineIndex, 2, 3);

  return (
    <div className="flex-1 overflow-hidden flex flex-col p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className="relative flex-shrink-0">
            <img 
              src={currentTrack.album?.images?.[0]?.url || currentTrack.cover} 
              alt="" 
              className="w-12 h-12 md:w-14 md:h-14 rounded-lg object-cover shadow-lg" 
            />
            {isPlaying && (
              <motion.div
                className="absolute inset-0 rounded-lg ring-2 ring-primary/40"
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg md:text-xl font-bold text-foreground truncate">
              {currentTrack.name || currentTrack.title}
            </h1>
            <p className="text-sm text-muted-foreground truncate">
              {currentTrack.artists?.[0]?.name || currentTrack.artist}
            </p>
            {mode === "lyrics" && (
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {isSynced && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-green-500">Time-synced</span>
                  </div>
                )}
                {lyrics.length > 0 && !isTranslating && (
                  <Button
                    size="sm"
                    variant={showTranslation ? "default" : "outline"}
                    onClick={handleTranslate}
                    className="h-6 text-xs"
                  >
                    <Languages className="w-3 h-3 mr-1" />
                    {showTranslation ? "Original" : "Translate"}
                  </Button>
                )}
                {isTranslating && (
                  <div className="flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin text-primary" />
                    <span className="text-xs text-primary">Translating...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-full bg-secondary overflow-x-auto">
          {([
            { id: "lyrics" as Mode, label: "Lyrics", icon: Mic2 },
            { id: "info" as Mode, label: "Info", icon: Disc },
            { id: "analysis" as Mode, label: "Analysis", icon: Lightbulb },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMode(tab.id)}
              className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
                mode === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {mode === "lyrics" && (
          <div 
            ref={lyricsContainerRef}
            onScroll={handleScroll}
            className="h-full overflow-y-auto px-2"
          >
            {loadingLyrics ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading lyrics...</p>
              </div>
            ) : lyrics.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-4 text-center">
                <Music className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Lyrics Not Available</h3>
              </div>
            ) : (
              <div className="space-y-2 py-8">
                {isUserScrolling && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="sticky top-0 z-10 mb-4 p-2 bg-secondary/90 backdrop-blur-sm rounded-lg text-center"
                  >
                    <p className="text-xs text-muted-foreground">
                      Auto-scroll paused • Will resume in 3s
                    </p>
                  </motion.div>
                )}

                <AnimatePresence mode="sync">
                  {displayLines.map(({ line, index, isCurrent, isPast }) => {
                    const translation = translatedLyrics.get(index);
                    return (
                      <motion.div
                        key={index}
                        ref={isCurrent ? currentLineRef : null}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ 
                          opacity: 1, 
                          x: 0
                        }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        onClick={() => handleLineClick(line)}
                        className={`
                          px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer
                          ${isCurrent 
                            ? 'bg-primary/20 shadow-lg shadow-primary/20' 
                            : isPast 
                              ? 'hover:bg-secondary/30' 
                              : 'hover:bg-secondary/50'
                          }
                          ${seekMutation.isPending ? 'opacity-50 cursor-wait' : 'hover:scale-[1.01]'}
                        `}
                      >
                        <div className="flex items-start gap-3">
                          {isSynced && (
                            <span className={`
                              text-xs font-mono mt-1 w-12 flex-shrink-0 transition-colors
                              ${isCurrent 
                                ? 'text-primary font-bold' 
                                : isPast
                                  ? 'text-muted-foreground/40'
                                  : 'text-muted-foreground/60'
                              }
                            `}>
                              {formatTime(Math.floor(line.time))}
                            </span>
                          )}
                          <div className="flex-1 space-y-1">
                            {showTranslation && translation && (
                              <p className={`
                                leading-relaxed transition-all duration-300
                                ${isCurrent 
                                  ? 'text-primary text-xl md:text-2xl font-bold' 
                                  : isPast 
                                    ? 'text-muted-foreground/60 text-base md:text-lg'
                                    : 'text-foreground/80 text-base md:text-lg'
                                }
                              `}>
                                {translation}
                              </p>
                            )}
                            
                            <p className={`
                              leading-relaxed transition-all duration-300
                              ${showTranslation && translation
                                ? 'text-muted-foreground/50 text-sm'
                                : isCurrent 
                                  ? 'text-primary text-xl md:text-2xl font-bold' 
                                  : isPast 
                                    ? 'text-muted-foreground/60 text-base md:text-lg'
                                    : 'text-foreground/80 text-base md:text-lg'
                              }
                            `}>
                              {line.text}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                <div className="h-48" />
              </div>
            )}
          </div>
        )}

        {mode === "info" && spotifyTrack && (
          <div className="h-full overflow-y-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start gap-4 md:gap-6">
                <img src={spotifyTrack.album.images[0]?.url} alt={spotifyTrack.album.name} className="w-full sm:w-48 aspect-square rounded-lg object-cover shadow-xl" />
                <div className="flex-1 space-y-4 w-full">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold mb-2 break-words">{spotifyTrack.name}</h2>
                    <p className="text-lg md:text-xl text-muted-foreground break-words">{spotifyTrack.artists.map(a => a.name).join(", ")}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Album</p>
                      <p className="font-medium break-words">{spotifyTrack.album.name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Release Date</p>
                      <p className="font-medium">{spotifyTrack.album.release_date}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-medium">{formatTime(Math.floor(spotifyTrack.duration_ms / 1000))}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Popularity</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${spotifyTrack.popularity}%` }} />
                        </div>
                        <span className="text-sm font-medium">{spotifyTrack.popularity}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50">
                <p className="text-sm text-muted-foreground">Track {spotifyTrack.track_number} of {spotifyTrack.album.total_tracks} on {spotifyTrack.album.name}</p>
              </div>
            </motion.div>
          </div>
        )}

        {mode === "analysis" && (
          <div className="h-full overflow-y-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {loadingFeatures ? (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading audio analysis...</p>
                </div>
              ) : audioFeatures ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { label: "Energy", value: audioFeatures.energy, color: "bg-red-500" },
                      { label: "Danceability", value: audioFeatures.danceability, color: "bg-blue-500" },
                      { label: "Valence", value: audioFeatures.valence, color: "bg-green-500" },
                      { label: "Acousticness", value: audioFeatures.acousticness, color: "bg-yellow-500" },
                      { label: "Instrumentalness", value: audioFeatures.instrumentalness, color: "bg-purple-500" },
                      { label: "Speechiness", value: audioFeatures.speechiness, color: "bg-pink-500" },
                    ].map((feature) => (
                      <div key={feature.label} className="p-4 rounded-lg bg-secondary/50">
                        <p className="text-sm text-muted-foreground mb-2">{feature.label}</p>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${feature.value * 100}%` }} transition={{ duration: 1, delay: 0.2 }} className={`h-full ${feature.color} rounded-full`} />
                          </div>
                          <span className="text-sm font-bold">{Math.round(feature.value * 100)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-secondary/50">
                      <p className="text-sm text-muted-foreground mb-1">Tempo</p>
                      <p className="text-xl md:text-2xl font-bold">{Math.round(audioFeatures.tempo)} BPM</p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/50">
                      <p className="text-sm text-muted-foreground mb-1">Key</p>
                      <p className="text-xl md:text-2xl font-bold">{["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][audioFeatures.key]} {audioFeatures.mode === 1 ? "Major" : "Minor"}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/50">
                      <p className="text-sm text-muted-foreground mb-1">Time Signature</p>
                      <p className="text-xl md:text-2xl font-bold">{audioFeatures.time_signature}/4</p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/50">
                      <p className="text-sm text-muted-foreground mb-1">Loudness</p>
                      <p className="text-xl md:text-2xl font-bold">{Math.round(audioFeatures.loudness)} dB</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <Music className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">Audio features not available for this track</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
