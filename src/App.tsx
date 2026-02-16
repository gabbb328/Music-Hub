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

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = getToken();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

// App Router with Deep Linking
const AppRouter = () => {
  useDeepLinking();

  return (
    <Routes>
      <Route path="/login" element={<SpotifyLogin />} />
      <Route path="/callback" element={<SpotifyCallback />} />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Index />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
