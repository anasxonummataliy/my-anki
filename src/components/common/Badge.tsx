import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useThemeStore } from '@/store/themeStore';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  style,
}) => {
  const colors = useThemeStore((s) => s.getColors());

  let bg = colors.surface;
  let text = colors.textSecondary;

  switch (variant) {
    case 'primary':
      bg = colors.primaryLight;
      text = colors.primary;
      break;
    case 'success':
      bg = colors.successLight;
      text = colors.success;
      break;
    case 'warning':
      bg = colors.warningLight;
      text = colors.warning;
      break;
    case 'danger':
      bg = colors.dangerLight;
      text = colors.danger;
      break;
    case 'secondary':
      bg = colors.surface;
      text = colors.secondary;
      break;
    case 'neutral':
    default:
      bg = colors.surface;
      text = colors.textSecondary;
      break;
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
