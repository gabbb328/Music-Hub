import { useState, useEffect } from 'react';

/**
 * Hook che detecta Alexa/Echo Show dal User Agent e inizializza l'SDK Alexa.
 */
export const useAlexa = (): boolean => {
  const [isAlexa] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    
    // 1. Priorità assoluta al parametro URL (passato dalla Skill Alexa)
    const params = new URLSearchParams(window.location.search);
    if (params.get('env') === 'alexa') return true;

    // 2. Backup via User Agent
    const ua = window.navigator.userAgent.toLowerCase();
    return ua.includes('alexa') || 
           ua.includes('echo') || 
           ua.includes('aeo') || // Prefisso modelli Echo Show
           ua.includes('amazonwebapps') ||
           ua.includes('silk/');
  });

  useEffect(() => {
    if (isAlexa) {
      document.body.classList.add('alexa-mode');
      console.log('[Alexa] device detected');

      // Comunicazione con l'SDK Alexa per segnalare che la pagina è pronta
      // @ts-ignore
      if (window.Alexa && window.Alexa.performance) {
        try {
          // @ts-ignore
          window.Alexa.performance.mark('pageReady');
          console.log('[Alexa] pageReady signal sent');
        } catch (e) {
          console.error('[Alexa] Failed to send pageReady signal:', e);
        }
      }
    }
    return () => {
      document.body.classList.remove('alexa-mode');
    };
  }, [isAlexa]);

  return isAlexa;
};
