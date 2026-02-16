import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { SpotifyProvider } from "@/contexts/SpotifyContext";
import { useLyricsPreloader } from "@/hooks/useLyricsPreloader";
import Sidebar from "@/components/Sidebar";
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
import { SpotifyStatus } from "@/components/SpotifyStatus";
import { usePlayerStore } from "@/hooks/usePlayerStore";

const Index = () => {
  const player = usePlayerStore();
  const [activeSection, setActiveSection] = useState("home");
  const [showNowPlaying, setShowNowPlaying] = useState(false);
  
  useLyricsPreloader();

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
      case "search":
        return <SearchContent onPlayTrack={player.playTrack} />;
      case "library":
        return <LibraryContent onPlayTrack={player.playTrack} onOpenPlaylist={handleOpenPlaylist} />;
      case "ai-dj":
        return <AIDJContent onPlayTrack={player.playTrack} />;
      case "lyrics":
        return <LyricsContent currentTrack={player.currentTrack} />;
      case "stats":
        return <StatsContent />;
      case "devices":
        return <DevicesContent />;
      case "queue":
        return <QueueContent queue={player.queue} currentTrack={player.currentTrack} onPlayTrack={player.playTrack} />;
      case "radio":
        return <RadioContent />;
      case "liked":
        return <LikedSongsContent />;
      case "recent":
        return <RecentlyPlayedContent />;
      default:
        return <HomeContent onPlayTrack={player.playTrack} />;
    }
  };

  return (
    <SpotifyProvider>
      <div className="flex flex-col h-screen overflow-hidden bg-background">
        <SpotifyStatus />
        <div className="flex flex-1 min-h-0">
          <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
          <main className="flex-1 flex flex-col min-w-0">
            {renderContent()}
          </main>
        </div>
        <PlayerBar 
          {...player} 
          onExpandClick={() => setShowNowPlaying(true)}
          onNavigate={setActiveSection}
        />

        <AnimatePresence>
          {showNowPlaying && player.currentTrack && (
            <NowPlayingView {...player} onClose={() => setShowNowPlaying(false)} />
          )}
        </AnimatePresence>
      </div>
    </SpotifyProvider>
  );
};

export default Index;
