import React from 'react';
import { Tabs } from 'expo-router';
import LuxuryTabBar from '../../components/LuxuryTabBar';
import { useAppTheme } from '../../src/theme/ThemeContext';
import { useT } from '../../src/config/LanguageContext';

export default function TabsLayout() {
  const { theme } = useAppTheme();
  const { isAr, t } = useT();

  return (
    <Tabs
      tabBar={(props) => <LuxuryTabBar {...props} theme={theme} isAr={isAr} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabHome'),
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: t('tabPractice'),
        }}
      />
      <Tabs.Screen
        name="ai-chat"
        options={{
          title: t('tabCoach'),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: isAr ? 'الترتيب' : 'League',
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabProfile'),
        }}
      />

      <Tabs.Screen name="exams" options={{ href: null }} />
      <Tabs.Screen name="curriculum" options={{ href: null }} />
      <Tabs.Screen name="parent" options={{ href: null }} />
    </Tabs>
  );
}

