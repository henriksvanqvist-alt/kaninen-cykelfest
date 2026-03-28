import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Lock } from 'lucide-react-native';
import { api } from '@/lib/api/api';

type ClueItem = { id: string; course: string; title: string; body: string; locked: boolean; orderIndex: number };

const COURSE_CONFIG = {
  'förrätt': { emoji: '🥗', colors: ['#2E6B4A', '#1C4F32'] as [string, string], label: 'Förrätt' },
  'varmrätt': { emoji: '🍖', colors: ['#7A2E2E', '#5C1E1E'] as [string, string], label: 'Varmrätt' },
  'efterrätt': { emoji: '🍮', colors: ['#4A2E7A', '#321C5C'] as [string, string], label: 'Efterrätt' },
};

export default function LedtradDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { course } = useLocalSearchParams<{ course: string }>();
  const [clues, setClues] = useState<ClueItem[]>([]);
  const [loading, setLoading] = useState(true);

  const config = COURSE_CONFIG[course as keyof typeof COURSE_CONFIG] ?? COURSE_CONFIG['förrätt'];

  useEffect(() => {
    const fetchClues = async () => {
      setLoading(true);
      try {
        const all = await api.get<ClueItem[]>('/api/cykelfest/clues');
        setClues(all.filter(c => c.course === course));
      } catch {}
      setLoading(false);
    };
    fetchClues();
  }, [course]);

  const visibleClues = clues.filter(c => !c.locked);
  const hasLocked = clues.some(c => c.locked);

  return (
    <View style={styles.container} testID="ledtrad-detail-screen">
      <LinearGradient
        colors={config.colors}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="back-button">
          <ChevronLeft size={22} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
        <Text style={styles.headerEyebrow}>KANINENS CYKELFEST 2026</Text>
        <Text style={styles.headerTitle}>Ledtrådar {config.label}</Text>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}>
        {loading ? (
          <View style={styles.centerState} testID="loading-indicator">
            <ActivityIndicator color="#7A6B55" />
          </View>
        ) : clues.length === 0 ? (
          <View style={styles.centerState} testID="empty-state">
            <Text style={styles.lockEmoji}>🔒</Text>
            <Text style={styles.emptyTitle}>Inga ledtrådar ännu</Text>
            <Text style={styles.emptySub}>Ledtrådar aktiveras av kaninen under kvällen.</Text>
          </View>
        ) : visibleClues.length === 0 ? (
          <View style={styles.centerState} testID="locked-state">
            <Text style={styles.lockEmoji}>🔒</Text>
            <Text style={styles.emptyTitle}>Ledtrådar är låsta</Text>
            <Text style={styles.emptySub}>Kaninen aktiverar dem snart.</Text>
          </View>
        ) : (
          <>
            {visibleClues.map((clue, index) => (
              <View key={clue.id} style={styles.clueCard} testID={`clue-card-${index}`}>
                <View style={styles.clueNumberBadge}>
                  <Text style={styles.clueNumber}>{index + 1}</Text>
                </View>
                <View style={styles.clueContent}>
                  <Text style={styles.clueTitle}>{clue.title}</Text>
                  <Text style={styles.clueBody}>{clue.body}</Text>
                </View>
              </View>
            ))}
            {hasLocked ? (
              <View style={styles.moreLockedCard} testID="more-locked-card">
                <Lock size={16} color="#9A8E78" />
                <Text style={styles.moreLockedText}>Fler ledtrådar aktiveras under kvällen</Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E5DFD1' },
  header: { paddingBottom: 28, paddingHorizontal: 22 },
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
  headerEyebrow: { fontFamily: 'SpaceMono_400Regular', fontSize: 10, letterSpacing: 2, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  headerTitle: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 26, color: '#F5EFE0', lineHeight: 30 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 14, paddingBottom: 40 },
  centerState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  lockEmoji: { fontSize: 48 },
  emptyTitle: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 22, color: '#2A2A2A' },
  emptySub: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: '#7A7060', textAlign: 'center' },
  clueCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  clueNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2A6B64',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  clueNumber: { fontFamily: 'DMSans_700Bold', fontSize: 14, color: '#fff' },
  clueContent: { flex: 1 },
  clueTitle: { fontFamily: 'DMSans_700Bold', fontSize: 15, color: '#2A2A2A', marginBottom: 6 },
  clueBody: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: '#5A4E3A', lineHeight: 21 },
  moreLockedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EAE4D4',
    borderRadius: 10,
    padding: 14,
    justifyContent: 'center',
  },
  moreLockedText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: '#9A8E78' },
});
