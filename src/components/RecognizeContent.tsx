import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Music,
  Plus,
  Heart,
  ExternalLink,
  ListPlus,
  CheckCircle,
  Loader2,
  X,
  ChevronDown,
  Disc3,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useUserPlaylists,
  usePlayMutation,
  useAddToQueueMutation,
  useSaveTrackMutation,
  usePlaybackState,
} from "@/hooks/useSpotify";
import { useToast } from "@/hooks/use-toast";
import { getToken } from "@/services/spotify-auth";
import { recognizeWithFallback } from "@/services/acrcloud-recognition";
import { lyricsStore } from "@/hooks/useLyricsStore";
import { getCurrentLineIndex } from "@/services/lyrics-api";

const AUDD_TOKEN = import.meta.env.VITE_AUDD_API_TOKEN as string;

// ── Types ──────────────────────────────────────────────────────────────────────
interface RecognizedTrack {
  title: string;
  artist: string;
  album: string;
  releaseDate?: string;
  coverUrl?: string;
  durationMs?: number;
  spotifyUri?: string;
  spotifyId?: string;
  lyrics?: string;
}

type Stage = "idle" | "listening" | "processing" | "result" | "error";

const fmt = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

// ── Audd.io — usato solo per i testi (non per il riconoscimento) ──────────────
async function fetchLyricsFromAudd(
  title: string,
  artist: string,
): Promise<string | undefined> {
  try {
    const form = new FormData();
    form.append("api_token", AUDD_TOKEN);
    form.append("q", `${artist} ${title}`);
    form.append("return", "lyrics");
    const res = await fetch("/api/audd/", { method: "POST", body: form });
    if (!res.ok) return undefined;
    const data = await res.json();
    return data?.result?.lyrics?.lyrics ?? undefined;
  } catch {
    return undefined;
  }
}

// ── Spotify search per copertina + URI ────────────────────────────────────────
async function spotifySearch(
  title: string,
  artist: string,
): Promise<Partial<RecognizedTrack>> {
  const token = getToken();
  if (!token) return {};
  const q = encodeURIComponent(`track:${title} artist:${artist}`);
  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${q}&type=track&limit=5`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return {};
  const data = await res.json();

  // Cerca corrispondenza migliore per artista
  const items = data.tracks?.items ?? [];
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const artistNorm = norm(artist);
  const track =
    items.find((t: any) =>
      t.artists.some((a: any) => norm(a.name).includes(artistNorm.slice(0, 5))),
    ) ?? items[0];

  if (!track) return {};
  return {
    title: track.name,
    artist: track.artists.map((a: any) => a.name).join(", "),
    album: track.album.name,
    releaseDate: track.album.release_date,
    coverUrl: track.album.images?.[0]?.url,
    durationMs: track.duration_ms,
    spotifyUri: track.uri,
    spotifyId: track.id,
  };
}

// ── Cattura audio di sistema (loopback) o microfono come fallback ──────────────
async function getAudioStream(): Promise<{
  stream: MediaStream;
  source: "system" | "mic";
}> {
  try {
    const displayStream = await (navigator.mediaDevices as any).getDisplayMedia(
      {
        video: { width: 1, height: 1, frameRate: 1 },
        audio: {
          systemAudio: "include",
          echoCancellation: false,
          noiseSuppression: false,
        },
      },
    );
    const audioTracks = displayStream.getAudioTracks();
    if (!audioTracks.length) throw new Error("no audio track");
    displayStream.getVideoTracks().forEach((t: MediaStreamTrack) => t.stop());
    return { stream: new MediaStream(audioTracks), source: "system" };
  } catch {
    const mic = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        sampleRate: 44100,
      },
    });
    return { stream: mic, source: "mic" };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
export default function RecognizeContent() {
  const [stage, setStage] = useState<Stage>("idle");
  const [track, setTrack] = useState<RecognizedTrack | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [progress, setProgress] = useState(0);
  const [ripples, setRipples] = useState<number[]>([]);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [addedPlaylistId, setAddedPlaylistId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);

  const mrRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rippleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: playlistsData } = useUserPlaylists();
  const playlists = playlistsData?.items ?? [];
  const playMutation = usePlayMutation();
  const queueMutation = useAddToQueueMutation();
  const saveMutation = useSaveTrackMutation();
  const { toast } = useToast();
  const { data: playbackState } = usePlaybackState();

  // Ripples
  useEffect(() => {
    if (stage === "listening") {
      let id = 0;
      rippleRef.current = setInterval(
        () => setRipples((p) => [...p.slice(-4), id++]),
        650,
      );
    } else {
      if (rippleRef.current) clearInterval(rippleRef.current);
      setRipples([]);
    }
    return () => {
      if (rippleRef.current) clearInterval(rippleRef.current);
    };
  }, [stage]);

  // Progress bar
  useEffect(() => {
    if (stage === "listening") {
      setProgress(0);
      const start = Date.now();
      const TOTAL = 15_000;
      progressRef.current = setInterval(
        () => setProgress(Math.min((Date.now() - start) / TOTAL, 1)),
        50,
      );
    } else {
      if (progressRef.current) clearInterval(progressRef.current);
    }
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [stage]);

  // Sync lyrics con playback reale di Spotify
  useEffect(() => {
    if (!track?.spotifyId || !showLyrics) {
      setCurrentTime(0);
      setCurrentLineIndex(0);
      return;
    }

    const cachedLyrics = lyricsStore.getLyrics(track.spotifyId);
    if (!cachedLyrics?.lines || cachedLyrics.lines.length === 0) return;

    // Aggiorna tempo e indice riga in base al playback reale
    const interval = setInterval(() => {
      // Se c'è playback Spotify attivo per questa canzone, usa il tempo reale
      if (
        playbackState?.item?.id === track.spotifyId &&
        playbackState.is_playing
      ) {
        const realTime = (playbackState.progress_ms || 0) / 1000;
        setCurrentTime(realTime);
        const newIndex = getCurrentLineIndex(cachedLyrics.lines, realTime);
        if (newIndex !== currentLineIndex) {
          setCurrentLineIndex(newIndex);
        }
      } else {
        // Fallback: simula avanzamento se non c'è playback attivo
        setCurrentTime((t) => {
          const newTime = t + 0.1;
          const newIndex = getCurrentLineIndex(cachedLyrics.lines, newTime);
          if (newIndex !== currentLineIndex) {
            setCurrentLineIndex(newIndex);
          }
          return newTime;
        });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [track, showLyrics, currentLineIndex, playbackState]);

  // ── Start recognition ──────────────────────────────────────────────────────
  const start = useCallback(async () => {
    setTrack(null);
    setErrorMsg("");
    setIsSaved(false);
    setAddedPlaylistId(null);
    setShowLyrics(false);
    setShowPlaylistMenu(false);

    try {
      const { stream, source } = await getAudioStream();
      console.log("[recognize] source:", source);

      // Prova formati audio in ordine di qualità
      const formats = [
        { mimeType: "audio/webm;codecs=opus", audioBitsPerSecond: 128000 },
        { mimeType: "audio/webm", audioBitsPerSecond: 128000 },
        { mimeType: "audio/ogg;codecs=opus", audioBitsPerSecond: 128000 },
      ];

      const format = formats.find((f) =>
        MediaRecorder.isTypeSupported(f.mimeType),
      ) || { mimeType: "audio/webm", audioBitsPerSecond: 128000 };

      console.log(
        "[recognize] Using format:",
        format.mimeType,
        format.audioBitsPerSecond,
        "bps",
      );

      const mr = new MediaRecorder(stream, format);
      mrRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) {
          console.log("[recognize] chunk received:", e.data.size, "bytes");
          chunksRef.current.push(e.data);
        }
      };

      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setStage("processing");

        try {
          const blob = new Blob(chunksRef.current, {
            type: format.mimeType || "audio/webm",
          });
          console.log(
            "[recognize] blob:",
            blob.size,
            "bytes",
            "chunks:",
            chunksRef.current.length,
          );

          // Verifica dimensione minima (almeno 50KB per 15s)
          if (blob.size < 50000) {
            console.warn(
              "[recognize] Audio troppo piccolo! Probabilmente non ha catturato nulla.",
            );
            setErrorMsg(
              source === "mic"
                ? "Audio troppo breve o debole. Alza il volume e riprova."
                : "Impossibile catturare l'audio. Assicurati di selezionare 'Condividi audio della scheda' quando richiesto.",
            );
            setStage("error");
            return;
          }

          // ── Step 1: Riconoscimento con Shazam (fallback AudD) ──────────
          setStatusText("🔍 Identificazione con Shazam…");
          const auddResult = await recognizeWithFallback(blob);

          if (!auddResult) {
            setErrorMsg(
              source === "mic"
                ? "Canzone non riconosciuta. Alza il volume o avvicina il microfono alle casse."
                : "Canzone non riconosciuta. Assicurati che la musica stia suonando.",
            );
            setStage("error");
            return;
          }

          // ── Step 2: Spotify per copertina + URI ────────────────────────────
          setStatusText("Trovata! Cerco su Spotify…");
          const spotifyData = await spotifySearch(
            auddResult.title,
            auddResult.artist,
          );

          setTrack({
            title: auddResult.title,
            artist: auddResult.artist,
            album: auddResult.album,
            releaseDate: auddResult.releaseDate,
            lyrics: auddResult.lyrics,
            ...spotifyData,
          });
          setStage("result");
        } catch (err) {
          console.error("[recognize] error:", err);
          setErrorMsg(
            "Errore durante il riconoscimento. Controlla la connessione e riprova.",
          );
          setStage("error");
        }
      };

      // Registra con chunk ogni secondo per garantire cattura audio
      mr.start(1000); // 1 chunk al secondo
      setStage("listening");

      // Auto-stop dopo 15s (più lungo = fingerprint più preciso)
      stopTimerRef.current = setTimeout(() => {
        if (mr.state === "recording") mr.stop();
      }, 15_000);
    } catch (err: any) {
      setErrorMsg(
        err.name === "NotAllowedError"
          ? "Accesso negato. Permetti la condivisione dello schermo/audio quando richiesto."
          : "Impossibile avviare: " + err.message,
      );
      setStage("error");
    }
  }, []);

  const stop = () => {
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    if (mrRef.current?.state === "recording") mrRef.current.stop();
  };

  // ── Azioni Spotify ─────────────────────────────────────────────────────────
  const handlePlay = async () => {
    if (!track?.spotifyUri) return;
    try {
      await playMutation.mutateAsync({ uris: [track.spotifyUri] });
      toast({
        title: "▶ Now Playing",
        description: `${track.title} — ${track.artist}`,
      });
    } catch {
      toast({
        title: "Errore",
        description: "Attiva un dispositivo Spotify",
        variant: "destructive",
      });
    }
  };

  const handleQueue = async () => {
    if (!track?.spotifyUri) return;
    try {
      await queueMutation.mutateAsync(track.spotifyUri);
      toast({ title: "✓ Aggiunta alla coda", description: track.title });
    } catch {
      toast({
        title: "Errore",
        description: "Attiva un dispositivo Spotify",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!track?.spotifyId) return;
    try {
      await saveMutation.mutateAsync(track.spotifyId);
      setIsSaved(true);
      toast({ title: "♥ Salvata", description: track.title });
    } catch {
      toast({ title: "Errore nel salvare", variant: "destructive" });
    }
  };

  const handleAddToPlaylist = async (id: string, name: string) => {
    if (!track?.spotifyUri) return;
    try {
      const res = await fetch(
        `https://api.spotify.com/v1/playlists/${id}/tracks`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ uris: [track.spotifyUri] }),
        },
      );
      if (!res.ok) throw new Error();
      setAddedPlaylistId(id);
      setShowPlaylistMenu(false);
      toast({ title: "✓ Aggiunta", description: `${track.title} → ${name}` });
    } catch {
      toast({
        title: "Errore",
        description: "Impossibile aggiungere alla playlist",
        variant: "destructive",
      });
    }
  };

  // ── UI ─────────────────────────────────────────────────────────────────────
  const btnColor =
    stage === "listening"
      ? "bg-red-500 hover:bg-red-600 shadow-red-500/50"
      : stage === "processing"
        ? "bg-primary/60 cursor-wait"
        : stage === "result"
          ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/40"
          : "bg-primary hover:bg-primary/90 shadow-primary/50";

  const secsLeft = Math.ceil((1 - progress) * 15);

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 relative">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-3xl transition-all duration-1000 ${
            stage === "listening"
              ? "bg-primary/10"
              : stage === "result"
                ? "bg-emerald-500/8"
                : "bg-primary/5"
          }`}
        />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-foreground mb-1 flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-primary" />
            Riconosci Canzone
          </h1>
          <p className="text-muted-foreground text-sm">
            Powered by ACRCloud + Shazam — riconoscimento professionale
          </p>
        </motion.div>

        {/* ── Pulsante principale ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center py-8 gap-6"
        >
          <div className="relative flex items-center justify-center w-52 h-52">
            <div className="absolute inset-0 rounded-full border border-primary/10" />
            <div className="absolute inset-4 rounded-full border border-primary/5" />

            <AnimatePresence>
              {ripples.map((id) => (
                <motion.div
                  key={id}
                  className="absolute inset-0 rounded-full border-2 border-primary/50"
                  initial={{ scale: 0.6, opacity: 0.9 }}
                  animate={{ scale: 2.1, opacity: 0 }}
                  exit={{}}
                  transition={{ duration: 1.6, ease: "easeOut" }}
                />
              ))}
            </AnimatePresence>

            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={
                stage === "listening"
                  ? stop
                  : stage === "processing"
                    ? undefined
                    : start
              }
              disabled={stage === "processing"}
              className={`relative z-10 w-36 h-36 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 focus:outline-none ${btnColor}`}
            >
              <AnimatePresence mode="wait">
                {stage === "processing" ? (
                  <motion.div
                    key="proc"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Loader2 className="w-14 h-14 text-white animate-spin" />
                  </motion.div>
                ) : stage === "listening" ? (
                  <motion.div
                    key="stop"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <MicOff className="w-14 h-14 text-white" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="mic"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Mic className="w-14 h-14 text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

          {/* Status */}
          <AnimatePresence mode="wait">
            {stage === "idle" && (
              <motion.p
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-muted-foreground text-sm"
              >
                Premi per ascoltare
              </motion.p>
            )}
            {stage === "listening" && (
              <motion.div
                key="listening"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3 w-full max-w-xs"
              >
                <p className="text-foreground text-sm font-semibold">
                  In ascolto…
                </p>
                <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {secsLeft}s rimanenti — premi per fermare prima
                </p>
              </motion.div>
            )}
            {stage === "processing" && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-1"
              >
                <p className="text-primary text-sm font-semibold animate-pulse">
                  {statusText}
                </p>
              </motion.div>
            )}
            {stage === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3 text-center max-w-xs"
              >
                <div className="flex items-start gap-2 text-destructive">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{errorMsg}</p>
                </div>
                <Button variant="outline" size="sm" onClick={start}>
                  Riprova
                </Button>
              </motion.div>
            )}
            {stage === "result" && (
              <motion.p
                key="result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-muted-foreground text-sm"
              >
                Premi per riconoscere un'altra canzone
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Result card ── */}
        <AnimatePresence>
          {stage === "result" && track && (
            <motion.div
              key="card"
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 220, damping: 24 }}
              className="glass-surface rounded-2xl overflow-hidden"
            >
              {/* Cover + info */}
              <div className="flex gap-5 p-6 pb-4">
                <div className="relative w-28 h-28 rounded-xl overflow-hidden bg-muted flex-shrink-0 shadow-lg">
                  {track.coverUrl ? (
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600/30 to-blue-600/30">
                      <Music className="w-10 h-10 text-muted-foreground/40" />
                    </div>
                  )}
                  <motion.div
                    className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center"
                    animate={{ rotate: 360 }}
                    transition={{
                      repeat: Infinity,
                      duration: 3,
                      ease: "linear",
                    }}
                  >
                    <Disc3 className="w-4 h-4 text-white" />
                  </motion.div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h2 className="text-xl font-bold text-foreground leading-tight truncate">
                      {track.title}
                    </h2>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                    >
                      <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                    </motion.div>
                  </div>
                  <p className="text-primary font-semibold text-sm mb-3 truncate">
                    {track.artist}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {track.album && <span>💿 {track.album}</span>}
                    {track.releaseDate && (
                      <span>📅 {track.releaseDate.slice(0, 4)}</span>
                    )}
                    {track.durationMs && <span>⏱ {fmt(track.durationMs)}</span>}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 pb-5 flex flex-wrap gap-2">
                {track.spotifyUri && (
                  <Button
                    size="sm"
                    onClick={handlePlay}
                    disabled={playMutation.isPending}
                    className="rounded-full h-8"
                  >
                    {playMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                    ) : (
                      <Music className="w-3.5 h-3.5 mr-1" />
                    )}
                    Riproduci
                  </Button>
                )}
                {track.spotifyUri && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleQueue}
                    disabled={queueMutation.isPending}
                    className="rounded-full h-8"
                  >
                    <ListPlus className="w-3.5 h-3.5 mr-1" />
                    Coda
                  </Button>
                )}
                {track.spotifyId && (
                  <Button
                    size="sm"
                    variant={isSaved ? "default" : "outline"}
                    onClick={handleSave}
                    disabled={isSaved || saveMutation.isPending}
                    className="rounded-full h-8"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 mr-1 ${isSaved ? "fill-current" : ""}`}
                    />
                    {isSaved ? "Salvata" : "Salva"}
                  </Button>
                )}

                {/* Playlist dropdown */}
                {track.spotifyUri && (
                  <div className="relative">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowPlaylistMenu((v) => !v)}
                      className="rounded-full h-8"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Playlist
                      <ChevronDown
                        className={`w-3 h-3 ml-1 transition-transform ${showPlaylistMenu ? "rotate-180" : ""}`}
                      />
                    </Button>
                    <AnimatePresence>
                      {showPlaylistMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.95 }}
                          transition={{ duration: 0.12 }}
                          className="absolute top-full left-0 mt-1 w-64 max-h-64 overflow-y-auto rounded-xl bg-card border border-border shadow-2xl z-50"
                        >
                          <div className="flex items-center justify-between px-3 py-2 border-b border-border sticky top-0 bg-card">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Le tue playlist
                            </span>
                            <button
                              onClick={() => setShowPlaylistMenu(false)}
                              className="p-0.5 rounded hover:bg-accent/50"
                            >
                              <X className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                          </div>
                          {playlists.length === 0 ? (
                            <p className="text-sm text-muted-foreground p-4 text-center">
                              Nessuna playlist
                            </p>
                          ) : (
                            playlists.map((pl: any) => (
                              <button
                                key={pl.id}
                                onClick={() =>
                                  handleAddToPlaylist(pl.id, pl.name)
                                }
                                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent/50 transition-colors text-left"
                              >
                                {pl.images?.[0]?.url ? (
                                  <img
                                    src={pl.images[0].url}
                                    alt=""
                                    className="w-8 h-8 rounded object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                                    <Music className="w-4 h-4 text-white" />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium truncate">
                                    {pl.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {pl.tracks?.total} canzoni
                                  </p>
                                </div>
                                {addedPlaylistId === pl.id && (
                                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                )}
                              </button>
                            ))
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {track.spotifyId && (
                  <Button
                    size="sm"
                    variant="ghost"
                    asChild
                    className="rounded-full h-8"
                  >
                    <a
                      href={`https://open.spotify.com/track/${track.spotifyId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1" />
                      Spotify
                    </a>
                  </Button>
                )}
              </div>

              {/* Lyrics Sincronizzati */}
              {track.spotifyId &&
                (() => {
                  const cachedLyrics = lyricsStore.getLyrics(track.spotifyId);
                  const hasLyrics =
                    cachedLyrics?.lines && cachedLyrics.lines.length > 0;

                  return hasLyrics ? (
                    <div className="border-t border-border">
                      <button
                        className="w-full flex items-center justify-between px-6 py-3 hover:bg-accent/20 transition-colors"
                        onClick={() => {
                          setShowLyrics((v) => !v);
                          setCurrentTime(0);
                        }}
                      >
                        <span className="text-sm font-semibold flex items-center gap-2">
                          <Mic className="w-4 h-4 text-primary" />
                          Testo Sincronizzato
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-muted-foreground transition-transform ${showLyrics ? "rotate-180" : ""}`}
                        />
                      </button>
                      <AnimatePresence>
                        {showLyrics && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden px-6 pb-6 pt-2"
                          >
                            <div className="max-h-80 overflow-y-auto space-y-3 scroll-smooth">
                              {cachedLyrics.lines.map((line, i) => {
                                const isActive = i === currentLineIndex;
                                const isPast = i < currentLineIndex;
                                const isNext = i === currentLineIndex + 1;

                                return (
                                  <motion.p
                                    key={i}
                                    className={`text-center transition-all duration-300 ${
                                      isActive
                                        ? "text-2xl font-bold text-primary scale-110"
                                        : isNext
                                          ? "text-lg text-foreground/60"
                                          : isPast
                                            ? "text-sm text-muted-foreground/40"
                                            : "text-base text-muted-foreground/30"
                                    }`}
                                    animate={{
                                      scale: isActive ? 1.1 : 1,
                                      opacity: isActive
                                        ? 1
                                        : isPast
                                          ? 0.4
                                          : 0.3,
                                    }}
                                    transition={{ duration: 0.3 }}
                                  >
                                    {line.text}
                                  </motion.p>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : null;
                })()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Come funziona ── */}
        {(stage === "idle" || stage === "error") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-surface rounded-2xl p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Come funziona
              </p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">
                ∞ Gratuito
              </span>
            </div>
            <div className="space-y-2.5">
              {[
                {
                  icon: Mic,
                  text: "Premi — il browser chiede di condividere lo schermo per catturare l'audio di sistema (nessun video registrato)",
                },
                {
                  icon: Sparkles,
                  text: "L'app registra 15 secondi di audio in alta qualità",
                },
                {
                  icon: Music,
                  text: "L'audio viene analizzato da Shazam per identificare la canzone",
                },
                {
                  icon: Plus,
                  text: "Trovata la canzone, puoi riprodurla, salvarla o aggiungerla a una playlist",
                },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
