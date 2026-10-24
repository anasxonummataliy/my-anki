import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { useThemeStore } from '@/store/themeStore';
import { getWords } from '@/db/repositories/wordRepository';
import { WordWithReview } from '@/types/word';
import { triggerHaptic } from '@/utils/haptics';
import {
  Search,
  SlidersHorizontal,
  ChevronRight,
  CheckCircle2,
  Plus,
  Play,
  Sparkles,
} from 'lucide-react-native';
import { useResponsive } from '@/utils/responsive';

type FilterTab = 'all' | 'due' | 'new' | 'learned';

export default function StudyScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeStore((s) => s.getColors());
  const { isLargeScreen, contentMaxWidth } = useResponsive();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [words, setWords] = useState<WordWithReview[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadWords = useCallback(async () => {
    try {
      let statusOption: any = undefined;
      if (activeTab === 'due') statusOption = 'review';
      else if (activeTab === 'new') statusOption = 'new';
      else if (activeTab === 'learned') statusOption = 'learned';

      const w = await getWords({
        searchQuery: searchQuery.trim(),
        status: statusOption,
        sortBy: 'alphabetical',
      });
      setWords(w);
    } catch (err) {
      console.error('Error loading vocabulary words:', err);
    }
  }, [activeTab, searchQuery]);

  useFocusEffect(
    useCallback(() => {
      loadWords();
    }, [loadWords])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWords();
    setRefreshing(false);
  };

  const getPosBadgeColor = (pos?: string | null) => {
    const p = (pos || '').toLowerCase();
    if (p.includes('adj')) {
      return { bg: '#D1FAE5', text: '#059669', label: 'adj.' };
    }
    if (p.includes('verb') || p === 'v' || p === 'v.') {
      return { bg: '#FEF3C7', text: '#D97706', label: 'v.' };
    }
    if (p.includes('noun') || p === 'n' || p === 'n.') {
      return { bg: '#EDE9FE', text: '#7C3AED', label: 'n.' };
    }
    if (p.includes('adv')) {
      return { bg: '#E0F2FE', text: '#0284C7', label: 'adv.' };
    }
    return { bg: colors.surface, text: colors.textSecondary, label: 'w.' };
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.headerRow,
          {
            paddingTop: insets.top + (isLargeScreen ? 20 : 8),
            maxWidth: contentMaxWidth,
            paddingHorizontal: isLargeScreen ? 32 : 20,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: isLargeScreen ? 36 : 30 }]}>Vocabulary</Text>
        <TouchableOpacity
          style={[
            styles.quizHeaderBtn,
            {
              backgroundColor: colors.primaryLight,
              paddingHorizontal: isLargeScreen ? 16 : 12,
              paddingVertical: isLargeScreen ? 10 : 7,
            },
          ]}
          onPress={() => router.push('/quiz/all')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.8}
        >
          <Sparkles size={isLargeScreen ? 18 : 16} color={colors.primary} />
          <Text style={[styles.quizHeaderBtnText, { color: colors.primary, fontSize: isLargeScreen ? 15 : 14 }]}>Quiz</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={[styles.searchSection, { maxWidth: contentMaxWidth, paddingHorizontal: isLargeScreen ? 32 : 20, marginBottom: isLargeScreen ? 20 : 14 }]}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderLight,
              height: isLargeScreen ? 54 : 48,
              borderRadius: isLargeScreen ? 16 : 16,
              paddingHorizontal: isLargeScreen ? 18 : 14,
            },
          ]}
        >
          <Search size={isLargeScreen ? 22 : 18} color={colors.textSecondary} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search words..."
            placeholderTextColor={colors.textSecondary}
            style={[styles.searchInput, { color: colors.text, fontSize: isLargeScreen ? 17 : 15 }]}
          />
        </View>
      </View>

      {/* Filter Tabs Row */}
      <View style={[styles.tabsRow, { maxWidth: contentMaxWidth, paddingHorizontal: isLargeScreen ? 32 : 20, marginBottom: isLargeScreen ? 20 : 14 }]}>
        {(['all', 'due', 'new', 'learned'] as FilterTab[]).map((tab) => {
          const isSelected = activeTab === tab;
          const label =
            tab === 'all'
              ? 'All'
              : tab === 'due'
              ? 'Due'
              : tab === 'new'
              ? 'New'
              : 'Learned';

          return (
            <TouchableOpacity
              key={tab}
              onPress={() => {
                triggerHaptic('selection');
                setActiveTab(tab);
              }}
              style={[
                styles.tabPill,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  paddingHorizontal: isLargeScreen ? 22 : 18,
                  paddingVertical: isLargeScreen ? 10 : 8,
                },
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabPillText,
                  {
                    color: isSelected ? '#FFFFFF' : colors.textSecondary,
                    fontWeight: isSelected ? '700' : '600',
                    fontSize: isLargeScreen ? 15 : 14,
                  },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Words List */}
      <FlatList
        data={words}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          {
            maxWidth: contentMaxWidth,
            paddingHorizontal: isLargeScreen ? 32 : 20,
            paddingBottom: insets.bottom + (isLargeScreen ? 60 : 40),
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const badge = getPosBadgeColor(item.partOfSpeech);
          const isLearned = (item.reps ?? 0) >= 2 || item.state === 2;

          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push(`/word/${item.id}`)}
              style={[styles.wordCard, { backgroundColor: colors.card }]}
            >
              <View style={styles.wordCardLeft}>
                {/* POS circle badge */}
                <View
                  style={[
                    styles.posCircleBadge,
                    { backgroundColor: badge.bg },
                  ]}
                >
                  <Text style={[styles.posBadgeText, { color: badge.text }]}>
                    {badge.label}
                  </Text>
                </View>

                {/* Word & Translation */}
                <View style={styles.wordInfo}>
                  <Text style={[styles.wordHeading, { color: colors.text }]}>
                    {item.word}
                  </Text>
                  <Text
                    style={[styles.translationSub, { color: colors.textSecondary }]}
                  >
                    {item.translation}
                  </Text>
                </View>
              </View>

              {/* Right Action/Status */}
              <View style={styles.wordCardRight}>
                {isLearned ? (
                  <CheckCircle2 size={22} color="#10B981" />
                ) : (
                  <ChevronRight size={20} color={colors.textSecondary} />
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No words found
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {searchQuery
                ? 'Try a different search query'
                : 'Tap + below to add your first word'}
            </Text>
          </View>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() => {
          triggerHaptic('medium');
          router.push('/word/form');
        }}
        activeOpacity={0.85}
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            bottom: insets.bottom + 24,
          },
        ]}
      >
        <Plus size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  quizHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  quizHeaderBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 14,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 14,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  tabPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tabPillText: {
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 20,
    gap: 10,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  wordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  wordCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  posCircleBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  posBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  wordInfo: {
    flex: 1,
  },
  wordHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  translationSub: {
    fontSize: 13,
    fontWeight: '500',
  },
  wordCardRight: {
    paddingLeft: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF5E1E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
});
