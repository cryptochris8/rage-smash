import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

export async function initNative(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#1a1a2e' });
  } catch {
    // Not available on this platform
  }

  try {
    await SplashScreen.hide();
  } catch {
    // Not available
  }
}
