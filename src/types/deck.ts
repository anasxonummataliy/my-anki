export interface Deck {
  id: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
  color?: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface DeckWithStats extends Deck {
  totalWords: number;
  newWords: number;
  dueReviews: number;
  learnedWords: number;
  subdecks?: DeckWithStats[];
}

export interface DeckCounts {
  total: number;
  newCount: number;
  dueCount: number;
  learnedCount: number;
}
