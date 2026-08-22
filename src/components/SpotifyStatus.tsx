import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Wifi, WifiOff, Music, AlertCircle, CheckCircle } from "lucide-react";
import { useSpotifyContext } from "@/contexts/SpotifyContext";
import { useUserProfile } from "@/hooks/useSpotify";
import { useAccountTier } from "@/hooks/useAccountTier";
import { getToken, clearToken, redirectToSpotifyAuth } from "@/services/spotify-auth";
import { getCollabUsers } from "@/services/supabase-api";

export const SpotifyStatus = () => {
  const { isReady, deviceId } = useSpotifyContext();
  const { data: profile, isLoading, error } = useUserProfile();
  const { isPremium, isFree } = useAccountTier();
  const [showStatus, setShowStatus] = useState(true);
  const token = getToken();

  useEffect(() => {
    if (profile?.display_name) {
      getCollabUsers().then((users) => {
        const me = users.find(
          (u) => u.name.toLowerCase() === profile.display_name?.toLowerCase() && u.id !== "system_settings"
        );
        if (me?.isDev) {
          localStorage.setItem("harmony_dev_mode", "true");
        } else {
          localStorage.removeItem("harmony_dev_mode");
        }
      });
    }
  }, [profile?.display_name]);

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
    <div className="fixed top-4 right-4 sm:right-6 z-[200] max-w-xs sm:max-w-sm pointer-events-auto shadow-2xl animate-in fade-in slide-in-from-top-3">
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
                  {isPremium ? (
                    <span className="text-xs bg-amber-500/15 text-amber-400 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-500/30">
                      ✨ Premium
                    </span>
                  ) : (
                    <span className="text-xs bg-muted text-muted-foreground font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border border-border">
                      🔒 Free
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    {token ? (
                      <>
                        <Wifi className="h-3 w-3 text-green-500" />
                        <span>Connesso a Spotify</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-3 w-3 text-red-500" />
                        <span>Non connesso</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isReady ? (
                      <>
                        <Music className="h-3 w-3 text-green-500" />
                        <span>Web Player pronto</span>
                      </>
                    ) : (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Inizializzazione player...</span>
                      </>
                    )}
                  </div>

                  {deviceId && (
                    <div className="text-xs text-muted-foreground truncate">
                      Device ID: {deviceId.substring(0, 16)}...
                    </div>
                  )}
                </div>

                {isFree && (
                  <Alert className="mt-2 py-1.5 px-2 bg-amber-500/10 border-amber-500/20 text-amber-300">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <AlertDescription className="text-[11px] leading-tight">
                      <strong>Account Free:</strong> Ricerche, LyraAI e anteprime 30s attive.
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
