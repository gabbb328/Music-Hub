/**
 * Estrae i colori dominanti da un'immagine usando Canvas API
 */

interface ColorPalette {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  detectedTheme: 'light' | 'dark';
}

/**
 * Converte RGB a HSL per ordinare per luminosità
 */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return [h * 360, s * 100, l * 100];
}

/**
 * Estrae colori dominanti dall'immagine
 */
export async function extractColorsFromImage(imageUrl: string): Promise<ColorPalette> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context not available');

        // Ridimensiona per performance
        const size = 100;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const imageData = ctx.getImageData(0, 0, size, size);
        const pixels = imageData.data;

        // Conta frequenza colori con clustering migliore
        const colorCounts = new Map<string, number>();
        
        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];

          // Ignora pixel trasparenti
          if (a < 128) continue;
          const [h, s, l] = rgbToHsl(r, g, b);
          
          // Ignora colori troppo scuri, troppo chiari o desaturati
          if (l < 15 || l > 85 || s < 20) continue;

          // Quantizza con granularità diversa per colori più saturi
          const quantize = s > 50 ? 24 : 40; // Colori vivaci: più precisione
          const qr = Math.round(r / quantize) * quantize;
          const qg = Math.round(g / quantize) * quantize;
          const qb = Math.round(b / quantize) * quantize;
          const key = `${qr},${qg},${qb}`;

          // Pesa di più i colori saturi
          const weight = s > 50 ? 2 : 1;
          colorCounts.set(key, (colorCounts.get(key) || 0) + weight);
        }

        // Ordina per frequenza e ottieni più colori
        const sortedColors = Array.from(colorCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([rgb]) => {
            const [r, g, b] = rgb.split(',').map(Number);
            const [h, s, l] = rgbToHsl(r, g, b);
            return { r, g, b, h, s, l };
          });

        if (sortedColors.length === 0) {
          // Fallback: colori default
          resolve({
            primary: 'rgb(168, 85, 247)',
            secondary: 'rgb(59, 130, 246)',
            background: 'rgb(17, 24, 39)',
            text: 'rgb(255, 255, 255)',
            detectedTheme: 'dark',
          });
          return;
        }

        // Colore primario: il più saturo e frequente
        const primary = sortedColors.reduce((prev, curr) => 
          curr.s > prev.s ? curr : prev
        );
        
        // Colore secondario: massimo contrasto cromatico
        let secondary = sortedColors.find(c => {
          const hueDiff = Math.abs(c.h - primary.h);
          const chromaContrast = hueDiff > 60 && hueDiff < 300;
          const saturationOk = c.s > 30;
          return chromaContrast && saturationOk && c !== primary;
        });
        
        // Se non trovi contrasto, usa complementare
        if (!secondary) {
          const compHue = (primary.h + 180) % 360;
          secondary = sortedColors.find(c => 
            Math.abs(c.h - compHue) < 40 && c !== primary
          ) || sortedColors[1] || primary;
        }

        // Background: scuro con hint del primary
        const background = `hsl(${primary.h}, ${Math.min(primary.s, 25)}%, 8%)`;

        // Determina se l'immagine è prevalentemente chiara o scura per auto-switch
        const avgLightness = sortedColors.reduce((sum, c) => {
          const [,, l] = rgbToHsl(c.r, c.g, c.b);
          return sum + l;
        }, 0) / sortedColors.length;
        
        const detectedTheme: 'light' | 'dark' = avgLightness > 50 ? 'light' : 'dark';

        resolve({
          primary: `rgb(${primary.r}, ${primary.g}, ${primary.b})`,
          secondary: `rgb(${secondary.r}, ${secondary.g}, ${secondary.b})`,
          background,
          text: primary.l > 50 ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)',
          detectedTheme,
        });
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
}

/**
 * Applica palette colori al tema con transizioni smooth
 */
export function applyColorPalette(palette: ColorPalette) {
  const root = document.documentElement;
  
  // Aggiungi transizioni CSS per animazioni smooth
  root.style.transition = 'background-color 0.6s ease, color 0.6s ease';
  
  // Converti RGB in HSL per le varianti
  const primaryMatch = palette.primary.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (primaryMatch) {
    const [, r, g, b] = primaryMatch.map(Number);
    const [h, s, l] = rgbToHsl(r, g, b);
    
    // Boost saturazione per primary più vivido
    const boostedS = Math.min(s * 1.2, 100);
    const boostedL = l < 50 ? Math.max(l, 55) : Math.min(l, 65); // Migliora leggibilità
    
    root.style.setProperty('--primary', `${h} ${boostedS}% ${boostedL}%`);
    root.style.setProperty('--primary-foreground', '0 0% 100%'); // Sempre bianco per contrasto
  }

  const secondaryMatch = palette.secondary.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (secondaryMatch) {
    const [, r, g, b] = secondaryMatch.map(Number);
    const [h, s, l] = rgbToHsl(r, g, b);
    
    // Accent leggermente meno saturo per non competere con primary
    const accentL = l < 40 ? Math.max(l, 45) : l;
    
    root.style.setProperty('--accent', `${h} ${s}% ${accentL}%`);
    root.style.setProperty('--accent-foreground', '0 0% 100%');
  }

  const bgMatch = palette.background.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/) ||
                  palette.background.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (bgMatch) {
    const [, v1, v2, v3] = bgMatch.map(Number);
    if (palette.background.startsWith('hsl')) {
      root.style.setProperty('--background', `${v1} ${v2}% ${v3}%`);
    } else {
      const [h, s, l] = rgbToHsl(v1, v2, v3);
      root.style.setProperty('--background', `${h} ${s}% ${l}%`);
    }
  }
  
  // Rimuovi transizione dopo l'animazione per non interferire con hover/interactions
  setTimeout(() => {
    root.style.transition = '';
  }, 600);
}

/**
 * Rimuovi palette personalizzata e ripristina tema
 */
export function clearColorPalette() {
  const root = document.documentElement;
  root.style.removeProperty('--primary');
  root.style.removeProperty('--primary-foreground');
  root.style.removeProperty('--accent');
  root.style.removeProperty('--background');
}
