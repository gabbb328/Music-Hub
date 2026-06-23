import { useState, useCallback } from "react";
import { MotionProps } from "framer-motion";

interface SquishOptions {
  activeScale?: number;
  neighborScale?: number;
  farScale?: number;
  neighborRadius?: number;
  spring?: { stiffness: number; damping: number; mass: number };
}

const DEFAULT_SPRING = { stiffness: 550, damping: 25, mass: 1 };

export function useSquish(count: number, options: SquishOptions = {}) {
  const {
    activeScale    = 1.22,
    neighborScale  = 0.85,
    farScale       = 0.92,
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
      if (i === pressedIndex) return -4;
      const dist = Math.abs(i - pressedIndex);
      if (dist === 1) return 3;
      return 0;
    },
    [pressedIndex]
  );

  const getProps = useCallback(
    (i: number) => ({
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
    } as const),
    [getScale, getY, spring]
  );

  return { pressedIndex, getProps };
}

export function useSquishItem() {
  const [pressed, setPressed] = useState(false);

  const pressProps: any = {
    onPointerDown:   () => setPressed(true),
    onPointerUp:     () => setPressed(false),
    onPointerLeave:  () => setPressed(false),
    onPointerCancel: () => setPressed(false),
  };

  return { pressed, pressProps };
}
