export const Colors = {
  light: {
    // Flame Orange Brand Theme ("Olov rang")
    primary: '#FF5E1E', // Vibrant Flame Orange
    primaryLight: '#FFF2EB', // Soft Warm Flame Tint
    primaryDark: '#E04706',
    flame: '#FF5722',
    ember: '#FF9800',
    secondary: '#0EA5E9', // Sky Blue
    accent: '#8B5CF6',

    // Dashboard Stat Cards Accents (from reference design)
    statBlue: '#0284C7',
    statBlueBg: '#F0F9FF',
    statGreen: '#059669',
    statGreenBg: '#ECFDF5',
    statOrange: '#D97706',
    statOrangeBg: '#FFFBEB',
    statFlame: '#EA580C',
    statFlameBg: '#FFF7ED',
    
    // Status
    success: '#10B981',
    successLight: '#ECFDF5',
    warning: '#F59E0B',
    warningLight: '#FFFBEB',
    danger: '#EF4444',
    dangerLight: '#FEF2F2',
    info: '#3B82F6',

    // FSRS Rating Colors (matching the 4 colored buttons in the reference)
    again: '#EF4444', // Red
    hard: '#F59E0B',  // Warm Orange
    good: '#10B981',  // Green
    easy: '#3B82F6',  // Blue

    // Backgrounds
    background: '#F9FAFB',
    card: '#FFFFFF',
    elevated: '#FFFFFF',
    surface: '#F3F4F6',
    subtle: '#E5E7EB',

    // Text
    text: '#111827',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    textInverse: '#FFFFFF',

    // Borders & Dividers
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    separator: '#E5E7EB',

    // Tab bar
    tabBar: '#FFFFFF',
    tabBarBorder: '#E5E7EB',
    tabBarActive: '#FF5E1E',
    tabBarInactive: '#9CA3AF',
  },
  dark: {
    // Flame Orange Brand Theme for Dark Mode
    primary: '#FF6B35', // Luminous Flame Orange
    primaryLight: '#321406',
    primaryDark: '#FF8A50',
    flame: '#FF6B35',
    ember: '#FFA726',
    secondary: '#38BDF8',
    accent: '#A78BFA',

    // Dashboard Stat Cards Accents
    statBlue: '#38BDF8',
    statBlueBg: '#082F49',
    statGreen: '#34D399',
    statGreenBg: '#064E3B',
    statOrange: '#FBBF24',
    statOrangeBg: '#451A03',
    statFlame: '#FB923C',
    statFlameBg: '#431407',

    // Status
    success: '#34D399',
    successLight: '#064E3B',
    warning: '#FBBF24',
    warningLight: '#451A03',
    danger: '#F87171',
    dangerLight: '#450A0A',
    info: '#60A5FA',

    // FSRS Rating Colors
    again: '#EF4444',
    hard: '#F59E0B',
    good: '#10B981',
    easy: '#3B82F6',

    // Backgrounds
    background: '#0B0F19',
    card: '#131B2E',
    elevated: '#1E293B',
    surface: '#182235',
    subtle: '#334155',

    // Text
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    textMuted: '#6B7280',
    textInverse: '#0B0F19',

    // Borders & Dividers
    border: '#1F2937',
    borderLight: '#131B2E',
    separator: '#1F2937',

    // Tab bar
    tabBar: '#0E1524',
    tabBarBorder: '#1F2937',
    tabBarActive: '#FF6B35',
    tabBarInactive: '#6B7280',
  },
};

export type ThemeColors = typeof Colors.light;
