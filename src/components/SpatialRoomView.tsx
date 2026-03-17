// ─── SpatialRoomView – draggable top-down room with stem nodes ───────────────
import React, { useRef, useCallback, useEffect, useState } from "react";
import type { Stem } from "@/types/spatialMixer";
import { xyToAngleDist } from "@/lib/spatialMixerUtils";

interface SpatialRoomViewProps {
  stems: Stem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
}

const ROOM_PADDING = 20; // px inside the SVG viewbox

export default function SpatialRoomView({
  stems,
  selectedId,
  onSelect,
  onMove,
}: SpatialRoomViewProps) {
  const svgRef     = useRef<SVGSVGElement>(null);
  const dragging   = useRef<{ id: string } | null>(null);
  const [size, setSize] = useState(400);

  // Observe container resize
  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const s = Math.min(entry.contentRect.width, entry.contentRect.height);
      setSize(Math.max(200, s));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const radius  = (size - ROOM_PADDING * 2) / 2;
  const cx      = size / 2;
  const cy      = size / 2;

  // Map normalised (-1…1) → SVG pixels
  const toSvgX = (nx: number) => cx + nx * radius;
  const toSvgY = (ny: number) => cy + ny * radius;

  // Map SVG pixels → normalised (-1…1), clamped to unit circle
  const toNorm = useCallback(
    (px: number, py: number) => {
      let nx = (px - cx) / radius;
      let ny = (py - cy) / radius;
      const len = Math.sqrt(nx * nx + ny * ny);
      if (len > 1) { nx /= len; ny /= len; }
      return { nx, ny };
    },
    [cx, cy, radius],
  );

  const getSvgPoint = useCallback(
    (e: MouseEvent | TouchEvent): { x: number; y: number } | null => {
      const svg = svgRef.current;
      if (!svg) return null;
      const pt  = svg.createSVGPoint();
      if (e instanceof TouchEvent) {
        const t = e.touches[0] ?? e.changedTouches[0];
        pt.x = t.clientX; pt.y = t.clientY;
      } else {
        pt.x = (e as MouseEvent).clientX;
        pt.y = (e as MouseEvent).clientY;
      }
      const svgP = pt.matrixTransform(svg.getScreenCTM()!.inverse());
      return { x: svgP.x, y: svgP.y };
    },
    [],
  );

  const handleDragMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!dragging.current) return;
      const pt = getSvgPoint(e);
      if (!pt) return;
      const { nx, ny } = toNorm(pt.x, pt.y);
      onMove(dragging.current.id, nx, ny);
    },
    [getSvgPoint, toNorm, onMove],
  );

  const handleDragEnd = useCallback(() => { dragging.current = null; }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleDragMove);
    window.addEventListener("mouseup",   handleDragEnd);
    window.addEventListener("touchmove", handleDragMove, { passive: false });
    window.addEventListener("touchend",  handleDragEnd);
    return () => {
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup",   handleDragEnd);
      window.removeEventListener("touchmove", handleDragMove);
      window.removeEventListener("touchend",  handleDragEnd);
    };
  }, [handleDragMove, handleDragEnd]);

  const startDrag = (id: string) => (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragging.current = { id };
    onSelect(id);
  };

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="touch-none select-none"
      style={{ maxWidth: "100%", maxHeight: "100%" }}
    >
      {/* ── Room background ── */}
      <circle cx={cx} cy={cy} r={radius} fill="rgba(15,20,40,0.85)" stroke="rgba(99,102,241,0.3)" strokeWidth={1} />

      {/* ── Distance rings ── */}
      {[0.25, 0.5, 0.75, 1].map((t) => (
        <circle
          key={t}
          cx={cx} cy={cy}
          r={radius * t}
          fill="none"
          stroke="rgba(99,102,241,0.15)"
          strokeWidth={1}
          strokeDasharray={t < 1 ? "4 6" : "none"}
        />
      ))}

      {/* ── Axis lines ── */}
      {[0, 45, 90, 135].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <line
            key={deg}
            x1={cx - Math.sin(rad) * radius}
            y1={cy - Math.cos(rad) * radius}
            x2={cx + Math.sin(rad) * radius}
            y2={cy + Math.cos(rad) * radius}
            stroke="rgba(99,102,241,0.10)"
            strokeWidth={1}
          />
        );
      })}

      {/* ── Cardinal labels ── */}
      {[
        { label: "F",  x: cx,          y: cy - radius + 14 },
        { label: "B",  x: cx,          y: cy + radius - 6  },
        { label: "L",  x: cx - radius + 8, y: cy + 4       },
        { label: "R",  x: cx + radius - 8, y: cy + 4       },
      ].map(({ label, x, y }) => (
        <text key={label} x={x} y={y} textAnchor="middle" fontSize={10}
          fill="rgba(148,163,184,0.5)" fontFamily="sans-serif">{label}</text>
      ))}

      {/* ── Stem connection lines ── */}
      {stems.filter((s) => !s.muted).map((s) => {
        const sx = toSvgX(s.position.x);
        const sy = toSvgY(s.position.y);
        return (
          <line key={`line-${s.id}`}
            x1={cx} y1={cy} x2={sx} y2={sy}
            stroke={s.color}
            strokeWidth={selectedId === s.id ? 1.5 : 0.8}
            strokeOpacity={selectedId === s.id ? 0.5 : 0.2}
            strokeDasharray="3 5"
          />
        );
      })}

      {/* ── Listener (centre) ── */}
      <circle cx={cx} cy={cy} r={10} fill="rgba(99,102,241,0.3)" stroke="#6366f1" strokeWidth={2} />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={9} fill="#a5b4fc" fontFamily="sans-serif">YOU</text>

      {/* ── Stem nodes ── */}
      {stems.map((s) => {
        const sx    = toSvgX(s.position.x);
        const sy    = toSvgY(s.position.y);
        const isSelected = selectedId === s.id;
        const opacity = s.muted ? 0.35 : 1;

        return (
          <g
            key={s.id}
            transform={`translate(${sx},${sy})`}
            style={{ cursor: s.locked ? "default" : "grab", opacity }}
            onMouseDown={s.locked ? undefined : startDrag(s.id)}
            onTouchStart={s.locked ? undefined : startDrag(s.id)}
            onClick={() => onSelect(s.id)}
          >
            {/* glow ring when selected */}
            {isSelected && (
              <circle r={18} fill="none" stroke={s.color} strokeWidth={2} strokeOpacity={0.6}>
                <animate attributeName="r" values="16;20;16" dur="2s" repeatCount="indefinite" />
                <animate attributeName="stroke-opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
              </circle>
            )}
            {/* main node */}
            <circle r={isSelected ? 14 : 12}
              fill={s.color}
              fillOpacity={0.85}
              stroke={isSelected ? "#fff" : s.color}
              strokeWidth={isSelected ? 2 : 1}
            />
            {/* label */}
            <text y={22} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.85)"
              fontFamily="sans-serif" fontWeight="600"
              style={{ pointerEvents: "none" }}
            >
              {s.name.length > 10 ? s.name.slice(0, 9) + "…" : s.name}
            </text>
            {/* mute indicator */}
            {s.muted && (
              <line x1={-7} y1={-7} x2={7} y2={7}
                stroke="#f87171" strokeWidth={2.5} strokeLinecap="round" />
            )}
          </g>
        );
      })}
    </svg>
  );
}
