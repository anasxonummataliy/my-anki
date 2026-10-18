import { Word } from '@/types/word';
import { QuizMode, QuizQuestion, MatchingPair } from '@/types/quiz';
import { getRandomWords } from '@/db/repositories/wordRepository';

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function generateQuizQuestions(
  words: Word[],
  mode: QuizMode,
  maxQuestions = 20
): Promise<QuizQuestion[]> {
  if (words.length === 0) return [];

  const shuffledWords = shuffleArray(words).slice(0, maxQuestions);

  // If pool has fewer than 4 words, fetch extra random words from the whole database as distractors
  let globalDistractors: Word[] = [];
  if (words.length < 4) {
    const wordIds = words.map((w) => w.id);
    globalDistractors = await getRandomWords(10, wordIds);
  }

  const questions: QuizQuestion[] = [];

  for (const currentWord of shuffledWords) {
    if (mode === 'mc_en_uz') {
      // Prompt: English word, Options: Uzbek translations
      const distractors = getDistractorTranslations(currentWord, words, globalDistractors, 3);
      const options = shuffleArray([currentWord.translation, ...distractors]);

      questions.push({
        id: currentWord.id,
        word: currentWord,
        prompt: currentWord.word,
        secondaryPrompt: currentWord.partOfSpeech
          ? `(${currentWord.partOfSpeech}) ${currentWord.definition || ''}`.trim()
          : currentWord.definition || undefined,
        correctAnswer: currentWord.translation,
        options,
      });
    } else if (mode === 'mc_uz_en') {
      // Prompt: Uzbek translation, Options: English words
      const distractors = getDistractorWords(currentWord, words, globalDistractors, 3);
      const options = shuffleArray([currentWord.word, ...distractors]);

      questions.push({
        id: currentWord.id,
        word: currentWord,
        prompt: currentWord.translation,
        secondaryPrompt: currentWord.partOfSpeech ? `(${currentWord.partOfSpeech})` : undefined,
        correctAnswer: currentWord.word,
        options,
      });
    } else if (mode === 'typing') {
      // Prompt: Uzbek translation, user enters English word
      questions.push({
        id: currentWord.id,
        word: currentWord,
        prompt: currentWord.translation,
        secondaryPrompt: currentWord.partOfSpeech
          ? `(${currentWord.partOfSpeech}) ${currentWord.example ? `e.g. ${currentWord.example}` : ''}`.trim()
          : currentWord.example || undefined,
        correctAnswer: currentWord.word,
      });
    } else if (mode === 'mistakes') {
      // For mistakes, generate multiple choice English -> Uzbek
      const distractors = getDistractorTranslations(currentWord, words, globalDistractors, 3);
      const options = shuffleArray([currentWord.translation, ...distractors]);

      questions.push({
        id: currentWord.id,
        word: currentWord,
        prompt: currentWord.word,
        secondaryPrompt: currentWord.partOfSpeech
          ? `(${currentWord.partOfSpeech}) ${currentWord.definition || ''}`.trim()
          : currentWord.definition || undefined,
        correctAnswer: currentWord.translation,
        options,
      });
    }
  }

  return questions;
}

function getDistractorTranslations(
  target: Word,
  localWords: Word[],
  fallbackWords: Word[],
  count: number
): string[] {
  const pool = [...localWords.filter((w) => w.id !== target.id), ...fallbackWords];
  const uniqueTranslations = new Set<string>();

  const shuffledPool = shuffleArray(pool);
  for (const item of shuffledPool) {
    if (
      item.translation.toLowerCase().trim() !== target.translation.toLowerCase().trim() &&
      !uniqueTranslations.has(item.translation)
    ) {
      uniqueTranslations.add(item.translation);
      if (uniqueTranslations.size >= count) break;
    }
  }

  return Array.from(uniqueTranslations);
}

function getDistractorWords(
  target: Word,
  localWords: Word[],
  fallbackWords: Word[],
  count: number
): string[] {
  const pool = [...localWords.filter((w) => w.id !== target.id), ...fallbackWords];
  const uniqueWords = new Set<string>();

  const shuffledPool = shuffleArray(pool);
  for (const item of shuffledPool) {
    if (
      item.word.toLowerCase().trim() !== target.word.toLowerCase().trim() &&
      !uniqueWords.has(item.word)
    ) {
      uniqueWords.add(item.word);
      if (uniqueWords.size >= count) break;
    }
  }

  return Array.from(uniqueWords);
}

export function generateMatchingPairs(words: Word[], pairCount = 5): {
  pairs: MatchingPair[];
  englishList: { id: string; text: string }[];
  uzbekList: { id: string; text: string }[];
} {
  const selectedWords = shuffleArray(words).slice(0, pairCount);
  const pairs: MatchingPair[] = selectedWords.map((w) => ({
    id: w.id,
    english: w.word,
    uzbek: w.translation,
    isMatched: false,
  }));

  const englishList = shuffleArray(selectedWords.map((w) => ({ id: w.id, text: w.word })));
  const uzbekList = shuffleArray(selectedWords.map((w) => ({ id: w.id, text: w.translation })));

  return { pairs, englishList, uzbekList };
}

export function normalizeAnswer(ans: string): string {
  return ans.toLowerCase().trim().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '');
}

export function checkTypingAnswer(userAnswer: string, correctAnswer: string): boolean {
  return normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer);
}
