import { getDb } from '../client';
import { Word, WordWithReview, WordFilterOptions } from '@/types/word';
import * as Crypto from 'expo-crypto';

export interface WordRow {
  id: string;
  deck_id: string;
  word: string;
  translation: string;
  definition: string | null;
  example: string | null;
  part_of_speech: string | null;
  notes: string | null;
  created_at: number;
  updated_at: number;
  state?: number | null;
  due?: number | null;
  stability?: number | null;
  difficulty?: number | null;
  reps?: number | null;
  lapses?: number | null;
  last_review?: number | null;
}

function mapWordWithReview(row: WordRow): WordWithReview {
  return {
    id: row.id,
    deckId: row.deck_id,
    word: row.word,
    translation: row.translation,
    definition: row.definition,
    example: row.example,
    partOfSpeech: row.part_of_speech,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    state: row.state ?? 0,
    due: row.due ?? row.created_at,
    stability: row.stability ?? 0,
    difficulty: row.difficulty ?? 0,
    reps: row.reps ?? 0,
    lapses: row.lapses ?? 0,
    lastReview: row.last_review ?? null,
  };
}

export async function getWords(options: WordFilterOptions = {}): Promise<WordWithReview[]> {
  const db = await getDb();
  let query = `
    SELECT w.*, rs.state, rs.due, rs.stability, rs.difficulty, rs.reps, rs.lapses, rs.last_review
    FROM words w
    LEFT JOIN review_states rs ON w.id = rs.word_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (options.deckId) {
    query += ` AND w.deck_id = ?`;
    params.push(options.deckId);
  }

  if (options.searchQuery && options.searchQuery.trim().length > 0) {
    query += ` AND (w.word LIKE ? OR w.translation LIKE ? OR w.definition LIKE ?)`;
    const searchParam = `%${options.searchQuery.trim()}%`;
    params.push(searchParam, searchParam, searchParam);
  }

  if (options.partOfSpeech) {
    query += ` AND w.part_of_speech = ?`;
    params.push(options.partOfSpeech);
  }

  if (options.status) {
    const now = Date.now();
    switch (options.status) {
      case 'new':
        query += ` AND (rs.state = 0 OR rs.state IS NULL)`;
        break;
      case 'learning':
        query += ` AND rs.state = 1`;
        break;
      case 'review':
        query += ` AND rs.state = 2 AND (rs.due <= ? OR rs.reps < 2)`;
        params.push(now);
        break;
      case 'learned':
        query += ` AND rs.state = 2 AND rs.reps >= 2`;
        break;
    }
  }

  // Sorting
  switch (options.sortBy) {
    case 'alphabetical':
      query += ` ORDER BY w.word ${options.sortOrder === 'desc' ? 'DESC' : 'ASC'}`;
      break;
    case 'oldest':
      query += ` ORDER BY w.created_at ASC`;
      break;
    case 'due':
      query += ` ORDER BY COALESCE(rs.due, 0) ${options.sortOrder === 'desc' ? 'DESC' : 'ASC'}`;
      break;
    case 'newest':
    default:
      query += ` ORDER BY w.created_at DESC`;
      break;
  }

  const rows = await db.getAllAsync<WordRow>(query, params);
  return rows.map(mapWordWithReview);
}

export async function getWordById(id: string): Promise<WordWithReview | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<WordRow>(
    `SELECT w.*, rs.state, rs.due, rs.stability, rs.difficulty, rs.reps, rs.lapses, rs.last_review
     FROM words w
     LEFT JOIN review_states rs ON w.id = rs.word_id
     WHERE w.id = ?;`,
    [id]
  );
  return row ? mapWordWithReview(row) : null;
}

export async function createWord(data: {
  deckId: string;
  word: string;
  translation: string;
  definition?: string | null;
  example?: string | null;
  partOfSpeech?: string | null;
  notes?: string | null;
}): Promise<Word> {
  const db = await getDb();
  const id = Crypto.randomUUID();
  const now = Date.now();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO words (id, deck_id, word, translation, definition, example, part_of_speech, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        data.deckId,
        data.word.trim(),
        data.translation.trim(),
        data.definition?.trim() || null,
        data.example?.trim() || null,
        data.partOfSpeech?.trim() || null,
        data.notes?.trim() || null,
        now,
        now,
      ]
    );

    await db.runAsync(
      `INSERT INTO review_states (word_id, state, due, stability, difficulty, elapsed_days, scheduled_days, reps, lapses, last_review)
       VALUES (?, 0, ?, 0, 0, 0, 0, 0, 0, NULL);`,
      [id, now]
    );
  });

  return {
    id,
    deckId: data.deckId,
    word: data.word.trim(),
    translation: data.translation.trim(),
    definition: data.definition?.trim() || null,
    example: data.example?.trim() || null,
    partOfSpeech: data.partOfSpeech?.trim() || null,
    notes: data.notes?.trim() || null,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateWord(data: {
  id: string;
  deckId?: string;
  word: string;
  translation: string;
  definition?: string | null;
  example?: string | null;
  partOfSpeech?: string | null;
  notes?: string | null;
}): Promise<void> {
  const db = await getDb();
  const now = Date.now();

  if (data.deckId) {
    await db.runAsync(
      `UPDATE words
       SET deck_id = ?, word = ?, translation = ?, definition = ?, example = ?, part_of_speech = ?, notes = ?, updated_at = ?
       WHERE id = ?;`,
      [
        data.deckId,
        data.word.trim(),
        data.translation.trim(),
        data.definition?.trim() || null,
        data.example?.trim() || null,
        data.partOfSpeech?.trim() || null,
        data.notes?.trim() || null,
        now,
        data.id,
      ]
    );
  } else {
    await db.runAsync(
      `UPDATE words
       SET word = ?, translation = ?, definition = ?, example = ?, part_of_speech = ?, notes = ?, updated_at = ?
       WHERE id = ?;`,
      [
        data.word.trim(),
        data.translation.trim(),
        data.definition?.trim() || null,
        data.example?.trim() || null,
        data.partOfSpeech?.trim() || null,
        data.notes?.trim() || null,
        now,
        data.id,
      ]
    );
  }
}

export async function deleteWord(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM words WHERE id = ?;`, [id]);
}

export async function getWordsForDeckIds(deckIds: string[]): Promise<WordWithReview[]> {
  if (deckIds.length === 0) return [];
  const db = await getDb();
  const placeholders = deckIds.map(() => '?').join(',');
  const rows = await db.getAllAsync<WordRow>(
    `SELECT w.*, rs.state, rs.due, rs.stability, rs.difficulty, rs.reps, rs.lapses, rs.last_review
     FROM words w
     LEFT JOIN review_states rs ON w.id = rs.word_id
     WHERE w.deck_id IN (${placeholders})
     ORDER BY w.word ASC;`,
    deckIds
  );
  return rows.map(mapWordWithReview);
}

export async function getRandomWords(count: number, excludeWordIds: string[] = []): Promise<Word[]> {
  const db = await getDb();
  let query = `SELECT * FROM words`;
  const params: any[] = [];
  if (excludeWordIds.length > 0) {
    const placeholders = excludeWordIds.map(() => '?').join(',');
    query += ` WHERE id NOT IN (${placeholders})`;
    params.push(...excludeWordIds);
  }
  query += ` ORDER BY RANDOM() LIMIT ?;`;
  params.push(count);

  const rows = await db.getAllAsync<WordRow>(query, params);
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
  }));
}
