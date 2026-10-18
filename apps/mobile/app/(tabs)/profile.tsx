// ============================================================
// Profile Screen — Luxury Personal Lookbook & Wardrobe Closet
// ============================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
  Share,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { Colors, Typography, Spacing, Radii } from '../../src/design/tokens';
import { useMyProfile, useUserPosts } from '../../src/hooks/useUserProfile';
import { useMyCollections, useCreateCollection } from '../../src/hooks/useCollections';
import { useAuthStore } from '../../src/stores/authStore';
import { apiClient } from '../../src/lib/apiClient';
import { GridSkeleton } from '../../src/components/Skeletons';
import type { OutfitSummary, ApiResponse, Collection } from '@tavallin/shared';
import { STYLE_CATEGORIES, STYLE_CATEGORY_LABELS } from '@tavallin/shared';

const { width: SW } = Dimensions.get('window');
const COLS = 3;
const GAP = 2;
const THUMB_SIZE = (SW - GAP * (COLS - 1)) / COLS;

type ProfileTab = 'looks' | 'saved';

function StatBlock({ label, value, onPress }: { label: string; value: number; onPress?: () => void }) {
  return (
    <TouchableOpacity
      style={styles.statBlock}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.statValue}>{_fmt(value)}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function _fmt(n?: number | null): string {
  if (n == null || isNaN(n)) return '0';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function ProfileScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { updateUser } = useAuthStore();
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile, isRefetching } = useMyProfile();
  const { data: postsData, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading: postsLoading } =
    useUserPosts(profile?.username ?? '');
  const { data: collections = [], isLoading: collectionsLoading } = useMyCollections();
  const createCollectionMutation = useCreateCollection();

  const [activeTab, setActiveTab] = useState<ProfileTab>('looks');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Modals state
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const [isCreateBoardModalOpen, setIsCreateBoardModalOpen] = useState(false);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [isSavingStyles, setIsSavingStyles] = useState(false);

  // Create board state
  const [boardName, setBoardName] = useState('');
  const [boardDesc, setBoardDesc] = useState('');

  const posts = postsData?.pages.flatMap((p) => p.posts as unknown as OutfitSummary[]) ?? [];

  const handleEndReached = useCallback(() => {
    if (activeTab === 'looks' && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [activeTab, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Open style editor initialized with current styles
  const handleOpenStyleModal = () => {
    const current = (profile as any)?.preferences?.styleCategories || [];
    setSelectedStyles(current);
    setIsStyleModalOpen(true);
  };

  const handleToggleStyle = (styleKey: string) => {
    setSelectedStyles((prev) =>
      prev.includes(styleKey) ? prev.filter((k) => k !== styleKey) : [...prev, styleKey]
    );
  };

  const handleSaveStyles = async () => {
    try {
      setIsSavingStyles(true);
      await apiClient.patch('/users/me/preferences', {
        styleCategories: selectedStyles,
      });
      await Promise.all([
        refetchProfile(),
        qc.invalidateQueries({ queryKey: ['profile', 'me'] }),
      ]);
      setIsStyleModalOpen(false);
    } catch (err: any) {
      console.error('Failed to save styles:', err);
      Alert.alert('Error', 'Could not update style signature. Please try again.');
    } finally {
      setIsSavingStyles(false);
    }
  };

  const handleCreateBoard = async () => {
    if (!boardName.trim()) {
      Alert.alert('Name Required', 'Please enter a name for your moodboard.');
      return;
    }
    try {
      const payload: { name: string; description?: string; isPublic?: boolean } = {
        name: boardName.trim(),
        isPublic: true,
      };
      if (boardDesc.trim()) {
        payload.description = boardDesc.trim();
      }
      await createCollectionMutation.mutateAsync(payload);
      setBoardName('');
      setBoardDesc('');
      setIsCreateBoardModalOpen(false);
      await qc.invalidateQueries({ queryKey: ['collections', 'me'] });
      Alert.alert('Moodboard Created', 'Your new fashion collection is ready.');
    } catch (err: any) {
      console.error('Create board error:', err);
      Alert.alert('Error', 'Could not create moodboard. Please try again.');
    }
  };

  const handlePickAndUploadAvatar = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Needed', 'Please allow photo access to upload a profile photo.');
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
        Alert.alert('Success', 'Profile photo updated!');
      }
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      const msg = err?.response?.data?.error?.message || 'Could not upload profile photo. Please try again.';
      Alert.alert('Upload Failed', msg);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleShareProfile = async () => {
    try {
      await Share.share({
        message: `Explore @${profile?.username}'s curated looks and style formulas on Tavallin: https://tavallin.app/@${profile?.username}`,
      });
    } catch {
      // Ignore
    }
  };

  const onRefresh = useCallback(async () => {
    await Promise.all([
      refetchProfile(),
      qc.invalidateQueries({ queryKey: ['userPosts', profile?.username] }),
      qc.invalidateQueries({ queryKey: ['collections', 'me'] }),
    ]);
  }, [refetchProfile, qc, profile?.username]);

  const renderThumb = useCallback(
    ({ item }: { item: OutfitSummary }) => {
      const thumb =
        item.thumbnailUrl ||
        (item as any).media?.[0]?.thumbnailUrl ||
        (item as any).media?.[0]?.publicUrl ||
        (item as any).media?.[0]?.url;

      const likesCount = item.likesCount ?? 0;
      const mediaCount = (item as any).media?.length ?? 1;

      return (
        <TouchableOpacity
          style={styles.thumb}
          activeOpacity={0.88}
          onPress={() => router.push(`/outfit/${item.id}`)}
        >
          <Image
            source={thumb ? { uri: thumb } : null}
            style={styles.thumbImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={150}
          />
          {mediaCount > 1 && (
            <View style={styles.multiMediaBadge}>
              <Text style={styles.multiMediaText}>❐</Text>
            </View>
          )}
          <View style={styles.thumbOverlay}>
            <View style={styles.thumbStat}>
              <Text style={styles.thumbStatHeart}>♥</Text>
              <Text style={styles.thumbStatText}>{_fmt(likesCount)}</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [router],
  );

  const renderCollectionCard = useCallback(
    ({ item }: { item: Collection }) => (
      <TouchableOpacity
        style={styles.collectionCard}
        onPress={() => router.push(`/collection/${item.id}`)}
        activeOpacity={0.85}
      >
        <View style={styles.collectionCoverWrap}>
          {item.coverImageUrl ? (
            <Image
              source={{ uri: item.coverImageUrl }}
              style={styles.collectionCover}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={styles.collectionPlaceholder}>
              <Text style={styles.collectionPlaceholderIcon}>⊡</Text>
              <Text style={styles.collectionPlaceholderLabel}>Curated Board</Text>
            </View>
          )}
          <View style={styles.collectionBadge}>
            <Text style={styles.collectionBadgeText}>{item.itemsCount} pieces</Text>
          </View>
        </View>
        <Text style={styles.collectionName} numberOfLines={1}>
          {item.name}
        </Text>
        {item.description ? (
          <Text style={styles.collectionDesc} numberOfLines={1}>
            {item.description}
          </Text>
        ) : null}
      </TouchableOpacity>
    ),
    [router],
  );

  if (profileLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.charcoal} />
        </View>
      </SafeAreaView>
    );
  }

  const preferredStyles = (profile as any)?.preferences?.styleCategories || [];

  const ListHeader = () => (
    <View style={styles.headerContainer}>
      {/* ─── Top Brand & Action Bar ─── */}
      <View style={styles.topBar}>
        <View style={styles.handleWrap}>
          <Text style={styles.handleText}>@{profile?.username?.toUpperCase() ?? 'CLOSET'}</Text>
          <View style={styles.curatorBadge}>
            <Text style={styles.curatorBadgeText}>✦ ARCHIVE</Text>
          </View>
          {profile?.isPrivate && <Text style={styles.privateBadge}>🔒</Text>}
        </View>

        <View style={styles.topBarActions}>
          <TouchableOpacity
            style={styles.iconCircleBtn}
            onPress={() => router.push('/(tabs)/create')}
            activeOpacity={0.75}
            accessibilityLabel="Create Post"
          >
            <Ionicons name="add" size={20} color={Colors.charcoal} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconCircleBtn}
            onPress={handleShareProfile}
            activeOpacity={0.75}
            accessibilityLabel="Share Lookbook"
          >
            <Ionicons name="share-outline" size={18} color={Colors.charcoal} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconCircleBtn}
            onPress={() => router.push('/settings')}
            activeOpacity={0.75}
            accessibilityLabel="Settings"
          >
            <Ionicons name="settings-outline" size={18} color={Colors.charcoal} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Hero Avatar & Stats Row ─── */}
      <View style={styles.heroRow}>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={handlePickAndUploadAvatar}
          activeOpacity={0.85}
          disabled={isUploadingAvatar}
        >
          <View style={styles.avatarOuterRing}>
            <View style={styles.avatarWrap}>
              {profile?.avatarUrl ? (
                <Image
                  source={{ uri: profile.avatarUrl }}
                  style={styles.avatar}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {(profile?.displayName || profile?.username || 'U')[0]?.toUpperCase()}
                  </Text>
                </View>
              )}
              {isUploadingAvatar && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color={Colors.warmWhite} size="small" />
                </View>
              )}
            </View>
          </View>
          <View style={styles.cameraBadge}>
            <Text style={styles.cameraIcon}>📷</Text>
          </View>
        </TouchableOpacity>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatBlock label="Looks" value={profile?.postsCount ?? 0} onPress={() => setActiveTab('looks')} />
          <View style={styles.statDivider} />
          <StatBlock
            label="Followers"
            value={profile?.followersCount ?? 0}
            onPress={() => Alert.alert('Followers', `${profile?.followersCount ?? 0} fashion lovers follow your lookbook.`)}
          />
          <View style={styles.statDivider} />
          <StatBlock
            label="Following"
            value={profile?.followingCount ?? 0}
            onPress={() => Alert.alert('Following', `You follow ${profile?.followingCount ?? 0} curators & creators.`)}
          />
          <View style={styles.statDivider} />
          <StatBlock
            label="Boards"
            value={collections.length}
            onPress={() => setActiveTab('saved')}
          />
        </View>
      </View>

      {/* ─── Bio & Personal Info ─── */}
      <View style={styles.bioSection}>
        <View style={styles.displayNameRow}>
          <Text style={styles.displayName}>{profile?.displayName || profile?.username}</Text>
          <Text style={styles.verifiedStar}>✦</Text>
        </View>

        {profile?.bio ? <Text style={styles.bioText}>{profile.bio}</Text> : null}

        <View style={styles.metaRow}>
          {profile?.location ? (
            <View style={styles.locationPill}>
              <Text style={styles.locationText}>📍 {profile.location}</Text>
            </View>
          ) : null}
          <View style={styles.tierPill}>
            <Text style={styles.tierText}>TAVALLIN CURATOR</Text>
          </View>
        </View>
      </View>

      {/* ─── Style Signature / Aesthetics Section ─── */}
      <View style={styles.aestheticSection}>
        <View style={styles.aestheticHeader}>
          <Text style={styles.aestheticSectionTitle}>STYLE SIGNATURE</Text>
          <TouchableOpacity onPress={handleOpenStyleModal} activeOpacity={0.7} style={styles.editAestheticBtn}>
            <Text style={styles.editAestheticText}>✎ Edit</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.aestheticScroll}
        >
          {preferredStyles.length > 0 ? (
            preferredStyles.map((styleKey: string) => (
              <View key={styleKey} style={styles.aestheticChip}>
                <Text style={styles.aestheticText}>
                  ✦ {STYLE_CATEGORY_LABELS[styleKey as keyof typeof STYLE_CATEGORY_LABELS] || styleKey.replace(/_/g, ' ')}
                </Text>
              </View>
            ))
          ) : (
            <TouchableOpacity
              style={styles.addAestheticChip}
              onPress={handleOpenStyleModal}
              activeOpacity={0.8}
            >
              <Text style={styles.addAestheticText}>＋ Add Your Aesthetic DNA</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* ─── Profile Action Buttons ─── */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.primaryActionBtn}
          onPress={() => router.push('/settings')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryActionText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.newLookBtn}
          onPress={() => router.push('/(tabs)/create')}
          activeOpacity={0.85}
        >
          <Text style={styles.newLookText}>+ Post Look</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryActionBtn}
          onPress={() => setIsCreateBoardModalOpen(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryActionText}>+ Board</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Segmented Content Tabs ─── */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'looks' && styles.tabItemActive]}
          onPress={() => setActiveTab('looks')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabLabel, activeTab === 'looks' && styles.tabLabelActive]}>
            ▦ LOOKS ({posts.length})
          </Text>
          {activeTab === 'looks' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'saved' && styles.tabItemActive]}
          onPress={() => setActiveTab('saved')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabLabel, activeTab === 'saved' && styles.tabLabelActive]}>
            ⊡ WARDROBE ({collections.length})
          </Text>
          {activeTab === 'saved' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {activeTab === 'looks' ? (
        <FlatList
          key="profile-looks-grid"
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderThumb}
          numColumns={COLS}
          columnWrapperStyle={styles.columnWrapper}
          ListHeaderComponent={<ListHeader />}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              tintColor={Colors.charcoal}
            />
          }
          ListFooterComponent={
            postsLoading ? (
              <GridSkeleton />
            ) : isFetchingNextPage ? (
              <View style={styles.footer}>
                <ActivityIndicator color={Colors.charcoal} size="small" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            !postsLoading ? (
              <View style={styles.empty}>
                <View style={styles.emptyIconWrap}>
                  <Text style={styles.emptyIcon}>✦</Text>
                </View>
                <Text style={styles.emptyTitle}>Curate Your Digital Lookbook</Text>
                <Text style={styles.emptyBody}>
                  Publish your daily fits, tag your favorite brands, and inspire the fashion community.
                </Text>
                <TouchableOpacity
                  style={styles.emptyCta}
                  onPress={() => router.push('/(tabs)/create')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.emptyCtaText}>+ Post Your First Look</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        /* Saved Collections / Moodboards Tab */
        <FlatList
          key="profile-wardrobe-grid"
          data={collections}
          keyExtractor={(item) => item.id}
          renderItem={renderCollectionCard}
          numColumns={2}
          columnWrapperStyle={styles.collectionsColumnWrapper}
          ListHeaderComponent={
            <>
              <ListHeader />
              <View style={styles.boardsHeaderBar}>
                <Text style={styles.boardsHeaderTitle}>CURATED MOODBOARDS</Text>
                <TouchableOpacity
                  style={styles.boardsHeaderCreateBtn}
                  onPress={() => setIsCreateBoardModalOpen(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.boardsHeaderCreateText}>+ New Moodboard</Text>
                </TouchableOpacity>
              </View>
            </>
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              tintColor={Colors.charcoal}
            />
          }
          ListEmptyComponent={
            !collectionsLoading ? (
              <View style={styles.empty}>
                <View style={styles.emptyIconWrap}>
                  <Text style={styles.emptyIcon}>⊡</Text>
                </View>
                <Text style={styles.emptyTitle}>Create Your Wardrobe Boards</Text>
                <Text style={styles.emptyBody}>
                  Save looks, categorize wishlist formulas, and design style capsules.
                </Text>
                <TouchableOpacity
                  style={styles.emptyCta}
                  onPress={() => setIsCreateBoardModalOpen(true)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.emptyCtaText}>+ Create First Moodboard</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ─── Modal: Edit Style DNA / Signature ─── */}
      <Modal
        visible={isStyleModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsStyleModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>STYLE SIGNATURE</Text>
                <Text style={styles.modalSubtitle}>Choose aesthetic formulas that represent your wardrobe.</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsStyleModalOpen(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.modalPillsContainer}>
                {STYLE_CATEGORIES.map((cat) => {
                  const isSelected = selectedStyles.includes(cat);
                  const label = STYLE_CATEGORY_LABELS[cat] || cat.replace(/_/g, ' ');
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.modalStylePill, isSelected && styles.modalStylePillSelected]}
                      onPress={() => handleToggleStyle(cat)}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.modalStylePillText,
                          isSelected && styles.modalStylePillTextSelected,
                        ]}
                      >
                        {isSelected ? '✓ ' : '✦ '}
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsStyleModalOpen(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveStyles}
                activeOpacity={0.85}
                disabled={isSavingStyles}
              >
                {isSavingStyles ? (
                  <ActivityIndicator color={Colors.warmWhite} size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Save Style DNA ({selectedStyles.length})</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Modal: Create New Moodboard / Collection ─── */}
      <Modal
        visible={isCreateBoardModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsCreateBoardModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>NEW MOODBOARD</Text>
                <Text style={styles.modalSubtitle}>Curate an inspiration board or wardrobe capsule.</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsCreateBoardModalOpen(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalInputWrap}>
              <Text style={styles.inputLabel}>BOARD NAME</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Parisian Autumn, Streetwear Fits..."
                placeholderTextColor={Colors.midGray}
                value={boardName}
                onChangeText={setBoardName}
                maxLength={50}
              />

              <Text style={[styles.inputLabel, { marginTop: Spacing[4] }]}>DESCRIPTION (OPTIONAL)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="What inspires this moodboard collection?"
                placeholderTextColor={Colors.midGray}
                value={boardDesc}
                onChangeText={setBoardDesc}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsCreateBoardModalOpen(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleCreateBoard}
                activeOpacity={0.85}
                disabled={createCollectionMutation.isPending}
              >
                {createCollectionMutation.isPending ? (
                  <ActivityIndicator color={Colors.warmWhite} size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Create Board</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.warmWhite,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContainer: {
    backgroundColor: Colors.warmWhite,
    paddingBottom: Spacing[1],
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  handleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  handleText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    fontWeight: '800',
    letterSpacing: 2,
    color: Colors.charcoal,
  },
  curatorBadge: {
    backgroundColor: '#F3EFEA',
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: '#E8E2D9',
  },
  curatorBadgeText: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#8A7968',
  },
  privateBadge: {
    fontSize: 12,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
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
  iconText: {
    fontSize: 15,
    color: Colors.charcoal,
    fontWeight: '700',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4],
    gap: Spacing[4],
  },
  avatarContainer: {
    position: 'relative',
    width: 86,
    height: 86,
  },
  avatarOuterRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    padding: 2,
    borderWidth: 2,
    borderColor: Colors.charcoal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrap: {
    width: '100%',
    height: '100%',
    borderRadius: 41,
    overflow: 'hidden',
    backgroundColor: Colors.softGray,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.charcoal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: Typography.fontBody,
    fontSize: Typography['2xl'],
    fontWeight: '700',
    color: Colors.warmWhite,
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.charcoal,
    borderWidth: 2,
    borderColor: Colors.warmWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    fontSize: 13,
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[2],
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statBlock: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.base,
    fontWeight: '800',
    color: Colors.charcoal,
  },
  statLabel: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 22,
    backgroundColor: Colors.borderLight,
  },
  bioSection: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
    gap: Spacing[1],
  },
  displayNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  displayName: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.base,
    fontWeight: '800',
    color: Colors.charcoal,
  },
  verifiedStar: {
    fontSize: 14,
    color: Colors.charcoal,
    fontWeight: '800',
  },
  bioText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.charcoal,
    lineHeight: Typography.sm * 1.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginTop: 4,
  },
  locationPill: {
    backgroundColor: Colors.softGray,
    paddingHorizontal: Spacing[2] + 2,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  locationText: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  tierPill: {
    backgroundColor: '#FAF5EE',
    borderWidth: 1,
    borderColor: '#EFE7DA',
    paddingHorizontal: Spacing[2] + 2,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  tierText: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#8B7355',
  },
  aestheticSection: {
    paddingTop: Spacing[3],
  },
  aestheticHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    marginBottom: Spacing[2],
  },
  aestheticSectionTitle: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: Colors.textSecondary,
  },
  editAestheticBtn: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
  },
  editAestheticText: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  aestheticScroll: {
    paddingHorizontal: Spacing[4],
    gap: Spacing[2],
  },
  aestheticChip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing[3],
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  aestheticText: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.charcoal,
    letterSpacing: 0.3,
  },
  addAestheticChip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.charcoal,
    paddingHorizontal: Spacing[3],
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  addAestheticText: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[2],
    gap: Spacing[2],
  },
  primaryActionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[2] + 3,
    borderRadius: Radii.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  primaryActionText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  newLookBtn: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[2] + 3,
    borderRadius: Radii.full,
    backgroundColor: Colors.charcoal,
  },
  newLookText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.warmWhite,
  },
  secondaryActionBtn: {
    paddingHorizontal: Spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[2] + 3,
    borderRadius: Radii.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryActionText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  tabBar: {
    flexDirection: 'row',
    marginTop: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing[3],
    position: 'relative',
  },
  tabItemActive: {},
  tabLabel: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    fontWeight: '600',
    letterSpacing: 1,
    color: Colors.textSecondary,
  },
  tabLabelActive: {
    color: Colors.charcoal,
    fontWeight: '800',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 2,
    backgroundColor: Colors.charcoal,
    borderRadius: 1,
  },
  columnWrapper: {
    gap: GAP,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE * 1.3,
    backgroundColor: Colors.softGray,
    position: 'relative',
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  multiMediaBadge: {
    position: 'absolute',
    top: Spacing[1] + 2,
    right: Spacing[1] + 2,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  multiMediaText: {
    color: Colors.warmWhite,
    fontSize: 10,
  },
  thumbOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing[1] + 2,
    paddingVertical: Spacing[1],
    backgroundColor: 'rgba(0,0,0,0.3)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  thumbStatHeart: {
    color: '#FF6B6B',
    fontSize: 10,
  },
  thumbStatText: {
    color: Colors.warmWhite,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Typography.fontBody,
  },
  boardsHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
  boardsHeaderTitle: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: Colors.textSecondary,
  },
  boardsHeaderCreateBtn: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
  },
  boardsHeaderCreateText: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  collectionsColumnWrapper: {
    paddingHorizontal: Spacing[4],
    gap: Spacing[3],
    marginBottom: Spacing[3],
  },
  collectionCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingBottom: Spacing[2],
  },
  collectionCoverWrap: {
    position: 'relative',
    width: '100%',
    height: 140,
    backgroundColor: Colors.softGray,
  },
  collectionCover: {
    width: '100%',
    height: '100%',
  },
  collectionPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F2ED',
    gap: Spacing[1],
  },
  collectionPlaceholderIcon: {
    fontSize: 28,
    color: Colors.charcoal,
  },
  collectionPlaceholderLabel: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  collectionBadge: {
    position: 'absolute',
    bottom: Spacing[2],
    right: Spacing[2],
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderRadius: Radii.full,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
  },
  collectionBadgeText: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.warmWhite,
  },
  collectionName: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.charcoal,
    paddingHorizontal: Spacing[2],
    paddingTop: Spacing[2],
  },
  collectionDesc: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing[2],
    marginTop: 2,
  },
  footer: {
    paddingVertical: Spacing[6],
    alignItems: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[8],
    paddingVertical: Spacing[10],
    gap: Spacing[3],
  },
  emptyIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.softGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 26,
    color: Colors.charcoal,
  },
  emptyTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.xl,
    color: Colors.charcoal,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.sm * 1.5,
    maxWidth: 280,
  },
  emptyCta: {
    marginTop: Spacing[2],
    backgroundColor: Colors.charcoal,
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    borderRadius: Radii.full,
  },
  emptyCtaText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.warmWhite,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.warmWhite,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    paddingTop: Spacing[4],
    paddingBottom: Spacing[6],
    paddingHorizontal: Spacing[4],
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.base,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: Colors.charcoal,
  },
  modalSubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
    maxWidth: 280,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.softGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    color: Colors.charcoal,
    fontWeight: '700',
  },
  modalScroll: {
    maxHeight: 320,
    marginVertical: Spacing[3],
  },
  modalPillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
    paddingVertical: Spacing[2],
  },
  modalStylePill: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Radii.full,
  },
  modalStylePillSelected: {
    backgroundColor: Colors.charcoal,
    borderColor: Colors.charcoal,
  },
  modalStylePillText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.charcoal,
  },
  modalStylePillTextSelected: {
    color: Colors.warmWhite,
    fontWeight: '700',
  },
  modalInputWrap: {
    paddingVertical: Spacing[4],
  },
  inputLabel: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: Colors.textSecondary,
    marginBottom: Spacing[1],
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[3],
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.charcoal,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingTop: Spacing[2],
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: Spacing[3],
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.charcoal,
  },
  modalSaveBtn: {
    flex: 2,
    backgroundColor: Colors.charcoal,
    paddingVertical: Spacing[3],
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.warmWhite,
  },
});
