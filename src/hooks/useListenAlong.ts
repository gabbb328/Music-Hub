import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/services/supabase-api";
import { useSpotifyContext } from "@/contexts/SpotifyContext";
import { useToast } from "@/hooks/use-toast";
import * as spotifyApi from "@/services/spotify-api";
import { useUserProfile } from "@/hooks/useSpotify";

export type JamMode = "control" | "simultaneous" | null;

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
  if (/iphone/i.test(ua)) return "iPhone";
  if (/android/i.test(ua)) return "Android";
  if (/macintosh/i.test(ua)) return "MacBook";
  if (/windows/i.test(ua)) return "PC Windows";
  return "Dispositivo";
}

const ANON_USER_ID = getAnonUserId();
const DEVICE_NAME = getDeviceName();

export const useListenAlong = (
  sessionId: string | null,
  jamMode: JamMode = null,
  onJamInvite?: (user: NearbyUser) => void
) => {
  const { player, deviceId, playbackState, isPlaying } = useSpotifyContext();
  const { data: userProfile } = useUserProfile();
  const { toast } = useToast();
  const channelRef = useRef<any>(null);
  const radarChannelRef = useRef<any>(null);
  const knownJamHostsRef = useRef<Set<string>>(new Set());
  const [participants, setParticipants] = useState<string[]>([]);
  const [isRadarActive, setIsRadarActive] = useState<boolean>(true);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [scanDone, setScanDone] = useState<boolean>(false);
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const spotifyAvatar =
    userProfile?.images?.[0]?.url ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userProfile?.display_name || DEVICE_NAME)}`;
  const spotifyName = userProfile?.display_name || userProfile?.id || DEVICE_NAME;

  const generateSessionId = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  // -- Timer 10s di scansione iniziale --
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

  // -- Supabase Presence Radar --
  // Mostra SOLO chi ha una Jam attiva (status === "party")
  useEffect(() => {
    if (!isRadarActive) return;

    const radarChannel = supabase.channel("harmony-hub-global-radar", {
      config: { presence: { key: ANON_USER_ID } },
    });

    const updatePresenceList = () => {
      const state = radarChannel.presenceState();
      const activeJamHosts: NearbyUser[] = [];

      Object.entries(state).forEach(([key, presences]) => {
        if (key === ANON_USER_ID) return;
        const p = (presences as any[])?.[0];
        if (p && p.status === "party" && p.jamCode) {
          const user: NearbyUser = {
            id: p.userId || key,
            name: p.name || "Utente Harmony",
            avatar: p.avatar || spotifyAvatar,
            currentTrack: p.currentTrack || undefined,
            artist: p.artist || undefined,
            distance: "Rilevato nelle vicinanze",
            jamCode: p.jamCode,
            isHost: true,
            status: "party",
          };
          activeJamHosts.push(user);

          // Notifica invito solo se Jam nuova per l'utente esterno
          if (!knownJamHostsRef.current.has(key)) {
            knownJamHostsRef.current.add(key);
            onJamInvite?.(user);
          }
        }
      });

      setNearbyUsers(activeJamHosts);
    };

    radarChannel
      .on("presence", { event: "sync" }, updatePresenceList)
      .on("presence", { event: "join" }, updatePresenceList)
      .on("presence", { event: "leave" }, updatePresenceList)
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await radarChannel.track({
            userId: ANON_USER_ID,
            name: spotifyName,
            avatar: spotifyAvatar,
            currentTrack: playbackState?.item?.name || undefined,
            artist: playbackState?.item?.artists?.[0]?.name || undefined,
            jamCode: sessionId || null,
            isHost: !!sessionId,
            status: sessionId ? "party" : "open",
            jamMode: jamMode || null,
            onlineAt: new Date().toISOString(),
          });
        }
      });

    radarChannelRef.current = radarChannel;

    return () => {
      radarChannel.unsubscribe();
      radarChannelRef.current = null;
    };
  }, [isRadarActive, sessionId, jamMode, playbackState, onJamInvite, spotifyAvatar, spotifyName]);

  const refreshNearbyUsers = useCallback(() => {
    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    setIsScanning(true);
    setScanDone(false);
    radarChannelRef.current?.track({
      userId: ANON_USER_ID,
      name: spotifyName,
      avatar: spotifyAvatar,
      currentTrack: playbackState?.item?.name || undefined,
      artist: playbackState?.item?.artists?.[0]?.name || undefined,
      jamCode: sessionId || null,
      isHost: !!sessionId,
      status: sessionId ? "party" : "open",
      jamMode: jamMode || null,
      onlineAt: new Date().toISOString(),
    });
    scanTimerRef.current = setTimeout(() => {
      setIsScanning(false);
      setScanDone(true);
    }, 10000);
  }, [sessionId, jamMode, playbackState, spotifyAvatar, spotifyName]);

  // -- Canale Jam attiva --
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase.channel(`listen-along-${sessionId}`, {
      config: {
        broadcast: { self: false },
        presence: { key: ANON_USER_ID },
      },
    });

    channel
      .on("broadcast", { event: "sync" }, async ({ payload }) => {
        try {
          const devs = await spotifyApi.getAvailableDevices().catch(() => null);
          const devices: any[] = devs?.devices || [];

          if (payload.type === "PLAY") {
            if (devices.length > 0) {
              await Promise.all(
                devices.map((d: any) =>
                  spotifyApi.play(d.id, undefined, payload.uris, payload.offset).catch(() => null)
                )
              );
            } else {
              await spotifyApi.play(deviceId || undefined, undefined, payload.uris, payload.offset).catch(() => null);
            }
          } else if (payload.type === "PAUSE") {
            if (devices.length > 0) {
              await Promise.all(
                devices.map((d: any) => spotifyApi.pause(d.id).catch(() => null))
              );
            } else {
              await spotifyApi.pause(deviceId || undefined).catch(() => null);
            }
          } else if (payload.type === "SEEK") {
            if (devices.length > 0) {
              await Promise.all(
                devices.map((d: any) => spotifyApi.seek(payload.position_ms, d.id).catch(() => null))
              );
            } else {
              await spotifyApi.seek(payload.position_ms, deviceId || undefined).catch(() => null);
            }
          } else if (payload.type === "STOP_SESSION" || payload.type === "SESSION_CLOSED") {
            if (devices.length > 0) {
              await Promise.all(devices.map((d: any) => spotifyApi.pause(d.id).catch(() => null)));
            } else {
              await spotifyApi.pause(deviceId || undefined).catch(() => null);
            }
          }
        } catch (err) {
          console.warn("[ListenAlong] Error applying playback sync:", err);
        }
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setParticipants(Object.keys(state));
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        // Quando un altro utente/dispositivo si collega alla Jam
        if (newPresences && newPresences.length > 0) {
          newPresences.forEach((p: any) => {
            if (p.userId && p.userId !== ANON_USER_ID) {
              toast({
                title: "Dispositivo Collegato!",
                description: `Dispositivo ${p.deviceName || "Remoto"} (Account ${p.userName || "Spotify"}) collegato alla Jam.`,
                variant: "success",
              });
            }
          });
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            userId: ANON_USER_ID,
            userName: spotifyName,
            deviceName: DEVICE_NAME,
            online_at: new Date().toISOString(),
          });
        }
      });

    channelRef.current = channel;
    return () => { channel.unsubscribe(); };
  }, [sessionId, deviceId, toast, spotifyName]);

  const broadcastEvent = useCallback((type: string, data: any) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "sync",
        payload: { type, ...data },
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
    scanDone,
    refreshNearbyUsers,
  };
};
