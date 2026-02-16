import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { handleSpotifyCallback } from "@/services/spotify-auth";

export default function SpotifyCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const processCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const error = params.get('error');

        if (error) {
          console.error('Spotify auth error:', error);
          navigate('/login');
          return;
        }

        if (!code) {
          console.error('No code in callback');
          navigate('/login');
          return;
        }

        await handleSpotifyCallback(code);
        navigate('/');
      } catch (error) {
        console.error('Callback processing error:', error);
        navigate('/login');
      }
    };

    processCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
        <p className="text-muted-foreground">Completing login...</p>
      </div>
    </div>
  );
}
