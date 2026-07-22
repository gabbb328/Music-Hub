import { useState, useEffect, useCallback } from "react";
import {
  VersionUpdateConfig,
  getVersionUpdateConfig,
  saveVersionUpdateConfig,
  subscribeVersionUpdate,
  syncVersionUpdateConfigFromDB,
} from "@/services/version-update";

export function useVersionUpdate() {
  const [config, setConfig] = useState<VersionUpdateConfig>(getVersionUpdateConfig);

  useEffect(() => {
    // 1. Subscribe to local events (tabs in same browser)
    const unsubscribe = subscribeVersionUpdate((newConfig) => {
      setConfig(newConfig);
    });

    // 2. Function to pull global config from DB (Supabase)
    const syncWithDB = () => {
      syncVersionUpdateConfigFromDB().then((dbConfig) => {
        setConfig(dbConfig);
      });
    };

    // 3. Immediate check on mount
    syncWithDB();

    // 4. Poll every 5s so all connected devices update automatically
    const interval = setInterval(syncWithDB, 5000);

    // 5. Sync when user switches back to window/tab
    window.addEventListener("focus", syncWithDB);
    document.addEventListener("visibilitychange", syncWithDB);

    return () => {
      unsubscribe();
      clearInterval(interval);
      window.removeEventListener("focus", syncWithDB);
      document.removeEventListener("visibilitychange", syncWithDB);
    };
  }, []);

  const updateConfig = useCallback((newConfig: VersionUpdateConfig) => {
    saveVersionUpdateConfig(newConfig);
    setConfig(newConfig);
  }, []);

  const setUpdateActive = useCallback(
    (active: boolean, targetVersion?: string) => {
      const nextConfig: VersionUpdateConfig = {
        ...config,
        active,
        ...(targetVersion ? { targetVersion } : {}),
      };
      saveVersionUpdateConfig(nextConfig);
      setConfig(nextConfig);
    },
    [config]
  );

  return {
    config,
    updateConfig,
    setUpdateActive,
    isUpdateActive: config.active,
    targetVersion: config.targetVersion,
  };
}
