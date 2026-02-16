import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Wifi, WifiOff, Music, AlertCircle, CheckCircle } from "lucide-react";
import { useSpotifyContext } from "@/contexts/SpotifyContext";
import { useUserProfile } from "@/hooks/useSpotify";
import { getToken, clearToken, redirectToSpotifyAuth } from "@/services/spotify-auth";

export const SpotifyStatus = () => {
  const { isReady, deviceId } = useSpotifyContext();
  const { data: profile, isLoading, error } = useUserProfile();
  const [showStatus, setShowStatus] = useState(true);
  const token = getToken();

  useEffect(() => {
    if (isReady && profile && !error) {
      const timer = setTimeout(() => setShowStatus(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isReady, profile, error]);

  if (!showStatus && isReady && profile) return null;

  const handleReconnect = () => {
    clearToken();
    redirectToSpotifyAuth();
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      {isLoading && token && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Connecting to Spotify...
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to connect to Spotify</span>
            <Button size="sm" variant="outline" onClick={handleReconnect}>
              Reconnect
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!error && profile && (
        <Card className="bg-background/95 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {isReady ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">
                    {profile.display_name}
                  </p>
                  {profile.product === "premium" && (
                    <span className="text-xs bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full">
                      Premium
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    {token ? (
                      <>
                        <Wifi className="h-3 w-3 text-green-500" />
                        <span>Connected to Spotify</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-3 w-3 text-red-500" />
                        <span>Not connected</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isReady ? (
                      <>
                        <Music className="h-3 w-3 text-green-500" />
                        <span>Web Player ready</span>
                      </>
                    ) : (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Initializing player...</span>
                      </>
                    )}
                  </div>

                  {deviceId && (
                    <div className="text-xs text-muted-foreground truncate">
                      Device ID: {deviceId.substring(0, 16)}...
                    </div>
                  )}
                </div>

                {profile.product !== "premium" && (
                  <Alert className="mt-2">
                    <AlertCircle className="h-3 w-3" />
                    <AlertDescription className="text-xs">
                      Spotify Premium required for playback
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowStatus(false)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
