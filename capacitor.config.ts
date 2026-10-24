import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.inanora.esnafcepte',
  appName: 'EsnafCepte',
  webDir: 'public',
  server: {
    url: 'http://192.168.1.105:3000',
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
