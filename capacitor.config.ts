import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'social.flotilla',
  appName: 'Flotilla',
  webDir: 'build'
  server: {
    androidScheme: "https"
  },
  plugins: {
    SplashScreen: {
      androidSplashResourceName: "splash"
    }
  },
};

export default config;
