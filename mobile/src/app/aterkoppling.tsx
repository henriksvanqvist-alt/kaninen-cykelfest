import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/lib/api/api';
import { useAppStore } from '@/lib/state/store';

const STORAGE_KEY = 'aterkoppling_done';

const DEFAULT_QUESTIONS = [
  { question: 'Hur var kvällen som helhet?', options: ['Fantastisk', 'Mycket bra', 'Bra', 'Okej', 'Kunde varit bättre'] },
  { question: 'Hur trivdes du med ditt lag?', options: ['Perfekt lagkemi', 'Bra stämning', 'Okej', 'Lite trögt', 'Ville byta lag'] },
  { question: 'Skulle du vilja komma tillbaka nästa år?', options: ['Ja, absolut!', 'Troligtvis ja', 'Vet inte', 'Troligtvis inte'] },
  { question: 'Hur lagom svårt var ert uppdrag? (om ni hade ett)', options: ['Lagom utmanande', 'Lite för enkelt', 'Lite för svårt', 'Vi hade inget uppdrag'] },
];

export default function AterkopplingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const participant = useAppStore((s) => s.participant);

  const [alreadyDone, setAlreadyDone] = useState<boolean | null>(null);
  const [currentStep, setCurrentStep] = useState(0); // 0-3 = questions, 4 = comment, 5 = done
  const [answers, setAnswers] = useState<(number | null)[]>([null, null, null, null]);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState<{ question: string; options: string[] }[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val === 'true') {
        setAlreadyDone(true);
        setCurrentStep(5);
      } else {
        setAlreadyDone(false);
      }
    });
  }, []);

  useEffect(() => {
    api.get<{ question: string; options: string[]; position?: number }[]>('/api/cykelfest/feedback/questions')
      .then((data) => {
        const sorted = [...data].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        setQuestions(sorted.map(({ question, options }) => ({ question, options })));
      })
      .catch(() => {
        setQuestions(DEFAULT_QUESTIONS);
      })
      .finally(() => {
        setQuestionsLoading(false);
      });
  }, []);

  function animateTransition(callback: () => void) {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      callback();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    });
  }

  function handleNext() {
    animateTransition(() => {
      setCurrentStep((s) => s + 1);
    });
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await api.post('/api/cykelfest/feedback', {
        participantId: participant?.id ?? null,
        q1: answers[0] !== null ? answers[0] + 1 : null,
        q2: answers[1] !== null ? answers[1] + 1 : null,
        q3: answers[2] !== null ? answers[2] + 1 : null,
        q4: answers[3] !== null ? answers[3] + 1 : null,
        comment: comment.trim() || null,
      });
    } catch (e: any) {
      // 409 = already submitted — treat as success
      if (e?.status !== 409 && e?.response?.status !== 409) {
        console.error('[Aterkoppling] submit error:', e);
      }
    }
    await AsyncStorage.setItem(STORAGE_KEY, 'true');
    setSubmitting(false);
    animateTransition(() => {
      setCurrentStep(5);
    });
  }

  if (alreadyDone === null || questionsLoading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color="#1C4F4A" />
      </View>
    );
  }

  const isQuestionStep = currentStep >= 0 && currentStep <= 3;
  const isCommentStep = currentStep === 4;
  const isDoneStep = currentStep === 5;

  const progressFraction = Math.min(currentStep / 5, 1);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <LinearGradient
        colors={['#1C4F4A', '#2A6B64']}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} testID="back-button">
          <ChevronLeft size={22} color="rgba(245,239,224,0.9)" />
        </TouchableOpacity>
        <Text style={styles.headerEyebrow}>KANINENS CYKELFEST 2026</Text>
        <Text style={styles.headerTitle}>Återkoppling</Text>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isDoneStep ? (
          <View style={styles.doneContainer} testID="done-screen">
            <Text style={styles.doneEmoji}>{'🎉'}</Text>
            <Text style={styles.doneTitle}>Tack!</Text>
            <Text style={styles.doneSub}>
              Din återkoppling har skickats in. Tack för att du var med på Cykelfesten 2026!
            </Text>
            <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()} testID="done-back-button">
              <Text style={styles.doneBtnText}>Tillbaka till appen</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Progress bar */}
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${progressFraction * 100}%` }]} />
            </View>

            <Animated.View style={{ opacity: fadeAnim }}>
              {isQuestionStep ? (
                <View style={styles.quizArea} testID={`question-step-${currentStep}`}>
                  <Text style={styles.stepCounter}>FRÅGA {currentStep + 1} AV 4</Text>
                  <Text style={styles.questionText}>{questions[currentStep]?.question}</Text>

                  {(questions[currentStep]?.options ?? []).map((opt: string, i: number) => {
                    const isSelected = answers[currentStep] === i;
                    return (
                      <TouchableOpacity
                        key={i}
                        style={[styles.optionBtn, isSelected ? styles.optionBtnSelected : null]}
                        onPress={() => {
                          const next = [...answers];
                          next[currentStep] = i;
                          setAnswers(next);
                        }}
                        activeOpacity={0.75}
                        testID={`option-${currentStep}-${i}`}
                      >
                        <Text style={[styles.optionText, isSelected ? styles.optionTextSelected : null]}>
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}

                  <View style={styles.navRow}>
                    <TouchableOpacity
                      style={[styles.nextBtn, answers[currentStep] === null ? styles.nextBtnDisabled : null]}
                      onPress={handleNext}
                      disabled={answers[currentStep] === null}
                      testID="next-button"
                    >
                      <Text style={styles.nextBtnText}>Nästa →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : isCommentStep ? (
                <View style={styles.quizArea} testID="comment-step">
                  <Text style={styles.stepLabel}>ÖVRIGA KOMMENTARER</Text>
                  <Text style={styles.questionText}>Något mer du vill dela med dig av?</Text>

                  <TextInput
                    style={styles.commentInput}
                    placeholder="Skriv gärna vad du tyckte..."
                    placeholderTextColor="#B0A898"
                    value={comment}
                    onChangeText={setComment}
                    multiline
                    numberOfLines={5}
                    textAlignVertical="top"
                    testID="comment-input"
                  />

                  <View style={styles.navRow}>
                    <TouchableOpacity
                      style={[styles.nextBtn, submitting ? styles.nextBtnDisabled : null]}
                      onPress={handleSubmit}
                      disabled={submitting}
                      testID="submit-button"
                    >
                      {submitting ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.nextBtnText}>Skicka in →</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}
            </Animated.View>
          </>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 8,
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginHorizontal: 22,
    marginTop: 20,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1C4F4A',
    borderRadius: 2,
  },
  quizArea: {
    marginHorizontal: 22,
    marginTop: 24,
  },
  stepCounter: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 12,
    letterSpacing: 1.5,
    color: '#6B6050',
    marginBottom: 14,
  },
  stepLabel: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 12,
    letterSpacing: 2,
    color: '#6B6050',
    marginBottom: 10,
  },
  questionText: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 22,
    color: '#1A1A1A',
    marginBottom: 20,
    lineHeight: 30,
  },
  optionBtn: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: '#E0D8C8',
  },
  optionBtnSelected: {
    backgroundColor: '#1C4F4A',
    borderColor: '#1C4F4A',
  },
  optionText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: '#2A2A2A',
  },
  optionTextSelected: {
    color: '#fff',
    fontFamily: 'DMSans_600SemiBold',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  nextBtn: {
    backgroundColor: '#1C4F4A',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 13,
    minWidth: 120,
    alignItems: 'center',
  },
  nextBtnDisabled: {
    opacity: 0.3,
  },
  nextBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: '#fff',
  },
  commentInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0D8C8',
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: '#2A2A2A',
    minHeight: 130,
    marginBottom: 4,
  },
  // Done screen
  doneContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
    gap: 16,
  },
  doneEmoji: {
    fontSize: 64,
  },
  doneTitle: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 42,
    color: '#1A1A1A',
  },
  doneSub: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: '#5A5040',
    textAlign: 'center',
    lineHeight: 22,
  },
  doneBtn: {
    backgroundColor: '#1C4F4A',
    borderRadius: 10,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginTop: 8,
  },
  doneBtnText: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 14,
    color: '#fff',
  },
});
