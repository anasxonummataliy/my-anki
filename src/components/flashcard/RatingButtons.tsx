import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Rating, Grade } from 'ts-fsrs';
import { RatingPreview } from '@/types/review';
import { triggerHaptic } from '@/utils/haptics';
import { RotateCcw, Check, Star } from 'lucide-react-native';

interface RatingButtonsProps {
  previews: RatingPreview[];
  onSelectRating: (rating: Grade) => void;
  disabled?: boolean;
}

export const RatingButtons: React.FC<RatingButtonsProps> = ({
  previews,
  onSelectRating,
  disabled = false,
}) => {
  const handleRating = (rating: Grade) => {
    if (disabled) return;
    if (rating === Rating.Again) {
      triggerHaptic('error');
    } else if (rating === Rating.Easy) {
      triggerHaptic('success');
    } else {
      triggerHaptic('medium');
    }
    onSelectRating(rating);
  };

  const getIcon = (rating: Grade) => {
    switch (rating) {
      case Rating.Again:
        return <RotateCcw size={18} color="#FFFFFF" />;
      case Rating.Hard:
        return <RotateCcw size={18} color="#FFFFFF" />;
      case Rating.Good:
        return <Check size={20} color="#FFFFFF" strokeWidth={2.5} />;
      case Rating.Easy:
        return <Star size={18} color="#FFFFFF" fill="#FFFFFF" />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {previews.map((item) => (
        <TouchableOpacity
          key={item.rating}
          onPress={() => handleRating(item.rating)}
          disabled={disabled}
          activeOpacity={0.7}
          style={[styles.button, { backgroundColor: item.color }]}
        >
          <View style={styles.iconCircle}>
            {getIcon(item.rating)}
          </View>
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.intervalText}>{item.intervalText}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  button: {
    flex: 1,
    height: 72,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
    paddingVertical: 6,
  },
  iconCircle: {
    marginBottom: 3,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  intervalText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
