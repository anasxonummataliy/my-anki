import {
  generateMatchingPairs,
  generateQuizQuestions,
  normalizeAnswer,
  checkTypingAnswer,
} from '../src/services/quizService';
import { Word } from '../src/types/word';

jest.mock('@/db/repositories/wordRepository', () => ({
  getRandomWords: jest.fn().mockResolvedValue([]),
}));

const mockWords: Word[] = [
  {
    id: 'w1',
    deckId: 'd1',
    word: 'resilient',
    translation: 'bardoshli',
    definition: 'able to recover quickly',
    example: 'She is resilient.',
    partOfSpeech: 'adjective',
    createdAt: 1000,
    updatedAt: 1000,
  },
  {
    id: 'w2',
    deckId: 'd1',
    word: 'abundant',
    translation: 'moʻl, koʻp',
    definition: 'existing in large quantities',
    example: 'Abundant sunshine.',
    partOfSpeech: 'adjective',
    createdAt: 1000,
    updatedAt: 1000,
  },
  {
    id: 'w3',
    deckId: 'd1',
    word: 'diligent',
    translation: 'mehnatkash',
    definition: 'hardworking',
    example: 'A diligent student.',
    partOfSpeech: 'adjective',
    createdAt: 1000,
    updatedAt: 1000,
  },
  {
    id: 'w4',
    deckId: 'd1',
    word: 'curious',
    translation: 'qiziquvchan',
    definition: 'eager to know or learn something',
    example: 'A curious mind.',
    partOfSpeech: 'adjective',
    createdAt: 1000,
    updatedAt: 1000,
  },
];

describe('Quiz Service', () => {
  describe('Multiple Choice Generation', () => {
    it('generates questions with distinct distractors', async () => {
      const questions = await generateQuizQuestions(mockWords, 'mc_en_uz', 2);
      expect(questions.length).toBe(2);

      for (const q of questions) {
        expect(q.options).toBeDefined();
        expect(q.options!.includes(q.correctAnswer)).toBe(true);
        // Verify options have no duplicates
        const uniqueSet = new Set(q.options!);
        expect(uniqueSet.size).toBe(q.options!.length);
      }
    });
  });

  describe('Matching Pairs Generation', () => {
    it('creates matching pairs and independent shuffled lists', () => {
      const { pairs, englishList, uzbekList } = generateMatchingPairs(mockWords, 3);
      expect(pairs.length).toBe(3);
      expect(englishList.length).toBe(3);
      expect(uzbekList.length).toBe(3);

      for (const p of pairs) {
        expect(englishList.some((e) => e.id === p.id && e.text === p.english)).toBe(true);
        expect(uzbekList.some((u) => u.id === p.id && u.text === p.uzbek)).toBe(true);
      }
    });
  });

  describe('Typing Answer Validation', () => {
    it('normalizes answers by trimming and ignoring punctuation and case', () => {
      expect(normalizeAnswer('  Hello, World! ')).toBe('hello world');
      expect(checkTypingAnswer('resilient', 'Resilient')).toBe(true);
      expect(checkTypingAnswer('resilient.', 'resilient')).toBe(true);
      expect(checkTypingAnswer('  RESILIENT  ', 'resilient')).toBe(true);
      expect(checkTypingAnswer('wrong', 'resilient')).toBe(false);
    });
  });
});
