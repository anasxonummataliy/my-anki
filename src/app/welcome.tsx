import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '@/store/themeStore';
import { Button } from '@/components/common/Button';
import { setSetting } from '@/db/repositories/settingsRepository';
import { triggerHaptic } from '@/utils/haptics';
import { Flame, Sparkles, BookOpen } from 'lucide-react-native';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeStore((s) => s.getColors());

  const handleGetStarted = async () => {
    triggerHaptic('medium');
    await setSetting('has_seen_welcome', 'true');
    router.replace('/(tabs)');
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 40,
          paddingBottom: insets.bottom + 24,
        },
      ]}
    >
      {/* Center Hero */}
      <View style={styles.centerHero}>
        {/* Flame Stack Illustration */}
        <View style={styles.cardStack}>
          <View style={[styles.cardLayer3, { backgroundColor: colors.statOrangeBg, borderColor: colors.border }]} />
          <View style={[styles.cardLayer2, { backgroundColor: colors.statFlameBg, borderColor: colors.border }]} />
          <View style={[styles.cardMain, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.flameCircle, { backgroundColor: colors.primaryLight }]}>
              <Flame size={48} color={colors.primary} fill={colors.primary} />
            </View>
          </View>
        </View>

        {/* Title & Tagline */}
        <Text style={[styles.title, { color: colors.text }]}>My Vocabulary</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Learn smarter, {'\n'}Remember longer.
        </Text>

        <View style={[styles.pillBadge, { backgroundColor: colors.primaryLight }]}>
          <Sparkles size={14} color={colors.primary} />
          <Text style={[styles.pillText, { color: colors.primary }]}>
            Powered by FSRS Spaced Repetition
          </Text>
        </View>
      </View>

      {/* Bottom Button */}
      <View style={styles.bottomArea}>
        <Button
          title="Get Started"
          onPress={handleGetStarted}
          size="lg"
          variant="primary"
          style={styles.getStartedBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  centerHero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardStack: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 36,
  },
  cardLayer3: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 24,
    transform: [{ rotate: '-12deg' }],
    borderWidth: 1.5,
    opacity: 0.8,
  },
  cardLayer2: {
    position: 'absolute',
    width: 115,
    height: 115,
    borderRadius: 24,
    transform: [{ rotate: '8deg' }],
    borderWidth: 1.5,
    opacity: 0.9,
  },
  cardMain: {
    width: 120,
    height: 120,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: '#FF5E1E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  flameCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.6,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '500',
    marginBottom: 20,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bottomArea: {
    paddingBottom: 8,
  },
  getStartedBtn: {
    width: '100%',
    height: 56,
    borderRadius: 16,
  },
});
