import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { getToken } from "@/services/spotify-auth";
import { useDeepLinking } from "@/hooks/useDeepLinking";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SpotifyLogin from "./pages/SpotifyLogin";
import SpotifyCallback from "./pages/SpotifyCallback";
import DevLoginPage from "./pages/DevLoginPage";
import AdminPage from "./pages/AdminPage";
import CollabApprove from "./pages/CollabApprove";

import { useVersionUpdate } from "@/hooks/useVersionUpdate";
import VersionUpdatePage from "@/components/VersionUpdatePage";
import { SpeedInsights } from "@vercel/speed-insights/react";

const queryClient = new QueryClient();

export function checkIsUserDev(profile: any, users: any[]): boolean {
  if (!profile || !Array.isArray(users)) return false;

  const spotifyName = (profile.display_name || "").trim().toLowerCase();
  const spotifyId = (profile.id || "").trim().toLowerCase();
  const spotifyEmail = (profile.email || "").trim().toLowerCase();

  const me = users.find((u: any) => {
    if (u.id === "system_settings") return false;
    const name = (u.name || "").trim().toLowerCase();
    const username = (u.credentials?.username || "").trim().toLowerCase();
    const id = (u.id || "").trim().toLowerCase();

    return (
      (spotifyName && name === spotifyName) ||
      (spotifyId && name === spotifyId) ||
      (spotifyId && id === spotifyId) ||
      (spotifyId && username === spotifyId) ||
      (spotifyName && username === spotifyName) ||
      (spotifyEmail && username === spotifyEmail) ||
      (spotifyEmail && name === spotifyEmail)
    );
  });

  return Boolean(me?.isDev);
}

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = getToken();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public Route Guard (blocks app during version update mode)
// i dev con harmony_dev_mode=true bypassano sempre la schermata di aggiornamento.
// Se un utente è loggato con Spotify ed è contrassegnato come Dev in Supabase, imposta automaticamente harmony_dev_mode.
const PublicRouteGuard = ({ children }: { children: React.ReactNode }) => {
  const { isUpdateActive, targetVersion } = useVersionUpdate();
  const [isDevMode, setIsDevMode] = useState<boolean>(
    () => localStorage.getItem("harmony_dev_mode") === "true"
  );
  const [checkingDev, setCheckingDev] = useState<boolean>(false);

  useEffect(() => {
    if (isUpdateActive && !isDevMode && getToken() && !checkingDev) {
      setCheckingDev(true);
      Promise.all([
        import("@/services/spotify-api").then((m) => m.getUserProfile()),
        import("@/services/supabase-api").then((m) => m.getCollabUsers()),
      ])
        .then(([profile, users]) => {
          if (checkIsUserDev(profile, users)) {
            localStorage.setItem("harmony_dev_mode", "true");
            setIsDevMode(true);
          }
        })
        .catch((err) => {
          console.warn("PublicRouteGuard dev check error:", err);
        })
        .finally(() => {
          setCheckingDev(false);
        });
    }
  }, [isUpdateActive, isDevMode, checkingDev]);

  if (isUpdateActive && !isDevMode && !checkingDev) {
    return <VersionUpdatePage targetVersion={targetVersion} />;
  }
  return <>{children}</>;
};

// Dev Route Guard — portale di login / verifica per sviluppatori
const DevRouteGuard = () => {
  const [status, setStatus] = useState<"idle" | "checking" | "ok" | "denied">(() => {
    // Dev già confermato in sessione precedente → vai subito all'app
    if (localStorage.getItem("harmony_dev_mode") === "true") return "ok";
    // Se l'utente è già loggato o è appena tornato dal callback Spotify → verifica i permessi dev
    if (getToken() || localStorage.getItem("pending_dev_check") === "true") return "checking";
    return "idle";
  });

  useEffect(() => {
    if (status !== "checking") return;

    const verify = async () => {
      try {
        const { getUserProfile } = await import("@/services/spotify-api");
        const { getCollabUsers } = await import("@/services/supabase-api");

        const [profile, users] = await Promise.all([getUserProfile(), getCollabUsers()]);

        localStorage.removeItem("pending_dev_check");

        if (checkIsUserDev(profile, users)) {
          localStorage.setItem("harmony_dev_mode", "true");
          setStatus("ok");
        } else {
          localStorage.removeItem("harmony_dev_mode");
          setStatus("denied");
        }
      } catch (err) {
        console.error("DevRouteGuard verify failed:", err);
        localStorage.removeItem("pending_dev_check");
        setStatus("denied");
      }
    };

    verify();
  }, [status]);

  // Login ok → ridirige alla home normale
  if (status === "ok") {
    return <Navigate to="/" replace />;
  }

  if (status === "checking") {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0f1e", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white", gap: 12 }}>
        <div style={{ width: 32, height: 32, border: "3px solid rgba(56,189,248,0.2)", borderTop: "3px solid #38bdf8", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <p style={{ color: "#94a3b8", fontSize: 14 }}>Verifica permessi dev…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // "idle" o "denied" → mostra pagina di login dedicata
  return <DevLoginPage denied={status === "denied"} onRetry={() => setStatus("idle")} />;
};

// App Router with Deep Linking
const AppRouter = () => {
  useDeepLinking();

  return (
    <Routes>
      {/* ── Admin — route separata, non visibile nel sito ─────────────────── */}
      <Route path="/admin" element={<AdminPage />} />

      {/* ── Accesso Sviluppatore ───────────────────────────────────────────── */}
      <Route path="/dev" element={<DevRouteGuard />} />

      {/* ── App principale (protetta da guardia aggiornamento) ─────────────── */}
      <Route path="/login" element={<SpotifyLogin />} />
      <Route path="/callback" element={<SpotifyCallback />} />
      <Route
        path="/"
        element={
          <PublicRouteGuard>
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          </PublicRouteGuard>
        }
      />
      <Route path="/collab/approve" element={<PublicRouteGuard><CollabApprove /></PublicRouteGuard>} />
      <Route path="*" element={<PublicRouteGuard><NotFound /></PublicRouteGuard>} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <SpeedInsights />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AppRouter />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
