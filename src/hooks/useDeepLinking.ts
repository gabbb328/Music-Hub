import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useDeepLinking = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const setupDeepLinking = async () => {
      try {
        const { App } = await import('@capacitor/app');
        
        App.addListener('appUrlOpen', (event) => {
          console.log('Deep link received:', event.url);
          
          const url = new URL(event.url);
          const pathname = url.pathname || url.host;
          
          if (pathname.includes('callback')) {
            import('@capacitor/browser').then(({ Browser }) => {
              Browser.close().catch(console.error);
            }).catch(console.error);

            const params = new URLSearchParams(url.search || url.hash.substring(1));
            navigate(`/callback${url.search || url.hash}`);
          }
        });

        const result = await App.getLaunchUrl();
        if (result?.url) {
          console.log('App launched with URL:', result.url);
          const url = new URL(result.url);
          const pathname = url.pathname || url.host;
          
          if (pathname.includes('callback')) {
            import('@capacitor/browser').then(({ Browser }) => {
              Browser.close().catch(console.error);
            }).catch(console.error);

            navigate(`/callback${url.search || url.hash}`);
          }
        }
      } catch (error) {
        console.log('Deep linking not available (browser mode)');
      }
    };

    setupDeepLinking();

    return () => {
      import('@capacitor/app').then(({ App }) => {
        App.removeAllListeners();
      }).catch(() => {});
    };
  }, [navigate]);
};
