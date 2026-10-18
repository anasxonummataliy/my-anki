import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '@/store/themeStore';
import { useStudyStore } from '@/store/studyStore';
import { saveQuizSession } from '@/db/repositories/quizRepository';
import { MultipleChoiceQuiz } from '@/components/quiz/MultipleChoiceQuiz';
import { TypingQuiz } from '@/components/quiz/TypingQuiz';
import { MatchingQuiz } from '@/components/quiz/MatchingQuiz';
import { triggerHaptic } from '@/utils/haptics';
import { ChevronLeft } from 'lucide-react-native';

export default function QuizSessionScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeStore((s) => s.getColors());

  const {
    quizDeckId,
    quizMode,
    quizQuestions,
    quizCurrentIndex,
    quizAnswers,
    recordQuizAnswer,
    nextQuizQuestion,
    resetQuiz,
  } = useStudyStore();

  const [isFinishing, setIsFinishing] = useState(false);

  const currentQuestion = quizQuestions[quizCurrentIndex];
  const totalQuestions = quizQuestions.length;
  const progressPercent = totalQuestions > 0
    ? Math.min(100, Math.round(((quizCurrentIndex) / totalQuestions) * 100))
    : 0;

  const handleExit = () => {
    triggerHaptic('warning');
    Alert.alert(
      'Exit Quiz?',
      'Your current quiz progress will not be saved.',
      [
        { text: 'Keep Playing', style: 'cancel' },
        {
          text: 'Exit',
          style: 'destructive',
          onPress: () => {
            resetQuiz();
            router.back();
          },
        },
      ]
    );
  };

  const handleAnswer = async (userAnswer: string, isCorrect: boolean) => {
    if (!currentQuestion) return;

    recordQuizAnswer(currentQuestion.id, userAnswer, currentQuestion.correctAnswer, isCorrect);

    const isLast = quizCurrentIndex + 1 >= totalQuestions;
    if (isLast) {
      setIsFinishing(true);
      const allAnswers = [
        ...quizAnswers,
        {
          wordId: currentQuestion.id,
          userAnswer,
          correctAnswer: currentQuestion.correctAnswer,
          isCorrect,
        },
      ];
      const correctCount = allAnswers.filter((a) => a.isCorrect).length;

      try {
        const sessionId = await saveQuizSession({
          deckId: quizDeckId,
          mode: quizMode || 'mc_en_uz',
          totalQuestions: allAnswers.length,
          correctAnswers: correctCount,
          answers: allAnswers,
        });

        router.replace({
          pathname: '/quiz/summary',
          params: { sessionId },
        });
      } catch (err) {
        console.error('Error saving quiz session:', err);
      }
    } else {
      nextQuizQuestion();
    }
  };

  const handleMatchingFinish = async (totalMatched: number, totalAttempts: number) => {
    setIsFinishing(true);
    const answers = quizQuestions.map((q) => ({
      wordId: q.id,
      userAnswer: q.correctAnswer,
      correctAnswer: q.correctAnswer,
      isCorrect: true,
    }));

    try {
      const sessionId = await saveQuizSession({
        deckId: quizDeckId,
        mode: 'matching',
        totalQuestions: totalMatched,
        correctAnswers: totalMatched,
        answers,
      });

      router.replace({
        pathname: '/quiz/summary',
        params: { sessionId },
      });
    } catch (err) {
      console.error('Error saving matching quiz session:', err);
    }
  };

  if (!quizMode || quizQuestions.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 20 }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No quiz active.
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backBtnText, { color: colors.primary }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 8,
        },
      ]}
    >
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleExit} style={styles.closeBtn} activeOpacity={0.7}>
          <ChevronLeft size={28} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.modeTitleText, { color: colors.text }]}>
          {quizMode === 'matching'
            ? 'Connect Pairs'
            : quizMode === 'typing'
            ? 'Typing Test'
            : 'Multiple Choice'}
        </Text>

        {quizMode !== 'matching' ? (
          <Text style={[styles.progressCountText, { color: colors.textSecondary }]}>
            {quizCurrentIndex + 1}/{totalQuestions}
          </Text>
        ) : (
          <View style={{ width: 32 }} />
        )}
      </View>

      {/* Progress Bar */}
      {quizMode !== 'matching' && (
        <View style={[styles.progressBarTrack, { backgroundColor: colors.surface }]}>
          <View
            style={[
              styles.progressBarFill,
              { backgroundColor: colors.primary, width: `${progressPercent}%` },
            ]}
          />
        </View>
      )}

      {/* Question Content */}
      <View style={styles.quizArea}>
        {quizMode === 'matching' ? (
          <MatchingQuiz
            words={quizQuestions.map((q) => q.word)}
            onFinish={handleMatchingFinish}
          />
        ) : quizMode === 'typing' ? (
          <TypingQuiz
            key={currentQuestion.id}
            question={currentQuestion}
            onAnswer={handleAnswer}
          />
        ) : (
          <MultipleChoiceQuiz
            key={currentQuestion.id}
            question={currentQuestion}
            onAnswer={handleAnswer}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  closeBtn: {
    padding: 6,
    marginLeft: -4,
  },
  modeTitleText: {
    fontSize: 18,
    fontWeight: '700',
  },
  progressCountText: {
    fontSize: 15,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 4,
    marginHorizontal: 16,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  quizArea: {
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 40,
  },
  backBtn: {
    marginTop: 16,
    alignSelf: 'center',
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
