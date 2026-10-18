import { Word } from './word';

export type QuizMode =
  | 'mc_en_uz'      // Multiple choice: English to Uzbek
  | 'mc_uz_en'      // Multiple choice: Uzbek to English
  | 'typing'        // Typing: enter English word
  | 'matching'      // Matching pairs: connect English & Uzbek
  | 'mistakes';     // Practice previously missed words

export interface QuizQuestion {
  id: string;
  word: Word;
  prompt: string;
  correctAnswer: string;
  options?: string[]; // for multiple choice
  secondaryPrompt?: string; // e.g. definition or part of speech hint
}

export interface MatchingPair {
  id: string;
  english: string;
  uzbek: string;
  isMatched: boolean;
}

export interface QuizSession {
  id: string;
  deckId?: string | null;
  mode: QuizMode;
  totalQuestions: number;
  correctAnswers: number;
  createdAt: number;
}

export interface QuizAnswerRecord {
  id: string;
  sessionId: string;
  wordId: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  createdAt: number;
  word?: Word;
}

export interface QuizResult {
  session: QuizSession;
  answers: QuizAnswerRecord[];
  accuracy: number;
}
