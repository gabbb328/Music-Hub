import { useCallback, useRef, useMemo, useState, useEffect } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";

interface WaveformProgressProps {
  progress: number; // 0-100
  isPlaying: boolean;
  onSeek: (progress: number) => void;
}

const BAR_COUNT = 60;

export default function WaveformProgress({ progress, isPlaying, onSeek }: WaveformProgressProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverProgress, setHoverProgress] = useState<number | null>(null);

  // Generate pseudo-random wave heights
  const barHeights = useMemo(() => {
    return Array.from({ length: BAR_COUNT }, (_, i) => {
      const seed = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
      return 0.25 + (seed - Math.floor(seed)) * 0.75;
    });
  }, []);

  const getProgressFromEvent = useCallback((e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : 'clientX' in e ? e.clientX : 0;
    const x = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(100, x * 100));
  }, []);

  const handleInteractionStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const newProgress = getProgressFromEvent(e);
    if (newProgress !== null) {
      onSeek(newProgress);
    }
  }, [getProgressFromEvent, onSeek]);

  const handleInteractionMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging) {
      // Hover effect
      const newProgress = getProgressFromEvent(e);
      setHoverProgress(newProgress);
      return;
    }
    
    const newProgress = getProgressFromEvent(e);
    if (newProgress !== null) {
      onSeek(newProgress);
    }
  }, [isDragging, getProgressFromEvent, onSeek]);

  const handleInteractionEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoverProgress(null);
  }, []);

  // Setup global listeners for drag
  useEffect(() => {
    if (!isDragging) return;
    
    const handleMove = (e: MouseEvent | TouchEvent) => handleInteractionMove(e);
    const handleEnd = () => handleInteractionEnd();
    
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchend', handleEnd);
    
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, handleInteractionMove, handleInteractionEnd]);

  return (
    <div
      ref={containerRef}
      className="relative flex items-center gap-[2px] h-10 cursor-pointer group touch-none"
      onMouseDown={handleInteractionStart}
      onTouchStart={handleInteractionStart}
      onMouseMove={(e) => !isDragging && handleInteractionMove(e.nativeEvent)}
      onMouseLeave={handleMouseLeave}
    >
      {barHeights.map((height, i) => {
        const barProgress = (i / BAR_COUNT) * 100;
        const displayProgress = hoverProgress !== null ? hoverProgress : progress;
        const isPast = barProgress <= displayProgress;
        const isHovering = hoverProgress !== null && Math.abs(barProgress - hoverProgress) < 100 / BAR_COUNT;

        return (
          <WaveBar
            key={i}
            height={height}
            isPlaying={isPlaying && !isDragging}
            isPast={isPast}
            isHovering={isHovering}
            delay={i * 0.015}
          />
        );
      })}

      {/* Progress indicator */}
      <AnimatePresence>
        {(isDragging || hoverProgress !== null) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary shadow-lg pointer-events-none"
            style={{
              left: `${hoverProgress !== null ? hoverProgress : progress}%`,
              transform: `translateX(-50%) translateY(-50%)`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Hover indicator */}
      <div className="absolute inset-0 bg-foreground/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
    </div>
  );
}

// Componente separato per ogni barra - previene re-render quando cambia isPlaying
function WaveBar({ height, isPlaying, isPast, isHovering, delay }: {
  height: number;
  isPlaying: boolean;
  isPast: boolean;
  isHovering: boolean;
  delay: number;
}) {
  const controls = useAnimation();

  useEffect(() => {
    if (isPlaying) {
      // Continua l'animazione senza interromperla
      controls.start({
        scaleY: [null, 0.7 + Math.random() * 0.3, 1, 0.7 + Math.random() * 0.3, 1],
        transition: {
          duration: 0.7 + Math.random() * 0.6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: delay,
        }
      });
    } else {
      // Torna alla posizione base senza stop brusco
      controls.start({
        scaleY: 1,
        transition: { duration: 0.3, ease: "easeOut" }
      });
    }
  }, [isPlaying, controls, delay]);

  return (
    <motion.div
      className="flex-1 rounded-full min-w-[2px]"
      style={{
        backgroundColor: isPast
          ? "hsl(var(--primary))"
          : "hsl(var(--muted-foreground) / 0.25)",
        height: `${height * (isPlaying ? 100 : 50)}%`,
      }}
      animate={controls}
      initial={{ scaleY: 1, opacity: isHovering ? 1 : isPast ? 1 : 0.4 }}
      whileHover={{ opacity: 1 }}
      transition={{
        height: { duration: 0.25, ease: "easeOut" },
        opacity: { duration: 0.15 },
      }}
    />
  );
}
