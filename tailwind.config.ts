import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      transitionTimingFunction: {
        "expo-out":   "cubic-bezier(0.16, 1, 0.3, 1)",
        "quint-out":  "cubic-bezier(0.22, 1, 0.36, 1)",
        "spring":     "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "decelerate": "cubic-bezier(0.0, 0.0, 0.2, 1)",
        "standard":   "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      },
      transitionDuration: {
        "80":  "80ms",
        "160": "160ms",
        "280": "280ms",
        "420": "420ms",
        "520": "520ms",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-spring": {
          "0%":   { transform: "scale(0.88)", opacity: "0" },
          "60%":  { transform: "scale(1.03)", opacity: "1" },
          "100%": { transform: "scale(1)",    opacity: "1" },
        },
        "slide-up-sheet": {
          "from": { transform: "translateY(100%)", opacity: "0.6" },
          "to":   { transform: "translateY(0)",    opacity: "1" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.35" },
          "50%":      { opacity: "0.85" },
        },
        "shimmer": {
          "from": { backgroundPosition: "-200% center" },
          "to":   { backgroundPosition:  "200% center" },
        },
        "wave-idle": {
          "0%, 100%": { transform: "scaleY(0.3)" },
          "50%":      { transform: "scaleY(0.6)" },
        },
        "wave-active": {
          "0%, 100%": { transform: "scaleY(0.4)" },
          "25%":      { transform: "scaleY(1)" },
          "75%":      { transform: "scaleY(0.6)" },
        },
        "page-in": {
          "from": { opacity: "0", transform: "translateY(12px) scale(0.99)" },
          "to":   { opacity: "1", transform: "translateY(0)    scale(1)" },
        },
      },
      animation: {
        "accordion-down":  "accordion-down 0.22s cubic-bezier(0.16,1,0.3,1)",
        "accordion-up":    "accordion-up   0.18s cubic-bezier(0.16,1,0.3,1)",
        "fade-up":         "fade-up   0.36s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in":         "fade-in   0.24s cubic-bezier(0.16,1,0.3,1) both",
        "scale-spring":    "scale-spring 0.42s cubic-bezier(0.34,1.56,0.64,1) both",
        "slide-up-sheet":  "slide-up-sheet 0.46s cubic-bezier(0.16,1,0.3,1) both",
        "pulse-glow":      "pulse-glow 2.4s ease-in-out infinite",
        "shimmer":         "shimmer 1.5s ease-in-out infinite",
        "wave-idle":       "wave-idle 2s ease-in-out infinite",
        "wave-active":     "wave-active 0.6s ease-in-out infinite",
        "page-in":         "page-in 0.48s cubic-bezier(0.16,1,0.3,1) both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
