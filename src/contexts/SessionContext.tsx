/**
 * SessionContext
 * Stato globale persistente tra navigazione delle pagine.
 * Gestisce la sessione Listen Along (e futuramente altri stati live).
 */
import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import { supabase } from "@/services/supabase-api";
import { useToast } from "@/hooks/use-toast";
import * as spotifyApi from "@/services/spotify-api";

interface SessionContextType {
  listenAlongSessionId: string | null;
  setListenAlongSessionId: (id: string | null) => void;
  broadcastAction: (type: string, payload?: any) => void;
  isMultiDeviceSynced: boolean;
  activeDevicesCount: number;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "harmony_hub_active_jam_session";
const BROADCAST_CHANNEL_NAME = "harmony_hub_jam_sync";

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [listenAlongSessionId, setListenAlongSessionIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(LOCAL_STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });

  const [activeDevicesCount, setActiveDevicesCount] = useState<number>(1);
  const [isMultiDeviceSynced, setIsMultiDeviceSynced] = useState<boolean>(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const { toast } = useToast();

  const setListenAlongSessionId = (id: string | null) => {
    setListenAlongSessionIdState(id);
    try {
      if (id) {
        localStorage.setItem(LOCAL_STORAGE_KEY, id);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    } catch (e) {
      console.warn("Could not save session to localStorage", e);
    }

    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: "SESSION_CHANGE",
        sessionId: id,
        timestamp: Date.now(),
      });
    }
  };

  // Cross-tab and multi-window listener
  useEffect(() => {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      broadcastChannelRef.current = bc;

      bc.onmessage = (event) => {
        if (event.data?.type === "SESSION_CHANGE") {
          const newId = event.data.sessionId;
          setListenAlongSessionIdState(newId);
          setIsMultiDeviceSynced(true);
          setActiveDevicesCount((prev) => Math.max(2, prev + 1));
          if (newId) {
            toast({
              title: "Jam Sincronizzata",
              description: `Connesso alla sessione ${newId} da un'altra scheda/dispositivo.`,
            });
          }
        }
      };

      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === LOCAL_STORAGE_KEY) {
          setListenAlongSessionIdState(e.newValue);
          if (e.newValue) {
            setIsMultiDeviceSynced(true);
          }
        }
      };

      window.addEventListener("storage", handleStorageChange);

      return () => {
        bc.close();
        broadcastChannelRef.current = null;
        window.removeEventListener("storage", handleStorageChange);
      };
    }
  }, [toast]);

  // Supabase Realtime channel subscription for active Jam session
  useEffect(() => {
    if (!listenAlongSessionId) return;

    const channel = supabase.channel(`listen-along-${listenAlongSessionId}`, {
      config: { broadcast: { self: false } }
    });

    channel
      .on("broadcast", { event: "sync" }, async ({ payload }) => {
        console.log("[ListenAlong] Sync received:", payload);
        try {
          const devs = await spotifyApi.getAvailableDevices().catch(() => null);
          const devices: any[] = devs?.devices || [];
          const activeDevice = devices.find((d: any) => d.is_active)?.id || devices[0]?.id;

          if (!activeDevice) return;

          if (payload.type === "PLAY") {
            await spotifyApi.play(activeDevice, undefined, payload.uris, payload.offset);
          } else if (payload.type === "PAUSE") {
            await spotifyApi.pause(activeDevice);
          } else if (payload.type === "SEEK") {
            await spotifyApi.seek(payload.position_ms);
          }
        } catch (err) {
          console.error("[ListenAlong] Error applying sync:", err);
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          toast({ title: "Listen Along", description: `Connesso alla sessione ${listenAlongSessionId}` });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [listenAlongSessionId, toast]);

  const broadcastAction = (type: string, payload: any = {}) => {
    if (!channelRef.current) return;
    channelRef.current.send({
      type: "broadcast",
      event: "sync",
      payload: { type, ...payload }
    });
  };

  return (
    <SessionContext.Provider
      value={{
        listenAlongSessionId,
        setListenAlongSessionId,
        broadcastAction,
        isMultiDeviceSynced,
        activeDevicesCount,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSessionContext = (): SessionContextType => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSessionContext must be used within a SessionProvider");
  return ctx;
};
