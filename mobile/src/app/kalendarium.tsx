import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '@/lib/state/store';

interface TimelineStep {
  status: 'done' | 'active' | 'locked';
  icon: string;
  title: string;
  sub: string;
  badge: string;
  detail?: string;
  route?: string;
}

function StepDot({ step }: { step: TimelineStep }) {
  if (step.status === 'active') {
    return (
      <LinearGradient
        colors={['#1C4F4A', '#2A6B64']}
        style={[styles.dot, styles.dotActive]}
      >
        <Text style={[styles.dotNum, { color: '#A8D4B8' }]}>{step.icon}</Text>
      </LinearGradient>
    );
  }
  if (step.status === 'done') {
    return (
      <View style={[styles.dot, styles.dotDone]}>
        <Text style={[styles.dotNum, { color: '#1C4F4A' }]}>{step.icon}</Text>
      </View>
    );
  }
  return (
    <View style={[styles.dot, styles.dotLocked]}>
      <Text style={[styles.dotNum, { color: '#9A8E78' }]}>{step.icon}</Text>
    </View>
  );
}

function Badge({ step }: { step: TimelineStep }) {
  if (step.badge === 'Pågående') {
    return (
      <View style={styles.badgePagaende}>
        <Text style={styles.badgePagaendeText}>{step.badge}</Text>
      </View>
    );
  }
  if (step.badge === 'Öppet') {
    return (
      <View style={styles.badgePagaende}>
        <Text style={styles.badgePagaendeText}>{step.badge}</Text>
      </View>
    );
  }
  if (step.status === 'done') {
    return (
      <View style={styles.badgeDone}>
        <Text style={styles.badgeDoneText}>{step.badge}</Text>
      </View>
    );
  }
  if (step.status === 'active') {
    return (
      <View style={styles.badgeActive}>
        <Text style={styles.badgeActiveText}>{step.badge}</Text>
      </View>
    );
  }
  return (
    <View style={styles.badgeLocked}>
      <Text style={styles.badgeLockedText}>{step.badge}</Text>
    </View>
  );
}

export default function KalendariumScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const settings = useAppStore((s) => s.settings);

  const todayStr = (() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
  })();

  const steg1Unlocked = settings['unlock_steg1'] ? todayStr >= settings['unlock_steg1'] : true; // default: always visible
  const steg2Unlocked = settings['unlock_steg2'] ? todayStr >= settings['unlock_steg2'] : true; // default: always visible
  const lagUnlocked = settings['unlock_ditt_lag'] ? todayStr >= settings['unlock_ditt_lag'] : false;
  const vardinfoUnlocked = settings['unlock_vardinfo'] ? todayStr >= settings['unlock_vardinfo'] : false;
  const steg5Unlocked = settings['unlock_steg5'] ? todayStr >= settings['unlock_steg5'] : false;
  const steg6Unlocked = settings['unlock_steg6'] ? todayStr >= settings['unlock_steg6'] : false;

  const dateLabel = (key: string, fallback: string) => {
    const val = settings[key];
    if (!val) return fallback;
    const d = new Date(val.includes('T') ? val : val.replace(/-/g, '/'));
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' });
  };

  const lagDateLabel = dateLabel('unlock_ditt_lag', '20 april');
  const vardinfoDateLabel = dateLabel('unlock_vardinfo', '20 april');
  const steg5DateLabel = dateLabel('unlock_steg5', '28 maj');
  const steg6DateLabel = dateLabel('unlock_steg6', '30 maj');

  const STEPS: TimelineStep[] = [
    {
      status: steg2Unlocked ? 'active' : 'locked',
      icon: '1',
      title: 'Bekräfta anmälan',
      sub: steg2Unlocked ? 'Bekräftelse av deltagande senast den 10 april' : 'Ännu inte tillgänglig',
      badge: steg2Unlocked ? 'Öppet' : 'Kommande',
      route: steg2Unlocked ? '/bekraftad-anmalan' : undefined,
    },
    {
      status: lagUnlocked ? 'active' : 'locked',
      icon: '2',
      title: 'Info om mitt lag',
      sub: lagUnlocked ? 'Se mitt lag och lagmedlemmar' : `Tillgänglig från ${lagDateLabel}`,
      badge: lagUnlocked ? 'Öppet' : 'Kommande',
      detail: lagUnlocked ? undefined : 'När laginfo öppnar ser du ditt lagnamn, dina lagkamrater och kan beställa festklädsel.',
      route: lagUnlocked ? '/mitt-lag' : undefined,
    },
    {
      status: vardinfoUnlocked ? 'active' : 'locked',
      icon: '3',
      title: 'Info om mitt värdskap',
      sub: vardinfoUnlocked ? 'Se vad som gäller för mitt värdskap' : `Pinkod skickas separat. Tillgänglig från ${vardinfoDateLabel}.`,
      badge: vardinfoUnlocked ? 'Öppet' : 'Kommande',
      detail: vardinfoUnlocked ? undefined : 'Information till dig som är värd: vilka gäster som kommer, eventuella allergier och annat praktiskt att tänka på.',
      route: vardinfoUnlocked ? '/host' : undefined,
    },
    {
      status: steg5Unlocked ? 'active' : 'locked',
      icon: '4',
      title: 'Info om min förrätt',
      sub: steg5Unlocked ? 'Var jag skall befinna mig för min förrätt' : `Tillgänglig från ${steg5DateLabel}`,
      badge: steg5Unlocked ? 'Öppet' : 'Kommande',
      route: steg5Unlocked ? '/program/forrat' : undefined,
      detail: steg5Unlocked ? undefined : 'Här hittar du adressen dit du ska bege dig för förrätten, samt bekräftelse på din klädsel.',
    },
    {
      status: steg6Unlocked ? 'active' : 'locked',
      icon: '5',
      title: 'Cykelfesten börjar!',
      sub: steg6Unlocked ? 'Startskottet är här — dags att cykla!' : `Startskottet ${steg6DateLabel} kl 15:00`,
      badge: steg6Unlocked ? 'Öppet' : 'Kommande',
      detail: steg6Unlocked ? undefined : 'Kaninens Cykelfest 2026 — Tema: Semesterresor vi minns. En kväll med cykling, mat, aktiviteter och fest!',
    },
  ];

  return (
    <View style={styles.root} testID="kalendarium-screen">
      {/* HEADER */}
      <LinearGradient
        colors={['#1a4a45', '#0a2220']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerTexture} pointerEvents="none">
          {Array.from({ length: 20 }).map((_, i) => (
            <View key={i} style={[styles.textureStripe, { left: i * 28 - 120 }]} />
          ))}
        </View>

        <Pressable style={styles.backBtn} onPress={() => router.back()} testID="back-button">
          <ChevronLeft size={22} color="#A8D4B8" strokeWidth={2} />
        </Pressable>

        <View style={styles.headerTextBlock}>
          <Text style={styles.headerTitle}>Vad händer härnäst?</Text>
          <Text style={styles.headerSubtitle}>Kaninens Cykelfest 2026</Text>
        </View>
      </LinearGradient>

      {/* TIMELINE SCROLL */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        testID="timeline-scroll"
      >
        <Text style={styles.introLabel}>TIDSLINJE · 6 STEG</Text>

        <View style={styles.card}>
          {STEPS.map((step, index) => {
            const isClickable = !!step.route;
            const rowStyles = [
              styles.row,
              step.status === 'active' && styles.rowActive,
              step.status === 'locked' && styles.rowLocked,
            ];

            const inner = (
              <>
                <View style={styles.leftCol}>
                  {index < STEPS.length - 1 ? (
                    <View style={[
                      styles.connectorLine,
                      step.status === 'done' && styles.connectorLineDone,
                      step.status === 'active' && styles.connectorLineActive,
                    ]} />
                  ) : null}
                  <StepDot step={step} />
                </View>

                <View style={styles.rightCol}>
                  <View style={styles.topRow}>
                    <Text style={[
                      styles.title,
                      step.status === 'active' && styles.titleActive,
                      step.status === 'locked' && styles.titleLocked,
                    ]} numberOfLines={2}>
                      {step.title}
                    </Text>
                    <View style={styles.topRowRight}>
                      <Badge step={step} />
                      <ChevronRight size={14} color={isClickable ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.15)'} />
                    </View>
                  </View>

                  <Text style={[
                    styles.sub,
                    step.status === 'active' && styles.subActive,
                    step.status === 'locked' && styles.subLocked,
                  ]}>
                    {step.sub}
                  </Text>

                  {step.detail != null ? (
                    <View style={[
                      styles.detailBox,
                      step.status === 'active' && styles.detailBoxActive,
                      step.status === 'locked' && styles.detailBoxLocked,
                    ]}>
                      <Text style={[styles.detailText, step.status === 'locked' && styles.detailTextLocked]}>
                        {step.detail}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </>
            );

            return (
              <View key={index}>
                {index > 0 ? <View style={styles.divider} /> : null}
                {isClickable ? (
                  <Pressable style={rowStyles} onPress={() => router.push(step.route as any)} testID={`timeline-step-${index}-button`}>
                    {inner}
                  </Pressable>
                ) : (
                  <View style={rowStyles} testID={`timeline-step-${index}`}>
                    {inner}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.noteBox}>
          <Text style={styles.noteText}>
            Mer information skickas löpande via appen. Håll koll här!
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#E5DFD1',
  },

  // HEADER
  header: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    position: 'relative',
    overflow: 'hidden',
  },
  headerTexture: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  textureStripe: {
    position: 'absolute',
    top: -200,
    bottom: -200,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.022)',
    transform: [{ rotate: '-55deg' }],
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(168,212,184,0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(168,212,184,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  headerTextBlock: {
    gap: 4,
  },
  headerTitle: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 26,
    color: '#F5EFE0',
    lineHeight: 30,
  },
  headerSubtitle: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9.5,
    color: 'rgba(168,212,184,0.7)',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginTop: 2,
  },

  // SCROLL
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 16,
  },

  // INTRO LABEL
  introLabel: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9,
    color: '#9A8E78',
    letterSpacing: 1.2,
    marginBottom: 10,
  },

  // CARD
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E8E0CC',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  // DIVIDER
  divider: {
    height: 1,
    backgroundColor: '#F0EAD8',
    marginLeft: 60,
  },

  // ROW
  row: {
    flexDirection: 'row',
    paddingVertical: 18,
    paddingRight: 16,
  },
  rowActive: {
    backgroundColor: '#F0F7F4',
  },
  rowLocked: {
    opacity: 0.55,
  },

  // LEFT COLUMN
  leftCol: {
    width: 60,
    alignItems: 'center',
    paddingTop: 2,
    position: 'relative',
  },
  connectorLine: {
    position: 'absolute',
    top: 38,
    bottom: -18,
    width: 2,
    backgroundColor: '#E8E0CC',
    borderRadius: 1,
    zIndex: 0,
  },
  connectorLineDone: { backgroundColor: '#A8D4B8' },
  connectorLineActive: { backgroundColor: 'rgba(28,79,74,0.25)' },

  // DOT
  dot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  dotDone: { backgroundColor: '#DFF0E8' },
  dotActive: {
    shadowColor: '#1C4F4A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  dotLocked: { backgroundColor: '#E8E0CC' },
  dotNum: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
  },

  // RIGHT COLUMN
  rightCol: {
    flex: 1,
    gap: 5,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: '#2A2A2A',
    flex: 1,
    flexShrink: 1,
    lineHeight: 19,
  },
  topRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  titleActive: { color: '#1C4F4A' },
  titleLocked: { color: '#7A7060' },
  sub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12.5,
    color: '#7A7060',
    lineHeight: 17,
  },
  subActive: { color: '#2A6B64' },
  subLocked: { color: '#9A8E78' },

  // DETAIL BOX
  detailBox: {
    marginTop: 6,
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 9,
    backgroundColor: 'rgba(28,79,74,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(28,79,74,0.1)',
  },
  detailBoxActive: {
    backgroundColor: 'rgba(28,79,74,0.08)',
    borderColor: 'rgba(28,79,74,0.15)',
  },
  detailBoxLocked: {
    backgroundColor: 'rgba(154,142,120,0.08)',
    borderColor: 'rgba(154,142,120,0.15)',
  },
  detailText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: '#2A6B64',
    lineHeight: 17,
  },
  detailTextLocked: { color: '#9A8E78' },

  // BADGES
  badgePagaende: {
    backgroundColor: '#FFF3CD',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 0,
    minWidth: 62,
    alignItems: 'center',
  },
  badgePagaendeText: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9,
    color: '#92600A',
  },
  badgeDone: {
    backgroundColor: '#DFF0E8',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 0,
    minWidth: 62,
    alignItems: 'center',
  },
  badgeDoneText: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9,
    color: '#1C6B40',
  },
  badgeActive: {
    backgroundColor: 'rgba(28,79,74,0.1)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 0,
    minWidth: 62,
    alignItems: 'center',
  },
  badgeActiveText: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9,
    color: '#1C4F4A',
  },
  badgeLocked: {
    backgroundColor: '#F0EAD8',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 0,
    minWidth: 62,
    alignItems: 'center',
  },
  badgeLockedText: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9,
    color: '#9A8E78',
  },

  // NOTE BOX
  noteBox: {
    marginTop: 16,
    backgroundColor: 'rgba(28,79,74,0.06)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(28,79,74,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  noteText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: '#7A7060',
    lineHeight: 17,
    textAlign: 'center',
  },
});
