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
import { useFocusEffect } from 'expo-router';
import { useThemeStore } from '@/store/themeStore';
import { getDashboardStats, DashboardStats } from '@/services/statsService';
import { getDb } from '@/db/client';
import { Card } from '@/components/common/Card';
import { triggerHaptic } from '@/utils/haptics';
import {
  Flame,
  Target,
  Award,
  CheckCircle,
  HelpCircle,
  Clock,
  Layers,
  Activity,
  Zap,
} from 'lucide-react-native';

interface RatingBreakdown {
  again: number;
  hard: number;
  good: number;
  easy: number;
  total: number;
}

type TabType = 'Overview' | 'Learning' | 'Quiz';

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeStore((s) => s.getColors());
  const [activeTab, setActiveTab] = useState<TabType>('Overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [ratings, setRatings] = useState<RatingBreakdown>({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
    total: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const [s, db] = await Promise.all([getDashboardStats(), getDb()]);
      setStats(s);

      // Ratings breakdown from review_logs
      const rows = await db.getAllAsync<{ rating: number; count: number }>(
        `SELECT rating, COUNT(*) as count FROM review_logs GROUP BY rating;`
      );

      let again = 0;
      let hard = 0;
      let good = 0;
      let easy = 0;
      let total = 0;

      rows.forEach((r) => {
        total += r.count;
        if (r.rating === 1) again = r.count;
        if (r.rating === 2) hard = r.count;
        if (r.rating === 3) good = r.count;
        if (r.rating === 4) easy = r.count;
      });

      setRatings({ again, hard, good, easy, total });
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const getPercent = (count: number) => {
    if (ratings.total === 0) return 0;
    return Math.round((count / ratings.total) * 100);
  };

  const learnedPercent =
    stats && stats.totalWords > 0
      ? Math.round((stats.wordsLearned / stats.totalWords) * 100)
      : 0;

  // Days for 7-day activity chart
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxActivity = Math.max(
    ...(stats?.recentActivity.map((a) => a.count) || [1]),
    20
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 12,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.text }]}>Statistics</Text>

        {/* Segmented Control Tabs */}
        <View style={[styles.tabBar, { backgroundColor: colors.surface }]}>
          {(['Overview', 'Learning', 'Quiz'] as TabType[]).map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => {
                  triggerHaptic('selection');
                  setActiveTab(tab);
                }}
                style={[
                  styles.tabItem,
                  isSelected && [
                    styles.tabItemActive,
                    { backgroundColor: colors.card, shadowColor: '#000' },
                  ],
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: isSelected ? colors.text : colors.textSecondary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {activeTab === 'Overview' && (
          <>
            {/* Section: Your Progress */}
            <Text style={[styles.sectionHeading, { color: colors.text }]}>
              Your Progress
            </Text>

            <Card variant="elevated" style={styles.progressHeroCard}>
              <View style={styles.progressHeroRow}>
                {/* Circular Mini Ring */}
                <View
                  style={[
                    styles.miniRing,
                    { borderColor: colors.primary, backgroundColor: colors.surface },
                  ]}
                >
                  <Text style={[styles.miniRingPercent, { color: colors.text }]}>
                    {learnedPercent}%
                  </Text>
                </View>

                {/* Right stats */}
                <View style={styles.progressInfo}>
                  <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
                    Learned
                  </Text>
                  <Text style={[styles.progressNumbers, { color: colors.text }]}>
                    {stats?.wordsLearned ?? 0}{' '}
                    <Text style={{ color: colors.textSecondary, fontWeight: '500' }}>
                      / {stats?.totalWords ?? 0}
                    </Text>
                  </Text>
                </View>
              </View>
            </Card>

            {/* Two Side-by-side Pills */}
            <View style={styles.twoPillsRow}>
              {/* Left Pill: Today's Goal */}
              <Card variant="elevated" style={styles.pillCard}>
                <View style={styles.pillIconRow}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: colors.statBlueBg },
                    ]}
                  >
                    <Target size={18} color={colors.statBlue} />
                  </View>
                  <Text style={[styles.pillTitle, { color: colors.textSecondary }]}>
                    {"Today's Goal"}
                  </Text>
                </View>
                <Text style={[styles.pillValue, { color: colors.text }]}>
                  {stats?.todayReviews ?? 0} / {stats?.dailyGoal ?? 20}
                </Text>
              </Card>

              {/* Right Pill: Current Streak */}
              <Card variant="elevated" style={styles.pillCard}>
                <View style={styles.pillIconRow}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: colors.statOrangeBg },
                    ]}
                  >
                    <Flame size={18} color={colors.statOrange} fill={colors.statOrange} />
                  </View>
                  <Text style={[styles.pillTitle, { color: colors.textSecondary }]}>
                    Current Streak
                  </Text>
                </View>
                <Text style={[styles.pillValue, { color: colors.text }]}>
                  {stats?.currentStreak ?? 0} days
                </Text>
              </Card>
            </View>

            {/* Section: Review Activity */}
            <Text style={[styles.sectionHeading, { color: colors.text }]}>
              Review Activity
            </Text>

            <Card variant="elevated" style={styles.chartCard}>
              <View style={styles.chartContent}>
                {/* Y-Axis labels */}
                <View style={styles.yAxis}>
                  <Text style={[styles.axisLabel, { color: colors.textSecondary }]}>30</Text>
                  <Text style={[styles.axisLabel, { color: colors.textSecondary }]}>20</Text>
                  <Text style={[styles.axisLabel, { color: colors.textSecondary }]}>10</Text>
                  <Text style={[styles.axisLabel, { color: colors.textSecondary }]}>0</Text>
                </View>

                {/* Bars Area */}
                <View style={styles.barsContainer}>
                  {weekDays.map((dayName, idx) => {
                    const activity = stats?.recentActivity[idx];
                    const count = activity?.count ?? 0;
                    const heightPercent = Math.min(
                      100,
                      Math.max(12, (count / maxActivity) * 100)
                    );
                    const isToday = idx === 6;

                    return (
                      <View key={dayName} style={styles.barColumn}>
                        <View style={styles.barTrack}>
                          <View
                            style={[
                              styles.barFill,
                              {
                                height: `${heightPercent}%`,
                                backgroundColor: isToday
                                  ? colors.primary
                                  : colors.primaryLight,
                              },
                            ]}
                          />
                        </View>
                        <Text
                          style={[
                            styles.barDayText,
                            {
                              color: isToday ? colors.primary : colors.textSecondary,
                              fontWeight: isToday ? '700' : '500',
                            },
                          ]}
                        >
                          {dayName}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </Card>
          </>
        )}

        {activeTab === 'Learning' && (
          <>
            {/* FSRS Rating Distribution */}
            <Text style={[styles.sectionHeading, { color: colors.text }]}>
              FSRS Distribution
            </Text>

            <Card variant="elevated" style={styles.sectionCard}>
              <View style={styles.cardHeaderRow}>
                <Activity size={18} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  Review Breakdown
                </Text>
              </View>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Total of {ratings.total} card reviews recorded
              </Text>

              {/* Stacked Progress Bar */}
              <View style={[styles.stackedBar, { backgroundColor: colors.surface }]}>
                {ratings.total > 0 ? (
                  <>
                    <View
                      style={{
                        flex: ratings.again,
                        backgroundColor: colors.again,
                      }}
                    />
                    <View
                      style={{
                        flex: ratings.hard,
                        backgroundColor: colors.hard,
                      }}
                    />
                    <View
                      style={{
                        flex: ratings.good,
                        backgroundColor: colors.good,
                      }}
                    />
                    <View
                      style={{
                        flex: ratings.easy,
                        backgroundColor: colors.easy,
                      }}
                    />
                  </>
                ) : (
                  <View style={{ flex: 1, backgroundColor: colors.surface }} />
                )}
              </View>

              {/* Legend Items */}
              <View style={styles.legendGrid}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.again }]} />
                  <View>
                    <Text style={[styles.legendName, { color: colors.text }]}>Again</Text>
                    <Text style={[styles.legendValue, { color: colors.textSecondary }]}>
                      {ratings.again} ({getPercent(ratings.again)}%)
                    </Text>
                  </View>
                </View>

                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.hard }]} />
                  <View>
                    <Text style={[styles.legendName, { color: colors.text }]}>Hard</Text>
                    <Text style={[styles.legendValue, { color: colors.textSecondary }]}>
                      {ratings.hard} ({getPercent(ratings.hard)}%)
                    </Text>
                  </View>
                </View>

                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.good }]} />
                  <View>
                    <Text style={[styles.legendName, { color: colors.text }]}>Good</Text>
                    <Text style={[styles.legendValue, { color: colors.textSecondary }]}>
                      {ratings.good} ({getPercent(ratings.good)}%)
                    </Text>
                  </View>
                </View>

                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.easy }]} />
                  <View>
                    <Text style={[styles.legendName, { color: colors.text }]}>Easy</Text>
                    <Text style={[styles.legendValue, { color: colors.textSecondary }]}>
                      {ratings.easy} ({getPercent(ratings.easy)}%)
                    </Text>
                  </View>
                </View>
              </View>
            </Card>

            {/* Learning Totals Breakdown */}
            <Text style={[styles.sectionHeading, { color: colors.text }]}>
              Memory Status
            </Text>

            <Card variant="elevated" style={styles.sectionCard}>
              <View style={styles.metricRow}>
                <View style={styles.metricLeft}>
                  <Layers size={18} color={colors.primary} />
                  <Text style={[styles.metricName, { color: colors.text }]}>
                    Total Vocabulary
                  </Text>
                </View>
                <Text style={[styles.metricCount, { color: colors.text }]}>
                  {stats?.totalWords ?? 0}
                </Text>
              </View>

              <View style={styles.metricRow}>
                <View style={styles.metricLeft}>
                  <CheckCircle size={18} color={colors.success} />
                  <Text style={[styles.metricName, { color: colors.text }]}>
                    Learned Words (Mature)
                  </Text>
                </View>
                <Text style={[styles.metricCount, { color: colors.success }]}>
                  {stats?.wordsLearned ?? 0}
                </Text>
              </View>

              <View style={[styles.metricRow, { borderBottomWidth: 0 }]}>
                <View style={styles.metricLeft}>
                  <Clock size={18} color={colors.warning} />
                  <Text style={[styles.metricName, { color: colors.text }]}>
                    Due For Review Today
                  </Text>
                </View>
                <Text style={[styles.metricCount, { color: colors.warning }]}>
                  {stats?.wordsDueToday ?? 0}
                </Text>
              </View>
            </Card>
          </>
        )}

        {activeTab === 'Quiz' && (
          <>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>
              Quiz Performance
            </Text>

            <View style={styles.twoPillsRow}>
              <Card variant="elevated" style={styles.pillCard}>
                <Award size={26} color={colors.primary} />
                <Text style={[styles.pillValue, { color: colors.text, marginTop: 8 }]}>
                  {stats?.quizAccuracy ?? 0}%
                </Text>
                <Text style={[styles.pillTitle, { color: colors.textSecondary }]}>
                  Average Accuracy
                </Text>
              </Card>

              <Card variant="elevated" style={styles.pillCard}>
                <Zap size={26} color={colors.statOrange} />
                <Text style={[styles.pillValue, { color: colors.text, marginTop: 8 }]}>
                  {stats?.retentionRate ?? 100}%
                </Text>
                <Text style={[styles.pillTitle, { color: colors.textSecondary }]}>
                  Retention Rate
                </Text>
              </Card>
            </View>
          </>
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
    paddingHorizontal: 20,
    paddingBottom: 14,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginBottom: 16,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemActive: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
  },
  scrollContent: {
    padding: 20,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
  },
  progressHeroCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 14,
  },
  progressHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  miniRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniRingPercent: {
    fontSize: 20,
    fontWeight: '800',
  },
  progressInfo: {
    flex: 1,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  progressNumbers: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  twoPillsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  pillCard: {
    flex: 1,
    padding: 16,
    borderRadius: 18,
  },
  pillIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  pillValue: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  chartCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  chartContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 140,
  },
  yAxis: {
    height: '100%',
    justifyContent: 'space-between',
    paddingRight: 12,
    paddingBottom: 22,
  },
  axisLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  barTrack: {
    flex: 1,
    width: 14,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  barFill: {
    width: '100%',
    borderRadius: 7,
  },
  barDayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionCard: {
    padding: 18,
    borderRadius: 20,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  stackedBar: {
    height: 14,
    borderRadius: 7,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 20,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 14,
  },
  legendItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendName: {
    fontSize: 14,
    fontWeight: '600',
  },
  legendValue: {
    fontSize: 12,
    marginTop: 1,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  metricLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metricName: {
    fontSize: 15,
    fontWeight: '600',
  },
  metricCount: {
    fontSize: 16,
    fontWeight: '700',
  },
});
