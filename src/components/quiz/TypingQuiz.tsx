import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { QuizQuestion } from '@/types/quiz';
import { useThemeStore } from '@/store/themeStore';
import { triggerHaptic } from '@/utils/haptics';
import { Button } from '../common/Button';
import { checkTypingAnswer } from '@/services/quizService';
import { CheckCircle2, XCircle } from 'lucide-react-native';

interface TypingQuizProps {
  question: QuizQuestion;
  onAnswer: (userAnswer: string, isCorrect: boolean) => void;
}

export const TypingQuiz: React.FC<TypingQuizProps> = ({ question, onAnswer }) => {
  const colors = useThemeStore((s) => s.getColors());
  const isDark = useThemeStore((s) => s.isDark());
  const [input, setInput] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSubmit = () => {
    if (!input.trim() || hasSubmitted) return;

    const correct = checkTypingAnswer(input, question.correctAnswer);
    setIsCorrect(correct);
    setHasSubmitted(true);

    if (correct) {
      triggerHaptic('success');
    } else {
      triggerHaptic('error');
    }
  };

  const handleNext = () => {
    onAnswer(input.trim(), isCorrect);
    setInput('');
    setHasSubmitted(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Prompt Card */}
        <View
          style={[
            styles.promptCard,
            {
              backgroundColor: colors.card,
              borderColor: isDark ? colors.border : '#E2E8F0',
            },
          ]}
        >
          <Text style={[styles.promptLabel, { color: colors.textMuted }]}>
            TRANSLATE TO ENGLISH
          </Text>
          <Text style={[styles.promptText, { color: colors.text }]}>
            {question.prompt}
          </Text>
          {question.secondaryPrompt ? (
            <Text style={[styles.secondaryText, { color: colors.textSecondary }]}>
              {question.secondaryPrompt}
            </Text>
          ) : null}
        </View>

        {/* Input Field */}
        <View style={styles.inputContainer}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type English word..."
            placeholderTextColor={colors.textMuted}
            editable={!hasSubmitted}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            onSubmitEditing={handleSubmit}
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: hasSubmitted
                  ? isCorrect
                    ? colors.success
                    : colors.danger
                  : colors.border,
                color: colors.text,
              },
            ]}
          />
        </View>

        {/* Feedback Section */}
        {hasSubmitted && (
          <View
            style={[
              styles.feedbackCard,
              {
                backgroundColor: isCorrect ? colors.successLight : colors.dangerLight,
                borderColor: isCorrect ? colors.success : colors.danger,
              },
            ]}
          >
            <View style={styles.feedbackHeader}>
              {isCorrect ? (
                <>
                  <CheckCircle2 size={24} color={colors.success} />
                  <Text style={[styles.feedbackTitle, { color: colors.success }]}>
                    Correct! Great job.
                  </Text>
                </>
              ) : (
                <>
                  <XCircle size={24} color={colors.danger} />
                  <Text style={[styles.feedbackTitle, { color: colors.danger }]}>
                    Incorrect
                  </Text>
                </>
              )}
            </View>

            {!isCorrect && (
              <View style={styles.correctAnswerBox}>
                <Text style={[styles.correctAnswerLabel, { color: colors.textSecondary }]}>
                  Correct answer:
                </Text>
                <Text style={[styles.correctAnswerText, { color: colors.text }]}>
                  {question.correctAnswer}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Action Footer */}
      <View style={styles.footer}>
        {!hasSubmitted ? (
          <Button
            title="Check Answer"
            onPress={handleSubmit}
            disabled={!input.trim()}
            size="lg"
            variant="primary"
          />
        ) : (
          <Button
            title="Continue"
            onPress={handleNext}
            size="lg"
            variant="primary"
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  promptCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
  },
  promptLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  promptText: {
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  secondaryText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    paddingHorizontal: 18,
    fontSize: 18,
    fontWeight: '600',
  },
  feedbackCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedbackTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  correctAnswerBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  correctAnswerLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  correctAnswerText: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  footer: {
    marginTop: 16,
  },
});
