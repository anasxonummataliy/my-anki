import { AppBackupSchema, AppBackupData } from '../src/types/backup';

describe('Backup Validation Schema', () => {
  it('validates a correct full backup structure', () => {
    const validData: AppBackupData = {
      version: 1,
      app: 'MyAnki',
      exportedAt: '2026-10-15T12:00:00.000Z',
      decks: [
        {
          id: 'deck-1',
          name: '4000 Essential English Words',
          description: 'Top vocabulary',
          parentId: null,
          color: '#4F46E5',
          createdAt: 1000,
          updatedAt: 1000,
        },
      ],
      words: [
        {
          id: 'word-1',
          deckId: 'deck-1',
          word: 'resilient',
          translation: 'bardoshli',
          definition: 'able to withstand difficulties',
          example: 'She was resilient.',
          partOfSpeech: 'adjective',
          notes: null,
          createdAt: 1000,
          updatedAt: 1000,
        },
      ],
      reviewStates: [
        {
          wordId: 'word-1',
          state: 1,
          due: 100000,
          stability: 2.5,
          difficulty: 5.0,
          elapsedDays: 1,
          scheduledDays: 1,
          reps: 1,
          lapses: 0,
          lastReview: 1000,
        },
      ],
      reviewLogs: [],
      quizSessions: [],
      quizAnswers: [],
      settings: {
        daily_goal: '25',
      },
    };

    const result = AppBackupSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects an invalid backup with missing required fields or wrong app tag', () => {
    const invalidData = {
      version: 1,
      app: 'AnotherApp', // invalid app tag
      exportedAt: '2026-10-15T12:00:00.000Z',
      decks: [],
      words: [],
    };

    const result = AppBackupSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
