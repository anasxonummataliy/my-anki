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
import { useResponsive } from '@/utils/responsive';
import {
  Plus,
  Layers,
  ChevronRight,
  Search,
} from 'lucide-react-native';

export default function DecksScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeStore((s) => s.getColors());
  const { isLargeScreen, contentMaxWidth } = useResponsive();

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
            paddingTop: insets.top + (isLargeScreen ? 20 : 12),
            borderBottomColor: colors.borderLight,
          },
        ]}
      >
        <View style={[styles.headerInner, { maxWidth: contentMaxWidth, paddingHorizontal: isLargeScreen ? 32 : 20 }]}>
          <Text style={[styles.headerTitle, { color: colors.text, fontSize: isLargeScreen ? 36 : 28 }]}>
            Decks
          </Text>

          <TouchableOpacity
            onPress={() => router.push('/deck/form')}
            style={[
              styles.plusCircleBtn,
              {
                backgroundColor: colors.primary,
                width: isLargeScreen ? 48 : 40,
                height: isLargeScreen ? 48 : 40,
                borderRadius: isLargeScreen ? 24 : 20,
              },
            ]}
            activeOpacity={0.8}
          >
            <Plus size={isLargeScreen ? 26 : 22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            maxWidth: contentMaxWidth,
            padding: isLargeScreen ? 32 : 20,
            paddingBottom: isLargeScreen ? 60 : 40,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Search Bar */}
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              height: isLargeScreen ? 56 : 46,
              borderRadius: isLargeScreen ? 16 : 14,
              paddingHorizontal: isLargeScreen ? 18 : 14,
              marginBottom: isLargeScreen ? 26 : 20,
            },
          ]}
        >
          <Search size={isLargeScreen ? 22 : 18} color={colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search decks..."
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text, fontSize: isLargeScreen ? 17 : 15 }]}
          />
        </View>

        {filteredDecks.length === 0 ? (
          <EmptyState
            icon={<Layers size={isLargeScreen ? 64 : 48} color={colors.textMuted} />}
            title="No Decks Found"
            description="Create your first deck to organize your vocabulary by units and topics."
            actionTitle="New Deck"
            onAction={() => router.push('/deck/form')}
          />
        ) : (
          filteredDecks.map((deck) => {
            const hasSubdecks = deck.subdecks && deck.subdecks.length > 0;

            return (
              <View key={deck.id} style={[styles.deckGroup, { marginBottom: isLargeScreen ? 20 : 14 }]}>
                {/* Main Deck Container Card */}
                <Card variant="elevated" style={[styles.deckCard, { borderRadius: isLargeScreen ? 24 : 20 }]}>
                  {/* Top Deck Title Header */}
                  <TouchableOpacity
                    onPress={() => router.push(`/deck/${deck.id}`)}
                    activeOpacity={0.7}
                    style={[styles.deckHeaderRow, { padding: isLargeScreen ? 24 : 18 }]}
                  >
                    <View style={styles.deckHeaderLeft}>
                      <View
                        style={[
                          styles.verticalBar,
                          {
                            backgroundColor: deck.color || colors.primary,
                            width: isLargeScreen ? 6 : 4,
                            height: isLargeScreen ? 48 : 38,
                          },
                        ]}
                      />
                      <View style={styles.deckTitleBox}>
                        <Text style={[styles.deckName, { color: colors.text, fontSize: isLargeScreen ? 21 : 17 }]}>
                          {deck.name}
                        </Text>
                        <Text
                          style={[
                            styles.deckWordsCount,
                            { color: colors.textSecondary, fontSize: isLargeScreen ? 15 : 13 },
                          ]}
                        >
                          {deck.totalWords.toLocaleString()} words
                        </Text>
                      </View>
                    </View>

                    <View style={styles.deckHeaderRight}>
                      {!hasSubdecks && (
                        <Text
                          style={[
                            styles.dueTextHighlight,
                            { color: colors.primary, fontSize: isLargeScreen ? 15 : 13 },
                          ]}
                        >
                          {deck.dueReviews} due
                        </Text>
                      )}
                      <ChevronRight size={isLargeScreen ? 22 : 18} color={colors.textMuted} />
                    </View>
                  </TouchableOpacity>

                  {/* Nested Subdecks List */}
                  {hasSubdecks && (
                    <View
                      style={[
                        styles.subdecksList,
                        {
                          borderTopColor: colors.borderLight,
                          paddingLeft: isLargeScreen ? 48 : 36,
                        },
                      ]}
                    >
                      {deck.subdecks!.map((sub, index) => (
                        <TouchableOpacity
                          key={sub.id}
                          onPress={() => router.push(`/deck/${sub.id}`)}
                          activeOpacity={0.7}
                          style={[
                            styles.subdeckRow,
                            {
                              paddingVertical: isLargeScreen ? 18 : 14,
                              paddingRight: isLargeScreen ? 24 : 18,
                            },
                            index > 0 && { borderTopColor: colors.borderLight, borderTopWidth: 1 },
                          ]}
                        >
                          <View style={styles.subdeckLeft}>
                            <Text
                              style={[
                                styles.subdeckName,
                                { color: colors.text, fontSize: isLargeScreen ? 17 : 15 },
                              ]}
                            >
                              {sub.name}
                            </Text>
                            <Text
                              style={[
                                styles.subdeckWords,
                                { color: colors.textSecondary, fontSize: isLargeScreen ? 14 : 12 },
                              ]}
                            >
                              {sub.totalWords} words
                            </Text>
                          </View>

                          <View style={styles.subdeckRight}>
                            <Text
                              style={[
                                styles.dueTextHighlight,
                                { color: colors.primary, fontSize: isLargeScreen ? 15 : 13 },
                              ]}
                            >
                              {sub.dueReviews} due
                            </Text>
                            <ChevronRight size={isLargeScreen ? 20 : 16} color={colors.textMuted} />
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
    paddingBottom: 16,
    width: '100%',
    alignSelf: 'center',
  },
  headerTitle: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  plusCircleBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF5E1E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  scrollContent: {
    width: '100%',
    alignSelf: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    height: '100%',
  },
  deckGroup: {},
  deckCard: {
    padding: 0,
    overflow: 'hidden',
  },
  deckHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deckHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  verticalBar: {
    borderRadius: 3,
  },
  deckTitleBox: {
    flex: 1,
  },
  deckName: {
    fontWeight: '700',
    marginBottom: 3,
  },
  deckWordsCount: {
    fontWeight: '500',
  },
  deckHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dueTextHighlight: {
    fontWeight: '700',
  },
  subdecksList: {
    borderTopWidth: 1,
  },
  subdeckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subdeckLeft: {
    gap: 3,
  },
  subdeckName: {
    fontWeight: '600',
  },
  subdeckWords: {
    fontWeight: '500',
  },
  subdeckRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
