import { create } from 'zustand';
import { Appearance } from 'react-native';
import { Colors, ThemeColors } from '@/constants/colors';
import { getSetting, setSetting } from '@/db/repositories/settingsRepository';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  systemColorScheme: 'light' | 'dark';
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  initTheme: () => Promise<void>;
  getColors: () => ThemeColors;
  isDark: () => boolean;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'system',
  systemColorScheme: Appearance.getColorScheme() === 'dark' ? 'dark' : 'light',

  initTheme: async () => {
    try {
      const saved = await getSetting('theme_mode', 'system');
      const system = Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
      set({
        mode: (saved as ThemeMode) || 'system',
        systemColorScheme: system,
      });

      Appearance.addChangeListener(({ colorScheme }) => {
        set({ systemColorScheme: colorScheme === 'dark' ? 'dark' : 'light' });
      });
    } catch {
      // Fallback
    }
  },

  setThemeMode: async (mode: ThemeMode) => {
    set({ mode });
    try {
      await setSetting('theme_mode', mode);
    } catch {
      // Fallback
    }
  },

  isDark: () => {
    const { mode, systemColorScheme } = get();
    if (mode === 'system') return systemColorScheme === 'dark';
    return mode === 'dark';
  },

  getColors: () => {
    return get().isDark() ? Colors.dark : Colors.light;
  },
}));
