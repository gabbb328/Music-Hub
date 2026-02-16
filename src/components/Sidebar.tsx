import { motion } from "framer-motion";
import { Home, Search, Library, Radio, Mic2, BarChart3, Headphones, Sparkles, Heart, Clock, ListMusic, Music } from "lucide-react";
import { useUserPlaylists } from "@/hooks/useSpotify";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const mainNav = [
  { id: "home", label: "Home", icon: Home },
  { id: "search", label: "Search", icon: Search },
  { id: "library", label: "Library", icon: Library },
];

const features = [
  { id: "ai-dj", label: "AI DJ", icon: Sparkles },
  { id: "radio", label: "Radio", icon: Radio },
  { id: "lyrics", label: "Lyrics", icon: Mic2 },
  { id: "stats", label: "Statistics", icon: BarChart3 },
  { id: "devices", label: "Devices", icon: Headphones },
];

const libraryItems = [
  { id: "liked", label: "Liked Songs", icon: Heart },
  { id: "recent", label: "Recently Played", icon: Clock },
  { id: "queue", label: "Queue", icon: ListMusic },
];

export default function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const { data: playlistsData, isLoading } = useUserPlaylists();
  const playlists = playlistsData?.items || [];

  return (
    <aside className="w-64 h-full flex flex-col bg-sidebar border-r border-sidebar-border shrink-0">
      <div className="px-6 py-5 flex-shrink-0">
        <h1 className="text-xl font-bold tracking-tight">
          <span className="text-gradient-primary">Music</span>
          <span className="text-foreground">Hub</span>
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <nav className="px-3 space-y-1">
          {mainNav.map((item) => (
            <NavItem
              key={item.id}
              {...item}
              isActive={activeSection === item.id}
              onClick={() => onSectionChange(item.id)}
            />
          ))}
        </nav>

        <div className="px-3 mt-6">
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
            Features
          </p>
          {features.map((item) => (
            <NavItem
              key={item.id}
              {...item}
              isActive={activeSection === item.id}
              onClick={() => onSectionChange(item.id)}
            />
          ))}
        </div>

        <div className="px-3 mt-6">
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
            Your Music
          </p>
          {libraryItems.map((item) => (
            <NavItem
              key={item.id}
              {...item}
              isActive={activeSection === item.id}
              onClick={() => onSectionChange(item.id)}
            />
          ))}
        </div>

        <div className="px-3 mt-6 pb-4">
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
            Your Playlists
          </p>
          <div className="space-y-0.5">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 animate-pulse">
                  <div className="w-8 h-8 rounded bg-muted" />
                  <div className="h-4 bg-muted rounded flex-1" />
                </div>
              ))
            ) : playlists.length === 0 ? (
              <div className="px-3 py-4 text-xs text-muted-foreground text-center">
                <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No playlists</p>
                <p>Create on Spotify!</p>
              </div>
            ) : (
              playlists.map((pl: any) => (
                <button
                  key={pl.id}
                  onClick={() => onSectionChange(`playlist-${pl.id}`)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors duration-200"
                >
                  {pl.images && pl.images[0]?.url ? (
                    <img 
                      src={pl.images[0].url} 
                      alt="" 
                      className="w-8 h-8 rounded object-cover flex-shrink-0" 
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <Music className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <span className="truncate">{pl.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavItem({
  label,
  icon: Icon,
  isActive,
  onClick,
}: {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
        isActive
          ? "text-foreground bg-secondary"
          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
      }`}
    >
      {isActive && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary"
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}
      <Icon className="w-5 h-5 shrink-0" />
      <span>{label}</span>
    </button>
  );
}
