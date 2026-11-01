// ============================================================
// Saved & Curated Archives — OOTDi Editorial Studio
// Personal Lookbooks, Capsules & Saved Editorial Fits
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
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../src/design/tokens';
import { useMyCollections, useCreateCollection } from '../../src/hooks/useCollections';
import { useSavedOutfits } from '../../src/hooks/useOutfitFeed';
import { useAuthStore } from '../../src/stores/authStore';
import { useQueryClient } from '@tanstack/react-query';
import type { Collection, OutfitPost } from '@tavallin/shared';

const OOTDiLogo = require('../../assets/images/ootdi-logo.png');
const { width: SW } = Dimensions.get('window');
const H_PAD = 16;
const GAP = 12;
const CARD_WIDTH = (SW - H_PAD * 2 - GAP) / 2;
const RECENT_CARD_W = 118;
const RECENT_CARD_H = 154;

type TabKey = 'collections' | 'all' | 'tagged';

interface CuratedMoodboard {
  id: string;
  name: string;
  outfitCount: number;
  isPublic: boolean;
  images: string[];
}

const FALLBACK_MOODBOARDS: CuratedMoodboard[] = [
  {
    id: 'mb-seoul-autumn',
    name: 'Seoul Autumn Tail...',
    outfitCount: 34,
    isPublic: true,
    images: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    ],
  },
  {
    id: 'mb-minimalist-staples',
    name: 'Minimalist Staples',
    outfitCount: 52,
    isPublic: false,
    images: [
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&auto=format&fit=crop&q=80',
    ],
  },
  {
    id: 'mb-weekend-coffee',
    name: 'Weekend Coffee',
    outfitCount: 19,
    isPublic: true,
    images: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80',
    ],
  },
  {
    id: 'mb-gallery-openings',
    name: 'Gallery Openings',
    outfitCount: 12,
    isPublic: true,
    images: [
      'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80',
    ],
  },
];

const FALLBACK_RECENT_SAVED = [
  {
    id: 'rec-1',
    brand: 'LOW CLASSIC',
    garment: 'Oversized Coat',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'rec-2',
    brand: 'ANDERSSON B...',
    garment: 'Sculptural Denim',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'rec-3',
    brand: 'NOTHING WRI...',
    garment: 'Pure Poplin Set',
    image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'rec-4',
    brand: 'TOTEME',
    garment: 'Scarf Wool Coat',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'rec-5',
    brand: 'LEMAIRE',
    garment: 'Croissant Bag',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80',
  },
];

const FALLBACK_TAGGED_ITEMS = [
  {
    id: 'tag-1',
    brand: 'LOW CLASSIC',
    name: 'Belted Trench Coat in Charcoal',
    category: 'Outerwear',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80',
    savedCount: 142,
  },
  {
    id: 'tag-2',
    brand: 'LEMAIRE',
    name: 'Small Croissant Bag Nappa',
    category: 'Bags & Leather',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80',
    savedCount: 289,
  },
  {
    id: 'tag-3',
    brand: 'NEW BALANCE',
    name: '990v5 Made in USA Grey',
    category: 'Footwear',
    image: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&auto=format&fit=crop&q=80',
    savedCount: 310,
  },
  {
    id: 'tag-4',
    brand: 'JIL SANDER',
    name: 'Sculptural Silver Ring Set',
    category: 'Jewelry',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&auto=format&fit=crop&q=80',
    savedCount: 95,
  },
];

export default function SavedScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);

  const [activeTab, setActiveTab] = useState<TabKey>('collections');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortAsc, setSortAsc] = useState(false);

  // Create Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [boardName, setBoardName] = useState('');
  const [boardDesc, setBoardDesc] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  // Queries
  const {
    data: collections = [],
    isLoading: collectionsLoading,
    isRefetching: collectionsRefetching,
    refetch: refetchCollections,
  } = useMyCollections();

  const {
    data: savedData,
    isLoading: savedLoading,
    isRefetching: savedRefetching,
    refetch: refetchSaved,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSavedOutfits();

  const createCollectionMutation = useCreateCollection();

  const savedPosts = useMemo(
    () => savedData?.pages.flatMap((p) => p.posts) ?? [],
    [savedData],
  );

  // Combine real user collections with curated moodboards
  const displayedMoodboards = useMemo(() => {
    if (!collections || collections.length === 0) {
      return FALLBACK_MOODBOARDS;
    }
    const realMapped: CuratedMoodboard[] = collections.map((col: any, index) => {
      const fallbackSet = FALLBACK_MOODBOARDS[index % FALLBACK_MOODBOARDS.length]!;
      const previewImgs: string[] = Array.isArray(col.previewImages) && col.previewImages.length > 0
        ? col.previewImages
        : col.coverImageUrl
        ? [col.coverImageUrl]
        : fallbackSet.images;

      return {
        id: col.id,
        name: col.name,
        outfitCount: col.itemsCount ?? 0,
        isPublic: !!col.isPublic,
        images: previewImgs.length >= 4 ? previewImgs.slice(0, 4) : [...previewImgs, ...fallbackSet.images].slice(0, 4),
      };
    });

    return sortAsc ? [...realMapped].reverse() : realMapped;
  }, [collections, sortAsc]);

  // Combine real saved posts with curated recent list for the carousel
  const recentSavedItems = useMemo(() => {
    if (savedPosts.length > 0) {
      const defaultImg = FALLBACK_RECENT_SAVED[0]?.image ?? '';
      return savedPosts.slice(0, 10).map((post) => {
        const firstMedia = post.media?.[0] as any;
        const img = firstMedia?.thumbnailUrl || firstMedia?.publicUrl || defaultImg;
        const creator = (post.creator ?? (post as any).author) as any;
        const brand = post.styleCategories?.[0]
          ? post.styleCategories[0].toUpperCase()
          : creator?.username
          ? creator.username.toUpperCase()
          : 'EDITORIAL';
        const garment = post.caption || post.occasions?.[0] || 'Saved Look';
        return {
          id: post.id,
          brand,
          garment,
          image: img,
          isReal: true,
        };
      });
    }
    return FALLBACK_RECENT_SAVED;
  }, [savedPosts]);

  const handleCreateBoard = async () => {
    if (!boardName.trim()) {
      Alert.alert('Title Required', 'Please enter a name for your moodboard capsule.');
      return;
    }
    try {
      const payload: { name: string; description?: string; isPublic?: boolean } = {
        name: boardName.trim(),
        isPublic: !isPrivate,
      };
      if (boardDesc.trim()) {
        payload.description = boardDesc.trim();
      }
      await createCollectionMutation.mutateAsync(payload);
      setBoardName('');
      setBoardDesc('');
      setIsPrivate(false);
      setIsCreateModalOpen(false);
      await qc.invalidateQueries({ queryKey: ['collections', 'me'] });
    } catch (err) {
      console.error('Create board error:', err);
      Alert.alert('Error', 'Could not create moodboard. Please try again.');
    }
  };

  // Render 2x2 collage mosaic
  const renderCollageMosaic = (images: string[]) => {
    const safeImages = [...images];
    const defaultCollageImgs = FALLBACK_MOODBOARDS[0]?.images ?? [];
    while (safeImages.length < 4) {
      const fallbackImg = defaultCollageImgs[safeImages.length % defaultCollageImgs.length] ?? '';
      safeImages.push(fallbackImg);
    }
    return (
      <View style={styles.collageContainer}>
        <View style={styles.collageRow}>
          <Image
            source={{ uri: safeImages[0] ?? '' }}
            style={styles.collageItem}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
          <View style={styles.collageGapH} />
          <Image
            source={{ uri: safeImages[1] ?? '' }}
            style={styles.collageItem}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
        </View>
        <View style={styles.collageGapV} />
        <View style={styles.collageRow}>
          <Image
            source={{ uri: safeImages[2] ?? '' }}
            style={styles.collageItem}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
          <View style={styles.collageGapH} />
          <Image
            source={{ uri: safeImages[3] ?? '' }}
            style={styles.collageItem}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
        </View>
      </View>
    );
  };

  const collectionsCount = collections.length > 0 ? collections.length : 14;
  const savedCount = savedPosts.length > 0 ? savedPosts.length : 428;
  const taggedCount = 18;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ─── Header Bar: OOTDI / SAVED COLLECTIONS ─── */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <RNImage source={OOTDiLogo} style={styles.headerLogo} resizeMode="contain" />
          <Text style={styles.headerBrand}>OOTDI</Text>
          <Text style={styles.headerCrumb}>/ SAVED COLLECTIONS</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => setShowSearch(!showSearch)}
            activeOpacity={0.7}
          >
            <Feather name={showSearch ? 'x' : 'search'} size={19} color="#1C1C1E" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => router.push('/(tabs)/notifications')}
            activeOpacity={0.7}
          >
            <Feather name="bell" size={19} color="#1C1C1E" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.8}
          >
            {currentUser?.avatarUrl ? (
              <Image source={{ uri: currentUser.avatarUrl }} style={styles.avatarImg} contentFit="cover" />
            ) : (
              <RNImage
                source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80' }}
                style={styles.avatarImg}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Slide-down Search Input ─── */}
      {showSearch && (
        <View style={styles.searchBar}>
          <Feather name="search" size={15} color="#8A857D" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search saved lookbooks, moodboards, tags…"
            placeholderTextColor="#A8A39B"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
      )}

      {/* ─── Page Title Block: Saved Collections + [+ New] ─── */}
      <View style={styles.titleBlock}>
        <View style={styles.titleTextWrap}>
          <Text style={styles.pageTitle}>Saved Collections</Text>
          <Text style={styles.pageSubtitle}>Curated lookbooks & bookmarked outfit inspirations</Text>
        </View>
        <TouchableOpacity
          style={styles.newPillBtn}
          onPress={() => setIsCreateModalOpen(true)}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={14} color="#FFFFFF" style={{ marginRight: 3 }} />
          <Text style={styles.newPillText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Tab Bar: Collections 14 | All Saved Outfits 428 | Tagged Items 18 ─── */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'collections' && styles.tabItemActive]}
          onPress={() => setActiveTab('collections')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'collections' && styles.tabTextActive]}>
            Collections <Text style={styles.tabCount}>{collectionsCount}</Text>
          </Text>
          {activeTab === 'collections' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'all' && styles.tabItemActive]}
          onPress={() => setActiveTab('all')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
            All Saved Outfits <Text style={styles.tabCount}>{savedCount}</Text>
          </Text>
          {activeTab === 'all' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'tagged' && styles.tabItemActive]}
          onPress={() => setActiveTab('tagged')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'tagged' && styles.tabTextActive]}>
            Tagged Items <Text style={styles.tabCount}>{taggedCount}</Text>
          </Text>
          {activeTab === 'tagged' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      {/* ─── Tab Content ─── */}
      {activeTab === 'collections' ? (
        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={collectionsRefetching}
              onRefresh={() => void refetchCollections()}
              tintColor="#1C1C1E"
            />
          }
        >
          {/* ─── RECENTLY SAVED Carousel ─── */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleWithDot}>
              <Text style={styles.sectionTitle}>RECENTLY SAVED</Text>
              <View style={styles.blackDot} />
            </View>
            <TouchableOpacity onPress={() => setActiveTab('all')} activeOpacity={0.7} style={styles.viewAllBtn}>
              <Text style={styles.viewAllText}>View All</Text>
              <Feather name="chevron-right" size={13} color="#6E6860" />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentCarousel}
          >
            {recentSavedItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.recentCard}
                activeOpacity={0.88}
                onPress={() => {
                  if ((item as any).isReal) {
                    router.push(`/outfit/${item.id}`);
                  } else {
                    router.push('/(tabs)/explore');
                  }
                }}
              >
                <View style={styles.recentThumbWrap}>
                  <Image
                    source={{ uri: item.image }}
                    style={styles.recentThumb}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                  />
                  {/* Floating Bookmark Pill Overlay */}
                  <View style={styles.bookmarkOverlayBtn}>
                    <Ionicons name="bookmark" size={12} color="#1C1C1E" />
                  </View>
                </View>
                <Text style={styles.recentBrand} numberOfLines={1}>
                  {item.brand}
                </Text>
                <Text style={styles.recentGarment} numberOfLines={1}>
                  {item.garment}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ─── MOODBOARDS ( 4 ) ─── */}
          <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
            <Text style={styles.sectionTitle}>
              MOODBOARDS <Text style={styles.countParen}>({displayedMoodboards.length})</Text>
            </Text>
            <TouchableOpacity
              style={styles.sortBtn}
              onPress={() => setSortAsc(!sortAsc)}
              activeOpacity={0.7}
            >
              <Ionicons name="swap-vertical" size={13} color="#4A4641" style={{ marginRight: 4 }} />
              <Text style={styles.sortText}>RECENTLY UPDATED</Text>
            </TouchableOpacity>
          </View>

          {/* 2-Column Moodboard Grid */}
          <View style={styles.moodboardGrid}>
            {displayedMoodboards.map((board) => (
              <TouchableOpacity
                key={board.id}
                style={styles.moodboardCard}
                activeOpacity={0.88}
                onPress={() => {
                  if (board.id.startsWith('mb-')) {
                    Alert.alert(board.name, `${board.outfitCount} curated editorial looks in this capsule moodboard.`);
                  } else {
                    router.push(`/collection/${board.id}`);
                  }
                }}
              >
                {/* 2x2 Collage Mosaic */}
                {renderCollageMosaic(board.images)}

                {/* Moodboard Meta */}
                <View style={styles.moodboardInfo}>
                  <View style={styles.moodboardTitleRow}>
                    <Text style={styles.moodboardTitle} numberOfLines={1}>
                      {board.name}
                    </Text>
                    <Ionicons
                      name={board.isPublic ? 'globe-outline' : 'lock-closed-outline'}
                      size={13}
                      color="#4A4641"
                    />
                  </View>
                  <Text style={styles.moodboardSubtitle}>
                    {board.outfitCount} OUTFITS • {board.isPublic ? 'PUBLIC' : 'PRIVATE'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* ─── Create New Moodboard CTA Banner ─── */}
          <TouchableOpacity
            style={styles.ctaBanner}
            onPress={() => setIsCreateModalOpen(true)}
            activeOpacity={0.85}
          >
            <View style={styles.ctaIconBox}>
              <Ionicons name="images-outline" size={20} color="#1C1C1E" />
            </View>
            <View style={styles.ctaTextBox}>
              <Text style={styles.ctaTitle}>Create New Moodboard</Text>
              <Text style={styles.ctaSubtitle}>Organize outfits by season, silhouette or colorway</Text>
            </View>
            <View style={styles.ctaArrowCircle}>
              <Feather name="arrow-right" size={16} color="#1C1C1E" />
            </View>
          </TouchableOpacity>
        </ScrollView>
      ) : activeTab === 'all' ? (
        // ─── TAB 2: All Saved Outfits Grid ───
        <FlatList
          data={savedPosts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.fitColumnWrapper}
          contentContainerStyle={styles.fitsListContent}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
          }}
          refreshControl={
            <RefreshControl
              refreshing={savedRefetching}
              onRefresh={() => void refetchSaved()}
              tintColor="#1C1C1E"
            />
          }
          renderItem={({ item }: { item: OutfitPost }) => {
            const firstMedia = item.media?.[0] as any;
            const imgUrl = firstMedia?.url ?? firstMedia?.publicUrl ?? '';
            const creator = (item.creator ?? (item as any).author) as any;
            return (
              <TouchableOpacity
                style={styles.fitCard}
                activeOpacity={0.88}
                onPress={() => router.push(`/outfit/${item.id}`)}
              >
                <View style={styles.fitThumbWrap}>
                  {imgUrl ? (
                    <Image
                      source={{ uri: imgUrl }}
                      style={styles.fitThumb}
                      contentFit="cover"
                      transition={200}
                      cachePolicy="memory-disk"
                    />
                  ) : (
                    <View style={styles.fitThumbEmpty}>
                      <Ionicons name="image-outline" size={32} color="#C4BEB6" />
                    </View>
                  )}
                  <View style={styles.bookmarkOverlayBtn}>
                    <Ionicons name="bookmark" size={12} color="#1C1C1E" />
                  </View>
                </View>
                <View style={styles.fitInfo}>
                  <Text style={styles.fitCreator} numberOfLines={1}>
                    @{creator?.username ?? 'curator'}
                  </Text>
                  <View style={styles.fitLikesRow}>
                    <Ionicons name="heart" size={11} color={Colors.likeActive} />
                    <Text style={styles.fitLikes}>{item.likesCount ?? 0}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyCircle}>
                <Ionicons name="bookmark-outline" size={32} color="#1C1C1E" />
              </View>
              <Text style={styles.emptyTitle}>No Saved Looks Yet</Text>
              <Text style={styles.emptySubtitle}>
                Bookmark outfits from the home feed or explore trends to build your personal capsule library.
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/(tabs)/explore')}
                activeOpacity={0.85}
              >
                <Text style={styles.emptyButtonText}>EXPLORE TRENDS & FITS</Text>
              </TouchableOpacity>
            </View>
          }
        />
      ) : (
        // ─── TAB 3: Tagged Items ───
        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={styles.fitsListContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.taggedGrid}>
            {FALLBACK_TAGGED_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.taggedCard}
                activeOpacity={0.88}
                onPress={() => Alert.alert(item.name, `${item.brand} • ${item.category}`)}
              >
                <View style={styles.taggedThumbWrap}>
                  <Image source={{ uri: item.image }} style={styles.fitThumb} contentFit="cover" />
                  <View style={styles.taggedCategoryPill}>
                    <Text style={styles.taggedCategoryText}>{item.category.toUpperCase()}</Text>
                  </View>
                </View>
                <View style={styles.taggedInfo}>
                  <Text style={styles.taggedBrand}>{item.brand}</Text>
                  <Text style={styles.taggedName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.taggedSavedCount}>{item.savedCount} saves</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {/* ─── Create Moodboard Modal ─── */}
      <Modal
        visible={isCreateModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsCreateModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalTopBar}>
              <View>
                <Text style={styles.modalOverline}>ATELIER CURATION</Text>
                <Text style={styles.modalHeading}>New Capsule Moodboard</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsCreateModalOpen(false)}
                style={styles.modalCloseCircle}
                activeOpacity={0.7}
              >
                <Feather name="x" size={18} color="#1C1C1E" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalFieldGroup}>
              <Text style={styles.modalFieldLabel}>MOODBOARD TITLE</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Seoul Autumn Tailoring, Weekend Coffee"
                placeholderTextColor="#A8A39B"
                value={boardName}
                onChangeText={setBoardName}
                maxLength={50}
                autoFocus
              />
            </View>

            <View style={styles.modalFieldGroup}>
              <Text style={styles.modalFieldLabel}>CURATOR NOTES (OPTIONAL)</Text>
              <TextInput
                style={[styles.modalInput, styles.modalInputArea]}
                placeholder="Add style thesis, color palette, or seasonal mood..."
                placeholderTextColor="#A8A39B"
                value={boardDesc}
                onChangeText={setBoardDesc}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
            </View>

            {/* Privacy switch */}
            <TouchableOpacity
              style={styles.privacyRow}
              activeOpacity={0.8}
              onPress={() => setIsPrivate(!isPrivate)}
            >
              <View style={styles.privacyLeft}>
                <Ionicons
                  name={isPrivate ? 'lock-closed-outline' : 'globe-outline'}
                  size={18}
                  color="#1C1C1E"
                />
                <View>
                  <Text style={styles.privacyTitle}>
                    {isPrivate ? 'Private Archive' : 'Public Lookbook'}
                  </Text>
                  <Text style={styles.privacySub}>
                    {isPrivate ? 'Only you can view this moodboard' : 'Visible on your editorial profile'}
                  </Text>
                </View>
              </View>
              <View style={[styles.privacyRadio, isPrivate && styles.privacyRadioActive]}>
                {isPrivate && <View style={styles.privacyRadioInner} />}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalSubmitBtn, !boardName.trim() && styles.modalSubmitDisabled]}
              onPress={handleCreateBoard}
              disabled={!boardName.trim() || createCollectionMutation.isPending}
              activeOpacity={0.85}
            >
              {createCollectionMutation.isPending ? (
                <ActivityIndicator color="#FAF8F5" size="small" />
              ) : (
                <Text style={styles.modalSubmitText}>CREATE MOODBOARD</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },

  // ─── Header Bar ──────────────────────────────────────────
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: H_PAD,
    paddingVertical: 10,
    backgroundColor: '#FAF8F5',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLogo: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  headerBrand: {
    fontFamily: Typography.fontDisplay,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#1C1C1E',
  },
  headerCrumb: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#736F68',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E6E1D8',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },

  // ─── Search Bar ──────────────────────────────────────────
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: H_PAD,
    marginBottom: 10,
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

  // ─── Title Block ─────────────────────────────────────────
  titleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: H_PAD,
    paddingTop: 8,
    paddingBottom: 14,
  },
  titleTextWrap: {
    flex: 1,
    paddingRight: 12,
    gap: 3,
  },
  pageTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: '#121212',
  },
  pageSubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: 12.5,
    color: '#6E6860',
    lineHeight: 16,
  },
  newPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  newPillText: {
    fontFamily: Typography.fontBody,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ─── Tab Bar (Underline Style) ───────────────────────────
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: H_PAD,
    borderBottomWidth: 1,
    borderBottomColor: '#EBE5DC',
    backgroundColor: '#FAF8F5',
    gap: 20,
  },
  tabItem: {
    paddingVertical: 11,
    position: 'relative',
  },
  tabItemActive: {},
  tabText: {
    fontFamily: Typography.fontBody,
    fontSize: 13,
    fontWeight: '600',
    color: '#736F68',
  },
  tabTextActive: {
    fontWeight: '800',
    color: '#121212',
  },
  tabCount: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#8A857D',
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

  // ─── Scroll Body ─────────────────────────────────────────
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: H_PAD,
    paddingTop: 18,
    paddingBottom: 40,
  },

  // ─── Section Header Row ──────────────────────────────────
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleWithDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontFamily: Typography.fontBody,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#1C1C1E',
  },
  blackDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#1C1C1E',
  },
  countParen: {
    color: '#736F68',
    fontWeight: '600',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontFamily: Typography.fontBody,
    fontSize: 12,
    fontWeight: '600',
    color: '#6E6860',
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortText: {
    fontFamily: Typography.fontBody,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: '#4A4641',
  },

  // ─── Recently Saved Carousel ─────────────────────────────
  recentCarousel: {
    gap: 12,
    paddingBottom: 4,
  },
  recentCard: {
    width: RECENT_CARD_W,
  },
  recentThumbWrap: {
    width: RECENT_CARD_W,
    height: RECENT_CARD_H,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#ECE7DF',
    position: 'relative',
  },
  recentThumb: {
    width: '100%',
    height: '100%',
  },
  bookmarkOverlayBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  recentBrand: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#1C1C1E',
    marginTop: 6,
  },
  recentGarment: {
    fontFamily: Typography.fontBody,
    fontSize: 10.5,
    color: '#6E6860',
    marginTop: 1,
  },

  // ─── Moodboard Grid (2-Column) ───────────────────────────
  moodboardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  moodboardCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ECE7DF',
    paddingBottom: 8,
  },
  collageContainer: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 0.98,
    backgroundColor: '#FFFFFF',
    padding: 3,
  },
  collageRow: {
    flex: 1,
    flexDirection: 'row',
  },
  collageItem: {
    flex: 1,
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#ECE7DF',
  },
  collageGapH: {
    width: 3,
  },
  collageGapV: {
    height: 3,
  },
  moodboardInfo: {
    paddingHorizontal: 8,
    paddingTop: 8,
    gap: 3,
  },
  moodboardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  moodboardTitle: {
    fontFamily: Typography.fontBody,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1C1C1E',
    flex: 1,
  },
  moodboardSubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: '#736F68',
  },

  // ─── CTA Banner ──────────────────────────────────────────
  ctaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3EF',
    borderRadius: 16,
    padding: 14,
    marginTop: 22,
    borderWidth: 1,
    borderColor: '#EAE5DC',
    gap: 12,
  },
  ctaIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  ctaTextBox: {
    flex: 1,
    gap: 2,
  },
  ctaTitle: {
    fontFamily: Typography.fontBody,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  ctaSubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    color: '#6E6860',
    lineHeight: 14,
  },
  ctaArrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },

  // ─── Fits Grid (Tab 2) ───────────────────────────────────
  fitsListContent: {
    padding: H_PAD,
    paddingBottom: 40,
  },
  fitColumnWrapper: {
    gap: GAP,
    marginBottom: GAP,
  },
  fitCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EAE5DC',
  },
  fitThumbWrap: {
    width: '100%',
    height: CARD_WIDTH * 1.35,
    backgroundColor: '#ECE7DF',
    position: 'relative',
  },
  fitThumb: {
    width: '100%',
    height: '100%',
  },
  fitThumbEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fitInfo: {
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fitCreator: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    fontWeight: '700',
    color: '#1C1C1E',
    flex: 1,
  },
  fitLikesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  fitLikes: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    fontWeight: '600',
    color: '#6E6860',
  },

  // ─── Tagged Grid (Tab 3) ─────────────────────────────────
  taggedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  taggedCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EAE5DC',
    paddingBottom: 8,
  },
  taggedThumbWrap: {
    width: '100%',
    height: CARD_WIDTH * 1.1,
    backgroundColor: '#ECE7DF',
    position: 'relative',
  },
  taggedCategoryPill: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(28,28,30,0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  taggedCategoryText: {
    fontFamily: Typography.fontBody,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: '#FFFFFF',
  },
  taggedInfo: {
    padding: 8,
    gap: 2,
  },
  taggedBrand: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#1C1C1E',
  },
  taggedName: {
    fontFamily: Typography.fontBody,
    fontSize: 10.5,
    color: '#6E6860',
    lineHeight: 14,
  },
  taggedSavedCount: {
    fontFamily: Typography.fontBody,
    fontSize: 9.5,
    fontWeight: '600',
    color: '#A8A39B',
    marginTop: 2,
  },

  // ─── Empty State ─────────────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EBE5DC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  emptySubtitle: {
    fontFamily: Typography.fontBody,
    fontSize: 12.5,
    color: '#6E6860',
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyButton: {
    marginTop: 8,
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 22,
  },
  emptyButtonText: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#FAF8F5',
  },

  // ─── Modal ───────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FAF8F5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    gap: 16,
  },
  modalTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalOverline: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: Colors.gold,
  },
  modalHeading: {
    fontFamily: Typography.fontDisplay,
    fontSize: 19,
    fontWeight: '700',
    color: '#1C1C1E',
    marginTop: 2,
  },
  modalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECE7DF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFieldGroup: {
    gap: 6,
  },
  modalFieldLabel: {
    fontFamily: Typography.fontBody,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#1C1C1E',
  },
  modalInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E1D8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontFamily: Typography.fontBody,
    fontSize: 13,
    color: '#1C1C1E',
  },
  modalInputArea: {
    height: 74,
    textAlignVertical: 'top',
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E6E1D8',
  },
  privacyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  privacyTitle: {
    fontFamily: Typography.fontBody,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  privacySub: {
    fontFamily: Typography.fontBody,
    fontSize: 10.5,
    color: '#6E6860',
  },
  privacyRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#C4BEB6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyRadioActive: {
    borderColor: '#1C1C1E',
  },
  privacyRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1C1C1E',
  },
  modalSubmitBtn: {
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  modalSubmitDisabled: {
    opacity: 0.45,
  },
  modalSubmitText: {
    fontFamily: Typography.fontBody,
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#FAF8F5',
  },
});
