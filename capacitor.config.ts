import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.teamtalk.app',
  appName: 'TalkToMe',
  webDir: 'out',
  server: {
    // Development: load the running Next.js server
    url: 'http://192.168.1.247:3000',
    cleartext: true,
  }
};

export default config;
