import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../utils/theme';

const RATES = [0.25, 0.5, 0.75, 1.0];

function rateLabel(rate) {
  if (rate === 1.0) return '1x';
  return `${rate}x`;
}

export default function SpeedSelector({ selectedRate, onRateChange }) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Playback Speed</Text>
      <View style={styles.pillRow}>
        {RATES.map((rate) => {
          const isSelected = rate === selectedRate;
          return (
            <TouchableOpacity
              key={rate}
              style={[styles.pill, isSelected && styles.pillSelected]}
              onPress={() => onRateChange(rate)}
            >
              <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                {rateLabel(rate)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SIZES.paddingSm,
  },
  label: {
    fontSize: SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
  },
  pillSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  pillText: {
    fontSize: SIZES.md,
    fontWeight: '700',
    color: COLORS.accentDark,
  },
  pillTextSelected: {
    color: COLORS.white,
  },
});
