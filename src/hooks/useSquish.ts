/**
 * useSquish — effetto Android 16 / Material You "squish"
 *
 * Quando premi un elemento in un gruppo, quell'elemento si ingrandisce
 * e gli elementi adiacenti si rimpiccioliscono e si allontanano leggermente.
 * Quando rilasci, tutto torna in posizione con uno spring morbido.
 *
 * Uso:
 *   const { getProps } = useSquish(items.length);
 *   items.map((item, i) => <motion.div {...getProps(i)} />)
 */

import { useState, useCallback } from "react";
import { MotionProps } from "framer-motion";

interface SquishOptions {
  /** Scale dell'elemento premuto (default 1.18) */
  activeScale?: number;
  /** Scale degli elementi adiacenti diretti (default 0.88) */
  neighborScale?: number;
  /** Scale degli elementi lontani (default 0.93) */
  farScale?: number;
  /** Distanza oltre la quale si usa farScale invece di neighborScale (default 1) */
  neighborRadius?: number;
  /** Spring config */
  spring?: { stiffness: number; damping: number; mass: number };
}

const DEFAULT_SPRING = { stiffness: 420, damping: 28, mass: 0.7 };

export function useSquish(count: number, options: SquishOptions = {}) {
  const {
    activeScale    = 1.18,
    neighborScale  = 0.88,
    farScale       = 0.94,
    neighborRadius = 1,
    spring         = DEFAULT_SPRING,
  } = options;

  const [pressedIndex, setPressedIndex] = useState<number | null>(null);

  const getScale = useCallback(
    (i: number): number => {
      if (pressedIndex === null) return 1;
      if (i === pressedIndex) return activeScale;
      const dist = Math.abs(i - pressedIndex);
      if (dist <= neighborRadius) return neighborScale;
      return farScale;
    },
    [pressedIndex, activeScale, neighborScale, farScale, neighborRadius]
  );

  const getY = useCallback(
    (i: number): number => {
      if (pressedIndex === null) return 0;
      if (i === pressedIndex) return -2;
      const dist = Math.abs(i - pressedIndex);
      if (dist === 1) return 2;
      return 0;
    },
    [pressedIndex]
  );

  /** Restituisce le props motion per l'elemento all'indice i */
  const getProps = useCallback(
    (i: number): Pick<MotionProps, "animate" | "transition" | "onPointerDown" | "onPointerUp" | "onPointerLeave" | "onPointerCancel"> => ({
      animate: {
        scale: getScale(i),
        y:     getY(i),
      },
      transition: {
        type:      "spring",
        stiffness: spring.stiffness,
        damping:   spring.damping,
        mass:      spring.mass,
      },
      onPointerDown:   () => setPressedIndex(i),
      onPointerUp:     () => setPressedIndex(null),
      onPointerLeave:  () => setPressedIndex(null),
      onPointerCancel: () => setPressedIndex(null),
    }),
    [getScale, getY, spring]
  );

  return { pressedIndex, getProps };
}

/**
 * useSquishItem — versione per un singolo item in una lista,
 * dove il parent traccia lo stato. Usato quando non puoi
 * usare useSquish direttamente (es. in componenti separati).
 */
export function useSquishItem() {
  const [pressed, setPressed] = useState(false);

  const pressProps: Pick<MotionProps, "onPointerDown" | "onPointerUp" | "onPointerLeave" | "onPointerCancel"> = {
    onPointerDown:   () => setPressed(true),
    onPointerUp:     () => setPressed(false),
    onPointerLeave:  () => setPressed(false),
    onPointerCancel: () => setPressed(false),
  };

  return { pressed, pressProps };
}
