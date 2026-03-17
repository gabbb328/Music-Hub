import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { SpotifyProvider } from "@/contexts/SpotifyContext";
import { useLyricsPreloader } from "@/hooks/useLyricsPreloader";
import { useDynamicTheme } from "@/hooks/useDynamicTheme";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import PlayerBar from "@/components/PlayerBar";
import HomeContent from "@/components/HomeContent";
import NowPlayingView from "@/components/NowPlayingView";
import SearchContent from "@/components/SearchContent";
import LibraryContent from "@/components/LibraryContent";
import AIDJContent from "@/components/AIDJContent";
import LyricsContent from "@/components/LyricsContent";
import StatsContent from "@/components/StatsContent";
import DevicesContent from "@/components/DevicesContent";
import QueueContent from "@/components/QueueContent";
import RadioContent from "@/components/RadioContent";
import LikedSongsContent from "@/components/LikedSongsContent";
import RecentlyPlayedContent from "@/components/RecentlyPlayedContent";
import PlaylistDetail from "@/components/PlaylistDetail";
import RecognizeContent from "@/components/RecognizeContent";
import SettingsPanel from "@/components/SettingsPanel";
import MoreContent from "@/components/MoreContent";
import { SpotifyStatus } from "@/components/SpotifyStatus";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import NeuralSpaceMixerContent from "@/components/NeuralSpaceMixerContent";
import { useMediaSession } from "@/hooks/useMediaSession";
import { 
  usePlaybackState, 
  usePlayMutation, 
  usePauseMutation,
  useNextMutation,
  usePreviousMutation,
  useSeekMutation
} from "@/hooks/useSpotify";

const Index = () => {
  const player = usePlayerStore();
  const [activeSection, setActiveSection] = useState("home");
  const [showNowPlaying, setShowNowPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  useLyricsPreloader();
  useDynamicTheme();

  // Spotify integration for Media Session
  const { data: playbackState } = usePlaybackState();
  const playMutation = usePlayMutation();
  const pauseMutation = usePauseMutation();
  const nextMutation = useNextMutation();
  const previousMutation = usePreviousMutation();
  const seekMutation = useSeekMutation();

  const spotifyTrack = playbackState?.item;
  const isPlaying = playbackState?.is_playing ?? player.isPlaying;
  
  const currentTrack = spotifyTrack ? {
    id: spotifyTrack.id,
    title: spotifyTrack.name,
    artist: spotifyTrack.artists[0]?.name || "Unknown Artist",
    album: spotifyTrack.album.name,
    cover: spotifyTrack.album.images[0]?.url || "",
    duration: Math.floor(spotifyTrack.duration_ms / 1000),
  } : player.currentTrack;

  const mediaActions = {
    play: () => spotifyTrack ? playMutation.mutate({}) : player.play(),
    pause: () => spotifyTrack ? pauseMutation.mutate() : player.pause(),
    nextTrack: () => spotifyTrack ? nextMutation.mutate() : player.nextTrack(),
    prevTrack: () => spotifyTrack ? previousMutation.mutate() : player.prevTrack(),
    seekTo: (time: number) => {
      if (spotifyTrack) {
        seekMutation.mutate(Math.floor(time * 1000));
      } else {
        // Local seek logic if available, otherwise just update progress
        player.setProgress((time / (currentTrack?.duration || 1)) * 100);
      }
    }
  };

  useMediaSession(currentTrack, isPlaying, mediaActions);

  const handleOpenPlaylist = (playlistId: string) => {
    setActiveSection(`playlist-${playlistId}`);
  };

  const renderContent = () => {
    if (activeSection.startsWith('playlist-')) {
      const playlistId = activeSection.replace('playlist-', '');
      return (
        <PlaylistDetail 
          playlistId={playlistId}
          onBack={() => setActiveSection('library')}
        />
      );
    }

    switch (activeSection) {
      case "search":        return <SearchContent onPlayTrack={player.playTrack} />;
      case "library":       return <LibraryContent onPlayTrack={player.playTrack} onOpenPlaylist={handleOpenPlaylist} />;
      case "ai-dj":         return <AIDJContent />;
      case "lyrics":        return <LyricsContent currentTrack={player.currentTrack} />;
      case "stats":         return <StatsContent />;
      case "devices":       return <DevicesContent />;
      case "queue":         return <QueueContent queue={player.queue} currentTrack={player.currentTrack} onPlayTrack={player.playTrack} />;
      case "radio":         return <RadioContent />;
      case "recognize":     return <RecognizeContent />;
      case "liked":         return <LikedSongsContent />;
      case "recent":        return <RecentlyPlayedContent />;
      case "neural-mixer":  return <NeuralSpaceMixerContent />;
      case "more":          return <MoreContent onSectionChange={setActiveSection} onOpenSettings={() => setShowSettings(true)} />;
      default:              return <HomeContent onPlayTrack={player.playTrack} onOpenSettings={() => setShowSettings(true)} />;
    }
  };

  const handleExpandClick = () => {
    setShowNowPlaying(true);
  };

  const hasTrack = !!player.currentTrack;

  return (
    <SpotifyProvider>
      <div className="flex flex-col h-screen overflow-hidden bg-background">
        <SpotifyStatus />

        {/* Main content — su mobile lascia spazio in fondo per PlayerBar + MobileNav */}
        <div className={`flex flex-1 min-h-0 ${hasTrack ? "pb-[7.5rem]" : "pb-14"} md:pb-0`}>
          <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {renderContent()}
          </main>
        </div>

        {/* PlayerBar: su desktop è in flow normale; su mobile è fixed sopra la navbar */}
        <div className={`
          md:relative md:z-auto md:bottom-auto md:left-auto md:right-auto
          fixed bottom-14 left-0 right-0 z-40
          md:static
        `}
          style={{ paddingBottom: 0 }}
        >
          <PlayerBar 
            {...player} 
            onExpandClick={handleExpandClick}
            onNavigate={setActiveSection}
          />
        </div>

        {/* MobileNav: fixed in basso */}
        <MobileNav 
          activeSection={activeSection} 
          onSectionChange={setActiveSection} 
          onOpenSettings={() => setShowSettings(true)}
        />

        <AnimatePresence>
          {showNowPlaying && (
            <NowPlayingView {...player} onClose={() => setShowNowPlaying(false)} />
          )}
        </AnimatePresence>

        <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
      </div>
    </SpotifyProvider>
  );
};

export default Index;
