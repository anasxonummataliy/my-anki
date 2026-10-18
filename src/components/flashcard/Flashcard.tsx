import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { WordWithReview } from '@/types/word';
import { useThemeStore } from '@/store/themeStore';
import { Badge } from '../common/Badge';
import { triggerHaptic } from '@/utils/haptics';
import { Volume2, RotateCcw } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;
const CARD_HEIGHT = 440;

interface FlashcardProps {
  card: WordWithReview;
  isFlipped: boolean;
  onFlip: () => void;
}

export const Flashcard: React.FC<FlashcardProps> = ({ card, isFlipped, onFlip }) => {
  const colors = useThemeStore((s) => s.getColors());
  const isDark = useThemeStore((s) => s.isDark());
  const rotateAnim = useSharedValue(0);

  useEffect(() => {
    rotateAnim.value = withTiming(isFlipped ? 180 : 0, { duration: 320 });
  }, [isFlipped]);

  const handleCardPress = () => {
    triggerHaptic('selection');
    onFlip();
  };

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateValue = interpolate(rotateAnim.value, [0, 180], [0, 180]);
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateValue}deg` },
      ],
      opacity: rotateAnim.value >= 90 ? 0 : 1,
      zIndex: rotateAnim.value >= 90 ? 0 : 1,
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateValue = interpolate(rotateAnim.value, [0, 180], [180, 360]);
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${rotateValue}deg` },
      ],
      opacity: rotateAnim.value < 90 ? 0 : 1,
      zIndex: rotateAnim.value < 90 ? 0 : 1,
    };
  });

  const baseCardStyle = {
    backgroundColor: colors.card,
    borderColor: isDark ? colors.border : '#E5E7EB',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.35 : 0.08,
    shadowRadius: 16,
    elevation: 6,
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={handleCardPress}
        style={styles.touchArea}
      >
        {/* FRONT SIDE (Screen 7 in reference mockup) */}
        <Animated.View style={[styles.card, baseCardStyle, frontAnimatedStyle]}>
          <View style={styles.headerRow}>
            <View style={{ width: 24 }} />
            <Text style={[styles.hintText, { color: colors.textMuted }]}>
              Tap to flip
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.frontCenter}>
            <Text style={[styles.wordTitle, { color: colors.text }]}>
              {card.word}
            </Text>

            {card.partOfSpeech && (
              <View style={[styles.frontPosBadge, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.frontPosText, { color: colors.primary }]}>
                  {card.partOfSpeech}
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={() => triggerHaptic('light')}
              style={[styles.speakerBtn, { backgroundColor: colors.surface }]}
              activeOpacity={0.7}
            >
              <Volume2 size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.footerRow}>
            <View style={styles.flipPrompt}>
              <RotateCcw size={15} color={colors.textSecondary} />
              <Text style={[styles.flipPromptText, { color: colors.textSecondary }]}>
                Show Answer
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* BACK SIDE (Screen 8 in reference mockup) */}
        <Animated.View
          style={[styles.card, baseCardStyle, styles.backCard, backAnimatedStyle]}
        >
          <View style={styles.headerRow}>
            <View style={{ width: 24 }} />
            <Text style={[styles.hintText, { color: colors.textMuted }]}>
              Card Details
            </Text>
            <TouchableOpacity
              onPress={() => triggerHaptic('light')}
              style={styles.speakerBtnSmall}
              activeOpacity={0.7}
            >
              <Volume2 size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.backScroll}
            contentContainerStyle={styles.backScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* English word & POS */}
            <View style={styles.backTopHeader}>
              <Text style={[styles.backWordTitle, { color: colors.text }]}>
                {card.word}
              </Text>
              {card.partOfSpeech && (
                <View style={[styles.frontPosBadge, { backgroundColor: colors.primaryLight, alignSelf: 'center' }]}>
                  <Text style={[styles.frontPosText, { color: colors.primary }]}>
                    {card.partOfSpeech}
                  </Text>
                </View>
              )}
            </View>

            {/* Translation */}
            <View style={styles.backCenterBlock}>
              <Text style={[styles.translationText, { color: colors.primary }]}>
                {card.translation}
              </Text>
            </View>

            {/* Definition */}
            {card.definition ? (
              <View style={styles.sectionBlock}>
                <Text style={[styles.definitionText, { color: colors.text }]}>
                  {card.definition}
                </Text>
              </View>
            ) : null}

            {/* Example sentence */}
            {card.example ? (
              <View style={[styles.exampleBox, { backgroundColor: colors.surface }]}>
                <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
                  Example
                </Text>
                <Text style={[styles.exampleText, { color: colors.text }]}>
                  "{card.example}"
                </Text>
              </View>
            ) : null}

            {/* Notes */}
            {card.notes ? (
              <View style={styles.sectionBlock}>
                <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
                  Notes
                </Text>
                <Text style={[styles.notesText, { color: colors.textSecondary }]}>
                  {card.notes}
                </Text>
              </View>
            ) : null}
          </ScrollView>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignSelf: 'center',
    marginVertical: 8,
  },
  touchArea: {
    width: '100%',
    height: '100%',
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    padding: 24,
    position: 'absolute',
    backfaceVisibility: 'hidden',
    justifyContent: 'space-between',
  },
  backCard: {
    top: 0,
    left: 0,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  hintText: {
    fontSize: 12,
    fontWeight: '500',
  },
  frontCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  wordTitle: {
    fontSize: 38,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.6,
    marginBottom: 12,
  },
  frontPosBadge: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 20,
  },
  frontPosText: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'lowercase',
  },
  speakerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  speakerBtnSmall: {
    padding: 4,
  },
  footerRow: {
    alignItems: 'center',
    paddingTop: 8,
  },
  flipPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  flipPromptText: {
    fontSize: 13,
    fontWeight: '600',
  },
  backScroll: {
    flex: 1,
    marginTop: 4,
  },
  backScrollContent: {
    paddingVertical: 4,
    alignItems: 'center',
  },
  backTopHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  backWordTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 6,
    textAlign: 'center',
  },
  backCenterBlock: {
    alignItems: 'center',
    marginVertical: 12,
  },
  translationText: {
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  sectionBlock: {
    width: '100%',
    marginVertical: 8,
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  definitionText: {
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
    fontWeight: '500',
  },
  exampleBox: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    marginVertical: 10,
    alignItems: 'center',
  },
  exampleText: {
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: '500',
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
