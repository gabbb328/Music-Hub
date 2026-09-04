import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/services/supabase-api";
import type { GemEmoji, GemPayload, GemReaction } from "@/types/features";

const REACTION_TTL_MS = 3500

export interface UseGemOverlayOptions {
  sessionId: string | null;
  userId: string;
}

export function useGemOverlay({ sessionId, userId }: UseGemOverlayOptions) {
  const [reactions, setReactions] = useState<GemReaction[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const cleanSessionId =
    sessionId && sessionId !== "null" && sessionId !== "undefined" && sessionId.trim() !== ""
      ? sessionId.trim()
      : "global-radar-jam";

  useEffect(() => {
    if (reactions.length === 0) return;
    const timer = setTimeout(() => {
      const now = Date.now();
      setReactions((prev) => prev.filter((r) => now - r.timestamp < REACTION_TTL_MS));
    }, REACTION_TTL_MS);
    return () => clearTimeout(timer);
  }, [reactions]);

  useEffect(() => {
    const channel = supabase.channel(`gem-overlay-${cleanSessionId}`, {
      config: { broadcast: { self: true } },
    });

    channel
      .on<GemPayload>("broadcast", { event: "gem" }, ({ payload }) => {
        if (payload?.type !== "GEM_REACTION" || !payload.reaction) return;
        setReactions((prev) => [...prev, payload.reaction]);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [cleanSessionId]);

  const sendReaction = useCallback(
    (emoji: GemEmoji) => {
      const reaction: GemReaction = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        emoji,
        userId: userId || "anon",
        timestamp: Date.now(),
        x: 10 + Math.random() * 80,
      };

      const payload: GemPayload = { type: "GEM_REACTION", reaction };

      // Mostra immediatamente in locale
      setReactions((prev) => [...prev, reaction]);

      if (channelRef.current) {
        try {
          channelRef.current.send({
            type: "broadcast",
            event: "gem",
            payload,
          });
        } catch (e) {
          console.warn("[GemOverlay] Error sending reaction:", e);
        }
      }
    },
    [userId]
  );

  return { reactions, sendReaction };
}
