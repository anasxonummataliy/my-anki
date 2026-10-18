import {
  fsrs,
  Rating,
  Grade,
  State,
  createEmptyCard,
  Card,
  RecordLogItem,
  FSRSParameters,
  generatorParameters,
} from 'ts-fsrs';
import { ReviewState, ReviewLog, RatingPreview } from '@/types/review';
import { Colors } from '@/constants/colors';

const params: FSRSParameters = generatorParameters({
  enable_fuzz: true,
  enable_short_term: true,
});

const f = fsrs(params);

export function toFSRSCard(state?: ReviewState | null): Card {
  if (!state) {
    return createEmptyCard();
  }

  return {
    due: new Date(state.due),
    stability: state.stability,
    difficulty: state.difficulty,
    elapsed_days: state.elapsedDays,
    scheduled_days: state.scheduledDays,
    learning_steps: 0,
    reps: state.reps,
    lapses: state.lapses,
    state: state.state as State,
    last_review: state.lastReview ? new Date(state.lastReview) : undefined,
  };
}

export function calculateNextReview(
  currentState: ReviewState | null,
  reviewTime = new Date()
): Record<Grade, { card: ReviewState; log: Omit<ReviewLog, 'id'> }> {
  const card = toFSRSCard(currentState);
  const repeatResult = f.repeat(card, reviewTime);

  const wordId = currentState?.wordId ?? '';

  const formatResult = (item: RecordLogItem) => {
    const nextCard: ReviewState = {
      wordId,
      state: item.card.state,
      due: item.card.due.getTime(),
      stability: item.card.stability,
      difficulty: item.card.difficulty,
      elapsedDays: item.card.elapsed_days,
      scheduledDays: item.card.scheduled_days,
      reps: item.card.reps,
      lapses: item.card.lapses,
      lastReview: item.card.last_review ? item.card.last_review.getTime() : reviewTime.getTime(),
    };

    const nextLog: Omit<ReviewLog, 'id'> = {
      wordId,
      rating: item.log.rating,
      state: item.log.state,
      due: item.log.due.getTime(),
      stability: item.log.stability,
      difficulty: item.log.difficulty,
      elapsedDays: item.log.elapsed_days,
      lastElapsedDays: item.log.last_elapsed_days,
      scheduledDays: item.log.scheduled_days,
      review: item.log.review.getTime(),
    };

    return { card: nextCard, log: nextLog };
  };

  return {
    [Rating.Again]: formatResult(repeatResult[Rating.Again]),
    [Rating.Hard]: formatResult(repeatResult[Rating.Hard]),
    [Rating.Good]: formatResult(repeatResult[Rating.Good]),
    [Rating.Easy]: formatResult(repeatResult[Rating.Easy]),
  };
}

export function formatIntervalPreview(dueTime: number, now = Date.now()): string {
  const diffMs = dueTime - now;
  if (diffMs <= 0) return '<1m';
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  if (diffMinutes < 60) return `${Math.max(1, diffMinutes)}m`;

  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) return `${diffHours}h`;

  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 30) return `${diffDays}d`;
  if (diffDays < 365) return `${Math.round(diffDays / 30)}mo`;
  return `${(diffDays / 365).toFixed(1)}y`;
}

export function getRatingPreviews(
  currentState: ReviewState | null,
  isDark = false
): RatingPreview[] {
  const calculated = calculateNextReview(currentState);
  const theme = isDark ? Colors.dark : Colors.light;

  return [
    {
      rating: Rating.Again,
      label: 'Again',
      intervalText: formatIntervalPreview(calculated[Rating.Again].card.due),
      color: theme.again,
    },
    {
      rating: Rating.Hard,
      label: 'Hard',
      intervalText: formatIntervalPreview(calculated[Rating.Hard].card.due),
      color: theme.hard,
    },
    {
      rating: Rating.Good,
      label: 'Good',
      intervalText: formatIntervalPreview(calculated[Rating.Good].card.due),
      color: theme.good,
    },
    {
      rating: Rating.Easy,
      label: 'Easy',
      intervalText: formatIntervalPreview(calculated[Rating.Easy].card.due),
      color: theme.easy,
    },
  ];
}
