import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/lib/api/api';
import { useAppStore } from '@/lib/state/store';

function pollVoteKey(pollId: string) {
  return `poll_voted_choice_${pollId}`;
}

interface NewsItem {
  id: string;
  title: string;
  body: string;
  type: string;
  createdAt: string;
  pollId?: string | null;
}

interface Poll {
  id: string;
  question: string;
  options: string;
  correctAnswer: number | null;
  votes: { optionIndex: number; participantId: string }[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()} ${['januari','februari','mars','april','maj','juni','juli','augusti','september','oktober','november','december'][d.getMonth()]} ${d.getFullYear()}`;
}

function getEmoji(type: string): string {
  if (type === 'viktig') return '🐇';
  if (type === 'omrostning') return '🗳️';
  if (type === 'nyhet') return '🐇';
  return '🐇';
}

export default function NyhetDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const participant = useAppStore((s) => s.participant);

  const [item, setItem] = useState<NewsItem | null>(null);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [choice, setChoice] = useState<number | null>(null);
  const [voted, setVoted] = useState(false);
  const [localVotes, setLocalVotes] = useState<Poll['votes']>([]);

  useEffect(() => {
    (async () => {
      try {
        const [newsData, pollsData] = await Promise.all([
          api.get<NewsItem[]>('/api/cykelfest/news'),
          api.get<Poll[]>('/api/cykelfest/polls'),
        ]);
        const found = (newsData ?? []).find((n) => n.id === id);
        if (found) {
          setItem(found);
          if (found.type === 'omrostning') {
            const matchedPoll = found.pollId
              ? (pollsData ?? []).find((p) => p.id === found.pollId)
              : (pollsData ?? []).find((p) => p.correctAnswer === null && p.question === found.title);
            if (matchedPoll) {
              setPoll(matchedPoll);
              setLocalVotes(matchedPoll.votes ?? []);
              const saved = await AsyncStorage.getItem(pollVoteKey(matchedPoll.id));
              if (saved !== null) {
                setChoice(parseInt(saved, 10));
                setVoted(true);
              }
            }
          }
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function handleVote() {
    if (!poll || choice === null) return;
    try {
      if (participant) {
        await api.post(`/api/cykelfest/polls/${poll.id}/vote`, {
          participantId: participant.id,
          optionIndex: choice,
        });
        // Refresh poll votes
        const updated = await api.get<Poll[]>('/api/cykelfest/polls');
        const updatedPoll = (updated ?? []).find((p) => p.id === poll.id);
        if (updatedPoll) setLocalVotes(updatedPoll.votes ?? []);
      }
      await AsyncStorage.setItem(pollVoteKey(poll.id), String(choice));
      setVoted(true);
    } catch (e) {
      console.error('Vote error', e);
    }
  }

  return (
    <View style={styles.root}>
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
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ChevronLeft size={22} color="#A8D4B8" strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerTextBlock}>
          <Text style={styles.headerTitle}>Meddelande från kaninen</Text>
          <Text style={styles.headerSubtitle}>Kaninens Cykelfest 2026</Text>
        </View>
      </LinearGradient>

      {/* CONTENT */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="small" color="#1C4F4A" />
          </View>
        ) : error || !item ? (
          <View style={styles.centerState}>
            <Text style={styles.emptyText}>Kunde inte hämta meddelandet.</Text>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {/* Nyhetskort — dölj för omröstning (visas i pollCard istället) */}
            {item.type !== 'omrostning' ? <View style={styles.card}>
              <View style={styles.topRow}>
                <View style={[styles.emojiWrap, item.type === 'omrostning' && styles.emojiWrapVote]}>
                  <Text style={styles.emoji}>{getEmoji(item.type)}</Text>
                </View>
                <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <View style={[
                styles.typeChip,
                item.type === 'viktig' && { backgroundColor: '#FFF0D0' },
                item.type === 'omrostning' && { backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#C7D2FE' },
                item.type !== 'viktig' && item.type !== 'omrostning' && { backgroundColor: '#E0F0E8' },
              ]}>
                <Text style={[
                  styles.typeChipText,
                  item.type === 'viktig' && { color: '#A05800' },
                  item.type === 'omrostning' && { color: '#5B21B6' },
                  item.type !== 'viktig' && item.type !== 'omrostning' && { color: '#2A6B64' },
                ]}>
                  {item.type === 'viktig' ? 'Viktig' : item.type === 'omrostning' ? 'Rösta' : 'Nyhet'}
                </Text>
              </View>
              {item.body.length > 0 ? (
                <Text style={styles.body}>{item.body}</Text>
              ) : null}
            </View> : null}

            {/* Omröstningskort */}
            {item.type === 'omrostning' && poll ? (
              <LinearGradient
                colors={['#3D2B6B', '#2A1A52']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.pollCard}
              >
                <Text style={styles.pollLabel}>🗳️ OMRÖSTNING</Text>
                <Text style={styles.pollQuestion}>{poll.question}</Text>
                {item.body.length > 0 ? (
                  <Text style={styles.pollBody}>{item.body}</Text>
                ) : null}

                {voted ? (
                  // Visa staplar
                  <View style={styles.pollOptions}>
                    {((() => { try { return JSON.parse(poll.options) as string[]; } catch { return []; } })()).map((opt, i) => {
                      const total = localVotes.length;
                      const count = localVotes.filter((v) => v.optionIndex === i).length;
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                      const isMyVote = choice === i;
                      return (
                        <View key={i} style={[styles.pollOption, isMyVote && styles.pollOptionVoted]}>
                          <View style={styles.pollBarLabelRow}>
                            <Text style={[styles.pollOptionText, isMyVote && styles.pollOptionTextVoted]}>
                              {opt}
                            </Text>
                            <Text style={styles.pollBarPct}>{pct}%</Text>
                          </View>
                          <View style={styles.pollBarBg}>
                            <View style={[styles.pollBarFill, isMyVote && styles.pollBarFillMine, { width: `${pct}%` as any }]} />
                          </View>
                        </View>
                      );
                    })}
                    <Text style={styles.pollVoteCount}>{localVotes.length} har röstat</Text>
                    <TouchableOpacity
                      style={styles.pollVoteBtn}
                      onPress={() => { setVoted(false); setChoice(null); if (poll) AsyncStorage.removeItem(pollVoteKey(poll.id)); }}
                    >
                      <Text style={styles.pollVoteBtnText}>Rösta igen</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  // Visa alternativknappar
                  <View style={styles.pollOptions}>
                    {((() => { try { return JSON.parse(poll.options) as string[]; } catch { return []; } })()).map((opt, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[styles.pollOption, choice === i && styles.pollOptionVoted]}
                        onPress={() => setChoice(i)}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.pollOptionText}>{opt}</Text>
                      </TouchableOpacity>
                    ))}
                    <View style={styles.pollFooter}>
                      <Text style={styles.pollVoteCount}>{localVotes.length} har röstat</Text>
                      <TouchableOpacity
                        style={[styles.pollVoteBtn, choice === null && styles.pollVoteBtnDisabled]}
                        onPress={handleVote}
                        disabled={choice === null}
                      >
                        <Text style={styles.pollVoteBtnText}>Rösta ✓</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </LinearGradient>
            ) : null}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#E5DFD1' },
  header: { paddingHorizontal: 20, paddingBottom: 20, position: 'relative', overflow: 'hidden' },
  headerTexture: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  textureStripe: {
    position: 'absolute', top: -200, bottom: -200, width: 1,
    backgroundColor: 'rgba(255,255,255,0.022)', transform: [{ rotate: '-55deg' }],
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(168,212,184,0.15)', alignItems: 'center', justifyContent: 'center',
    marginBottom: 14, borderWidth: 1, borderColor: 'rgba(168,212,184,0.2)',
  },
  headerTextBlock: { gap: 3 },
  headerTitle: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 26, color: '#F5EFE0', lineHeight: 30 },
  headerSubtitle: {
    fontFamily: 'SpaceMono_400Regular', fontSize: 9.5, color: 'rgba(168,212,184,0.7)',
    letterSpacing: 1.4, textTransform: 'uppercase', marginTop: 2,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 20, paddingHorizontal: 16 },
  centerState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: '#9A8E78' },
  card: {
    backgroundColor: '#fff', borderRadius: 16, borderWidth: 1.5,
    borderColor: '#E8E0CC', padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  emojiWrap: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#F5F1E8',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EDE6D6',
  },
  emojiWrapVote: { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' },
  emoji: { fontSize: 20 },
  date: { fontFamily: 'SpaceMono_400Regular', fontSize: 9, color: '#9A8E78', letterSpacing: 0.3 },
  title: { fontFamily: 'DMSans_600SemiBold', fontSize: 18, color: '#1C1C1C', lineHeight: 24, marginBottom: 12 },
  body: { fontFamily: 'DMSans_400Regular', fontSize: 15, color: '#4A4035', lineHeight: 24 },
  typeChip: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 12 },
  typeChipText: { fontFamily: 'DMSans_500Medium', fontSize: 10 },

  // Poll
  pollCard: { borderRadius: 14, padding: 18, gap: 4 },
  pollLabel: { fontFamily: 'SpaceMono_400Regular', fontSize: 9, color: 'rgba(168,212,184,0.7)', letterSpacing: 1, marginBottom: 4 },
  pollQuestion: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 17, color: '#F5EFE0', lineHeight: 23, marginBottom: 14 },
  pollOptions: { gap: 8 },
  pollOption: {
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  pollOptionVoted: { backgroundColor: 'rgba(168,212,184,0.2)', borderColor: '#A8D4B8' },
  pollOptionText: { fontFamily: 'DMSans_400Regular', fontSize: 13.5, color: '#F5EFE0' },
  pollOptionTextVoted: { fontFamily: 'DMSans_600SemiBold', color: '#A8D4B8' },
  pollBarLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pollBarPct: { fontFamily: 'SpaceMono_400Regular', fontSize: 10, color: 'rgba(168,212,184,0.8)', marginLeft: 8 },
  pollBarBg: { height: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', marginTop: 6 },
  pollBarFill: { height: 5, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 3 },
  pollBarFillMine: { backgroundColor: '#A8D4B8' },
  pollFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  pollVoteCount: { fontFamily: 'SpaceMono_400Regular', fontSize: 9.5, color: 'rgba(168,212,184,0.6)' },
  pollVoteBtn: { backgroundColor: '#A8D4B8', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  pollVoteBtnDisabled: { opacity: 0.35 },
  pollVoteBtnText: { fontFamily: 'DMSans_600SemiBold', fontSize: 12.5, color: '#1C4F4A' },
  pollBody: { fontFamily: 'DMSans_400Regular', fontSize: 13.5, color: 'rgba(245,239,224,0.75)', lineHeight: 20, marginBottom: 8 },
});
