import React, { useRef, useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Flame,
  Heart,
  Sparkles,
  Headphones,
  Music,
  Zap,
  Plus,
  Send,
  CloudRain,
  Ghost,
  Moon,
  Sun,
  Smile,
  Disc3,
  Radio,
} from "lucide-react";
import type { GemEmoji } from "@/types/features";

function getMoodReactions(audioFeatures?: any) {
  const fixed = [
    { id: "heart", emoji: "❤️", icon: Heart, color: "text-rose-500 border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20" },
    { id: "headphones", emoji: "🎧", icon: Headphones, color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20" },
  ];

  let dynamic = [];

  if (audioFeatures) {
    const energy = audioFeatures.energy ?? 0.5;
    const valence = audioFeatures.valence ?? 0.5;
    const danceability = audioFeatures.danceability ?? 0.5;
    const acousticness = audioFeatures.acousticness ?? 0.3;

    if (energy > 0.65) {
      dynamic = [
        { id: "flame", emoji: "🔥", icon: Flame, color: "text-orange-500 border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20" },
        { id: "zap", emoji: "⚡", icon: Zap, color: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20" },
        { id: "sparkles", emoji: "✨", icon: Sparkles, color: "text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20" },
      ];
    } else if (valence < 0.45 || acousticness > 0.6) {
      dynamic = [
        { id: "rain", emoji: "🌧️", icon: CloudRain, color: "text-blue-400 border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20" },
        { id: "ghost", emoji: "💀", icon: Ghost, color: "text-purple-400 border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20" },
        { id: "moon", emoji: "🌙", icon: Moon, color: "text-indigo-300 border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20" },
      ];
    } else if (danceability > 0.7) {
      dynamic = [
        { id: "disco", emoji: "🪩", icon: Disc3, color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20" },
        { id: "flame", emoji: "🔥", icon: Flame, color: "text-orange-500 border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20" },
        { id: "radio", emoji: "📻", icon: Radio, color: "text-teal-400 border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20" },
      ];
    } else if (valence > 0.6) {
      dynamic = [
        { id: "sun", emoji: "☀️", icon: Sun, color: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20" },
        { id: "smile", emoji: "😊", icon: Smile, color: "text-lime-400 border-lime-500/30 bg-lime-500/10 hover:bg-lime-500/20" },
        { id: "sparkles", emoji: "✨", icon: Sparkles, color: "text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20" },
      ];
    } else {
      dynamic = [
        { id: "flame", emoji: "🔥", icon: Flame, color: "text-orange-500 border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20" },
        { id: "sparkles", emoji: "✨", icon: Sparkles, color: "text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20" },
        { id: "music", emoji: "🎵", icon: Music, color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20" },
      ];
    }
  } else {
    dynamic = [
      { id: "flame", emoji: "🔥", icon: Flame, color: "text-orange-500 border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20" },
      { id: "sparkles", emoji: "✨", icon: Sparkles, color: "text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20" },
      { id: "zap", emoji: "⚡", icon: Zap, color: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20" },
    ];
  }

  return [...fixed, ...dynamic];
}

const CUSTOM_PICKER_EMOJIS = [
  "🎵", "🎶", "🎸", "🎹", "🥁", "🎺", "🎻", "🎤",
  "⭐", "💫", "✨", "🌟", "🙌", "👏", "💃", "🕺",
  "😂", "🤩", "😍", "🥹", "😤", "🤯", "💀", "🫶",
];

const BTN = {
  idle: { scale: 1 },
  hover: { scale: 1.18 },
  tap: { scale: 0.82 },
};

interface GemOverlayProps {
  sessionId: string | null;
  sendReaction: (emoji: string) => void;
  audioFeatures?: any;
}

const GemOverlay: React.FC<GemOverlayProps> = ({ sessionId, sendReaction, audioFeatures }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const isPrivateSession = !!(
    sessionId &&
    sessionId !== "null" &&
    sessionId !== "undefined" &&
    sessionId.trim() !== ""
  );

  const reactionsList = useMemo(() => getMoodReactions(audioFeatures), [audioFeatures]);

  const handleSend = (emoji: string) => {
    const e = emoji.trim();
    if (!e) return;
    sendReaction(e);
    setShowPicker(false);
    setCustomInput("");
  };

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      {/* Indicatore stato */}
      {isPrivateSession ? (
        <div className="flex items-center gap-1.5 text-[11px] text-green-400 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Reazioni Lucide attive nella Jam ({sessionId})
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-[11px] text-primary/80 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Reazioni Lucide globali attive
        </div>
      )}

      {/* Bottoni reazione Lucide React (5 Mood + 1 Custom Picker = 6 totali) */}
      <div className="flex gap-2 flex-wrap justify-center">
        {reactionsList.map((item) => {
          const IconComp = item.icon;
          return (
            <motion.button
              key={item.id}
              onClick={() => handleSend(item.emoji)}
              variants={BTN}
              initial="idle"
              whileHover="hover"
              whileTap="tap"
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border backdrop-blur-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center cursor-pointer ${item.color}`}
              aria-label={`Invia ${item.id}`}
            >
              <IconComp className="w-6 h-6 sm:w-7 sm:h-7 shrink-0" />
            </motion.button>
          );
        })}

        {/* Bottone 6: Emoji personalizzata (+) */}
        <div className="relative">
          <motion.button
            onClick={() => {
              setShowPicker((v) => !v);
              setTimeout(() => inputRef.current?.focus(), 80);
            }}
            variants={BTN}
            initial="idle"
            whileHover="hover"
            whileTap="tap"
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center bg-primary/20 border-2 border-primary/40 hover:border-primary/70 shadow-md transition-all cursor-pointer text-primary"
            aria-label="Emoji personalizzata"
          >
            <Plus className="w-6 h-6 sm:w-7 sm:h-7" />
          </motion.button>

          <AnimatePresence>
            {showPicker && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: 8 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="absolute bottom-full mb-2 right-0 z-50 w-72 rounded-2xl bg-card/95 border border-border/60 shadow-2xl backdrop-blur-xl p-3 space-y-3"
              >
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSend(customInput);
                      if (e.key === "Escape") setShowPicker(false);
                    }}
                    placeholder="Digita o incolla un'emoji…"
                    maxLength={8}
                    className="flex-1 px-3 py-2 rounded-xl bg-background/60 border border-border/40 text-sm outline-none focus:border-primary/60 transition-colors placeholder:text-muted-foreground/50"
                  />
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleSend(customInput)}
                    disabled={!customInput.trim()}
                    className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center"
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                </div>
                <div className="grid grid-cols-8 gap-1">
                  {CUSTOM_PICKER_EMOJIS.map((e) => (
                    <motion.button
                      key={e}
                      whileTap={{ scale: 0.8 }}
                      whileHover={{ scale: 1.25 }}
                      onClick={() => handleSend(e)}
                      className="w-8 h-8 rounded-lg text-lg flex items-center justify-center hover:bg-primary/20 transition-colors"
                    >
                      {e}
                    </motion.button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground/60 text-center">
                  Scegli dal picker o digita qualsiasi emoji
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default GemOverlay;
