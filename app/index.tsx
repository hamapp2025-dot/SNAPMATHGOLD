import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect, type Href } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from '../firebaseConfig';
import SnapMathLogo from '../components/SnapMathLogo';
import { useAppTheme } from '../src/theme/ThemeContext';

type NextRoute = '/auth' | '/onboarding' | '/(tabs)';

function buildEntryHref(
  nextRoute: NextRoute,
  options: { welcomeSeen: boolean },
): Href {
  if (nextRoute === '/auth') {
    if (!options.welcomeSeen) {
      return { pathname: '/welcome', params: { next: nextRoute } };
    }
    return { pathname: '/auth', params: { next: nextRoute } };
  }

  return nextRoute;
}

export default function Index() {
  const [entryHref, setEntryHref] = useState<Href | null>(null);
  const { theme } = useAppTheme();

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        const values = await AsyncStorage.multiGet([
          '@snapmath_onboarding_done',
          '@snapmath_name',
          '@snapmath_seen_welcome',
        ]);

        if (cancelled) return;

        const map = Object.fromEntries(values.map(([key, value]) => [key, value ?? '']));
        const onboardingDone = map['@snapmath_onboarding_done'] === '1';
        const hasLocalProfile = !!map['@snapmath_name'];
        const welcomeSeen = map['@snapmath_seen_welcome'] === '1';

        let nextRoute: NextRoute;

        if (user) {
          nextRoute = onboardingDone ? '/(tabs)' : '/onboarding';
        } else if (hasLocalProfile && onboardingDone) {
          nextRoute = '/(tabs)';
        } else {
          nextRoute = hasLocalProfile ? '/onboarding' : '/auth';
        }

        setEntryHref(buildEntryHref(nextRoute, { welcomeSeen }));
      } catch {
        if (!cancelled) {
          setEntryHref('/auth');
        }
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  if (!entryHref) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg }}>
        <SnapMathLogo size={90} showLabel={false} />
        <ActivityIndicator color={theme.accent} style={{ marginTop: 20 }} />
      </View>
    );
  }

  return <Redirect href={entryHref} />;
}
