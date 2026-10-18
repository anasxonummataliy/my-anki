import { Rating, Grade, State } from 'ts-fsrs';

export { Rating, Grade, State };

export interface ReviewState {
  wordId: string;
  state: number; // 0: New, 1: Learning, 2: Review, 3: Relearning
  due: number; // timestamp in ms
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  lastReview?: number | null; // timestamp in ms
}

export interface ReviewLog {
  id: string;
  wordId: string;
  rating: number; // 1: Again, 2: Hard, 3: Good, 4: Easy
  state: number;
  due: number;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  lastElapsedDays: number;
  scheduledDays: number;
  review: number; // timestamp in ms
}

export interface RatingPreview {
  rating: Grade;
  label: string;
  intervalText: string;
  color: string;
}
