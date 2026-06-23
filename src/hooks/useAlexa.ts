import { useState, useEffect } from 'react';

export const useAlexa = (): boolean => {
  const [isAlexa] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    
    const params = new URLSearchParams(window.location.search);
    if (params.get('env') === 'alexa') return true;

    const ua = window.navigator.userAgent.toLowerCase();
    return ua.includes('alexa') || 
           ua.includes('echo') || 
           ua.includes('aeo') ||
           ua.includes('amazonwebapps') ||
           ua.includes('silk/');
  });

  useEffect(() => {
    if (isAlexa) {
      document.body.classList.add('alexa-mode');
      console.log('[Alexa] device detected');

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
