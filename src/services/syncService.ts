import { getDb } from '@/db/client';
import { supabase } from './supabase';
import { getSetting, setSetting } from '@/db/repositories/settingsRepository';

export interface SyncResult {
  success: boolean;
  message: string;
  pushedCount?: number;
  pulledCount?: number;
  lastSyncedAt?: number;
}

const LAST_SYNC_KEY = 'last_supabase_sync_timestamp';

export async function getLastSyncedTime(): Promise<number | null> {
  const ts = await getSetting(LAST_SYNC_KEY, '');
  return ts ? parseInt(ts, 10) : null;
}

export async function syncAll(): Promise<SyncResult> {
  const db = await getDb();

  try {
    // 1. Check connectivity by testing query
    const { error: pingError } = await supabase.from('decks').select('id').limit(1);
    if (pingError) {
      if (pingError.message.includes('relation') && pingError.message.includes('does not exist')) {
        return {
          success: false,
          message: 'Supabase jadvallari topilmadi. Iltimos, Supabase SQL Editor orqali jadvallarni yarating.',
        };
      }
      return {
        success: false,
        message: `Supabase xatosi: ${pingError.message}`,
      };
    }

    // 2. Fetch local data from SQLite
    const localDecks = await db.getAllAsync<{
      id: string;
      name: string;
      description: string | null;
      parent_id: string | null;
      color: string | null;
      created_at: number;
      updated_at: number;
    }>('SELECT * FROM decks;');

    const localWords = await db.getAllAsync<{
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
    }>('SELECT * FROM words;');

    const localReviews = await db.getAllAsync<{
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
    }>('SELECT * FROM review_states;');

    // 3. Push local data to Supabase (upsert)
    if (localDecks.length > 0) {
      const { error: decksPushError } = await supabase.from('decks').upsert(localDecks, {
        onConflict: 'id',
      });
      if (decksPushError) {
        console.warn('Decks push warning:', decksPushError);
      }
    }

    if (localWords.length > 0) {
      // Chunk words to avoid payload size limit
      const chunkSize = 200;
      for (let i = 0; i < localWords.length; i += chunkSize) {
        const chunk = localWords.slice(i, i + chunkSize);
        const { error: wordsPushError } = await supabase.from('words').upsert(chunk, {
          onConflict: 'id',
        });
        if (wordsPushError) {
          console.warn('Words push chunk warning:', wordsPushError);
        }
      }
    }

    if (localReviews.length > 0) {
      const chunkSize = 200;
      for (let i = 0; i < localReviews.length; i += chunkSize) {
        const chunk = localReviews.slice(i, i + chunkSize);
        const { error: reviewsPushError } = await supabase.from('review_states').upsert(chunk, {
          onConflict: 'word_id',
        });
        if (reviewsPushError) {
          console.warn('Review states push warning:', reviewsPushError);
        }
      }
    }

    // 4. Pull all remote data from Supabase
    const { data: remoteDecks, error: decksPullError } = await supabase.from('decks').select('*');
    if (decksPullError) throw decksPullError;

    const { data: remoteWords, error: wordsPullError } = await supabase.from('words').select('*');
    if (wordsPullError) throw wordsPullError;

    const { data: remoteReviews, error: reviewsPullError } = await supabase.from('review_states').select('*');
    if (reviewsPullError) throw reviewsPullError;

    // 5. Save remote data to local SQLite database in transaction
    let pulledCount = 0;
    await db.withTransactionAsync(async () => {
      if (remoteDecks && remoteDecks.length > 0) {
        for (const deck of remoteDecks) {
          await db.runAsync(
            `INSERT OR REPLACE INTO decks (id, name, description, parent_id, color, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?);`,
            [
              deck.id,
              deck.name,
              deck.description || null,
              deck.parent_id || null,
              deck.color || null,
              deck.created_at,
              deck.updated_at,
            ]
          );
        }
      }

      if (remoteWords && remoteWords.length > 0) {
        pulledCount = remoteWords.length;
        for (const word of remoteWords) {
          await db.runAsync(
            `INSERT OR REPLACE INTO words (id, deck_id, word, translation, definition, example, part_of_speech, notes, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
              word.id,
              word.deck_id,
              word.word,
              word.translation,
              word.definition || null,
              word.example || null,
              word.part_of_speech || null,
              word.notes || null,
              word.created_at,
              word.updated_at,
            ]
          );
        }
      }

      if (remoteReviews && remoteReviews.length > 0) {
        for (const rs of remoteReviews) {
          await db.runAsync(
            `INSERT OR REPLACE INTO review_states (word_id, state, due, stability, difficulty, elapsed_days, scheduled_days, reps, lapses, last_review)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
              rs.word_id,
              rs.state,
              rs.due,
              rs.stability,
              rs.difficulty,
              rs.elapsed_days,
              rs.scheduled_days,
              rs.reps,
              rs.lapses,
              rs.last_review || null,
            ]
          );
        }
      }
    });

    const now = Date.now();
    await setSetting(LAST_SYNC_KEY, now.toString());

    return {
      success: true,
      message: 'Muvaffaqiyatli sinxronlashtirildi!',
      pushedCount: localWords.length,
      pulledCount,
      lastSyncedAt: now,
    };
  } catch (error: any) {
    console.error('syncAll error:', error);
    return {
      success: false,
      message: error.message || 'Sinxronizatsiya vaqtida xatolik yuz berdi.',
    };
  }
}

/**
 * Sync a single word and review state immediately (non-blocking)
 */
export async function syncWordToRemote(word: {
  id: string;
  deck_id: string;
  word: string;
  translation: string;
  definition?: string | null;
  example?: string | null;
  part_of_speech?: string | null;
  notes?: string | null;
  created_at: number;
  updated_at: number;
}) {
  try {
    await supabase.from('words').upsert(word, { onConflict: 'id' });
  } catch (e) {
    console.warn('Background syncWordToRemote error:', e);
  }
}

export async function deleteWordFromRemote(id: string) {
  try {
    await supabase.from('words').delete().eq('id', id);
  } catch (e) {
    console.warn('Background deleteWordFromRemote error:', e);
  }
}

export async function syncDeckToRemote(deck: {
  id: string;
  name: string;
  description?: string | null;
  parent_id?: string | null;
  color?: string | null;
  created_at: number;
  updated_at: number;
}) {
  try {
    await supabase.from('decks').upsert(deck, { onConflict: 'id' });
  } catch (e) {
    console.warn('Background syncDeckToRemote error:', e);
  }
}

export async function deleteDeckFromRemote(id: string) {
  try {
    await supabase.from('decks').delete().eq('id', id);
  } catch (e) {
    console.warn('Background deleteDeckFromRemote error:', e);
  }
}
