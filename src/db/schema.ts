export const SCHEMA_VERSION = 1;

export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS decks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  parent_id TEXT REFERENCES decks(id) ON DELETE CASCADE,
  color TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS words (
  id TEXT PRIMARY KEY,
  deck_id TEXT NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  translation TEXT NOT NULL,
  definition TEXT,
  example TEXT,
  part_of_speech TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS review_states (
  word_id TEXT PRIMARY KEY REFERENCES words(id) ON DELETE CASCADE,
  state INTEGER NOT NULL DEFAULT 0,
  due INTEGER NOT NULL,
  stability REAL NOT NULL DEFAULT 0,
  difficulty REAL NOT NULL DEFAULT 0,
  elapsed_days INTEGER NOT NULL DEFAULT 0,
  scheduled_days INTEGER NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL DEFAULT 0,
  lapses INTEGER NOT NULL DEFAULT 0,
  last_review INTEGER
);

CREATE TABLE IF NOT EXISTS review_logs (
  id TEXT PRIMARY KEY,
  word_id TEXT NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL,
  state INTEGER NOT NULL,
  due INTEGER NOT NULL,
  stability REAL NOT NULL,
  difficulty REAL NOT NULL,
  elapsed_days INTEGER NOT NULL,
  last_elapsed_days INTEGER NOT NULL,
  scheduled_days INTEGER NOT NULL,
  review INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS quiz_sessions (
  id TEXT PRIMARY KEY,
  deck_id TEXT REFERENCES decks(id) ON DELETE SET NULL,
  mode TEXT NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS quiz_answers (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  word_id TEXT NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  user_answer TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  is_correct INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_decks_parent_id ON decks(parent_id);
CREATE INDEX IF NOT EXISTS idx_words_deck_id ON words(deck_id);
CREATE INDEX IF NOT EXISTS idx_words_word ON words(word COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_words_translation ON words(translation COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_review_states_due ON review_states(due);
CREATE INDEX IF NOT EXISTS idx_review_states_state ON review_states(state);
CREATE INDEX IF NOT EXISTS idx_review_logs_word_id ON review_logs(word_id);
CREATE INDEX IF NOT EXISTS idx_review_logs_review ON review_logs(review);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_session_id ON quiz_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_word_id ON quiz_answers(word_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_is_correct ON quiz_answers(is_correct);
`;
