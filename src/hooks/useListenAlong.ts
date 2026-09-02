import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/services/supabase-api";
import { useSpotifyContext } from "@/contexts/SpotifyContext";
import { useToast } from "@/hooks/use-toast";
import * as spotifyApi from "@/services/spotify-api";

export interface NearbyUser {
  id: string;
  name: string;
  avatar: string;
  currentTrack?: string;
  artist?: string;
  distance: string;
  jamCode?: string;
  isHost?: boolean;
  status: "listening" | "party" | "open";
}

const DEFAULT_NEARBY_USERS: NearbyUser[] = [
  {
    id: "nearby-1",
    name: "Marco Rossi",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces",
    currentTrack: "Starboy",
    artist: "The Weeknd",
    distance: "A 3 metri (Wi-Fi Casa)",
    jamCode: "MARCO-JAM",
    isHost: true,
    status: "party",
  },
  {
    id: "nearby-2",
    name: "Giulia & Friends Jam",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces",
    currentTrack: "Levitating",
    artist: "Dua Lipa",
    distance: "A 8 metri",
    jamCode: "GIULIA-84",
    isHost: true,
    status: "listening",
  },
  {
    id: "nearby-3",
    name: "Alessandro - Synthwave Room",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop&crop=faces",
    currentTrack: "Blinding Lights",
    artist: "The Weeknd",
    distance: "Nelle vicinanze (Bluetooth)",
    jamCode: "SYNTH-84",
    isHost: true,
    status: "open",
  },
  {
    id: "nearby-4",
    name: "Elena (Studio Beats)",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=faces",
    currentTrack: "Midnight City",
    artist: "M83",
    distance: "A 12 metri",
    jamCode: "STUDIO-99",
    isHost: true,
    status: "listening",
  },
];

export const useListenAlong = (sessionId: string | null) => {
  const { player, deviceId, playbackState, isPlaying } = useSpotifyContext();
  const { toast } = useToast();
  const channelRef = useRef<any>(null);
  const [participants, setParticipants] = useState<string[]>([]);
  const [isRadarActive, setIsRadarActive] = useState<boolean>(true);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>(DEFAULT_NEARBY_USERS);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  const generateSessionId = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const refreshNearbyUsers = useCallback(() => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 1500);
  }, []);

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
  }, [sessionId, deviceId, toast]);

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
    broadcastEvent,
    isRadarActive,
    setIsRadarActive,
    nearbyUsers,
    isScanning,
    refreshNearbyUsers,
  };
};
