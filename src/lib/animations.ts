// ─────────────────────────────────────────────────────────────────────────────
// Apple-grade animation constants — usati in tutta l'app
// ─────────────────────────────────────────────────────────────────────────────

import { Transition, Variants } from "framer-motion";

// ── Spring presets ────────────────────────────────────────────────────────────

/** Navigazione sidebar / tab bar — identico a UIKit tabBar */
export const SPRING_NAV: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 38,
  mass: 0.7,
};

/** Sheet / modal che sale dal basso */
export const SPRING_SHEET: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 34,
  mass: 0.9,
};

/** Hover/press su elementi piccoli — reattivo */
export const SPRING_PRESS: Transition = {
  type: "spring",
  stiffness: 600,
  damping: 32,
  mass: 0.5,
};

/** Scale di copertine / card — morbido */
export const SPRING_CARD: Transition = {
  type: "spring",
  stiffness: 280,
  damping: 26,
  mass: 0.8,
};

/** Entrata di elementi nella lista — stagger */
export const SPRING_ITEM: Transition = {
  type: "spring",
  stiffness: 340,
  damping: 30,
  mass: 0.7,
};

/** Tooltip / popover */
export const SPRING_POPOVER: Transition = {
  type: "spring",
  stiffness: 460,
  damping: 30,
  mass: 0.6,
};

// ── Easing tween ─────────────────────────────────────────────────────────────

/** Fade rapido — 160ms expo-out */
export const TWEEN_FADE: Transition = {
  type: "tween",
  duration: 0.16,
  ease: [0.16, 1, 0.3, 1],
};

/** Transizione di pagina — 320ms expo-out */
export const TWEEN_PAGE: Transition = {
  type: "tween",
  duration: 0.32,
  ease: [0.16, 1, 0.3, 1],
};

/** Collapse/expand height — 240ms */
export const TWEEN_COLLAPSE: Transition = {
  type: "tween",
  duration: 0.24,
  ease: [0.45, 0, 0.55, 1],
};

// ── Variants preconfezionati ──────────────────────────────────────────────────

/** Entrata pagina dal basso con fade */
export const PAGE_VARIANTS: Variants = {
  hidden:  { opacity: 0, y: 14, scale: 0.99 },
  visible: { opacity: 1, y: 0,  scale: 1 },
  exit:    { opacity: 0, y: -8, scale: 0.99 },
};

/** Sheet che sale dal basso */
export const SHEET_VARIANTS: Variants = {
  hidden:  { opacity: 0.6, y: "100%" },
  visible: { opacity: 1,   y: 0 },
  exit:    { opacity: 0,   y: "100%" },
};

/** Fade + scale piccolo */
export const FADE_SCALE_VARIANTS: Variants = {
  hidden:  { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit:    { opacity: 0, scale: 0.97 },
};

/** Popover / dropdown */
export const POPOVER_VARIANTS: Variants = {
  hidden:  { opacity: 0, scale: 0.94, y: -6 },
  visible: { opacity: 1, scale: 1,    y: 0 },
  exit:    { opacity: 0, scale: 0.94, y: -6 },
};

/** Lista con stagger */
export const LIST_CONTAINER: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
};

export const LIST_ITEM: Variants = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

/** Copertina album */
export const COVER_VARIANTS: Variants = {
  hidden:  { opacity: 0, scale: 0.88 },
  visible: { opacity: 1, scale: 1 },
  exit:    { opacity: 0, scale: 0.92 },
};
