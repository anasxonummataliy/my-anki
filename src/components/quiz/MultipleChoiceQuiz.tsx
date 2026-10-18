import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { QuizQuestion } from '@/types/quiz';
import { useThemeStore } from '@/store/themeStore';
import { triggerHaptic } from '@/utils/haptics';
import { Button } from '../common/Button';
import { CheckCircle2, XCircle, Circle } from 'lucide-react-native';

interface MultipleChoiceQuizProps {
  question: QuizQuestion;
  onAnswer: (userAnswer: string, isCorrect: boolean) => void;
}

export const MultipleChoiceQuiz: React.FC<MultipleChoiceQuizProps> = ({
  question,
  onAnswer,
}) => {
  const colors = useThemeStore((s) => s.getColors());
  const isDark = useThemeStore((s) => s.isDark());
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleSelect = (option: string) => {
    if (hasSubmitted) return;
    setSelectedOption(option);
    setHasSubmitted(true);

    const isCorrect =
      option.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
    if (isCorrect) {
      triggerHaptic('success');
    } else {
      triggerHaptic('error');
    }
  };

  const handleNext = () => {
    if (!selectedOption) return;
    const isCorrect =
      selectedOption.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
    onAnswer(selectedOption, isCorrect);
    setSelectedOption(null);
    setHasSubmitted(false);
  };

  // Formulate natural question headline matching mockup Screen 9
  const isEnglishWord = question.prompt === question.word.word;
  const questionTitle = isEnglishWord
    ? `What is the meaning of\n"${question.prompt}"?`
    : `"${question.prompt}" so'zining inglizcha tarjimasi nima?`;

  return (
    <View style={styles.container}>
      {/* Question Headline */}
      <View style={styles.questionSection}>
        <Text style={[styles.questionHeadline, { color: colors.text }]}>
          {questionTitle}
        </Text>
      </View>

      {/* Options List */}
      <View style={styles.optionsList}>
        {question.options?.map((option, index) => {
          let bg = colors.card;
          let border = colors.border;
          let textColor = colors.text;
          let icon = <Circle size={20} color={colors.border} />;

          if (hasSubmitted) {
            const isThisCorrect =
              option.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
            const isThisSelected = option === selectedOption;

            if (isThisCorrect) {
              bg = isDark ? '#064E3B' : '#E8F8EE';
              border = '#10B981';
              textColor = isDark ? '#A7F3D0' : '#065F46';
              icon = <CheckCircle2 size={22} color="#10B981" />;
            } else if (isThisSelected) {
              bg = isDark ? '#7F1D1D' : '#FEE2E2';
              border = '#EF4444';
              textColor = isDark ? '#FECACA' : '#991B1B';
              icon = <XCircle size={22} color="#EF4444" />;
            }
          }

          return (
            <TouchableOpacity
              key={`${index}-${option}`}
              onPress={() => handleSelect(option)}
              disabled={hasSubmitted}
              activeOpacity={0.7}
              style={[
                styles.optionButton,
                {
                  backgroundColor: bg,
                  borderColor: border,
                },
              ]}
            >
              <View style={styles.optionLeft}>
                {icon}
                <Text style={[styles.optionText, { color: textColor }]}>
                  {option}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Next Button */}
      <View style={styles.footer}>
        <Button
          title="Next"
          onPress={handleNext}
          disabled={!hasSubmitted}
          size="lg"
          variant="primary"
          style={styles.nextBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  questionSection: {
    paddingVertical: 24,
  },
  questionHeadline: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  optionsList: {
    gap: 12,
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 10,
  },
  optionButton: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  footer: {
    paddingTop: 16,
  },
  nextBtn: {
    width: '100%',
    height: 54,
    borderRadius: 16,
  },
});
