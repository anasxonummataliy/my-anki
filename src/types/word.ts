export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'pronoun'
  | 'preposition'
  | 'conjunction'
  | 'interjection'
  | 'idiom'
  | 'phrase';

export interface Word {
  id: string;
  deckId: string;
  word: string;
  translation: string;
  definition?: string | null;
  example?: string | null;
  partOfSpeech?: PartOfSpeech | string | null;
  notes?: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface WordWithReview extends Word {
  state?: number;
  due?: number;
  stability?: number;
  difficulty?: number;
  reps?: number;
  lapses?: number;
  lastReview?: number | null;
}

export interface WordFilterOptions {
  deckId?: string;
  searchQuery?: string;
  partOfSpeech?: string;
  status?: 'all' | 'new' | 'learning' | 'review' | 'learned';
  sortBy?: 'alphabetical' | 'newest' | 'oldest' | 'due';
  sortOrder?: 'asc' | 'desc';
}
