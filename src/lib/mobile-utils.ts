import { Capacitor } from '@capacitor/core';

/**
 * Check if the app is running as a native mobile app (iOS or Android)
 */
export const isNativeMobile = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Check if running on iOS native app
 */
export const isIOS = (): boolean => {
  return Capacitor.getPlatform() === 'ios';
};

/**
 * Check if running on Android native app
 */
export const isAndroid = (): boolean => {
  return Capacitor.getPlatform() === 'android';
};

/**
 * Check if running in web browser
 */
export const isWeb = (): boolean => {
  return Capacitor.getPlatform() === 'web';
};

/**
 * Get the current platform (ios, android, or web)
 */
export const getPlatform = (): string => {
  return Capacitor.getPlatform();
};
