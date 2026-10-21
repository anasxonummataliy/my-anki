import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { useThemeStore } from '@/store/themeStore';
import { getRootDecks, deleteDeck } from '@/db/repositories/deckRepository';
import { DeckWithStats } from '@/types/deck';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { triggerHaptic } from '@/utils/haptics';
import {
  Plus,
  Layers,
  ChevronRight,
  Search,
  BookOpen,
  Trash2,
  FolderTree,
} from 'lucide-react-native';

export default function DecksScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeStore((s) => s.getColors());
  const [decks, setDecks] = useState<DeckWithStats[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadDecks = useCallback(async () => {
    try {
      const data = await getRootDecks();
      setDecks(data);
    } catch (err) {
      console.error('Error loading decks:', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDecks();
    }, [loadDecks])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDecks();
    setRefreshing(false);
  };

  const handleDeleteDeck = (deck: DeckWithStats) => {
    triggerHaptic('warning');
    Alert.alert(
      'Delete Deck',
      `Delete "${deck.name}" permanently?\n\nAll ${deck.totalWords} words and any subdecks will be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDeck(deck.id);
              triggerHaptic('success');
              await loadDecks();
            } catch (err) {
              console.error('Delete error:', err);
              Alert.alert('Error', 'Failed to delete deck');
            }
          },
        },
      ]
    );
  };

  const filteredDecks = decks.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    d.subdecks?.some((sub) => sub.name.toLowerCase().includes(searchQuery.toLowerCase().trim()))
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header with + Button */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 12,
            borderBottomColor: colors.borderLight,
          },
        ]}
      >
        <View style={styles.headerInner}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Decks</Text>

          <TouchableOpacity
            onPress={() => router.push('/deck/form')}
            style={[styles.plusCircleBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
          >
            <Plus size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Search Bar matching reference image */}
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Search size={18} color={colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search decks..."
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>

        {filteredDecks.length === 0 ? (
          <EmptyState
            icon={<Layers size={48} color={colors.textMuted} />}
            title="No Decks Found"
            description="Create your first deck to organize your vocabulary by units and topics."
            actionTitle="New Deck"
            onAction={() => router.push('/deck/form')}
          />
        ) : (
          filteredDecks.map((deck) => {
            const hasSubdecks = deck.subdecks && deck.subdecks.length > 0;

            return (
              <View key={deck.id} style={styles.deckGroup}>
                {/* Main Deck Container Card */}
                <Card variant="elevated" style={styles.deckCard}>
                  {/* Top Deck Title Header */}
                  <TouchableOpacity
                    onPress={() => router.push(`/deck/${deck.id}`)}
                    activeOpacity={0.7}
                    style={styles.deckHeaderRow}
                  >
                    <View style={styles.deckHeaderLeft}>
                      <View
                        style={[
                          styles.verticalBar,
                          { backgroundColor: deck.color || colors.primary },
                        ]}
                      />
                      <View style={styles.deckTitleBox}>
                        <Text style={[styles.deckName, { color: colors.text }]}>
                          {deck.name}
                        </Text>
                        <Text style={[styles.deckWordsCount, { color: colors.textSecondary }]}>
                          {deck.totalWords.toLocaleString()} words
                        </Text>
                      </View>
                    </View>

                    <View style={styles.deckHeaderRight}>
                      {!hasSubdecks && (
                        <Text style={[styles.dueTextHighlight, { color: colors.primary }]}>
                          {deck.dueReviews} due
                        </Text>
                      )}
                      <ChevronRight size={18} color={colors.textMuted} />
                    </View>
                  </TouchableOpacity>

                  {/* Nested Subdecks List (matching reference image) */}
                  {hasSubdecks && (
                    <View style={[styles.subdecksList, { borderTopColor: colors.borderLight }]}>
                      {deck.subdecks!.map((sub, index) => (
                        <TouchableOpacity
                          key={sub.id}
                          onPress={() => router.push(`/deck/${sub.id}`)}
                          activeOpacity={0.7}
                          style={[
                            styles.subdeckRow,
                            index > 0 && { borderTopColor: colors.borderLight, borderTopWidth: 1 },
                          ]}
                        >
                          <View style={styles.subdeckLeft}>
                            <Text style={[styles.subdeckName, { color: colors.text }]}>
                              {sub.name}
                            </Text>
                            <Text style={[styles.subdeckWords, { color: colors.textSecondary }]}>
                              {sub.totalWords} words
                            </Text>
                          </View>

                          <View style={styles.subdeckRight}>
                            <Text style={[styles.dueTextHighlight, { color: colors.primary }]}>
                              {sub.dueReviews} due
                            </Text>
                            <ChevronRight size={16} color={colors.textMuted} />
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </Card>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  plusCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF5E1E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  scrollContent: {
    padding: 20,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  deckGroup: {
    marginBottom: 14,
  },
  deckCard: {
    padding: 0,
    borderRadius: 20,
    overflow: 'hidden',
  },
  deckHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
  },
  deckHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  verticalBar: {
    width: 4,
    height: 38,
    borderRadius: 2,
  },
  deckTitleBox: {
    flex: 1,
  },
  deckName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  deckWordsCount: {
    fontSize: 13,
  },
  deckHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dueTextHighlight: {
    fontSize: 13,
    fontWeight: '700',
  },
  subdecksList: {
    borderTopWidth: 1,
    paddingLeft: 36,
  },
  subdeckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingRight: 18,
  },
  subdeckLeft: {
    gap: 2,
  },
  subdeckName: {
    fontSize: 15,
    fontWeight: '600',
  },
  subdeckWords: {
    fontSize: 12,
  },
  subdeckRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
