import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../utils/theme';

export default function TranscriptionBanner({ status, error, onRetry }) {
  if (status === 'completed') {
    return (
      <View style={[styles.banner, styles.completedBanner]}>
        <Text style={styles.bannerIcon}>✅</Text>
        <View style={styles.bannerContent}>
          <Text style={styles.bannerTitle}>Transcription Complete</Text>
          <Text style={styles.bannerSub}>Answers auto-populated from video</Text>
        </View>
      </View>
    );
  }

  if (status === 'processing') {
    return (
      <View style={[styles.banner, styles.processingBanner]}>
        <ActivityIndicator size="small" color={COLORS.transcribing} />
        <View style={styles.bannerContent}>
          <Text style={[styles.bannerTitle, { color: COLORS.transcribing }]}>Transcribing...</Text>
          <Text style={styles.bannerSub}>Extracting answers from your video</Text>
        </View>
      </View>
    );
  }

  if (status === 'failed') {
    return (
      <View style={[styles.banner, styles.failedBanner]}>
        <Text style={styles.bannerIcon}>⚠️</Text>
        <View style={styles.bannerContent}>
          <Text style={[styles.bannerTitle, { color: COLORS.error }]}>Transcription Failed</Text>
          <Text style={styles.bannerSub}>{error || 'Something went wrong'}</Text>
        </View>
        {onRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // no_key / pending — prompt to add key in .env
  return (
    <View style={[styles.banner, styles.setupBanner]}>
      <Text style={styles.bannerIcon}>🔑</Text>
      <View style={styles.bannerContent}>
        <Text style={[styles.bannerTitle, { color: COLORS.warning }]}>OpenAI Key Missing</Text>
        <Text style={styles.bannerSub}>Add EXPO_PUBLIC_OPENAI_KEY to your .env file and restart</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: SIZES.radiusLg,
    padding: SIZES.padding,
    marginBottom: SIZES.paddingLg,
  },
  completedBanner: {
    backgroundColor: '#F0FDF4',
  },
  processingBanner: {
    backgroundColor: '#EEF2FF',
  },
  failedBanner: {
    backgroundColor: '#FEF2F2',
  },
  setupBanner: {
    backgroundColor: '#FFFBEB',
  },
  bannerIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: SIZES.md,
    fontWeight: '700',
    color: COLORS.success,
    marginBottom: 2,
  },
  bannerSub: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
  },
  retryButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: SIZES.radiusFull,
  },
  retryText: {
    color: COLORS.white,
    fontSize: SIZES.sm,
    fontWeight: '700',
  },
});
