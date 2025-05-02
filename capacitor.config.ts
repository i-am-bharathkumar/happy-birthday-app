import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.happy.birthdayapp',
  appName: 'happy-birthday-app',
  webDir: 'out',
  plugins: {
    Filesystem: {
      androidPermissions: [
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    }
  }
};

export default config;
