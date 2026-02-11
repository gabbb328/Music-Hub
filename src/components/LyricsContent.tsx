import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic2, BookOpen, Languages, Lightbulb, Music, Clock, Disc } from "lucide-react";
import type { Track } from "@/lib/mock-data";
import { usePlaybackState, useAudioFeatures } from "@/hooks/useSpotify";
import { formatTime } from "@/lib/mock-data";

interface LyricsContentProps {
  currentTrack: Track | null;
}

// Mock lyrics generator basato sul titolo della canzone
const generateMockLyrics = (title: string, duration: number) => {
  const lines = Math.max(12, Math.floor(duration / 5));
  const timeStep = duration / lines;
  
  return Array.from({ length: lines }, (_, i) => ({
    time: Math.floor(i * timeStep),
    text: i === 0 
      ? `♪ ${title} ♪`
      : `Line ${i} of ${title.toLowerCase().replace(/[^a-z0-9\s]/gi, '')}...`
  }));
};

type Mode = "lyrics" | "info" | "analysis";

export default function LyricsContent({ currentTrack: localTrack }: LyricsContentProps) {
  const [activeLine, setActiveLine] = useState(0);
  const [mode, setMode] = useState<Mode>("lyrics");
  const { data: playbackState } = usePlaybackState();
  
  // Usa Spotify track se disponibile, altrimenti local
  const currentTrack = playbackState?.item || localTrack;
  const currentTrackId = currentTrack?.id;
  
  // Get audio features for analysis
  const { data: audioFeatures } = useAudioFeatures(currentTrackId || "");
  
  // Generate mock lyrics
  const [lyrics, setLyrics] = useState<Array<{time: number; text: string}>>([]);
  
  useEffect(() => {
    if (currentTrack) {
      const duration = currentTrack.duration_ms 
        ? Math.floor(currentTrack.duration_ms / 1000)
        : currentTrack.duration || 180;
      setLyrics(generateMockLyrics(currentTrack.name || currentTrack.title, duration));
      setActiveLine(0);
    }
  }, [currentTrack?.id]);
  
  // Auto-scroll based on playback position
  useEffect(() => {
    if (playbackState?.progress_ms && lyrics.length > 0) {
      const currentTime = Math.floor(playbackState.progress_ms / 1000);
      const currentLineIndex = lyrics.findIndex((line, i) => {
        const nextLine = lyrics[i + 1];
        return line.time <= currentTime && (!nextLine || nextLine.time > currentTime);
      });
      if (currentLineIndex !== -1) {
        setActiveLine(currentLineIndex);
      }
    }
  }, [playbackState?.progress_ms, lyrics]);

  if (!currentTrack) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Mic2 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Play a track to see lyrics and info</p>
        </div>
      </div>
    );
  }

  const spotifyTrack = playbackState?.item;
  const isPlaying = playbackState?.is_playing;

  return (
    <div className="flex-1 overflow-hidden flex flex-col p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img 
              src={currentTrack.album?.images?.[0]?.url || currentTrack.cover} 
              alt="" 
              className="w-14 h-14 rounded-lg object-cover shadow-lg" 
            />
            {isPlaying && (
              <motion.div
                className="absolute inset-0 rounded-lg ring-2 ring-primary/40"
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {currentTrack.name || currentTrack.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {currentTrack.artists?.[0]?.name || currentTrack.artist}
            </p>
          </div>
        </div>

        {/* Mode tabs */}
        <div className="flex items-center gap-1 p-1 rounded-full bg-secondary">
          {([
            { id: "lyrics" as Mode, label: "Lyrics", icon: Mic2 },
            { id: "info" as Mode, label: "Track Info", icon: Disc },
            { id: "analysis" as Mode, label: "Analysis", icon: Lightbulb },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMode(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                mode === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {mode === "lyrics" && (
          <div className="space-y-2">
            <div className="mb-4 p-3 rounded-lg bg-accent/10 border border-accent/20">
              <p className="text-sm text-muted-foreground">
                <Music className="w-4 h-4 inline mr-2" />
                Note: Full lyrics are not available via Spotify API. This is a placeholder view.
              </p>
            </div>
            
            <AnimatePresence>
              {lyrics.map((line, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setActiveLine(i)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 ${
                    activeLine === i
                      ? "bg-primary/10 scale-105"
                      : "hover:bg-secondary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-12">
                      {formatTime(line.time)}
                    </span>
                    <p
                      className={`flex-1 font-medium transition-all duration-500 ${
                        activeLine === i
                          ? "text-primary text-xl"
                          : Math.abs(activeLine - i) === 1
                          ? "text-foreground/70 text-lg"
                          : "text-muted-foreground/40"
                      }`}
                    >
                      {line.text}
                    </p>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}

        {mode === "info" && spotifyTrack && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Album Art */}
            <div className="flex items-start gap-6">
              <img 
                src={spotifyTrack.album.images[0]?.url} 
                alt={spotifyTrack.album.name}
                className="w-48 h-48 rounded-lg object-cover shadow-xl"
              />
              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-3xl font-bold mb-2">{spotifyTrack.name}</h2>
                  <p className="text-xl text-muted-foreground">
                    {spotifyTrack.artists.map(a => a.name).join(", ")}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Album</p>
                    <p className="font-medium">{spotifyTrack.album.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Release Date</p>
                    <p className="font-medium">{spotifyTrack.album.release_date}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium">
                      {formatTime(Math.floor(spotifyTrack.duration_ms / 1000))}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Popularity</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${spotifyTrack.popularity}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{spotifyTrack.popularity}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Track Number */}
            <div className="p-4 rounded-lg bg-secondary/50">
              <p className="text-sm text-muted-foreground">
                Track {spotifyTrack.track_number} of {spotifyTrack.album.total_tracks} on {spotifyTrack.album.name}
              </p>
            </div>
          </motion.div>
        )}

        {mode === "analysis" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {audioFeatures ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${feature.value * 100}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className={`h-full ${feature.color} rounded-full`}
                          />
                        </div>
                        <span className="text-sm font-bold">{Math.round(feature.value * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <p className="text-sm text-muted-foreground mb-1">Tempo</p>
                    <p className="text-2xl font-bold">{Math.round(audioFeatures.tempo)} BPM</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <p className="text-sm text-muted-foreground mb-1">Key</p>
                    <p className="text-2xl font-bold">
                      {["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][audioFeatures.key]}
                      {audioFeatures.mode === 1 ? " Major" : " Minor"}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <p className="text-sm text-muted-foreground mb-1">Time Signature</p>
                    <p className="text-2xl font-bold">{audioFeatures.time_signature}/4</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <p className="text-sm text-muted-foreground mb-1">Loudness</p>
                    <p className="text-2xl font-bold">{Math.round(audioFeatures.loudness)} dB</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Lightbulb className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">Loading audio analysis...</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
