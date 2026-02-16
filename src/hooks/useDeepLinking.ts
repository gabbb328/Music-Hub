import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Deep linking hook - works only in Capacitor build (APK)
// In browser mode, this hook does nothing
export const useDeepLinking = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Only runs in mobile app builds
    // This will be handled by Capacitor when building APK
    console.log('Deep linking hook initialized (browser mode - no action needed)');
    
    // In APK build, you'll need to:
    // 1. Install @capacitor/app: npm install @capacitor/app
    // 2. Uncomment the code below
    // 3. Build APK with: npm run build && npx cap sync
    
    /*
    const setupDeepLinking = async () => {
      try {
        const { App } = await import('@capacitor/app');
        
        App.addListener('appUrlOpen', (event) => {
          console.log('Deep link received:', event.url);
          
          const url = new URL(event.url);
          const pathname = url.pathname;
          const params = url.searchParams || new URLSearchParams(url.hash.substring(1));
          
          if (pathname.includes('callback')) {
            const accessToken = params.get('access_token');
            const error = params.get('error');
            
            if (accessToken) {
              console.log('✓ Access token received via deep link');
              navigate('/callback' + url.hash);
            } else if (error) {
              console.error('Spotify auth error:', error);
              navigate('/login');
            }
          }
        });

        const result = await App.getLaunchUrl();
        if (result?.url) {
          console.log('App launched with URL:', result.url);
          const url = new URL(result.url);
          if (url.pathname.includes('callback')) {
            navigate('/callback' + url.hash);
          }
        }
      } catch (error) {
        console.log('Capacitor not available - running in browser mode');
      }
    };

    setupDeepLinking();
    */

    return () => {
      // Cleanup if needed
    };
  }, [navigate]);
};
