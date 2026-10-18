import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { Stack } from 'expo-router';
import { getDb } from '@/db/client';
import { useThemeStore } from '@/store/themeStore';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const initTheme = useThemeStore((s) => s.initTheme);
  const colors = useThemeStore((s) => s.getColors());
  const isDark = useThemeStore((s) => s.isDark());

  useEffect(() => {
    async function prepare() {
      try {
        await initTheme();
        await getDb();
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setIsReady(true);
      }
    }
    prepare();
  }, []);

  if (!isReady) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="deck/[id]" options={{ headerShown: false }} />
        <Stack.Screen
          name="deck/form"
          options={{
            presentation: 'modal',
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="word/form"
          options={{
            presentation: 'modal',
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="word/[id]"
          options={{
            presentation: 'modal',
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen name="review/[deckId]" options={{ headerShown: false }} />
        <Stack.Screen name="quiz/[deckId]" options={{ headerShown: false }} />
        <Stack.Screen name="quiz/session" options={{ headerShown: false }} />
        <Stack.Screen name="quiz/summary" options={{ headerShown: false }} />
        <Stack.Screen name="backup/index" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
