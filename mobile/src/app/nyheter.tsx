import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/lib/api/api';

const READ_KEY = 'read_news_ids';

interface NewsItem {
  id: string;
  title: string;
  body: string;
  type: string;
  createdAt: string;
}

function newsDateParts(dateStr: string): { day: string; month: string } {
  const d = new Date(dateStr);
  const month = ['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec'][d.getMonth()];
  return { day: String(d.getDate()), month };
}

function isNew(dateStr: string): boolean {
  return true;
}

export default function NyheterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    AsyncStorage.getItem(READ_KEY).then((val) => {
      if (val) setReadIds(new Set(JSON.parse(val)));
    });
    api.get<NewsItem[]>('/api/cykelfest/news')
      .then((data) => {
        const sorted = [...(data ?? [])].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setNews(sorted);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const markRead = async (id: string) => {
    const next = new Set([...readIds, id]);
    setReadIds(next);
    await AsyncStorage.setItem(READ_KEY, JSON.stringify([...next]));
  };
  return (
    <View style={styles.root} testID="nyheter-screen">
      {/* HEADER */}
      <LinearGradient
        colors={['#1a4a45', '#0a2220']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        {/* Subtle diagonal texture stripes */}
        <View style={styles.headerTexture} pointerEvents="none">
          {Array.from({ length: 20 }).map((_, i) => (
            <View key={i} style={[styles.textureStripe, { left: i * 28 - 120 }]} />
          ))}
        </View>

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
          testID="back-button"
        >
          <ChevronLeft size={22} color="#A8D4B8" strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.headerTextBlock}>
          <Text style={styles.headerTitle}>Meddelande från kaninen</Text>
          <Text style={styles.headerSubtitle}>Kaninens Cykelfest 2026</Text>
        </View>
      </LinearGradient>

      {/* CONTENT */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centerState} testID="loading-indicator">
            <ActivityIndicator size="small" color="#1C4F4A" />
          </View>
        ) : error ? (
          <View style={styles.centerState} testID="error-view">
            <Text style={styles.emptyText}>Kunde inte hämta nyheter.</Text>
            <TouchableOpacity
              onPress={() => {
                setLoading(true);
                setError(false);
                api.get<NewsItem[]>('/api/cykelfest/news')
                  .then((data) => {
                    const sorted = [...(data ?? [])].sort(
                      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    );
                    setNews(sorted);
                  })
                  .catch(() => setError(true))
                  .finally(() => setLoading(false));
              }}
              style={styles.retryBtn}
              testID="retry-button"
            >
              <Text style={styles.retryBtnText}>Försök igen</Text>
            </TouchableOpacity>
          </View>
        ) : news.length === 0 ? (
          <View style={styles.centerState} testID="empty-view">
            <Text style={styles.emptyText}>Inga nyheter ännu.</Text>
          </View>
        ) : (
          <View style={styles.cardList}>
            {news.map((item, index) => {
              const showBadge = isNew(item.createdAt) && !readIds.has(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.card}
                  activeOpacity={0.6}
                  onPress={() => {
                    markRead(item.id);
                    router.push(`/nyhet/${item.id}` as any);
                  }}
                  testID={`news-item-${item.id}`}
                >
                  {index > 0 ? <View style={styles.cardDivider} /> : null}
                  <View style={styles.cardRow}>
                    <View style={styles.dateBadge}>
                      <Text style={styles.dateBadgeDay}>{newsDateParts(item.createdAt).day}</Text>
                      <Text style={styles.dateBadgeMonth}>{newsDateParts(item.createdAt).month}</Text>
                    </View>
                    <View style={styles.cardContent}>
                      <View style={styles.cardTitleRow}>
                        {showBadge ? <View style={styles.newDot} /> : null}
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        <View style={item.type === 'viktig' ? styles.chipViktig : item.type === 'omrostning' ? styles.voteChip : item.type === 'info' ? styles.chipInfo : styles.chipNyhet}>
                          <Text style={item.type === 'viktig' ? styles.chipViktigText : item.type === 'omrostning' ? styles.voteChipText : item.type === 'info' ? styles.chipInfoText : styles.chipNyhetText}>
                            {item.type === 'viktig' ? 'Viktig' : item.type === 'omrostning' ? 'Rösta' : item.type === 'info' ? 'Info' : 'Nyhet'}
                          </Text>
                        </View>
                      </View>
                      {item.body.length > 0 ? (
                        <Text style={styles.cardBody} numberOfLines={2}>{item.body}</Text>
                      ) : null}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
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
    paddingBottom: 20,
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
    gap: 3,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 16,
  },

  // STATES
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: '#9A8E78',
  },

  retryBtn: {
    marginTop: 12,
    backgroundColor: '#1C4F4A',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: '#A8D4B8',
  },

  // CARD LIST
  cardList: {
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
  card: {
    // Each card is a section inside the white container
  },
  cardLast: {
    // No extra style needed — dividers handle separation
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F0EAD8',
    marginHorizontal: 16,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  dateBadge: {
    width: 30,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBadgeDay: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: '#2A2A2A',
    lineHeight: 16,
  },
  dateBadgeMonth: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 8,
    color: '#9A8E78',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // EMOJI BADGE
  emojiWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F5F1E8',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderWidth: 1,
    borderColor: '#EDE6D6',
    position: 'relative',
  },
  emojiWrapVote: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  newDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E05A2B',
    flexShrink: 0,
    marginTop: 3,
  },
  emoji: {
    fontSize: 17,
  },

  // CARD TEXT
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 0,
  },
  cardTitle: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: '#2A2A2A',
    lineHeight: 19,
    flexShrink: 1,
  },
  voteChip: {
    backgroundColor: '#EEF2FF',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    flexShrink: 0,
  },
  voteChipText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 9,
    color: '#5B21B6',
  },
  chipNyhet: {
    backgroundColor: '#D4EDE4',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    flexShrink: 0,
  },
  chipNyhetText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 9,
    color: '#1C6B40',
  },
  chipViktig: {
    backgroundColor: '#FFE4B0',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    flexShrink: 0,
  },
  chipViktigText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 9,
    color: '#8A4400',
  },
  chipInfo: {
    backgroundColor: '#DEF0FF',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    flexShrink: 0,
  },
  chipInfoText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 9,
    color: '#1A5276',
  },
  cardBody: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: '#7A7060',
    lineHeight: 18,
    marginTop: 1,
  },
  cardDate: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9,
    color: '#9A8E78',
    marginTop: 5,
    letterSpacing: 0.3,
  },
});
