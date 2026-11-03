import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

export type DeviceType = "mobile" | "tablet" | "desktop";

export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = React.useState<DeviceType>(() => {
    if (typeof window === "undefined") return "desktop";
    const w = window.innerWidth;
    if (w < 768) return "mobile";
    if (w < 1024) return "tablet";
    const isTouchTablet = navigator.maxTouchPoints > 1 && /ipad|tablet/i.test(navigator.userAgent) && w <= 1180;
    if (isTouchTablet) return "tablet";
    return "desktop";
  });

  React.useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 768) {
        setDeviceType("mobile");
      } else if (w < 1024) {
        setDeviceType("tablet");
      } else {
        const isTouchTablet = navigator.maxTouchPoints > 1 && /ipad|tablet/i.test(navigator.userAgent) && w <= 1180;
        setDeviceType(isTouchTablet ? "tablet" : "desktop");
      }
    };

    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    update();
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return deviceType;
}

export function useIsTablet(): boolean {
  const device = useDeviceType();
  return device === "tablet";
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
