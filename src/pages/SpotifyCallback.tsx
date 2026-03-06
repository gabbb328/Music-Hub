import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { handleSpotifyCallback } from "@/services/spotify-auth";

export default function SpotifyCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const processed = useRef(false);

  useEffect(() => {
    // Prevent double execution
    if (processed.current) return;

    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Wait until search parameters are available (in case of delayed hydration/render)
    if (!code && !error) return;

    // Mark as processed immediately so next renders ignore this effect
    processed.current = true;

    const processCallback = async () => {
      try {
        if (error) {
          console.error('Spotify auth error:', error);
          navigate('/login');
          return;
        }

        await handleSpotifyCallback(code as string);
        navigate('/');
      } catch (error) {
        console.error('Callback processing error:', error);
        navigate('/login');
      }
    };

    processCallback();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
        <p className="text-muted-foreground">Completing login...</p>
      </div>
    </div>
  );
}
