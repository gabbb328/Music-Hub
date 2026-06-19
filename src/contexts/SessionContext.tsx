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
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [listenAlongSessionId, setListenAlongSessionId] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!listenAlongSessionId) return;

    const channel = supabase.channel(`listen-along-${listenAlongSessionId}`, {
      config: { broadcast: { self: false } }
    });

    channel
      .on("broadcast", { event: "sync" }, async ({ payload }) => {
        console.log("[ListenAlong] Sync received:", payload);
        try {
          // Recuperiamo l'active device tramite spotifyApi, dato che qui non abbiamo SpotifyContext
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
    <SessionContext.Provider value={{ listenAlongSessionId, setListenAlongSessionId, broadcastAction }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSessionContext = (): SessionContextType => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSessionContext must be used within a SessionProvider");
  return ctx;
};
