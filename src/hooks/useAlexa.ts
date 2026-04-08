import { useState, useEffect } from 'react';

/**
 * Hook to detect if the application is running on an Alexa device (Echo Show)
 */
export const useAlexa = () => {
  const [isAlexa, setIsAlexa] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    // Common Alexa User Agent strings or fragments
    const isAlexaUA = ua.includes('alexa') || ua.includes('echo') || ua.includes('amazonwebapps');
    // Also check for Alexa.Presentation.HTML interface specifically if possible
    // but UA is more reliable for simple performance switching
    setIsAlexa(isAlexaUA);
    
    if (isAlexaUA) {
      console.log('Alexa device detected. Enabling light mode.');
      document.body.classList.add('alexa-mode');
    }
  }, []);

  return isAlexa;
};
