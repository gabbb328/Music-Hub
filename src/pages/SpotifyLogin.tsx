import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthUrl, getToken, removeToken } from "@/services/spotify-auth";
import { Music, LogOut, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SpotifyLogin = () => {
  const navigate = useNavigate();
  const token = getToken();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const authUrl = await getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    removeToken();
    navigate("/");
  };

  if (token) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500">
              <Music className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Already Connected</CardTitle>
            <CardDescription>
              You're already connected to Spotify
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => navigate("/")} 
              className="w-full"
              size="lg"
            >
              Go to App
            </Button>
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              className="w-full"
              size="lg"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500">
            <Music className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Connect to Spotify</CardTitle>
          <CardDescription>
            Login with your Spotify account to start using Harmony Hub
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleLogin} 
            className="w-full bg-green-500 hover:bg-green-600"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Music className="mr-2 h-5 w-5" />
                Login with Spotify
              </>
            )}
          </Button>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            By logging in, you agree to allow Harmony Hub to access your Spotify account
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SpotifyLogin;
