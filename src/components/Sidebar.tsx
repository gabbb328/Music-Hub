import { useState, useRef, useMemo } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  Home,
  Search,
  Library,
  Radio,
  Mic2,
  BarChart3,
  Headphones,
  Sparkles,
  Heart,
  Clock,
  ListMusic,
  Music,
  ScanSearch,
  Layers,
  Info,
  Gamepad2,
  Users,
  ScrollText,
  BookOpen,
  Trophy,
  Glasses,
  Settings2,
  AppWindow,
  ChevronDown,
} from "lucide-react";
import { useUserPlaylists } from "@/hooks/useSpotify";
import { useTheme } from "@/contexts/ThemeContext";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onOpenSettings: () => void;
}

const classicMainNav = [
  { id: "home",    label: "Home",     icon: Home    },
  { id: "search", label: "Cerca",    icon: Search  },
  { id: "library", label: "Libreria", icon: Library },
];

const glassMainNav = [
  { id: "home",       label: "Home",           icon: Home },
  { id: "search",     label: "Cerca",          icon: Search },
  { id: "library",    label: "Libreria",       icon: Library },
  { id: "extensions", label: "Strumenti & App", icon: AppWindow },
];

const classicFeatures = [
  { id: "ai-dj", label: "AI DJ", icon: Sparkles },
  { id: "neural-mixer", label: "Neural Mixer", icon: Layers },
  { id: "radio", label: "Radio", icon: Radio },
  { id: "lyrics", label: "Testi", icon: Mic2 },
  { id: "recognize", label: "Riconosci", icon: ScanSearch },
  { id: "stats", label: "Statistiche", icon: BarChart3 },
  { id: "devices", label: "Dispositivi", icon: Headphones },
  { id: "mood", label: "Mood Gen", icon: Sparkles },
  { id: "mood-calendar", label: "Diario Musicale", icon: BookOpen },
  { id: "listen-along", label: "Listen Along", icon: Users },
];

const classicGames = [
  { id: "games", label: "Music Games", icon: Gamepad2 },
];

const glassMusicSubItems = [
  { id: "lyrics", label: "Testi & Karaoke", icon: Mic2 },
  { id: "devices", label: "Dispositivi Audio", icon: Headphones },
  { id: "ai-dj", label: "AI DJ", icon: Sparkles },
  { id: "neural-mixer", label: "Neural Mixer", icon: Layers },
  { id: "equalizer", label: "Equalizzatore", icon: Settings2 },
  { id: "radio", label: "Radio Hub", icon: Radio },
  { id: "recognize", label: "Riconosci Brano", icon: ScanSearch },
  { id: "stats", label: "Statistiche", icon: BarChart3 },
  { id: "mood", label: "Mood Generator", icon: Sparkles },
  { id: "mood-calendar", label: "Diario Musicale", icon: BookOpen },
  { id: "listen-along", label: "Listen Along", icon: Users },
];

const glassGamesSubItems = [
  { id: "games", label: "Music Games", icon: Gamepad2 },
];

const libraryItems = [
  { id: "liked", label: "Preferiti", icon: Heart },
  { id: "recent", label: "Recenti", icon: Clock },
  { id: "queue", label: "Coda", icon: ListMusic },
];

const appItems = [
  { id: "about", label: "Chi siamo", icon: Info },
  { id: "changelog", label: "Changelog", icon: ScrollText },
];

export default function Sidebar({
  activeSection,
  onSectionChange,
  onOpenSettings,
}: SidebarProps) {
  const { data: playlistsData, isLoading } = useUserPlaylists();
  const playlists = playlistsData?.items || [];
  const { uiStyle } = useTheme();
  const isGlass = uiStyle === "glass";

  const [isExtensionsExpanded, setIsExtensionsExpanded] = useState(true);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const mouseY = useMotionValue(-1000);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!sidebarRef.current) return;
    const rect = sidebarRef.current.getBoundingClientRect();
    mouseY.set(e.clientY - rect.top);
  };

  const handleMouseEnter = () => setIsSidebarHovered(true);
  const handleMouseLeave = () => {
    setIsSidebarHovered(false);
    setHoveredSection(null);
    mouseY.set(-1000);
  };

  const indicatorY = useSpring(mouseY, { stiffness: 400, damping: 40 });
  const indicatorOpacity = useSpring(isSidebarHovered ? 1 : 0, {
    stiffness: 400,
    damping: 40,
  });

  const mainNavItems = isGlass ? glassMainNav : classicMainNav;

  return (
    <aside
      ref={sidebarRef}
      className="hidden md:flex w-64 h-full flex-col bg-sidebar border-r border-sidebar-border shrink-0 relative overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Moving Indicator */}
      <motion.div
        className="absolute left-0 w-[3px] bg-primary rounded-r-full z-50 pointer-events-none"
        style={{
          top: 0,
          height: 24,
          y: indicatorY,
          translateY: "-50%",
          opacity: indicatorOpacity,
          boxShadow: "0 0 10px hsl(var(--primary) / 0.3)",
        }}
      />

      <div className="px-6 py-5 shrink-0">
        <h1 className="text-xl font-bold tracking-tight">
          <span className="text-gradient-primary">Music</span>
          <span className="text-foreground"> Hub</span>
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin overflow-x-hidden">
        <nav
          className="px-3 space-y-0.5"
          onMouseEnter={() => setHoveredSection("nav")}
        >
          {mainNavItems.map((item) => (
            <NavItem
              key={item.id}
              {...item}
              isActive={item.id === "extensions" ? isExtensionsExpanded : activeSection === item.id}
              onClick={() => {
                if (item.id === "extensions") {
                  setIsExtensionsExpanded((prev) => !prev);
                  return;
                }
                onSectionChange(item.id);
              }}
              mouseY={mouseY}
              isSectionHovered={hoveredSection === "nav"}
            />
          ))}
        </nav>

        {/* --- CLASSIC MODE (`!isGlass`): Rimanere tutto come prima --- */}
        {!isGlass && (
          <>
            <div
              className="px-3 mt-5"
              onMouseEnter={() => setHoveredSection("features")}
            >
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                Scoperte & Magia
              </p>
              {classicFeatures.map((item) => (
                <NavItem
                  key={item.id}
                  {...item}
                  isActive={activeSection === item.id}
                  onClick={() => onSectionChange(item.id)}
                  mouseY={mouseY}
                  isSectionHovered={hoveredSection === "features"}
                />
              ))}
            </div>

            <div
              className="px-3 mt-5"
              onMouseEnter={() => setHoveredSection("games")}
            >
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                Giochi
              </p>
              {classicGames.map((item) => (
                <NavItem
                  key={item.id}
                  {...item}
                  isActive={activeSection === item.id || activeSection === "quiz"}
                  onClick={() => onSectionChange(item.id)}
                  mouseY={mouseY}
                  isSectionHovered={hoveredSection === "games"}
                />
              ))}
            </div>
          </>
        )}

        {/* --- GLASS MODE (`isGlass`): Sotto-menu espandibile per Estensioni suddivise in Categorie --- */}
        {isGlass && isExtensionsExpanded && (
          <div className="px-3 mt-4 space-y-4 border-l-2 border-primary/20 ml-5 pl-2 py-1">
            {/* Categoria Musica & AI */}
            <div onMouseEnter={() => setHoveredSection("glass-music")}>
              <p className="px-2 mb-1 text-[9px] font-bold uppercase tracking-wider text-primary/70">
                Musica & AI
              </p>
              <div className="space-y-0.5">
                {glassMusicSubItems.map((item) => (
                  <NavItem
                    key={item.id}
                    {...item}
                    isActive={activeSection === item.id}
                    onClick={() => onSectionChange(item.id)}
                    mouseY={mouseY}
                    isSectionHovered={hoveredSection === "glass-music"}
                  />
                ))}
              </div>
            </div>

            {/* Categoria Giochi */}
            <div onMouseEnter={() => setHoveredSection("glass-games")}>
              <p className="px-2 mb-1 text-[9px] font-bold uppercase tracking-wider text-primary/70">
                Giochi
              </p>
              <div className="space-y-0.5">
                {glassGamesSubItems.map((item) => (
                  <NavItem
                    key={item.id}
                    {...item}
                    isActive={activeSection === item.id || activeSection === "quiz"}
                    onClick={() => onSectionChange(item.id)}
                    mouseY={mouseY}
                    isSectionHovered={hoveredSection === "glass-games"}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div
          className="px-3 mt-5"
          onMouseEnter={() => setHoveredSection("library")}
        >
          <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            La tua musica
          </p>
          {libraryItems.map((item) => (
            <NavItem
              key={item.id}
              {...item}
              isActive={activeSection === item.id}
              onClick={() => onSectionChange(item.id)}
              mouseY={mouseY}
              isSectionHovered={hoveredSection === "library"}
            />
          ))}
        </div>

        <div
          className="px-3 mt-5"
          onMouseEnter={() => setHoveredSection("app")}
        >
          <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            Info App
          </p>
          {appItems.map((item) => (
            <NavItem
              key={item.id}
              {...item}
              isActive={activeSection === item.id}
              onClick={() => onSectionChange(item.id)}
              mouseY={mouseY}
              isSectionHovered={hoveredSection === "app"}
            />
          ))}
        </div>

        <div
          className="px-3 mt-5 pb-16"
          onMouseEnter={() => setHoveredSection("playlists")}
        >
          <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            Playlist
          </p>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2 animate-pulse"
              >
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
              <PlaylistNavItem
                key={pl.id}
                pl={pl}
                isActive={activeSection === `playlist-${pl.id}`}
                onClick={() => onSectionChange(`playlist-${pl.id}`)}
                mouseY={mouseY}
                isSectionHovered={hoveredSection === "playlists"}
              />
            ))
          )}
        </div>
      </div>

      {/* Floating glass settings button positioned floating over the bottom of the sidebar */}
      {isGlass && (
        <div className="absolute bottom-4 right-4 z-[60] pointer-events-none">
          <button
            onClick={onOpenSettings}
            className="pointer-events-auto p-3 rounded-full bg-background/30 backdrop-blur-xl border border-white/20 hover:bg-background/70 transition-all text-muted-foreground hover:text-primary shadow-2xl hover:scale-105 active:scale-95"
            title="Impostazioni"
          >
            <Settings2 className="w-5 h-5" />
          </button>
        </div>
      )}
    </aside>
  );
}

const NAV_TRANSITION = {
  type: "tween" as const,
  duration: 0.22,
  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
};
const FISHEYE_SPRING = {
  type: "spring" as const,
  stiffness: 350,
  damping: 45,
  mass: 0.8,
};

function NavItem({
  label,
  icon: Icon,
  isActive,
  onClick,
  mouseY,
  isSectionHovered,
}: {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  onClick: () => void;
  mouseY: any;
  isSectionHovered: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  const distance = useTransform(mouseY, (val: number) => {
    if (!isSectionHovered || val < 0) return 1000;
    const sidebar = ref.current?.closest("aside");
    if (!sidebar || !ref.current) return 1000;
    const sidebarTop = sidebar.getBoundingClientRect().top;
    const bounds = ref.current.getBoundingClientRect();
    const relativeItemCenter = bounds.top - sidebarTop + bounds.height / 2;
    return val - relativeItemCenter;
  });

  const fisheyeScale = useTransform(distance, [-80, 0, 80], [1, 1.22, 1]);
  const scale = useSpring(fisheyeScale, FISHEYE_SPRING);
  const x = useSpring(
    useTransform(distance, [-80, 0, 80], [0, 6, 0]),
    FISHEYE_SPRING,
  );

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={`relative w-full flex items-center h-10 px-3 rounded-lg text-sm font-medium text-left ${
        isActive
          ? "text-foreground"
          : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
      }`}
    >
      {/* Background pill - NOT SCALING */}
      {isActive && (
        <motion.div
          layoutId="sidebar-active-bg"
          className="absolute inset-0 rounded-lg bg-secondary"
          transition={NAV_TRANSITION}
        />
      )}
      {/* Indicatore laterale - NOT SCALING */}
      {isActive && (
        <motion.div
          layoutId="sidebar-active-bar"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary"
          transition={NAV_TRANSITION}
        />
      )}

      {/* Content that scales and moves (Fisheye) */}
      <motion.div
        style={{ scale, x }}
        className="relative z-10 flex items-center gap-3 w-full origin-left h-full"
      >
        <motion.div
          className="shrink-0"
          animate={{ scale: isActive ? 1.05 : 1 }}
          transition={NAV_TRANSITION}
        >
          <Icon className="w-4 h-4" />
        </motion.div>
        <span className="truncate">{label}</span>
      </motion.div>
    </motion.button>
  );
}

function PlaylistNavItem({
  pl,
  isActive,
  onClick,
  mouseY,
  isSectionHovered,
}: {
  pl: any;
  isActive: boolean;
  onClick: () => void;
  mouseY: any;
  isSectionHovered: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  const distance = useTransform(mouseY, (val: number) => {
    if (!isSectionHovered || val < 0) return 1000;
    const sidebar = ref.current?.closest("aside");
    if (!sidebar || !ref.current) return 1000;
    const sidebarTop = sidebar.getBoundingClientRect().top;
    const bounds = ref.current.getBoundingClientRect();
    const relativeItemCenter = bounds.top - sidebarTop + bounds.height / 2;
    return val - relativeItemCenter;
  });

  const fisheyeScale = useTransform(distance, [-70, 0, 70], [1, 1.15, 1]);
  const scale = useSpring(fisheyeScale, FISHEYE_SPRING);
  const x = useSpring(
    useTransform(distance, [-70, 0, 70], [0, 4, 0]),
    FISHEYE_SPRING,
  );

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={`w-full relative flex items-center h-12 px-3 rounded-md text-sm transition-colors text-left ${
        isActive
          ? "text-sidebar-foreground bg-sidebar-accent/50"
          : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
      }`}
    >
      {/* Content that scales and moves (Fisheye) */}
      <motion.div
        style={{ scale, x }}
        className="flex items-center gap-3 w-full origin-left h-full"
      >
        {pl.images?.[0]?.url ? (
          <img
            src={pl.images[0].url}
            alt=""
            className="w-8 h-8 rounded object-cover shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shrink-0">
            <Music className="w-4 h-4 text-white" />
          </div>
        )}
        <span className="truncate">{pl.name}</span>
      </motion.div>
    </motion.button>
  );
}
