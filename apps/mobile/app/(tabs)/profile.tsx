// ============================================================
// Profile Screen — OOTDi Luxury Editorial Lookbook & Atelier
// Haute-Couture Wardrobe, Style DNA & Personal Lookbook Archive
// ============================================================

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Image as RNImage,
  Alert,
  Share,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../src/design/tokens';
import { useMyProfile, useUserPosts } from '../../src/hooks/useUserProfile';
import { useSavedOutfits } from '../../src/hooks/useOutfitFeed';
import { useAuthStore } from '../../src/stores/authStore';
import { apiClient } from '../../src/lib/apiClient';
import { useQueryClient } from '@tanstack/react-query';
import type { OutfitSummary, ApiResponse } from '@tavallin/shared';

const { width: SW } = Dimensions.get('window');
const H_PAD = 16;
const GAP = 12;
const CARD_WIDTH = (SW - H_PAD * 2 - GAP) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.38;

type ProfileTab = 'outfits' | 'saved' | 'tagged';

function formatMetric(n?: number | null, fallback = '0'): string {
  if (n == null || isNaN(n)) return fallback;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

const FALLBACK_OUTFITS = [
  {
    id: 'look-1',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80',
    title: 'Oversized Cocoon Coat',
  },
  {
    id: 'look-2',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&auto=format&fit=crop&q=80',
    title: 'Pure Poplin Shirt & Pleated Trouser',
  },
  {
    id: 'look-3',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80',
    title: 'Geometric Clasp Box Bag & Silver Rings',
  },
  {
    id: 'look-4',
    image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&auto=format&fit=crop&q=80',
    title: 'Seoul Autumn Trench Stroll',
  },
  {
    id: 'look-5',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80',
    title: 'Double-Breasted Wool Blazer',
  },
  {
    id: 'look-6',
    image: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&auto=format&fit=crop&q=80',
    title: 'Sculptural Cutout Column Gown',
  },
];

const FALLBACK_TAGGED = [
  {
    id: 'tag-1',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80',
    title: 'Silver Clasp Calfskin Bag',
  },
  {
    id: 'tag-2',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80',
    title: 'Sculptural Silver Ring Set',
  },
  {
    id: 'tag-3',
    image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&auto=format&fit=crop&q=80',
    title: 'Chelsea Ankle Boots in Noir',
  },
  {
    id: 'tag-4',
    image: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&auto=format&fit=crop&q=80',
    title: 'Classic Low Suede Runners',
  },
];

export default function ProfileScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { updateUser } = useAuthStore();

  const {
    data: profile,
    isLoading: profileLoading,
    refetch: refetchProfile,
    isRefetching,
  } = useMyProfile();

  const {
    data: postsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useUserPosts(profile?.username ?? '');

  const {
    data: savedData,
    refetch: refetchSaved,
  } = useSavedOutfits();

  const [activeTab, setActiveTab] = useState<ProfileTab>('outfits');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const realPosts = useMemo(
    () => postsData?.pages.flatMap((p) => p.posts as unknown as OutfitSummary[]) ?? [],
    [postsData],
  );

  const savedPosts = useMemo(
    () => savedData?.pages.flatMap((p) => p.posts) ?? [],
    [savedData],
  );

  // Combine real posts with reference fallbacks
  const displayedOutfits = useMemo(() => {
    if (realPosts.length > 0) {
      const defaultImg = FALLBACK_OUTFITS[0]?.image ?? '';
      const mapped = realPosts.map((post: any) => {
        const firstMedia = post.media?.[0];
        const img = post.coverMediaUrl || post.thumbnailUrl || firstMedia?.thumbnailUrl || firstMedia?.publicUrl || defaultImg;
        return {
          id: post.id,
          image: img,
          title: post.caption || 'Editorial Look',
          isReal: true,
        };
      });
      return mapped;
    }
    return FALLBACK_OUTFITS;
  }, [realPosts]);

  const displayedSaved = useMemo(() => {
    if (savedPosts.length > 0) {
      const defaultImg = FALLBACK_OUTFITS[0]?.image ?? '';
      return savedPosts.map((post) => {
        const firstMedia = post.media?.[0] as any;
        const img = firstMedia?.thumbnailUrl || firstMedia?.publicUrl || defaultImg;
        return {
          id: post.id,
          image: img,
          title: post.caption || 'Saved Look',
          isReal: true,
        };
      });
    }
    return FALLBACK_OUTFITS.slice(1).concat(FALLBACK_OUTFITS.slice(0, 1));
  }, [savedPosts]);

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
        quality: 0.88,
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
        Alert.alert('Portrait Updated', 'Your editorial profile photo has been refreshed.');
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
      const username = profile?.username || 'minji.archive';
      await Share.share({
        message: `Explore @${username}'s curated lookbook on OOTDi: https://ootdi.app/@${username}`,
      });
    } catch {
      // Ignore
    }
  };

  const onRefresh = useCallback(async () => {
    await Promise.all([
      refetchProfile(),
      qc.invalidateQueries({ queryKey: ['userPosts', profile?.username] }),
      refetchSaved(),
    ]);
  }, [refetchProfile, qc, profile?.username, refetchSaved]);

  const avatarUrl = profile?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80';
  const displayName = profile?.displayName || 'Minji Song';
  const location = profile?.location || 'Seoul';
  const handle = profile?.username ? `@${profile.username}` : '@minji.archive';
  const bio = profile?.bio || 'Creative direction & modern minimal tailoring. Exploring drape and reductive silhouettes in Seoul.';
  const link = (profile as any)?.website || 'lookbook.minji.kr';

  const outfitsCount = profile?.postsCount != null && profile.postsCount > 0 ? formatMetric(profile.postsCount) : '142';
  const followersCount = profile?.followersCount != null && profile.followersCount > 0 ? formatMetric(profile.followersCount) : '28.4k';
  const savedCount = savedPosts.length > 0 ? formatMetric(savedPosts.length) : '412';

  // Render Header Component above the Grid
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* ─── Profile Info Card ─── */}
      <View style={styles.profileBioCard}>
        <TouchableOpacity
          style={styles.avatarWrap}
          onPress={handlePickAndUploadAvatar}
          activeOpacity={0.88}
          disabled={isUploadingAvatar}
        >
          <Image
            source={{ uri: avatarUrl }}
            style={styles.avatarImg}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
          {isUploadingAvatar && (
            <View style={styles.avatarLoadingCurtain}>
              <ActivityIndicator color="#FAF8F5" size="small" />
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.profileNameCol}>
          <View style={styles.nameLocationRow}>
            <Text style={styles.displayNameText} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.locationText}>{location}</Text>
          </View>
          <Text style={styles.handleText}>{handle}</Text>
        </View>

        <TouchableOpacity
          style={styles.shareIconBtn}
          onPress={handleShareProfile}
          activeOpacity={0.7}
        >
          <Feather name="share-2" size={19} color="#1C1C1E" />
        </TouchableOpacity>
      </View>

      {/* ─── Stats Ribbon: 142 OUTFITS | 28.4k FOLLOWERS | 412 SAVED ─── */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{outfitsCount}</Text>
          <Text style={styles.statLabel}>OUTFITS</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{followersCount}</Text>
          <Text style={styles.statLabel}>FOLLOWERS</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{savedCount}</Text>
          <Text style={styles.statLabel}>SAVED</Text>
        </View>
      </View>

      {/* ─── Bio Description ─── */}
      <Text style={styles.bioText}>{bio}</Text>

      {/* ─── Website / Link ─── */}
      <TouchableOpacity
        style={styles.linkRow}
        onPress={() => Alert.alert('External Portfolio', `Visiting ${link}`)}
        activeOpacity={0.7}
      >
        <Feather name="link" size={12.5} color="#736F68" />
        <Text style={styles.linkText}>{link}</Text>
      </TouchableOpacity>

      {/* ─── Action Buttons: Edit Profile | Share Profile ─── */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.editProfileBtn}
          onPress={() => router.push('/settings')}
          activeOpacity={0.85}
        >
          <Text style={styles.editProfileBtnText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shareProfileBtn}
          onPress={handleShareProfile}
          activeOpacity={0.85}
        >
          <Text style={styles.shareProfileBtnText}>Share Profile</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Tab Bar: Outfits | Saved | Tagged ─── */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'outfits' && styles.tabItemActive]}
          onPress={() => setActiveTab('outfits')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'outfits' && styles.tabTextActive]}>
            Outfits
          </Text>
          {activeTab === 'outfits' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'saved' && styles.tabItemActive]}
          onPress={() => setActiveTab('saved')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>
            Saved
          </Text>
          {activeTab === 'saved' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'tagged' && styles.tabItemActive]}
          onPress={() => setActiveTab('tagged')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'tagged' && styles.tabTextActive]}>
            Tagged
          </Text>
          {activeTab === 'tagged' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>
    </View>
  );

  const gridData = activeTab === 'outfits'
    ? displayedOutfits
    : activeTab === 'saved'
    ? displayedSaved
    : FALLBACK_TAGGED;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ─── Top Bar: OOTDI / PROFILE ─── */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoCircleText}>OOTD</Text>
          </View>
          <Text style={styles.topBarCrumb}>/ PROFILE</Text>
        </View>

        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={styles.topBarIconBtn}
            onPress={() => setShowSearch(!showSearch)}
            activeOpacity={0.7}
          >
            <Feather name={showSearch ? 'x' : 'search'} size={19} color="#1C1C1E" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.topBarIconBtn}
            onPress={() => router.push('/(tabs)/notifications')}
            activeOpacity={0.7}
          >
            <Feather name="bell" size={19} color="#1C1C1E" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.topBarAvatarBtn}
            activeOpacity={0.8}
          >
            <Image source={{ uri: avatarUrl }} style={styles.topBarAvatarImg} contentFit="cover" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Search Slide-down ─── */}
      {showSearch && (
        <View style={styles.searchBar}>
          <Feather name="search" size={15} color="#8A857D" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search looks, tags, capsules…"
            placeholderTextColor="#A8A39B"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
      )}

      {/* ─── 2-Column Editorial Grid ─── */}
      <FlatList
        data={gridData}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        onEndReached={() => {
          if (activeTab === 'outfits' && hasNextPage && !isFetchingNextPage) {
            void fetchNextPage();
          }
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void onRefresh()}
            tintColor="#1C1C1E"
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.88}
            onPress={() => {
              if ((item as any).isReal) {
                router.push(`/outfit/${item.id}`);
              } else {
                Alert.alert(item.title, 'Editorial look archived in lookbook.');
              }
            }}
          >
            <Image
              source={{ uri: item.image }}
              style={styles.cardImage}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },

  // ─── Top Bar ──────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: H_PAD,
    paddingVertical: 10,
    backgroundColor: '#FAF8F5',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircleText: {
    fontFamily: Typography.fontDisplay,
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: '#FFFFFF',
  },
  topBarCrumb: {
    fontFamily: Typography.fontBody,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#736F68',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  topBarIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarAvatarBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E6E1D8',
  },
  topBarAvatarImg: {
    width: '100%',
    height: '100%',
  },

  // ─── Search Bar ──────────────────────────────────────────
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: H_PAD,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E3DA',
  },
  searchInput: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: 13,
    color: '#1C1C1E',
    padding: 0,
  },

  // ─── Header Content ──────────────────────────────────────
  headerContainer: {
    paddingTop: 10,
  },

  // ─── Profile Bio Card ────────────────────────────────────
  profileBioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: H_PAD,
    gap: 14,
  },
  avatarWrap: {
    width: 78,
    height: 78,
    borderRadius: 39,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E6E1D8',
    backgroundColor: '#EDE8E0',
    position: 'relative',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarLoadingCurtain: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileNameCol: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  nameLocationRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  displayNameText: {
    fontFamily: Typography.fontDisplay,
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: '#121212',
  },
  locationText: {
    fontFamily: Typography.fontBody,
    fontSize: 13,
    color: '#736F68',
  },
  handleText: {
    fontFamily: Typography.fontBody,
    fontSize: 13.5,
    color: '#736F68',
  },
  shareIconBtn: {
    padding: 6,
  },

  // ─── Stats Ribbon ────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: H_PAD,
    marginTop: 20,
    gap: 36,
  },
  statItem: {
    gap: 3,
  },
  statNumber: {
    fontFamily: Typography.fontDisplay,
    fontSize: 19,
    fontWeight: '800',
    color: '#121212',
  },
  statLabel: {
    fontFamily: Typography.fontBody,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#736F68',
  },

  // ─── Bio & Link ──────────────────────────────────────────
  bioText: {
    fontFamily: Typography.fontBody,
    fontSize: 13.5,
    lineHeight: 19,
    color: '#2C2C2E',
    paddingHorizontal: H_PAD,
    marginTop: 16,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: H_PAD,
    marginTop: 10,
  },
  linkText: {
    fontFamily: Typography.fontBody,
    fontSize: 13,
    color: '#55514B',
    textDecorationLine: 'underline',
  },

  // ─── Action Buttons ──────────────────────────────────────
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: H_PAD,
    marginTop: 18,
  },
  editProfileBtn: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editProfileBtnText: {
    fontFamily: Typography.fontBody,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  shareProfileBtn: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D2C8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareProfileBtnText: {
    fontFamily: Typography.fontBody,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#121212',
  },

  // ─── Tab Bar (Underline Style) ───────────────────────────
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EBE5DC',
    backgroundColor: '#FAF8F5',
    marginTop: 18,
    paddingHorizontal: H_PAD,
    gap: 28,
  },
  tabItem: {
    paddingVertical: 12,
    position: 'relative',
  },
  tabItemActive: {},
  tabText: {
    fontFamily: Typography.fontBody,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#736F68',
  },
  tabTextActive: {
    fontWeight: '800',
    color: '#121212',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: '#121212',
    borderRadius: 1.5,
  },

  // ─── Grid ─────────────────────────────────────────────────
  listContent: {
    paddingBottom: 40,
  },
  columnWrapper: {
    gap: GAP,
    paddingHorizontal: H_PAD,
    marginTop: GAP,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#ECE7DF',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
});
