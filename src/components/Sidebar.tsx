import { motion } from "framer-motion";
import {
  Home, Search, Library, Radio, Mic2, BarChart3, Headphones,
  Sparkles, Heart, Clock, ListMusic, Music, ScanSearch, Layers,
  SlidersHorizontal, Info, Music2, Settings2
} from "lucide-react";
import { useUserPlaylists } from "@/hooks/useSpotify";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const mainNav = [
  { id: "home",   label: "Home",    icon: Home   },
  { id: "search", label: "Cerca",   icon: Search },
  { id: "library",label: "Libreria",icon: Library},
];

const features = [
  { id: "ai-dj",          label: "AI DJ",          icon: Sparkles          },
  { id: "neural-mixer",   label: "Neural Mixer",   icon: Layers            },
  { id: "radio",          label: "Radio",           icon: Radio             },
  { id: "lyrics",         label: "Testi",           icon: Mic2              },
  { id: "recognize",      label: "Riconosci",       icon: ScanSearch        },
  { id: "equalizer",      label: "Equalizzatore",   icon: SlidersHorizontal },
  { id: "stats",          label: "Statistiche",     icon: BarChart3         },
  { id: "devices",        label: "Dispositivi",     icon: Headphones        },
  { id: "samsung-buds",   label: "Galaxy Buds",     icon: Music2            },
  { id: "audio-settings", label: "Audio",           icon: Settings2         },
];

const libraryItems = [
  { id: "liked",  label: "Preferiti", icon: Heart     },
  { id: "recent", label: "Recenti",   icon: Clock     },
  { id: "queue",  label: "Coda",      icon: ListMusic },
];

const appItems = [
  { id: "about",  label: "Chi siamo", icon: Info },
];

export default function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const { data: playlistsData, isLoading } = useUserPlaylists();
  const playlists = playlistsData?.items || [];

  return (
    <aside className="hidden md:flex w-64 h-full flex-col bg-sidebar border-r border-sidebar-border shrink-0">
      <div className="px-6 py-5 shrink-0">
        <h1 className="text-xl font-bold tracking-tight">
          <span className="text-gradient-primary">Harmony</span>
          <span className="text-foreground"> Hub</span>
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <nav className="px-3 space-y-0.5">
          {mainNav.map(item => <NavItem key={item.id} {...item} isActive={activeSection === item.id} onClick={() => onSectionChange(item.id)} />)}
        </nav>

        <div className="px-3 mt-5">
          <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Funzionalità</p>
          {features.map(item => <NavItem key={item.id} {...item} isActive={activeSection === item.id} onClick={() => onSectionChange(item.id)} />)}
        </div>

        <div className="px-3 mt-5">
          <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">La tua musica</p>
          {libraryItems.map(item => <NavItem key={item.id} {...item} isActive={activeSection === item.id} onClick={() => onSectionChange(item.id)} />)}
        </div>

        <div className="px-3 mt-5">
          <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">App</p>
          {appItems.map(item => <NavItem key={item.id} {...item} isActive={activeSection === item.id} onClick={() => onSectionChange(item.id)} />)}
        </div>

        <div className="px-3 mt-5 pb-4">
          <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Playlist</p>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 animate-pulse">
                <div className="w-8 h-8 rounded bg-muted" />
                <div className="h-3 bg-muted rounded flex-1" />
              </div>
            ))
          ) : playlists.length === 0 ? (
            <div className="px-3 py-4 text-xs text-muted-foreground text-center opacity-60">
              <Music className="w-7 h-7 mx-auto mb-2 opacity-40" />
              <p>Nessuna playlist</p>
            </div>
          ) : (
            playlists.map((pl: any) => (
              <button key={pl.id} onClick={() => onSectionChange(`playlist-${pl.id}`)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors">
                {pl.images?.[0]?.url
                  ? <img src={pl.images[0].url} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                  : <div className="w-8 h-8 rounded bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shrink-0"><Music className="w-4 h-4 text-white" /></div>
                }
                <span className="truncate">{pl.name}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}

const NAV_SPRING = { type: "spring", stiffness: 380, damping: 32, mass: 0.7 };

function NavItem({ label, icon: Icon, isActive, onClick }: {
  id: string; label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean; onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
        isActive ? "text-foreground" : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
      }`}
      style={{ transition: "color 160ms cubic-bezier(0.16,1,0.3,1)" }}
    >
      {/* Background pill */}
      {isActive && (
        <motion.div
          layoutId="sidebar-active-bg"
          className="absolute inset-0 rounded-lg bg-secondary"
          transition={NAV_SPRING}
        />
      )}
      {/* Indicatore laterale */}
      {isActive && (
        <motion.div
          layoutId="sidebar-active-bar"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary"
          transition={NAV_SPRING}
        />
      )}
      <motion.div
        className="relative z-10 shrink-0"
        animate={{ scale: isActive ? 1.05 : 1 }}
        transition={NAV_SPRING}
      >
        <Icon className="w-4 h-4" />
      </motion.div>
      <span className="relative z-10">{label}</span>
    </motion.button>
  );
}
