// ============================================================
// Settings Screen — Tavallin Luxury Studio & Preferences
// Edit profile identity, privacy preferences, account actions
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Typography, Spacing, Radii, Shadows } from '../src/design/tokens';
import { apiClient } from '../src/lib/apiClient';
import { useMyProfile } from '../src/hooks/useUserProfile';
import { useAuthStore } from '../src/stores/authStore';
import type { ApiResponse, UpdateProfileRequest, UserPrivateProfile } from '@tavallin/shared';

function Section({ title, children }: { title: string; children?: any }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function RowItem({
  label,
  value,
  onPress,
  danger,
  icon,
}: {
  label: string;
  value?: string | undefined;
  onPress: () => void;
  danger?: boolean | undefined;
  icon?: string;
}) {
  return (
    <TouchableOpacity style={styles.rowItem} onPress={onPress} activeOpacity={0.7}>
      <Text style={[styles.rowLabel, danger && styles.dangerText]}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      <Feather name="chevron-right" size={18} color={danger ? Colors.error : Colors.midGray} />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { clearAuth, updateUser } = useAuthStore();
  const { data: profile, refetch: refetchProfile } = useMyProfile();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName ?? '');
      setBio(profile.bio ?? '');
      setLocation(profile.location ?? '');
      setIsPrivate(profile.isPrivate ?? false);
    }
  }, [profile]);

  const handlePickAvatar = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Needed', 'Please allow photo library access to upload a profile photo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      setIsUploadingAvatar(true);

      const formData = new FormData();
      formData.append('avatar', {
        uri: asset.uri,
        name: asset.fileName || `avatar_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      } as unknown as Blob);

      const res = await apiClient.post<ApiResponse<{ avatarUrl: string }>>('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 45000,
      });

      if (res.data?.data?.avatarUrl) {
        updateUser({ avatarUrl: res.data.data.avatarUrl });
        await Promise.all([
          refetchProfile(),
          qc.invalidateQueries({ queryKey: ['profile', 'me'] }),
        ]);
        Alert.alert('Updated', 'Profile portrait refreshed.');
      }
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      const msg = err?.response?.data?.error?.message || 'Could not upload profile photo.';
      Alert.alert('Upload Failed', msg);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateProfileRequest) => {
      const res = await apiClient.patch<ApiResponse<UserPrivateProfile>>('/users/me', data);
      return res.data.data;
    },
    onSuccess: (updated) => {
      updateUser({
        displayName: updated.displayName,
        avatarUrl: updated.avatarUrl,
        isPrivate: updated.isPrivate,
      });
      void qc.invalidateQueries({ queryKey: ['profile', 'me'] });
      void qc.invalidateQueries({ queryKey: ['user', updated.username] });
      Alert.alert('Saved', 'Your curator profile has been updated.');
    },
    onError: () => Alert.alert('Error', 'Could not update profile.'),
  });

  const handleTogglePrivate = async (val: boolean) => {
    setIsPrivate(val);
    try {
      const res = await apiClient.patch<ApiResponse<UserPrivateProfile>>('/users/me', {
        displayName: displayName.trim() || profile?.displayName || '',
        isPrivate: val,
      });
      if (res.data?.data) {
        updateUser({
          displayName: res.data.data.displayName,
          avatarUrl: res.data.data.avatarUrl,
          isPrivate: res.data.data.isPrivate,
        });
        await Promise.all([
          refetchProfile(),
          qc.invalidateQueries({ queryKey: ['profile', 'me'] }),
        ]);
        Alert.alert(
          val ? 'Account Set to Private' : 'Account Set to Public',
          val
            ? 'Only approved followers can view your looks and wardrobe.'
            : 'Your lookbook is now public to the OOTDi fashion community.',
        );
      }
    } catch (err: any) {
      console.error('Error toggling privacy:', err);
      setIsPrivate(!val);
      Alert.alert('Error', 'Could not update privacy setting. Please try again.');
    }
  };

  const handleSave = () => {
    if (!displayName.trim()) {
      Alert.alert('Required', 'Display name cannot be empty.');
      return;
    }
    const req: UpdateProfileRequest = {
      displayName: displayName.trim(),
      isPrivate,
    };
    if (bio.trim()) {
      req.bio = bio.trim();
    }
    if (location.trim()) {
      req.location = location.trim();
    }
    updateMutation.mutate(req);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to exit your OOTDi session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await clearAuth();
          qc.clear();
          router.replace('/(auth)/welcome');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Portfolio',
      'This will permanently delete your lookbook, account, and all published fits. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete('/users/me');
              await clearAuth();
              qc.clear();
              router.replace('/(auth)/welcome');
            } catch {
              Alert.alert('Error', 'Could not delete account. Contact support.');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconCircleBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={18} color={Colors.charcoal} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerEyebrow}>✦ PREFERENCES</Text>
          <Text style={styles.headerTitle}>SETTINGS</Text>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          disabled={updateMutation.isPending}
          style={[styles.saveBtn, updateMutation.isPending && { opacity: 0.6 }]}
          activeOpacity={0.85}
        >
          {updateMutation.isPending ? (
            <ActivityIndicator color={Colors.warmWhite} size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={styles.avatarRingWrap}
              onPress={handlePickAvatar}
              disabled={isUploadingAvatar}
              activeOpacity={0.85}
            >
              <View style={styles.avatarBorderRing}>
                {profile?.avatarUrl ? (
                  <Image
                    source={{ uri: profile.avatarUrl }}
                    style={styles.settingsAvatar}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                ) : (
                  <View style={styles.settingsAvatarPlaceholder}>
                    <Text style={styles.settingsAvatarInitial}>
                      {(displayName || profile?.username || 'U')[0]?.toUpperCase()}
                    </Text>
                  </View>
                )}
                {isUploadingAvatar && (
                  <View style={styles.settingsAvatarOverlay}>
                    <ActivityIndicator color={Colors.warmWhite} size="small" />
                  </View>
                )}
              </View>
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={14} color={Colors.warmWhite} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.changePhotoBtn}
              onPress={handlePickAvatar}
              disabled={isUploadingAvatar}
              activeOpacity={0.8}
            >
              <Text style={styles.changePhotoText}>
                {isUploadingAvatar ? 'Updating portrait…' : 'Change Profile Portrait'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Profile Identity */}
          <Section title="PROFILE IDENTITY">
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>DISPLAY NAME</Text>
              <TextInput
                style={styles.fieldInput}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Your curated name"
                placeholderTextColor={Colors.textPlaceholder}
                maxLength={50}
              />
            </View>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>LOOKBOOK USERNAME</Text>
              <Text style={styles.fieldReadonly}>@{profile?.username}</Text>
            </View>

            <View style={styles.fieldWrap}>
              <View style={styles.labelCountRow}>
                <Text style={styles.fieldLabel}>BIO & STYLING ESSENCE</Text>
                <Text style={styles.charCount}>{bio.length}/160</Text>
              </View>
              <TextInput
                style={[styles.fieldInput, styles.fieldMultiline]}
                value={bio}
                onChangeText={setBio}
                placeholder="Describe your aesthetic philosophy, inspirations, or wardrobe DNA…"
                placeholderTextColor={Colors.textPlaceholder}
                multiline
                maxLength={160}
                textAlignVertical="top"
              />
            </View>

            <View style={[styles.fieldWrap, styles.fieldNoBorder]}>
              <Text style={styles.fieldLabel}>LOCATION</Text>
              <TextInput
                style={styles.fieldInput}
                value={location}
                onChangeText={setLocation}
                placeholder="Paris, Tokyo, New York..."
                placeholderTextColor={Colors.textPlaceholder}
              />
            </View>
          </Section>

          {/* Privacy */}
          <Section title="LOOKBOOK VISIBILITY">
            <View style={[styles.rowItem, styles.switchRow]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>Private Wardrobe</Text>
                <Text style={styles.rowSubLabel}>Only approved followers can view your fits and saved capsules</Text>
              </View>
              <Switch
                value={isPrivate}
                onValueChange={handleTogglePrivate}
                trackColor={{ false: Colors.border, true: Colors.gold }}
                thumbColor={Colors.warmWhite}
              />
            </View>
          </Section>

          {/* Account Security */}
          <Section title="SECURITY & CREDENTIALS">
            <RowItem
              label="Reset Password"
              onPress={() => router.push('/(auth)/forgot-password')}
            />
            <RowItem
              label="Verified Email"
              value={profile?.email}
              onPress={() => Alert.alert('Email', 'To update your primary email address, please contact concierge support.')}
            />
          </Section>

          {/* About */}
          <Section title="ABOUT OOTDi">
            <RowItem label="Terms of Service" onPress={() => {}} />
            <RowItem label="Privacy Policy" onPress={() => {}} />
            <RowItem label="Editorial Standards" onPress={() => {}} />
            <RowItem
              label="App Version"
              value="1.0.0 (Gold Haute)"
              onPress={() => {}}
            />
          </Section>

          {/* Account Actions */}
          <Section title="ACCOUNT ACTIONS">
            <RowItem label="Sign Out" onPress={handleSignOut} danger />
            <RowItem label="Delete Portfolio" onPress={handleDeleteAccount} danger />
          </Section>

          <View style={{ height: Spacing[10] }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.warmWhite,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.warmWhite,
  },
  iconCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerEyebrow: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: Colors.textGold,
  },
  headerTitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    fontWeight: '800',
    letterSpacing: 2,
    color: Colors.charcoal,
  },
  saveBtn: {
    backgroundColor: Colors.charcoal,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[1] + 3,
    minWidth: 58,
    alignItems: 'center',
    ...Shadows.sm,
  },
  saveBtnText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.warmWhite,
  },
  scroll: {
    paddingVertical: Spacing[5],
  },

  // ─── Avatar ────────────────────────────────────────────────
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing[6],
    gap: Spacing[3],
  },
  avatarRingWrap: {
    position: 'relative',
    width: 94,
    height: 94,
  },
  avatarBorderRing: {
    width: 94,
    height: 94,
    borderRadius: 47,
    borderWidth: 2,
    borderColor: Colors.gold,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  settingsAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
    backgroundColor: Colors.softGray,
  },
  settingsAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
    backgroundColor: Colors.charcoal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsAvatarInitial: {
    fontFamily: Typography.fontBody,
    fontSize: Typography['3xl'],
    fontWeight: '700',
    color: Colors.warmWhite,
  },
  settingsAvatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.charcoal,
    borderWidth: 2,
    borderColor: Colors.warmWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoBtn: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: Radii.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderGold,
    ...Shadows.sm,
  },
  changePhotoText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs + 1,
    fontWeight: '700',
    color: Colors.charcoal,
  },

  // ─── Sections ──────────────────────────────────────────────
  section: {
    marginBottom: Spacing[5],
    marginHorizontal: Spacing[4],
  },
  sectionTitle: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: Colors.textSecondary,
    marginBottom: Spacing[2],
    paddingHorizontal: Spacing[1],
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  fieldWrap: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 2,
  },
  fieldNoBorder: {
    borderBottomWidth: 0,
  },
  fieldLabel: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: Colors.textSecondary,
  },
  labelCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCount: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    color: Colors.textTertiary,
  },
  fieldInput: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm + 1,
    color: Colors.charcoal,
    paddingVertical: Spacing[1],
  },
  fieldMultiline: {
    minHeight: 70,
    paddingTop: Spacing[1],
  },
  fieldReadonly: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm + 1,
    color: Colors.textSecondary,
    paddingVertical: Spacing[1],
  },

  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  switchRow: {
    gap: Spacing[3],
  },
  rowLabel: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm + 1,
    color: Colors.charcoal,
    fontWeight: '600',
    flex: 1,
  },
  rowSubLabel: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  rowValue: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs + 1,
    color: Colors.textSecondary,
    marginRight: Spacing[2],
  },
  dangerText: {
    color: Colors.error,
  },
});
