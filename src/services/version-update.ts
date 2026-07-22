import { APP_VERSION } from "@/hooks/version";

export interface VersionUpdateConfig {
  active: boolean;
  targetVersion: string;
  updatedAt?: string;
}

const STORAGE_KEY = "harmony_version_update_config";
const UPDATE_EVENT_NAME = "harmony_version_update_change";

export function parseSemver(v: string): [number, number, number] {
  const clean = (v || "").replace(/^[vV]/, "").trim();
  const parts = clean.split(".").map((p) => parseInt(p, 10) || 0);
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
}

export function compareSemver(v1: string, v2: string): number {
  const [a1, b1, c1] = parseSemver(v1);
  const [a2, b2, c2] = parseSemver(v2);

  if (a1 !== a2) return a1 - a2;
  if (b1 !== b2) return b1 - b2;
  return c1 - c2;
}

export function isVersionGreaterOrEqual(target: string, current: string = APP_VERSION): boolean {
  return compareSemver(target, current) >= 0;
}

export function getNextVersionPresets(currentVersion: string = APP_VERSION): {
  patch: string;
  minor: string;
  major: string;
} {
  const [major, minor, patch] = parseSemver(currentVersion);
  const prefix = currentVersion.trim().toLowerCase().startsWith("v") ? "v" : "";
  return {
    patch: `${prefix}${major}.${minor}.${patch + 1}`,
    minor: `${prefix}${major}.${minor + 1}.0`,
    major: `${prefix}${major + 1}.0.0`,
  };
}

export function getVersionUpdateConfig(): VersionUpdateConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        active: Boolean(parsed.active),
        targetVersion: parsed.targetVersion || getNextVersionPresets().minor,
        updatedAt: parsed.updatedAt,
      };
    }
  } catch (e) {
    console.error("Error reading version update config:", e);
  }

  const presets = getNextVersionPresets();
  return {
    active: false,
    targetVersion: presets.minor,
  };
}

export function saveVersionUpdateConfig(config: VersionUpdateConfig): void {
  const payload: VersionUpdateConfig = {
    active: config.active,
    targetVersion: config.targetVersion,
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT_NAME, { detail: payload }));
  } catch (e) {
    console.error("Error saving version update config:", e);
  }
}

export function subscribeVersionUpdate(callback: (config: VersionUpdateConfig) => void): () => void {
  const handleCustom = (e: Event) => {
    const custom = e as CustomEvent<VersionUpdateConfig>;
    if (custom.detail) {
      callback(custom.detail);
    } else {
      callback(getVersionUpdateConfig());
    }
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      callback(getVersionUpdateConfig());
    }
  };

  window.addEventListener(UPDATE_EVENT_NAME, handleCustom);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(UPDATE_EVENT_NAME, handleCustom);
    window.removeEventListener("storage", handleStorage);
  };
}
