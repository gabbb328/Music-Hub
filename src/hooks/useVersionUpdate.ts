import { useState, useEffect, useCallback } from "react";
import {
  VersionUpdateConfig,
  getVersionUpdateConfig,
  saveVersionUpdateConfig,
  subscribeVersionUpdate,
} from "@/services/version-update";

export function useVersionUpdate() {
  const [config, setConfig] = useState<VersionUpdateConfig>(getVersionUpdateConfig);

  useEffect(() => {
    const unsubscribe = subscribeVersionUpdate((newConfig) => {
      setConfig(newConfig);
    });
    return unsubscribe;
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
