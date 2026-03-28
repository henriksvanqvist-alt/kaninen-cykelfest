import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DISMISSED_KEY = 'pwa_install_dismissed_v1';

type BrowserContext = 'ios-safari' | 'ios-chrome' | 'android-chrome' | 'other';

function isInStandaloneMode(): boolean {
  if (Platform.OS !== 'web') return true;
  if (typeof window === 'undefined') return true;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function detectBrowser(): BrowserContext {
  if (typeof window === 'undefined') return 'other';
  const ua = window.navigator.userAgent;
  const isIOS = /iP(hone|ad|od)/.test(ua);
  const isAndroid = /Android/.test(ua);
  const isChrome = /CriOS|Chrome/.test(ua) && !/Edg/.test(ua);
  if (isIOS && isChrome) return 'ios-chrome';
  if (isIOS) return 'ios-safari';
  if (isAndroid && isChrome) return 'android-chrome';
  return 'other';
}

function hasDismissed(): boolean {
  try {
    return !!localStorage.getItem(DISMISSED_KEY);
  } catch {
    return false;
  }
}

const INSTRUCTIONS: Record<BrowserContext, { steps: string[] } | null> = {
  'ios-safari': {
    steps: [
      'Tryck på ⎋ Dela-ikonen längst ner i Safari',
      'Välj Lägg till på hemskärmen',
      'Tryck Lägg till — klart!',
    ],
  },
  'ios-chrome': {
    steps: [
      'Tryck på ··· menyn uppe till höger i Chrome',
      'Välj Lägg till på hemskärmen',
      'Tryck Lägg till — klart!',
    ],
  },
  'android-chrome': {
    steps: [
      'Tryck på ⋮ menyn uppe till höger i Chrome',
      'Välj Lägg till på startskärmen eller Installera app',
      'Tryck Installera — klart!',
    ],
  },
  other: null, // don't show for unknown browsers
};

export default function PwaInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [browser, setBrowser] = useState<BrowserContext>('other');
  const slideAnim = React.useRef(new Animated.Value(200)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (isInStandaloneMode()) return;
    if (hasDismissed()) return;
    const b = detectBrowser();
    if (!INSTRUCTIONS[b]) return;
    setBrowser(b);
    const t = setTimeout(() => {
      setVisible(true);
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 12 }).start();
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    Animated.timing(slideAnim, { toValue: 200, duration: 220, useNativeDriver: true }).start(() => {
      setVisible(false);
    });
    try { localStorage.setItem(DISMISSED_KEY, '1'); } catch {}
  }

  if (!visible) return null;
  const instructions = INSTRUCTIONS[browser];
  if (!instructions) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { paddingBottom: insets.bottom + 12, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.handle} />
      <Text style={styles.title}>Installera som app</Text>
      <Text style={styles.body}>
        För bästa upplevelse — utan webbläsarens knappar — lägg till appen på din hemskärm.
      </Text>

      <View style={styles.steps}>
        {instructions.steps.map((step, i) => (
          <View key={i} style={styles.step}>
            <Text style={styles.stepNum}>{i + 1}</Text>
            <Text style={styles.stepText}>
              {step.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
                part.startsWith('**') ? (
                  <Text key={j} style={styles.bold}>{part.slice(2, -2)}</Text>
                ) : (
                  part
                )
              )}
            </Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.dismissBtn} onPress={dismiss} activeOpacity={0.8}>
        <Text style={styles.dismissText}>Stäng</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F5EFE0',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
    zIndex: 9999,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#C8BFA8',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 22,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  body: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: '#5A5145',
    lineHeight: 20,
    marginBottom: 18,
  },
  steps: {
    gap: 12,
    marginBottom: 20,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNum: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
    color: '#fff',
    backgroundColor: '#2A6B64',
    width: 22,
    height: 22,
    borderRadius: 11,
    textAlign: 'center',
    lineHeight: 22,
    flexShrink: 0,
  },
  stepText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: '#3A3328',
    lineHeight: 22,
    flex: 1,
  },
  bold: {
    fontFamily: 'DMSans_700Bold',
  },
  dismissBtn: {
    backgroundColor: '#2A6B64',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  dismissText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: '#fff',
  },
});
