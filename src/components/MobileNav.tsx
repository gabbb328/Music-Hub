import { Home, Search, Library, Layers, MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { useSquish } from "@/hooks/useSquish";

interface MobileNavProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onOpenSettings: () => void;
}

const navItems = [
  { id: "home",         label: "Home",    icon: Home          },
  { id: "search",       label: "Search",  icon: Search        },
  { id: "library",      label: "Library", icon: Library       },
  { id: "neural-mixer", label: "Mixer",   icon: Layers        },
  { id: "more",         label: "More",    icon: MoreHorizontal },
];

const NAV_SPRING = { type: "spring", stiffness: 400, damping: 38, mass: 0.7 } as const;

export default function MobileNav({ activeSection, onSectionChange }: MobileNavProps) {
  // Squish: elemento premuto si ingrandisce, adiacenti si rimpiccioliscono
  const squish = useSquish(navItems.length, {
    activeScale:   1.22,
    neighborScale: 0.84,
    farScale:      0.92,
    neighborRadius: 1,
    spring: { stiffness: 460, damping: 28, mass: 0.65 },
  });

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
        background: "hsl(var(--background) / 0.88)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderTop: "1px solid hsl(var(--border) / 0.5)",
      }}
    >
      <div className="flex justify-around items-center h-14 px-1">
        {navItems.map((item, i) => {
          const isActive = activeSection === item.id;
          const Icon = item.icon;
          const squishProps = squish.getProps(i);

          return (
            <motion.button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className="relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 min-w-0 touch-manipulation"
              // Squish gestisce scale + y, ma manteniamo il layoutId pill
              {...squishProps}
            >
              {/* Pill background attivo */}
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-pill"
                  className="absolute inset-x-1.5 inset-y-1.5 rounded-2xl bg-primary/12"
                  transition={NAV_SPRING}
                />
              )}

              {/* Icona — scala aggiuntiva se attiva */}
              <motion.div
                animate={{
                  scale: isActive ? 1.08 : 1,
                  y:     isActive ? -1 : 0,
                }}
                transition={NAV_SPRING}
                className="relative z-10"
              >
                <Icon
                  className="w-5 h-5"
                  style={{ color: isActive ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}
                />
              </motion.div>

              {/* Label */}
              <motion.span
                animate={{
                  opacity: isActive ? 1 : 0.55,
                  scale:   isActive ? 1 : 0.9,
                }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 text-[10px] font-medium leading-none"
                style={{ color: isActive ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}
              >
                {item.label}
              </motion.span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
