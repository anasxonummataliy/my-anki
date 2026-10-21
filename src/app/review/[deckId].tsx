import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '@/store/themeStore';
import { getStudyQueue, submitReview } from '@/db/repositories/reviewRepository';
import { getDeckById } from '@/db/repositories/deckRepository';
import { WordWithReview } from '@/types/word';
import { Flashcard } from '@/components/flashcard/Flashcard';
import { RatingButtons } from '@/components/flashcard/RatingButtons';
import { getRatingPreviews } from '@/services/fsrsService';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Grade } from 'ts-fsrs';
import { triggerHaptic } from '@/utils/haptics';
import { X, Trophy } from 'lucide-react-native';

export default function ReviewSessionScreen() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const insets = useSafeAreaInsets();
  const colors = useThemeStore((s) => s.getColors());
  const isDark = useThemeStore((s) => s.isDark());

  const [queue, setQueue] = useState<WordWithReview[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deckTitle, setDeckTitle] = useState('All Decks');
  const [reviewedCount, setReviewedCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function initQueue() {
      try {
        const targetId = deckId === 'all' ? undefined : deckId;
        if (targetId) {
          const d = await getDeckById(targetId);
          if (d) setDeckTitle(d.name);
        }

        const cards = await getStudyQueue(targetId, 50);
        setQueue(cards);
      } catch (err) {
        console.error('Error loading study queue:', err);
      } finally {
        setLoading(false);
      }
    }
    initQueue();
  }, [deckId]);

  const currentCard = queue[currentIndex];

  const handleRating = async (rating: Grade) => {
    if (!currentCard || isSubmitting) return;
    setIsSubmitting(true);

    try {
      await submitReview(currentCard.id, rating);
      setReviewedCount((prev) => prev + 1);

      // Advance to next card
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    } catch (err) {
      console.error('Error submitting review:', err);
      triggerHaptic('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFinished = queue.length > 0 && currentIndex >= queue.length;
  const progressPercent = queue.length > 0
    ? Math.min(100, Math.round((currentIndex / queue.length) * 100))
    : 0;

  const ratingPreviews = useMemo(() => getRatingPreviews(
    currentCard
      ? {
          wordId: currentCard.id,
          state: currentCard.state ?? 0,
          due: currentCard.due ?? 0,
          stability: currentCard.stability ?? 0,
          difficulty: currentCard.difficulty ?? 0,
          elapsedDays: 0,
          scheduledDays: 0,
          reps: currentCard.reps ?? 0,
          lapses: currentCard.lapses ?? 0,
          lastReview: currentCard.lastReview ?? null,
        }
      : null,
    isDark
  ), [currentCard, isDark]);

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // All cards reviewed / finished screen
  if (queue.length === 0 || isFinished) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, paddingTop: insets.top + 20 },
        ]}
      >
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.finishContent}>
          <Card variant="elevated" style={styles.finishCard}>
            <View style={[styles.trophyCircle, { backgroundColor: colors.primaryLight }]}>
              <Trophy size={48} color={colors.primary} />
            </View>

            <Text style={[styles.finishTitle, { color: colors.text }]}>
              {queue.length === 0 ? 'No Cards Due!' : 'Session Complete!'}
            </Text>

            <Text style={[styles.finishSubtitle, { color: colors.textSecondary }]}>
              {queue.length === 0
                ? 'All vocabulary in this deck is up to date according to your FSRS schedule.'
                : `You successfully reviewed ${reviewedCount} cards. Keep up the consistent habit!`}
            </Text>

            <Button
              title="Back to Decks"
              onPress={() => router.back()}
              size="lg"
              variant="primary"
              style={styles.finishBtn}
            />
          </Card>
        </View>
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
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeBtn}
          activeOpacity={0.7}
        >
          <X size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.deckTitleContainer}>
          <Text style={[styles.sessionDeckName, { color: colors.text }]} numberOfLines={1}>
            {deckTitle}
          </Text>
          <Text style={[styles.progressCounter, { color: colors.textSecondary }]}>
            Card {currentIndex + 1} of {queue.length}
          </Text>
        </View>

        <View style={{ width: 32 }} />
      </View>

      {/* Progress Line */}
      <View style={[styles.progressBarTrack, { backgroundColor: colors.surface }]}>
        <View
          style={[
            styles.progressBarFill,
            { backgroundColor: colors.primary, width: `${progressPercent}%` },
          ]}
        />
      </View>

      {/* 3D Flip Card */}
      <View style={styles.cardArea}>
        <Flashcard
          card={currentCard}
          isFlipped={isFlipped}
          onFlip={() => setIsFlipped(!isFlipped)}
        />
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomArea}>
        {isFlipped ? (
          <RatingButtons
            previews={ratingPreviews}
            onSelectRating={handleRating}
            disabled={isSubmitting}
          />
        ) : (
          <View style={styles.tapPromptContainer}>
            <Button
              title="Show Answer"
              onPress={() => {
                triggerHaptic('selection');
                setIsFlipped(true);
              }}
              size="lg"
              variant="primary"
              style={styles.showAnswerBtn}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  closeBtn: {
    padding: 6,
  },
  deckTitleContainer: {
    alignItems: 'center',
  },
  sessionDeckName: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressCounter: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  progressBarTrack: {
    height: 4,
    marginHorizontal: 16,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  cardArea: {
    flex: 1,
    justifyContent: 'center',
  },
  bottomArea: {
    paddingBottom: 8,
  },
  tapPromptContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  showAnswerBtn: {
    width: '100%',
  },
  finishContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  finishCard: {
    padding: 32,
    borderRadius: 28,
    alignItems: 'center',
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  trophyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  finishTitle: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  finishSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  finishBtn: {
    width: '100%',
  },
});
