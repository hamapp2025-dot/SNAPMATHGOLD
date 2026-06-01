import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const KEYS_TO_KEEP = new Set([
  '@snapmath_seen_intro',
  '@snapmath_seen_welcome',
  '@snapmath_theme_id',
  '@snapmathacademy_language',
]);

const SESSION_PREFIXES = ['@snapmath_', '@snapmathacademy_', '@mastery_'];

export async function clearUserSessionStorage() {
  try {
    const scheduledId = await AsyncStorage.getItem('@snapmath_notif_id');
    if (scheduledId) {
      await Notifications.cancelScheduledNotificationAsync(scheduledId).catch(() => {});
    }
  } catch {
    // Best-effort notification cleanup.
  }

  const allKeys = await AsyncStorage.getAllKeys();
  const keysToClear = allKeys.filter((key) => {
    if (KEYS_TO_KEEP.has(key)) return false;
    return SESSION_PREFIXES.some((prefix) => key.startsWith(prefix));
  });

  if (keysToClear.length > 0) {
    await AsyncStorage.multiRemove(keysToClear);
  }
}
