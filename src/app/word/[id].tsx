import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '@/store/themeStore';
import { getWordById, deleteWord } from '@/db/repositories/wordRepository';
import { WordWithReview } from '@/types/word';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Header } from '@/components/common/Header';
import { formatDate, formatTime } from '@/utils/date';
import { triggerHaptic } from '@/utils/haptics';
import { Edit3, Trash2, Cpu, Calendar, RotateCcw } from 'lucide-react-native';

export default function WordDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colors = useThemeStore((s) => s.getColors());

  const [word, setWord] = useState<WordWithReview | null>(null);

  const loadWord = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getWordById(id);
      setWord(data);
    } catch (err) {
      console.error('Error loading word:', err);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadWord();
    }, [loadWord])
  );

  const handleDelete = () => {
    if (!word) return;
    triggerHaptic('warning');
    Alert.alert('Delete Word', `Are you sure you want to delete "${word.word}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteWord(word.id);
          triggerHaptic('success');
          router.back();
        },
      },
    ]);
  };

  const getStateName = (state?: number) => {
    switch (state) {
      case 1:
        return 'Learning';
      case 2:
        return 'Review (Mature)';
      case 3:
        return 'Relearning';
      case 0:
      default:
        return 'New';
    }
  };

  if (!word) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Header
        title="Word Details"
        showBack
        onBack={() => router.back()}
        rightAction={
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/word/form',
                  params: { wordId: word.id },
                })
              }
              style={styles.iconBtn}
            >
              <Edit3 size={18} color={colors.text} />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleDelete} style={styles.iconBtn}>
              <Trash2 size={18} color={colors.danger} />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Word Card */}
        <Card variant="elevated" style={styles.mainCard}>
          <View style={styles.wordHeader}>
            {word.partOfSpeech ? (
              <Badge label={word.partOfSpeech} variant="primary" />
            ) : <View />}
            <Badge label={getStateName(word.state)} variant="secondary" />
          </View>

          <Text style={[styles.wordTitle, { color: colors.text }]}>{word.word}</Text>
          <Text style={[styles.translationTitle, { color: colors.primary }]}>
            {word.translation}
          </Text>

          {word.definition ? (
            <View style={styles.sectionBlock}>
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
                DEFINITION
              </Text>
              <Text style={[styles.bodyText, { color: colors.text }]}>
                {word.definition}
              </Text>
            </View>
          ) : null}

          {word.example ? (
            <View style={[styles.exampleBox, { backgroundColor: colors.surface }]}>
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
                EXAMPLE SENTENCE
              </Text>
              <Text style={[styles.exampleText, { color: colors.text }]}>
                {`"${word.example}"`}
              </Text>
            </View>
          ) : null}

          {word.notes ? (
            <View style={styles.sectionBlock}>
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
                NOTES
              </Text>
              <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
                {word.notes}
              </Text>
            </View>
          ) : null}
        </Card>

        {/* FSRS Scheduling Metrics Card */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          FSRS SCHEDULING METRICS
        </Text>
        <Card style={styles.metricsCard}>
          <View style={styles.metricRow}>
            <View style={styles.metricLeft}>
              <Cpu size={16} color={colors.primary} />
              <Text style={[styles.metricLabel, { color: colors.text }]}>
                Stability (Days)
              </Text>
            </View>
            <Text style={[styles.metricVal, { color: colors.text }]}>
              {word.stability ? word.stability.toFixed(2) : '0.00'}
            </Text>
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricLeft}>
              <Cpu size={16} color={colors.warning} />
              <Text style={[styles.metricLabel, { color: colors.text }]}>
                Difficulty
              </Text>
            </View>
            <Text style={[styles.metricVal, { color: colors.text }]}>
              {word.difficulty ? word.difficulty.toFixed(2) : '0.00'}
            </Text>
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricLeft}>
              <RotateCcw size={16} color={colors.secondary} />
              <Text style={[styles.metricLabel, { color: colors.text }]}>
                Total Reps / Lapses
              </Text>
            </View>
            <Text style={[styles.metricVal, { color: colors.text }]}>
              {word.reps ?? 0} reps • {word.lapses ?? 0} lapses
            </Text>
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricLeft}>
              <Calendar size={16} color={colors.accent} />
              <Text style={[styles.metricLabel, { color: colors.text }]}>
                Next Due Date
              </Text>
            </View>
            <Text style={[styles.metricVal, { color: colors.text }]}>
              {word.due ? formatDate(word.due) : 'Immediately'}
            </Text>
          </View>

          <View style={[styles.metricRow, { borderBottomWidth: 0 }]}>
            <View style={styles.metricLeft}>
              <Calendar size={16} color={colors.textMuted} />
              <Text style={[styles.metricLabel, { color: colors.text }]}>
                Last Reviewed
              </Text>
            </View>
            <Text style={[styles.metricVal, { color: colors.textSecondary }]}>
              {word.lastReview ? `${formatDate(word.lastReview)} ${formatTime(word.lastReview)}` : 'Never'}
            </Text>
          </View>
        </Card>
      </ScrollView>
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
  scrollContent: {
    padding: 20,
  },
  mainCard: {
    padding: 22,
    borderRadius: 22,
    marginBottom: 20,
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  wordTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  translationTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  sectionBlock: {
    marginTop: 14,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
  },
  exampleBox: {
    padding: 14,
    borderRadius: 14,
    marginTop: 14,
  },
  exampleText: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  metricsCard: {
    padding: 16,
    borderRadius: 18,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  metricLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '700',
  },
});
