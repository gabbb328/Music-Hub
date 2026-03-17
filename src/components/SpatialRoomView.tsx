/**
 * SpatialRoomView — canvas interattivo drag & drop per posizionare stem nello spazio 3D
 *
 * FIX rispetto alla versione precedente:
 * - I listener mouse/touch sono attaccati UNA SOLA VOLTA con useRef stabili
 * - Le posizioni stem arrivano via ref (stemsRef) aggiornato ad ogni render → nessun re-mount
 * - onMove/onSelect sono stabilizzati via ref → nessuna closure stale
 * - Il canvas ridisegna quando stems/selectedId cambiano (useEffect separato solo per il draw)
 * - Threshold tocco aumentata a 60px per mobile
 */

import { useRef, useEffect, useCallback, useState } from "react";

interface StemPos {
  id: string;
  name: string;
  color: string;
  muted: boolean;
  locked: boolean;
  position: { x: number; y: number; angle: number; distance: number };
}

interface Props {
  stems: StemPos[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
}

function hexToRgb(hex: string): string {
  try {
    const n = parseInt(hex.replace("#", ""), 16);
    return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
  } catch { return "99,102,241"; }
}

export default function SpatialRoomView({ stems, selectedId, onSelect, onMove }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(300);

  // Ref stabili — aggiornati ad ogni render senza causare re-mount dei listener
  const stemsRef     = useRef(stems);
  const selectedRef  = useRef(selectedId);
  const onMoveRef    = useRef(onMove);
  const onSelectRef  = useRef(onSelect);
  const sizeRef      = useRef(size);
  const draggingRef  = useRef<string | null>(null);

  useEffect(() => { stemsRef.current    = stems;     }, [stems]);
  useEffect(() => { selectedRef.current = selectedId; }, [selectedId]);
  useEffect(() => { onMoveRef.current   = onMove;    }, [onMove]);
  useEffect(() => { onSelectRef.current = onSelect;  }, [onSelect]);
  useEffect(() => { sizeRef.current     = size;      }, [size]);

  // ── ResizeObserver ────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const entry = entries[0];
      if (!entry) return;
      const s = Math.floor(Math.min(entry.contentRect.width, entry.contentRect.height, 700));
      setSize(Math.max(200, s));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Helpers geometrici ────────────────────────────────────────────────────
  const getGeom = useCallback(() => {
    const s  = sizeRef.current;
    const cx = s / 2, cy = s / 2;
    const r  = s * 0.42;
    return { s, cx, cy, r };
  }, []);

  const normToCanvas = useCallback((nx: number, ny: number) => {
    const { cx, cy, r } = getGeom();
    return { x: cx + nx * r, y: cy + ny * r };
  }, [getGeom]);

  const canvasToNorm = useCallback((px: number, py: number) => {
    const { cx, cy, r } = getGeom();
    let nx = (px - cx) / r;
    let ny = (py - cy) / r;
    const len = Math.sqrt(nx * nx + ny * ny);
    if (len > 1) { nx /= len; ny /= len; }
    return { nx, ny };
  }, [getGeom]);

  const getCanvasPoint = useCallback((e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const s    = sizeRef.current;
    const scX  = s / rect.width;
    const scY  = s / rect.height;
    if (e instanceof TouchEvent) {
      const t = e.touches[0] ?? e.changedTouches[0];
      if (!t) return null;
      return { x: (t.clientX - rect.left) * scX, y: (t.clientY - rect.top) * scY };
    }
    return { x: ((e as MouseEvent).clientX - rect.left) * scX, y: ((e as MouseEvent).clientY - rect.top) * scY };
  }, []);

  const findNearest = useCallback((px: number, py: number, threshold: number): string | null => {
    let best: string | null = null;
    let bestD = threshold;
    stemsRef.current.forEach(s => {
      if (s.locked) return;
      const { x, y } = normToCanvas(s.position.x, s.position.y);
      const d = Math.sqrt((px - x) ** 2 + (py - y) ** 2);
      if (d < bestD) { bestD = d; best = s.id; }
    });
    return best;
  }, [normToCanvas]);

  // ── Event listeners (montati UNA SOLA VOLTA) ──────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleDown = (e: MouseEvent | TouchEvent) => {
      const pt = getCanvasPoint(e);
      if (!pt) return;
      const threshold = e instanceof TouchEvent ? 60 : 40;
      const id = findNearest(pt.x, pt.y, threshold);
      if (id) {
        draggingRef.current = id;
        onSelectRef.current(id);
        e.preventDefault();
      }
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!draggingRef.current) return;
      e.preventDefault();
      const pt = getCanvasPoint(e);
      if (!pt) return;
      const { nx, ny } = canvasToNorm(pt.x, pt.y);
      onMoveRef.current(draggingRef.current, nx, ny);
    };

    const handleUp = () => { draggingRef.current = null; };

    canvas.addEventListener("mousedown",  handleDown, { passive: false });
    canvas.addEventListener("touchstart", handleDown, { passive: false });
    window.addEventListener("mousemove",  handleMove, { passive: false });
    window.addEventListener("mouseup",    handleUp);
    window.addEventListener("touchmove",  handleMove, { passive: false });
    window.addEventListener("touchend",   handleUp);

    return () => {
      canvas.removeEventListener("mousedown",  handleDown);
      canvas.removeEventListener("touchstart", handleDown);
      window.removeEventListener("mousemove",  handleMove);
      window.removeEventListener("mouseup",    handleUp);
      window.removeEventListener("touchmove",  handleMove);
      window.removeEventListener("touchend",   handleUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ← solo al mount, i dati arrivano via ref

  // ── Draw (si aggiorna ad ogni cambio stems/selectedId/size) ──────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { s, cx, cy, r } = getGeom();
    ctx.clearRect(0, 0, s, s);

    // Sfondo
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = "#070c1a"; ctx.fill();
    ctx.strokeStyle = "rgba(99,102,241,0.4)"; ctx.lineWidth = 2; ctx.stroke();

    // Anelli distanza
    [0.25, 0.5, 0.75].forEach(t => {
      ctx.beginPath(); ctx.arc(cx, cy, r * t, 0, Math.PI * 2);
      ctx.setLineDash([5, 8]); ctx.strokeStyle = "rgba(99,102,241,0.12)"; ctx.lineWidth = 1; ctx.stroke();
      ctx.setLineDash([]);
    });

    // Assi
    [0, 45, 90, 135].forEach(deg => {
      const rad = deg * Math.PI / 180;
      ctx.beginPath();
      ctx.moveTo(cx - Math.sin(rad) * r, cy - Math.cos(rad) * r);
      ctx.lineTo(cx + Math.sin(rad) * r, cy + Math.cos(rad) * r);
      ctx.strokeStyle = "rgba(99,102,241,0.07)"; ctx.lineWidth = 1; ctx.stroke();
    });

    // Etichette cardinali
    const lblSize = Math.max(10, s * 0.033);
    ctx.font = `bold ${lblSize}px sans-serif`;
    ctx.fillStyle = "rgba(148,163,184,0.45)";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("F", cx,        cy - r + lblSize);
    ctx.fillText("B", cx,        cy + r - lblSize);
    ctx.fillText("L", cx - r + lblSize, cy);
    ctx.fillText("R", cx + r - lblSize, cy);

    // Linee stem → listener
    stems.forEach(s2 => {
      if (s2.muted) return;
      const { x: sx, y: sy } = normToCanvas(s2.position.x, s2.position.y);
      const rgb = hexToRgb(s2.color);
      const isSel = s2.id === selectedId;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(sx, sy);
      ctx.setLineDash([4, 7]);
      ctx.strokeStyle = `rgba(${rgb},${isSel ? 0.5 : 0.2})`;
      ctx.lineWidth = isSel ? 1.5 : 0.8; ctx.stroke();
      ctx.setLineDash([]);
    });

    // Listener centrale
    ctx.beginPath(); ctx.arc(cx, cy, 13, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(99,102,241,0.22)"; ctx.fill();
    ctx.strokeStyle = "#818cf8"; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.font = `bold ${Math.max(7, s * 0.022)}px sans-serif`;
    ctx.fillStyle = "#a5b4fc"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("YOU", cx, cy);

    // Nodi stem
    stems.forEach(s2 => {
      const { x: sx, y: sy } = normToCanvas(s2.position.x, s2.position.y);
      const rgb   = hexToRgb(s2.color);
      const isSel = s2.id === selectedId;
      const alpha = s2.muted ? 0.28 : 1;
      const nodeR = isSel ? s * 0.066 : s * 0.054;

      // Alone glow
      if (isSel) {
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, nodeR * 2.2);
        grad.addColorStop(0, `rgba(${rgb},0.35)`);
        grad.addColorStop(1, `rgba(${rgb},0)`);
        ctx.beginPath(); ctx.arc(sx, sy, nodeR * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = grad; ctx.fill();
      }

      // Corpo
      ctx.beginPath(); ctx.arc(sx, sy, nodeR, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb},${0.9 * alpha})`; ctx.fill();

      // Bordo
      ctx.strokeStyle = isSel ? `rgba(255,255,255,${0.9 * alpha})` : `rgba(${rgb},${0.55 * alpha})`;
      ctx.lineWidth = isSel ? 2.5 : 1.5; ctx.stroke();

      // Croce mute
      if (s2.muted) {
        const d = nodeR * 0.55;
        ctx.strokeStyle = "#f87171"; ctx.lineWidth = 2.5; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(sx - d, sy - d); ctx.lineTo(sx + d, sy + d); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(sx + d, sy - d); ctx.lineTo(sx - d, sy + d); ctx.stroke();
      }

      // Etichetta
      const label = s2.name.length > 9 ? s2.name.slice(0, 8) + "…" : s2.name;
      const fSize = Math.max(9, s * 0.028);
      ctx.font = `600 ${fSize}px sans-serif`;
      ctx.fillStyle = `rgba(255,255,255,${s2.muted ? 0.35 : 0.92})`;
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillText(label, sx, sy + nodeR + 4);

      // Mini angolo per stem selezionato
      if (isSel) {
        const angleTxt = `${Math.round(s2.position.angle)}°`;
        ctx.font = `500 ${Math.max(7, s * 0.02)}px sans-serif`;
        ctx.fillStyle = `rgba(${rgb},0.8)`;
        ctx.textBaseline = "bottom";
        ctx.fillText(angleTxt, sx, sy - nodeR - 3);
      }
    });

  }, [stems, selectedId, size, getGeom, normToCanvas]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="touch-none select-none"
        style={{ maxWidth: "100%", maxHeight: "100%", cursor: "crosshair", borderRadius: "50%" }}
      />
    </div>
  );
}
