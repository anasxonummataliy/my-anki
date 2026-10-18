import React from 'react';
import { TouchableOpacity, View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useThemeStore } from '@/store/themeStore';
import { triggerHaptic } from '@/utils/haptics';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'outlined';
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  variant = 'default',
}) => {
  const colors = useThemeStore((s) => s.getColors());
  const isDark = useThemeStore((s) => s.isDark());

  const cardStyle: ViewStyle = {
    backgroundColor: variant === 'elevated' ? colors.elevated : colors.card,
    borderColor: colors.border,
    borderWidth: variant === 'outlined' || !isDark ? 1 : 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: isDark ? 2 : 4 },
    shadowOpacity: isDark ? 0.3 : 0.06,
    shadowRadius: isDark ? 4 : 12,
    elevation: isDark ? 2 : 3,
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={() => {
          triggerHaptic('light');
          onPress();
        }}
        activeOpacity={0.7}
        style={[styles.container, cardStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.container, cardStyle, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    padding: 16,
  },
});
