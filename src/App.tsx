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
const PublicRouteGuard = ({ children }: { children: React.ReactNode }) => {
  const { isUpdateActive, targetVersion } = useVersionUpdate();
  if (isUpdateActive) {
    return <VersionUpdatePage targetVersion={targetVersion} />;
  }
  return <>{children}</>;
};

// App Router with Deep Linking
const AppRouter = () => {
  useDeepLinking();

  return (
    <Routes>
      {/* ── Admin — route separata, non visibile nel sito ─────────────────── */}
      <Route path="/admin" element={<AdminPage />} />

      {/* ── App principale (protetta da guardia aggiornamento) ─────────────── */}
      <Route path="/login" element={<PublicRouteGuard><SpotifyLogin /></PublicRouteGuard>} />
      <Route path="/callback" element={<PublicRouteGuard><SpotifyCallback /></PublicRouteGuard>} />
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
