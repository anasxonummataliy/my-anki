import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '@/store/themeStore';
import {
  getDeckById,
  deleteDeck,
  getAllDescendantDeckIds,
} from '@/db/repositories/deckRepository';
import { getWords, deleteWord } from '@/db/repositories/wordRepository';
import { DeckWithStats } from '@/types/deck';
import { WordWithReview, PartOfSpeech } from '@/types/word';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { Header } from '@/components/common/Header';
import { triggerHaptic } from '@/utils/haptics';
import {
  Search,
  Plus,
  BookOpen,
  Edit2,
  Trash2,
  Filter,
  Layers,
  ChevronRight,
  FolderTree,
  Sparkles,
} from 'lucide-react-native';
import { useResponsive } from '@/utils/responsive';

const POS_FILTERS: (PartOfSpeech | 'all')[] = [
  'all',
  'noun',
  'verb',
  'adjective',
  'adverb',
  'phrase',
];

export default function DeckDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colors = useThemeStore((s) => s.getColors());
  const { isLargeScreen, contentMaxWidth } = useResponsive();

  const [deck, setDeck] = useState<DeckWithStats | null>(null);
  const [words, setWords] = useState<WordWithReview[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPos, setSelectedPos] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const loadDeckData = useCallback(async () => {
    if (!id) return;
    try {
      const d = await getDeckById(id);
      setDeck(d);

      const descendantIds = await getAllDescendantDeckIds(id);
      const w = await getWords({
        deckId: id,
        searchQuery: searchQuery.trim(),
        partOfSpeech: selectedPos === 'all' ? undefined : selectedPos,
        sortBy: 'newest',
      });
      setWords(w);
    } catch (err) {
      console.error('Error loading deck:', err);
    } finally {
      setLoading(false);
    }
  }, [id, searchQuery, selectedPos]);

  useFocusEffect(
    useCallback(() => {
      loadDeckData();
    }, [loadDeckData])
  );

  const handleDeleteDeck = () => {
    if (!deck) return;
    triggerHaptic('warning');
    Alert.alert(
      'Delete Deck',
      `Delete "${deck.name}" and all its words and subdecks permanently?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteDeck(deck.id);
            triggerHaptic('success');
            router.back();
          },
        },
      ]
    );
  };

  const handleDeleteWord = (word: WordWithReview) => {
    triggerHaptic('warning');
    Alert.alert(
      'Delete Word',
      `Delete "${word.word}" from this deck?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteWord(word.id);
            triggerHaptic('success');
            loadDeckData();
          },
        },
      ]
    );
  };

  if (!deck && !loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title="Deck Not Found" showBack />
        <EmptyState
          title="Deck Not Found"
          description="This deck may have been deleted."
          actionTitle="Go Back"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Header
        title={deck?.name || 'Deck'}
        subtitle={deck?.description || undefined}
        showBack
        rightAction={
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/deck/form',
                  params: { deckId: deck?.id },
                })
              }
              style={styles.iconBtn}
            >
              <Edit2 size={18} color={colors.text} />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleDeleteDeck} style={styles.iconBtn}>
              <Trash2 size={18} color={colors.danger} />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Main Content List */}
      <FlatList
        data={words}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          {
            maxWidth: contentMaxWidth,
            paddingHorizontal: isLargeScreen ? 32 : 20,
            paddingBottom: isLargeScreen ? 60 : 40,
          },
        ]}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {/* Quick Actions */}
            <View style={styles.actionButtonsContainer}>
              <View style={styles.actionButtonsRow}>
                <Button
                  title={`Flashcards (${deck?.dueReviews ?? 0})`}
                  onPress={() => router.push(`/review/${deck?.id}`)}
                  size="md"
                  variant="primary"
                  icon={<BookOpen size={18} color="#FFFFFF" />}
                  style={styles.actionBtn}
                />

                <Button
                  title="Quiz Test"
                  onPress={() => router.push(`/quiz/${deck?.id}`)}
                  size="md"
                  variant="outline"
                  icon={<Sparkles size={18} color={colors.primary} />}
                  style={styles.actionBtn}
                />
              </View>

              <Button
                title="Add Word"
                onPress={() =>
                  router.push({
                    pathname: '/word/form',
                    params: { defaultDeckId: deck?.id },
                  })
                }
                size="md"
                variant="secondary"
                icon={<Plus size={18} color={colors.text} />}
                style={styles.addWordBtn}
              />
            </View>

            {/* Subdecks Section if any */}
            {deck?.subdecks && deck.subdecks.length > 0 && (
              <View style={styles.subdecksSection}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  SUBDECKS
                </Text>
                {deck.subdecks.map((sub) => (
                  <Card
                    key={sub.id}
                    onPress={() => router.push(`/deck/${sub.id}`)}
                    style={styles.subdeckItemCard}
                  >
                    <View style={styles.subdeckRow}>
                      <View style={styles.subdeckLeft}>
                        <FolderTree size={16} color={colors.secondary} />
                        <Text style={[styles.subdeckName, { color: colors.text }]}>
                          {sub.name}
                        </Text>
                      </View>
                      <Text style={[styles.subdeckCounts, { color: colors.textSecondary }]}>
                        {sub.totalWords} words
                      </Text>
                    </View>
                  </Card>
                ))}
              </View>
            )}

            {/* Search Input */}
            <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Search size={18} color={colors.textMuted} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search words or translations..."
                placeholderTextColor={colors.textMuted}
                style={[styles.searchInput, { color: colors.text }]}
              />
            </View>

            {/* POS Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterPills}
            >
              {POS_FILTERS.map((pos) => (
                <TouchableOpacity
                  key={pos}
                  onPress={() => {
                    triggerHaptic('selection');
                    setSelectedPos(pos);
                  }}
                  style={[
                    styles.filterPill,
                    {
                      backgroundColor:
                        selectedPos === pos ? colors.primary : colors.card,
                      borderColor:
                        selectedPos === pos ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      { color: selectedPos === pos ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {pos.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.wordsCountRow}>
              <Text style={[styles.wordsCountText, { color: colors.textSecondary }]}>
                {words.length} vocabulary words
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Card
            onPress={() => router.push(`/word/${item.id}`)}
            style={styles.wordCard}
          >
            <View style={styles.wordCardRow}>
              <View style={styles.wordMain}>
                <View style={styles.wordTitleRow}>
                  <Text style={[styles.wordText, { color: colors.text }]}>
                    {item.word}
                  </Text>
                  {item.partOfSpeech ? (
                    <Badge label={item.partOfSpeech} variant="neutral" />
                  ) : null}
                </View>

                <Text style={[styles.translationText, { color: colors.primary }]}>
                  {item.translation}
                </Text>

                {item.example ? (
                  <Text
                    style={[styles.exampleText, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {`"${item.example}"`}
                  </Text>
                ) : null}
              </View>

              <TouchableOpacity
                onPress={() => handleDeleteWord(item)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.deleteWordBtn}
              >
                <Trash2 size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState
            title="No Words Found"
            description={
              searchQuery
                ? 'Try a different search term or clear the filter.'
                : 'This deck currently has no words.'
            }
            actionTitle="Add New Word"
            onAction={() =>
              router.push({
                pathname: '/word/form',
                params: { defaultDeckId: deck?.id },
              })
            }
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    padding: 6,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  listHeader: {
    marginBottom: 16,
  },
  actionButtonsContainer: {
    gap: 10,
    marginBottom: 20,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
  },
  addWordBtn: {
    width: '100%',
  },
  subdecksSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  subdeckItemCard: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 14,
  },
  subdeckRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subdeckLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subdeckName: {
    fontSize: 15,
    fontWeight: '600',
  },
  subdeckCounts: {
    fontSize: 13,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  filterPills: {
    gap: 8,
    paddingBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  wordsCountRow: {
    marginTop: 4,
    marginBottom: 8,
  },
  wordsCountText: {
    fontSize: 13,
    fontWeight: '600',
  },
  wordCard: {
    marginBottom: 10,
    padding: 16,
    borderRadius: 16,
  },
  wordCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordMain: {
    flex: 1,
  },
  wordTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  wordText: {
    fontSize: 17,
    fontWeight: '700',
  },
  translationText: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  deleteWordBtn: {
    padding: 8,
    marginLeft: 8,
  },
});
