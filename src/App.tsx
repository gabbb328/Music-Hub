import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
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

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = getToken();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public Route Guard (blocks app during version update mode)
// i dev con harmony_dev_mode=true bypassano sempre la schermata di aggiornamento
const PublicRouteGuard = ({ children }: { children: React.ReactNode }) => {
  const { isUpdateActive, targetVersion } = useVersionUpdate();
  const isDevMode = localStorage.getItem("harmony_dev_mode") === "true";
  if (isUpdateActive && !isDevMode) {
    return <VersionUpdatePage targetVersion={targetVersion} />;
  }
  return <>{children}</>;
};

// Dev Route Guard — portale di login per sviluppatori
// Dopo un login riuscito imposta harmony_dev_mode e ridirige a / (l'app normale senza blocco aggiornamento)
const DevRouteGuard = () => {
  const [status, setStatus] = useState<"idle" | "checking" | "ok" | "denied">(() => {
    // Dev già confermato in sessione precedente → vai subito all'app
    if (localStorage.getItem("harmony_dev_mode") === "true") return "ok";
    // Appena tornato dal callback Spotify
    if (localStorage.getItem("pending_dev_check") === "true" && getToken()) return "checking";
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

        const me = users.find(
          (u: any) =>
            u.name.toLowerCase() === (profile?.display_name ?? "").toLowerCase() &&
            u.id !== "system_settings"
        );

        if (me?.isDev) {
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

  // Login ok → ridirige alla home normale (che ora non è bloccata grazie al flag in PublicRouteGuard)
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

  // "idle" o "denied" → mostra pagina di login dedicata (con eventuale messaggio di errore)
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
        <Sonner />
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
