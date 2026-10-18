import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getDb } from '@/db/client';
import { AppBackupData, AppBackupSchema } from '@/types/backup';
import { getAllSettings } from '@/db/repositories/settingsRepository';

export async function exportBackupToJson(): Promise<string> {
  const db = await getDb();

  // 1. Fetch all decks
  const decks = await db.getAllAsync<any>(`SELECT * FROM decks;`);
  const formattedDecks = decks.map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    parentId: d.parent_id,
    color: d.color,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  }));

  // 2. Fetch all words
  const words = await db.getAllAsync<any>(`SELECT * FROM words;`);
  const formattedWords = words.map((w) => ({
    id: w.id,
    deckId: w.deck_id,
    word: w.word,
    translation: w.translation,
    definition: w.definition,
    example: w.example,
    partOfSpeech: w.part_of_speech,
    notes: w.notes,
    createdAt: w.created_at,
    updatedAt: w.updated_at,
  }));

  // 3. Fetch all review states
  const reviewStates = await db.getAllAsync<any>(`SELECT * FROM review_states;`);
  const formattedReviewStates = reviewStates.map((rs) => ({
    wordId: rs.word_id,
    state: rs.state,
    due: rs.due,
    stability: rs.stability,
    difficulty: rs.difficulty,
    elapsedDays: rs.elapsed_days,
    scheduledDays: rs.scheduled_days,
    reps: rs.reps,
    lapses: rs.lapses,
    lastReview: rs.last_review,
  }));

  // 4. Fetch all review logs
  const reviewLogs = await db.getAllAsync<any>(`SELECT * FROM review_logs;`);
  const formattedReviewLogs = reviewLogs.map((rl) => ({
    id: rl.id,
    wordId: rl.word_id,
    rating: rl.rating,
    state: rl.state,
    due: rl.due,
    stability: rl.stability,
    difficulty: rl.difficulty,
    elapsedDays: rl.elapsed_days,
    lastElapsedDays: rl.last_elapsed_days,
    scheduledDays: rl.scheduled_days,
    review: rl.review,
  }));

  // 5. Fetch all quiz sessions
  const quizSessions = await db.getAllAsync<any>(`SELECT * FROM quiz_sessions;`);
  const formattedQuizSessions = quizSessions.map((qs) => ({
    id: qs.id,
    deckId: qs.deck_id,
    mode: qs.mode,
    totalQuestions: qs.total_questions,
    correctAnswers: qs.correct_answers,
    createdAt: qs.created_at,
  }));

  // 6. Fetch all quiz answers
  const quizAnswers = await db.getAllAsync<any>(`SELECT * FROM quiz_answers;`);
  const formattedQuizAnswers = quizAnswers.map((qa) => ({
    id: qa.id,
    sessionId: qa.session_id,
    wordId: qa.word_id,
    userAnswer: qa.user_answer,
    correctAnswer: qa.correct_answer,
    isCorrect: qa.is_correct === 1,
    createdAt: qa.created_at,
  }));

  // 7. Settings
  const settings = await getAllSettings();

  const backupData: AppBackupData = {
    version: 1,
    app: 'MyAnki',
    exportedAt: new Date().toISOString(),
    decks: formattedDecks,
    words: formattedWords,
    reviewStates: formattedReviewStates,
    reviewLogs: formattedReviewLogs,
    quizSessions: formattedQuizSessions,
    quizAnswers: formattedQuizAnswers,
    settings,
  };

  const jsonString = JSON.stringify(backupData, null, 2);

  // Write file to device filesystem and invoke share dialog
  const fileName = `my-anki-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const fileUri = `${FileSystem.documentDirectory ?? ''}${fileName}`;

  await FileSystem.writeAsStringAsync(fileUri, jsonString, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/json',
      dialogTitle: 'Export MyAnki Vocabulary Backup',
      UTI: 'public.json',
    });
  }

  return fileUri;
}

export async function importBackupFromFile(): Promise<{ success: boolean; message: string; data?: AppBackupData }> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return { success: false, message: 'Import cancelled' };
  }

  const asset = result.assets[0];
  const fileContent = await FileSystem.readAsStringAsync(asset.uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  let parsed: any;
  try {
    parsed = JSON.parse(fileContent);
  } catch (err: any) {
    return { success: false, message: 'Invalid JSON file: parsing failed' };
  }

  // Validate schema with Zod
  const validation = AppBackupSchema.safeParse(parsed);
  if (!validation.success) {
    const errorIssues = validation.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    return {
      success: false,
      message: `Invalid backup schema: ${errorIssues}`,
    };
  }

  const backupData = validation.data;
  await restoreBackupTransactionally(backupData);

  return {
    success: true,
    message: `Restored ${backupData.words.length} words and ${backupData.decks.length} decks successfully!`,
    data: backupData,
  };
}

export async function restoreBackupTransactionally(backupData: AppBackupData): Promise<void> {
  const db = await getDb();

  await db.withTransactionAsync(async () => {
    // Clear existing tables in correct foreign key order
    await db.runAsync(`DELETE FROM quiz_answers;`);
    await db.runAsync(`DELETE FROM quiz_sessions;`);
    await db.runAsync(`DELETE FROM review_logs;`);
    await db.runAsync(`DELETE FROM review_states;`);
    await db.runAsync(`DELETE FROM words;`);
    await db.runAsync(`DELETE FROM decks;`);

    // Insert decks
    for (const d of backupData.decks) {
      await db.runAsync(
        `INSERT INTO decks (id, name, description, parent_id, color, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [d.id, d.name, d.description || null, d.parentId || null, d.color || null, d.createdAt, d.updatedAt]
      );
    }

    // Insert words
    for (const w of backupData.words) {
      await db.runAsync(
        `INSERT INTO words (id, deck_id, word, translation, definition, example, part_of_speech, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          w.id,
          w.deckId,
          w.word,
          w.translation,
          w.definition || null,
          w.example || null,
          w.partOfSpeech || null,
          w.notes || null,
          w.createdAt,
          w.updatedAt,
        ]
      );
    }

    // Insert review states
    for (const rs of backupData.reviewStates) {
      await db.runAsync(
        `INSERT INTO review_states (
          word_id, state, due, stability, difficulty, elapsed_days, scheduled_days, reps, lapses, last_review
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          rs.wordId,
          rs.state,
          rs.due,
          rs.stability,
          rs.difficulty,
          rs.elapsedDays,
          rs.scheduledDays,
          rs.reps,
          rs.lapses,
          rs.lastReview || null,
        ]
      );
    }

    // Insert review logs
    for (const rl of backupData.reviewLogs) {
      await db.runAsync(
        `INSERT INTO review_logs (
          id, word_id, rating, state, due, stability, difficulty, elapsed_days, last_elapsed_days, scheduled_days, review
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          rl.id,
          rl.wordId,
          rl.rating,
          rl.state,
          rl.due,
          rl.stability,
          rl.difficulty,
          rl.elapsedDays,
          rl.lastElapsedDays,
          rl.scheduledDays,
          rl.review,
        ]
      );
    }

    // Insert quiz sessions
    for (const qs of backupData.quizSessions) {
      await db.runAsync(
        `INSERT INTO quiz_sessions (id, deck_id, mode, total_questions, correct_answers, created_at)
         VALUES (?, ?, ?, ?, ?, ?);`,
        [qs.id, qs.deckId || null, qs.mode, qs.totalQuestions, qs.correctAnswers, qs.createdAt]
      );
    }

    // Insert quiz answers
    for (const qa of backupData.quizAnswers) {
      await db.runAsync(
        `INSERT INTO quiz_answers (id, session_id, word_id, user_answer, correct_answer, is_correct, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [qa.id, qa.sessionId, qa.wordId, qa.userAnswer, qa.correctAnswer, qa.isCorrect ? 1 : 0, qa.createdAt]
      );
    }

    // Restore settings
    if (backupData.settings) {
      for (const [key, value] of Object.entries(backupData.settings)) {
        await db.runAsync(
          `INSERT INTO app_settings (key, value) VALUES (?, ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value;`,
          [key, value]
        );
      }
    }
  });
}
