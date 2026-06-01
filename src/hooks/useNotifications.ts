import { useCallback, useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { safeParseBoolean, safeParseInt } from '../utils/storage';

const KEY_REMINDER_ENABLED = '@snapmath_reminder_enabled';
const KEY_REMINDER_HOUR = '@snapmath_reminder_hour';
const KEY_REMINDER_MINUTE = '@snapmath_reminder_minute';
const SCHEDULED_ID_KEY = '@snapmath_notif_id';
const IS_EXPO_GO =
  Constants.executionEnvironment === 'storeClient' || Constants.appOwnership === 'expo';
const NOTIFICATIONS_SUPPORTED = Platform.OS !== 'web' && !IS_EXPO_GO;

const MATH_TIPS_EN = [
  'Quick tip: The derivative of sin(x) is cos(x).',
  'Integration time: integral of x^2 is x^3/3 + C.',
  'Keep your streak going with one short practice set today.',
];

const MATH_TIPS_AR = [
  'نصيحة سريعة: مشتقة sin(x) هي cos(x).',
  'وقت التكامل: تكامل x^2 هو x^3/3 + C.',
  'حافظ على السلسلة بتمرين قصير اليوم.',
];

function getTip(isAr: boolean) {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const tips = isAr ? MATH_TIPS_AR : MATH_TIPS_EN;
  return tips[dayOfYear % tips.length];
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!NOTIFICATIONS_SUPPORTED) return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function scheduleDaily(hour: number, minute: number, isAr: boolean) {
  if (!NOTIFICATIONS_SUPPORTED) return null;
  const prevId = await AsyncStorage.getItem(SCHEDULED_ID_KEY);
  if (prevId) await Notifications.cancelScheduledNotificationAsync(prevId).catch(() => {});

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: isAr ? 'وقت الرياضيات' : 'Math Time',
      body: getTip(isAr),
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  await AsyncStorage.setItem(SCHEDULED_ID_KEY, id);
  return id;
}

export type NotifState = {
  supported: boolean;
  enabled: boolean;
  hour: number;
  minute: number;
  permissionGranted: boolean;
  toggle: (on: boolean, isAr?: boolean) => Promise<boolean>;
  setTime: (h: number, m: number, isAr?: boolean) => Promise<void>;
};

export function useNotifications(): NotifState {
  const [enabled, setEnabled] = useState(false);
  const [hour, setHour] = useState(19);
  const [minute, setMinute] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    (async () => {
      const vals = await AsyncStorage.multiGet([
        KEY_REMINDER_ENABLED,
        KEY_REMINDER_HOUR,
        KEY_REMINDER_MINUTE,
      ]);
      const map = Object.fromEntries(vals.map(([k, v]) => [k, v ?? '']));
      setEnabled(safeParseBoolean(map[KEY_REMINDER_ENABLED], false));
      setHour(safeParseInt(map[KEY_REMINDER_HOUR], 19));
      setMinute(safeParseInt(map[KEY_REMINDER_MINUTE], 0));

      if (!NOTIFICATIONS_SUPPORTED) {
        setPermissionGranted(false);
        return;
      }

      const { status } = await Notifications.getPermissionsAsync();
      setPermissionGranted(status === 'granted');
    })();
  }, []);

  const toggle = useCallback(async (on: boolean, isAr = false) => {
    if (!NOTIFICATIONS_SUPPORTED) {
      setEnabled(false);
      setPermissionGranted(false);
      await AsyncStorage.setItem(KEY_REMINDER_ENABLED, 'false');
      return false;
    }

    if (on) {
      const granted = await requestNotificationPermission();
      setPermissionGranted(granted);
      if (!granted) {
        setEnabled(false);
        await AsyncStorage.setItem(KEY_REMINDER_ENABLED, 'false');
        return false;
      }
      await scheduleDaily(hour, minute, isAr);
    } else {
      const prevId = await AsyncStorage.getItem(SCHEDULED_ID_KEY);
      if (prevId) await Notifications.cancelScheduledNotificationAsync(prevId).catch(() => {});
      await AsyncStorage.removeItem(SCHEDULED_ID_KEY);
    }
    setEnabled(on);
    await AsyncStorage.setItem(KEY_REMINDER_ENABLED, String(on));
    return on;
  }, [hour, minute]);

  const setTime = useCallback(async (h: number, m: number, isAr = false) => {
    setHour(h);
    setMinute(m);
    await AsyncStorage.multiSet([
      [KEY_REMINDER_HOUR, String(h)],
      [KEY_REMINDER_MINUTE, String(m)],
    ]);
    if (enabled) {
      await scheduleDaily(h, m, isAr);
    }
  }, [enabled]);

  return { supported: NOTIFICATIONS_SUPPORTED, enabled, hour, minute, permissionGranted, toggle, setTime };
}
