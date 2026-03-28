import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { STOPS, ProgramStop } from '@/data/programStops';
import { useAppStore } from '@/lib/state/store';
import PressableScale from '@/components/PressableScale';

const CARD_TINTS: Record<ProgramStop['cardType'], string> = {
  food:     '#FFFBF2',
  activity: '#F2FAF6',
  party:    '#F2F5FF',
};

function CardDescription({ stop }: { stop: ProgramStop }) {
  if (stop.locationVisible === 'hidden' && stop.hiddenText) {
    return <Text style={styles.cardDesc} numberOfLines={1}>{stop.hiddenText}</Text>;
  }
  if (stop.description) {
    return <Text style={styles.cardDesc} numberOfLines={1}>{stop.description}</Text>;
  }
  return null;
}

export default function SchemaScreen() {
  const insets = useSafeAreaInsets();
  const settings = useAppStore((s) => s.settings);
  const todayStr = new Date().toISOString().split('T')[0];

  const forratUnlocked    = settings['unlock_steg5'] ? todayStr >= settings['unlock_steg5'] : false;
  const middagUnlocked    = settings['unlock_steg7'] ? todayStr >= settings['unlock_steg7'] : false;
  const efterrattUnlocked = settings['unlock_steg8'] ? todayStr >= settings['unlock_steg8'] : false;

  const isUnlocked = (stopId: string) => {
    if (stopId === 'forrat')    return forratUnlocked;
    if (stopId === 'middag')    return middagUnlocked;
    if (stopId === 'efterratt') return efterrattUnlocked;
    return true;
  };

  return (
    <View style={styles.container} testID="schema-screen">
      <LinearGradient
        colors={['#1C4F4A', '#2A6B64']}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <Text style={styles.headerEyebrow}>KANINENS CYKELFEST 2026</Text>
        <Text style={styles.headerTitle}>Program</Text>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.dateHeading}>Lördag 30 maj</Text>

        {STOPS.map((stop, index) => {
          const locked = stop.secretLocation === true && !isUnlocked(stop.id);
          const bg     = CARD_TINTS[stop.cardType];
          const isLast = index === STOPS.length - 1;

          return (
            <PressableScale
              key={stop.id}
              testID={`program-card-${stop.id}`}
              onPress={() => router.push({ pathname: '/program/[id]', params: { id: stop.id } })}
              style={{ marginBottom: isLast ? 0 : 8 }}
            >
              <View style={[styles.card, { backgroundColor: bg }]}>
                {/* Colored left accent bar */}
                <View style={[styles.accentBar, { backgroundColor: stop.accentColor }]} />

                {/* Card content */}
                <View style={styles.cardContent}>
                  {/* Time at top-left */}
                  <Text style={styles.timeLabel}>
                    {stop.startTime}–{stop.endTime}
                  </Text>

                  {/* Row: icon + title/desc + chevron */}
                  <View style={styles.cardRow}>
                    <Text style={styles.iconEmoji}>{stop.icon}</Text>
                    <View style={styles.cardText}>
                      <Text style={[styles.cardLabel, { color: locked ? '#9A8E78' : '#1A1A1A' }]} numberOfLines={1}>
                        {stop.label}
                      </Text>
                      <CardDescription stop={stop} />
                    </View>
                    <View style={styles.cardRight}>
                      {locked
                        ? <Text style={styles.cardLock}>🔒</Text>
                        : <Text style={[styles.cardChevron, { color: stop.accentColor }]}>›</Text>
                      }
                    </View>
                  </View>
                </View>
              </View>
            </PressableScale>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5DFD1',
  },
  header: {
    paddingBottom: 10,
    paddingHorizontal: 22,
  },
  headerEyebrow: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 10,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 2,
  },
  headerTitle: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 26,
    color: '#F5EFE0',
    lineHeight: 30,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
  },
  dateHeading: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 18,
    color: '#4A4030',
    marginBottom: 10,
  },
  card: {
    borderRadius: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#2A2A2A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  accentBar: {
    width: 4,
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
  },
  timeLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    letterSpacing: 0,
    color: '#3A3328',
    marginBottom: 6,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconEmoji: {
    fontSize: 22,
    flexShrink: 0,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  cardLabel: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 17,
    lineHeight: 20,
  },
  cardDesc: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: '#6B6050',
    lineHeight: 18,
  },
  cardRight: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardLock: {
    fontSize: 14,
  },
  cardChevron: {
    fontSize: 24,
    fontWeight: '300',
    lineHeight: 26,
  },
});
