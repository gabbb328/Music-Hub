import { useUserProfile } from "./useSpotify";
import { useToast } from "./use-toast";
import { useState } from "react";

export type SpotifyTierMode = "auto" | "premium" | "free";

export function useAccountTier() {
  const { data: profile, isLoading } = useUserProfile();
  const { toast } = useToast();

  const [mode, setModeState] = useState<SpotifyTierMode>(() => {
    return (localStorage.getItem("simulated_spotify_tier") as SpotifyTierMode) || "auto";
  });

  const setMode = (newMode: SpotifyTierMode) => {
    localStorage.setItem("simulated_spotify_tier", newMode);
    setModeState(newMode);
  };

  const detectedIsPremium = profile?.product === "premium";

  const isPremium = mode === "premium" ? true : mode === "free" ? false : detectedIsPremium;
  const isFree = !isPremium;

  const showPremiumToast = (featureName?: string) => {
    toast({
      title: "🔒 Funzione Riservata a Spotify Premium",
      description: featureName
        ? `"${featureName}" richiede un account Spotify Premium. Con l'account Free puoi ascoltare le anteprime 30s e usare tutte le ricerche e l'AI!`
        : "Spotify richiede Premium per la riproduzione streaming Web SDK completa. Con Free ascolti le anteprime 30s!",
      duration: 5000,
    });
  };

  return {
    isPremium,
    isFree,
    mode,
    setMode,
    product: isPremium ? "premium" : "free",
    profile,
    isLoading,
    showPremiumToast,
  };
}
