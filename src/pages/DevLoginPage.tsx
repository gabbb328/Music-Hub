import { Zap, ExternalLink, AlertTriangle } from "lucide-react";
import { redirectToSpotifyAuth } from "@/services/spotify-auth";

interface Props {
  denied?: boolean;
  onRetry?: () => void;
}

export default function DevLoginPage({ denied = false, onRetry }: Props) {
  const handleLogin = () => {
    localStorage.setItem("return_path", "/dev");
    localStorage.setItem("pending_dev_check", "true");
    redirectToSpotifyAuth();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900/40 via-background to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="glass-surface border-2 border-blue-500/30 rounded-2xl">
          <div className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                <Zap className="w-8 h-8 text-blue-400" />
              </div>
              <h1 className="text-3xl font-bold">
                <span className="text-blue-400">Dev</span> Access
              </h1>
              <p className="text-muted-foreground text-sm">
                Accedi con un account autorizzato per bypassare gli aggiornamenti
              </p>
            </div>

            {denied && (
              <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-400">Accesso negato</p>
                  <p className="text-xs text-muted-foreground">
                    Questo account non è autorizzato come sviluppatore.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                onClick={handleLogin}
                className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-lg shadow-[#1DB954]/20"
              >
                <ExternalLink className="w-5 h-5" />
                {denied ? "Prova con un altro account" : "Login con Spotify"}
              </button>

              {denied && onRetry && (
                <button
                  onClick={onRetry}
                  className="w-full text-sm text-muted-foreground hover:text-foreground py-2 transition-colors"
                >
                  ← Torna indietro
                </button>
              )}
            </div>

            <div className="pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground text-center">
                Solo gli account sviluppatore approvati possono accedere a questa area.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
