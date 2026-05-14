import { useState, useEffect } from "react";
import type { IpodScreen } from "@/components/IpodNowPlayingView";

// Memory-only storage (resets on page reload)
interface IpodStore {
  screen: IpodScreen;
  menuIndex: number;
  colorIndex: number;
  ipodMode: boolean;
  vinylMode: boolean;
}

let memoryStore: IpodStore = {
  screen: "nowplaying",
  menuIndex: 0,
  colorIndex: 0,
  ipodMode: false,
  vinylMode: false,
};

const listeners = new Set<(state: IpodStore) => void>();

export function useIpodPersistence() {
  const [state, setState] = useState<IpodStore>(memoryStore);

  useEffect(() => {
    const listener = (newState: IpodStore) => setState(newState);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const updateStore = (updates: Partial<IpodStore>) => {
    memoryStore = { ...memoryStore, ...updates };
    listeners.forEach((l) => l(memoryStore));
  };

  return {
    ...state,
    setScreen: (s: IpodScreen) => updateStore({ screen: s }),
    setMenuIndex: (i: number) => updateStore({ menuIndex: i }),
    setColorIndex: (i: number) => updateStore({ colorIndex: i }),
    setIpodMode: (m: boolean) => updateStore({ ipodMode: m }),
    setVinylMode: (m: boolean) => updateStore({ vinylMode: m }),
  };
}
