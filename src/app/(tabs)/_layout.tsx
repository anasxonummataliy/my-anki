import React from 'react';
import { Tabs } from 'expo-router';
import { useThemeStore } from '@/store/themeStore';
import { Home, Layers, BookOpen, BarChart3, Settings } from 'lucide-react-native';
import { Platform } from 'react-native';

export default function TabsLayout() {
  const colors = useThemeStore((s) => s.getColors());

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
        },
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="decks"
        options={{
          title: 'Decks',
          tabBarIcon: ({ color, size }) => <Layers size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="study"
        options={{
          title: 'Study',
          tabBarIcon: ({ color, size }) => <BookOpen size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Statistics',
          tabBarIcon: ({ color, size }) => <BarChart3 size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size || 22} color={color} />,
        }}
      />
    </Tabs>
  );
}
