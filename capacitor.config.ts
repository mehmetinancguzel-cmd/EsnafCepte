import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.inanora.esnafcepte',
  appName: 'EsnafCepte',
  webDir: 'public',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1800,
      backgroundColor: '#065f46',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#064e3b',
    },
    Keyboard: {
      resize: 'body',
    },
  },
};

export default config;
