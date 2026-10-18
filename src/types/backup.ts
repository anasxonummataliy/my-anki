import { z } from 'zod';

export const DeckBackupSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const WordBackupSchema = z.object({
  id: z.string(),
  deckId: z.string(),
  word: z.string().min(1),
  translation: z.string().min(1),
  definition: z.string().nullable().optional(),
  example: z.string().nullable().optional(),
  partOfSpeech: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const ReviewStateBackupSchema = z.object({
  wordId: z.string(),
  state: z.number(),
  due: z.number(),
  stability: z.number(),
  difficulty: z.number(),
  elapsedDays: z.number(),
  scheduledDays: z.number(),
  reps: z.number(),
  lapses: z.number(),
  lastReview: z.number().nullable().optional(),
});

export const ReviewLogBackupSchema = z.object({
  id: z.string(),
  wordId: z.string(),
  rating: z.number(),
  state: z.number(),
  due: z.number(),
  stability: z.number(),
  difficulty: z.number(),
  elapsedDays: z.number(),
  lastElapsedDays: z.number(),
  scheduledDays: z.number(),
  review: z.number(),
});

export const QuizSessionBackupSchema = z.object({
  id: z.string(),
  deckId: z.string().nullable().optional(),
  mode: z.string(),
  totalQuestions: z.number(),
  correctAnswers: z.number(),
  createdAt: z.number(),
});

export const QuizAnswerBackupSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  wordId: z.string(),
  userAnswer: z.string(),
  correctAnswer: z.string(),
  isCorrect: z.boolean(),
  createdAt: z.number(),
});

export const AppBackupSchema = z.object({
  version: z.number(),
  app: z.literal('MyAnki'),
  exportedAt: z.string(),
  decks: z.array(DeckBackupSchema),
  words: z.array(WordBackupSchema),
  reviewStates: z.array(ReviewStateBackupSchema),
  reviewLogs: z.array(ReviewLogBackupSchema),
  quizSessions: z.array(QuizSessionBackupSchema),
  quizAnswers: z.array(QuizAnswerBackupSchema),
  settings: z.record(z.string(), z.string()).optional(),
});

export type AppBackupData = z.infer<typeof AppBackupSchema>;
