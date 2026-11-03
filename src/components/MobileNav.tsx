import { useState, useRef, useCallback } from "react";
import { Home, Search, Library, AppWindow, MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { useDeviceType } from "@/hooks/use-mobile";

interface MobileNavProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onOpenSettings?: () => void;
  className?: string;
  embedded?: boolean;
}

const navItems = [
  { id: "home",       label: "Home",       icon: Home           },
  { id: "search",     label: "Cerca",      icon: Search         },
  { id: "library",    label: "Libreria",   icon: Library        },
  { id: "extensions", label: "Estensioni", icon: AppWindow      },
  { id: "more",       label: "Altro",      icon: MoreHorizontal },
];

const NAV_SPRING = { type: "spring", stiffness: 500, damping: 32, mass: 0.8 } as const;

export default function MobileNav({
  activeSection,
  onSectionChange,
  className = "",
  embedded = false,
}: MobileNavProps) {
  const deviceType = useDeviceType();
  // Il gesto di slide è abilitato esclusivamente per telefono e tablet
  const isPhoneOrTablet = deviceType === "mobile" || deviceType === "tablet";

  const containerRef = useRef<HTMLDivElement>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startPointerRef = useRef<{ x: number; y: number } | null>(null);
  const isDragActiveRef = useRef(false);
  const activeDragIndexRef = useRef<number | null>(null);
  const pointerCapturedRef = useRef(false);
  const lastActivatedRef = useRef<{ id: string; time: number } | null>(null);

  const activateSection = useCallback((id: string) => {
    const now = Date.now();
    if (
      lastActivatedRef.current &&
      lastActivatedRef.current.id === id &&
      now - lastActivatedRef.current.time < 300
    ) {
      return;
    }
    lastActivatedRef.current = { id, time: now };
    onSectionChange(id);
  }, [onSectionChange]);

  const getIndexFromPointer = (clientX: number): number => {
    if (!containerRef.current) return -1;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width <= 0) return -1;
    const x = clientX - rect.left;
    const ratio = Math.max(0, Math.min(0.999, x / rect.width));
    return Math.floor(ratio * navItems.length);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isPhoneOrTablet) return;
    if (e.button !== 0 && e.pointerType === "mouse") return;
    startPointerRef.current = { x: e.clientX, y: e.clientY };
    isDragActiveRef.current = false;
    activeDragIndexRef.current = null;
    pointerCapturedRef.current = false;
    // NON catturiamo il puntatore qui: così i normali tap e click nativi non vengono soppressi
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPhoneOrTablet || !startPointerRef.current) return;
    const dx = Math.abs(e.clientX - startPointerRef.current.x);
    const dy = Math.abs(e.clientY - startPointerRef.current.y);

    // Oltre i 12px di movimento prevalentemente orizzontale, attiva lo slider di trascinamento stile Apple
    if (!isDragActiveRef.current && dx > 12 && dx > dy * 1.2) {
      isDragActiveRef.current = true;
      setIsDragging(true);
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        pointerCapturedRef.current = true;
      } catch {}
    }

    if (isDragActiveRef.current) {
      const idx = getIndexFromPointer(e.clientX);
      if (idx >= 0 && idx < navItems.length && idx !== activeDragIndexRef.current) {
        activeDragIndexRef.current = idx;
        setDraggedIndex(idx);
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          try {
            navigator.vibrate(8);
          } catch {}
        }
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!startPointerRef.current) return;

    if (pointerCapturedRef.current) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      pointerCapturedRef.current = false;
    }

    // Se l'utente ha trascinato lo slider, attiva la sezione dove si è fermato il dito
    if (isDragActiveRef.current && activeDragIndexRef.current !== null) {
      const targetItem = navItems[activeDragIndexRef.current];
      if (targetItem) {
        activateSection(targetItem.id);
      }
    } else if (!isDragActiveRef.current) {
      // Se è stato un semplice tap/rilascio senza trascinamento
      const idx = getIndexFromPointer(e.clientX);
      if (idx >= 0 && idx < navItems.length) {
        activateSection(navItems[idx].id);
      }
    }

    // Breve cooldown per evitare click fantasma se il browser li accoda dopo il drag
    setTimeout(() => {
      isDragActiveRef.current = false;
    }, 60);

    startPointerRef.current = null;
    activeDragIndexRef.current = null;
    setDraggedIndex(null);
    setIsDragging(false);
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    if (pointerCapturedRef.current) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      pointerCapturedRef.current = false;
    }
    startPointerRef.current = null;
    isDragActiveRef.current = false;
    activeDragIndexRef.current = null;
    setDraggedIndex(null);
    setIsDragging(false);
  };

  const handleItemClick = (itemId: string) => {
    // Se c'è stato un trascinamento attivo, non attivare il click del pulsante
    if (isDragActiveRef.current) return;
    activateSection(itemId);
  };

  // Indice attualmente attivo (o in anteprima durante il trascinamento)
  const activeIndex = navItems.findIndex(
    (item) => activeSection === item.id || (item.id === "games" && activeSection === "quiz")
  );
  const effectiveIndex = (isDragging && draggedIndex !== null)
    ? draggedIndex
    : activeIndex;

  const navContent = (
    <nav
      className={`pointer-events-auto relative rounded-full bg-background/85 dark:bg-background/80 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20 overflow-hidden ${
        className || "mx-auto max-w-md w-full"
      }`}
    >
      <div
        ref={containerRef}
        onPointerDown={isPhoneOrTablet ? handlePointerDown : undefined}
        onPointerMove={isPhoneOrTablet ? handlePointerMove : undefined}
        onPointerUp={isPhoneOrTablet ? handlePointerUp : undefined}
        onPointerCancel={isPhoneOrTablet ? handlePointerCancel : undefined}
        className={`flex justify-around items-center h-16 px-1.5 select-none ${
          isPhoneOrTablet ? "touch-none cursor-grab active:cursor-grabbing" : ""
        }`}
      >
        {navItems.map((item, i) => {
          const isActive = effectiveIndex === i;
          const Icon = item.icon;

          return (
            <motion.button
              key={item.id}
              data-section={item.id}
              onClick={() => handleItemClick(item.id)}
              className="relative flex flex-col items-center justify-center flex-1 h-full gap-1 min-w-0 touch-manipulation select-none cursor-pointer"
              whileTap={!isDragging ? { scale: 0.92 } : undefined}
            >
              {/* Indicatore pillola attivo in stile iOS che segue il trascinamento */}
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-pill"
                  className="absolute inset-x-1 inset-y-1.5 rounded-full bg-primary/10 dark:bg-primary/20 shadow-sm"
                  animate={{
                    scale: isDragging ? 1.05 : 1,
                  }}
                  transition={NAV_SPRING}
                />
              )}

              {/* Icona */}
              <motion.div
                animate={{
                  scale: isActive ? (isDragging ? 1.18 : 1.1) : 1,
                  y: isActive ? -1 : 0,
                }}
                transition={NAV_SPRING}
                className="relative z-10"
              >
                <Icon
                  className="w-5 h-5 transition-colors duration-200"
                  style={{
                    color: isActive
                      ? "hsl(var(--primary))"
                      : "hsl(var(--muted-foreground))",
                  }}
                />
              </motion.div>

              {/* Etichetta stile iOS */}
              <motion.span
                animate={{
                  opacity: isActive ? 1 : 0.6,
                  scale: isActive ? 1 : 0.92,
                }}
                transition={{ duration: 0.15 }}
                className="relative z-10 text-[10px] font-medium tracking-tight leading-none"
                style={{
                  color: isActive
                    ? "hsl(var(--primary))"
                    : "hsl(var(--muted-foreground))",
                }}
              >
                {item.label}
              </motion.span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );

  if (embedded) {
    return navContent;
  }

  return (
    // Ancoraggio fisso in basso con supporto safe-area per iPhone
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none pb-[env(safe-area-inset-bottom)] px-3 mb-2">
      {navContent}
    </div>
  );
}