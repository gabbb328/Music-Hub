import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark";

type ColorTheme =
  | "blue" | "purple" | "violet" | "emerald" | "teal"
  | "amber" | "rose" | "crimson" | "indigo" | "lime" | "sky" | "fuchsia"
  | "dynamic";

interface ThemeContextType {
  theme: Theme;
  colorTheme: ColorTheme;
  setTheme: (theme: Theme) => void;
  setColorTheme: (colorTheme: ColorTheme) => void;
  toggleTheme: () => void;
  isDynamicTheme: boolean;
  autoDarkMode: boolean;
  setAutoDarkMode: (enabled: boolean) => void;
  activeAppIcon: string;
  setActiveAppIcon: (iconName: string) => void;
  /** Chiamato dal Neural Mixer quando importa un file con copertina */
  setCoverImageUrl: (url: string | null) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ─── Palette colori per ogni tema ────────────────────────────────────────────
const colorThemes = {
  blue:    { light: { primary:"221 83 53", background:"0 0 100",   foreground:"222 47 11", accent:"221 83 53", muted:"220 13 91" }, dark: { primary:"217 91 60", background:"222 84 4",  foreground:"210 40 98", accent:"217 91 70", muted:"217 33 17" } },
  purple:  { light: { primary:"262 83 58", background:"0 0 100",   foreground:"262 30 11", accent:"262 83 68", muted:"262 13 91" }, dark: { primary:"271 91 65", background:"265 50 4",  foreground:"270 20 98", accent:"271 91 75", muted:"265 25 17" } },
  violet:  { light: { primary:"243 75 59", background:"0 0 100",   foreground:"243 30 11", accent:"243 75 69", muted:"243 13 91" }, dark: { primary:"250 85 70", background:"243 50 4",  foreground:"250 20 98", accent:"250 85 80", muted:"243 25 17" } },
  emerald: { light: { primary:"152 76 45", background:"0 0 100",   foreground:"152 30 11", accent:"152 76 55", muted:"152 13 91" }, dark: { primary:"158 86 55", background:"152 45 4",  foreground:"150 20 98", accent:"158 86 65", muted:"152 25 17" } },
  teal:    { light: { primary:"173 80 40", background:"0 0 100",   foreground:"173 30 11", accent:"173 80 50", muted:"173 13 91" }, dark: { primary:"178 90 55", background:"173 45 4",  foreground:"175 20 98", accent:"178 90 65", muted:"173 25 17" } },
  amber:   { light: { primary:"38 92 50",  background:"0 0 100",   foreground:"38 40 11",  accent:"38 92 60",  muted:"38 13 91"  }, dark: { primary:"43 96 60",  background:"38 50 4",   foreground:"40 20 98",  accent:"43 96 70",  muted:"38 25 17"  } },
  rose:    { light: { primary:"351 83 58", background:"0 0 100",   foreground:"351 30 11", accent:"351 83 68", muted:"351 13 91" }, dark: { primary:"355 91 65", background:"351 50 4",  foreground:"355 20 98", accent:"355 91 75", muted:"351 25 17" } },
  crimson: { light: { primary:"348 83 60", background:"0 0 100",   foreground:"348 35 11", accent:"348 83 70", muted:"348 13 91" }, dark: { primary:"0 91 71",   background:"348 50 4",  foreground:"0 20 98",   accent:"0 91 81",   muted:"348 25 17" } },
  indigo:  { light: { primary:"231 80 58", background:"0 0 100",   foreground:"231 30 11", accent:"231 80 68", muted:"231 13 91" }, dark: { primary:"239 90 70", background:"231 50 4",  foreground:"235 20 98", accent:"239 90 80", muted:"231 25 17" } },
  lime:    { light: { primary:"84 81 44",  background:"0 0 100",   foreground:"84 30 11",  accent:"84 81 54",  muted:"84 13 91"  }, dark: { primary:"85 90 55",  background:"84 45 4",   foreground:"83 20 98",  accent:"85 90 65",  muted:"84 25 17"  } },
  sky:     { light: { primary:"199 89 48", background:"0 0 100",   foreground:"199 30 11", accent:"199 89 58", muted:"199 13 91" }, dark: { primary:"200 98 60", background:"199 45 4",  foreground:"198 20 98", accent:"200 98 70", muted:"199 25 17" } },
  fuchsia: { light: { primary:"292 84 61", background:"0 0 100",   foreground:"292 30 11", accent:"292 84 71", muted:"292 13 91" }, dark: { primary:"300 91 73", background:"292 50 4",  foreground:"298 20 98", accent:"300 91 83", muted:"292 25 17" } },
} as const;

// ─── Mappa colore → nome icona ────────────────────────────────────────────────
const colorToIconBase: Record<string, string> = {
  blue: "blu", sky: "blu", indigo: "blu",
  teal: "azzurro",
  purple: "viola", violet: "viola", fuchsia: "viola",
  emerald: "verde", lime: "verde",
  amber: "arancione",
  rose: "rosa",
  crimson: "rosso",
};

/** Dato un hue 0-360, restituisce la stringa colore icona */
function hueToIconColor(hue: number): string {
  if (hue >= 340 || hue < 10) return "rosso";
  if (hue < 30)  return "arancione";
  if (hue < 70)  return "arancione"; // giallo → arancione come fallback
  if (hue < 165) return "verde";
  if (hue < 200) return "azzurro";
  if (hue < 260) return "blu";
  if (hue < 300) return "viola";
  if (hue < 330) return "rosa";
  return "rosso";
}

/** Estrae il colore dominante da un URL immagine → restituisce nome icona base */
async function iconColorFromImage(url: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const SIZE   = 16;
        canvas.width = SIZE; canvas.height = SIZE;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, SIZE, SIZE);
        const data = ctx.getImageData(0, 0, SIZE, SIZE).data;

        let rSum = 0, gSum = 0, bSum = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          // Ignora pixel quasi bianchi/neri/grigi
          const r = data[i], g = data[i+1], b = data[i+2];
          const max = Math.max(r,g,b), min = Math.min(r,g,b);
          const s = max === 0 ? 0 : (max - min) / max;
          if (s > 0.2 && max > 40 && max < 230) {
            rSum += r; gSum += g; bSum += b; count++;
          }
        }
        if (count === 0) { resolve("blu"); return; }
        const r = rSum/count, g = gSum/count, b = bSum/count;
        // RGB → Hue
        const max = Math.max(r,g,b), min = Math.min(r,g,b), d = max - min;
        let hue = 0;
        if (d > 0) {
          if (max === r) hue = ((g - b) / d) % 6;
          else if (max === g) hue = (b - r) / d + 2;
          else hue = (r - g) / d + 4;
          hue = Math.round(hue * 60);
          if (hue < 0) hue += 360;
        }
        resolve(hueToIconColor(hue));
      } catch { resolve("blu"); }
    };
    img.onerror = () => resolve("blu");
    img.src = url;
  });
}

/** Aggiorna tutte le favicon/touch-icon del browser */
function applyFavicon(iconPath: string) {
  const setHref = (selector: string, href: string) => {
    const el = document.querySelector(selector) as HTMLLinkElement | null;
    if (el) el.href = href;
  };
  setHref("#app-favicon",    iconPath);
  setHref("#app-touch-icon", iconPath);
  // Anche il metaTag theme-color possiamo aggiornarlo con il colore primario
  // già gestito altrove; qui aggiorniamo solo l'icona
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState]         = useState<Theme>(() => (localStorage.getItem("theme") as Theme) || "dark");
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => (localStorage.getItem("colorTheme") as ColorTheme) || "blue");
  const [autoDarkMode, setAutoDarkModeState] = useState<boolean>(() => localStorage.getItem("autoDarkMode") === "true");
  const [activeAppIcon, setActiveAppIconState] = useState<string>(() => localStorage.getItem("activeAppIcon") || "auto");
  /** URL copertina importata nel Neural Mixer (o Spotify) */
  const [coverImageUrl, setCoverImageUrlState] = useState<string | null>(null);

  // ── Applica palette CSS ──────────────────────────────────────────────────
  const applyTheme = useCallback((t: Theme, ct: ColorTheme) => {
    const root = document.documentElement;
    root.style.transition = "background-color 0.5s ease, color 0.5s ease";
    root.classList.remove("light", "dark");
    root.classList.add(t);
    if (ct === "dynamic") { setTimeout(() => { root.style.transition = ""; }, 600); return; }

    const c = (colorThemes as any)[ct]?.[t];
    if (!c) return;

    root.style.setProperty("--primary",    c.primary);
    root.style.setProperty("--background", c.background);
    root.style.setProperty("--foreground", c.foreground);
    root.style.setProperty("--card",               t === "light" ? "0 0 100" : c.background);
    root.style.setProperty("--card-foreground",    c.foreground);
    root.style.setProperty("--popover",            t === "light" ? "0 0 100" : c.background);
    root.style.setProperty("--popover-foreground", c.foreground);
    root.style.setProperty("--secondary",          c.muted);
    root.style.setProperty("--secondary-foreground", c.foreground);
    root.style.setProperty("--muted",              c.muted);
    root.style.setProperty("--muted-foreground",   t === "light" ? "215 16 47" : "215 20 65");
    root.style.setProperty("--accent",             c.muted);
    root.style.setProperty("--accent-foreground",  c.foreground);
    root.style.setProperty("--border",             t === "light" ? "214 32 91" : c.muted);
    root.style.setProperty("--input",              t === "light" ? "214 32 91" : c.muted);
    root.style.setProperty("--ring",               c.accent);
    root.style.setProperty("--destructive",        t === "light" ? "0 84 60" : "0 62 51");
    root.style.setProperty("--destructive-foreground", "0 0 98");
    setTimeout(() => { root.style.transition = ""; }, 600);
  }, []);

  // ── Risolve e applica l'icona ─────────────────────────────────────────────
  const resolveAndApplyIcon = useCallback(async (
    iconSetting: string,
    currentTheme: Theme,
    currentColor: ColorTheme,
    coverUrl: string | null
  ) => {
    let iconPath: string;

    if (iconSetting !== "auto") {
      // Icona scelta manualmente
      iconPath = `/icons/${iconSetting}`;
    } else {
      // Auto: priorità → copertina importata → colore tema → default
      let colorBase = "blu";

      if (coverUrl) {
        // Estrai colore dominante dalla copertina
        colorBase = await iconColorFromImage(coverUrl);
      } else if (currentColor !== "dynamic") {
        colorBase = colorToIconBase[currentColor] ?? "blu";
      }

      const variant = currentTheme === "light" ? "chiaro" : "scuro";
      iconPath = `/icons/app_${colorBase}_${variant}.png`;
    }

    applyFavicon(iconPath);
  }, []);

  // ── Effetto principale — applica tema + icona ─────────────────────────────
  useEffect(() => {
    applyTheme(theme, colorTheme);
    resolveAndApplyIcon(activeAppIcon, theme, colorTheme, coverImageUrl);
  }, [theme, colorTheme, activeAppIcon, coverImageUrl, applyTheme, resolveAndApplyIcon]);

  // ── Setters con persist ──────────────────────────────────────────────────
  const setTheme = (t: Theme) => { setThemeState(t); localStorage.setItem("theme", t); };
  const setColorTheme = (ct: ColorTheme) => { setColorThemeState(ct); localStorage.setItem("colorTheme", ct); };
  const setAutoDarkMode = (v: boolean) => { setAutoDarkModeState(v); localStorage.setItem("autoDarkMode", String(v)); };
  const setActiveAppIcon = (name: string) => { setActiveAppIconState(name); localStorage.setItem("activeAppIcon", name); };
  const setCoverImageUrl = (url: string | null) => { setCoverImageUrlState(url); };
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <ThemeContext.Provider value={{
      theme, colorTheme, setTheme, setColorTheme, toggleTheme,
      isDynamicTheme: colorTheme === "dynamic",
      autoDarkMode, setAutoDarkMode,
      activeAppIcon, setActiveAppIcon,
      setCoverImageUrl,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
