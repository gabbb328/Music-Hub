import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "harmony_feature_usage";

export type FeatureUsageMap = Record<string, number>;

// Helper to get initial storage
function getStoredUsage(): FeatureUsageMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.warn("Failed to load feature usage from localStorage:", err);
    return {};
  }
}

// Global event bus for real-time sync across components
const USAGE_CHANGE_EVENT = "harmony_feature_usage_changed";

export function trackFeatureUsage(featureId: string) {
  if (!featureId || featureId === "more" || featureId === "home" || featureId === "search" || featureId === "library" || featureId === "extensions" || featureId === "about" || featureId === "changelog") {
    return; // Don't track top-level navigation tabs
  }

  try {
    const current = getStoredUsage();
    const updated = {
      ...current,
      [featureId]: (current[featureId] || 0) + 1,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(USAGE_CHANGE_EVENT, { detail: updated }));
  } catch (err) {
    console.warn("Failed to track feature usage:", err);
  }
}

export function useFeatureUsage() {
  const [usageCounts, setUsageCounts] = useState<FeatureUsageMap>(getStoredUsage);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEv = e as CustomEvent<FeatureUsageMap>;
      if (customEv.detail) {
        setUsageCounts(customEv.detail);
      } else {
        setUsageCounts(getStoredUsage());
      }
    };

    window.addEventListener(USAGE_CHANGE_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener(USAGE_CHANGE_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const incrementUsage = useCallback((featureId: string) => {
    trackFeatureUsage(featureId);
  }, []);

  return {
    usageCounts,
    trackFeatureUsage: incrementUsage,
  };
}
