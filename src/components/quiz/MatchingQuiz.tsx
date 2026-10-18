import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Word } from '@/types/word';
import { useThemeStore } from '@/store/themeStore';
import { triggerHaptic } from '@/utils/haptics';
import { generateMatchingPairs } from '@/services/quizService';
import { Button } from '../common/Button';
import { Check } from 'lucide-react-native';

interface MatchingQuizProps {
  words: Word[];
  onFinish: (totalMatched: number, totalAttempts: number) => void;
}

export const MatchingQuiz: React.FC<MatchingQuizProps> = ({ words, onFinish }) => {
  const colors = useThemeStore((s) => s.getColors());

  const [pairData, setPairData] = useState(() => generateMatchingPairs(words, Math.min(6, words.length)));
  const [selectedEnglishId, setSelectedEnglishId] = useState<string | null>(null);
  const [selectedUzbekId, setSelectedUzbekId] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [mismatchIds, setMismatchIds] = useState<{ en: string; uz: string } | null>(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (pairData.pairs.length > 0 && matchedIds.size === pairData.pairs.length) {
      triggerHaptic('success');
      setTimeout(() => {
        onFinish(matchedIds.size, attempts);
      }, 500);
    }
  }, [matchedIds, pairData.pairs.length]);

  const handleEnglishSelect = (id: string) => {
    if (matchedIds.has(id)) return;
    triggerHaptic('selection');
    setSelectedEnglishId(id);

    if (selectedUzbekId) {
      checkMatch(id, selectedUzbekId);
    }
  };

  const handleUzbekSelect = (id: string) => {
    if (matchedIds.has(id)) return;
    triggerHaptic('selection');
    setSelectedUzbekId(id);

    if (selectedEnglishId) {
      checkMatch(selectedEnglishId, id);
    }
  };

  const checkMatch = (enId: string, uzId: string) => {
    setAttempts((prev) => prev + 1);

    if (enId === uzId) {
      triggerHaptic('success');
      setMatchedIds((prev) => new Set(prev).add(enId));
      setSelectedEnglishId(null);
      setSelectedUzbekId(null);
    } else {
      triggerHaptic('error');
      setMismatchIds({ en: enId, uz: uzId });
      setTimeout(() => {
        setMismatchIds(null);
        setSelectedEnglishId(null);
        setSelectedUzbekId(null);
      }, 600);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.instruction, { color: colors.textSecondary }]}>
        Connect the matching English and Uzbek words
      </Text>

      <ScrollView contentContainerStyle={styles.columnsContainer} showsVerticalScrollIndicator={false}>
        {/* Left Column: English */}
        <View style={styles.column}>
          <Text style={[styles.columnHeader, { color: colors.textMuted }]}>ENGLISH</Text>
          {pairData.englishList.map((item) => {
            const isMatched = matchedIds.has(item.id);
            const isSelected = selectedEnglishId === item.id;
            const isMismatch = mismatchIds?.en === item.id;

            let bg = colors.card;
            let border = colors.border;
            let text = colors.text;

            if (isMatched) {
              bg = colors.successLight;
              border = colors.success;
              text = colors.success;
            } else if (isMismatch) {
              bg = colors.dangerLight;
              border = colors.danger;
            } else if (isSelected) {
              bg = colors.primaryLight;
              border = colors.primary;
              text = colors.primary;
            }

            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleEnglishSelect(item.id)}
                disabled={isMatched}
                activeOpacity={0.7}
                style={[
                  styles.itemCard,
                  {
                    backgroundColor: bg,
                    borderColor: border,
                    opacity: isMatched ? 0.6 : 1,
                  },
                ]}
              >
                <Text style={[styles.itemText, { color: text }]} numberOfLines={2}>
                  {item.text}
                </Text>
                {isMatched && <Check size={16} color={colors.success} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Right Column: Uzbek */}
        <View style={styles.column}>
          <Text style={[styles.columnHeader, { color: colors.textMuted }]}>UZBEK</Text>
          {pairData.uzbekList.map((item) => {
            const isMatched = matchedIds.has(item.id);
            const isSelected = selectedUzbekId === item.id;
            const isMismatch = mismatchIds?.uz === item.id;

            let bg = colors.card;
            let border = colors.border;
            let text = colors.text;

            if (isMatched) {
              bg = colors.successLight;
              border = colors.success;
              text = colors.success;
            } else if (isMismatch) {
              bg = colors.dangerLight;
              border = colors.danger;
            } else if (isSelected) {
              bg = colors.primaryLight;
              border = colors.primary;
              text = colors.primary;
            }

            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleUzbekSelect(item.id)}
                disabled={isMatched}
                activeOpacity={0.7}
                style={[
                  styles.itemCard,
                  {
                    backgroundColor: bg,
                    borderColor: border,
                    opacity: isMatched ? 0.6 : 1,
                  },
                ]}
              >
                <Text style={[styles.itemText, { color: text }]} numberOfLines={2}>
                  {item.text}
                </Text>
                {isMatched && <Check size={16} color={colors.success} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  instruction: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },
  columnsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 24,
  },
  column: {
    flex: 1,
    gap: 10,
  },
  columnHeader: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
    textAlign: 'center',
  },
  itemCard: {
    minHeight: 64,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  itemText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 1,
  },
});
