import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL, SCHEMA_VERSION } from './schema';
import { INITIAL_SEED } from './seed';

const DATABASE_NAME = 'my_anki.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let isInitializing: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }
  if (isInitializing) {
    return isInitializing;
  }

  isInitializing = (async () => {
    const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    
    // Enable WAL mode and foreign keys for high performance and integrity
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
    `);

    // Ensure schema migrations and initial tables exist
    await db.execAsync(CREATE_TABLES_SQL);

    // Check if initial seeding has occurred
    const row = await db.getFirstAsync<{ count: number }>(
      'SELECT count(*) as count FROM decks;'
    );

    if (!row || row.count === 0) {
      await seedDatabase(db);
    }

    // Default settings
    await db.runAsync(
      `INSERT OR IGNORE INTO app_settings (key, value) VALUES ('daily_goal', '20');`
    );
    await db.runAsync(
      `INSERT OR IGNORE INTO app_settings (key, value) VALUES ('theme_mode', 'system');`
    );

    dbInstance = db;
    isInitializing = null;
    return db;
  })();

  return isInitializing;
}

export async function seedDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  const now = Date.now();
  await db.withTransactionAsync(async () => {
    for (const deck of INITIAL_SEED.decks) {
      await db.runAsync(
        `INSERT OR REPLACE INTO decks (id, name, description, parent_id, color, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [deck.id, deck.name, deck.description, deck.parentId || null, deck.color, now, now]
      );
    }

    for (const word of INITIAL_SEED.words) {
      await db.runAsync(
        `INSERT OR REPLACE INTO words (id, deck_id, word, translation, definition, example, part_of_speech, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          word.id,
          word.deckId,
          word.word,
          word.translation,
          word.definition || null,
          word.example || null,
          word.partOfSpeech || null,
          word.notes || null,
          now,
          now,
        ]
      );

      // Initialize default review state (State 0: New)
      await db.runAsync(
        `INSERT OR REPLACE INTO review_states (word_id, state, due, stability, difficulty, elapsed_days, scheduled_days, reps, lapses, last_review)
         VALUES (?, 0, ?, 0, 0, 0, 0, 0, 0, NULL);`,
        [word.id, now]
      );
    }
  });
}
