import { motion } from "framer-motion";
import { useMemo } from "react";

interface AudioVisualizerProps {
  isPlaying: boolean;
  barCount?: number;
}

export default function AudioVisualizer({ isPlaying, barCount = 5 }: AudioVisualizerProps) {
  const bars = useMemo(
    () =>
      Array.from({ length: barCount }, (_, i) => ({
        delay: i * 0.1,
        height: 0.3 + Math.random() * 0.7,
      })),
    [barCount]
  );

  return (
    <div className="flex items-end gap-[2px] h-4">
      {bars.map((bar, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-primary"
          animate={
            isPlaying
              ? {
                  height: ["30%", `${bar.height * 100}%`, "30%"],
                }
              : { height: "30%" }
          }
          transition={
            isPlaying
              ? {
                  duration: 0.5 + Math.random() * 0.3,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                  delay: bar.delay,
                }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  );
}
