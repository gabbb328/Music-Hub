/**
 * appIcon.ts
 * Cambia l'icona dell'app su Android usando activity-alias via Capacitor.
 * Su web aggiorna solo la favicon (già gestita dal ThemeContext).
 */
import { Capacitor } from "@capacitor/core";

// Mappa nome file icona → nome alias Android
const ICON_TO_ALIAS: Record<string, string> = {
  "auto":                     "default",
  "app_blu_scuro.png":        "IconBluScuro",
  "app_blu_chiaro.png":       "IconBluChiaro",
  "app_viola_scuro.png":      "IconViolaScuro",
  "app_viola_chiaro.png":     "IconViolaChiaro",
  "app_azzurro_scuro.png":    "IconAzzurroScuro",
  "app_azzurro_chiaro.png":   "IconAzzurroChiaro",
  "app_verde_scuro.png":      "IconVerdeScuro",
  "app_verde_chiaro.png":     "IconVerdeChiaro",
  "app_arancione_scuro.png":  "IconArancioneScuro",
  "app_arancione_chiaro.png": "IconArancioneChiaro",
  "app_rosa_scuro.png":       "IconRosaScuro",
  "app_rosa_chiaro.png":      "IconRosaChiaro",
  "app_rosso_scuro.png":      "IconRossoScuro",
  "app_rosso_chiaro.png":     "IconRossoChiaro",
};

// Tutti gli alias esistenti nel manifest
const ALL_ALIASES = [
  "IconBluScuro", "IconBluChiaro",
  "IconViolaScuro", "IconViolaChiaro",
  "IconAzzurroScuro", "IconAzzurroChiaro",
  "IconVerdeScuro", "IconVerdeChiaro",
  "IconArancioneScuro", "IconArancioneChiaro",
  "IconRosaScuro", "IconRosaChiaro",
  "IconRossoScuro", "IconRossoChiaro",
];

/**
 * Risolve l'icona "auto" al nome file corretto dato tema e colore.
 */
export function resolveAutoIconFilename(
  colorTheme: string,
  theme: "light" | "dark"
): string {
  const colorToBase: Record<string, string> = {
    blue: "blu", sky: "blu", indigo: "blu",
    teal: "azzurro",
    purple: "viola", violet: "viola", fuchsia: "viola",
    emerald: "verde", lime: "verde",
    amber: "arancione",
    rose: "rosa",
    crimson: "rosso",
  };
  const base = colorToBase[colorTheme] ?? "blu";
  const variant = theme === "light" ? "chiaro" : "scuro";
  return `app_${base}_${variant}.png`;
}

/**
 * Cambia l'icona dell'app su Android.
 * Usa window.AndroidIconChanger iniettato dalla MainActivity,
 * oppure Capacitor.toNative come fallback.
 */
export async function changeAppIcon(iconFilename: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return; // su web non fare nulla

  const alias = ICON_TO_ALIAS[iconFilename];
  if (!alias) return;

  try {
    if (alias === "default") {
      // Riabilita la MainActivity, disabilita tutti gli alias
      await callNative("setDefaultIcon", {});
    } else {
      // Abilita l'alias scelto, disabilita tutti gli altri + MainActivity
      await callNative("setIconAlias", { alias });
    }
    console.log("[appIcon] changed to:", alias);
  } catch (err) {
    console.warn("[appIcon] native call failed:", err);
  }
}

async function callNative(method: string, data: Record<string, string>): Promise<void> {
  // Usa Capacitor plugin bridge
  await (Capacitor as any).nativeCallback(
    "AppIconPlugin",
    method,
    data,
    () => {},
    () => {}
  );
}
