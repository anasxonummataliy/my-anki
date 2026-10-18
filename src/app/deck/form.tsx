import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useThemeStore } from '@/store/themeStore';
import {
  createDeck,
  updateDeck,
  getDeckById,
  getAllDecks,
} from '@/db/repositories/deckRepository';
import { DeckWithStats } from '@/types/deck';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Header } from '@/components/common/Header';
import { triggerHaptic } from '@/utils/haptics';
import { Check } from 'lucide-react-native';

const DeckSchema = z.object({
  name: z.string().min(1, 'Deck name is required').max(60, 'Name too long'),
  description: z.string().max(200, 'Description too long').optional(),
});

type DeckFormData = z.infer<typeof DeckSchema>;

const COLOR_PRESETS = [
  '#FF5E1E', // Flame Orange (Primary)
  '#0EA5E9', // Sky Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#64748B', // Slate
];

export default function DeckFormScreen() {
  const { deckId } = useLocalSearchParams<{ deckId?: string }>();
  const insets = useSafeAreaInsets();
  const colors = useThemeStore((s) => s.getColors());

  const [availableDecks, setAvailableDecks] = useState<DeckWithStats[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>(COLOR_PRESETS[0]);
  const [includeSubdecks, setIncludeSubdecks] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DeckFormData>({
    resolver: zodResolver(DeckSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  useEffect(() => {
    async function loadInitial() {
      const all = await getAllDecks();
      setAvailableDecks(all.filter((d) => d.id !== deckId));

      if (deckId) {
        const existing = await getDeckById(deckId);
        if (existing) {
          setValue('name', existing.name);
          setValue('description', existing.description || '');
          setSelectedParentId(existing.parentId || null);
          if (existing.color) setSelectedColor(existing.color);
        }
      }
    }
    loadInitial();
  }, [deckId, setValue]);

  const onSubmit = async (data: DeckFormData) => {
    setLoading(true);
    triggerHaptic('medium');
    try {
      if (deckId) {
        await updateDeck({
          id: deckId,
          name: data.name,
          description: data.description || null,
          parentId: selectedParentId,
          color: selectedColor,
        });
      } else {
        await createDeck({
          name: data.name,
          description: data.description || null,
          parentId: selectedParentId,
          color: selectedColor,
        });
      }
      triggerHaptic('success');
      router.back();
    } catch (err) {
      console.error('Error saving deck:', err);
      triggerHaptic('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
    >
      <Header
        title={deckId ? 'Edit Deck' : 'Add Deck'}
        showBack
        onBack={() => router.back()}
        rightAction={
          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            disabled={loading || isSubmitting}
            style={[styles.saveHeaderBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
          >
            <Text style={styles.saveHeaderBtnText}>Save</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Name input */}
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Deck Name *"
              placeholder="e.g. 4000 Essential English Words"
              value={value}
              onChangeText={onChange}
              error={errors.name?.message}
            />
          )}
        />

        {/* Parent Deck Association */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            PARENT DECK (OPTIONAL)
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.parentPills}
          >
            <TouchableOpacity
              onPress={() => {
                triggerHaptic('selection');
                setSelectedParentId(null);
              }}
              style={[
                styles.parentPill,
                {
                  backgroundColor:
                    selectedParentId === null ? colors.primaryLight : colors.surface,
                  borderColor:
                    selectedParentId === null ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.parentPillText,
                  {
                    color:
                      selectedParentId === null ? colors.primary : colors.text,
                  },
                ]}
              >
                None (Top Deck)
              </Text>
            </TouchableOpacity>

            {availableDecks.map((d) => (
              <TouchableOpacity
                key={d.id}
                onPress={() => {
                  triggerHaptic('selection');
                  setSelectedParentId(d.id);
                }}
                style={[
                  styles.parentPill,
                  {
                    backgroundColor:
                      selectedParentId === d.id ? colors.primaryLight : colors.surface,
                    borderColor:
                      selectedParentId === d.id ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.parentPillText,
                    {
                      color:
                        selectedParentId === d.id ? colors.primary : colors.text,
                    },
                  ]}
                >
                  {d.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Description input */}
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Description (Optional)"
              placeholder="e.g. Complete vocabulary list for English learners"
              value={value}
              onChangeText={onChange}
              error={errors.description?.message}
              multiline
              numberOfLines={3}
              style={styles.multilineInput}
            />
          )}
        />

        {/* Color Presets */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            COLOR ACCENT
          </Text>
          <View style={styles.colorRow}>
            {COLOR_PRESETS.map((color) => {
              const isSelected = selectedColor === color;
              return (
                <TouchableOpacity
                  key={color}
                  onPress={() => {
                    triggerHaptic('selection');
                    setSelectedColor(color);
                  }}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: color },
                    isSelected && styles.colorCircleSelected,
                  ]}
                >
                  {isSelected && <Check size={16} color="#FFFFFF" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Include subdecks when studying toggle switch */}
        <View style={[styles.switchCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.switchTextContainer}>
            <Text style={[styles.switchLabel, { color: colors.text }]}>
              Include subdecks when studying
            </Text>
            <Text style={[styles.switchSub, { color: colors.textSecondary }]}>
              Automatically include words from all child units
            </Text>
          </View>
          <Switch
            value={includeSubdecks}
            onValueChange={setIncludeSubdecks}
            trackColor={{ false: colors.subtle, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  saveHeaderBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 16,
  },
  saveHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
  },
  multilineInput: {
    height: 80,
    paddingTop: 12,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  parentPills: {
    gap: 8,
  },
  parentPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  parentPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 10,
  },
  switchTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  switchSub: {
    fontSize: 12,
    marginTop: 2,
  },
});
