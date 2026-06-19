/**
 * useGemOverlay
 *
 * Hook per la feature "Funzione Insieme – GEM Overlay".
 * Gestisce l'invio e la ricezione di reazioni emoji in tempo reale
 * tramite il canale Supabase Realtime già usato in useListenAlong.
 *
 * NON richiede database: usa solo broadcast (nessuna persistenza).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/services/supabase-api";
import type { GemEmoji, GemPayload, GemReaction } from "@/types/features";

const REACTION_TTL_MS = 3500; // quanto dura ogni emoji sullo schermo

export interface UseGemOverlayOptions {
  sessionId: string | null;
  /** Id univoco dell'utente corrente (può essere un uuid temporaneo) */
  userId: string;
}

export function useGemOverlay({ sessionId, userId }: UseGemOverlayOptions) {
  const [reactions, setReactions] = useState<GemReaction[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Pulizia delle reazioni scadute
  useEffect(() => {
    if (reactions.length === 0) return;
    const timer = setTimeout(() => {
      const now = Date.now();
      setReactions((prev) => prev.filter((r) => now - r.timestamp < REACTION_TTL_MS));
    }, REACTION_TTL_MS);
    return () => clearTimeout(timer);
  }, [reactions]);

  // Iscrizione al canale Supabase
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase.channel(`gem-overlay-${sessionId}`, {
      config: { broadcast: { self: true } },
    });

    channel
      .on<GemPayload>("broadcast", { event: "gem" }, ({ payload }) => {
        if (payload.type !== "GEM_REACTION") return;
        setReactions((prev) => [...prev, payload.reaction]);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [sessionId]);

  /** Invia una reazione a tutti i partecipanti */
  const sendReaction = useCallback(
    (emoji: GemEmoji) => {
      if (!channelRef.current) return;

      const reaction: GemReaction = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        emoji,
        userId,
        timestamp: Date.now(),
        x: 10 + Math.random() * 80, // 10%..90% per non uscire dai bordi
      };

      const payload: GemPayload = { type: "GEM_REACTION", reaction };

      channelRef.current.send({
        type: "broadcast",
        event: "gem",
        payload,
      });
    },
    [userId]
  );

  return { reactions, sendReaction };
}
