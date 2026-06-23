import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/services/supabase-api";
import { useSpotifyContext } from "@/contexts/SpotifyContext";
import { useToast } from "@/hooks/use-toast";
import * as spotifyApi from "@/services/spotify-api";

export const useListenAlong = (sessionId: string | null) => {
  const { player, deviceId, playbackState, isPlaying } = useSpotifyContext();
  const { toast } = useToast();
  const channelRef = useRef<any>(null);
  const [participants, setParticipants] = useState<string[]>([]);

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
      .on("broadcast", { event: "sync" }, async ({ payload }) => {
        console.log("[ListenAlong] Received sync:", payload);
        try {
          if (payload.type === "PLAY") {
            await spotifyApi.play(deviceId, undefined, payload.uris, payload.offset);
          } else if (payload.type === "PAUSE") {
            await spotifyApi.pause(deviceId);
          } else if (payload.type === "SEEK") {
            await spotifyApi.seek(payload.position_ms);
          }
        } catch (err) {
          console.error("[ListenAlong] Error applying sync:", err);
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
