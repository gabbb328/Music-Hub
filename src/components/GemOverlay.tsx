/**
 * GemOverlay — Pannello bottoni reazioni emoji (pioggia sulla copertina).
 * I bottoni inviano la reazione tramite la prop sendReaction ricevuta dal parent.
 * L'effetto visivo (pioggia emoji sulla copertina) è gestito in NowPlayingView.
 */

import React, { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { GemEmoji } from "@/types/features";

const GEM_EMOJIS: GemEmoji[] = ["🔥", "❤️", "😭", "🎧"];

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
}

const GemOverlay: React.FC<GemOverlayProps> = ({ sessionId, sendReaction }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const isPrivateSession = !!(
    sessionId &&
    sessionId !== "null" &&
    sessionId !== "undefined" &&
    sessionId.trim() !== ""
  );

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
          Pioggia emoji attiva nella Jam ({sessionId})
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-[11px] text-primary/80 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Pioggia emoji globale attiva
        </div>
      )}

      {/* Bottoni emoji */}
      <div className="flex gap-2 flex-wrap justify-center">
        {GEM_EMOJIS.map((emoji) => (
          <motion.button
            key={emoji}
            onClick={() => handleSend(emoji)}
            variants={BTN}
            initial="idle"
            whileHover="hover"
            whileTap="tap"
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="w-14 h-14 rounded-2xl text-2xl bg-card/80 backdrop-blur-sm border border-border/40 shadow-md hover:shadow-lg hover:border-primary/30 transition-shadow cursor-pointer"
            aria-label={`Invia ${emoji}`}
          >
            {emoji}
          </motion.button>
        ))}

        {/* Bottone emoji personalizzata */}
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
            className="w-14 h-14 rounded-2xl text-xl font-bold flex items-center justify-center bg-primary/20 border-2 border-primary/40 hover:border-primary/70 shadow-md transition-all cursor-pointer"
            aria-label="Emoji personalizzata"
          >
            ＋
          </motion.button>

          <AnimatePresence>
            {showPicker && sessionId && (
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
                    className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-40 hover:opacity-90 transition-opacity"
                  >
                    ➤
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
