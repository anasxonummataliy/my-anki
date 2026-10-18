import { create } from 'zustand';
import { WordWithReview } from '@/types/word';
import { QuizQuestion, QuizMode } from '@/types/quiz';

interface StudySessionState {
  // Flashcard review session
  deckId: string | null;
  deckName: string;
  queue: WordWithReview[];
  currentIndex: number;
  isFlipped: boolean;
  isFinished: boolean;

  startReview: (deckId: string | null, deckName: string, words: WordWithReview[]) => void;
  flipCard: () => void;
  nextCard: () => void;
  resetReview: () => void;

  // Quiz session
  quizDeckId: string | null;
  quizMode: QuizMode | null;
  quizQuestions: QuizQuestion[];
  quizCurrentIndex: number;
  quizAnswers: { wordId: string; userAnswer: string; correctAnswer: string; isCorrect: boolean }[];
  quizIsFinished: boolean;

  startQuiz: (deckId: string | null, mode: QuizMode, questions: QuizQuestion[]) => void;
  recordQuizAnswer: (wordId: string, userAnswer: string, correctAnswer: string, isCorrect: boolean) => void;
  nextQuizQuestion: () => void;
  resetQuiz: () => void;
}

export const useStudyStore = create<StudySessionState>((set, get) => ({
  // Review state
  deckId: null,
  deckName: '',
  queue: [],
  currentIndex: 0,
  isFlipped: false,
  isFinished: false,

  startReview: (deckId, deckName, words) => {
    set({
      deckId,
      deckName,
      queue: words,
      currentIndex: 0,
      isFlipped: false,
      isFinished: words.length === 0,
    });
  },

  flipCard: () => {
    set((state) => ({ isFlipped: !state.isFlipped }));
  },

  nextCard: () => {
    const { currentIndex, queue } = get();
    if (currentIndex + 1 < queue.length) {
      set({
        currentIndex: currentIndex + 1,
        isFlipped: false,
      });
    } else {
      set({ isFinished: true, isFlipped: false });
    }
  },

  resetReview: () => {
    set({
      deckId: null,
      deckName: '',
      queue: [],
      currentIndex: 0,
      isFlipped: false,
      isFinished: false,
    });
  },

  // Quiz state
  quizDeckId: null,
  quizMode: null,
  quizQuestions: [],
  quizCurrentIndex: 0,
  quizAnswers: [],
  quizIsFinished: false,

  startQuiz: (deckId, mode, questions) => {
    set({
      quizDeckId: deckId,
      quizMode: mode,
      quizQuestions: questions,
      quizCurrentIndex: 0,
      quizAnswers: [],
      quizIsFinished: questions.length === 0,
    });
  },

  recordQuizAnswer: (wordId, userAnswer, correctAnswer, isCorrect) => {
    set((state) => ({
      quizAnswers: [
        ...state.quizAnswers,
        { wordId, userAnswer, correctAnswer, isCorrect },
      ],
    }));
  },

  nextQuizQuestion: () => {
    const { quizCurrentIndex, quizQuestions } = get();
    if (quizCurrentIndex + 1 < quizQuestions.length) {
      set({ quizCurrentIndex: quizCurrentIndex + 1 });
    } else {
      set({ quizIsFinished: true });
    }
  },

  resetQuiz: () => {
    set({
      quizDeckId: null,
      quizMode: null,
      quizQuestions: [],
      quizCurrentIndex: 0,
      quizAnswers: [],
      quizIsFinished: false,
    });
  },
}));
