import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useThemeStore, ThemeMode } from '@/store/themeStore';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { getSetting, setSetting } from '@/db/repositories/settingsRepository';
import { getDb, seedDatabase } from '@/db/client';
import { triggerHaptic } from '@/utils/haptics';
import {
  GraduationCap,
  Sun,
  Moon,
  Smartphone,
  CloudUpload,
  Database,
  Info,
  ChevronRight,
  X,
  Target,
  Check,
} from 'lucide-react-native';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeStore((s) => s.getColors());
  const mode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setThemeMode);

  const [dailyGoal, setDailyGoal] = useState('20');
  const [showLearningModal, setShowLearningModal] = useState(false);
  const [showAppearanceModal, setShowAppearanceModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  useEffect(() => {
    async function fetchGoal() {
      const g = await getSetting('daily_goal', '20');
      setDailyGoal(g);
    }
    fetchGoal();
  }, []);

  const handleGoalChange = async (delta: number) => {
    const current = parseInt(dailyGoal, 10) || 20;
    const next = Math.max(5, Math.min(100, current + delta));
    setDailyGoal(next.toString());
    triggerHaptic('light');
    await setSetting('daily_goal', next.toString());
  };

  const handleResetSeed = () => {
    Alert.alert(
      'Reset Sample Vocabulary',
      'This will reload the initial 4000 Essential English Words and IELTS decks. Any words you added will be preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Decks',
          onPress: async () => {
            try {
              triggerHaptic('medium');
              const db = await getDb();
              await seedDatabase(db);
              triggerHaptic('success');
              Alert.alert('Success', 'Vocabulary decks have been refreshed.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Could not reset decks.');
            }
          },
        },
      ]
    );
  };

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => triggerHaptic('light')}
          style={styles.profileWrapper}
        >
          <Card variant="elevated" style={styles.profileCard}>
            <View style={styles.profileLeft}>
              <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>A</Text>
              </View>
              <View style={styles.profileDetails}>
                <Text style={[styles.profileName, { color: colors.text }]}>
                  Anasxon
                </Text>
                <Text style={[styles.profileSub, { color: colors.textSecondary }]}>
                  Personal Vocabulary
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </Card>
        </TouchableOpacity>

        {/* Grouped Settings Rows */}
        <Card variant="elevated" style={styles.menuGroupCard}>
          {/* Row 1: Learning */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => {
              triggerHaptic('selection');
              setShowLearningModal(true);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.menuRowLeft}>
              <View style={[styles.rowIconCircle, { backgroundColor: colors.statFlameBg }]}>
                <GraduationCap size={20} color={colors.primary} />
              </View>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Learning</Text>
            </View>
            <ChevronRight size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: colors.borderLight }]} />

          {/* Row 2: Appearance */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => {
              triggerHaptic('selection');
              setShowAppearanceModal(true);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.menuRowLeft}>
              <View style={[styles.rowIconCircle, { backgroundColor: colors.statBlueBg }]}>
                <Sun size={20} color={colors.statBlue} />
              </View>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Appearance</Text>
            </View>
            <ChevronRight size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: colors.borderLight }]} />

          {/* Row 3: Backup & Restore */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => {
              triggerHaptic('selection');
              router.push('/backup');
            }}
            activeOpacity={0.7}
          >
            <View style={styles.menuRowLeft}>
              <View style={[styles.rowIconCircle, { backgroundColor: '#EDE9FE' }]}>
                <CloudUpload size={20} color="#7C3AED" />
              </View>
              <Text style={[styles.rowTitle, { color: colors.text }]}>
                Backup & Restore
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: colors.borderLight }]} />

          {/* Row 4: Data Management */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={handleResetSeed}
            activeOpacity={0.7}
          >
            <View style={styles.menuRowLeft}>
              <View style={[styles.rowIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Database size={20} color="#D97706" />
              </View>
              <Text style={[styles.rowTitle, { color: colors.text }]}>
                Data Management
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: colors.borderLight }]} />

          {/* Row 5: About */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => {
              triggerHaptic('selection');
              setShowAboutModal(true);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.menuRowLeft}>
              <View style={[styles.rowIconCircle, { backgroundColor: '#E0F2FE' }]}>
                <Info size={20} color="#0284C7" />
              </View>
              <Text style={[styles.rowTitle, { color: colors.text }]}>About</Text>
            </View>
            <ChevronRight size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </Card>
      </ScrollView>

      {/* Learning Modal */}
      <Modal
        visible={showLearningModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLearningModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Daily Review Target
              </Text>
              <TouchableOpacity onPress={() => setShowLearningModal(false)}>
                <X size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
              Set the number of cards you aim to review every day.
            </Text>

            <View style={styles.stepperContainer}>
              <TouchableOpacity
                onPress={() => handleGoalChange(-5)}
                style={[styles.stepperBtn, { backgroundColor: colors.surface }]}
              >
                <Text style={[styles.stepperSign, { color: colors.text }]}>-</Text>
              </TouchableOpacity>
              <Text style={[styles.stepperValue, { color: colors.text }]}>
                {dailyGoal} cards
              </Text>
              <TouchableOpacity
                onPress={() => handleGoalChange(5)}
                style={[styles.stepperBtn, { backgroundColor: colors.surface }]}
              >
                <Text style={[styles.stepperSign, { color: colors.text }]}>+</Text>
              </TouchableOpacity>
            </View>

            <Button
              title="Done"
              onPress={() => setShowLearningModal(false)}
              variant="primary"
              size="md"
              style={{ marginTop: 20 }}
            />
          </View>
        </View>
      </Modal>

      {/* Appearance Modal */}
      <Modal
        visible={showAppearanceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAppearanceModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Appearance Theme
              </Text>
              <TouchableOpacity onPress={() => setShowAppearanceModal(false)}>
                <X size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.themeOptionsStack}>
              {(['light', 'dark', 'system'] as ThemeMode[]).map((m) => {
                const isSelected = mode === m;
                const label =
                  m === 'light' ? 'Light Theme' : m === 'dark' ? 'Dark Theme' : 'System Default';
                const IconComp = m === 'light' ? Sun : m === 'dark' ? Moon : Smartphone;

                return (
                  <TouchableOpacity
                    key={m}
                    onPress={() => {
                      triggerHaptic('selection');
                      setThemeMode(m);
                    }}
                    style={[
                      styles.themeRowOption,
                      {
                        backgroundColor: isSelected ? colors.primaryLight : colors.surface,
                        borderColor: isSelected ? colors.primary : 'transparent',
                      },
                    ]}
                  >
                    <View style={styles.themeRowLeft}>
                      <IconComp
                        size={20}
                        color={isSelected ? colors.primary : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.themeOptionLabel,
                          {
                            color: isSelected ? colors.primary : colors.text,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {label}
                      </Text>
                    </View>
                    {isSelected && <Check size={18} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Button
              title="Close"
              onPress={() => setShowAppearanceModal(false)}
              variant="secondary"
              size="md"
              style={{ marginTop: 18 }}
            />
          </View>
        </View>
      </Modal>

      {/* About Modal */}
      <Modal
        visible={showAboutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAboutModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                About My Vocabulary
              </Text>
              <TouchableOpacity onPress={() => setShowAboutModal(false)}>
                <X size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
              • <Text style={{ fontWeight: '700', color: colors.text }}>FSRS Algorithm:</Text> Free Spaced Repetition Scheduler predicts memory retention and optimizes repetition intervals.
            </Text>
            <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
              • <Text style={{ fontWeight: '700', color: colors.text }}>100% Local SQLite:</Text> Zero cloud accounts, zero analytics trackers, and zero third-party dependencies.
            </Text>
            <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
              • <Text style={{ fontWeight: '700', color: colors.text }}>Flame Orange Edition:</Text> Crafted with modern aesthetics for high-focus personal learning.
            </Text>

            <Button
              title="Close"
              onPress={() => setShowAboutModal(false)}
              variant="primary"
              size="md"
              style={{ marginTop: 20 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  profileWrapper: {
    marginBottom: 20,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: 22,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  profileDetails: {},
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  profileSub: {
    fontSize: 13,
    fontWeight: '500',
  },
  menuGroupCard: {
    borderRadius: 22,
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  rowIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 50,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginVertical: 10,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperSign: {
    fontSize: 24,
    fontWeight: '700',
  },
  stepperValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  themeOptionsStack: {
    gap: 10,
    marginTop: 8,
  },
  themeRowOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  themeRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeOptionLabel: {
    fontSize: 15,
  },
  aboutText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
  },
});
