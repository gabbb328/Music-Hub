import { Home, Search, Library, Layers, MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";

interface MobileNavProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onOpenSettings: () => void;
}

const navItems = [
  { id: "home",         label: "Home",    icon: Home },
  { id: "search",       label: "Search",  icon: Search },
  { id: "library",      label: "Library", icon: Library },
  { id: "neural-mixer", label: "Mixer",   icon: Layers },
  { id: "more",         label: "More",    icon: MoreHorizontal },
];

export default function MobileNav({ activeSection, onSectionChange }: MobileNavProps) {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex justify-around items-center h-14 px-1">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className="relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-[10px] font-medium min-w-0"
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-active"
                  className="absolute inset-1 bg-primary/10 rounded-xl -z-10"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <Icon className={`w-5 h-5 transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`transition-colors leading-none ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
