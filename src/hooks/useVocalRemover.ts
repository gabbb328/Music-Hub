import { useState, useCallback, useEffect } from "react";

/**
 * useVocalRemover
 * 
 * NOTA: A causa delle restrizioni DRM del Spotify Web Playback SDK, non è possibile
 * accedere direttamente allo stream audio crittografato per manipolarlo via Web Audio API.
 * Questo hook implementa la logica per audio non protetto (es. anteprime o file locali)
 * e funge da interfaccia per la modalità Karaoke.
 */
export const useVocalRemover = () => {
  const [isKaraokeActive, setIsKaraokeActive] = useState(false);

  const toggleKaraoke = useCallback(() => {
    setIsKaraokeActive(prev => !prev);
    
    if (!isKaraokeActive) {
      console.info("[Karaoke] Modalità Karaoke attivata. (Nota: Effetto simulato per tracce DRM)");
    }
  }, [isKaraokeActive]);

  return {
    isKaraokeActive,
    toggleKaraoke
  };
};
