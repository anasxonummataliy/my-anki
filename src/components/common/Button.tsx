import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useThemeStore } from '@/store/themeStore';
import { triggerHaptic } from '@/utils/haptics';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const colors = useThemeStore((s) => s.getColors());

  const handlePress = () => {
    if (disabled || loading) return;
    triggerHaptic('light');
    onPress();
  };

  let backgroundColor = colors.primary;
  let textColor = '#FFFFFF';
  let borderWidth = 0;
  let borderColor = 'transparent';

  switch (variant) {
    case 'secondary':
      backgroundColor = colors.surface;
      textColor = colors.text;
      break;
    case 'danger':
      backgroundColor = colors.danger;
      textColor = '#FFFFFF';
      break;
    case 'outline':
      backgroundColor = 'transparent';
      textColor = colors.primary;
      borderWidth = 1.5;
      borderColor = colors.primary;
      break;
    case 'ghost':
      backgroundColor = 'transparent';
      textColor = colors.textSecondary;
      break;
    case 'primary':
    default:
      backgroundColor = colors.primary;
      textColor = '#FFFFFF';
      break;
  }

  let height = 48;
  let fontSize = 16;
  let paddingHorizontal = 20;

  if (size === 'sm') {
    height = 36;
    fontSize = 14;
    paddingHorizontal = 12;
  } else if (size === 'lg') {
    height = 54;
    fontSize = 18;
    paddingHorizontal = 24;
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[
        styles.button,
        {
          backgroundColor,
          height,
          paddingHorizontal,
          borderWidth,
          borderColor,
          opacity: disabled ? 0.45 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon ? <>{icon}</> : null}
          <Text
            style={[
              styles.text,
              {
                color: textColor,
                fontSize,
                marginLeft: icon ? 8 : 0,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
