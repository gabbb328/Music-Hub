import { useState, useCallback, useEffect } from "react";

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
