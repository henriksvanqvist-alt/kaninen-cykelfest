import React, { useEffect, useState } from 'react';
import { getDeviceVoterId } from '@/lib/deviceId';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Dimensions,
  TextInput,
  Platform,
  Linking,
} from 'react-native';
import { ChevronRight, Home } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/lib/state/store';
import { useData } from '@/lib/hooks/useData';
import { api } from '@/lib/api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';

const READ_KEY = 'read_news_ids';

function isNew(_dateStr: string): boolean {
  return true;
}

const { width: SCREEN_W } = Dimensions.get('window');


function PulsingDot() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.6, { duration: 800 }), withTiming(1, { duration: 800 })),
      -1
    );
    opacity.value = withRepeat(
      withSequence(withTiming(0.4, { duration: 800 }), withTiming(1, { duration: 800 })),
      -1
    );
  }, []);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  return <Animated.View style={[styles.pulsingDot, animStyle]} />;
}

function getTimeUntil(targetDate: Date): { days: number; hours: number; minutes: number } {
  const diff = Math.max(0, targetDate.getTime() - Date.now());
  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  return { days, hours, minutes };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()} ${['januari','februari','mars','april','maj','juni','juli','augusti','september','oktober','november','december'][d.getMonth()]}`;
}

function newsDateParts(dateStr: string): { day: string; month: string } {
  const d = new Date(dateStr);
  const month = ['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec'][d.getMonth()];
  return { day: String(d.getDate()), month };
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { error: dataError, refetch } = useData();
  const { isOffline } = useNetworkStatus();
  const news = useAppStore((s) => s.news);
  const videos = useAppStore((s) => s.videos);
  const allPolls = useAppStore((s) => s.polls);
  const polls = allPolls.filter((p) => p.correctAnswer !== null && p.correctAnswer !== undefined);
  const teams = useAppStore((s) => s.teams);
  const phases = useAppStore((s) => s.phases);
  const scores = useAppStore((s) => s.scores);
  const settings = useAppStore((s) => s.settings);

  const videoPlayer = useVideoPlayer(
    require('../../../assets/kaninen_dansar.mp4'),
    (player) => { player.loop = false; }
  );
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoIdx, setVideoIdx] = useState(0);
  const [aterkopplingDone, setAterkopplingDone] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('aterkoppling_done').then((val) => {
      setAterkopplingDone(val === 'true');
    });
  }, []);

  useEffect(() => {
    if (!videoPlaying) return;
    const interval = setInterval(() => {
      if (!videoPlayer?.playing) {
        setVideoPlaying(false);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [videoPlaying, videoPlayer]);

  // Compare dates as local YYYY-MM-DD strings to avoid UTC timezone offset issues
  const todayStr = (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}` })();
  const steg1Unlocked = settings['unlock_steg1'] ? todayStr >= settings['unlock_steg1'] : true;
  const steg2Unlocked = settings['unlock_steg2'] ? todayStr >= settings['unlock_steg2'] : true;
  const lagUnlocked = settings['unlock_ditt_lag']
    ? todayStr >= settings['unlock_ditt_lag']
    : false;
  const vardinfoUnlocked = settings['unlock_vardinfo']
    ? todayStr >= settings['unlock_vardinfo']
    : false;

  const safeDate = (val: string | undefined, fallback: string) => {
    if (!val) return fallback;
    const d = new Date(val.includes('T') ? val : val.replace(/-/g, '/'));
    return isNaN(d.getTime()) ? fallback : d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' });
  };

  const lagDateLabel = safeDate(settings['unlock_ditt_lag'], '20 april');
  const vardinfoDateLabel = safeDate(settings['unlock_vardinfo'], '20 april');
  const adressUnlocked = settings['unlock_steg5']
    ? todayStr >= settings['unlock_steg5']
    : false;
  const adressDateLabel = safeDate(settings['unlock_steg5'], 'festdagen');

  const nowStr = (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}T${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`; })();
  const aterkopplingUnlocked = settings['unlock_aterkoppling']
    ? nowStr >= settings['unlock_aterkoppling']
    : false;

  // Quiz state: track all answers by pollId
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [currentChoice, setCurrentChoice] = useState<number | null>(null);
  const [quizDone, setQuizDone] = useState(false);
  const [quizCollapsed, setQuizCollapsed] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    AsyncStorage.getItem(READ_KEY).then((val) => {
      if (val) setReadIds(new Set(JSON.parse(val)));
    });
  }, []);

  // Host assignment notification badge
  const [hostHasUpdate, setHostHasUpdate] = useState(false);

  useEffect(() => {
    async function checkHostUpdate() {
      try {
        const pin = await AsyncStorage.getItem('last_host_pin');
        if (!pin) return;
        const viewedAt = await AsyncStorage.getItem(`host_viewed_${pin}`);
        const result = await api.get<{ updatedAt: string }>(`/api/cykelfest/host-assignments/by-pin/${pin}`);
        const updatedAt = result?.updatedAt;
        if (!updatedAt) return;
        if (!viewedAt || new Date(updatedAt) > new Date(viewedAt)) {
          setHostHasUpdate(true);
        } else {
          setHostHasUpdate(false);
        }
      } catch {}
    }
    checkHostUpdate();
  }, []);

  // Fråga kaninen
  const [questionInput, setQuestionInput] = useState('');
  const [questionSending, setQuestionSending] = useState(false);
  const [faqHasNewAnswer, setFaqHasNewAnswer] = useState(false);

  useEffect(() => {
    async function checkNewAnswers() {
      try {
        const lastSeen = await AsyncStorage.getItem('faq_last_seen');
        const questions = await api.get<{ id: string; answeredAt: string | null }[]>('/api/cykelfest/questions');
        const hasNew = (questions ?? []).some(q =>
          q.answeredAt && (!lastSeen || new Date(q.answeredAt) > new Date(lastSeen))
        );
        setFaqHasNewAnswer(hasNew);
      } catch {}
    }
    checkNewAnswers();
  }, []);

  async function handleSendQuestion() {
    const text = questionInput.trim();
    if (!text || questionSending) return;
    setQuestionSending(true);
    try {
      await api.post<{ id: string; text: string; answer: string | null; createdAt: string }>(
        '/api/cykelfest/questions',
        { text }
      );
      setQuestionInput('');
    } catch {}
    setQuestionSending(false);
  }

  const FEST_DATE = new Date('2026-05-30T15:30:00');
  const [timeLeft, setTimeLeft] = useState(() => getTimeUntil(FEST_DATE));
  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeUntil(FEST_DATE)), 60000);
    return () => clearInterval(id);
  }, []);

  const [pollIdx, setPollIdx] = useState(0);
  const [pollVoteError, setPollVoteError] = useState<string | null>(null);
  const activePoll = polls[pollIdx] ?? polls[0] ?? null;
  const pollOptions: string[] = activePoll
    ? (() => { try { return JSON.parse(activePoll.options) as string[]; } catch { return []; } })()
    : [];
  const pollVotes = activePoll?.votes ?? [];
  const myVote = null; // votes tracked locally via userAnswers
  const totalVotes = pollVotes.length;
  const hasVoted = userAnswers[activePoll?.id ?? ''] !== undefined;

  const latestVideos = [...videos].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  const currentVideo = latestVideos[videoIdx] ?? null;

  useEffect(() => {
    if (!videoPlayer) return;
    setVideoPlaying(false);
    videoPlayer.pause();
    if (currentVideo?.url) {
      videoPlayer.replace({ uri: currentVideo.url });
    } else {
      videoPlayer.replace(require('../../../assets/kaninen_dansar.mp4'));
    }
  }, [currentVideo?.url]);

  async function handleVote(choice: number) {
    if (!activePoll) return;
    const newAnswers = { ...userAnswers, [activePoll.id]: choice };
    setUserAnswers(newAnswers);
    setPollVoteError(null);
    try {
      const voterId = await getDeviceVoterId();
      await api.post(`/api/cykelfest/polls/${activePoll.id}/vote`, {
        participantId: voterId,
        optionIndex: choice,
      });
    } catch (e) {
      console.error('Vote error:', e);
      setPollVoteError('Kunde inte spara rösten. Försök igen.');
    }
    return newAnswers;
  }

  const recentNews = [...news]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      testID="home-screen"
    >
      {/* ERROR BANNER */}
      {dataError ? (
        <View style={styles.errorBanner} testID="error-banner">
          <Text style={styles.errorBannerText}>Kunde inte hämta data</Text>
          <TouchableOpacity onPress={refetch} style={styles.errorBannerBtn}>
            <Text style={styles.errorBannerBtnText}>Försök igen</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {/* OFFLINE BANNER */}
      {isOffline ? (
        <View style={{ backgroundColor: '#C0392B', paddingVertical: 8, paddingHorizontal: 16, marginBottom: 8 }} testID="offline-banner">
          <Text style={{ color: '#fff', fontFamily: 'DMSans_400Regular', fontSize: 13, textAlign: 'center' }}>
            Ingen internetanslutning – data kan vara inaktuell
          </Text>
        </View>
      ) : null}
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTexture} pointerEvents="none">
          {Array.from({ length: 30 }).map((_, i) => (
            <View key={i} style={[styles.textureStripe, { left: i * 26 - 200 }]} />
          ))}
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.titleLine1}>Kaninens</Text>
          <Text style={styles.titleLine2}>Cykelfest</Text>
        </View>

        <View style={styles.themeBadge}>
          <Text style={styles.themeBadgeLabel}>TEMA  </Text>
          <Text style={styles.themeBadgeValue}>Semesterresor</Text>
        </View>

        <View style={{ position: 'relative' }}>
          <View style={styles.countdown}>
          {/* Datum-sida */}
          <View style={{ flex: 1 }}>
            <Text style={styles.countdownDateBig}>Lördag 30 maj</Text>
          </View>
          {/* Separator */}
          <View style={{ width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.12)' }} />
          {/* Nedräkning */}
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5 }}>
            <Text style={styles.countdownDateBig}>{timeLeft.days}</Text>
            <Text style={styles.countdownDateSmall}>DAGAR KVAR</Text>
          </View>
        </View>
        </View>
      </View>

      {/* VIDEO SECTION */}
      <Animated.View entering={FadeIn.delay(100)} style={styles.videoSection}>
        <View style={styles.videoCard}>
          <VideoView
            player={videoPlayer}
            style={StyleSheet.absoluteFill}
            nativeControls={false}
            contentFit="contain"
            testID="video-player"
          />
          <TouchableOpacity
            style={styles.playBtnOverlay}
            activeOpacity={videoPlaying ? 0.0 : 0.8}
            onPress={() => {
              if (videoPlaying) {
                videoPlayer?.pause();
                setVideoPlaying(false);
              } else {
                videoPlayer?.play();
                setVideoPlaying(true);
              }
            }}
          >
            {!videoPlaying && (
              <View style={styles.playCircle}>
                <Text style={styles.playIcon}>▶</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={[styles.nyttBadge, videoPlaying && { opacity: 0 }]}>
            <PulsingDot />
            <Text style={styles.nyttText}>NYTT</Text>
          </View>
        </View>

        <View style={styles.videoMeta}>
          <View style={styles.videoMetaLeft}>
            <Text style={styles.videoTitle} numberOfLines={1}>
              {currentVideo != null ? currentVideo.title : 'Kaninen dansar'}
            </Text>
            <Text style={styles.videoDuration}>
              {currentVideo != null
                ? (() => {
                    return currentVideo.durationSeconds != null ? `${Math.floor(currentVideo.durationSeconds / 60)}:${String(currentVideo.durationSeconds % 60).padStart(2, '0')}` : '0:42';
                  })()
                : '0:42'}
            </Text>
          </View>
          {latestVideos.length > 1 ? (
            <TouchableOpacity
              onPress={() => setVideoIdx((i) => (i + 1) % latestVideos.length)}
              testID="video-next-button"
            >
              <Text style={styles.videoCounter}>
                {videoIdx + 1} / {latestVideos.length} ▸
              </Text>
            </TouchableOpacity>
          ) : latestVideos.length === 1 ? (
            <Text style={styles.videoCounter}>1 / 1 ▸</Text>
          ) : null}
        </View>
      </Animated.View>

      {/* NYHETER */}
      <Animated.View entering={FadeIn.delay(150)} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>MEDDELANDE FRÅN KANINEN</Text>
          <TouchableOpacity onPress={() => router.push('/nyheter' as any)} testID="visa-allt-button">
            <Text style={styles.sectionLink}>Se alla →</Text>
          </TouchableOpacity>
        </View>
        {recentNews.length > 0 ? (
          <View style={styles.kalendariumCard}>
            {recentNews.slice(0, 3).map((item, index) => {
              const showBadge = isNew(item.createdAt) && !readIds.has(item.id);
              return (
                <React.Fragment key={item.id}>
                  {index > 0 ? <View style={styles.timelineDivider} /> : null}
                  <Pressable
                    style={styles.timelineRow}
                    onPress={async () => {
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      const next = new Set([...readIds, item.id]);
                      setReadIds(next);
                      await AsyncStorage.setItem(READ_KEY, JSON.stringify([...next]));
                      router.push(`/nyhet/${item.id}` as any);
                    }}
                    testID={`news-card-${item.id}`}
                  >
                    <View style={styles.newsDateBadge}>
                      <Text style={styles.newsDateDay}>{newsDateParts(item.createdAt).day}</Text>
                      <Text style={styles.newsDateMonth}>{newsDateParts(item.createdAt).month}</Text>
                    </View>
                    <View style={styles.timelineContent}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {showBadge ? <View style={styles.newsNewDot} /> : null}
                        <Text style={styles.timelineTitle} numberOfLines={2}>{item.title}</Text>
                      </View>
                    </View>
                    <View style={styles.timelineRowRight}>
                      <View style={item.type === 'viktig' ? styles.newsChipViktig : item.type === 'omrostning' ? styles.newsChipOmrostning : item.type === 'info' ? styles.newsChipInfo : styles.newsChipNyhet}>
                        <Text style={item.type === 'viktig' ? styles.newsChipViktigText : item.type === 'omrostning' ? styles.newsChipOmrostningText : item.type === 'info' ? styles.newsChipInfoText : styles.newsChipNyhetText}>
                          {item.type === 'viktig' ? 'Viktig' : item.type === 'omrostning' ? 'Rösta' : item.type === 'info' ? 'Info' : 'Nyhet'}
                        </Text>
                      </View>
                      <ChevronRight size={14} color="rgba(255,255,255,0.4)" />
                    </View>
                  </Pressable>
                </React.Fragment>
              );
            })}
          </View>
        ) : (
          <View style={styles.kalendariumCard}>
            {[
              { id: 'placeholder-1', title: 'Välkommen till Kaninens Cykelfest!', createdAt: new Date().toISOString() },
              { id: 'placeholder-2', title: 'Tema: Semesterresor vi minns', createdAt: new Date().toISOString() },
            ].map((item, index) => (
              <React.Fragment key={item.id}>
                {index > 0 ? <View style={styles.timelineDivider} /> : null}
                <Pressable
                  style={styles.timelineRow}
                  onPress={() => {
                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/nyheter' as any);
                  }}
                  testID={`news-card-${item.id}`}
                >
                  <View style={styles.newsDateBadge}>
                    <Text style={styles.newsDateDay}>{newsDateParts(item.createdAt).day}</Text>
                    <Text style={styles.newsDateMonth}>{newsDateParts(item.createdAt).month}</Text>
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle} numberOfLines={2}>{item.title}</Text>
                  </View>
                  <ChevronRight size={14} color="rgba(255,255,255,0.4)" />
                </Pressable>
              </React.Fragment>
            ))}
          </View>
        )}
      </Animated.View>

      {/* KALENDARIUM */}
      <Animated.View entering={FadeIn.delay(200)} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>VAD HÄNDER NU?</Text>
          <TouchableOpacity testID="visa-allt-kalendarium-button" onPress={() => router.push('/kalendarium' as any)}>
            <Text style={styles.sectionLink}>Visa alla steg →</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.kalendariumCard}>
        {/* Fas 1 */}
        <TouchableOpacity
          activeOpacity={steg1Unlocked ? 0.6 : 1}
          style={[styles.timelineRow, steg1Unlocked ? undefined : styles.timelineRowLocked]}
          onPress={() => steg1Unlocked ? router.push('/intresseanmalan' as any) : null}
        >
          <View style={[styles.timelineDot, steg1Unlocked ? styles.timelineDotDone : styles.timelineDotLocked]}>
            <Text style={styles.timelineDotNum}>1</Text>
          </View>
          <View style={styles.timelineContent}>
            <Text style={styles.timelineTitle}>Intresseanmälan</Text>
            <Text style={styles.timelineSub} numberOfLines={1}>
              {steg1Unlocked ? 'Personer som anmält intresse för cykelfesten' : 'Ännu inte tillgänglig'}
            </Text>
          </View>
          <View style={styles.timelineRowRight}>
            <View style={steg1Unlocked ? styles.badgeDone : styles.badgeLocked}>
              <Text style={steg1Unlocked ? styles.badgeDoneText : styles.badgeLockedText}>{steg1Unlocked ? 'Avslutat' : 'Stängt'}</Text>
            </View>
            <ChevronRight size={14} color="rgba(255,255,255,0.4)" />
          </View>
        </TouchableOpacity>

        <View style={styles.timelineDivider} />

        {/* Fas 2 */}
        <TouchableOpacity
          activeOpacity={steg2Unlocked ? 0.6 : 1}
          style={[styles.timelineRow, steg2Unlocked ? styles.timelineRowActive : styles.timelineRowLocked]}
          onPress={() => steg2Unlocked ? router.push('/bekraftad-anmalan' as any) : null}
        >
          {steg2Unlocked ? (
            <LinearGradient colors={['#1C4F4A', '#2A6B64']} style={[styles.timelineDot, styles.timelineDotActive]}>
              <Text style={[styles.timelineDotNum, { color: '#A8D4B8' }]}>2</Text>
            </LinearGradient>
          ) : (
            <View style={[styles.timelineDot, styles.timelineDotLocked]}>
              <Text style={styles.timelineDotNum}>2</Text>
            </View>
          )}
          <View style={styles.timelineContent}>
            <Text style={steg2Unlocked ? styles.timelineTitleActive : styles.timelineTitle}>Bekräfta anmälan</Text>
            <Text style={steg2Unlocked ? styles.timelineSubActive : styles.timelineSub} numberOfLines={1}>
              {steg2Unlocked ? 'Bekräftelse av deltagande senast den 10 april' : 'Ännu inte tillgänglig'}
            </Text>
          </View>
          <View style={styles.timelineRowRight}>
            <View style={steg2Unlocked ? styles.badgePagaende : styles.badgeLocked}>
              <Text style={steg2Unlocked ? styles.badgePagaendeText : styles.badgeLockedText}>{steg2Unlocked ? 'Öppet' : 'Stängt'}</Text>
            </View>
            <ChevronRight size={14} color="rgba(255,255,255,0.4)" />
          </View>
        </TouchableOpacity>

        <View style={styles.timelineDivider} />

        {/* Fas 3 */}
        <TouchableOpacity
          activeOpacity={lagUnlocked ? 0.85 : 0.6}
          style={[styles.timelineRow, lagUnlocked ? styles.timelineRowActive : styles.timelineRowLocked]}
          onPress={() => router.push(lagUnlocked ? '/mitt-lag' : '/kalendarium' as any)}
        >
          {lagUnlocked ? (
            <LinearGradient colors={['#1C4F4A', '#2A6B64']} style={[styles.timelineDot, styles.timelineDotActive]}>
              <Text style={[styles.timelineDotNum, { color: '#A8D4B8' }]}>3</Text>
            </LinearGradient>
          ) : (
            <View style={[styles.timelineDot, styles.timelineDotLocked]}>
              <Text style={styles.timelineDotNum}>3</Text>
            </View>
          )}
          <View style={styles.timelineContent}>
            <Text style={lagUnlocked ? styles.timelineTitleActive : styles.timelineTitle}>Info om mitt lag</Text>
            <Text style={lagUnlocked ? styles.timelineSubActive : styles.timelineSub} numberOfLines={1}>
              {lagUnlocked ? 'Se mitt lag och lagmedlemmar' : `Tillgänglig från ${lagDateLabel}`}
            </Text>
          </View>
          <View style={styles.timelineRowRight}>
            <View style={lagUnlocked ? styles.badgePagaende : styles.badgeLocked}>
              <Text style={lagUnlocked ? styles.badgePagaendeText : styles.badgeLockedText}>{lagUnlocked ? 'Öppet' : 'Stängt'}</Text>
            </View>
            <ChevronRight size={14} color={lagUnlocked ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)'} />
          </View>
        </TouchableOpacity>

        <View style={styles.timelineDivider} />

        {/* Fas 4 */}
        <TouchableOpacity
          activeOpacity={vardinfoUnlocked ? 0.85 : 0.6}
          style={[styles.timelineRow, vardinfoUnlocked ? styles.timelineRowActive : styles.timelineRowLocked]}
          onPress={() => router.push(vardinfoUnlocked ? '/host' as any : '/kalendarium' as any)}
        >
          {vardinfoUnlocked ? (
            <LinearGradient colors={['#1C4F4A', '#2A6B64']} style={[styles.timelineDot, styles.timelineDotActive]}>
              <Text style={[styles.timelineDotNum, { color: '#A8D4B8' }]}>4</Text>
            </LinearGradient>
          ) : (
            <View style={[styles.timelineDot, styles.timelineDotLocked]}>
              <Text style={styles.timelineDotNum}>4</Text>
            </View>
          )}
          <View style={styles.timelineContent}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={vardinfoUnlocked ? styles.timelineTitleActive : styles.timelineTitle}>Info om mitt värdskap</Text>
              {hostHasUpdate && vardinfoUnlocked ? (
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#E53935' }} />
              ) : null}
            </View>
            <Text style={vardinfoUnlocked ? styles.timelineSubActive : styles.timelineSub} numberOfLines={1}>
              {vardinfoUnlocked ? 'Se vad som gäller för mitt värdskap' : `Pinkod skickas separat. Tillgänglig från ${vardinfoDateLabel}.`}
            </Text>
          </View>
          <View style={styles.timelineRowRight}>
            <View style={vardinfoUnlocked ? styles.badgePagaende : styles.badgeLocked}>
              <Text style={vardinfoUnlocked ? styles.badgePagaendeText : styles.badgeLockedText}>{vardinfoUnlocked ? 'Öppet' : 'Stängt'}</Text>
            </View>
            <ChevronRight size={14} color={vardinfoUnlocked ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)'} />
          </View>
        </TouchableOpacity>
        </View>
      </Animated.View>

      {/* LAGKORT */}
      <Animated.View entering={FadeIn.delay(250)} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>MITT LAG</Text>
        </View>
        <TouchableOpacity onPress={() => lagUnlocked ? router.push('/mitt-lag') : null} activeOpacity={lagUnlocked ? 0.85 : 1}>
          <LinearGradient
            colors={lagUnlocked ? ['#9E5824', '#7A3D18'] : ['#C4814A', '#9E5824']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.teamCard, !lagUnlocked && { opacity: 0.85 }]}
          >
            <Text style={styles.teamCardLock}>{lagUnlocked ? '🏆' : '🔒'}</Text>
            <Text style={styles.teamCardTitle}>Mitt lag</Text>
            <Text style={styles.quickLinkLockedSub}>
              {lagUnlocked ? 'Tryck för att se mitt lag' : `Tillgänglig från ${lagDateLabel}`}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* KANINENS QUIZ */}
      {activePoll != null ? (
  <Animated.View entering={FadeIn.delay(300)} style={styles.section}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionLabel}>KANINENS QUIZ</Text>
    </View>
    <LinearGradient
      colors={['#2A5A54', '#1C4F4A']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.pollCard}
    >
      <View style={styles.pollHeader}>
        {quizDone
          ? <TouchableOpacity onPress={() => setQuizCollapsed((v) => !v)}>
              <Text style={styles.pollDeadline}>{quizCollapsed ? 'Visa resultat ↓' : 'Stäng ↑'}</Text>
            </TouchableOpacity>
          : <Text style={styles.pollDeadline}>FRÅGA {pollIdx + 1} AV {polls.length}</Text>
        }
      </View>

      {quizDone && quizCollapsed ? null : quizDone ? (
        // RESULT SCREEN — show score
        <View style={styles.pollDoneBox}>
          <Text style={styles.pollDoneEmoji}>🐇</Text>
          <Text style={styles.pollDoneTitle}>
            {polls.filter((poll) => {
              const myAns = userAnswers[poll.id];
              return myAns !== undefined && poll.correctAnswer !== null && myAns === poll.correctAnswer;
            }).length} av {polls.length} rätt!
          </Text>
          {(() => {
            // Compute percentile: how many other participants scored strictly below me
            const myScore = polls.filter((poll) => {
              const myAns = userAnswers[poll.id];
              return myAns !== undefined && poll.correctAnswer !== null && myAns === poll.correctAnswer;
            }).length;
            // Gather all voter IDs who have voted in this quiz
            const allVoterIds = new Set<string>();
            polls.forEach((poll) => poll.votes?.forEach((v) => allVoterIds.add(v.participantId)));
            const otherIds = Array.from(allVoterIds);
            if (otherIds.length <= 1) {
              return <Text style={styles.pollDoneSub}>Du är bland de första att svara – fler resultat visas snart!</Text>;
            }
            // Score per voter
            const otherScores = otherIds.map((pid) =>
              polls.filter((poll) => {
                const vote = poll.votes?.find((v) => v.participantId === pid);
                return vote !== undefined && poll.correctAnswer !== null && vote.optionIndex === poll.correctAnswer;
              }).length
            );
            const belowCount = otherScores.filter((s) => s < myScore).length;
            const percentile = Math.round((belowCount / otherIds.length) * 100);
            return (
              <Text style={styles.pollDoneSub}>
                Du svarade bättre än {percentile}% av deltagarna
              </Text>
            );
          })()}
          <View style={{ marginTop: 16, width: '100%', gap: 10 }}>
            {polls.map((poll) => {
              const opts: string[] = (() => { try { return JSON.parse(poll.options) as string[]; } catch { return []; } })();
              const myAns = userAnswers[poll.id];
              const correct = poll.correctAnswer;
              const isCorrect = myAns === correct;
              return (
                <View key={poll.id} style={styles.pollReviewRow}>
                  <Text style={styles.pollReviewQ} numberOfLines={2}>{poll.question.split(' — ')[0]}</Text>
                  <View style={[styles.pollReviewAnswer, isCorrect ? styles.pollReviewCorrect : styles.pollReviewWrong]}>
                    <Text style={styles.pollReviewAnswerText}>
                      {isCorrect ? '✓ ' : '✗ '}{myAns !== undefined ? opts[myAns] : '—'}
                    </Text>
                  </View>
                  {!isCorrect && correct !== null && correct !== undefined && (
                    <Text style={styles.pollReviewHint}>Rätt: {opts[correct]}</Text>
                  )}
                </View>
              );
            })}
          </View>
          <TouchableOpacity
            style={[styles.pollVoteBtn, { marginTop: 16, alignSelf: 'center' }]}
            onPress={() => {
              setQuizDone(false);
              setUserAnswers({});
              setPollIdx(0);
              setCurrentChoice(null);
            }}
          >
            <Text style={styles.pollVoteBtnText}>Rösta igen</Text>
          </TouchableOpacity>
        </View>
      ) : hasVoted ? (
        // VOTED — show bars for current poll + next button
        <>
          <Text style={styles.pollQuestion}>{activePoll.question}</Text>
          <View style={styles.pollOptions}>
            {pollOptions.map((opt, i) => {
              const count = pollVotes.filter((v) => v.optionIndex === i).length;
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
              const isMyVote = userAnswers[activePoll.id] === i;
              return (
                <View key={i} style={[styles.pollOption, isMyVote && styles.pollOptionVoted]}>
                  <View style={styles.pollBarLabelRow}>
                    <Text style={[styles.pollOptionText, isMyVote && { color: '#A8D4B8', fontFamily: 'DMSans_600SemiBold' }]}>
                      {opt}
                    </Text>
                    <Text style={[styles.pollBarPct, { fontSize: 12 }]}>{pct}%</Text>
                  </View>
                  <View style={[styles.pollBarBg, { marginTop: 6 }]}>
                    <View style={[styles.pollBarFill, isMyVote && styles.pollBarFillMine, { width: `${pct}%` as any }]} />
                  </View>
                </View>
              );
            })}
          </View>
          <View style={styles.pollFooter}>
            <Text style={styles.pollVoteCount}>{totalVotes} har röstat</Text>
            <TouchableOpacity
              style={styles.pollVoteBtn}
              onPress={async () => {
                if (pollIdx === polls.length - 1) {
                  setQuizDone(true);
                } else {
                  setPollIdx((i) => i + 1);
                  setCurrentChoice(null);
                }
              }}
              testID="poll-next-button"
            >
              <Text style={styles.pollVoteBtnText}>
                {pollIdx === polls.length - 1 ? 'Se alla resultat →' : 'Nästa fråga →'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        // NOT VOTED — show options to pick
        <>
          <Text style={styles.pollQuestion}>{activePoll.question}</Text>
          <View style={styles.pollOptions}>
            {pollOptions.map((opt, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.pollOption,
                  currentChoice === i ? styles.pollOptionVoted : null,
                ]}
                onPress={() => setCurrentChoice(i)}
                activeOpacity={0.75}
                testID={`poll-option-${i}`}
              >
                <Text style={styles.pollOptionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.pollFooter}>
            <Text style={styles.pollVoteCount}>{totalVotes} har röstat</Text>
            <View style={styles.pollNavBtns}>
              {pollIdx > 0 && (
                <TouchableOpacity
                  style={styles.pollPrevBtn}
                  onPress={() => { setPollIdx((i) => i - 1); setCurrentChoice(null); }}
                  activeOpacity={0.75}
                >
                  <Text style={styles.pollVoteBtnText}>← Föregående</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.pollVoteBtn, currentChoice === null && styles.pollNavBtnDisabled]}
                onPress={async () => {
                  if (currentChoice === null) return;
                  const newAnswers = await handleVote(currentChoice);
                  if (pollIdx === polls.length - 1) {
                    setQuizDone(true);
                  } else {
                    setPollIdx((i) => i + 1);
                    setCurrentChoice(null);
                  }
                }}
                disabled={currentChoice === null}
                testID="poll-vote-button"
              >
                <Text style={styles.pollVoteBtnText}>
                  {pollIdx === polls.length - 1 ? 'Rösta ✓' : 'Rösta →'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
      {pollVoteError ? (
        <Text style={styles.pollVoteError} testID="poll-vote-error">{pollVoteError}</Text>
      ) : null}
    </LinearGradient>
  </Animated.View>
) : null}

      {/* VÄRDINFORMATION */}
      <Animated.View entering={FadeIn.delay(300)} style={styles.quickLinks}>
        <View style={styles.quickLinksHeader}>
          <Text style={styles.quickLinksLabel}>MITT VÄRDSKAP</Text>
          {hostHasUpdate && vardinfoUnlocked ? (
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#E53935', marginLeft: 4 }} />
          ) : null}
        </View>
        <TouchableOpacity onPress={() => vardinfoUnlocked ? router.push('/host' as any) : null} activeOpacity={vardinfoUnlocked ? 0.85 : 1} testID="host-link">
          <LinearGradient
            colors={vardinfoUnlocked ? ['#0F2347', '#0A1830'] : ['#1A3A6B', '#0F2347']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.quickLinkBtnPrimary, !vardinfoUnlocked && { opacity: 0.85 }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.teamCardLock}>{vardinfoUnlocked ? '🏠' : '🔒'}</Text>
            </View>
            <Text style={styles.quickLinkTextPrimary}>Mitt värdskap</Text>
            <Text style={styles.quickLinkLockedSub}>
              {vardinfoUnlocked ? 'Info om värdskap & uppdrag' : `Pinkod skickas separat\nTillgänglig från ${vardinfoDateLabel}`}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* FRÅGA KANINEN */}
      <Animated.View entering={FadeIn.delay(325)} style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.sectionLabel}>FRÅGA KANINEN</Text>
            {faqHasNewAnswer ? (
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#E53935', marginLeft: 5 }} />
            ) : null}
          </View>
        </View>
        <View style={styles.questionCard}>
          <Text style={styles.quickLinkTextPrimary}>Fråga Kaninen</Text>
          {/* Inmatningsfält */}
          <View style={styles.questionInputRow}>
            <TextInput
              style={styles.questionInput}
              placeholder="Skriv din fråga…"
              placeholderTextColor="#9A8880"
              value={questionInput}
              onChangeText={setQuestionInput}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
              blurOnSubmit
              onSubmitEditing={handleSendQuestion}
            />
            <TouchableOpacity
              style={[styles.questionSendBtn, !questionInput.trim() && styles.questionSendBtnDisabled]}
              onPress={handleSendQuestion}
              disabled={!questionInput.trim() || questionSending}
              activeOpacity={0.75}
            >
              <Text style={styles.questionSendBtnText}>↑</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.faqRowBtn}
            onPress={async () => {
              await AsyncStorage.setItem('faq_last_seen', new Date().toISOString());
              setFaqHasNewAnswer(false);
              router.push('/faq' as any);
            }}
            activeOpacity={0.75}
            testID="faq-row-button"
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Text style={styles.faqRowBtnText}>Se frågor & svar till kaninen</Text>
            </View>
            <Text style={styles.faqRowBtnArrow}>→</Text>
          </TouchableOpacity>
          <Text style={styles.questionPrivacyNote}>
            För privata frågor, kontakta{' '}
            <Text style={styles.questionPrivacyEmail} onPress={() => Linking.openURL('mailto:kaninencykelfest@gmail.com')}>kaninencykelfest@gmail.com</Text>
          </Text>
        </View>
      </Animated.View>

      {/* ÅTERKOPPLING */}
      <Animated.View entering={FadeIn.delay(340)} style={[styles.section, !aterkopplingUnlocked && { opacity: 0.4 }]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>ÅTERKOPPLING</Text>
        </View>
        <TouchableOpacity
          style={styles.aterkopplingCard}
          onPress={aterkopplingUnlocked ? () => router.push('/aterkoppling' as any) : undefined}
          activeOpacity={aterkopplingUnlocked ? 0.85 : 1}
          testID="aterkoppling-link"
        >
          <LinearGradient
            colors={['#1C4F4A', '#2A6B64']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.aterkopplingGradient}
          >
            <Text style={styles.aterkopplingTitle}>Hur var festen?</Text>
            <Text style={styles.aterkopplingSub}>Berätta hur kvällen var — fyra snabba frågor</Text>
            {aterkopplingUnlocked ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                <Text style={styles.aterkopplingArrow}>→</Text>
                <View style={{
                  backgroundColor: aterkopplingDone ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                  borderWidth: 1,
                  borderColor: aterkopplingDone ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)',
                  borderRadius: 20,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}>
                  <Text style={{ fontFamily: 'DMSans_600SemiBold', fontSize: 11, color: aterkopplingDone ? '#A8F0C6' : 'rgba(255,255,255,0.6)' }}>
                    {aterkopplingDone ? '✓ Svar inskickat' : 'Ej svarat'}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.aterkopplingLocked}>Aktiveras efter festen</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* ADMIN */}
      <TouchableOpacity
        style={styles.adminFooterBtn}
        onPress={() => router.push('/admin' as any)}
        testID="admin-link"
      >
        <Text style={styles.adminFooterEmoji}>⚙️</Text>
        <Text style={styles.adminFooterText}>Kontrollrum</Text>
      </TouchableOpacity>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5DFD1',
  },
  content: {
    paddingBottom: 20,
  },

  // HEADER
  header: {
    backgroundColor: '#1C4F4A',
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 22,
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
  eyebrow: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 11,
    letterSpacing: 2.6,
    color: 'rgba(255,255,255,0.75)',
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 4,
  },
  titleBlock: {
    marginBottom: 10,
  },
  titleLine1: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 34,
    lineHeight: 34,
    color: 'rgba(245,239,224,0.55)',
    letterSpacing: 1,
  },
  titleLine2: {
    fontFamily: 'DMSerifDisplay_400Regular_Italic',
    fontSize: 52,
    lineHeight: 54,
    color: '#F5EFE0',
    marginLeft: 22,
  },
  themeBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    alignSelf: 'flex-start',
    marginBottom: 16,
    gap: 6,
  },
  themeBadgeLabel: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 8.5,
    color: 'rgba(168,212,184,0.55)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  themeBadgeValue: {
    fontFamily: 'DMSerifDisplay_400Regular_Italic',
    fontSize: 22,
    color: '#A8D4B8',
    letterSpacing: 0.2,
  },
  countdown: {
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  countdownDateBig: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 19,
    color: '#F5EFE0',
    lineHeight: 22,
    marginTop: 2,
  },
  countdownDateSmall: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 8,
    color: 'rgba(168,212,184,0.6)',
    letterSpacing: 1.5,
  },
  countdownNumber: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 22,
    color: '#fff',
    lineHeight: 34,
    textAlign: 'right',
  },
  countdownUnits: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  countdownNumbersRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  countdownLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 3,
  },
  countdownUnit: {
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  countdownMinutesRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  countdownKvar: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 14,
    color: '#A8D4B8',
  },

  // VIDEO
  videoSection: {
    marginHorizontal: 16,
    marginTop: 19.2,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
  videoCard: {
    aspectRatio: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  videoRabbitWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    height: '95%',
    justifyContent: 'flex-end',
  },
  videoRabbit: {
    height: '100%',
    width: undefined,
    aspectRatio: 1,
    alignSelf: 'center',
  },
  nyttBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#A8D4B8',
  },
  nyttText: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 8.3,
    color: '#A8D4B8',
    letterSpacing: 1,
  },
  playBtnOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  playBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F5EFE0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4CAF82',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 26,
    color: '#fff',
    marginLeft: 4,
  },
  videoMeta: {
    backgroundColor: '#1a2e2b',
    paddingHorizontal: 16,
    paddingVertical: 10.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  videoMetaLeft: {
    flex: 1,
    marginRight: 12,
  },
  videoTitle: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12.2,
    color: '#F5EFE0',
  },
  videoDuration: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 8.8,
    color: 'rgba(168,212,184,0.6)',
    marginTop: 2,
  },
  videoCounter: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 10,
    color: 'rgba(168,212,184,0.8)',
  },

  // KALENDARIUM
  kalendariumCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E8E0CC',
    overflow: 'hidden',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    gap: 12,
  },
  timelineRowActive: {
    backgroundColor: '#F6FBF8',
  },
  timelineRowLocked: {
    opacity: 0.52,
  },
  timelineDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  timelineDotDone: {
    backgroundColor: '#A8D4B8',
  },
  timelineDotActive: {
    // gradient applied via LinearGradient wrapper
  },
  timelineDotLocked: {
    backgroundColor: '#F0EAD8',
  },
  timelineDotIcon: {
    fontSize: 13,
  },
  timelineDotNum: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: '#1C4F4A',
  },
  timelineContent: {
    flex: 1,
  },
  timelineRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
    alignSelf: 'flex-start',
    marginTop: 1,
  },
  timelineTitle: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13.5,
    color: '#2A2A2A',
  },
  timelineTitleActive: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13.5,
    color: '#1C4F4A',
  },
  timelineSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11.5,
    color: '#7A7060',
    marginTop: 2,
    lineHeight: 16,
  },
  timelineSubActive: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11.5,
    color: '#2A6B64',
    marginTop: 2,
    lineHeight: 16,
  },
  timelineDivider: {
    height: 1,
    backgroundColor: '#F0EAD8',
    marginHorizontal: 16,
  },
  badgePagaende: {
    backgroundColor: '#DFF0E8',
    borderRadius: 6,
    width: 68,
    paddingVertical: 4,
    alignItems: 'center',
  },
  badgePagaendeText: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9,
    color: '#1C6B40',
  },
  badgeDone: {
    backgroundColor: '#E8E0D0',
    borderRadius: 6,
    width: 68,
    paddingVertical: 4,
    alignItems: 'center',
  },
  badgeDoneText: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9,
    color: '#7A6B55',
  },
  badgeActive: {
    backgroundColor: 'rgba(28,79,74,0.1)',
    borderRadius: 6,
    width: 68,
    paddingVertical: 4,
    alignItems: 'center',
  },
  badgeActiveText: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9,
    color: '#1C4F4A',
  },
  badgeLocked: {
    backgroundColor: '#EDE6D6',
    borderRadius: 6,
    width: 68,
    paddingVertical: 4,
    alignItems: 'center',
  },
  badgeLockedText: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9,
    color: '#9A8E78',
  },

  // SECTION
  section: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionLabel: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 10.5,
    color: '#5A5145',
    letterSpacing: 1.5,
  },
  sectionLink: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 10.6,
    color: '#1C4F4A',
  },

  // NEWS
  newsCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E8E0CC',
    overflow: 'hidden',
  },
  newsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  newsEmojiWrap: {
    position: 'relative',
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newsEmoji: {
    fontSize: 20,
    width: 30,
    textAlign: 'center',
  },
  newsNewDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E05A2B',
    flexShrink: 0,
    marginTop: 2,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  newsDateBadge: {
    width: 30,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newsDateDay: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: '#2A2A2A',
    lineHeight: 16,
  },
  newsDateMonth: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 8,
    color: '#9A8E78',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  newsText: {
    flex: 1,
  },
  newsTextBlock: {
    flex: 1,
    gap: 3,
  },
  newsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  newsTitle: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: '#1C1C1C',
    flex: 1,
  },
  newsVoteChip: {
    backgroundColor: '#EEF2FF',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    flexShrink: 0,
  },
  newsVoteChipText: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9,
    color: '#5B21B6',
  },
  newsMeta: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9,
    color: '#9A8E78',
    flexShrink: 0,
  },
  newsCardHorizontal: {
    width: 280,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E8E0CC',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    justifyContent: 'space-between',
    minHeight: 110,
  },
  newsCardHorizontalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  newsCardHorizontalTitle: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: '#1C1C1C',
    lineHeight: 20,
    flex: 1,
    marginBottom: 8,
  },
  newsCardHorizontalMeta: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9,
    color: '#9A8E78',
  },
  newsDivider: {
    height: 1,
    backgroundColor: '#F0EAD8',
    marginHorizontal: 14,
  },

  // LAGKORT
  teamCard: {
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  teamCardLock: {
    fontSize: 28,
    marginBottom: 6,
  },
  teamCardTitle: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 22,
    color: '#fff',
  },
  teamCardSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  teamCardPoints: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 18,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 10,
  },

  // POLL
  pollCard: {
    borderRadius: 14,
    padding: 18,
  },
  pollHeader: {
    marginBottom: 10,
  },
  pollLabel: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 8.8,
    color: '#A8D4B8',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  pollDeadline: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 8,
    color: 'rgba(168,212,184,0.55)',
    marginTop: 3,
    letterSpacing: 0.5,
  },
  pollQuestion: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 16,
    color: '#F5EFE0',
    marginBottom: 14,
    lineHeight: 22,
  },
  pollOptions: {
    gap: 8,
    marginBottom: 16,
  },
  pollOption: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  pollOptionVoted: {
    backgroundColor: 'rgba(168,212,184,0.25)',
    borderColor: '#A8D4B8',
  },
  pollOptionText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13.5,
    color: '#F5EFE0',
  },
  pollFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pollVoteCount: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9.6,
    color: 'rgba(168,212,184,0.7)',
  },
  pollVoteBtn: {
    backgroundColor: '#A8D4B8',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pollVoteBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12.5,
    color: '#1C4F4A',
  },
  pollNav: {
    flexDirection: 'row',
    gap: 8,
  },
  pollNavBtn: {
    backgroundColor: 'rgba(168,212,184,0.25)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(168,212,184,0.4)',
  },
  pollNavBtnDisabled: {
    opacity: 0.3,
  },
  pollNavBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  pollPrevBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(168,212,184,0.4)',
  },
  pollNavBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: '#A8D4B8',
  },
  pollDoneBox: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  pollDoneEmoji: {
    fontSize: 40,
  },
  pollDoneTitle: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 22,
    color: '#F5EFE0',
  },
  pollDoneSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  pollReviewRow: {
    gap: 2,
  },
  pollReviewQ: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  pollReviewAnswer: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pollReviewCorrect: {
    backgroundColor: 'rgba(46,160,67,0.3)',
  },
  pollReviewWrong: {
    backgroundColor: 'rgba(220,53,69,0.3)',
  },
  pollReviewAnswerText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: '#F5EFE0',
  },
  pollReviewHint: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontStyle: 'italic',
    paddingLeft: 4,
  },
  pollResultBlock: {
    width: '100%',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  pollResultQ: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 13,
    color: '#F5EFE0',
    lineHeight: 18,
  },
  pollBarRow: {
    gap: 4,
  },
  pollBarLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pollBarLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    flex: 1,
  },
  pollBarLabelMine: {
    color: '#A8D4B8',
    fontFamily: 'DMSans_600SemiBold',
  },
  pollBarPct: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 10,
    color: 'rgba(168,212,184,0.8)',
    marginLeft: 8,
  },
  pollBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  pollBarFill: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
  },
  pollBarFillMine: {
    backgroundColor: '#A8D4B8',
  },
  pollBarCount: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 8.5,
    color: 'rgba(255,255,255,0.35)',
  },
  pollBarTotal: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9,
    color: 'rgba(168,212,184,0.5)',
    marginTop: 8,
    textAlign: 'right',
  },

  // VÄRDINFORMATION
  quickLinks: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  quickLinksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  quickLinksLabel: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 10.5,
    color: '#5A5145',
    letterSpacing: 1.5,
  },
  quickLinkBtnPrimary: {
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  quickLinkLockIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F0E0B8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0C888',
  },
  quickLinkTextPrimary: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 22,
    color: '#fff',
  },
  quickLinkLockedSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  quickLinkBtnSubtle: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 6,
  },
  quickLinkEmoji: { fontSize: 26 },
  quickLinkTextSubtle: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: '#A0907A',
  },

  // FRÅGA KANINEN
  questionCardDesc: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  questionCardEmail: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: '#1C4F4A',
    textDecorationLine: 'underline',
  },
  questionCard: {
    backgroundColor: '#C0392B',
    borderRadius: 14,
    borderWidth: 0,
    borderColor: 'transparent',
    overflow: 'hidden',
    padding: 16,
  },
  questionList: {
    paddingTop: 4,
  },
  questionDivider: {
    height: 1,
    backgroundColor: '#F0EBE0',
    marginHorizontal: 16,
  },
  questionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  questionBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#1C4F4A',
    borderRadius: 12,
    borderBottomRightRadius: 3,
    paddingHorizontal: 13,
    paddingVertical: 8,
    maxWidth: '90%',
  },
  questionBubbleText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: '#fff',
    lineHeight: 18,
  },
  answerBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#F5F1E8',
    borderRadius: 12,
    borderBottomLeftRadius: 3,
    paddingHorizontal: 13,
    paddingVertical: 8,
    maxWidth: '90%',
    gap: 3,
  },
  answerLabel: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 8.5,
    color: '#9A8E78',
    letterSpacing: 0.3,
  },
  answerText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: '#2A2A2A',
    lineHeight: 18,
  },
  answerPending: {
    alignSelf: 'flex-start',
    paddingHorizontal: 4,
  },
  answerPendingText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11.5,
    color: '#B0A890',
    fontStyle: 'italic',
  },
  questionInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 10,
    gap: 8,
  },
  questionInput: {
    flex: 1,
    fontFamily: 'DMSans_400Regular',
    fontSize: 13.5,
    color: '#2A2A2A',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 60,
  },
  questionSendBtn: {
    backgroundColor: '#7B1A10',
    borderRadius: 22,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  questionSendBtnDisabled: {
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  questionSendBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 20,
    color: '#fff',
    lineHeight: 24,
  },
  questionPrivacyNote: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 0,
    textAlign: 'left',
    lineHeight: 16,
    paddingHorizontal: 0,
    paddingTop: 4,
    paddingBottom: 0,
  },
  questionPrivacyEmail: {
    color: 'rgba(255,255,255,0.9)',
    textDecorationLine: 'underline',
    fontFamily: 'DMSans_600SemiBold',
  },
  faqRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 12,
    marginHorizontal: 0,
    marginBottom: 4,
  },
  faqRowBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: 'rgba(255,255,255,0.92)',
  },
  faqRowBtnArrow: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: 'rgba(255,255,255,0.92)',
  },
  aterkopplingCard: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  aterkopplingGradient: {
    padding: 20,
    gap: 4,
  },
  aterkopplingTitle: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 22,
    color: '#F5EFE0',
  },
  aterkopplingSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: 'rgba(245,239,224,0.75)',
    lineHeight: 18,
  },
  aterkopplingArrow: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 18,
    color: 'rgba(245,239,224,0.6)',
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  aterkopplingLocked: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 10,
    color: 'rgba(245,239,224,0.5)',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  adminFooterBtn: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 6,
  },
  adminFooterEmoji: {
    fontSize: 28,
  },
  adminFooterText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: '#9A8E78',
    letterSpacing: 0.5,
  },

  // ERROR BANNER
  errorBanner: {
    backgroundColor: '#C0392B',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  errorBannerText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    color: '#fff',
    flex: 1,
  },
  errorBannerBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  errorBannerBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
    color: '#fff',
  },

  // POLL VOTE ERROR
  pollVoteError: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: '#FF8A80',
    marginTop: 8,
    textAlign: 'center',
  },
  newsChipNyhet: {
    backgroundColor: '#D4EDE4',
    borderRadius: 6,
    width: 54,
    paddingVertical: 4,
    alignItems: 'center',
  },
  newsChipNyhetText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 10,
    color: '#1C6B40',
  },
  newsChipViktig: {
    backgroundColor: '#FFE4B0',
    borderRadius: 6,
    width: 54,
    paddingVertical: 4,
    alignItems: 'center',
  },
  newsChipViktigText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 10,
    color: '#8A4400',
  },
  newsChipOmrostning: {
    backgroundColor: '#E4DDFF',
    borderRadius: 6,
    width: 54,
    paddingVertical: 4,
    alignItems: 'center',
  },
  newsChipOmrostningText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 10,
    color: '#4A1D96',
  },
  newsChipInfo: {
    backgroundColor: '#DEF0FF',
    borderRadius: 6,
    width: 54,
    paddingVertical: 4,
    alignItems: 'center',
  },
  newsChipInfoText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 10,
    color: '#1A5276',
  },
});
