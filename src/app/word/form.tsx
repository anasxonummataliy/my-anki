import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useThemeStore } from '@/store/themeStore';
import {
  createWord,
  updateWord,
  getWordById,
} from '@/db/repositories/wordRepository';
import { getAllDecks } from '@/db/repositories/deckRepository';
import { DeckWithStats } from '@/types/deck';
import { PartOfSpeech } from '@/types/word';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Header } from '@/components/common/Header';
import { triggerHaptic } from '@/utils/haptics';

const PARTS_OF_SPEECH: PartOfSpeech[] = [
  'noun',
  'verb',
  'adjective',
  'adverb',
  'pronoun',
  'preposition',
  'conjunction',
  'interjection',
  'idiom',
  'phrase',
];

const WordSchema = z.object({
  word: z.string().min(1, 'English word is required').max(100),
  translation: z.string().min(1, 'Uzbek translation is required').max(150),
  definition: z.string().max(300).optional(),
  example: z.string().max(300).optional(),
  notes: z.string().max(300).optional(),
});

type WordFormData = z.infer<typeof WordSchema>;

export default function WordFormScreen() {
  const { wordId, defaultDeckId } = useLocalSearchParams<{
    wordId?: string;
    defaultDeckId?: string;
  }>();
  const insets = useSafeAreaInsets();
  const colors = useThemeStore((s) => s.getColors());

  const [decks, setDecks] = useState<DeckWithStats[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string>('');
  const [selectedPos, setSelectedPos] = useState<PartOfSpeech | null>('noun');
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<WordFormData>({
    resolver: zodResolver(WordSchema),
    defaultValues: {
      word: '',
      translation: '',
      definition: '',
      example: '',
      notes: '',
    },
  });

  useEffect(() => {
    async function init() {
      const allDecks = await getAllDecks();
      setDecks(allDecks);

      if (defaultDeckId) {
        setSelectedDeckId(defaultDeckId);
      } else if (allDecks.length > 0) {
        setSelectedDeckId(allDecks[0].id);
      }

      if (wordId) {
        const existing = await getWordById(wordId);
        if (existing) {
          setValue('word', existing.word);
          setValue('translation', existing.translation);
          setValue('definition', existing.definition || '');
          setValue('example', existing.example || '');
          setValue('notes', existing.notes || '');
          setSelectedDeckId(existing.deckId);
          setSelectedPos((existing.partOfSpeech as PartOfSpeech) || null);
        }
      }
    }
    init();
  }, [wordId, defaultDeckId, setValue]);

  const onSubmit = async (data: WordFormData) => {
    if (!selectedDeckId) return;
    setLoading(true);
    triggerHaptic('medium');
    try {
      if (wordId) {
        await updateWord({
          id: wordId,
          deckId: selectedDeckId,
          word: data.word,
          translation: data.translation,
          definition: data.definition || null,
          example: data.example || null,
          partOfSpeech: selectedPos || null,
          notes: data.notes || null,
        });
      } else {
        await createWord({
          deckId: selectedDeckId,
          word: data.word,
          translation: data.translation,
          definition: data.definition || null,
          example: data.example || null,
          partOfSpeech: selectedPos || null,
          notes: data.notes || null,
        });
      }
      triggerHaptic('success');
      router.back();
    } catch (err) {
      console.error('Error saving word:', err);
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
        title={wordId ? 'Edit Word' : 'Add Word'}
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
        {/* Deck Selector */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            TARGET DECK *
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.deckPills}
          >
            {decks.map((deck) => (
              <TouchableOpacity
                key={deck.id}
                onPress={() => {
                  triggerHaptic('selection');
                  setSelectedDeckId(deck.id);
                }}
                style={[
                  styles.deckPill,
                  {
                    backgroundColor:
                      selectedDeckId === deck.id ? colors.primary : colors.surface,
                    borderColor:
                      selectedDeckId === deck.id ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.deckPillText,
                    {
                      color:
                        selectedDeckId === deck.id ? '#FFFFFF' : colors.text,
                    },
                  ]}
                >
                  {deck.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* English Word */}
        <Controller
          control={control}
          name="word"
          render={({ field: { onChange, value } }) => (
            <Input
              label="English Word or Phrase *"
              placeholder="e.g. resilient"
              value={value}
              onChangeText={onChange}
              error={errors.word?.message}
              autoCapitalize="none"
            />
          )}
        />

        {/* Uzbek Translation */}
        <Controller
          control={control}
          name="translation"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Uzbek Translation *"
              placeholder="e.g. bardoshli, qaytmas"
              value={value}
              onChangeText={onChange}
              error={errors.translation?.message}
            />
          )}
        />

        {/* Part of Speech */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            PART OF SPEECH
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.posPills}
          >
            {PARTS_OF_SPEECH.map((pos) => {
              const isSelected = selectedPos === pos;
              return (
                <TouchableOpacity
                  key={pos}
                  onPress={() => {
                    triggerHaptic('selection');
                    setSelectedPos(isSelected ? null : pos);
                  }}
                  style={[
                    styles.posPill,
                    {
                      backgroundColor: isSelected ? colors.primaryLight : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.posPillText,
                      { color: isSelected ? colors.primary : colors.text },
                    ]}
                  >
                    {pos}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Definition */}
        <Controller
          control={control}
          name="definition"
          render={({ field: { onChange, value } }) => (
            <Input
              label="English Definition (Optional)"
              placeholder="e.g. able to withstand or recover quickly from difficult conditions"
              value={value}
              onChangeText={onChange}
              multiline
              numberOfLines={2}
              style={styles.multilineInput}
            />
          )}
        />

        {/* Example Sentence */}
        <Controller
          control={control}
          name="example"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Example Sentence (Optional)"
              placeholder="e.g. She remained resilient through tough times."
              value={value}
              onChangeText={onChange}
              multiline
              numberOfLines={2}
              style={styles.multilineInput}
            />
          )}
        />

        {/* Notes */}
        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Personal Notes (Optional)"
              placeholder="e.g. Synonyms, mnemonics, or collocations..."
              value={value}
              onChangeText={onChange}
              multiline
              numberOfLines={2}
              style={styles.multilineInput}
            />
          )}
        />

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <Button
            title={wordId ? 'Save Changes' : 'Add Vocabulary'}
            onPress={handleSubmit(onSubmit)}
            loading={loading || isSubmitting}
            size="lg"
            variant="primary"
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
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  deckPills: {
    gap: 8,
  },
  deckPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  deckPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  posPills: {
    gap: 8,
  },
  posPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  posPillText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  multilineInput: {
    height: 68,
    paddingTop: 10,
  },
  submitContainer: {
    marginTop: 16,
  },
});
