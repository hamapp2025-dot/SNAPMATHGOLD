import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppTheme, DEFAULT_THEME_ID, THEMES, ThemeId } from './themes';
import { useSubscription } from '../subscriptions/SubscriptionContext';
import { hasTierAccess } from '../subscriptions/subscriptionAccess';

type ThemeContextValue = {
  themeId: ThemeId;
  theme: AppTheme;
  setThemeId: (nextThemeId: ThemeId) => Promise<boolean>;
  canUseThemeId: (nextThemeId: ThemeId) => boolean;
};

const STORAGE_KEY = '@snapmath_theme_id';

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemeId(value: string | null): value is ThemeId {
  return !!value && value in THEMES;
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const { currentTier } = useSubscription();
  const [themeId, setThemeIdState] = useState<ThemeId>(DEFAULT_THEME_ID);

  const canUseThemeId = useCallback(
    (nextThemeId: ThemeId) => {
      const nextTheme = THEMES[nextThemeId] ?? THEMES[DEFAULT_THEME_ID];
      return hasTierAccess(currentTier, nextTheme.tier);
    },
    [currentTier],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && isThemeId(saved) && canUseThemeId(saved)) {
          setThemeIdState(saved);
        }
      } catch {
        // Keep default theme if storage read fails.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canUseThemeId]);

  useEffect(() => {
    if (canUseThemeId(themeId)) return;

    setThemeIdState(DEFAULT_THEME_ID);
    AsyncStorage.setItem(STORAGE_KEY, DEFAULT_THEME_ID).catch(() => {
      // Keep the in-memory fallback even if persistence fails.
    });
  }, [canUseThemeId, themeId]);

  const setThemeId = useCallback(async (nextThemeId: ThemeId) => {
    if (!canUseThemeId(nextThemeId)) {
      return false;
    }

    setThemeIdState(nextThemeId);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, nextThemeId);
    } catch {
      // Theme still updates in-memory if persistence fails.
    }
    return true;
  }, [canUseThemeId]);

  const resolvedThemeId = canUseThemeId(themeId) ? themeId : DEFAULT_THEME_ID;

  const value = useMemo<ThemeContextValue>(() => {
    return {
      themeId: resolvedThemeId,
      theme: THEMES[resolvedThemeId] ?? THEMES[DEFAULT_THEME_ID],
      setThemeId,
      canUseThemeId,
    };
  }, [canUseThemeId, resolvedThemeId, setThemeId]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useAppTheme must be used inside AppThemeProvider');
  }
  return ctx;
}

export function useOptionalAppTheme(): ThemeContextValue | null {
  return useContext(ThemeContext);
}

