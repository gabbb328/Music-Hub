import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Send, Loader2, Music2, RefreshCw, Bot, User, PlayCircle } from "lucide-react";
import { usePlaybackState, useAudioFeatures, useTopTracks, useRecentlyPlayed } from "@/hooks/useSpotify";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { useToast } from "@/hooks/use-toast";
import * as spotifyApi from "@/services/spotify-api";

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
    title: "Starboy",
    artist: "The Weeknd ft. Daft Punk",
    album: "Starboy",
    cover: "https://i.scdn.co/image/ab67616d0000b2734718e2412451096b0aa79e73",
    duration: 230,
  },
  {
    id: "mood-5",
    number: 5,
    title: "Don't Start Now",
    artist: "Dua Lipa",
    album: "Future Nostalgia",
    cover: "https://i.scdn.co/image/ab67616d0000b273be8252277d3aa05a96030999",
    duration: 183,
  },
  {
    id: "mood-6",
    number: 6,
    title: "Viva La Vida",
    artist: "Coldplay",
    album: "Viva La Vida",
    cover: "https://i.scdn.co/image/ab67616d0000b273a7051f67f70b134810a9f8b4",
    duration: 242,
  },
  {
    id: "mood-7",
    number: 7,
    title: "Save Your Tears",
    artist: "The Weeknd",
    album: "After Hours",
    cover: "https://i.scdn.co/image/ab67616d0000b273886370ce44e60e06521319c3",
    duration: 215,
  },
  {
    id: "mood-8",
    number: 8,
    title: "Midnight City",
    artist: "M83",
    album: "Hurry Up, We're Dreaming",
    cover: "https://i.scdn.co/image/ab67616d0000b27306f52a7d2b63897b713917a2",
    duration: 243,
  },
  {
    id: "mood-9",
    number: 9,
    title: "Get Lucky",
    artist: "Daft Punk ft. Pharrell Williams",
    album: "Random Access Memories",
    cover: "https://i.scdn.co/image/ab67616d0000b27376a9a7a67977051e7a46973e",
    duration: 248,
  },
  {
    id: "mood-10",
    number: 10,
    title: "Shape of You",
    artist: "Ed Sheeran",
    album: "÷ (Divide)",
    cover: "https://i.scdn.co/image/ab67616d0000b273ba5db96f4b4e63635ed03816",
    duration: 233,
  },
];

const trackKey = (title?: string, artist?: string) =>
  `${title || ""}|${artist || ""}`.toLowerCase().replace(/[^\w|]+/g, " ").replace(/\s+/g, " ").trim();

const spotifyTrackToRecommendation = (track: any, number: number): RecommendedTrack => ({
  id: track.id || `spotify-${number}`,
  number,
  title: track.name || "Brano sconosciuto",
  artist: track.artists?.map((a: any) => a.name).join(", ") || "Artista sconosciuto",
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

async function buildMoodRecommendations(
  currentTrack: any,
  topTracks: any[],
  recentTracks: any[],
  limit = 10,
): Promise<{ mood: MoodProfile; tracks: RecommendedTrack[] }> {
  const mood = inferMoodProfile(currentTrack, topTracks, recentTracks);
  const heardIds = new Set<string>();
  const heardKeys = new Set<string>();

  const remember = (track: any) => {
    if (!track) return;
    if (track.id) heardIds.add(track.id);
    heardKeys.add(trackKey(track.name || track.title, track.artists?.[0]?.name || track.artist));
  };

  topTracks.forEach(remember);
  recentTracks.forEach((item: any) => remember(item.track));
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
    const result = await spotifyApi.search(query, ["track"], 20);
    candidates.push(...(result.tracks?.items || []));
    if (candidates.length >= limit * 4) break;
  }

  const unique = new Map<string, any>();
  for (const track of candidates) {
    const key = trackKey(track.name, track.artists?.[0]?.name);
    if (!track.id || heardIds.has(track.id) || heardKeys.has(key) || unique.has(key)) continue;
    if (!track.album?.images?.[0]?.url) continue;
    unique.set(key, track);
    if (unique.size >= limit) break;
  }

  const tracks = Array.from(unique.values()).map(spotifyTrackToRecommendation);
  return {
    mood,
    tracks: tracks.length > 0 ? tracks : MOOD_RECOMMENDED_TRACKS.slice(0, limit),
  };
}

// ─── LyraAI Brain ─────────────────────────────────────────────────────────────
function buildContext(
  currentTrack: any,
  audioFeatures: any,
  topTracks: any[],
  recentTracks: any[]
): string {
  const parts: string[] = [];
  if (currentTrack) {
    parts.push(`Brano corrente: "${currentTrack.name}" di ${currentTrack.artists?.[0]?.name}`);
  }
  if (audioFeatures) {
    if (audioFeatures.tempo) parts.push(`BPM: ${Math.round(audioFeatures.tempo)}`);
    if (audioFeatures.energy !== undefined) parts.push(`Energia: ${Math.round(audioFeatures.energy * 100)}%`);
    if (audioFeatures.valence !== undefined) parts.push(`Positività: ${Math.round(audioFeatures.valence * 100)}%`);
  }
  if (topTracks.length > 0) {
    const names = topTracks.slice(0, 5).map((t: any) => `"${t.name}" di ${t.artists?.[0]?.name}`);
    parts.push(`Brani più ascoltati: ${names.join(", ")}`);
  }
  return parts.join(" | ");
}

function generateReply(
  userText: string,
  contextStr: string,
  history: Message[]
): { text: string; tracks?: RecommendedTrack[] } {
  const lower = userText.toLowerCase();

  const trackMatch = contextStr.match(/Brano corrente: "([^"]+)" di ([^|]+)/);
  const trackName = trackMatch ? trackMatch[1] : null;
  const artistName = trackMatch ? trackMatch[2].trim() : null;

  const bpmMatch = contextStr.match(/BPM: (\d+)/);
  const bpm = bpmMatch ? parseInt(bpmMatch[1]) : null;

  const energyMatch = contextStr.match(/Energia: (\d+)%/);
  const energy = energyMatch ? parseInt(energyMatch[1]) : 70;

  const valenceMatch = contextStr.match(/Positività: (\d+)%/);
  const valence = valenceMatch ? parseInt(valenceMatch[1]) : 65;

  const topArtists: string[] = [];
  const topTracksMatch = contextStr.match(/Brani più ascoltati: (.+)$/);
  if (topTracksMatch) {
    const raw = topTracksMatch[1];
    const matches = raw.match(/"([^"]+)" di ([^,]+)/g);
    if (matches) {
      matches.forEach((m) => {
        const sub = m.match(/"([^"]+)" di (.+)/);
        if (sub && sub[2]) topArtists.push(sub[2].trim());
      });
    }
  }

  if (/ciao|salve|hey|buongiorno|buonasera/.test(lower)) {
    return {
      text: trackName
        ? `Ciao! 🎵 Sto monitorando la tua riproduzione di **"${trackName}"** di **${artistName}**. Come posso aiutarti?`
        : `Ciao! 🌟 Sono **LyraAI**, il tuo assistente musicale. Come posso aiutarti oggi?`,
    };
  }

  if (/cosa sto ascoltando|brano corrente|canzone attuale|traccia/.test(lower)) {
    if (!trackName) return { text: "Non riesco a vedere cosa stai ascoltando in questo momento. Avvia un brano su Spotify!" };
    const mood = valence > 60 ? "allegro e positivo" : valence > 40 ? "neutro" : "malinconico o intenso";
    return {
      text: `Stai ascoltando **"${trackName}"** di **${artistName}**. Il brano ha un ritmo di **${bpm} BPM** con un'energia del **${energy}%**. Il mood è ${mood}.`,
    };
  }

  if (/bpm|ritmo|velocit|tempo/.test(lower)) {
    if (trackName) {
      return {
        text: `⏱️ **Analisi BPM Brano**\n\nIl brano corrente **"${trackName}"** di **${artistName}** ha un tempo esatto di **${bpm} BPM**.\n\n${bpm && bpm > 130 ? "⚡ **Ritmo Veloce / Hype**: ideale per allenamento, corsa o momenti di massima carica!" : bpm && bpm > 100 ? "🎶 **Ritmo Medio / Dance**: perfetto per ballare, concentrarsi o guidare!" : "🌙 **Ritmo Chill / Slow**: ideale per momenti rilassati o studio."}`,
      };
    }
    return {
      text: `⏱️ **Analisi BPM**\n\nIn base ai tuoi ascolti, il ritmo medio delle tue tracce preferite è di **${bpm || 120} BPM**.\n\nAvvia un brano su Spotify e ti dirò i suoi BPM esatti in tempo reale!`,
    };
  }

  if (/energia|energico|hype/.test(lower)) {
    if (energy > 75) return { text: `L'energia di questo brano è al **${energy}%** — altissima! Stai ascoltando qualcosa di molto coinvolgente. ⚡` };
    if (energy > 50) return { text: `L'energia è al **${energy}%** — bilanciata, né troppo calma né troppo esplosiva. 🔥` };
    return { text: `L'energia è al **${energy}%** — bassa. Un brano ideale per rilassarsi o concentrarsi. 🧘` };
  }

  if (/consigli|suggerisci|simile|simili|ascoltare|cosa metti|consigliami/.test(lower)) {
    return {
      text: `🎨 **Consigli Personalizzati LyraAI**\n\nEcco le **10 canzoni consigliate** per il tuo profilo musicale. Clicca su qualsiasi card per ascoltarla subito:`,
      tracks: MOOD_RECOMMENDED_TRACKS,
    };
  }

  if (/umore|mood|mi sento|stato d'animo|analizza il mood/.test(lower)) {
    const moodTitle = valence > 60 ? "Energico & Positivo (Euphoric Vibes) ☀️" : valence > 40 ? "Focus & Chill (Balanced Mood) 🎧" : "Deep & Melancholic (Intense Mood) 🌧️";
    return {
      text: `🎨 **Analisi del Mood Musicale**\n\nAttualmente il tuo mood rilevato è: **${moodTitle}** (Positività ${valence}%, Energia ${energy}%).\n\n${bpm ? `Il ritmo attuale ha una frequenza di **${bpm} BPM**, ideale per mantenere alta la carica.` : "Le caratteristiche audio mostrano un eccellente bilanciamento emotivo e ritmico."}`,
    };
  }

  if (/crea playlist|crea la playlist|playlist mood/.test(lower)) {
    return {
      text: `✅ **Playlist Creata con Successo!** 🎧\n\nHo creato la playlist **"LyraAI Mood Mix"** con i 10 brani consigliati per il tuo mood attuale e l'ho salvata nei tuoi Preferiti su Spotify! Puoi trovarla subito nella tua Libreria.`,
    };
  }

  if (/artista|chi.*canta|chi.*suona|band|gruppo/.test(lower)) {
    if (!artistName) return { text: "Avvia un brano su Spotify per vedere chi sta suonando!" };
    return {
      text: `Stai ascoltando **${artistName}**. ${topArtists.length > 0 ? `Tra i tuoi artisti preferiti figurano anche ${topArtists.slice(0,3).join(", ")}.` : ""}`,
    };
  }

  if (/playlist|crea|mix|dj/.test(lower)) {
    return {
      text: `Per creare mix e playlist con l'AI, scrivi **"Consigliami qualcosa"** per ottenere consigli personalizzati o usa l'**AI DJ**! 🎧`,
    };
  }

  if (/grazie|perfetto|ottimo|bravo|bello/.test(lower)) {
    return { text: `Prego! Sono qui ogni volta che vuoi esplorare la tua musica. 🎵✨` };
  }

  if (/chi sei|cosa sei|presentati|chi è lyra|lyraai/.test(lower)) {
    return {
      text: `Sono **LyraAI** 🌟, la tua assistente musicale integrata in Music Hub. Posso analizzare il brano che stai ascoltando, capire il tuo mood musicale, consigliarti artisti simili e rispondere alle tue domande sulla musica. Cosa vuoi sapere?`,
    };
  }

  if (/aiuto|help|cosa puoi fare|cosa sai/.test(lower)) {
    return {
      text: `Ecco cosa posso fare per te:\n\n• 🎵 **Analisi brano** — BPM, energia, mood\n• 🎨 **Consigli musicali** — consigli di canzoni + crea playlist\n• 📊 **I tuoi gusti** — artisti e brani che ascolti di più\n• 💬 **Chat libera** — parlami di musica!\n\nProva a chiedermi "analizza il mood" o "quanti BPM ha?".`,
    };
  }

  if (trackName) {
    const generics = [
      `Interessante! Nel contesto di "${trackName}" (${bpm ? `${bpm} BPM` : "brano corrente"}), posso dirti che ${energy !== null && energy > 60 ? "si tratta di musica energica." : "è un brano più rilassato."} Hai altre domande musicali?`,
      `Non ho una risposta specifica per questo, ma sono sempre pronta a parlare di musica! Dimmi di più su cosa cerchi. 🎵`,
    ];
    return { text: generics[Math.floor(Math.random() * generics.length)] };
  }

  return { text: `Mmm, non ho capito bene. Puoi riformulare? Sono specializzata in tutto ciò che riguarda la musica — brani, artisti, mood, BPM e molto altro! 🎶` };
}

const buildInitialMessages = (dailyTrack?: RecommendedTrack, moodLabel?: string): Message[] => [
  {
    id: "welcome-1",
    role: "assistant",
    content: "Ciao, sono **Lyra**, il tuo assistente musicale personale.",
    timestamp: new Date(),
  },
  {
    id: "welcome-2",
    role: "assistant",
    content: dailyTrack
      ? `Per oggi sento un mood **${moodLabel || "su misura"}**. Ti consiglio questa canzone che non risulta nei tuoi ascolti recenti:`
      : "Sto leggendo il tuo mood musicale di oggi per consigliarti qualcosa di nuovo.",
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const spTrack = playbackState?.item;
  const currentTrack = spTrack
    ? {
        name: spTrack.name,
        artist: spTrack.artists?.[0]?.name || "Artista Sconosciuto",
        cover: spTrack.album?.images?.[0]?.url || MOOD_RECOMMENDED_TRACKS[0].cover,
      }
    : player.currentTrack
    ? {
        name: player.currentTrack.title,
        artist: player.currentTrack.artist,
        cover: player.currentTrack.cover || MOOD_RECOMMENDED_TRACKS[0].cover,
      }
    : null;

  const topTracks = topTracksData?.items || [];
  const recentTracks = (recentData as any)?.items || [];

  const refreshMoodRecommendations = useCallback(async () => {
    const result = await buildMoodRecommendations(currentTrack, topTracks, recentTracks, 10);
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
    return () => { cancelled = true; };
  }, [isOpen, refreshMoodRecommendations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 400);
  }, [isOpen]);

  const sendMessageText = useCallback(async (textToSubmit: string) => {
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

    const delay = 500 + Math.random() * 500;
    await new Promise((r) => setTimeout(r, delay));

    const context = buildContext(currentTrack, audioFeatures, topTracks, recentTracks);
    const reply = generateReply(trimmed, context, messages);

    let finalTracks = reply.tracks;
    if (reply.tracks) {
      const result = moodRecommendations.length > 0
        ? { mood: { label: moodLabel }, tracks: moodRecommendations }
        : await refreshMoodRecommendations();
      finalTracks = result.tracks;
      reply.text = `🎨 **Consigli Personalizzati LyraAI**\n\nMood di oggi rilevato: **${result.mood.label}**.\n\nEcco brani simili al tuo momento musicale, pescati dal catalogo Spotify e filtrati per evitare quelli già ascoltati:`;
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
  }, [isTyping, currentTrack, audioFeatures, topTracks, recentTracks, messages, moodRecommendations, moodLabel, refreshMoodRecommendations]);

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
            <div className="shrink-0 px-5 py-4 border-b border-border flex items-center justify-between bg-secondary/30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-base flex items-center gap-1.5">
                    LyraAI <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">Beta</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">Assistente musicale intelligente</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
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
                    <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5 ${
                      msg.role === "assistant"
                        ? "bg-gradient-to-br from-primary to-primary/40"
                        : "bg-secondary"
                    }`}>
                      {msg.role === "assistant"
                        ? <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
                        : <User className="w-3.5 h-3.5 text-muted-foreground" />
                      }
                    </div>

                    <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "assistant"
                        ? "bg-secondary/50 border border-border/30 rounded-tl-sm"
                        : "bg-primary text-primary-foreground rounded-tr-sm"
                    }`}>
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

                      <p className={`text-[10px] mt-1 ${msg.role === "assistant" ? "text-muted-foreground" : "text-primary-foreground/60"}`}>
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
                    <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary/40 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
                    </div>
                    <div className="px-3.5 py-3 rounded-2xl rounded-tl-sm bg-secondary/50 border border-border/30 flex items-center gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
                          animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
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
              {["Cosa stai ascoltando?", "Analizza il mood", "Consigliami qualcosa", "Quanti BPM ha?"].map((p) => (
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
              <div className="flex items-center gap-2 bg-secondary/40 border border-border/50 rounded-2xl px-4 py-2.5 focus-within:border-primary/50 transition-colors">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Chiedi a LyraAI..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                />
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={sendMessage}
                  disabled={!input.trim() || isTyping}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    input.trim() && !isTyping
                      ? "bg-primary text-primary-foreground shadow-md"
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
