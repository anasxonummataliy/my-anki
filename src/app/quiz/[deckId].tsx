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
import { getAllDescendantDeckIds } from '@/db/repositories/deckRepository';
import { getWordsForDeckIds, getWords } from '@/db/repositories/wordRepository';
import { getMistakeWords } from '@/db/repositories/quizRepository';
import { Word } from '@/types/word';
import { QuizMode } from '@/types/quiz';
import { generateQuizQuestions } from '@/services/quizService';
import { useStudyStore } from '@/store/studyStore';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { triggerHaptic } from '@/utils/haptics';
import {
  Sparkles,
  HelpCircle,
  Keyboard,
  Shuffle,
  AlertTriangle,
  Play,
} from 'lucide-react-native';

const QUESTION_COUNTS = [5, 10, 15, 20];

export default function QuizSetupScreen() {
  const { deckId, mode: initialMode } = useLocalSearchParams<{
    deckId: string;
    mode?: string;
  }>();
  const insets = useSafeAreaInsets();
  const colors = useThemeStore((s) => s.getColors());
  const startQuiz = useStudyStore((s) => s.startQuiz);

  const [selectedMode, setSelectedMode] = useState<QuizMode>(
    (initialMode as QuizMode) || 'mc_en_uz'
  );
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWords() {
      try {
        let pool: Word[] = [];
        if (selectedMode === 'mistakes') {
          pool = await getMistakeWords(
            deckId && deckId !== 'all' ? [deckId] : undefined,
            30
          );
        } else if (deckId && deckId !== 'all') {
          const ids = await getAllDescendantDeckIds(deckId);
          pool = await getWordsForDeckIds(ids);
        } else {
          pool = await getWords();
        }
        setWords(pool);
      } catch (err) {
        console.error('Error loading words for quiz:', err);
      } finally {
        setLoading(false);
      }
    }
    loadWords();
  }, [deckId, selectedMode]);

  const handleStart = async () => {
    if (words.length === 0) return;
    setLoading(true);
    triggerHaptic('medium');

    try {
      const questions = await generateQuizQuestions(
        words,
        selectedMode,
        Math.min(questionCount, words.length)
      );

      startQuiz(deckId === 'all' ? null : deckId, selectedMode, questions);
      router.replace('/quiz/session');
    } catch (err) {
      console.error('Error generating quiz:', err);
    } finally {
      setLoading(false);
    }
  };

  const modes: { mode: QuizMode; title: string; icon: React.ReactNode }[] = [
    {
      mode: 'mc_en_uz',
      title: 'English → Uzbek',
      icon: <HelpCircle size={18} color="#0EA5E9" />,
    },
    {
      mode: 'mc_uz_en',
      title: 'Uzbek → English',
      icon: <HelpCircle size={18} color="#8B5CF6" />,
    },
    {
      mode: 'typing',
      title: 'Typing Test',
      icon: <Keyboard size={18} color="#10B981" />,
    },
    {
      mode: 'matching',
      title: 'Connect Pairs',
      icon: <Shuffle size={18} color="#F59E0B" />,
    },
    {
      mode: 'mistakes',
      title: 'Mistakes Review',
      icon: <AlertTriangle size={18} color="#EF4444" />,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Header title="Quiz Setup" showBack onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Mode Selector */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          SELECT QUIZ MODE
        </Text>
        <View style={styles.modeGrid}>
          {modes.map((m) => {
            const isSelected = selectedMode === m.mode;
            return (
              <TouchableOpacity
                key={m.mode}
                onPress={() => {
                  triggerHaptic('selection');
                  setSelectedMode(m.mode);
                }}
                activeOpacity={0.7}
                style={[
                  styles.modeButton,
                  {
                    backgroundColor: isSelected ? colors.primaryLight : colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                {m.icon}
                <Text
                  style={[
                    styles.modeButtonText,
                    { color: isSelected ? colors.primary : colors.text },
                  ]}
                >
                  {m.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Question Count */}
        {selectedMode !== 'matching' && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              NUMBER OF QUESTIONS
            </Text>
            <View style={styles.countRow}>
              {QUESTION_COUNTS.map((count) => {
                const isSelected = questionCount === count;
                return (
                  <TouchableOpacity
                    key={count}
                    onPress={() => {
                      triggerHaptic('selection');
                      setQuestionCount(count);
                    }}
                    style={[
                      styles.countPill,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surface,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.countPillText,
                        { color: isSelected ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {count}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* Pool Summary Card */}
        <Card style={styles.summaryCard}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>
            Vocabulary Pool
          </Text>
          <Text style={[styles.summaryDescription, { color: colors.textSecondary }]}>
            {words.length} available vocabulary entries for this quiz.
            {selectedMode === 'mistakes' && words.length === 0
              ? ' You have no recorded mistakes to practice! Great job.'
              : ''}
          </Text>
        </Card>

        {/* Start Button */}
        <View style={styles.footer}>
          <Button
            title="Start Quiz"
            onPress={handleStart}
            disabled={words.length === 0 || loading}
            loading={loading}
            size="lg"
            variant="primary"
            icon={<Play size={18} color="#FFFFFF" />}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 10,
  },
  modeGrid: {
    gap: 10,
    marginBottom: 20,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  modeButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  countRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  countPill: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countPillText: {
    fontSize: 15,
    fontWeight: '700',
  },
  summaryCard: {
    padding: 18,
    borderRadius: 18,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    marginTop: 10,
  },
});
