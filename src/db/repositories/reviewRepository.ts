import { getDb } from '../client';
import { ReviewState, ReviewLog } from '@/types/review';
import { WordWithReview } from '@/types/word';
import { calculateNextReview } from '@/services/fsrsService';
import { getAllDescendantDeckIds } from './deckRepository';
import { Grade } from 'ts-fsrs';
import * as Crypto from 'expo-crypto';

export interface ReviewStateRow {
  word_id: string;
  state: number;
  due: number;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  last_review: number | null;
}

function mapReviewState(row: ReviewStateRow): ReviewState {
  return {
    wordId: row.word_id,
    state: row.state,
    due: row.due,
    stability: row.stability,
    difficulty: row.difficulty,
    elapsedDays: row.elapsed_days,
    scheduledDays: row.scheduled_days,
    reps: row.reps,
    lapses: row.lapses,
    lastReview: row.last_review,
  };
}

export async function getReviewState(wordId: string): Promise<ReviewState | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<ReviewStateRow>(
    `SELECT * FROM review_states WHERE word_id = ?;`,
    [wordId]
  );
  return row ? mapReviewState(row) : null;
}

export async function getStudyQueue(deckId?: string, limit = 50): Promise<WordWithReview[]> {
  const db = await getDb();
  const now = Date.now();
  let deckIds: string[] = [];

  if (deckId) {
    deckIds = await getAllDescendantDeckIds(deckId);
  }

  let query = `
    SELECT w.*, rs.state, rs.due, rs.stability, rs.difficulty, rs.reps, rs.lapses, rs.last_review
    FROM words w
    JOIN review_states rs ON w.id = rs.word_id
    WHERE (rs.state = 0 OR rs.due <= ?)
  `;
  const params: any[] = [now];

  if (deckIds.length > 0) {
    const placeholders = deckIds.map(() => '?').join(',');
    query += ` AND w.deck_id IN (${placeholders})`;
    params.push(...deckIds);
  }

  // Prioritize due reviews first (state > 0, earliest due first), then new cards (state = 0)
  query += ` ORDER BY (CASE WHEN rs.state > 0 THEN 0 ELSE 1 END) ASC, rs.due ASC LIMIT ?;`;
  params.push(limit);

  const rows = await db.getAllAsync<any>(query, params);
  return rows.map((r) => ({
    id: r.id,
    deckId: r.deck_id,
    word: r.word,
    translation: r.translation,
    definition: r.definition,
    example: r.example,
    partOfSpeech: r.part_of_speech,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    state: r.state,
    due: r.due,
    stability: r.stability,
    difficulty: r.difficulty,
    reps: r.reps,
    lapses: r.lapses,
    lastReview: r.last_review,
  }));
}

export async function submitReview(
  wordId: string,
  rating: Grade
): Promise<{ nextState: ReviewState; log: ReviewLog }> {
  const db = await getDb();
  const currentState = await getReviewState(wordId);
  const reviewTime = new Date();
  const outcomes = calculateNextReview(currentState, reviewTime);
  const outcome = outcomes[rating];

  const logId = Crypto.randomUUID();
  const nextState: ReviewState = {
    ...outcome.card,
    wordId,
  };
  const log: ReviewLog = {
    ...outcome.log,
    id: logId,
    wordId,
  };

  await db.withTransactionAsync(async () => {
    // 1. Update review_states
    await db.runAsync(
      `INSERT INTO review_states (
        word_id, state, due, stability, difficulty, elapsed_days, scheduled_days, reps, lapses, last_review
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(word_id) DO UPDATE SET
        state = excluded.state,
        due = excluded.due,
        stability = excluded.stability,
        difficulty = excluded.difficulty,
        elapsed_days = excluded.elapsed_days,
        scheduled_days = excluded.scheduled_days,
        reps = excluded.reps,
        lapses = excluded.lapses,
        last_review = excluded.last_review;`,
      [
        wordId,
        nextState.state,
        nextState.due,
        nextState.stability,
        nextState.difficulty,
        nextState.elapsedDays,
        nextState.scheduledDays,
        nextState.reps,
        nextState.lapses,
        nextState.lastReview ?? reviewTime.getTime(),
      ]
    );

    // 2. Insert into review_logs
    await db.runAsync(
      `INSERT INTO review_logs (
        id, word_id, rating, state, due, stability, difficulty, elapsed_days, last_elapsed_days, scheduled_days, review
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        log.id,
        wordId,
        log.rating,
        log.state,
        log.due,
        log.stability,
        log.difficulty,
        log.elapsedDays,
        log.lastElapsedDays,
        log.scheduledDays,
        log.review,
      ]
    );
  });

  return { nextState, log };
}

export async function getReviewActivityByDay(days = 14): Promise<{ date: string; count: number }[]> {
  const db = await getDb();
  const since = Date.now() - days * 24 * 60 * 60 * 1000;

  const rows = await db.getAllAsync<{ day: string; count: number }>(
    `SELECT strftime('%Y-%m-%d', review / 1000, 'unixepoch', 'localtime') as day, COUNT(*) as count
     FROM review_logs
     WHERE review >= ?
     GROUP BY day
     ORDER BY day ASC;`,
    [since]
  );

  return rows.map((r) => ({ date: r.day, count: r.count }));
}

export async function getTotalReviewsCount(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM review_logs;`
  );
  return row?.count ?? 0;
}
