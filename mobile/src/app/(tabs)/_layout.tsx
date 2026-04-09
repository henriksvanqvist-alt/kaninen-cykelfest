import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Tabs, usePathname, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Home, Calendar, Key, Trophy, Phone } from 'lucide-react-native';
import { useAppStore } from '@/lib/state/store';
import { api } from '@/lib/api/api';

const LEADERBOARD_SEEN_KEY = 'leaderboard_last_seen';
const LEDTRAD_COURSES = ['förrätt', 'varmrätt', 'efterrätt'];

function seenKey(course: string) {
  return `ledtrad_seen_count_${course}`;
}

// DEBUG: set to true to unlock all tabs for testing
const DEBUG_UNLOCK_ALL = false;

type TabItem = {
  name: string;
  label: string;
  emoji: string;
  alwaysActive: boolean;
};

const TABS: TabItem[] = [
  { name: 'index', label: 'Hem', emoji: '🏠', alwaysActive: true },
  { name: 'schema', label: 'Program', emoji: '📋', alwaysActive: true },
  { name: 'ledtrad', label: 'Ledtrådar', emoji: '🔑', alwaysActive: true },
  { name: 'poang', label: 'Poäng', emoji: '🏆', alwaysActive: true },
  { name: 'sos', label: 'Hjälp', emoji: '🚨', alwaysActive: true },
];

const TAB_ICONS = {
  index: Home,
  schema: Calendar,
  ledtrad: Key,
  poang: Trophy,
  sos: Phone,
};

type TabIconProps = {
  name: string;
  active: boolean;
};

function TabIcon({ name, active }: TabIconProps) {
  const IconComponent = TAB_ICONS[name as keyof typeof TAB_ICONS];
  if (!IconComponent) return null;
  return (
    <IconComponent
      size={22}
      color={active ? '#F5EFE0' : '#9A8E78'}
      strokeWidth={active ? 2.2 : 1.8}
    />
  );
}

type AnimatedTabProps = {
  tab: TabItem;
  active: boolean;
  unlocked: boolean;
  showDot: boolean;
  onPress: () => void;
};

function AnimatedTab({ tab, active, unlocked, showDot, onPress }: AnimatedTabProps) {
  const bgOpacity = useSharedValue(active ? 1 : 0);
  const scaleAnim = useSharedValue(active ? 1 : 0.85);

  useEffect(() => {
    bgOpacity.value = withSpring(active ? 1 : 0, {
      damping: 18,
      stiffness: 200,
    });
    scaleAnim.value = withSpring(active ? 1 : 0.85, {
      damping: 18,
      stiffness: 200,
    });
  }, [active]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
    transform: [{ scale: scaleAnim.value }],
  }));

  return (
    <Pressable
      key={tab.name}
      style={[styles.tabItem, !unlocked && styles.tabInnerLocked]}
      onPress={() => unlocked && onPress()}
      testID={`tab-${tab.name}`}
    >
      <View style={styles.tabInner}>
        {/* Animated pill background */}
        <Animated.View style={[styles.pillBg, pillStyle]} />

        <View style={styles.tabEmojiWrap}>
          <TabIcon name={tab.name} active={active} />
          {showDot ? (
            <View style={styles.tabNotifDot} />
          ) : null}
        </View>
        <Text
          style={[
            styles.tabLabel,
            active && styles.tabLabelActive,
          ]}
        >
          {tab.label}
        </Text>
      </View>
    </Pressable>
  );
}

function BottomNav() {
  const phases = useAppStore((s) => s.phases);
  const scoresLastUpdated = useAppStore((s) => s.scoresLastUpdated);
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const leaderboardSeenRef = useRef<number | null>(null);
  const [showLeaderboardDot, setShowLeaderboardDot] = React.useState(false);
  const [showLedtradDot, setShowLedtradDot] = React.useState(false);

  const checkLedtradNew = async (retries = 2) => {
    try {
      const quizzes = await api.get<{ course: string; questions: { id: string }[] }[]>('/api/cykelfest/destination-quizzes');
      if (!Array.isArray(quizzes)) return;
      for (const course of LEDTRAD_COURSES) {
        const quiz = quizzes.find((q) => q.course === course);
        const count = quiz?.questions.length ?? 0;
        const seenRaw = await AsyncStorage.getItem(seenKey(course));
        const seen = seenRaw ? parseInt(seenRaw, 10) : 0;
        if (count > seen) {
          setShowLedtradDot(true);
          return;
        }
      }
      setShowLedtradDot(false);
    } catch {
      if (retries > 0) {
        setTimeout(() => checkLedtradNew(retries - 1), 3000);
      }
    }
  };

  // Load the last time user saw the leaderboard
  useEffect(() => {
    AsyncStorage.getItem(LEADERBOARD_SEEN_KEY).then((val) => {
      leaderboardSeenRef.current = val ? parseInt(val, 10) : null;
    });
    checkLedtradNew();
  }, []);

  // When on ledtrad, recheck and clear dot
  useEffect(() => {
    if (pathname === '/ledtrad' || pathname.startsWith('/ledtrad')) {
      checkLedtradNew();
    }
  }, [pathname]);

  // When on leaderboard, mark as seen and clear dot
  useEffect(() => {
    if (pathname === '/poang' || pathname.startsWith('/poang')) {
      const now = Date.now();
      leaderboardSeenRef.current = now;
      AsyncStorage.setItem(LEADERBOARD_SEEN_KEY, String(now));
      setShowLeaderboardDot(false);
    }
  }, [pathname]);

  // Show dot when scores updated after last visit
  useEffect(() => {
    if (!scoresLastUpdated) return;
    const seen = leaderboardSeenRef.current;
    const onLeaderboard = pathname === '/poang' || pathname.startsWith('/poang');
    if (!onLeaderboard && (seen === null || scoresLastUpdated > seen)) {
      setShowLeaderboardDot(true);
    }
  }, [scoresLastUpdated, pathname]);

  const schemaUnlocked = phases.some((p) => p.unlockedAt != null);
  const ledtradUnlocked = phases.some((p) => p.unlockedAt != null);
  const poangUnlocked = phases.some(
    (p) => p.name === 'aktivitet_1' && p.unlockedAt != null
  );

  const isTabUnlocked = (tab: TabItem) => {
    if (tab.alwaysActive) return true;
    if (DEBUG_UNLOCK_ALL) return true;
    if (tab.name === 'schema') return schemaUnlocked;
    if (tab.name === 'ledtrad') return ledtradUnlocked;
    if (tab.name === 'poang') return poangUnlocked;
    return false;
  };

  const getTabPath = (tab: TabItem): string => {
    if (tab.name === 'index') return '/';
    return `/${tab.name}`;
  };

  const isActive = (tab: TabItem) => {
    if (tab.name === 'index') return pathname === '/';
    return pathname.startsWith(`/${tab.name}`);
  };

  return (
    <View style={[styles.navOuter, { paddingBottom: Math.max(0, insets.bottom - 28) }]}>
      {Platform.OS === 'web' ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#F5EFE0' }]} />
      ) : (
        <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
      )}
      <View style={styles.nav}>
        {TABS.map((tab) => {
          const unlocked = isTabUnlocked(tab);
          const active = isActive(tab);
          const showDot =
            (tab.name === 'poang' && showLeaderboardDot) ||
            (tab.name === 'ledtrad' && showLedtradDot);

          return (
            <AnimatedTab
              key={tab.name}
              tab={tab}
              active={active}
              unlocked={unlocked}
              showDot={showDot}
              onPress={() => router.push(getTabPath(tab) as any)}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navOuter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
    paddingTop: 2,
    paddingHorizontal: 8,
    backgroundColor: '#F5EFE0',
    overflow: 'hidden',
    shadowColor: '#2A2A2A',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  tabInner: {
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 16,
    borderRadius: 14,
    minWidth: 58,
    position: 'relative',
  },
  pillBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1C4F4A',
    borderRadius: 14,
  },
  tabInnerLocked: {
    opacity: 0.38,
  },
  tabEmojiWrap: {
    position: 'relative',
    marginBottom: 2,
  },
  tabNotifDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E05A2B',
    borderWidth: 1.5,
    borderColor: '#F5EFE0',
  },
  tabLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 10,
    color: '#9A8E78',
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    fontFamily: 'DMSans_600SemiBold',
    color: '#A8D4B8',
  },
});

export default function TabLayout() {
  return (
    <Tabs
      tabBar={() => <BottomNav />}
      screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="schema" />
      <Tabs.Screen name="ledtrad" />
      <Tabs.Screen name="poang" />
      <Tabs.Screen name="sos" />
    </Tabs>
  );
}
