// ============================================================
// Create Post Screen — Image picker → details form → submit
// ============================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Typography, Spacing, Radii } from '../../src/design/tokens';
import { apiClient } from '../../src/lib/apiClient';
import { STYLE_CATEGORY_LABELS, OCCASION_LABELS } from '@tavallin/shared';
import type { StyleCategory, Occasion, ApiResponse, OutfitPost } from '@tavallin/shared';

const { width: SW } = Dimensions.get('window');

interface PickedMedia {
  uri: string;
  type: string;
  fileName: string;
  width: number;
  height: number;
}

export default function CreateScreen() {
  const router = useRouter();
  const qc = useQueryClient();

  const [step, setStep] = useState<'pick' | 'details'>('pick');
  const [media, setMedia] = useState<PickedMedia[]>([]);
  const [caption, setCaption] = useState('');
  const [selectedStyles, setSelectedStyles] = useState<StyleCategory[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<Occasion[]>([]);

  const toggleStyle = (s: StyleCategory) =>
    setSelectedStyles((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : prev.length < 5 ? [...prev, s] : prev,
    );

  const toggleOccasion = (o: Occasion) =>
    setSelectedOccasions((prev) =>
      prev.includes(o) ? prev.filter((x) => x !== o) : prev.length < 5 ? [...prev, o] : prev,
    );

  const pickImages = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to post outfits.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 0.85,
    });
    if (!result.canceled) {
      const picked: PickedMedia[] = result.assets.map((a, idx) => ({
        uri: a.uri,
        type: a.mimeType === 'image/jpg' ? 'image/jpeg' : (a.mimeType ?? 'image/jpeg'),
        fileName: a.fileName ?? `photo_${Date.now()}_${idx}.jpg`,
        width: a.width,
        height: a.height,
      }));
      setMedia(picked);
      setStep('details');
    }
  }, []);

  const postMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      for (const m of media) {
        formData.append('media', {
          uri: m.uri,
          type: m.type,
          name: m.fileName,
        } as unknown as Blob);
      }
      if (caption.trim()) formData.append('caption', caption.trim());
      for (const s of selectedStyles) formData.append('styleCategories', s);
      for (const o of selectedOccasions) formData.append('occasions', o);

      const res = await apiClient.post<ApiResponse<OutfitPost>>('/outfits', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      return res.data.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['feed'] });
      void qc.invalidateQueries({ queryKey: ['userPosts'] });
      void qc.invalidateQueries({ queryKey: ['profile'] });
      Alert.alert('Posted!', 'Your outfit is live.', [
        { text: 'View Feed', onPress: () => router.replace('/(tabs)') },
      ]);
      // Reset
      setStep('pick');
      setMedia([]);
      setCaption('');
      setSelectedStyles([]);
      setSelectedOccasions([]);
    },
    onError: (err: any) => {
      console.error('Outfit upload error:', err?.response?.data || err?.message || err);
      const serverDetails = err?.response?.data?.error?.details?.[0]?.message;
      const serverMsg = err?.response?.data?.error?.message;
      const message = serverDetails || serverMsg || err?.message || 'Could not upload your outfit. Please try again.';
      Alert.alert('Upload Failed', message);
    },
  });

  // ── Pick Step ──────────────────────────────────────────────
  if (step === 'pick') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.brand}>NEW OUTFIT</Text>
        </View>

        <View style={styles.pickCenter}>
          <TouchableOpacity style={styles.pickZone} onPress={() => void pickImages()} activeOpacity={0.85}>
            <Text style={styles.pickPlus}>+</Text>
            <Text style={styles.pickTitle}>Add Photos</Text>
            <Text style={styles.pickSub}>Choose up to 10 images from your library</Text>
          </TouchableOpacity>

          <View style={styles.pickTips}>
            {['Square or portrait shots work best', 'Good lighting makes a huge difference', 'Show the full look — head to toe'].map((tip) => (
              <View key={tip} style={styles.tipRow}>
                <Text style={styles.tipDot}>·</Text>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Details Step ───────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('pick')}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.brand}>DETAILS</Text>
          <TouchableOpacity
            onPress={() => postMutation.mutate()}
            disabled={postMutation.isPending}
            style={[styles.postBtn, postMutation.isPending && { opacity: 0.5 }]}
          >
            {postMutation.isPending ? (
              <ActivityIndicator color={Colors.warmWhite} size="small" />
            ) : (
              <Text style={styles.postBtnText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.detailsScroll} showsVerticalScrollIndicator={false}>
          {/* Image preview strip */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewStrip}>
            {media.map((m, i) => (
              <Image
                key={i}
                source={{ uri: m.uri }}
                style={styles.previewThumb}
                contentFit="cover"
              />
            ))}
            {media.length < 10 && (
              <TouchableOpacity style={styles.addMoreBtn} onPress={() => void pickImages()}>
                <Text style={styles.addMoreText}>+</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Caption */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Caption</Text>
            <TextInput
              style={styles.captionInput}
              placeholder="Describe your look…"
              placeholderTextColor={Colors.textPlaceholder}
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={500}
            />
            <Text style={styles.charCount}>{caption.length}/500</Text>
          </View>

          {/* Style categories */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              Style <Text style={styles.sectionHint}>(pick up to 5)</Text>
            </Text>
            <View style={styles.chipGrid}>
              {(Object.entries(STYLE_CATEGORY_LABELS) as [StyleCategory, string][]).map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.chip, selectedStyles.includes(key) && styles.chipActive]}
                  onPress={() => toggleStyle(key)}
                >
                  <Text style={[styles.chipText, selectedStyles.includes(key) && styles.chipTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Occasions */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              Occasion <Text style={styles.sectionHint}>(pick up to 5)</Text>
            </Text>
            <View style={styles.chipGrid}>
              {(Object.entries(OCCASION_LABELS) as [Occasion, string][]).map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.chip, selectedOccasions.includes(key) && styles.chipActive]}
                  onPress={() => toggleOccasion(key)}
                >
                  <Text style={[styles.chipText, selectedOccasions.includes(key) && styles.chipTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ height: Spacing[10] }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.warmWhite },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  brand: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    fontWeight: '700',
    letterSpacing: 3,
    color: Colors.charcoal,
  },
  backText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  postBtn: {
    backgroundColor: Colors.charcoal,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: Radii.full,
    minWidth: 56,
    alignItems: 'center',
  },
  postBtnText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.warmWhite,
  },
  pickCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[8],
    gap: Spacing[6],
  },
  pickZone: {
    width: SW - Spacing[12],
    aspectRatio: 0.8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: Radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[3],
    backgroundColor: Colors.surface,
  },
  pickPlus: {
    fontSize: 48,
    fontWeight: '200',
    color: Colors.midGray,
    lineHeight: 52,
  },
  pickTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography['2xl'],
    color: Colors.charcoal,
  },
  pickSub: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.sm * 1.6,
    paddingHorizontal: Spacing[4],
  },
  pickTips: { gap: Spacing[2] },
  tipRow: { flexDirection: 'row', gap: Spacing[2] },
  tipDot: { color: Colors.midGray, fontSize: Typography.base },
  tipText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  detailsScroll: { paddingBottom: Spacing[10] },
  previewStrip: {
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[4],
  },
  previewThumb: {
    width: 90,
    height: 120,
    borderRadius: Radii.md,
    marginRight: Spacing[2],
    backgroundColor: Colors.softGray,
  },
  addMoreBtn: {
    width: 90,
    height: 120,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMoreText: { fontSize: 28, color: Colors.midGray, fontWeight: '200' },
  section: { paddingHorizontal: Spacing[5], marginTop: Spacing[5] },
  sectionLabel: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.charcoal,
    marginBottom: Spacing[3],
  },
  sectionHint: {
    fontWeight: '400',
    color: Colors.textSecondary,
    fontSize: Typography.xs,
  },
  captionInput: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.base,
    color: Colors.charcoal,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    padding: Spacing[3],
    minHeight: 90,
    textAlignVertical: 'top',
    backgroundColor: Colors.surface,
  },
  charCount: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    textAlign: 'right',
    marginTop: Spacing[1],
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  chip: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1] + 2,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipActive: { backgroundColor: Colors.charcoal, borderColor: Colors.charcoal },
  chipText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  chipTextActive: { color: Colors.warmWhite },
});
