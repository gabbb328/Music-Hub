import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  getTokenFromUrl, 
  getCodeFromUrl,
  exchangeCodeForToken,
  setToken, 
  setRefreshToken,
  setTokenExpiry 
} from "@/services/spotify-auth";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const SpotifyCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for authorization code (PKCE flow)
        const code = getCodeFromUrl();
        
        if (code) {
          // PKCE flow - exchange code for token
          console.log("Using PKCE flow...");
          const tokens = await exchangeCodeForToken(code);
          
          setToken(tokens.access_token);
          if (tokens.refresh_token) {
            setRefreshToken(tokens.refresh_token);
          }
          setTokenExpiry(tokens.expires_in);
          
          // Clean up URL
          window.history.replaceState({}, document.title, "/callback");
          
          navigate("/");
          return;
        }

        // Check for token in hash (Implicit flow - fallback)
        const hash = getTokenFromUrl();
        window.location.hash = "";

        const access_token = hash.access_token;
        const expires_in = hash.expires_in;

        if (access_token) {
          // Implicit flow
          console.log("Using Implicit flow...");
          setToken(access_token);
          setTokenExpiry(expires_in);
          navigate("/");
          return;
        }

        // Check for error
        const urlParams = new URLSearchParams(window.location.search);
        const errorParam = urlParams.get('error');
        
        if (errorParam) {
          setError(`Authentication failed: ${errorParam}`);
          setTimeout(() => navigate("/login"), 3000);
          return;
        }

        // No token or code received
        setError("No authentication data received");
        setTimeout(() => navigate("/login"), 3000);
        
      } catch (err) {
        console.error("Callback error:", err);
        setError(err instanceof Error ? err.message : "Authentication failed");
        setTimeout(() => navigate("/login"), 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
        <div className="max-w-md w-full mx-4">
          <Alert variant="destructive" className="bg-white">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-2">Authentication Error</p>
              <p className="text-sm">{error}</p>
              <p className="text-sm mt-2">Redirecting to login...</p>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
      <div className="text-center">
        <Loader2 className="mx-auto h-16 w-16 animate-spin text-white" />
        <h2 className="mt-4 text-2xl font-bold text-white">Connecting to Spotify...</h2>
        <p className="mt-2 text-white/80">Please wait while we authenticate your account</p>
      </div>
    </div>
  );
};

export default SpotifyCallback;
