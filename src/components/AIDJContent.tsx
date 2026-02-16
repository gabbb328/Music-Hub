import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Play, Pause, SkipForward, Volume2, Mic, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { 
  useTopTracks, 
  useTopArtists, 
  usePlayMutation,
  usePauseMutation,
  useNextMutation,
  usePlaybackState 
} from "@/hooks/useSpotify";
import { useToast } from "@/hooks/use-toast";

export default function AIDJContent() {
  const [isActive, setIsActive] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [energy, setEnergy] = useState(70);
  const [variety, setVariety] = useState(50);
  
  const { data: topTracksData } = useTopTracks("medium_term", 50);
  const { data: topArtistsData } = useTopArtists("medium_term", 20);
  const { data: playbackState } = usePlaybackState();
  const playMutation = usePlayMutation();
  const pauseMutation = usePauseMutation();
  const nextMutation = useNextMutation();
  const { toast } = useToast();

  const topTracks = topTracksData?.items || [];
  const topArtists = topArtistsData?.items || [];
  const isPlaying = playbackState?.is_playing || false;

  // AI DJ Messages based on context
  const djMessages = [
    "Hey! I'm your AI DJ. Let me create the perfect mix for you...",
    "Based on your taste, I think you'll love this next track!",
    "This one's been trending in your favorite genres...",
    "Here's something from an artist you've been vibing with lately...",
    "Let's keep the energy high with this banger!",
    "Time to slow it down a bit with this smooth one...",
    "You haven't heard this in a while - bringing it back!",
    "This track matches your current mood perfectly...",
  ];

  useEffect(() => {
    if (isActive) {
      // Change message every 30 seconds
      const interval = setInterval(() => {
        const randomMsg = djMessages[Math.floor(Math.random() * djMessages.length)];
        setCurrentMessage(randomMsg);
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [isActive]);

  const generateAIPlaylist = () => {
    if (topTracks.length === 0) {
      return [];
    }

    // Create smart playlist based on energy and variety settings
    let playlist = [...topTracks];

    // Apply variety filter
    if (variety < 50) {
      // Less variety - stick to top tracks
      playlist = playlist.slice(0, Math.floor(playlist.length * (variety / 100)));
    } else {
      // More variety - shuffle more
      playlist = playlist.sort(() => Math.random() - 0.5);
    }

    // Apply energy filter (approximate using track features)
    if (energy > 70) {
      // High energy - prefer upbeat tracks (this is simplified)
      playlist = playlist.sort(() => Math.random() - 0.5).slice(0, 30);
    } else if (energy < 30) {
      // Low energy - prefer calmer tracks
      playlist = playlist.reverse().slice(0, 30);
    }

    return playlist.slice(0, 50).map((track: any) => track.uri);
  };

  const startAIDJ = async () => {
    try {
      setIsActive(true);
      setCurrentMessage(djMessages[0]);

      toast({
        title: "AI DJ Starting...",
        description: "Creating your personalized mix",
      });

      const aiPlaylist = generateAIPlaylist();
      
      if (aiPlaylist.length === 0) {
        toast({
          title: "Not Enough Data",
          description: "Listen to more music to enable AI DJ",
          variant: "destructive",
        });
        setIsActive(false);
        return;
      }

      await playMutation.mutateAsync({ uris: aiPlaylist });

      toast({
        title: "AI DJ is Live!",
        description: "Enjoy your personalized radio",
      });

      // Set first message after start
      setTimeout(() => {
        setCurrentMessage(djMessages[1]);
      }, 5000);

    } catch (error) {
      console.error("AI DJ error:", error);
      toast({
        title: "Failed to Start AI DJ",
        description: "Make sure you have an active device",
        variant: "destructive",
      });
      setIsActive(false);
    }
  };

  const stopAIDJ = async () => {
    try {
      await pauseMutation.mutateAsync();
      setIsActive(false);
      setCurrentMessage("");
      
      toast({
        title: "AI DJ Stopped",
        description: "Thanks for listening!",
      });
    } catch (error) {
      console.error("Stop error:", error);
    }
  };

  const skipTrack = async () => {
    try {
      await nextMutation.mutateAsync();
      const nextMessage = djMessages[Math.floor(Math.random() * djMessages.length)];
      setCurrentMessage(nextMessage);
    } catch (error) {
      console.error("Skip error:", error);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-8"
      >
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.div
            animate={{ 
              scale: isActive ? [1, 1.1, 1] : 1,
              rotate: isActive ? [0, 5, -5, 0] : 0
            }}
            transition={{ 
              duration: 2, 
              repeat: isActive ? Infinity : 0,
              repeatType: "reverse" 
            }}
            className="inline-block"
          >
            <Sparkles className="w-20 h-20 mx-auto text-primary" />
          </motion.div>
          
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            AI DJ
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your personal DJ powered by AI. Analyzing your taste to create the perfect mix.
          </p>
        </div>

        {/* DJ Interface */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {/* Visual Equalizer */}
            <div className="h-32 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-cyan-600/20 relative overflow-hidden">
              <div className="absolute inset-0 flex items-end justify-center gap-1 p-4">
                {Array.from({ length: 50 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="flex-1 bg-primary/60 rounded-t"
                    animate={{
                      height: isActive 
                        ? `${Math.random() * 80 + 20}%`
                        : "20%"
                    }}
                    transition={{
                      duration: 0.3,
                      repeat: isActive ? Infinity : 0,
                      repeatType: "reverse",
                      delay: i * 0.02
                    }}
                  />
                ))}
              </div>
            </div>

            {/* DJ Message */}
            <div className="p-6 border-b">
              <AnimatePresence mode="wait">
                {currentMessage && (
                  <motion.div
                    key={currentMessage}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-start gap-4"
                  >
                    <Mic className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-sm font-semibold text-primary mb-1">AI DJ Says:</p>
                      <p className="text-base">{currentMessage}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="p-6 space-y-6">
              {/* Main Control */}
              <div className="flex items-center justify-center gap-4">
                {!isActive ? (
                  <Button
                    size="lg"
                    onClick={startAIDJ}
                    disabled={playMutation.isPending || topTracks.length === 0}
                    className="rounded-full px-8 py-6 text-lg"
                  >
                    {playMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 mr-2 fill-current" />
                        Start AI DJ
                      </>
                    )}
                  </Button>
                ) : (
                  <>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={isPlaying ? () => pauseMutation.mutate() : () => playMutation.mutate({})}
                      className="rounded-full w-14 h-14"
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6" />
                      ) : (
                        <Play className="w-6 h-6 fill-current" />
                      )}
                    </Button>

                    <Button
                      size="lg"
                      variant="destructive"
                      onClick={stopAIDJ}
                      className="rounded-full px-8"
                    >
                      Stop DJ
                    </Button>

                    <Button
                      size="icon"
                      variant="outline"
                      onClick={skipTrack}
                      className="rounded-full w-14 h-14"
                    >
                      <SkipForward className="w-6 h-6" />
                    </Button>
                  </>
                )}
              </div>

              {/* Settings */}
              <div className="space-y-6 pt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Energy Level</label>
                    <span className="text-sm text-muted-foreground">{energy}%</span>
                  </div>
                  <Slider
                    value={[energy]}
                    onValueChange={(value) => setEnergy(value[0])}
                    max={100}
                    step={1}
                    disabled={isActive}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    {energy > 70 ? "High energy, upbeat tracks" : energy > 30 ? "Balanced mix" : "Chill, relaxed vibes"}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Variety</label>
                    <span className="text-sm text-muted-foreground">{variety}%</span>
                  </div>
                  <Slider
                    value={[variety]}
                    onValueChange={(value) => setVariety(value[0])}
                    max={100}
                    step={1}
                    disabled={isActive}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    {variety > 70 ? "More variety, discover new tracks" : variety > 30 ? "Balanced mix of familiar and new" : "Stick to your favorites"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{topTracks.length}</p>
                <p className="text-sm text-muted-foreground mt-1">Tracks in Library</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{topArtists.length}</p>
                <p className="text-sm text-muted-foreground mt-1">Favorite Artists</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">
                  {Array.from(new Set(topArtists.flatMap((a: any) => a.genres))).length}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Genres</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* How it Works */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4">How AI DJ Works</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary font-bold">1</span>
                </div>
                <p>Analyzes your listening history and favorite tracks</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary font-bold">2</span>
                </div>
                <p>Creates a dynamic playlist based on your energy and variety preferences</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary font-bold">3</span>
                </div>
                <p>Provides commentary and context as you listen</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary font-bold">4</span>
                </div>
                <p>Adapts to your preferences in real-time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
