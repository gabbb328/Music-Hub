import { useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

interface VisualizerCanvasProps {
  isPlaying: boolean;
}

export default function VisualizerCanvas({ isPlaying }: VisualizerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);
    timeRef.current += isPlaying ? 0.02 : 0.005;
    const t = timeRef.current;

    // Background circles
    const layers = 5;
    for (let l = layers; l >= 0; l--) {
      const baseRadius = 40 + l * 30;
      const pulse = isPlaying ? Math.sin(t * 2 + l * 0.5) * 15 : Math.sin(t + l) * 3;
      const radius = baseRadius + pulse;
      const alpha = isPlaying ? 0.08 + (layers - l) * 0.03 : 0.04 + (layers - l) * 0.01;

      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      gradient.addColorStop(0, `hsla(141, 73%, 42%, ${alpha * 2})`);
      gradient.addColorStop(0.5, `hsla(260, 60%, 55%, ${alpha})`);
      gradient.addColorStop(1, `hsla(200, 80%, 40%, 0)`);

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Waveform ring
    const points = 128;
    const ringRadius = 100;
    ctx.beginPath();
    ctx.strokeStyle = isPlaying ? "hsla(141, 73%, 52%, 0.6)" : "hsla(141, 73%, 42%, 0.2)";
    ctx.lineWidth = 2;

    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const noise = isPlaying
        ? Math.sin(t * 3 + i * 0.3) * 20 + Math.sin(t * 5 + i * 0.7) * 10
        : Math.sin(t + i * 0.2) * 3;
      const r = ringRadius + noise;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    // Floating particles
    const particleCount = isPlaying ? 30 : 8;
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + t * 0.3;
      const dist = ringRadius + 40 + Math.sin(t * 2 + i) * 30;
      const x = cx + Math.cos(angle) * dist;
      const y = cy + Math.sin(angle) * dist;
      const size = isPlaying ? 1.5 + Math.sin(t * 3 + i) : 1;
      const alpha = isPlaying ? 0.4 + Math.sin(t + i) * 0.3 : 0.15;

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(141, 73%, 52%, ${alpha})`;
      ctx.fill();
    }

    animRef.current = requestAnimationFrame(draw);
  }, [isPlaying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.getContext("2d")?.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);
    animRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [draw]);

  return (
    <motion.canvas
      ref={canvasRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full h-full"
      style={{ maxWidth: 400, maxHeight: 400 }}
    />
  );
}
