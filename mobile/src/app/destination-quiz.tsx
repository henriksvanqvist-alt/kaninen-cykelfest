import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Video, ResizeMode, Audio } from 'expo-av';
import { Play, Pause } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/lib/api/api';

type DQuestion = { id: string; question: string; options: string; correctAnswer: number; orderIndex: number; contentType: string; contentText: string | null; contentUrl: string | null };
type DQuiz = { id: string; course: string; imageUrl: string | null; questions: DQuestion[] };

const COURSE_CONFIG = {
  'förrätt': { label: 'Förrätt', activityTitle: 'Ledtrådar förrätt' },
  'varmrätt': { label: 'Varmrätt', activityTitle: 'Ledtrådar varmrätt' },
  'efterrätt': { label: 'Efterrätt', activityTitle: 'Ledtrådar efterrätt' },
};

const BLUR_LEVELS = [100, 90, 75, 55, 28, 0];

function AudioPlayer({ url, label }: { url: string; label: string | null }) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, [url]);

  async function toggle() {
    if (loading) return;
    if (playing) {
      await soundRef.current?.pauseAsync();
      setPlaying(false);
      return;
    }
    if (soundRef.current) {
      await soundRef.current.setPositionAsync(0);
      await soundRef.current.playAsync();
      setPlaying(true);
      return;
    }
    setLoading(true);
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded && status.didJustFinish) {
            setPlaying(false);
          }
        }
      );
      soundRef.current = sound;
      setPlaying(true);
    } catch {
      setPlaying(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.audioBox}>
      <TouchableOpacity style={styles.audioBtn} onPress={toggle} activeOpacity={0.8}>
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : playing ? (
          <Pause size={22} color="#fff" />
        ) : (
          <Play size={22} color="#fff" />
        )}
        <Text style={styles.audioBtnText}>{playing ? 'Pausa' : 'Spela upp'}</Text>
      </TouchableOpacity>
      {label ? <Text style={styles.audioLabel}>{label}</Text> : null}
    </View>
  );
}

export default function DestinationQuizScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { course } = useLocalSearchParams<{ course: string }>();
  const config = COURSE_CONFIG[course as keyof typeof COURSE_CONFIG] ?? COURSE_CONFIG['förrätt'];
  const storageKey = `dest_quiz_progress_${course}`;

  const [quiz, setQuiz] = useState<DQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [currentChoice, setCurrentChoice] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);

  // Blur is driven by this animated value so it changes visibly on correct answer
  const blurAnim = useRef(new Animated.Value(BLUR_LEVELS[0])).current;
  const [blurIntensity, setBlurIntensity] = useState(BLUR_LEVELS[0]);

  // Answer feedback state
  const [answerResult, setAnswerResult] = useState<'correct' | 'wrong' | null>(null);
  const feedbackAnim = useRef(new Animated.Value(0)).current;

  // Load saved progress
  useEffect(() => {
    AsyncStorage.getItem(storageKey).then((raw) => {
      if (!raw) return;
      try {
        const saved = JSON.parse(raw);
        if (saved.userAnswers) setUserAnswers(saved.userAnswers);
        if (typeof saved.correctCount === 'number') {
          setCorrectCount(saved.correctCount);
          const level = BLUR_LEVELS[Math.min(saved.correctCount, BLUR_LEVELS.length - 1)];
          blurAnim.setValue(level);
          setBlurIntensity(level);
        }
        if (typeof saved.currentQuestionIdx === 'number') setCurrentQuestionIdx(saved.currentQuestionIdx);
        if (saved.done) setDone(true);
      } catch (e) { console.error('[DestinationQuiz] loadProgress failed:', e); }
    });
  }, [storageKey]);

  // Save progress
  useEffect(() => {
    AsyncStorage.setItem(storageKey, JSON.stringify({ userAnswers, correctCount, currentQuestionIdx, done }));
  }, [userAnswers, correctCount, currentQuestionIdx, done, storageKey]);

  useEffect(() => {
    const fetchQuiz = async () => {
      setLoading(true);
      try {
        const data = await api.get<DQuiz>(`/api/cykelfest/destination-quizzes/${encodeURIComponent(course ?? '')}`);
        setQuiz(data);
      } catch (e) { console.error('[DestinationQuiz] fetchQuiz failed:', e); }
      setLoading(false);
    };
    fetchQuiz();
  }, [course]);

  function resetQuiz() {
    setCurrentQuestionIdx(0);
    setCurrentChoice(null);
    setUserAnswers({});
    setCorrectCount(0);
    setDone(false);
    setAnswerResult(null);
    const startBlur = BLUR_LEVELS[0];
    blurAnim.setValue(startBlur);
    setBlurIntensity(startBlur);
    AsyncStorage.removeItem(storageKey);
  }

  const questions = quiz?.questions
    ? [...quiz.questions].sort((a, b) => a.orderIndex - b.orderIndex).slice(0, 5)
    : [];
  const activeQuestion = questions[currentQuestionIdx] ?? null;
  const options: string[] = activeQuestion ? (() => { try { return JSON.parse(activeQuestion.options) as string[]; } catch { return []; } })() : [];
  const totalQuestions = questions.length;

  function handleAnswer() {
    if (currentChoice === null || activeQuestion === null) return;

    const isCorrect = currentChoice === activeQuestion.correctAnswer;
    const newCorrectCount = isCorrect ? correctCount + 1 : correctCount;
    const newAnswers = { ...userAnswers, [activeQuestion.id]: currentChoice };

    setAnswerResult(isCorrect ? 'correct' : 'wrong');

    // Flash overlay animation
    Animated.sequence([
      Animated.timing(feedbackAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(feedbackAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();

    // Animate blur immediately on correct answer
    if (isCorrect) {
      const newBlur = BLUR_LEVELS[Math.min(newCorrectCount, BLUR_LEVELS.length - 1)];
      Animated.timing(blurAnim, {
        toValue: newBlur,
        duration: 600,
        useNativeDriver: false,
      }).start();
      blurAnim.addListener(({ value }) => setBlurIntensity(Math.round(value)));
    }

    setUserAnswers(newAnswers);
    setCorrectCount(newCorrectCount);

    // Auto-advance after 1.2s
    setTimeout(() => {
      setAnswerResult(null);
      if (currentQuestionIdx === totalQuestions - 1) {
        setDone(true);
      } else {
        setCurrentQuestionIdx((i) => i + 1);
        setCurrentChoice(null);
      }
    }, 1200);
  }

  return (
    <View style={styles.container} testID="destination-quiz-screen">
      <LinearGradient
        colors={['#1C4F4A', '#2A6B64']}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color="rgba(245,239,224,0.9)" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{config.activityTitle}</Text>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color="#7A6B55" />
          </View>
        ) : quiz === null ? (
          <View style={styles.centerState}>
            <Text style={styles.emptyTitle}>Inget quiz tillgängligt</Text>
            <Text style={styles.emptySub}>Kaninen har inte skapat något quiz för den här kursen ännu.</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionLabel}>PLATSEN DIT NI SKA</Text>
            <Text style={styles.competitionTitle}>Gruppaktivitet 1</Text>

            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>SENASTE ANKOMSTTID</Text>
            <Text style={styles.timeValue}>16:45</Text>

            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>PLATS</Text>
            <View style={styles.imageWrapper}>
              {quiz.imageUrl ? (
                <>
                  <Image source={{ uri: quiz.imageUrl }} style={styles.destinationImage} resizeMode="cover" />
                  {blurIntensity > 0 && (
                    <BlurView intensity={blurIntensity} tint="dark" style={StyleSheet.absoluteFill} />
                  )}
                </>
              ) : (
                <LinearGradient colors={['#2A5A54', '#1C4F4A']} style={styles.imagePlaceholder}>
                  <Text style={styles.imagePlaceholderText}>Bild laddas upp av kaninen</Text>
                </LinearGradient>
              )}
            </View>
            <Text style={styles.imageProgress}>{correctCount} / {totalQuestions} rätt avslöjar bilden</Text>

            <View style={styles.separatorSpaced} />
            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>FRÅGOR</Text>
            <Text style={styles.questionsIngress}>För varje rätt svar får ni mer information om platsen dit ni ska. Totalt fem frågor.</Text>

            {totalQuestions === 0 ? (
              <View style={styles.noQuestionsBox}>
                <Text style={styles.noQuestionsText}>🔒 Frågorna aktiveras av kaninen under kvällen.</Text>
              </View>
            ) : done ? (
              <View style={styles.doneBox}>
                <Text style={styles.doneEmoji}>{correctCount === totalQuestions ? '🎉' : '🚴'}</Text>
                <Text style={styles.doneTitle}>{correctCount} av {totalQuestions} rätt!</Text>
                <Text style={styles.doneSub}>
                  {correctCount >= 4
                    ? 'Ta er till platsen — ni hittar den!'
                    : correctCount >= 2
                    ? 'Gör ett försök att ta er till platsen. Det kanske går!'
                    : 'Jag skulle hellre stanna hemma än att försöka hitta platsen.'}
                </Text>
                <TouchableOpacity style={styles.retryBtn} onPress={resetQuiz}>
                  <Text style={styles.retryBtnText}>Om inte, försök igen!</Text>
                </TouchableOpacity>
              </View>
            ) : activeQuestion ? (
              <View style={styles.quizInline}>
                <Text style={styles.quizCounter}>FRÅGA {currentQuestionIdx + 1} AV {totalQuestions}</Text>

                {activeQuestion.contentType === 'text' && activeQuestion.contentText ? (
                  <View style={styles.contentTextBox}>
                    <Text style={styles.contentText}>{activeQuestion.contentText}</Text>
                  </View>
                ) : activeQuestion.contentType === 'audio' && activeQuestion.contentUrl ? (
                  <AudioPlayer key={activeQuestion.id} url={activeQuestion.contentUrl} label={activeQuestion.contentText} />
                ) : activeQuestion.contentType === 'image' && activeQuestion.contentUrl ? (
                  <View style={styles.contentMediaBox}>
                    <Image source={{ uri: activeQuestion.contentUrl }} style={styles.contentImage} resizeMode="cover" />
                  </View>
                ) : activeQuestion.contentType === 'video' && activeQuestion.contentUrl ? (
                  <View style={styles.contentMediaBox}>
                    <Video source={{ uri: activeQuestion.contentUrl }} style={styles.contentVideo} resizeMode={ResizeMode.CONTAIN} shouldPlay={false} useNativeControls />
                  </View>
                ) : null}

                <Text style={styles.questionText}>{activeQuestion.question}</Text>

                {options.map((opt, i) => {
                  const isSelected = currentChoice === i;
                  const showFeedback = answerResult !== null && isSelected;
                  const isCorrectOption = i === activeQuestion.correctAnswer;
                  const showCorrect = answerResult !== null && isCorrectOption;
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.optionBtn,
                        isSelected && !answerResult ? styles.optionBtnSelected : null,
                        showFeedback && answerResult === 'correct' ? styles.optionBtnCorrect : null,
                        showFeedback && answerResult === 'wrong' ? styles.optionBtnWrong : null,
                        showCorrect && answerResult === 'wrong' ? styles.optionBtnCorrect : null,
                      ]}
                      onPress={() => { if (answerResult === null) setCurrentChoice(i); }}
                      activeOpacity={answerResult !== null ? 1 : 0.75}
                      disabled={answerResult !== null}
                    >
                      <Text style={[
                        styles.optionText,
                        isSelected && !answerResult ? styles.optionTextSelected : null,
                        (showFeedback || (showCorrect && answerResult === 'wrong')) ? styles.optionTextFeedback : null,
                      ]}>
                        {showFeedback && answerResult === 'correct' ? '✓ ' : showFeedback && answerResult === 'wrong' ? '✗ ' : showCorrect && answerResult === 'wrong' ? '✓ ' : ''}{opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                {answerResult === 'wrong' && (
                  <Text style={styles.correctAnswerHint}>
                    {'✓ Rätt svar: ' + options[activeQuestion.correctAnswer]}
                  </Text>
                )}

                {answerResult === null && (
                  <View style={styles.answerRow}>
                    <TouchableOpacity
                      style={[styles.answerBtn, currentChoice === null ? styles.answerBtnDisabled : null]}
                      onPress={handleAnswer}
                      disabled={currentChoice === null}
                    >
                      <Text style={styles.answerBtnText}>
                        {currentQuestionIdx === totalQuestions - 1 ? 'Svara ✓' : 'Svara →'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : null}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Full-screen flash overlay — correct (green) */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(46,125,50,0.35)', opacity: answerResult === 'correct' ? feedbackAnim : 0 }]}
      />
      {/* Full-screen flash overlay — wrong (red) */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(192,57,43,0.35)', opacity: answerResult === 'wrong' ? feedbackAnim : 0 }]}
      />
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
  headerTitle: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 34, color: '#F5EFE0' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 0, paddingTop: 28 },
  centerState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 22, gap: 12 },
  emptyTitle: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 22, color: '#2A2A2A' },
  emptySub: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: '#7A7060', textAlign: 'center' },
  separator: { height: 3, width: 40, backgroundColor: '#2A6B64', marginTop: 24, marginLeft: 22 },
  separatorSpaced: { height: 3, width: 40, backgroundColor: '#2A6B64', marginTop: 28, marginHorizontal: 22 },
  sectionLabel: { fontFamily: 'SpaceMono_400Regular', fontSize: 9, letterSpacing: 2, color: '#9A8E78', marginHorizontal: 22 },
  competitionTitle: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 26, color: '#1A1A1A', marginTop: 6, marginHorizontal: 22 },
  timeValue: { fontFamily: 'DMSans_400Regular', fontSize: 16, color: '#2A2A2A', marginTop: 4, marginHorizontal: 22 },
  imageWrapper: { marginHorizontal: 22, marginTop: 8, borderRadius: 14, overflow: 'hidden', aspectRatio: 1 },
  destinationImage: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  imagePlaceholderText: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' },
  imageProgress: { fontFamily: 'SpaceMono_400Regular', fontSize: 9.5, color: '#9A8E78', textAlign: 'center', marginTop: 8 },
  questionsIngress: { fontFamily: 'DMSans_400Regular', fontSize: 16, color: '#7A6B55', lineHeight: 22, marginHorizontal: 22, marginTop: 8 },
  noQuestionsBox: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 22 },
  noQuestionsText: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: '#9A8E78', textAlign: 'center' },
  // DONE
  doneBox: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 22, gap: 10 },
  doneEmoji: { fontSize: 48 },
  doneTitle: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 26, color: '#1A1A1A' },
  doneSub: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: '#7A6B55', textAlign: 'center' },
  retryBtn: { backgroundColor: '#1C4F4A', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 },
  retryBtnText: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#fff' },
  // QUIZ
  quizInline: { marginHorizontal: 22, marginTop: 12 },
  quizCounter: { fontFamily: 'SpaceMono_400Regular', fontSize: 8, color: '#9A8E78', letterSpacing: 0.5, marginBottom: 10 },
  questionText: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 17, color: '#1A1A1A', marginBottom: 16, lineHeight: 24 },
  optionBtn: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E0D8C8' },
  optionBtnSelected: { backgroundColor: '#1C4F4A', borderColor: '#1C4F4A' },
  optionBtnCorrect: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  optionBtnWrong: { backgroundColor: '#C0392B', borderColor: '#C0392B' },
  optionText: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: '#2A2A2A' },
  optionTextSelected: { color: '#fff' },
  optionTextFeedback: { color: '#fff', fontFamily: 'DMSans_600SemiBold' },
  answerRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  answerBtn: { backgroundColor: '#1C4F4A', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  answerBtnDisabled: { opacity: 0.3 },
  answerBtnText: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#fff' },
  correctAnswerHint: { fontFamily: 'DMSans_600SemiBold', fontSize: 13, color: '#2E7D32', marginTop: 4, marginBottom: 8 },
  contentTextBox: { backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 10, padding: 14, marginBottom: 14, borderLeftWidth: 3, borderLeftColor: '#2A6B64' },
  contentText: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: '#3A3A3A', lineHeight: 21 },
  contentMediaBox: { borderRadius: 10, overflow: 'hidden', marginBottom: 14, aspectRatio: 16 / 9 },
  contentImage: { width: '100%', height: '100%' },
  contentVideo: { width: '100%', height: '100%' },
  audioBox: { marginBottom: 14, gap: 10 },
  audioBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#1C4F4A', borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 20,
  },
  audioBtnText: { fontFamily: 'DMSans_600SemiBold', fontSize: 15, color: '#fff' },
  audioLabel: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: '#7A6B55', fontStyle: 'italic', paddingHorizontal: 2 },
});
