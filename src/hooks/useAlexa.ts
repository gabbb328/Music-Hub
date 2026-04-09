import { useState, useEffect } from 'react';

/**
 * Hook che detecta Alexa/Echo Show dal User Agent.
 * Inizializzato SINCRONO così non causa un secondo render e race condition.
 */
export const useAlexa = (): boolean => {
  // Inizializzazione sincrona — nessun useEffect, nessun secondo render
  const [isAlexa] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent.toLowerCase();
    return ua.includes('alexa') || ua.includes('echo') || ua.includes('amazonwebapps');
  });

  // Applica la classe sul body una volta sola
  useEffect(() => {
    if (isAlexa) {
      document.body.classList.add('alexa-mode');
      console.log('[Alexa] device detected');
    }
    return () => {
      document.body.classList.remove('alexa-mode');
    };
  }, [isAlexa]);

  return isAlexa;
};
