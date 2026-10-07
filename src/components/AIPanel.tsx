import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  Send,
  Loader2,
  RefreshCw,
  User,
  PlayCircle,
  Settings2,
  Key,
  Check,
  Zap,
} from "lucide-react";
import { usePlaybackState, useAudioFeatures, useTopTracks, useRecentlyPlayed } from "@/hooks/useSpotify";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { useToast } from "@/hooks/use-toast";
import * as spotifyApi from "@/services/spotify-api";
import { buildLyraContext, detectLyraIntent, askLyraAI } from "@/services/lyra-ai";
import { lookupTrackBpm } from "@/services/track-bpm";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface RecommendedTrack {
  id: string;
  number: number;
  title: string;
  artist: string;
  album: string;
  cover: string;
  duration: number;
}

interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
  tracks?: RecommendedTrack[];
  timestamp: Date;
}

type MoodProfile = {
  id: "energetic" | "chill" | "moody" | "focus";
  label: string;
  query: string;
};

interface AIPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayTrack?: (track: any) => void;
}

// ─── 10 Brani Fallback Curati: 10 artisti e stili rigorosamente unici (0 duplicati) ────
export const MOOD_RECOMMENDED_TRACKS: RecommendedTrack[] = [
  {
    id: "mood-1",
    number: 1,
    title: "Blinding Lights",
    artist: "The Weeknd",
    album: "After Hours",
    cover: "https://i.scdn.co/image/ab67616d0000b273886370ce44e60e06521319c3",
    duration: 200,
  },
  {
    id: "mood-2",
    number: 2,
    title: "Levitating",
    artist: "Dua Lipa",
    album: "Future Nostalgia",
    cover: "https://i.scdn.co/image/ab67616d0000b273522f28b497b7964b49463943",
    duration: 203,
  },
  {
    id: "mood-3",
    number: 3,
    title: "As It Was",
    artist: "Harry Styles",
    album: "Harry's House",
    cover: "https://i.scdn.co/image/ab67616d0000b273b46f74097655d7f353caab14",
    duration: 167,
  },
  {
    id: "mood-4",
    number: 4,
    title: "Get Lucky",
    artist: "Daft Punk ft. Pharrell Williams",
    album: "Random Access Memories",
    cover: "https://i.scdn.co/image/ab67616d0000b27376a9a7a67977051e7a46973e",
    duration: 248,
  },
  {
    id: "mood-5",
    number: 5,
    title: "Viva La Vida",
    artist: "Coldplay",
    album: "Viva La Vida",
    cover: "https://i.scdn.co/image/ab67616d0000b273a7051f67f70b134810a9f8b4",
    duration: 242,
  },
  {
    id: "mood-6",
    number: 6,
    title: "Midnight City",
    artist: "M83",
    album: "Hurry Up, We're Dreaming",
    cover: "https://i.scdn.co/image/ab67616d0000b27306f52a7d2b63897b713917a2",
    duration: 243,
  },
  {
    id: "mood-7",
    number: 7,
    title: "Shape of You",
    artist: "Ed Sheeran",
    album: "÷ (Divide)",
    cover: "https://i.scdn.co/image/ab67616d0000b273ba5db96f4b4e63635ed03816",
    duration: 233,
  },
  {
    id: "mood-8",
    number: 8,
    title: "Heat Waves",
    artist: "Glass Animals",
    album: "Dreamland",
    cover: "https://i.scdn.co/image/ab67616d0000b2739e495fb707973f3390850eea",
    duration: 238,
  },
  {
    id: "mood-9",
    number: 9,
    title: "Do I Wanna Know?",
    artist: "Arctic Monkeys",
    album: "AM",
    cover: "https://i.scdn.co/image/ab67616d0000b2734ae1c4c5c45aabe5ece75733",
    duration: 272,
  },
  {
    id: "mood-10",
    number: 10,
    title: "bad guy",
    artist: "Billie Eilish",
    album: "WHEN WE ALL FALL ASLEEP, WHERE DO WE GO?",
    cover: "https://i.scdn.co/image/ab67616d0000b27350a3147b4edd7701a876c6ce",
    duration: 194,
  },
];

// ─── Normalizzazione Rigorosa e Anti-Duplicati ─────────────────────────────────
export function cleanTrackTitle(title?: string): string {
  if (!title) return "";
  return title
    .replace(/\s*[-–—]\s*.*(remaster|live|radio\s*edit|original\s*mix|acoustic|deluxe|version|bonus|extended|mix|edit).*$/gi, "")
    .replace(/\s*[\(\[].*(feat\.?|ft\.?|with|remaster|live|radio\s*edit|official|version|deluxe|acoustic|edit)[^\)\]]*[\)\]]/gi, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function cleanArtistName(artist?: string): string {
  if (!artist) return "";
  const primary = artist.split(/,|\bfeat\.?\b|\bft\.?\b|\bwith\b|&|\bx\b|\bvs\.?\b/i)[0] || artist;
  return primary
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function trackDeduplicationKey(title?: string, artist?: string): string {
  return `${cleanTrackTitle(title)}:::${cleanArtistName(artist)}`;
}

const spotifyTrackToRecommendation = (track: any, number: number): RecommendedTrack => ({
  id: track.id || `spotify-${number}`,
  number,
  title: track.name || "Brano sconosciuto",
  artist: track.artists?.map((a: any) => a.name).filter(Boolean).join(", ") || "Artista sconosciuto",
  album: track.album?.name || "Album",
  cover: track.album?.images?.[0]?.url || MOOD_RECOMMENDED_TRACKS[(number - 1) % MOOD_RECOMMENDED_TRACKS.length].cover,
  duration: Math.floor((track.duration_ms || 200000) / 1000),
});

function inferMoodProfile(currentTrack: any, topTracks: any[], recentTracks: any[]): MoodProfile {
  const sourceText = [
    currentTrack?.name,
    currentTrack?.artist,
    ...recentTracks.slice(0, 8).map((item: any) => item.track?.name),
    ...recentTracks.slice(0, 8).map((item: any) => item.track?.artists?.[0]?.name),
    ...topTracks.slice(0, 8).map((track: any) => track.name),
    ...topTracks.slice(0, 8).map((track: any) => track.artists?.[0]?.name),
  ].filter(Boolean).join(" ").toLowerCase();

  const scores = {
    energetic: /(dance|party|club|remix|hyper|energy|fire|summer|lights|star|beat|funk|disco|rock)/g,
    chill: /(chill|soft|slow|calm|dream|night|moon|ocean|lofi|acoustic|blue|sleep)/g,
    moody: /(sad|tears|heart|alone|dark|lost|rain|pain|melancholy|ghost|empty|break)/g,
    focus: /(study|focus|piano|jazz|ambient|instrumental|classical|deep|mind|space)/g,
  };

  const counted = Object.entries(scores).map(([id, regex]) => ({
    id: id as MoodProfile["id"],
    score: (sourceText.match(regex) || []).length,
  }));
  counted.sort((a, b) => b.score - a.score);
  const selected = counted[0]?.score ? counted[0].id : "energetic";

  const profiles: Record<MoodProfile["id"], MoodProfile> = {
    energetic: { id: "energetic", label: "energico e luminoso", query: "new energetic indie pop dance fresh discovery" },
    chill: { id: "chill", label: "chill e notturno", query: "new chill dreamy indie pop soft electronic" },
    moody: { id: "moody", label: "intenso e malinconico", query: "new emotional alternative pop dark indie" },
    focus: { id: "focus", label: "focus e immersivo", query: "new ambient electronic instrumental focus" },
  };

  return profiles[selected];
}

/**
 * Ricerca brani consigliati con zero duplicati e quantità flessibile da 2 a 10 brani
 */
async function buildMoodRecommendations(
  currentTrack: any,
  topTracks: any[],
  recentTracks: any[],
  maxLimit = 10,
  minLimit = 2
): Promise<{ mood: MoodProfile; tracks: RecommendedTrack[] }> {
  const mood = inferMoodProfile(currentTrack, topTracks, recentTracks);
  const heardIds = new Set<string>();
  const heardKeys = new Set<string>();
  const heardTitles = new Set<string>();

  const remember = (track: any) => {
    if (!track) return;
    if (track.id) heardIds.add(track.id);
    const title = track.name || track.title;
    const artist = track.artists?.[0]?.name || track.artist;
    if (title) {
      heardTitles.add(cleanTrackTitle(title));
      heardKeys.add(trackDeduplicationKey(title, artist));
    }
  };

  topTracks.forEach(remember);
  recentTracks.forEach((item: any) => remember(item.track || item));
  remember(currentTrack);

  const seedArtist = topTracks[0]?.artists?.[0]?.name || recentTracks[0]?.track?.artists?.[0]?.name || currentTrack?.artist || "";
  const todayOffset = Math.floor(Date.now() / 86400000) % 5;
  const queries = [
    `${mood.query} -${seedArtist}`,
    `${mood.query} underrated`,
    `${mood.query} 2026`,
    `${seedArtist} similar ${mood.id}`,
    mood.query,
  ].filter((q, index, arr) => q.trim().length > 3 && arr.indexOf(q) === index);

  const candidates: any[] = [];
  for (let i = 0; i < queries.length; i++) {
    const query = queries[(i + todayOffset) % queries.length];
    try {
      const result = await spotifyApi.search(query, ["track"], 20);
      candidates.push(...(result.tracks?.items || []));
      if (candidates.length >= maxLimit * 4) break;
    } catch {
      // Ignora errori di singola query e continua
    }
  }

  const selectedTracks: any[] = [];
  const selectedIds = new Set<string>();
  const selectedKeys = new Set<string>();
  const selectedTitles = new Set<string>();
  const artistCounts = new Map<string, number>();

  for (const track of candidates) {
    if (!track.id || selectedIds.has(track.id) || heardIds.has(track.id)) continue;
    if (!track.album?.images?.[0]?.url) continue;

    const trackArtist = track.artists?.[0]?.name || "";
    const cleanTitle = cleanTrackTitle(track.name);
    const cleanArtist = cleanArtistName(trackArtist);
    const key = trackDeduplicationKey(track.name, trackArtist);

    if (!cleanTitle || heardTitles.has(cleanTitle) || selectedTitles.has(cleanTitle)) continue;
    if (heardKeys.has(key) || selectedKeys.has(key)) continue;

    // Massimo 1 brano per singolo artista principale nel set per garantire massima diversità
    if ((artistCounts.get(cleanArtist) || 0) >= 1) continue;

    selectedIds.add(track.id);
    selectedKeys.add(key);
    selectedTitles.add(cleanTitle);
    artistCounts.set(cleanArtist, 1);
    selectedTracks.push(track);

    if (selectedTracks.length >= maxLimit) break;
  }

  // Se abbiamo trovato da 2 a 10 brani, usiamo esattamente quelli senza forzare duplicati!
  let finalRaw = selectedTracks;
  if (finalRaw.length < minLimit) {
    const fallbackList = MOOD_RECOMMENDED_TRACKS.filter((fb) => {
      const fbTitle = cleanTrackTitle(fb.title);
      const fbKey = trackDeduplicationKey(fb.title, fb.artist);
      const fbArtist = cleanArtistName(fb.artist);
      return (
        !heardTitles.has(fbTitle) &&
        !selectedTitles.has(fbTitle) &&
        !heardKeys.has(fbKey) &&
        !selectedKeys.has(fbKey) &&
        (artistCounts.get(fbArtist) || 0) < 1
      );
    });

    for (const fb of fallbackList) {
      finalRaw.push(fb);
      selectedTitles.add(cleanTrackTitle(fb.title));
      if (finalRaw.length >= 3) break;
    }
  }

  // Rinumera coerentemente da 1 a N (da 2 a 10)
  const tracks: RecommendedTrack[] = finalRaw.map((track, idx) => {
    if ("cover" in track && typeof track.duration === "number") {
      return { ...track, number: idx + 1 };
    }
    return spotifyTrackToRecommendation(track, idx + 1);
  });

  return {
    mood,
    tracks,
  };
}

const buildInitialMessages = (dailyTrack?: RecommendedTrack, moodLabel?: string): Message[] => [
  {
    id: "welcome-1",
    role: "assistant",
    content: "Ciao, sono **LyraAI**, il tuo assistente musicale intelligente. Puoi chiedermi qualsiasi cosa!",
    timestamp: new Date(),
  },
  {
    id: "welcome-2",
    role: "assistant",
    content: dailyTrack
      ? `Per oggi sento un mood **${moodLabel || "su misura"}**. Ti consiglio questo brano selezionato per te:`
      : "Sto calibrando il tuo mood musicale per consigliarti brani freschi senza duplicati.",
    tracks: dailyTrack ? [dailyTrack] : undefined,
    timestamp: new Date(),
  },
];

// ─── Markdown renderer minimale ───────────────────────────────────────────────
function renderMd(text: string) {
  return text
    .split("\n")
    .map((line, i) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <span key={i}>
          {parts.map((p, j) =>
            p.startsWith("**") && p.endsWith("**") ? (
              <strong key={j}>{p.slice(2, -2)}</strong>
            ) : (
              p
            )
          )}
          {i < text.split("\n").length - 1 && <br />}
        </span>
      );
    });
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function AIPanel({ isOpen, onClose, onPlayTrack }: AIPanelProps) {
  const { toast } = useToast();
  const player = usePlayerStore();
  const { data: playbackState } = usePlaybackState();
  const { data: audioFeatures } = useAudioFeatures(playbackState?.item?.id || "");
  const { data: topTracksData } = useTopTracks("medium_term", 20);
  const { data: recentData } = useRecentlyPlayed(10);

  const [messages, setMessages] = useState<Message[]>(() => buildInitialMessages());
  const [moodRecommendations, setMoodRecommendations] = useState<RecommendedTrack[]>([]);
  const [moodLabel, setMoodLabel] = useState("su misura");
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [lookedUpBpm, setLookedUpBpm] = useState<number | null>(null);

  // Impostazioni AI personalizzate (opzionale)
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => {
    return typeof localStorage !== "undefined" ? localStorage.getItem("lyra_ai_api_key") || "" : "";
  });
  const [apiProvider, setApiProvider] = useState<"gemini" | "groq" | "openai" | "auto">(() => {
    return typeof localStorage !== "undefined"
      ? (localStorage.getItem("lyra_ai_provider") as any) || "auto"
      : "auto";
  });

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const spTrack = playbackState?.item;
  const currentTrack = spTrack
    ? {
        name: spTrack.name,
        artist: spTrack.artists?.map((a: any) => a.name).filter(Boolean).join(", ") || "Artista Sconosciuto",
        cover: spTrack.album?.images?.[0]?.url || MOOD_RECOMMENDED_TRACKS[0].cover,
        bpm: player.currentTrack?.bpm,
      }
    : player.currentTrack
    ? {
        name: player.currentTrack.title,
        artist: player.currentTrack.artist,
        cover: player.currentTrack.cover || MOOD_RECOMMENDED_TRACKS[0].cover,
        bpm: player.currentTrack.bpm,
      }
    : null;

  const topTracks = topTracksData?.items || [];
  const recentTracks = (recentData as any)?.items || [];

  const refreshMoodRecommendations = useCallback(async () => {
    const result = await buildMoodRecommendations(currentTrack, topTracks, recentTracks, 10, 2);
    setMoodRecommendations(result.tracks);
    setMoodLabel(result.mood.label);
    return result;
  }, [currentTrack, topTracks, recentTracks]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    refreshMoodRecommendations()
      .then((result) => {
        if (cancelled) return;
        setMessages((prev) => {
          const hasRealDaily = prev.some((m) => m.id === "welcome-2" && m.tracks?.length);
          if (hasRealDaily) return prev;
          return buildInitialMessages(result.tracks[0], result.mood.label);
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isOpen, refreshMoodRecommendations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 400);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !currentTrack?.name || !currentTrack?.artist || currentTrack.artist === "Artista Sconosciuto") {
      return;
    }
    let cancelled = false;
    lookupTrackBpm(currentTrack.name, currentTrack.artist)
      .then((bpm) => {
        if (!cancelled) setLookedUpBpm(bpm);
      })
      .catch(() => {
        if (!cancelled) setLookedUpBpm(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, currentTrack?.name, currentTrack?.artist]);

  const saveSettings = () => {
    if (typeof localStorage !== "undefined") {
      if (apiKeyInput.trim()) {
        localStorage.setItem("lyra_ai_api_key", apiKeyInput.trim());
      } else {
        localStorage.removeItem("lyra_ai_api_key");
      }
      localStorage.setItem("lyra_ai_provider", apiProvider);
    }
    setShowSettings(false);
    toast({
      title: "Impostazioni AI salvate",
      description: apiKeyInput.trim()
        ? `Configurato provider: ${apiProvider.toUpperCase()}`
        : "Modalità automatica attiva (gratuita e senza chiavi)",
    });
  };

  const sendMessageText = useCallback(
    async (textToSubmit: string) => {
      const trimmed = textToSubmit.trim();
      if (!trimmed || isTyping) return;

      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsTyping(true);

      const intent = detectLyraIntent(trimmed);
      let extraBpm = lookedUpBpm;
      if (!extraBpm && currentTrack && (intent.asksBpm || intent.asksNowPlaying)) {
        extraBpm = await lookupTrackBpm(currentTrack.name, currentTrack.artist);
        if (extraBpm) setLookedUpBpm(extraBpm);
      }

      const context = buildLyraContext(currentTrack, audioFeatures, topTracks, extraBpm);

      // Chiamata all'intelligenza artificiale (con API utente o automatica senza chiavi)
      const currentKey = typeof localStorage !== "undefined" ? localStorage.getItem("lyra_ai_api_key") || undefined : undefined;
      const currentProv = typeof localStorage !== "undefined" ? (localStorage.getItem("lyra_ai_provider") as any) || undefined : undefined;

      const reply = await askLyraAI(trimmed, context, {
        apiKey: currentKey,
        provider: currentProv,
      });

      let finalTracks: RecommendedTrack[] | undefined;
      if (reply.wantRecommendations) {
        // Genera raccomandazioni fresche senza duplicati (da 2 a 10 brani)
        const result = await refreshMoodRecommendations();
        finalTracks = result.tracks;
        reply.text = `🎨 **Consigli Personalizzati LyraAI**\n\nMood rilevato: **${result.mood.label}**.\n\nEcco **${result.tracks.length} brani scelti per te**, selezionati senza ripetizioni dal catalogo Spotify:`;
      }

      const aiMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: reply.text,
        tracks: finalTracks,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    },
    [isTyping, currentTrack, audioFeatures, topTracks, lookedUpBpm, refreshMoodRecommendations]
  );

  const sendMessage = () => sendMessageText(input);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages(buildInitialMessages(moodRecommendations[0], moodLabel));
    setInput("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[420px] bg-background/95 backdrop-blur-2xl border-l border-border/40 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="shrink-0 px-5 py-4 border-b border-border flex items-center justify-between bg-secondary/30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-base flex items-center gap-1.5">
                    LyraAI
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5 text-primary" /> AI
                    </span>
                  </h3>
                  <p className="text-xs text-muted-foreground">Assistente con intelligenza artificiale</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  title="Configura AI (Opzionale)"
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors relative"
                >
                  <Settings2 className="w-4 h-4" />
                  {apiKeyInput && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500" />
                  )}
                </button>
                <button
                  onClick={clearChat}
                  title="Reset chat"
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal / Tendina Impostazioni AI */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b border-border bg-secondary/40 px-5 py-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5" /> Motore Intelligenza Artificiale
                    </h4>
                    <span className="text-[10px] text-muted-foreground">Funziona anche senza chiave!</span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    LyraAI risponde a qualsiasi domanda gratis. Se desideri usare un modello specifico (Gemini, Groq o OpenAI), inserisci qui la tua chiave API:
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground block mb-1">Provider</label>
                      <select
                        value={apiProvider}
                        onChange={(e) => setApiProvider(e.target.value as any)}
                        className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                      >
                        <option value="auto">Automatico (Gratuito)</option>
                        <option value="gemini">Google Gemini</option>
                        <option value="groq">Groq (Ultra Veloce)</option>
                        <option value="openai">OpenAI (ChatGPT)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground block mb-1">Chiave API (Opzionale)</label>
                      <input
                        type="password"
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder="Incolla chiave API..."
                        className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    {apiKeyInput && (
                      <button
                        onClick={() => {
                          setApiKeyInput("");
                          setApiProvider("auto");
                        }}
                        className="px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Rimuovi
                      </button>
                    )}
                    <button
                      onClick={saveSettings}
                      className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg shadow flex items-center gap-1 hover:opacity-90 transition-opacity"
                    >
                      <Check className="w-3.5 h-3.5" /> Salva
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Now Playing Bar */}
            {currentTrack && (
              <div className="shrink-0 px-4 py-2.5 bg-gradient-to-r from-primary/15 via-purple-500/10 to-transparent border-b border-primary/20 flex items-center justify-between gap-3 backdrop-blur-md">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0 shadow-md ring-1 ring-primary/30">
                    <img src={currentTrack.cover} alt={currentTrack.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/10" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-primary uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                      In riproduzione
                    </div>
                    <p className="text-xs font-bold truncate text-foreground leading-tight">
                      {currentTrack.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate leading-tight">
                      {currentTrack.artist}
                    </p>
                  </div>
                </div>
                <div className="flex items-end gap-0.5 h-3 px-1 shrink-0">
                  <span className="w-0.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s] h-3" />
                  <span className="w-0.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s] h-2" />
                  <span className="w-0.5 bg-primary rounded-full animate-bounce h-3.5" />
                </div>
              </div>
            )}

            {/* Messages Chat Stream */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", damping: 22, stiffness: 280 }}
                    className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5 ${
                        msg.role === "assistant"
                          ? "bg-gradient-to-br from-primary to-primary/40 shadow-sm"
                          : "bg-secondary"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
                      ) : (
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </div>

                    <div
                      className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.role === "assistant"
                          ? "bg-secondary/50 border border-border/30 rounded-tl-sm shadow-sm"
                          : "bg-primary text-primary-foreground rounded-tr-sm shadow-sm"
                      }`}
                    >
                      {renderMd(msg.content)}

                      {msg.tracks && msg.tracks.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {msg.tracks.map((track) => (
                            <motion.div
                              key={track.id}
                              whileHover={{ scale: 1.02, x: 2 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                if (onPlayTrack) {
                                  onPlayTrack({
                                    id: track.id,
                                    title: track.title,
                                    artist: track.artist,
                                    album: track.album,
                                    cover: track.cover,
                                    duration: track.duration,
                                  });
                                  toast({
                                    title: "▶ Riproduzione avviata",
                                    description: `${track.title} — ${track.artist}`,
                                  });
                                }
                              }}
                              className="glass-surface hover:bg-secondary/90 border border-border/40 rounded-2xl p-2.5 flex items-center justify-between gap-3 cursor-pointer shadow-sm relative group overflow-hidden transition-all"
                            >
                              <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold flex items-center justify-center shadow-md z-10 ring-2 ring-background">
                                #{track.number}
                              </div>

                              <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow ml-3">
                                <img src={track.cover} alt={track.title} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                              </div>

                              <div className="min-w-0 flex-1 pr-1">
                                <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors text-foreground">
                                  {track.title}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {track.artist}
                                </p>
                              </div>

                              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all shrink-0 shadow-sm">
                                <PlayCircle className="w-5 h-5" />
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      <p
                        className={`text-[10px] mt-1 ${
                          msg.role === "assistant" ? "text-muted-foreground" : "text-primary-foreground/60"
                        }`}
                      >
                        {msg.timestamp.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </motion.div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <motion.div
                    key="typing"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-2.5"
                  >
                    <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary/40 flex items-center justify-center shadow-sm">
                      <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
                    </div>
                    <div className="px-3.5 py-3 rounded-2xl rounded-tl-sm bg-secondary/50 border border-border/30 flex items-center gap-1.5 shadow-sm">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-primary"
                          animate={{ scale: [1, 1.6, 1], opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.18 }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>

            {/* Quick prompts in 2-column grid */}
            <div className="px-4 pb-3 grid grid-cols-2 gap-2">
              {["Cosa sto ascoltando?", "Chi è il cantante?", "Quanti BPM ha?", "Consigliami musica"].map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessageText(p)}
                  disabled={isTyping}
                  className="px-3 py-2 text-xs font-medium rounded-xl bg-secondary/60 hover:bg-secondary border border-border/40 transition-all text-center truncate shadow-sm active:scale-95 disabled:opacity-50"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Input bar */}
            <div className="shrink-0 px-4 pb-4 pt-2 border-t border-border">
              <div className="flex items-center gap-2 bg-secondary/40 border border-border/50 rounded-2xl px-4 py-2.5 focus-within:border-primary/50 transition-colors shadow-inner">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Chiedi qualsiasi cosa a LyraAI..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                />
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={sendMessage}
                  disabled={!input.trim() || isTyping}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    input.trim() && !isTyping
                      ? "bg-primary text-primary-foreground shadow-md hover:opacity-90"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
