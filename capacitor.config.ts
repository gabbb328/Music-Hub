import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.musichub.app',
  appName: 'Music Hub',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
    allowNavigation: ['*']
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
    useLegacyBridge: false,
    backgroundColor: '#0a0e27',
    // Ottimizzazioni per performance
    overrideUserAgent: undefined,
    appendUserAgent: 'MusicHub/1.0',
    // Gestione errori network
    errorUrl: undefined,
    // Abilita hardware acceleration
    hardwareAccelerated: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0a0e27",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    }
  }
};

export default config;
