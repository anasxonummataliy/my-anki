import { getDb } from '../client';
import { Deck, DeckWithStats, DeckCounts } from '@/types/deck';
import * as Crypto from 'expo-crypto';
import { syncDeckToRemote, deleteDeckFromRemote } from '@/services/syncService';

export interface DeckRow {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  color: string | null;
  created_at: number;
  updated_at: number;
}

function mapDeck(row: DeckRow): Deck {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    parentId: row.parent_id,
    color: row.color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAllDecks(): Promise<DeckWithStats[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<DeckRow>(
    `SELECT * FROM decks ORDER BY name ASC;`
  );

  const decks: DeckWithStats[] = [];
  for (const row of rows) {
    const deck = mapDeck(row);
    const counts = await getDeckCounts(deck.id, false);
    decks.push({
      ...deck,
      totalWords: counts.total,
      newWords: counts.newCount,
      dueReviews: counts.dueCount,
      learnedWords: counts.learnedCount,
    });
  }

  return decks;
}

export async function getRootDecks(): Promise<DeckWithStats[]> {
  const all = await getAllDecks();
  // Filter top-level decks and nest immediate subdecks
  const deckMap = new Map<string, DeckWithStats>();
  all.forEach((d) => deckMap.set(d.id, { ...d, subdecks: [] }));

  const roots: DeckWithStats[] = [];
  for (const deck of all) {
    if (deck.parentId && deckMap.has(deck.parentId)) {
      deckMap.get(deck.parentId)!.subdecks?.push(deckMap.get(deck.id)!);
    } else {
      roots.push(deckMap.get(deck.id)!);
    }
  }

  return roots;
}

export async function getDeckById(id: string): Promise<DeckWithStats | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<DeckRow>(
    `SELECT * FROM decks WHERE id = ?;`,
    [id]
  );
  if (!row) return null;

  const deck = mapDeck(row);
  const counts = await getDeckCounts(id, true);
  const subdeckRows = await db.getAllAsync<DeckRow>(
    `SELECT * FROM decks WHERE parent_id = ? ORDER BY name ASC;`,
    [id]
  );

  const subdecks: DeckWithStats[] = [];
  for (const subRow of subdeckRows) {
    const subCounts = await getDeckCounts(subRow.id, true);
    subdecks.push({
      ...mapDeck(subRow),
      totalWords: subCounts.total,
      newWords: subCounts.newCount,
      dueReviews: subCounts.dueCount,
      learnedWords: subCounts.learnedCount,
    });
  }

  return {
    ...deck,
    totalWords: counts.total,
    newWords: counts.newCount,
    dueReviews: counts.dueCount,
    learnedWords: counts.learnedCount,
    subdecks,
  };
}

export async function getAllDescendantDeckIds(deckId: string): Promise<string[]> {
  const db = await getDb();
  const ids: string[] = [deckId];
  const queue: string[] = [deckId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const children = await db.getAllAsync<{ id: string }>(
      `SELECT id FROM decks WHERE parent_id = ?;`,
      [currentId]
    );
    for (const child of children) {
      ids.push(child.id);
      queue.push(child.id);
    }
  }

  return ids;
}

export async function getDeckCounts(deckId: string, includeSubdecks = true): Promise<DeckCounts> {
  const db = await getDb();
  const deckIds = includeSubdecks ? await getAllDescendantDeckIds(deckId) : [deckId];
  if (deckIds.length === 0) {
    return { total: 0, newCount: 0, dueCount: 0, learnedCount: 0 };
  }

  const placeholders = deckIds.map(() => '?').join(',');
  const now = Date.now();

  // Total words
  const totalRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM words WHERE deck_id IN (${placeholders});`,
    deckIds
  );

  // New words (state = 0)
  const newRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM words w
     LEFT JOIN review_states rs ON w.id = rs.word_id
     WHERE w.deck_id IN (${placeholders}) AND (rs.state = 0 OR rs.state IS NULL);`,
    deckIds
  );

  // Due reviews (state != 0 AND due <= now)
  const dueRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM words w
     JOIN review_states rs ON w.id = rs.word_id
     WHERE w.deck_id IN (${placeholders}) AND rs.state > 0 AND rs.due <= ?;`,
    [...deckIds, now]
  );

  // Learned words (state = 2 Review AND reps >= 2)
  const learnedRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM words w
     JOIN review_states rs ON w.id = rs.word_id
     WHERE w.deck_id IN (${placeholders}) AND rs.state = 2 AND rs.reps >= 2;`,
    deckIds
  );

  return {
    total: totalRow?.count ?? 0,
    newCount: newRow?.count ?? 0,
    dueCount: dueRow?.count ?? 0,
    learnedCount: learnedRow?.count ?? 0,
  };
}

export async function createDeck(deck: {
  name: string;
  description?: string | null;
  parentId?: string | null;
  color?: string | null;
}): Promise<Deck> {
  const db = await getDb();
  const id = Crypto.randomUUID();
  const now = Date.now();

  await db.runAsync(
    `INSERT INTO decks (id, name, description, parent_id, color, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      deck.name.trim(),
      deck.description?.trim() || null,
      deck.parentId || null,
      deck.color || '#4F46E5',
      now,
      now,
    ]
  );

  const createdDeck: Deck = {
    id,
    name: deck.name.trim(),
    description: deck.description?.trim() || null,
    parentId: deck.parentId || null,
    color: deck.color || '#4F46E5',
    createdAt: now,
    updatedAt: now,
  };

  void syncDeckToRemote({
    id,
    name: createdDeck.name,
    description: createdDeck.description,
    parent_id: createdDeck.parentId,
    color: createdDeck.color,
    created_at: now,
    updated_at: now,
  });

  return createdDeck;
}

export async function updateDeck(deck: {
  id: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
  color?: string | null;
}): Promise<void> {
  const db = await getDb();
  const now = Date.now();

  await db.runAsync(
    `UPDATE decks
     SET name = ?, description = ?, parent_id = ?, color = ?, updated_at = ?
     WHERE id = ?;`,
    [
      deck.name.trim(),
      deck.description?.trim() || null,
      deck.parentId || null,
      deck.color || null,
      now,
      deck.id,
    ]
  );

  void syncDeckToRemote({
    id: deck.id,
    name: deck.name.trim(),
    description: deck.description?.trim() || null,
    parent_id: deck.parentId || null,
    color: deck.color || null,
    created_at: now,
    updated_at: now,
  });
}

export async function deleteDeck(id: string): Promise<void> {
  const db = await getDb();
  // Deleting deck will cascade to child decks, words, review states, logs via foreign keys
  await db.runAsync(`DELETE FROM decks WHERE id = ?;`, [id]);
  void deleteDeckFromRemote(id);
}
