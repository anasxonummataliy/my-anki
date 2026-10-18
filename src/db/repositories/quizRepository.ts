import { getDb } from '../client';
import { QuizMode, QuizSession, QuizAnswerRecord, QuizResult } from '@/types/quiz';
import { Word } from '@/types/word';
import * as Crypto from 'expo-crypto';

export async function saveQuizSession(session: {
  deckId?: string | null;
  mode: QuizMode;
  totalQuestions: number;
  correctAnswers: number;
  answers: {
    wordId: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }[];
}): Promise<string> {
  const db = await getDb();
  const sessionId = Crypto.randomUUID();
  const now = Date.now();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO quiz_sessions (id, deck_id, mode, total_questions, correct_answers, created_at)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [sessionId, session.deckId || null, session.mode, session.totalQuestions, session.correctAnswers, now]
    );

    for (const ans of session.answers) {
      const answerId = Crypto.randomUUID();
      await db.runAsync(
        `INSERT INTO quiz_answers (id, session_id, word_id, user_answer, correct_answer, is_correct, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [answerId, sessionId, ans.wordId, ans.userAnswer, ans.correctAnswer, ans.isCorrect ? 1 : 0, now]
      );
    }
  });

  return sessionId;
}

export async function getQuizResult(sessionId: string): Promise<QuizResult | null> {
  const db = await getDb();
  const sessionRow = await db.getFirstAsync<{
    id: string;
    deck_id: string | null;
    mode: string;
    total_questions: number;
    correct_answers: number;
    created_at: number;
  }>(`SELECT * FROM quiz_sessions WHERE id = ?;`, [sessionId]);

  if (!sessionRow) return null;

  const answerRows = await db.getAllAsync<{
    id: string;
    session_id: string;
    word_id: string;
    user_answer: string;
    correct_answer: string;
    is_correct: number;
    created_at: number;
    word: string;
    translation: string;
    definition: string | null;
    example: string | null;
    part_of_speech: string | null;
    deck_id: string;
  }>(
    `SELECT qa.*, w.word, w.translation, w.definition, w.example, w.part_of_speech, w.deck_id
     FROM quiz_answers qa
     JOIN words w ON qa.word_id = w.id
     WHERE qa.session_id = ?
     ORDER BY qa.created_at ASC;`,
    [sessionId]
  );

  const answers: QuizAnswerRecord[] = answerRows.map((r) => ({
    id: r.id,
    sessionId: r.session_id,
    wordId: r.word_id,
    userAnswer: r.user_answer,
    correctAnswer: r.correct_answer,
    isCorrect: r.is_correct === 1,
    createdAt: r.created_at,
    word: {
      id: r.word_id,
      deckId: r.deck_id,
      word: r.word,
      translation: r.translation,
      definition: r.definition,
      example: r.example,
      partOfSpeech: r.part_of_speech,
      createdAt: r.created_at,
      updatedAt: r.created_at,
    },
  }));

  const session: QuizSession = {
    id: sessionRow.id,
    deckId: sessionRow.deck_id,
    mode: sessionRow.mode as QuizMode,
    totalQuestions: sessionRow.total_questions,
    correctAnswers: sessionRow.correct_answers,
    createdAt: sessionRow.created_at,
  };

  const accuracy = session.totalQuestions > 0
    ? Math.round((session.correctAnswers / session.totalQuestions) * 100)
    : 0;

  return { session, answers, accuracy };
}

export async function getMistakeWords(deckIds?: string[], limit = 20): Promise<Word[]> {
  const db = await getDb();
  let query = `
    SELECT DISTINCT w.*
    FROM words w
    JOIN quiz_answers qa ON w.id = qa.word_id
    WHERE qa.is_correct = 0
  `;
  const params: any[] = [];

  if (deckIds && deckIds.length > 0) {
    const placeholders = deckIds.map(() => '?').join(',');
    query += ` AND w.deck_id IN (${placeholders})`;
    params.push(...deckIds);
  }

  query += ` ORDER BY qa.created_at DESC LIMIT ?;`;
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
  }));
}

export async function getQuizAccuracyOverall(): Promise<{ accuracy: number; totalSessions: number }> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ total_q: number; total_c: number; session_count: number }>(
    `SELECT
       COALESCE(SUM(total_questions), 0) as total_q,
       COALESCE(SUM(correct_answers), 0) as total_c,
       COUNT(*) as session_count
     FROM quiz_sessions;`
  );

  if (!row || row.total_q === 0) {
    return { accuracy: 0, totalSessions: 0 };
  }

  return {
    accuracy: Math.round((row.total_c / row.total_q) * 100),
    totalSessions: row.session_count,
  };
}
