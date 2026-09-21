import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkle } from "lucide-react";

interface SparkleParticle {
  id: number;
  angle: number;
  distance: number;
  size: number;
  color: string;
  delay: number;
}

const STAR_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#FFD93D",
  "#A78BFA",
  "#60A5FA",
  "#F472B6",
  "#34D399",
  "#FB923C",
];

let sparkleIdCounter = 0;

const FourPointStar = ({ color, size }: { color: string; size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 0 3px ${color}90)` }}
  >
    <path
      d="M12 0C12 6.6 12 12 12 12C12 12 6.6 12 0 12C6.6 12 12 12 12 12C12 12 12 17.4 12 24C12 17.4 12 12 12 12C12 12 17.4 12 24 12C17.4 12 12 12 12 12C12 12 12 6.6 12 0Z"
      fill={color}
    />
  </svg>
);

interface GeminiAIButtonProps {
  onOpenAI?: () => void;
  layoutId?: string;
  className?: string;
  size?: "normal" | "small";
}

export function GeminiAIButton({
  onOpenAI,
  layoutId = "gemini-ai-btn",
  className = "",
  size = "normal",
}: GeminiAIButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [sparkles, setSparkles] = useState<SparkleParticle[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);

    const newSparkles: SparkleParticle[] = Array.from({ length: 10 }, () => ({
      id: sparkleIdCounter++,
      angle: Math.random() * 360,
      distance: 24 + Math.random() * 30,
      size: 5 + Math.random() * 7,
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      delay: Math.random() * 0.25,
    }));

    setSparkles((prev) => [...prev, ...newSparkles]);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setSparkles((prev) =>
        prev.filter((s) => !newSparkles.some((ns) => ns.id === s.id)),
      );
    }, 1000);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const btnDimensions = size === "small" ? "w-11 h-11" : "w-12 h-12";
  const iconDimensions = size === "small" ? "w-4 h-4" : "w-5 h-5";

  return (
    <motion.div
      layoutId={layoutId}
      id="lyra-ai-btn"
      className={`relative ${btnDimensions} flex items-center justify-center shrink-0 ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      transition={{
        type: "spring",
        stiffness: 380,
        damping: 26,
        mass: 0.6,
      }}
    >
      {/* Outer ambient glow gradient - styled with signature Gemini colors */}
      <motion.div
        className="absolute inset-[-3px] rounded-full pointer-events-none"
        style={{
          background:
            "conic-gradient(from 0deg, #FF6B6B, #FFD93D, #34D399, #4ECDC4, #60A5FA, #A78BFA, #F472B6, #FF6B6B)",
          filter: "blur(3px)",
        }}
        animate={{
          rotate: 360,
          opacity: isHovered ? 1 : 0.45,
        }}
        transition={{
          rotate: {
            duration: 3.5,
            repeat: Infinity,
            ease: "linear",
          },
          opacity: {
            duration: 0.3,
          },
        }}
      />

      {/* Inner sharp gradient border */}
      <motion.div
        className="absolute inset-[-1px] rounded-full pointer-events-none"
        style={{
          background:
            "conic-gradient(from 90deg, #A78BFA, #60A5FA, #4ECDC4, #34D399, #FFD93D, #FF6B6B, #F472B6, #A78BFA)",
        }}
        animate={{
          rotate: -360,
          opacity: isHovered ? 0.95 : 0.3,
        }}
        transition={{
          rotate: {
            duration: 4.5,
            repeat: Infinity,
            ease: "linear",
          },
          opacity: {
            duration: 0.3,
          },
        }}
      />

      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
          mass: 0.5,
        }}
        onClick={() => onOpenAI?.()}
        className={`relative z-10 ${btnDimensions} rounded-full border border-border/60 bg-background flex items-center justify-center text-muted-foreground hover:text-foreground shadow-sm`}
        title="Lyra AI Assistant"
      >
        <Sparkle className={`${iconDimensions} text-amber-400`} />
      </motion.button>

      {/* Scattering star particles */}
      <div className="absolute inset-0 pointer-events-none overflow-visible">
        <AnimatePresence>
          {sparkles.map((sparkle) => {
            const rad = (sparkle.angle * Math.PI) / 180;
            const targetX = Math.cos(rad) * sparkle.distance;
            const targetY = Math.sin(rad) * sparkle.distance;

            return (
              <motion.div
                key={sparkle.id}
                initial={{
                  x: 0,
                  y: 0,
                  opacity: 0,
                  scale: 0.3,
                  rotate: 0,
                }}
                animate={{
                  x: targetX,
                  y: targetY,
                  opacity: [0, 1, 1, 0],
                  scale: [0.3, 1, 1, 0.5],
                  rotate: 180,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  delay: sparkle.delay,
                  duration: 0.9,
                  ease: [0.16, 1, 0.3, 1],
                  opacity: {
                    delay: sparkle.delay,
                    duration: 0.9,
                    times: [0, 0.2, 0.7, 1],
                  },
                }}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  marginLeft: -sparkle.size / 2,
                  marginTop: -sparkle.size / 2,
                }}
              >
                <FourPointStar color={sparkle.color} size={sparkle.size} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default GeminiAIButton;
