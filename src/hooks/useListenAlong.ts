import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/services/supabase-api";
import { useSpotifyContext } from "@/contexts/SpotifyContext";
import { useToast } from "@/hooks/use-toast";

export const useListenAlong = (sessionId: string | null) => {
  const { player, deviceId, playbackState, isPlaying } = useSpotifyContext();
  const { toast } = useToast();
  const channelRef = useRef<any>(null);
  const [participants, setParticipants] = useState<string[]>([]);

  // Funzione per generare un codice a 8 cifre
  const generateSessionId = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase.channel(`listen-along-${sessionId}`, {
      config: {
        broadcast: { self: false },
        presence: { key: "user" }
      }
    });

    channel
      .on("broadcast", { event: "sync" }, ({ payload }) => {
        console.log("[ListenAlong] Received sync:", payload);
        if (payload.type === "PLAY") {
          // Logica per forzare il playback
        }
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setParticipants(Object.keys(state));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
          toast({ title: "Connesso!", description: `Ti sei unito alla sessione ${sessionId}` });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [sessionId]);

  const broadcastEvent = useCallback((type: string, data: any) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "sync",
        payload: { type, ...data }
      });
    }
  }, []);

  return {
    generateSessionId,
    participants,
    broadcastEvent
  };
};
