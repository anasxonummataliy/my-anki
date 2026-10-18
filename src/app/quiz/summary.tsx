import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '@/store/themeStore';
import { getQuizResult } from '@/db/repositories/quizRepository';
import { QuizResult } from '@/types/quiz';
import { useStudyStore } from '@/store/studyStore';
import { generateQuizQuestions } from '@/services/quizService';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { triggerHaptic } from '@/utils/haptics';
import {
  ChevronLeft,
  CheckCircle2,
  XCircle,
} from 'lucide-react-native';

export default function QuizSummaryScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const insets = useSafeAreaInsets();
  const colors = useThemeStore((s) => s.getColors());
  const startQuiz = useStudyStore((s) => s.startQuiz);

  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!sessionId) return;
      try {
        const res = await getQuizResult(sessionId);
        setResult(res);
      } catch (err) {
        console.error('Error loading quiz result:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sessionId]);

  const incorrectAnswers = result?.answers.filter((a) => !a.isCorrect) || [];

  const handleRetryMistakes = async () => {
    if (!result || incorrectAnswers.length === 0) return;
    triggerHaptic('medium');

    const missedWords = incorrectAnswers
      .map((a) => a.word)
      .filter((w): w is NonNullable<typeof w> => Boolean(w));

    const questions = await generateQuizQuestions(
      missedWords,
      result.session.mode,
      missedWords.length
    );

    startQuiz(result.session.deckId || null, result.session.mode, questions);
    router.replace('/quiz/session');
  };

  const handleDone = () => {
    triggerHaptic('selection');
    router.replace('/(tabs)');
  };

  if (loading || !result) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const { session, answers, accuracy } = result;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 16,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={handleDone}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ChevronLeft size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Quiz Result</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Circular Progress Ring */}
        <View style={styles.ringWrapper}>
          <View
            style={[
              styles.circularRing,
              {
                borderColor: '#10B981', // Crisp emerald green matching Screen 10
                backgroundColor: colors.card,
              },
            ]}
          >
            <Text style={[styles.ringScore, { color: colors.text }]}>
              {session.correctAnswers}/{session.totalQuestions}
            </Text>
            <Text style={[styles.ringLabel, { color: '#10B981' }]}>Correct</Text>
          </View>
        </View>

        {/* 3-Column Stats Row */}
        <Card variant="elevated" style={styles.statsCard}>
          <View style={styles.statColumn}>
            <Text style={[styles.statBigNumber, { color: '#10B981' }]}>
              {session.correctAnswers}
            </Text>
            <Text style={[styles.statColumnLabel, { color: colors.textSecondary }]}>
              Correct
            </Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />

          <View style={styles.statColumn}>
            <Text
              style={[
                styles.statBigNumber,
                { color: incorrectAnswers.length > 0 ? '#EF4444' : colors.textSecondary },
              ]}
            >
              {incorrectAnswers.length}
            </Text>
            <Text style={[styles.statColumnLabel, { color: colors.textSecondary }]}>
              Incorrect
            </Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: colors.borderLight }]} />

          <View style={styles.statColumn}>
            <Text style={[styles.statBigNumber, { color: colors.text }]}>
              {accuracy}%
            </Text>
            <Text style={[styles.statColumnLabel, { color: colors.textSecondary }]}>
              Accuracy
            </Text>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtonsArea}>
          {incorrectAnswers.length > 0 && (
            <Button
              title="Review Incorrect"
              onPress={handleRetryMistakes}
              variant="primary"
              size="lg"
              style={styles.actionBtn}
            />
          )}

          <Button
            title="Back to Home"
            onPress={handleDone}
            variant={incorrectAnswers.length > 0 ? 'secondary' : 'primary'}
            size="lg"
            style={styles.actionBtn}
          />
        </View>

        {/* Question Breakdown */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          QUESTION BREAKDOWN
        </Text>

        <View style={styles.answersList}>
          {answers.map((ans) => (
            <Card
              key={ans.id}
              style={[
                styles.answerItemCard,
                {
                  borderColor: ans.isCorrect ? colors.border : '#FEE2E2',
                },
              ]}
            >
              <View style={styles.answerItemRow}>
                <View style={styles.statusIconBox}>
                  {ans.isCorrect ? (
                    <CheckCircle2 size={22} color="#10B981" />
                  ) : (
                    <XCircle size={22} color="#EF4444" />
                  )}
                </View>

                <View style={styles.answerDetails}>
                  <Text style={[styles.questionWord, { color: colors.text }]}>
                    {ans.word?.word || 'Word'}
                  </Text>

                  {!ans.isCorrect ? (
                    <View style={styles.mismatchInfo}>
                      <Text style={[styles.userAnsText, { color: '#EF4444' }]}>
                        Your answer: {ans.userAnswer}
                      </Text>
                      <Text style={[styles.correctAnsText, { color: '#10B981' }]}>
                        Correct: {ans.correctAnswer}
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.correctAnsText, { color: '#10B981' }]}>
                      {ans.correctAnswer}
                    </Text>
                  )}
                </View>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  ringWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 28,
  },
  circularRing: {
    width: 154,
    height: 154,
    borderRadius: 77,
    borderWidth: 7,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  ringScore: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  ringLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  statsCard: {
    flexDirection: 'row',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
  },
  statBigNumber: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  statColumnLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 36,
  },
  actionButtonsArea: {
    gap: 12,
    marginBottom: 32,
  },
  actionBtn: {
    width: '100%',
    height: 54,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  answersList: {
    gap: 10,
  },
  answerItemCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  answerItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  statusIconBox: {
    marginTop: 2,
  },
  answerDetails: {
    flex: 1,
  },
  questionWord: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  mismatchInfo: {
    marginTop: 4,
    gap: 2,
  },
  userAnsText: {
    fontSize: 13,
    fontWeight: '500',
  },
  correctAnsText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
