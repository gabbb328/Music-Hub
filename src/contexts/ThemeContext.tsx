import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

type ColorTheme = 
  | "blue" 
  | "purple" 
  | "violet"
  | "emerald" 
  | "teal"
  | "amber" 
  | "rose" 
  | "crimson"
  | "indigo"
  | "lime"
  | "sky"
  | "fuchsia";

interface ThemeContextType {
  theme: Theme;
  colorTheme: ColorTheme;
  setTheme: (theme: Theme) => void;
  setColorTheme: (colorTheme: ColorTheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Professional color palettes with beautiful contrasts
const colorThemes = {
  blue: {
    light: { 
      primary: "221 83 53", 
      background: "0 0 100", 
      foreground: "222 47 11",
      accent: "221 83 53",
      muted: "220 13 91"
    },
    dark: { 
      primary: "217 91 60", 
      background: "222 84 4", 
      foreground: "210 40 98",
      accent: "217 91 70",
      muted: "217 33 17"
    }
  },
  purple: {
    light: { 
      primary: "262 83 58", 
      background: "0 0 100", 
      foreground: "262 30 11",
      accent: "262 83 68",
      muted: "262 13 91"
    },
    dark: { 
      primary: "271 91 65", 
      background: "265 50 4", 
      foreground: "270 20 98",
      accent: "271 91 75",
      muted: "265 25 17"
    }
  },
  violet: {
    light: { 
      primary: "243 75 59", 
      background: "0 0 100", 
      foreground: "243 30 11",
      accent: "243 75 69",
      muted: "243 13 91"
    },
    dark: { 
      primary: "250 85 70", 
      background: "243 50 4", 
      foreground: "250 20 98",
      accent: "250 85 80",
      muted: "243 25 17"
    }
  },
  emerald: {
    light: { 
      primary: "152 76 45", 
      background: "0 0 100", 
      foreground: "152 30 11",
      accent: "152 76 55",
      muted: "152 13 91"
    },
    dark: { 
      primary: "158 86 55", 
      background: "152 45 4", 
      foreground: "150 20 98",
      accent: "158 86 65",
      muted: "152 25 17"
    }
  },
  teal: {
    light: { 
      primary: "173 80 40", 
      background: "0 0 100", 
      foreground: "173 30 11",
      accent: "173 80 50",
      muted: "173 13 91"
    },
    dark: { 
      primary: "178 90 55", 
      background: "173 45 4", 
      foreground: "175 20 98",
      accent: "178 90 65",
      muted: "173 25 17"
    }
  },
  amber: {
    light: { 
      primary: "38 92 50", 
      background: "0 0 100", 
      foreground: "38 40 11",
      accent: "38 92 60",
      muted: "38 13 91"
    },
    dark: { 
      primary: "43 96 60", 
      background: "38 50 4", 
      foreground: "40 20 98",
      accent: "43 96 70",
      muted: "38 25 17"
    }
  },
  rose: {
    light: { 
      primary: "351 83 58", 
      background: "0 0 100", 
      foreground: "351 30 11",
      accent: "351 83 68",
      muted: "351 13 91"
    },
    dark: { 
      primary: "355 91 65", 
      background: "351 50 4", 
      foreground: "355 20 98",
      accent: "355 91 75",
      muted: "351 25 17"
    }
  },
  crimson: {
    light: { 
      primary: "348 83 60", 
      background: "0 0 100", 
      foreground: "348 35 11",
      accent: "348 83 70",
      muted: "348 13 91"
    },
    dark: { 
      primary: "0 91 71", 
      background: "348 50 4", 
      foreground: "0 20 98",
      accent: "0 91 81",
      muted: "348 25 17"
    }
  },
  indigo: {
    light: { 
      primary: "231 80 58", 
      background: "0 0 100", 
      foreground: "231 30 11",
      accent: "231 80 68",
      muted: "231 13 91"
    },
    dark: { 
      primary: "239 90 70", 
      background: "231 50 4", 
      foreground: "235 20 98",
      accent: "239 90 80",
      muted: "231 25 17"
    }
  },
  lime: {
    light: { 
      primary: "84 81 44", 
      background: "0 0 100", 
      foreground: "84 30 11",
      accent: "84 81 54",
      muted: "84 13 91"
    },
    dark: { 
      primary: "85 90 55", 
      background: "84 45 4", 
      foreground: "83 20 98",
      accent: "85 90 65",
      muted: "84 25 17"
    }
  },
  sky: {
    light: { 
      primary: "199 89 48", 
      background: "0 0 100", 
      foreground: "199 30 11",
      accent: "199 89 58",
      muted: "199 13 91"
    },
    dark: { 
      primary: "200 98 60", 
      background: "199 45 4", 
      foreground: "198 20 98",
      accent: "200 98 70",
      muted: "199 25 17"
    }
  },
  fuchsia: {
    light: { 
      primary: "292 84 61", 
      background: "0 0 100", 
      foreground: "292 30 11",
      accent: "292 84 71",
      muted: "292 13 91"
    },
    dark: { 
      primary: "300 91 73", 
      background: "292 50 4", 
      foreground: "298 20 98",
      accent: "300 91 83",
      muted: "292 25 17"
    }
  }
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem("theme");
    return (saved as Theme) || "dark";
  });

  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => {
    const saved = localStorage.getItem("colorTheme");
    return (saved as ColorTheme) || "blue";
  });

  const applyTheme = (newTheme: Theme, newColorTheme: ColorTheme) => {
    const root = document.documentElement;
    const colors = colorThemes[newColorTheme][newTheme];

    root.classList.remove("light", "dark");
    root.classList.add(newTheme);

    // Apply main colors
    root.style.setProperty("--primary", colors.primary);
    root.style.setProperty("--background", colors.background);
    root.style.setProperty("--foreground", colors.foreground);

    // Additional theme-specific variables
    if (newTheme === "light") {
      root.style.setProperty("--card", "0 0 100");
      root.style.setProperty("--card-foreground", colors.foreground);
      root.style.setProperty("--popover", "0 0 100");
      root.style.setProperty("--popover-foreground", colors.foreground);
      root.style.setProperty("--secondary", colors.muted);
      root.style.setProperty("--secondary-foreground", colors.foreground);
      root.style.setProperty("--muted", colors.muted);
      root.style.setProperty("--muted-foreground", "215 16 47");
      root.style.setProperty("--accent", colors.muted);
      root.style.setProperty("--accent-foreground", colors.foreground);
      root.style.setProperty("--border", "214 32 91");
      root.style.setProperty("--input", "214 32 91");
      root.style.setProperty("--ring", colors.accent);
      root.style.setProperty("--destructive", "0 84 60");
      root.style.setProperty("--destructive-foreground", "0 0 98");
    } else {
      root.style.setProperty("--card", colors.background);
      root.style.setProperty("--card-foreground", colors.foreground);
      root.style.setProperty("--popover", colors.background);
      root.style.setProperty("--popover-foreground", colors.foreground);
      root.style.setProperty("--secondary", colors.muted);
      root.style.setProperty("--secondary-foreground", colors.foreground);
      root.style.setProperty("--muted", colors.muted);
      root.style.setProperty("--muted-foreground", "215 20 65");
      root.style.setProperty("--accent", colors.muted);
      root.style.setProperty("--accent-foreground", colors.foreground);
      root.style.setProperty("--border", colors.muted);
      root.style.setProperty("--input", colors.muted);
      root.style.setProperty("--ring", colors.accent);
      root.style.setProperty("--destructive", "0 62 51");
      root.style.setProperty("--destructive-foreground", "0 0 98");
    }
  };

  useEffect(() => {
    applyTheme(theme, colorTheme);
  }, [theme, colorTheme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const setColorTheme = (newColorTheme: ColorTheme) => {
    setColorThemeState(newColorTheme);
    localStorage.setItem("colorTheme", newColorTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, colorTheme, setTheme, setColorTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
