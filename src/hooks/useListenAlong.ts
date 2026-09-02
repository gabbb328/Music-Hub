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



function getAnonUserId(): string {
  const key = "harmony_hub_anon_uid";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    sessionStorage.setItem(key, id);
  }
  return id;
}

function getDeviceName(): string {
  if (typeof window === "undefined") return "Dispositivo Harmony";
  const ua = navigator.userAgent;
  if (/iphone/i.test(ua)) return "iPhone nelle Vicinanze";
  if (/android/i.test(ua)) return "Android nelle Vicinanze";
  if (/macintosh/i.test(ua)) return "MacBook nelle Vicinanze";
  if (/windows/i.test(ua)) return "PC Windows nelle Vicinanze";
  return "Dispositivo nelle Vicinanze";
}

const ANON_USER_ID = getAnonUserId();
const DEVICE_NAME = getDeviceName();

export const useListenAlong = (sessionId: string | null) => {
  const { player, deviceId, playbackState, isPlaying } = useSpotifyContext();
  const { toast } = useToast();
  const channelRef = useRef<any>(null);
  const radarChannelRef = useRef<any>(null);
  const [participants, setParticipants] = useState<string[]>([]);
  const [isRadarActive, setIsRadarActive] = useState<boolean>(true);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(true); // Inizia scansione subito
  const [scanDone, setScanDone] = useState<boolean>(false); // Diventa true dopo 10s
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const generateSessionId = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  // Avvia timer di scansione da 10 secondi
  useEffect(() => {
    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    setIsScanning(true);
    setScanDone(false);
    scanTimerRef.current = setTimeout(() => {
      setIsScanning(false);
      setScanDone(true);
    }, 10000);
    return () => {
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    };
  }, [isRadarActive]);

  // Real Supabase Presence Radar
  useEffect(() => {
    if (!isRadarActive) return;

    const radarChannel = supabase.channel("harmony-hub-global-radar", {
      config: {
        presence: { key: ANON_USER_ID },
      },
    });

    const updatePresenceList = () => {
      const state = radarChannel.presenceState();
      const realUsers: NearbyUser[] = [];

      Object.entries(state).forEach(([key, presences]) => {
        if (key === ANON_USER_ID) return; // Ignora se stesso
        const p = (presences as any[])?.[0];
        if (p) {
          realUsers.push({
            id: p.userId || key,
            name: p.name || "Utente Harmony Live",
            avatar:
              p.avatar ||
              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces",
            currentTrack: p.currentTrack || "In riproduzione",
            artist: p.artist || "Harmony Hub",
            distance: "Dispositivo Connesso Live (Supabase Presence)",
            jamCode: p.jamCode || `JAM-${key.slice(-4).toUpperCase()}`,
            isHost: p.isHost ?? true,
            status: p.status || "listening",
          });
        }
      });

      // Solo utenti reali, niente placeholder
      setNearbyUsers(realUsers);
    };

    radarChannel
      .on("presence", { event: "sync" }, updatePresenceList)
      .on("presence", { event: "join" }, updatePresenceList)
      .on("presence", { event: "leave" }, updatePresenceList)
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await radarChannel.track({
            userId: ANON_USER_ID,
            name: DEVICE_NAME,
            avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces",
            currentTrack: playbackState?.item?.name || "Musica in Ascolto",
            artist: playbackState?.item?.artists?.[0]?.name || "Harmony Hub",
            jamCode: sessionId || `JAM-${ANON_USER_ID.slice(-4).toUpperCase()}`,
            isHost: !!sessionId,
            status: sessionId ? "party" : "open",
            onlineAt: new Date().toISOString(),
          });
        }
      });

    radarChannelRef.current = radarChannel;

    return () => {
      radarChannel.unsubscribe();
      radarChannelRef.current = null;
    };
  }, [isRadarActive, sessionId, playbackState]);

  const refreshNearbyUsers = useCallback(() => {
    setIsScanning(true);
    if (radarChannelRef.current) {
      radarChannelRef.current.track({
        userId: ANON_USER_ID,
        name: DEVICE_NAME,
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces",
        currentTrack: playbackState?.item?.name || "Musica in Ascolto",
        artist: playbackState?.item?.artists?.[0]?.name || "Harmony Hub",
        jamCode: sessionId || `JAM-${ANON_USER_ID.slice(-4).toUpperCase()}`,
        isHost: !!sessionId,
        status: sessionId ? "party" : "open",
        onlineAt: new Date().toISOString(),
      });
    }
    setTimeout(() => {
      setIsScanning(false);
    }, 1200);
  }, [sessionId, playbackState]);

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
