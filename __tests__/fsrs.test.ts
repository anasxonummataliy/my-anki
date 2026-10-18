import {
  toFSRSCard,
  calculateNextReview,
  formatIntervalPreview,
} from '../src/services/fsrsService';
import { Rating } from 'ts-fsrs';
import { ReviewState } from '../src/types/review';

describe('FSRS Service', () => {
  it('initializes a new card properly when state is null', () => {
    const card = toFSRSCard(null);
    expect(card.reps).toBe(0);
    expect(card.lapses).toBe(0);
    expect(card.state).toBe(0); // State.New
  });

  it('calculates 4 distinct rating outcomes for a new card', () => {
    const now = new Date('2026-10-15T12:00:00Z');
    const outcomes = calculateNextReview(null, now);

    expect(outcomes[Rating.Again]).toBeDefined();
    expect(outcomes[Rating.Hard]).toBeDefined();
    expect(outcomes[Rating.Good]).toBeDefined();
    expect(outcomes[Rating.Easy]).toBeDefined();

    // Again should reset/relearn with lowest stability
    expect(outcomes[Rating.Again].card.stability).toBeLessThan(
      outcomes[Rating.Easy].card.stability
    );

    // Easy rating gives higher scheduled days than Again
    expect(outcomes[Rating.Easy].card.scheduledDays).toBeGreaterThanOrEqual(
      outcomes[Rating.Again].card.scheduledDays
    );
  });

  it('progresses card state when rated Good', () => {
    const now = new Date('2026-10-15T12:00:00Z');
    const firstReview = calculateNextReview(null, now);
    const goodCard = firstReview[Rating.Good].card;

    expect(goodCard.reps).toBe(1);
    expect(goodCard.lastReview).toBe(now.getTime());

    // Subsequent review after 1 day
    const nextDay = new Date('2026-10-16T12:00:00Z');
    const secondReview = calculateNextReview(goodCard, nextDay);
    expect(secondReview[Rating.Good].card.reps).toBe(2);
    expect(secondReview[Rating.Good].card.stability).toBeGreaterThan(goodCard.stability);
  });

  it('formats interval previews correctly', () => {
    const now = 100000000;
    expect(formatIntervalPreview(now + 10 * 60 * 1000, now)).toBe('10m');
    expect(formatIntervalPreview(now + 5 * 60 * 60 * 1000, now)).toBe('5h');
    expect(formatIntervalPreview(now + 3 * 24 * 60 * 60 * 1000, now)).toBe('3d');
  });
});
