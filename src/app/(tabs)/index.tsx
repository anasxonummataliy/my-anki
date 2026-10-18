import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { useThemeStore } from '@/store/themeStore';
import { getDashboardStats, DashboardStats } from '@/services/statsService';
import { getRootDecks } from '@/db/repositories/deckRepository';
import { DeckWithStats } from '@/types/deck';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import {
  Flame,
  BookOpen,
  Plus,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
  TrendingUp,
} from 'lucide-react-native';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeStore((s) => s.getColors());
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [decks, setDecks] = useState<DeckWithStats[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [s, d] = await Promise.all([getDashboardStats(), getRootDecks()]);
      setStats(s);
      setDecks(d);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const progressPercent = stats
    ? Math.min(100, Math.round((stats.todayReviews / Math.max(1, stats.dailyGoal)) * 100))
    : 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: 36 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header with Greeting & Avatar */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.greeting, { color: colors.text }]}>
              {getGreeting()}, Anasxon ☀️
            </Text>
            <Text style={[styles.subGreeting, { color: colors.textSecondary }]}>
              Keep going! You're doing great.
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/settings')}
            style={[styles.avatarCircle, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
          >
            <Text style={styles.avatarLetter}>A</Text>
          </TouchableOpacity>
        </View>

        {/* 2x2 Colorful Stat Cards Grid (from reference design) */}
        <View style={styles.metricsGrid}>
          {/* 1. Total Words (Cyan / Blue tint) */}
          <View style={[styles.metricCard, { backgroundColor: colors.statBlueBg, borderColor: colors.borderLight }]}>
            <View style={styles.metricTopRow}>
              <View style={[styles.miniIconCircle, { backgroundColor: '#E0F2FE' }]}>
                <Layers size={16} color={colors.statBlue} />
              </View>
              <Text style={[styles.metricTitle, { color: colors.textSecondary }]}>
                Total Words
              </Text>
            </View>
            <Text style={[styles.metricNumber, { color: colors.statBlue }]}>
              {stats?.totalWords ?? 0}
            </Text>
          </View>

          {/* 2. Learned (Emerald Green tint) */}
          <View style={[styles.metricCard, { backgroundColor: colors.statGreenBg, borderColor: colors.borderLight }]}>
            <View style={styles.metricTopRow}>
              <View style={[styles.miniIconCircle, { backgroundColor: '#D1FAE5' }]}>
                <CheckCircle2 size={16} color={colors.statGreen} />
              </View>
              <Text style={[styles.metricTitle, { color: colors.textSecondary }]}>
                Learned
              </Text>
            </View>
            <Text style={[styles.metricNumber, { color: colors.statGreen }]}>
              {stats?.wordsLearned ?? 0}
            </Text>
          </View>

          {/* 3. Due Today (Warm Amber tint) */}
          <View style={[styles.metricCard, { backgroundColor: colors.statOrangeBg, borderColor: colors.borderLight }]}>
            <View style={styles.metricTopRow}>
              <View style={[styles.miniIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Clock size={16} color={colors.statOrange} />
              </View>
              <Text style={[styles.metricTitle, { color: colors.textSecondary }]}>
                Due Today
              </Text>
            </View>
            <Text style={[styles.metricNumber, { color: colors.statOrange }]}>
              {stats?.wordsDueToday ?? 0}
            </Text>
          </View>

          {/* 4. Streak (Flame Orange tint - Olov rang) */}
          <View style={[styles.metricCard, { backgroundColor: colors.statFlameBg, borderColor: colors.borderLight }]}>
            <View style={styles.metricTopRow}>
              <View style={[styles.miniIconCircle, { backgroundColor: '#FFEDD5' }]}>
                <Flame size={16} color={colors.primary} fill={colors.primary} />
              </View>
              <Text style={[styles.metricTitle, { color: colors.textSecondary }]}>
                Streak
              </Text>
            </View>
            <Text style={[styles.metricNumber, { color: colors.primary }]}>
              {stats?.currentStreak ?? 0} days
            </Text>
          </View>
        </View>

        {/* Today's Goal Card */}
        <Card style={styles.goalCard} variant="elevated">
          <View style={styles.goalHeaderRow}>
            <View>
              <Text style={[styles.goalTitle, { color: colors.text }]}>
                Today's Goal
              </Text>
              <Text style={[styles.goalCounter, { color: colors.textSecondary }]}>
                <Text style={{ fontWeight: '700', color: colors.text }}>
                  {stats?.todayReviews ?? 0}
                </Text>{' '}
                / {stats?.dailyGoal ?? 20} words
              </Text>
            </View>

            <View style={[styles.goalPercentBadge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.goalPercentText, { color: colors.primary }]}>
                {progressPercent}%
              </Text>
            </View>
          </View>

          {/* Progress Bar in Flame Orange */}
          <View style={[styles.progressBarTrack, { backgroundColor: colors.surface }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: colors.primary,
                  width: `${progressPercent}%`,
                },
              ]}
            />
          </View>
        </Card>

        {/* Due for Review Banner Card */}
        <Card style={styles.dueBannerCard} variant="elevated">
          <View style={styles.dueBannerContent}>
            <View style={styles.dueBannerLeft}>
              <Text style={[styles.dueBannerTitle, { color: colors.text }]}>
                Due for Review
              </Text>
              <Text style={[styles.dueBannerWords, { color: colors.primary }]}>
                {stats?.wordsDueToday ?? 0} words
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => router.push('/review/all')}
              style={[styles.startReviewBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
            >
              <BookOpen size={16} color="#FFFFFF" />
              <Text style={styles.startReviewBtnText}>Start Review</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* 7-Day Review Activity */}
        {stats && stats.recentActivity.length > 0 && (
          <Card style={styles.activityCard}>
            <View style={styles.activityHeader}>
              <TrendingUp size={18} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Review Activity
              </Text>
            </View>

            <View style={styles.chartBars}>
              {stats.recentActivity.map((item, idx) => {
                const maxCount = Math.max(
                  ...stats.recentActivity.map((a) => a.count),
                  10
                );
                const barHeight = Math.max(8, (item.count / maxCount) * 72);
                const hasReviews = item.count > 0;
                return (
                  <View key={idx} style={styles.barItem}>
                    <Text style={[styles.barCount, { color: colors.textMuted }]}>
                      {hasReviews ? item.count : ''}
                    </Text>
                    <View style={[styles.barTrack, { backgroundColor: colors.surface }]}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: barHeight,
                            backgroundColor: hasReviews ? colors.primary : colors.surface,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.barLabel, { color: colors.textSecondary }]}>
                      {item.day}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Card>
        )}

        {/* Decks Preview Header */}
        <View style={styles.decksSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Your Decks
            </Text>
            <TouchableOpacity onPress={() => router.push('/decks')}>
              <Text style={[styles.viewAllText, { color: colors.primary }]}>
                View All
              </Text>
            </TouchableOpacity>
          </View>

          {decks.slice(0, 3).map((deck) => (
            <Card
              key={deck.id}
              onPress={() => router.push(`/deck/${deck.id}`)}
              style={styles.deckItemCard}
            >
              <View style={styles.deckItemContent}>
                <View style={styles.deckItemLeft}>
                  <View
                    style={[
                      styles.deckColorDot,
                      { backgroundColor: deck.color || colors.primary },
                    ]}
                  />
                  <View style={styles.deckInfo}>
                    <Text style={[styles.deckName, { color: colors.text }]}>
                      {deck.name}
                    </Text>
                    <Text style={[styles.deckStatsLine, { color: colors.textSecondary }]}>
                      {deck.totalWords} words •{' '}
                      <Text style={{ color: colors.primary, fontWeight: '600' }}>
                        {deck.dueReviews} due
                      </Text>
                    </Text>
                  </View>
                </View>
                <ChevronRight size={18} color={colors.textMuted} />
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subGreeting: {
    fontSize: 13,
    marginTop: 3,
    fontWeight: '500',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 14,
    shadowColor: '#FF5E1E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    width: '48%',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  metricTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  miniIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  metricNumber: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  goalCard: {
    padding: 18,
    borderRadius: 20,
    marginBottom: 14,
  },
  goalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  goalCounter: {
    fontSize: 13,
    marginTop: 2,
  },
  goalPercentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  goalPercentText: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  dueBannerCard: {
    padding: 18,
    borderRadius: 20,
    marginBottom: 18,
  },
  dueBannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueBannerLeft: {},
  dueBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  dueBannerWords: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  startReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  startReviewBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  activityCard: {
    padding: 18,
    borderRadius: 20,
    marginBottom: 18,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
    paddingTop: 8,
  },
  barItem: {
    alignItems: 'center',
    flex: 1,
  },
  barCount: {
    fontSize: 10,
    fontWeight: '600',
    height: 14,
    marginBottom: 4,
  },
  barTrack: {
    width: 20,
    height: 72,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  decksSection: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '700',
  },
  deckItemCard: {
    marginBottom: 10,
    padding: 16,
    borderRadius: 16,
  },
  deckItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deckItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  deckColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  deckInfo: {
    flex: 1,
  },
  deckName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  deckStatsLine: {
    fontSize: 13,
  },
});
