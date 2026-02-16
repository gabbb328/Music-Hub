import { motion } from "framer-motion";
import { Headphones, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { redirectToSpotifyAuth } from "@/services/spotify-auth";

export default function SpotifyLogin() {
  const handleLogin = () => {
    redirectToSpotifyAuth();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="glass-surface border-2 border-primary/20">
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                className="inline-block"
              >
                <Headphones className="w-20 h-20 text-primary mx-auto" />
              </motion.div>
              <h1 className="text-4xl font-bold">
                <span className="text-gradient-primary">Music</span>
                <span className="text-foreground">Hub</span>
              </h1>
              <p className="text-muted-foreground">
                Your personal music experience
              </p>
            </div>

            <div className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogin}
                className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-lg shadow-[#1DB954]/20"
              >
                <ExternalLink className="w-5 h-5" />
                Login with Spotify
              </motion.button>

              <p className="text-xs text-muted-foreground text-center">
                Music Hub uses Spotify to provide you with personalized music experience
              </p>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                By logging in, you agree to Spotify's Terms of Service
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
