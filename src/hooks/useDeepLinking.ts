import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useDeepLinking = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Gestisce deep link quando l'app viene aperta da URL esterno
    const setupDeepLinking = async () => {
      try {
        // Import dinamico - funziona solo se @capacitor/app è installato
        const { App } = await import('@capacitor/app');
        
        // Listener per URL ricevuti mentre l'app è già aperta
        App.addListener('appUrlOpen', (event) => {
          console.log('Deep link received:', event.url);
          
          const url = new URL(event.url);
          const pathname = url.pathname || url.host; // host per scheme custom
          
          // Esempio: com.musichub.app://callback?code=xxx
          if (pathname.includes('callback')) {
            // Chiude il browser di Capacitor per far rivedere l'app sotto
            import('@capacitor/browser').then(({ Browser }) => {
              Browser.close().catch(console.error);
            }).catch(console.error);

            const params = new URLSearchParams(url.search || url.hash.substring(1));
            navigate(`/callback${url.search || url.hash}`);
          }
        });

        // Controlla se l'app è stata aperta tramite URL
        const result = await App.getLaunchUrl();
        if (result?.url) {
          console.log('App launched with URL:', result.url);
          const url = new URL(result.url);
          const pathname = url.pathname || url.host;
          
          if (pathname.includes('callback')) {
            // Chiude il browser anche in caso di cold start, per sicurezza
            import('@capacitor/browser').then(({ Browser }) => {
              Browser.close().catch(console.error);
            }).catch(console.error);

            navigate(`/callback${url.search || url.hash}`);
          }
        }
      } catch (error) {
        // @capacitor/app non disponibile - modalità browser
        console.log('Deep linking not available (browser mode)');
      }
    };

    setupDeepLinking();

    return () => {
      // Cleanup - importa dinamicamente per evitare errori se non disponibile
      import('@capacitor/app').then(({ App }) => {
        App.removeAllListeners();
      }).catch(() => {});
    };
  }, [navigate]);
};
