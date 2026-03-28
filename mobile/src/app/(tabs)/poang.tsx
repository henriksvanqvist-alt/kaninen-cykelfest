import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions, RefreshControl, TouchableOpacity, type DimensionValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useAppStore } from '@/lib/state/store';
import { useData } from '@/lib/hooks/useData';
import { Lock } from 'lucide-react-native';
import type { Score, Team } from '@/lib/state/store';

const TEAM_THEMES: Record<string, { emoji: string; color: string }> = {
  Charter:            { emoji: '✈️',  color: '#F1C40F' },
  Safari:             { emoji: '🦁',  color: '#E67E22' },
  Fjällvandring:      { emoji: '🏔️',  color: '#1ABC9C' },
  Tågluff:            { emoji: '🚂',  color: '#3498DB' },
  Camping:            { emoji: '⛺',  color: '#27AE60' },
  Träningsresa:       { emoji: '🏋',  color: '#E74C3C' },
  Backpacking:        { emoji: '🎒',  color: '#9B59B6' },
  Kryssning:          { emoji: '🚢',  color: '#2980B9' },
  Alpresa:            { emoji: '🎿',  color: '#BDC3C7' },
  'Club 33':          { emoji: '🍹',  color: '#E91E63' },
};

const MOCK_PHASE_IDS = ['deltavling-1', 'deltavling-2', 'deltavling-3'];

// Fixed dummy scores per team: [D1, D2, D3]
const MOCK_SCORES_TABLE: Record<string, [number, number, number]> = {
  Charter:       [25, 30, 20],
  Safari:        [20, 25, 30],
  Fjällvandring: [30, 15, 25],
  Tågluff:       [15, 20, 25],
  Camping:       [20, 10, 15],
};

function buildMockData(): { teams: Team[]; scores: Score[] } {
  const teamNames = Object.keys(MOCK_SCORES_TABLE);
  const mockTeams: Team[] = teamNames.map((name, i) => ({
    id: `mock-team-${i}`,
    name,
    theme: null,
    hostAddress: null,
    color: TEAM_THEMES[name]?.color ?? '#888',
  }));

  const mockScores: Score[] = [];
  let scoreId = 0;
  mockTeams.forEach((team) => {
    const pts = MOCK_SCORES_TABLE[team.name] ?? [10, 10, 10];
    MOCK_PHASE_IDS.forEach((phaseId, pi) => {
      mockScores.push({
        id: `mock-score-${scoreId++}`,
        teamId: team.id,
        phaseId,
        points: pts[pi] ?? 10,
        reason: null,
        awardedAt: new Date().toISOString(),
      });
    });
  });
  return { teams: mockTeams, scores: mockScores };
}

type TeamRow = {
  id: string;
  name: string;
  emoji: string;
  dotColor: string;
  phasePoints: (number | null)[];
  total: number;
};

function buildRows(
  teams: Team[],
  scores: Score[],
  phaseIds: string[],
): TeamRow[] {
  return teams.map((team) => {
    const teamScores = scores.filter((s) => s.teamId === team.id);
    const themeData = TEAM_THEMES[team.name] ?? { emoji: '🌍', color: team.color ?? '#A8D4B8' };
    const phasePoints: (number | null)[] = phaseIds.map((phaseKey) => {
      const found = teamScores.filter((s) => s.reason === phaseKey);
      if (found.length === 0) return null;
      return found.reduce((acc, s) => acc + s.points, 0);
    });
    const total = teamScores
      .filter((s) => s.reason != null && s.reason.startsWith('deltavling-'))
      .reduce((acc, s) => acc + s.points, 0);
    return {
      id: team.id,
      name: team.name,
      emoji: themeData.emoji,
      dotColor: themeData.color,
      phasePoints,
      total,
    };
  }).sort((a, b) => b.total - a.total);
}

const RANK_MEDAL_COLOR: Record<number, string> = { 1: '#D4AF37', 2: '#A8A9AD', 3: '#CD7F32' };
const CARD_BG: Record<number, string> = {
  1: '#FFFBF0',
  2: '#F8F8F8',
  3: '#FFF8F0',
};
const CARD_BORDER: Record<number, string> = {
  1: '#D4AF37',
  2: '#C0C0C0',
  3: '#CD7F32',
};

type TeamCardProps = {
  row: TeamRow;
  rank: number;
  cardWidth: DimensionValue;
  phaseLabel: string;
};

function SkeletonGrid({ cardWidth }: { cardWidth: DimensionValue }) {
  const pulseOpacity = useSharedValue(0.3);
  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 800 }),
        withTiming(0.3, { duration: 800 })
      ),
      -1,
      false
    );
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulseOpacity.value }));

  return (
    <>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Animated.View
          key={i}
          style={[
            styles.card,
            {
              width: cardWidth,
              backgroundColor: '#D8D2C5',
              borderColor: '#C8C2B5',
              borderWidth: 1,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14,
              paddingVertical: 10,
            },
            pulseStyle,
          ]}
          testID={`skeleton-card-${i}`}
        >
          <View style={{ width: 28, height: 16, borderRadius: 4, backgroundColor: '#B8B2A5', marginRight: 8 }} />
          <View style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#B8B2A5', marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <View style={{ width: '60%', height: 12, borderRadius: 4, backgroundColor: '#B8B2A5', marginBottom: 6 }} />
            <View style={{ width: '80%', height: 10, borderRadius: 4, backgroundColor: '#B8B2A5' }} />
          </View>
          <View style={{ width: 50, height: 20, borderRadius: 4, backgroundColor: '#B8B2A5' }} />
        </Animated.View>
      ))}
    </>
  );
}

function TeamCard({ row, rank, cardWidth, phaseLabel }: TeamCardProps) {
  const isTop3 = rank <= 3;
  const isLeader = rank === 1;
  const bg = isTop3 ? CARD_BG[rank] : '#FFFFFF';
  const borderColor = isTop3 ? CARD_BORDER[rank] : '#E8E0CC';
  const borderWidth = isTop3 ? 2 : 1;
  const rankColor = isTop3 ? RANK_MEDAL_COLOR[rank] : '#B0A898';

  const animatedScore = row.total;

  return (
    <View
      style={[
        styles.card,
        {
          width: cardWidth,
          backgroundColor: bg,
          borderColor,
          borderWidth,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
          paddingVertical: 10,
          minHeight: 0,
        },
        isLeader && styles.cardLeader,
      ]}
      testID={`leaderboard-card-${rank}`}
    >
      {/* Rank circle */}
      <View style={[styles.podiumMedalWrap, {
        borderColor: isTop3 ? rankColor : '#C8BEA4',
        backgroundColor: isTop3 ? '#fff' : '#F5EFE0',
        marginBottom: 0,
        marginRight: 10,
      }]}>
        <Text style={[styles.podiumMedalText, { color: isTop3 ? rankColor : '#7A6E5C' }]}>{rank}</Text>
      </View>

      {/* Emoji */}
      <Text style={[styles.cardEmoji, { fontSize: 26, marginRight: 10, marginVertical: 0 }]}>{row.emoji}</Text>

      {/* Name only */}
      <View style={{ flex: 1 }}>
        <Text style={[styles.cardTeamName, { fontSize: 13 }]} numberOfLines={1}>{row.name}</Text>
      </View>

      {/* Total score */}
      <Text style={[styles.cardTotal, isLeader && styles.cardTotalLeader, { fontSize: 18 }]}>
        {animatedScore} <Text style={[styles.cardTotal, isLeader && styles.cardTotalLeader, { fontSize: 18 }]}>poäng</Text>
      </Text>
    </View>
  );
}

// Podium heights
const PODIUM_HEIGHTS: Record<number, number> = { 1: 108, 2: 88, 3: 74 };
// Podium order: 2nd left, 1st center, 3rd right
const PODIUM_ORDER = [1, 0, 2]; // indices into top3 rows (0-indexed)

type PodiumProps = {
  rows: TeamRow[];
};

function Podium({ rows }: PodiumProps) {
  const top3 = rows.slice(0, 3);
  // Podium display order: 2nd place (index 1), 1st place (index 0), 3rd place (index 2)
  const displayOrder = [top3[1], top3[0], top3[2]];
  const rankOrder = [2, 1, 3];

  return (
    <View style={styles.podiumContainer}>
      {displayOrder.map((row, i) => {
        if (!row) return null;
        const rank = rankOrder[i];
        const height = PODIUM_HEIGHTS[rank] ?? 45;
        const podiumColor = rank === 1 ? '#B8960A' : rank === 2 ? '#7A7F88' : '#A85E18';
        const medalColor = rank === 1 ? '#D4AF37' : rank === 2 ? '#A8A9AD' : '#CD7F32';

        return (
          <View key={row.id} style={[styles.podiumColumn, rank === 1 && { marginBottom: 0 }]}>
            {/* Emoji above */}
            <Text style={styles.podiumEmoji}>{row.emoji}</Text>

            {/* Team name directly above podium */}
            <Text style={styles.podiumTeamName} numberOfLines={2}>{row.name}</Text>

            {/* Medal circle sits just above the block, flows in layout */}
            <View style={{ width: '100%', alignItems: 'center' }}>
              <View style={[styles.podiumMedalWrap, { borderColor: medalColor, marginBottom: -15, zIndex: 1 }]}>
                <Text style={[styles.podiumMedalText, { color: medalColor }]}>{rank}</Text>
              </View>
              <View style={[styles.podiumBlock, { height, backgroundColor: podiumColor, width: '100%', paddingTop: 20, justifyContent: 'center' }]}>
                <Text style={styles.podiumBlockScore}>{row.total}</Text>
                <Text style={styles.podiumBlockScoreLabel}>poäng</Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function PoangScreen() {
  const insets = useSafeAreaInsets();
  const storeScores = useAppStore((s) => s.scores);
  const storeTeams = useAppStore((s) => s.teams);
  const phases = useAppStore((s) => s.phases);
  const { width: screenWidth } = useWindowDimensions();
  const { isLoading, error, refetch } = useData();

  const DEBUG_SHOW_SCORES = true;
  const isUnlocked =
    DEBUG_SHOW_SCORES ||
    phases.some((p) => p.name === 'aktivitet_1' && p.unlockedAt != null);

  // Använd riktiga lag alltid om de finns, mockdata bara om inga lag finns alls
  const useMock = storeTeams.length === 0;
  const mock = useMock ? buildMockData() : { teams: storeTeams, scores: storeScores };
  const activeTeams = mock.teams;
  const activeScores = mock.scores;

  // Collect unique phase keys from scores — use reason field as discriminator
  const allPhaseIds = Array.from(
    new Set(activeScores.map((s) => s.reason).filter((r): r is string => !!r && r.startsWith('deltavling-'))),
  ).sort();
  const phaseIds = allPhaseIds.length > 0 ? allPhaseIds.slice(0, 3) : MOCK_PHASE_IDS;

  const rows = buildRows(activeTeams, activeScores, phaseIds);

  const completedCount = allPhaseIds.length > 0 ? Math.min(allPhaseIds.length, 3) : 1;
  const phaseLabel = completedCount === 1
    ? 'Leaderboard efter en deltävling'
    : completedCount === 2
    ? 'Leaderboard efter två deltävlingar'
    : 'Leaderboard efter tre deltävlingar';

  // Single-column layout: full width minus padding
  const GRID_PADDING = 12;
  const cardWidth = '100%' as const;

  const restRows = rows.slice(3);

  if (!isUnlocked) {
    return (
      <View style={styles.container} testID="poang-screen">
        <LinearGradient colors={['#1C4F4A', '#2A6B64']} style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.headerEyebrow}>KANINENS CYKELFEST 2026</Text>
          <Text style={styles.headerTitle}>Leaderboard</Text>
        </LinearGradient>
        <View style={styles.lockContent}>
          <View style={styles.lockCard}>
            <Lock size={36} color="#1C4F4A" />
            <Text style={styles.lockTitle}>Aktiveras vid Aktivitet 1</Text>
            <Text style={styles.lockSub}>
              Poängtavlan öppnas när Aktivitet 1 börjar. Lagnamnen avslöjas då
              också!
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="poang-screen">
      <LinearGradient colors={['#1C4F4A', '#2A6B64']} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerEyebrow}>KANINENS CYKELFEST 2026</Text>
        <Text style={styles.headerTitle}>Leaderboard</Text>
      </LinearGradient>

      {error ? (
        <View style={styles.errorContainer} testID="error-view">
          <Text style={styles.errorText}>Kunde inte hämta data</Text>
          <TouchableOpacity onPress={refetch} style={styles.errorBtn} testID="retry-button">
            <Text style={styles.errorBtnText}>Försök igen</Text>
          </TouchableOpacity>
        </View>
      ) : (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 16 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor="#1C4F4A"
            colors={['#1C4F4A']}
          />
        }
      >
        {/* Skeleton when loading with no data yet */}
        {isLoading && rows.length === 0 ? (
          <SkeletonGrid cardWidth={cardWidth} />
        ) : (
          <>
            {/* Podium for top 3 */}
            {rows.length >= 2 ? (
              <View style={styles.podiumSection}>
                <Podium rows={rows} />
              </View>
            ) : null}

            {/* Remaining teams (4+) as card list */}
            {restRows.length > 0 ? (
              <View style={{ marginTop: 12, gap: 8 }}>
                <Text style={styles.restLabel}>ÖVRIGA LAG</Text>
                {restRows.map((row, index) => {
                  const rank = index + 4;
                  return (
                    <TeamCard
                      key={row.id}
                      row={row}
                      rank={rank}
                      cardWidth={cardWidth}
                      phaseLabel={phaseLabel}
                    />
                  );
                })}
              </View>
            ) : rows.length > 0 && rows.length <= 3 ? (
              // If 3 or fewer teams, show full list as cards too
              <View style={{ marginTop: 12, gap: 8 }}>
                {rows.map((row, index) => {
                  const rank = index + 1;
                  return (
                    <TeamCard
                      key={row.id}
                      row={row}
                      rank={rank}
                      cardWidth={cardWidth}
                      phaseLabel={phaseLabel}
                    />
                  );
                })}
              </View>
            ) : null}

            {/* Phase label at the bottom */}
            <Text style={[styles.cardPhaseLabel, { textAlign: 'center', marginTop: 8, fontSize: 11 }]}>{phaseLabel}</Text>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E5DFD1' },

  header: {
    paddingTop: 8,
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
  },

  scroll: { flex: 1 },
  scrollContent: { padding: 12, gap: 8 },

  // Podium
  podiumSection: {
    marginBottom: 8,
  },
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 8,
    gap: 8,
  },
  podiumColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  podiumEmoji: {
    fontSize: 26,
    marginBottom: 2,
  },
  podiumTeamName: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
    color: '#2A2A2A',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 14,
    width: '100%',
  },
  podiumMedalWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    backgroundColor: '#fff',
  },
  podiumMedalText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 16,
  },
  podiumBlock: {
    width: '100%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  podiumBlockScore: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 24,
    color: '#1A1A1A',
    lineHeight: 28,
  },
  podiumBlockScoreLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: 'rgba(0,0,0,0.55)',
  },

  restLabel: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9,
    letterSpacing: 1.5,
    color: '#9A8E78',
    marginBottom: 4,
    marginLeft: 2,
  },

  // Grid layout (kept for reference, unused)
  gridRow: {
    flexDirection: 'row',
    gap: 8,
  },

  // Team card
  card: {
    borderRadius: 14,
    marginBottom: 0,
  },
  cardLeader: {
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  cardRank: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 12,
  },
  cardEmoji: {
    fontSize: 22,
    marginTop: 1,
    marginBottom: 1,
  },
  cardTeamName: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
    color: '#2A2A2A',
    lineHeight: 15,
    marginBottom: 2,
  },
  cardTotal: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 24,
    color: '#1C1C1C',
    lineHeight: 28,
  },
  cardTotalLeader: {
    color: '#1C4F4A',
  },
  cardTotalLabel: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 7,
    letterSpacing: 1.2,
    color: '#9A8E78',
    marginBottom: 6,
  },

  // Phase points row inside card
  cardPhaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EDE7DA',
    paddingTop: 8,
    marginTop: 2,
  },
  cardPhaseItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  cardPhaseDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#EDE7DA',
  },
  cardPhaseLabel: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 8,
    letterSpacing: 1,
    color: '#9A8E78',
  },
  cardPhaseValue: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 11,
    color: '#5A5040',
  },
  cardPhaseEmpty: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: '#C5BEB0',
  },

  // Legend
  legend: {
    marginTop: 2,
    alignItems: 'center',
  },
  legendText: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9,
    color: '#9A8E78',
    letterSpacing: 0.5,
  },

  // Lock screen
  lockContent: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  lockCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
    borderWidth: 1.5,
    borderColor: '#E8E0CC',
    alignItems: 'center',
    gap: 12,
  },
  lockTitle: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 20,
    color: '#2A2A2A',
    textAlign: 'center',
  },
  lockSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: '#7A7060',
    textAlign: 'center',
    lineHeight: 19,
  },

  // Error state
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  errorText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: '#7A7060',
    textAlign: 'center',
  },
  errorBtn: {
    backgroundColor: '#1C4F4A',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  errorBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: '#A8D4B8',
  },
});
