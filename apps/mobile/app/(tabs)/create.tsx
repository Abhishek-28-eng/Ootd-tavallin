// ============================================================
// Create Screen — Tavallin Editorial Studio · New Lookbook Entry
// Production Ready · Ultra-Fast Animated Editor · Memory Cached
// ============================================================

import React, { useState, useCallback, useRef, useMemo, useEffect, memo } from 'react';
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
  Switch,
  Modal,
  PanResponder,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Typography, Spacing, Radii, Shadows } from '../../src/design/tokens';
import { apiClient } from '../../src/lib/apiClient';
import { hapticLight, hapticSuccess, hapticMedium, hapticSelection } from '../../src/lib/haptics';
import { STYLE_CATEGORY_LABELS } from '@tavallin/shared';
import type { ApiResponse, OutfitPost, StyleCategory } from '@tavallin/shared';

const { width: SW, height: SH } = Dimensions.get('window');

interface PickedMedia {
  uri: string;
  type: string;
  fileName: string;
  width: number;
  height: number;
}

interface TaggedGarment {
  id: string;
  brand: string;
  name: string;
  category: string;
  spec?: string;
  price?: string;
  productUrl?: string;
  xPercent: number;
  yPercent: number;
}

type AspectRatio = '9:16' | '3:4' | '2:3' | '4:5' | '1:1' | '16:9';

const ASPECT_RATIOS: { label: string; value: AspectRatio }[] = [
  { label: '9:16 Reel', value: '9:16' },
  { label: '3:4 Portrait', value: '3:4' },
  { label: '2:3 Magazine', value: '2:3' },
  { label: '4:5 Feed', value: '4:5' },
  { label: '1:1 Square', value: '1:1' },
  { label: '16:9 Cinema', value: '16:9' },
];

const AESTHETIC_KEYS: StyleCategory[] = [
  'minimalist', 'streetwear', 'korean_streetwear', 'smart_casual',
  'formal', 'vintage', 'dark_academia', 'casual', 'athleisure', 'romantic',
];

const RATIO_MAP: Record<AspectRatio, number> = {
  '9:16': 9 / 16,
  '3:4': 3 / 4,
  '2:3': 2 / 3,
  '4:5': 4 / 5,
  '1:1': 1,
  '16:9': 16 / 9,
};

const FILTER_PRESETS = [
  { id: 'clean',  label: 'CLEAN',  overlay: null },
  { id: 'warm',   label: 'WARM',   overlay: 'rgba(255,140,60,0.18)' },
  { id: 'cool',   label: 'COOL',   overlay: 'rgba(60,110,240,0.15)' },
  { id: 'fade',   label: 'FADE',   overlay: 'rgba(240,235,225,0.28)' },
  { id: 'drama',  label: 'DRAMA',  overlay: 'rgba(0,0,0,0.25)' },
  { id: 'matte',  label: 'MATTE',  overlay: 'rgba(170,155,130,0.22)' },
  { id: 'film',   label: 'FILM',   overlay: 'rgba(200,175,120,0.2)' },
  { id: 'golden', label: 'GOLDEN', overlay: 'rgba(240,190,60,0.18)' },
  { id: 'noir',   label: 'NOIR',   overlay: 'rgba(10,10,10,0.42)' },
  { id: 'blush',  label: 'BLUSH',  overlay: 'rgba(255,170,170,0.18)' },
  { id: 'forest', label: 'FOREST', overlay: 'rgba(30,80,40,0.15)' },
  { id: 'slate',  label: 'SLATE',  overlay: 'rgba(70,95,115,0.18)' },
] as const;

type FilterId = typeof FILTER_PRESETS[number]['id'];

export type AdjustToolKey = 'brightness' | 'contrast' | 'warmth' | 'saturation' | 'shadows' | 'highlights';

interface AdjustToolConfig {
  key: AdjustToolKey;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  min: number;
  max: number;
}

const ADJUST_TOOLS: AdjustToolConfig[] = [
  { key: 'brightness', label: 'Brightness', icon: 'sun', min: -100, max: 100 },
  { key: 'contrast', label: 'Contrast', icon: 'circle', min: -100, max: 100 },
  { key: 'warmth', label: 'Warmth', icon: 'thermometer', min: -100, max: 100 },
  { key: 'saturation', label: 'Saturation', icon: 'droplet', min: -100, max: 100 },
  { key: 'shadows', label: 'Shadows', icon: 'moon', min: -100, max: 100 },
  { key: 'highlights', label: 'Highlights', icon: 'zap', min: -100, max: 100 },
];

// ============================================================
// Memoized High-Performance Adjust Slider (Zero Parent Re-render)
// Fixed: works correctly inside ScrollView via pageX delta tracking
// ============================================================
interface AdjustSliderProps {
  label: string;
  initialValue: number;
  animValue: Animated.Value;
  min?: number;
  max?: number;
  onCommit: (val: number) => void;
  onScrollLock?: (locked: boolean) => void;
}

const AdjustSlider = memo(function AdjustSlider({
  label,
  initialValue,
  animValue,
  min = -100,
  max = 100,
  onCommit,
  onScrollLock,
}: AdjustSliderProps) {
  const [displayVal, setDisplayVal] = useState(initialValue);
  const trackWRef = useRef(0);
  const onCommitRef = useRef(onCommit);
  const onScrollLockRef = useRef(onScrollLock);
  const animValRef = useRef(animValue);
  const currentValRef = useRef(initialValue);
  // Track starting pageX and starting value at grant time
  const startPageXRef = useRef(0);
  const startValRef = useRef(initialValue);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    onCommitRef.current = onCommit;
    animValRef.current = animValue;
    onScrollLockRef.current = onScrollLock;
  });

  useEffect(() => {
    setDisplayVal(initialValue);
    currentValRef.current = initialValue;
    startValRef.current = initialValue;
  }, [initialValue]);

  // Convert a value to pixel position on track
  const valToPct = useCallback(
    (v: number) => Math.max(0, Math.min(1, (v - min) / (max - min))),
    [min, max],
  );

  // Calculate new value from absolute pixel delta from start
  const calcValFromDelta = useCallback(
    (deltaX: number) => {
      if (!trackWRef.current) return startValRef.current;
      const deltaNormalized = deltaX / trackWRef.current;
      const deltaVal = deltaNormalized * (max - min);
      return Math.round(Math.max(min, Math.min(max, startValRef.current + deltaVal)));
    },
    [min, max],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        // Capture horizontal drags immediately
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: (_e, gs) => Math.abs(gs.dx) > 3,
        onMoveShouldSetPanResponderCapture: (_e, gs) => Math.abs(gs.dx) > 3,
        // Crucial: do NOT allow parent ScrollView to steal this gesture while dragging
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          isDraggingRef.current = true;
          onScrollLockRef.current?.(true);
          startPageXRef.current = e.nativeEvent.pageX;
          // Tap-to-seek: because child elements have pointerEvents="none",
          // locationX is always accurate relative to trackWrap
          if (trackWRef.current > 0) {
            const locX = Math.max(0, Math.min(e.nativeEvent.locationX, trackWRef.current));
            const tapVal = Math.round(min + (locX / trackWRef.current) * (max - min));
            currentValRef.current = tapVal;
            startValRef.current = tapVal;
            setDisplayVal(tapVal);
            animValRef.current.setValue(tapVal);
          } else {
            startValRef.current = currentValRef.current;
          }
        },
        onPanResponderMove: (_e, gs) => {
          const val = calcValFromDelta(gs.dx);
          if (val !== currentValRef.current) {
            currentValRef.current = val;
            setDisplayVal(val);
            animValRef.current.setValue(val);
          }
        },
        onPanResponderRelease: () => {
          isDraggingRef.current = false;
          onScrollLockRef.current?.(false);
          onCommitRef.current(currentValRef.current);
        },
        onPanResponderTerminate: () => {
          isDraggingRef.current = false;
          onScrollLockRef.current?.(false);
          onCommitRef.current(currentValRef.current);
        },
      }),
    [calcValFromDelta, min, max],
  );

  const pct = valToPct(displayVal);

  return (
    <View style={adjSl.row}>
      <View style={adjSl.meta}>
        <Text style={adjSl.label}>{label.toUpperCase()}</Text>
        <Text style={adjSl.val}>{displayVal > 0 ? `+${displayVal}` : String(displayVal)}</Text>
      </View>
      <View
        onLayout={(e) => {
          trackWRef.current = e.nativeEvent.layout.width;
        }}
        style={adjSl.trackWrap}
        {...panResponder.panHandlers}
      >
        <View pointerEvents="none" style={adjSl.track} />
        <View pointerEvents="none" style={[adjSl.fill, { width: `${pct * 100}%` }]} />
        <View pointerEvents="none" style={[adjSl.thumb, { left: `${pct * 100}%`, marginLeft: -9 }]} />
      </View>
    </View>
  );
});

const adjSl = StyleSheet.create({
  row: { marginBottom: Spacing[4] },
  meta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing[2] },
  label: { fontFamily: Typography.fontBody, fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: Colors.charcoal },
  val: { fontFamily: Typography.fontBody, fontSize: 10, fontWeight: '600', color: Colors.textSecondary, minWidth: 32, textAlign: 'right' },
  trackWrap: { height: 40, justifyContent: 'center', position: 'relative' },
  track: { height: 3, backgroundColor: Colors.borderLight, borderRadius: 1.5 },
  fill: { height: 3, backgroundColor: Colors.charcoal, borderRadius: 1.5, position: 'absolute', top: 18.5 },
  thumb: { position: 'absolute', top: 11, width: 18, height: 18, borderRadius: 9, backgroundColor: Colors.charcoal, ...Shadows.sm },
});


// ============================================================
// Memoized Filter Item (Smooth Caching & Zero Re-render)
// ============================================================
const FilterItem = memo(function FilterItem({
  filter,
  isSelected,
  thumbnailUri,
  onSelect,
}: {
  filter: typeof FILTER_PRESETS[number];
  isSelected: boolean;
  thumbnailUri?: string | undefined;
  onSelect: (id: FilterId) => void;
}) {
  return (
    <TouchableOpacity
      style={styles.filterItem}
      onPress={() => onSelect(filter.id)}
      activeOpacity={0.8}
    >
      <View style={[styles.filterThumb, isSelected && styles.filterThumbActive]}>
        {thumbnailUri ? (
          <Image
            source={{ uri: thumbnailUri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
            priority="low"
            recyclingKey={thumbnailUri}
          />
        ) : (
          <View style={{ flex: 1, backgroundColor: Colors.softGray }} />
        )}
        {filter.overlay && (
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: filter.overlay, borderRadius: Radii.sm }]} />
        )}
      </View>
      <Text style={[styles.filterLabel, isSelected && styles.filterLabelActive]}>
        {filter.label}
      </Text>
    </TouchableOpacity>
  );
});

// ============================================================
// Memoized Filmstrip Item with Remove Option
// ============================================================
const FilmstripItem = memo(function FilmstripItem({
  uri,
  index,
  isActive,
  onSelect,
  onRemove,
}: {
  uri: string;
  index: number;
  isActive: boolean;
  onSelect: (i: number) => void;
  onRemove: (i: number) => void;
}) {
  return (
    <View style={styles.filmFrameWrapper}>
      <TouchableOpacity
        style={[styles.filmFrame, isActive && styles.filmFrameActive]}
        onPress={() => onSelect(index)}
        activeOpacity={0.85}
      >
        <Image
          source={{ uri }}
          style={styles.filmImage}
          contentFit="cover"
          cachePolicy="memory-disk"
          priority="normal"
          recyclingKey={uri}
        />
        <View style={styles.filmIndex}>
          <Text style={styles.filmIndexText}>{String(index + 1).padStart(2, '0')}</Text>
        </View>
      </TouchableOpacity>
      {/* Quick remove button */}
      <TouchableOpacity
        style={styles.filmRemoveBtn}
        onPress={() => onRemove(index)}
        hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}
        activeOpacity={0.8}
      >
        <Feather name="x" size={10} color={Colors.warmWhite} />
      </TouchableOpacity>
    </View>
  );
});

// ============================================================
// Memoized Hero Frame with Native Driver Animated Overlays
// ============================================================
interface HeroFrameProps {
  activeMedia?: PickedMedia | undefined;
  heroHeight: number;
  selectedFilter: FilterId;
  brightnessAnim: Animated.Value;
  contrastAnim: Animated.Value;
  warmthAnim: Animated.Value;
  saturationAnim: Animated.Value;
  shadowsAnim: Animated.Value;
  highlightsAnim: Animated.Value;
  taggedGarments: TaggedGarment[];
  activeIndex: number;
  totalMedia: number;
  onRemoveCurrent: () => void;
  isPinMode: boolean;
  onTapToPin: (xPercent: number, yPercent: number) => void;
  onRemovePin: (id: string) => void;
  onTogglePinMode: () => void;
}

const HeroFrame = memo(function HeroFrame({
  activeMedia,
  heroHeight,
  selectedFilter,
  brightnessAnim,
  contrastAnim,
  warmthAnim,
  saturationAnim,
  shadowsAnim,
  highlightsAnim,
  taggedGarments,
  activeIndex,
  totalMedia,
  onRemoveCurrent,
  isPinMode,
  onTapToPin,
  onRemovePin,
  onTogglePinMode,
}: HeroFrameProps) {
  // Interpolations for Native Driver opacity animations
  const brightWhiteOpacity = useMemo(
    () =>
      brightnessAnim.interpolate({
        inputRange: [0, 100],
        outputRange: [0, 0.38],
        extrapolate: 'clamp',
      }),
    [brightnessAnim]
  );

  const brightBlackOpacity = useMemo(
    () =>
      brightnessAnim.interpolate({
        inputRange: [-100, 0],
        outputRange: [0.48, 0],
        extrapolate: 'clamp',
      }),
    [brightnessAnim]
  );

  const warmthGoldenOpacity = useMemo(
    () =>
      warmthAnim.interpolate({
        inputRange: [0, 100],
        outputRange: [0, 0.22],
        extrapolate: 'clamp',
      }),
    [warmthAnim]
  );

  const warmthCoolOpacity = useMemo(
    () =>
      warmthAnim.interpolate({
        inputRange: [-100, 0],
        outputRange: [0.20, 0],
        extrapolate: 'clamp',
      }),
    [warmthAnim]
  );

  const contrastDeepOpacity = useMemo(
    () =>
      contrastAnim.interpolate({
        inputRange: [0, 100],
        outputRange: [0, 0.25],
        extrapolate: 'clamp',
      }),
    [contrastAnim]
  );

  const contrastFadeOpacity = useMemo(
    () =>
      contrastAnim.interpolate({
        inputRange: [-100, 0],
        outputRange: [0.25, 0],
        extrapolate: 'clamp',
      }),
    [contrastAnim]
  );

  const saturationVibrantOpacity = useMemo(
    () =>
      saturationAnim.interpolate({
        inputRange: [0, 100],
        outputRange: [0, 0.22],
        extrapolate: 'clamp',
      }),
    [saturationAnim]
  );

  const saturationMuteOpacity = useMemo(
    () =>
      saturationAnim.interpolate({
        inputRange: [-100, 0],
        outputRange: [0.35, 0],
        extrapolate: 'clamp',
      }),
    [saturationAnim]
  );

  const shadowsLiftOpacity = useMemo(
    () =>
      shadowsAnim.interpolate({
        inputRange: [0, 100],
        outputRange: [0, 0.24],
        extrapolate: 'clamp',
      }),
    [shadowsAnim]
  );

  const shadowsCrushOpacity = useMemo(
    () =>
      shadowsAnim.interpolate({
        inputRange: [-100, 0],
        outputRange: [0.30, 0],
        extrapolate: 'clamp',
      }),
    [shadowsAnim]
  );

  const highlightsBoostOpacity = useMemo(
    () =>
      highlightsAnim.interpolate({
        inputRange: [0, 100],
        outputRange: [0, 0.26],
        extrapolate: 'clamp',
      }),
    [highlightsAnim]
  );

  const highlightsBurnOpacity = useMemo(
    () =>
      highlightsAnim.interpolate({
        inputRange: [-100, 0],
        outputRange: [0.28, 0],
        extrapolate: 'clamp',
      }),
    [highlightsAnim]
  );

  const filterOverlay = useMemo(
    () => FILTER_PRESETS.find((f) => f.id === selectedFilter)?.overlay,
    [selectedFilter]
  );

  return (
    <View style={[styles.heroFrame, { height: heroHeight }]}>
      {activeMedia ? (
        <Image
          source={{ uri: activeMedia.uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
          priority="high"
          recyclingKey={activeMedia.uri}
          transition={150}
        />
      ) : (
        <View style={styles.heroPlaceholder}>
          <Feather name="image" size={40} color="rgba(0,0,0,0.2)" />
        </View>
      )}

      {/* Preset filter overlay */}
      {filterOverlay && (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: filterOverlay }]} />
      )}

      {/* Hardware-accelerated native driver adjustment overlays */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF', opacity: brightWhiteOpacity }]}
      />
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: '#000000', opacity: brightBlackOpacity }]}
      />
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgb(255,150,40)', opacity: warmthGoldenOpacity }]}
      />
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgb(65,115,230)', opacity: warmthCoolOpacity }]}
      />
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: '#100E0E', opacity: contrastDeepOpacity }]}
      />
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: '#FAF6EE', opacity: contrastFadeOpacity }]}
      />
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: '#FF4500', opacity: saturationVibrantOpacity }]}
      />
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: '#707070', opacity: saturationMuteOpacity }]}
      />
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: '#DDDDE6', opacity: shadowsLiftOpacity }]}
      />
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: '#050508', opacity: shadowsCrushOpacity }]}
      />
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF', opacity: highlightsBoostOpacity }]}
      />
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: '#252528', opacity: highlightsBurnOpacity }]}
      />

      {/* Top right image counter badge */}
      <View style={styles.imageCounter}>
        <Text style={styles.imageCounterText}>{activeIndex + 1} / {totalMedia}</Text>
      </View>

      {/* Quick remove current angle button on hero */}
      <TouchableOpacity
        style={styles.heroRemoveBtn}
        onPress={onRemoveCurrent}
        activeOpacity={0.8}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Feather name="trash-2" size={13} color={Colors.warmWhite} />
        <Text style={styles.heroRemoveBtnText}>REMOVE</Text>
      </TouchableOpacity>

      {/* Pin mode toggle badge */}
      <TouchableOpacity
        style={[styles.pinToggleBtn, isPinMode && styles.pinToggleBtnActive]}
        onPress={onTogglePinMode}
        activeOpacity={0.8}
      >
        <Ionicons name="pricetag" size={11} color={isPinMode ? '#0A0A0C' : '#FAF8F5'} />
        <Text style={[styles.pinToggleBtnText, isPinMode && styles.pinToggleBtnTextActive]}>
          {isPinMode ? 'PINNING ACTIVE' : '+ PIN GARMENT'}
        </Text>
      </TouchableOpacity>

      {/* Tap-to-pin overlay touch surface */}
      {isPinMode && (
        <TouchableOpacity
          activeOpacity={1}
          style={StyleSheet.absoluteFill}
          onPress={(e) => {
            const { locationX, locationY } = e.nativeEvent;
            const xPercent = Math.max(6, Math.min(88, Math.round((locationX / SW) * 100)));
            const yPercent = Math.max(6, Math.min(88, Math.round((locationY / heroHeight) * 100)));
            onTapToPin(xPercent, yPercent);
          }}
        >
          <View style={styles.pinCrosshairInstruction}>
            <Text style={styles.pinCrosshairText}>✦ TAP GARMENT PIECE ON PHOTO TO TAG</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Garment Pins rendered at exact tap coordinates */}
      {taggedGarments.map((g) => (
        <View
          key={g.id}
          style={[
            styles.productPin,
            {
              left: `${g.xPercent}%`,
              top: `${g.yPercent}%`,
            },
          ]}
        >
          <View style={styles.productPinDot} />
          <View style={styles.productPinContent}>
            <Text style={styles.productPinBrand}>{g.brand}</Text>
            <Text style={styles.productPinName} numberOfLines={1}>{g.name.toUpperCase()}</Text>
            {g.price ? <Text style={styles.productPinPrice}>₹{g.price}</Text> : null}
          </View>
          <TouchableOpacity
            style={styles.productPinClose}
            onPress={() => onRemovePin(g.id)}
            hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}
          >
            <Feather name="x" size={10} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ))}

      {taggedGarments.length > 0 && !isPinMode && (
        <View style={styles.pinActiveBadge}>
          <Text style={styles.pinActiveBadgeText}>● {taggedGarments.length} GARMENT PINS ACTIVE</Text>
        </View>
      )}
    </View>
  );
});

// ============================================================
// Main Create Screen Component
// ============================================================
export default function CreateScreen() {
  const router = useRouter();
  const qc = useQueryClient();

  const [step, setStep] = useState<'pick' | 'studio'>('pick');
  const [media, setMedia] = useState<PickedMedia[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('4:5');

  const [stylingNotes, setStylingNotes] = useState('');
  const [aesthetics, setAesthetics] = useState<StyleCategory[]>([]);
  const [taggedGarments, setTaggedGarments] = useState<TaggedGarment[]>([]);
  const [allowShopping, setAllowShopping] = useState(true);
  const [submitSpotlight, setSubmitSpotlight] = useState(true);
  const [garmentModalVisible, setGarmentModalVisible] = useState(false);
  const [draftGarment, setDraftGarment] = useState<Partial<TaggedGarment>>({});
  const [isPinMode, setIsPinMode] = useState(false);

  // ── Edit state ───────────────────────────────────────────────
  const studioScrollRef = useRef<ScrollView>(null);
  const [activeEditTab, setActiveEditTab] = useState<'filters' | 'adjust'>('filters');
  const [selectedFilter, setSelectedFilter] = useState<FilterId>('clean');
  const [selectedAdjustTool, setSelectedAdjustTool] = useState<AdjustToolKey>('brightness');
  const [adjustViewMode, setAdjustViewMode] = useState<'single' | 'all'>('single');
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const handleScrollLock = useCallback((locked: boolean) => {
    setScrollEnabled(!locked);
  }, []);

  const handleSelectEditTab = useCallback((tab: 'filters' | 'adjust') => {
    setActiveEditTab(tab);
    // Smoothly scroll back to top so the photo is 100% visible
    studioScrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  // Committed adjustment values for publishing / reset detection
  const [adjustments, setAdjustments] = useState({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    shadows: 0,
    highlights: 0,
    warmth: 0,
  });

  // Native driver animated values (direct 60fps manipulation without screen re-render)
  const brightnessAnim = useRef(new Animated.Value(0)).current;
  const contrastAnim = useRef(new Animated.Value(0)).current;
  const warmthAnim = useRef(new Animated.Value(0)).current;
  const saturationAnim = useRef(new Animated.Value(0)).current;
  const shadowsAnim = useRef(new Animated.Value(0)).current;
  const highlightsAnim = useRef(new Animated.Value(0)).current;

  const animMap = useMemo(
    () => ({
      brightness: brightnessAnim,
      contrast: contrastAnim,
      warmth: warmthAnim,
      saturation: saturationAnim,
      shadows: shadowsAnim,
      highlights: highlightsAnim,
    }),
    [brightnessAnim, contrastAnim, warmthAnim, saturationAnim, shadowsAnim, highlightsAnim]
  );

  const activeToolConfig: AdjustToolConfig = useMemo(
    () => ADJUST_TOOLS.find((t) => t.key === selectedAdjustTool) ?? (ADJUST_TOOLS[0] as AdjustToolConfig),
    [selectedAdjustTool]
  );

  const hasEdits =
    selectedFilter !== 'clean' ||
    adjustments.brightness !== 0 ||
    adjustments.contrast !== 0 ||
    adjustments.saturation !== 0 ||
    adjustments.shadows !== 0 ||
    adjustments.highlights !== 0 ||
    adjustments.warmth !== 0;

  const resetEdits = useCallback(() => {
    setSelectedFilter('clean');
    setAdjustments({
      brightness: 0,
      contrast: 0,
      saturation: 0,
      shadows: 0,
      highlights: 0,
      warmth: 0,
    });
    brightnessAnim.setValue(0);
    contrastAnim.setValue(0);
    warmthAnim.setValue(0);
    saturationAnim.setValue(0);
    shadowsAnim.setValue(0);
    highlightsAnim.setValue(0);
  }, [brightnessAnim, contrastAnim, warmthAnim, saturationAnim, shadowsAnim, highlightsAnim]);

  const toggleAesthetic = useCallback((a: StyleCategory) => {
    setAesthetics((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  }, []);

  const removeMedia = useCallback((index: number) => {
    setMedia((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) {
        setStep('pick');
        setActiveIndex(0);
      } else {
        setActiveIndex((ai) => Math.min(ai, next.length - 1));
      }
      return next;
    });
  }, []);

  const removeCurrentHeroMedia = useCallback(() => {
    removeMedia(activeIndex);
  }, [removeMedia, activeIndex]);

  const handleTapToPin = useCallback((xPercent: number, yPercent: number) => {
    hapticSuccess();
    setDraftGarment({
      xPercent,
      yPercent,
      category: 'OUTERWEAR',
    });
    setGarmentModalVisible(true);
  }, []);

  const handleRemovePin = useCallback((id: string) => {
    hapticLight();
    setTaggedGarments((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const handleTogglePinMode = useCallback(() => {
    hapticMedium();
    setIsPinMode((prev) => !prev);
  }, []);

  const addGarment = useCallback(() => {
    if (!draftGarment.brand || !draftGarment.name) return;
    hapticSuccess();
    const g: TaggedGarment = {
      id: Date.now().toString(),
      brand: draftGarment.brand ?? '',
      name: draftGarment.name ?? '',
      category: draftGarment.category ?? 'OUTERWEAR',
      spec: draftGarment.spec ?? '',
      price: draftGarment.price ?? '',
      productUrl: draftGarment.productUrl ?? '',
      xPercent: draftGarment.xPercent ?? 50,
      yPercent: draftGarment.yPercent ?? 50,
    };
    setTaggedGarments((prev) => [...prev, g]);
    setDraftGarment({});
    setGarmentModalVisible(false);
  }, [draftGarment]);

  const pickFromLibrary = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to upload outfit photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 0.85,
    });
    if (!result.canceled && result.assets.length > 0) {
      const picked: PickedMedia[] = result.assets.map((a, idx) => ({
        uri: a.uri,
        type: a.mimeType === 'image/jpg' ? 'image/jpeg' : a.mimeType ?? 'image/jpeg',
        fileName: a.fileName ?? `photo_${Date.now()}_${idx}.jpg`,
        width: a.width,
        height: a.height,
      }));
      setMedia((prev) => [...prev, ...picked].slice(0, 10));
      setStep('studio');
    }
  }, []);

  const captureFromCamera = useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Please allow camera access to capture outfits.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      const picked: PickedMedia = {
        uri: a.uri,
        type: a.mimeType === 'image/jpg' ? 'image/jpeg' : a.mimeType ?? 'image/jpeg',
        fileName: a.fileName ?? `camera_${Date.now()}.jpg`,
        width: a.width,
        height: a.height,
      };
      setMedia((prev) => [...prev, picked].slice(0, 10));
      setStep('studio');
    }
  }, []);

  const postMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      for (const m of media) {
        formData.append('media', { uri: m.uri, type: m.type, name: m.fileName } as unknown as Blob);
      }
      if (stylingNotes.trim()) formData.append('caption', stylingNotes.trim());
      for (const a of aesthetics) formData.append('styleCategories', a);
      formData.append('aspectRatio', aspectRatio);
      formData.append('allowShopping', String(allowShopping));
      formData.append('submitSpotlight', String(submitSpotlight));
      if (taggedGarments.length > 0) {
        formData.append(
          'products',
          JSON.stringify(
            taggedGarments.map((g) => ({
              productName: g.name,
              brand: g.brand,
              price: g.price ? Number(g.price) : undefined,
              currency: 'INR',
              productUrl: g.productUrl || undefined,
            }))
          )
        );
      }
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
      Alert.alert('Lookbook Entry Live!', 'Your outfit has been published to the editorial.', [
        { text: 'View Feed', onPress: () => router.replace('/(tabs)') },
      ]);
      setStep('pick');
      setMedia([]);
      setActiveIndex(0);
      setStylingNotes('');
      setAesthetics([]);
      setTaggedGarments([]);
      resetEdits();
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.error?.details?.[0]?.message ||
        err?.response?.data?.error?.message ||
        err?.message ||
        'Could not publish your lookbook entry.';
      Alert.alert('Publish Failed', msg);
    },
  });

  // ── STEP 1: Media Picker ────────────────────────────────────
  if (step === 'pick') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSuper}>OOTDI STUDIO</Text>
            <Text style={styles.headerTitle}>New Lookbook Entry</Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.pickScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.dropZone}>
            <View style={styles.dropIconCircle}>
              <Feather name="camera" size={32} color={Colors.charcoal} />
            </View>
            <Text style={styles.dropHeadline}>Document Today's Silhouette</Text>
            <Text style={styles.dropDesc}>
              Upload high-resolution photography from your library or capture directly. Up to 10 angles.
            </Text>
            <View style={styles.dropActions}>
              <TouchableOpacity style={styles.btnPrimary} onPress={() => void pickFromLibrary()} activeOpacity={0.88}>
                <Ionicons name="images-outline" size={16} color={Colors.warmWhite} />
                <Text style={styles.btnPrimaryText}>Photo Library</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSecondary} onPress={() => void captureFromCamera()} activeOpacity={0.85}>
                <Ionicons name="camera" size={16} color={Colors.charcoal} />
                <Text style={styles.btnSecondaryText}>Camera</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.curatorCard}>
            <Text style={styles.curatorCardTitle}>CURATOR'S CODE</Text>
            {[
              'Full-length portraits showcase overall proportions best',
              'Natural diffused lighting reveals fabric textures and tone',
              'Include detail close-ups — jewellery, footwear, tailoring',
            ].map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <View style={styles.tipBullet} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── STEP 2: Full Editorial Studio ──────────────────────────
  // ── STEP 2: Full Editorial Studio ──────────────────────────
  // Cap hero frame height so the photo and adjustment controls fit comfortably on screen together
  const heroH = Math.min(SW / RATIO_MAP[aspectRatio], Math.round(SH * 0.44));
  const activeMedia = media[activeIndex];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* Top Bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('pick')} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={20} color={Colors.charcoal} />
          </TouchableOpacity>
          <View style={styles.headerCenterBlock}>
            <Text style={styles.headerSuper}>OOTDI STUDIO</Text>
            <Text style={styles.headerTitle}>New Lookbook Entry</Text>
          </View>
          <TouchableOpacity
            style={[styles.publishBtn, (postMutation.isPending || media.length === 0) && { opacity: 0.45 }]}
            onPress={() => postMutation.mutate()}
            disabled={postMutation.isPending || media.length === 0}
            activeOpacity={0.85}
          >
            {postMutation.isPending ? (
              <ActivityIndicator color={Colors.warmWhite} size="small" />
            ) : (
              <Text style={styles.publishBtnText}>PUBLISH</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={studioScrollRef}
          scrollEnabled={scrollEnabled}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 60 }}
        >
          {/* Issue Badge */}
          <View style={styles.issueBadgeRow}>
            <Text style={styles.issueBadgeText}>ISSUE 04 · SEOUL EDITORIAL</Text>
            <Text style={styles.autoSave}>AUTO-SAVED</Text>
          </View>

          {/* Optimized Hero Frame */}
          <HeroFrame
            activeMedia={activeMedia}
            heroHeight={heroH}
            selectedFilter={selectedFilter}
            brightnessAnim={brightnessAnim}
            contrastAnim={contrastAnim}
            warmthAnim={warmthAnim}
            saturationAnim={saturationAnim}
            shadowsAnim={shadowsAnim}
            highlightsAnim={highlightsAnim}
            taggedGarments={taggedGarments}
            activeIndex={activeIndex}
            totalMedia={media.length}
            onRemoveCurrent={removeCurrentHeroMedia}
            isPinMode={isPinMode}
            onTapToPin={handleTapToPin}
            onRemovePin={handleRemovePin}
            onTogglePinMode={handleTogglePinMode}
          />

          {/* Aspect Ratio Selector */}
          <View style={styles.aspectRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing[2] }}>
              {ASPECT_RATIOS.map((ar) => (
                <TouchableOpacity
                  key={ar.value}
                  style={[styles.aspectChip, aspectRatio === ar.value && styles.aspectChipActive]}
                  onPress={() => setAspectRatio(ar.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.aspectChipText, aspectRatio === ar.value && styles.aspectChipTextActive]}>
                    {ar.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* ── Edit Panel: Filters / Adjust ── */}
          <View style={styles.editTabBar}>
            <TouchableOpacity
              style={[styles.editTab, activeEditTab === 'filters' && styles.editTabActive]}
              onPress={() => handleSelectEditTab('filters')}
              activeOpacity={0.8}
            >
              <Text style={[styles.editTabText, activeEditTab === 'filters' && styles.editTabTextActive]}>FILTERS</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.editTab, activeEditTab === 'adjust' && styles.editTabActive]}
              onPress={() => handleSelectEditTab('adjust')}
              activeOpacity={0.8}
            >
              <Text style={[styles.editTabText, activeEditTab === 'adjust' && styles.editTabTextActive]}>ADJUST</Text>
            </TouchableOpacity>
            {hasEdits && (
              <TouchableOpacity style={styles.editResetBtn} onPress={resetEdits} activeOpacity={0.7}>
                <Text style={styles.editResetText}>RESET</Text>
              </TouchableOpacity>
            )}
          </View>

          {activeEditTab === 'filters' ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterStrip}>
              {FILTER_PRESETS.map((f) => (
                <FilterItem
                  key={f.id}
                  filter={f}
                  isSelected={selectedFilter === f.id}
                  thumbnailUri={activeMedia?.uri}
                  onSelect={setSelectedFilter}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.adjustPanel}>
              {/* Header row with compact vs expand toggle */}
              <View style={styles.adjustHeaderRow}>
                <Text style={styles.adjustHeaderLabel}>PRECISION ADJUSTMENTS</Text>
                <TouchableOpacity
                  style={styles.adjustModeToggle}
                  onPress={() => setAdjustViewMode((prev) => (prev === 'single' ? 'all' : 'single'))}
                  activeOpacity={0.7}
                >
                  <Feather
                    name={adjustViewMode === 'single' ? 'list' : 'minimize-2'}
                    size={11}
                    color={Colors.textSecondary}
                  />
                  <Text style={styles.adjustModeToggleText}>
                    {adjustViewMode === 'single' ? 'EXPAND ALL' : 'COMPACT'}
                  </Text>
                </TouchableOpacity>
              </View>

              {adjustViewMode === 'single' ? (
                <>
                  {/* Horizontal Tool Chips — photo stays 100% visible right above! */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.adjustToolStrip}
                  >
                    {ADJUST_TOOLS.map((t) => {
                      const isSelected = selectedAdjustTool === t.key;
                      const val = adjustments[t.key];
                      const isModified = val !== 0;
                      return (
                        <TouchableOpacity
                          key={t.key}
                          style={[styles.adjustToolChip, isSelected && styles.adjustToolChipActive]}
                          onPress={() => setSelectedAdjustTool(t.key)}
                          activeOpacity={0.8}
                        >
                          <Feather
                            name={t.icon}
                            size={12}
                            color={isSelected ? Colors.warmWhite : isModified ? '#D4AF37' : Colors.textSecondary}
                          />
                          <Text style={[styles.adjustToolChipText, isSelected && styles.adjustToolChipTextActive]}>
                            {t.label}
                          </Text>
                          {isModified && (
                            <View style={[styles.adjustToolValBadge, isSelected && styles.adjustToolValBadgeActive]}>
                              <Text
                                style={[
                                  styles.adjustToolValBadgeText,
                                  isSelected && styles.adjustToolValBadgeTextActive,
                                ]}
                              >
                                {val > 0 ? `+${val}` : val}
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {/* Active Slider — directly beneath tool chips with zero vertical scroll */}
                  <View style={styles.activeSliderContainer}>
                    <AdjustSlider
                      key={activeToolConfig.key}
                      label={activeToolConfig.label}
                      initialValue={adjustments[activeToolConfig.key]}
                      animValue={animMap[activeToolConfig.key]}
                      min={activeToolConfig.min}
                      max={activeToolConfig.max}
                      onScrollLock={handleScrollLock}
                      onCommit={(v) => setAdjustments((prev) => ({ ...prev, [activeToolConfig.key]: v }))}
                    />
                  </View>
                </>
              ) : (
                <View style={{ gap: Spacing[1] }}>
                  {ADJUST_TOOLS.map((t) => (
                    <AdjustSlider
                      key={t.key}
                      label={t.label}
                      initialValue={adjustments[t.key]}
                      animValue={animMap[t.key]}
                      min={t.min}
                      max={t.max}
                      onScrollLock={handleScrollLock}
                      onCommit={(v) => setAdjustments((prev) => ({ ...prev, [t.key]: v }))}
                    />
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Filmstrip with fast memoized items and remove buttons */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filmstrip}>
            {media.map((m, i) => (
              <FilmstripItem
                key={m.uri + i}
                uri={m.uri}
                index={i}
                isActive={i === activeIndex}
                onSelect={setActiveIndex}
                onRemove={removeMedia}
              />
            ))}
            {media.length < 10 && (
              <TouchableOpacity style={styles.filmAdd} onPress={() => void pickFromLibrary()} activeOpacity={0.8}>
                <Feather name="plus" size={18} color={Colors.textSecondary} />
                <Text style={styles.filmAddText}>ADD ANGLE</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Styling Notes */}
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>STYLING NOTES & SILHOUETTE</Text>
              <Text style={styles.charCount}>{stylingNotes.length}/300</Text>
            </View>
            <TextInput
              style={styles.notesInput}
              placeholder="Note on silhouette, drape, fabric composition, or styling inspiration..."
              placeholderTextColor={Colors.textPlaceholder}
              value={stylingNotes}
              onChangeText={(t) => setStylingNotes(t.slice(0, 300))}
              multiline
              textAlignVertical="top"
            />
            <View style={styles.hashtagRow}>
              {['#KoreanMinimal', '#RelaxedTailoring', '#Monochrome'].map((tag) => (
                <TouchableOpacity key={tag} style={styles.hashtag} activeOpacity={0.7}>
                  <Text style={styles.hashtagText}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Aesthetic Direction */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>AESTHETIC DIRECTION</Text>
            <View style={[styles.chipGrid, { marginTop: Spacing[3] }]}>
              {AESTHETIC_KEYS.map((key) => {
                const active = aesthetics.includes(key);
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => toggleAesthetic(key)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {STYLE_CATEGORY_LABELS[key]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Tagged Garments */}
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>TAGGED GARMENTS</Text>
              <Text style={styles.sectionHint}>{taggedGarments.length} PIECES CATALOGUED</Text>
            </View>
            {taggedGarments.map((g) => (
              <View key={g.id} style={styles.garmentRow}>
                <View style={styles.garmentInfo}>
                  <Text style={styles.garmentBrand}>{g.brand}</Text>
                  <Text style={styles.garmentName}>{g.name}</Text>
                  <Text style={styles.garmentSpec}>{g.category} · {g.spec}</Text>
                </View>
                <TouchableOpacity
                  style={styles.garmentRemove}
                  onPress={() => setTaggedGarments((prev) => prev.filter((x) => x.id !== g.id))}
                  activeOpacity={0.7}
                >
                  <Feather name="minus" size={16} color={Colors.charcoal} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addGarmentBtn} onPress={() => setGarmentModalVisible(true)} activeOpacity={0.8}>
              <Feather name="plus" size={14} color={Colors.textSecondary} />
              <Text style={styles.addGarmentText}>+ REGISTER GARMENT SPECIFICATION</Text>
            </TouchableOpacity>
          </View>

          {/* Editorial Permissions */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>EDITORIAL PERMISSIONS</Text>
            <View style={[styles.permRow, { marginTop: Spacing[3] }]}>
              <View style={styles.permInfo}>
                <Text style={styles.permTitle}>Garment Shopping Links</Text>
                <Text style={styles.permDesc}>Enable verified direct product references and stockists</Text>
              </View>
              <Switch
                value={allowShopping}
                onValueChange={setAllowShopping}
                trackColor={{ false: Colors.border, true: Colors.charcoal }}
                thumbColor={Colors.warmWhite}
                ios_backgroundColor={Colors.border}
              />
            </View>
            <View style={[styles.permRow, { borderBottomWidth: 0 }]}>
              <View style={styles.permInfo}>
                <Text style={styles.permTitle}>Submit to Editorial Spotlight</Text>
                <Text style={styles.permDesc}>Consider look for OOTDI Seoul Weekly Curated Digest</Text>
              </View>
              <Switch
                value={submitSpotlight}
                onValueChange={setSubmitSpotlight}
                trackColor={{ false: Colors.border, true: Colors.charcoal }}
                thumbColor={Colors.warmWhite}
                ios_backgroundColor={Colors.border}
              />
            </View>
          </View>

          {/* Publish */}
          <View style={styles.publishSection}>
            <TouchableOpacity
              style={[styles.publishLargeBtn, (postMutation.isPending || media.length === 0) && { opacity: 0.5 }]}
              onPress={() => postMutation.mutate()}
              disabled={postMutation.isPending || media.length === 0}
              activeOpacity={0.88}
            >
              {postMutation.isPending ? (
                <ActivityIndicator color={Colors.warmWhite} />
              ) : (
                <Text style={styles.publishLargeBtnText}>PUBLISH LOOKBOOK ENTRY</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.draftBtn} activeOpacity={0.7}>
              <Text style={styles.draftBtnText}>SAVE AS UNLISTED DRAFT</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Garment Modal */}
      <Modal visible={garmentModalVisible} transparent animationType="slide" onRequestClose={() => setGarmentModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Register Garment</Text>
              <TouchableOpacity onPress={() => setGarmentModalVisible(false)} activeOpacity={0.7}>
                <Feather name="x" size={20} color={Colors.charcoal} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalFields}>
              {[
                { label: 'BRAND', key: 'brand' as keyof TaggedGarment, placeholder: 'e.g. Lemaire' },
                { label: 'GARMENT NAME', key: 'name' as keyof TaggedGarment, placeholder: 'e.g. Oversized Trench Coat' },
                { label: 'PRICE (₹)', key: 'price' as keyof TaggedGarment, placeholder: 'e.g. 4500' },
                { label: 'PRODUCT URL (OPTIONAL)', key: 'productUrl' as keyof TaggedGarment, placeholder: 'https://...' },
                { label: 'CATEGORY', key: 'category' as keyof TaggedGarment, placeholder: 'e.g. OUTERWEAR' },
                { label: 'SPECIFICATION', key: 'spec' as keyof TaggedGarment, placeholder: 'e.g. SAND BEIGE GABARDINE · SIZE 48' },
              ].map((field) => (
                <View key={field.key}>
                  <Text style={styles.modalFieldLabel}>{field.label}</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder={field.placeholder}
                    placeholderTextColor={Colors.textPlaceholder}
                    value={(draftGarment[field.key] as string) ?? ''}
                    onChangeText={(v) => setDraftGarment((d) => ({ ...d, [field.key]: v }))}
                  />
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.modalAddBtn} onPress={addGarment} activeOpacity={0.88}>
              <Text style={styles.modalAddBtnText}>Add Garment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.warmWhite },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    backgroundColor: Colors.warmWhite,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerCenterBlock: { alignItems: 'center', flex: 1 },
  headerSuper: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2.5,
    color: Colors.textGold,
    textAlign: 'center',
  },
  headerTitle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: Colors.charcoal,
    textAlign: 'center',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  publishBtn: {
    backgroundColor: Colors.charcoal,
    paddingHorizontal: Spacing[3] + 2,
    paddingVertical: Spacing[2],
    borderRadius: Radii.sm,
    minWidth: 74,
    alignItems: 'center',
  },
  publishBtnText: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: Colors.warmWhite,
  },

  // Step 1
  pickScroll: { padding: Spacing[5], gap: Spacing[4] },
  dropZone: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing[7],
    alignItems: 'center',
    ...Shadows.sm,
  },
  dropIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.softGray,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[4],
  },
  dropHeadline: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.xl,
    color: Colors.charcoal,
    textAlign: 'center',
    marginBottom: Spacing[2],
  },
  dropDesc: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.sm * 1.6,
    marginBottom: Spacing[6],
    paddingHorizontal: Spacing[2],
  },
  dropActions: { flexDirection: 'row', gap: Spacing[3], width: '100%' },
  btnPrimary: {
    flex: 1,
    backgroundColor: Colors.charcoal,
    borderRadius: Radii.full,
    paddingVertical: Spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    ...Shadows.sm,
  },
  btnPrimaryText: { fontFamily: Typography.fontBody, fontSize: Typography.sm, fontWeight: '700', color: Colors.warmWhite },
  btnSecondary: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.full,
    paddingVertical: Spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  btnSecondaryText: { fontFamily: Typography.fontBody, fontSize: Typography.sm, fontWeight: '700', color: Colors.charcoal },
  curatorCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing[5],
    gap: Spacing[3],
  },
  curatorCardTitle: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    color: Colors.textSecondary,
    marginBottom: Spacing[1],
  },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  tipBullet: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: Colors.charcoal, opacity: 0.4 },
  tipText: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: Typography.xs + 1,
    color: Colors.textSecondary,
    lineHeight: (Typography.xs + 1) * 1.5,
  },

  // Step 2
  issueBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
  },
  issueBadgeText: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: Colors.textSecondary,
  },
  autoSave: { fontFamily: Typography.fontBody, fontSize: 10, color: Colors.textTertiary, letterSpacing: 0.5 },

  heroFrame: { width: SW, backgroundColor: Colors.softGray, position: 'relative', overflow: 'hidden' },
  heroPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8E6E0' },
  productPin: {
    position: 'absolute',
    backgroundColor: 'rgba(10,10,12,0.85)',
    borderRadius: Radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...Shadows.sm,
    maxWidth: SW * 0.52,
    zIndex: 10,
  },
  productPinDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D4AF37' },
  productPinContent: { flex: 1 },
  productPinBrand: { fontFamily: Typography.fontBody, fontSize: 9, fontWeight: '800', color: '#FAF8F5', letterSpacing: 0.5 },
  productPinName: { fontFamily: Typography.fontBody, fontSize: 8, fontWeight: '600', color: '#D4CEBF', letterSpacing: 0.4 },
  productPinPrice: { fontFamily: Typography.fontBody, fontSize: 8, fontWeight: '700', color: '#D4AF37' },
  productPinClose: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  pinToggleBtn: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(10,10,12,0.75)',
    borderRadius: Radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    zIndex: 15,
  },
  pinToggleBtnActive: {
    backgroundColor: '#D4AF37',
  },
  pinToggleBtnText: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: '800',
    color: '#FAF8F5',
    letterSpacing: 0.8,
  },
  pinToggleBtnTextActive: {
    color: '#0A0A0C',
  },
  pinCrosshairInstruction: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(10,10,12,0.85)',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  pinCrosshairText: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#FAF8F5',
  },
  pinActiveBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: Radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 5,
    ...Shadows.sm,
  },
  pinActiveBadgeText: { fontFamily: Typography.fontBody, fontSize: 9, fontWeight: '700', color: Colors.charcoal, letterSpacing: 0.5 },
  imageCounter: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: Radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  imageCounterText: { fontFamily: Typography.fontBody, fontSize: 10, fontWeight: '700', color: Colors.warmWhite },
  heroRemoveBtn: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(20,20,20,0.65)',
    borderRadius: Radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroRemoveBtnText: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: Colors.warmWhite,
  },

  aspectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    gap: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  aspectChip: {
    paddingHorizontal: Spacing[3],
    paddingVertical: 5,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  aspectChipActive: { backgroundColor: Colors.charcoal, borderColor: Colors.charcoal },
  aspectChipText: { fontFamily: Typography.fontBody, fontSize: 10, fontWeight: '600', color: Colors.textSecondary, letterSpacing: 0.3 },
  aspectChipTextActive: { color: Colors.warmWhite },

  filmstrip: { paddingHorizontal: Spacing[4], paddingVertical: Spacing[3], gap: Spacing[2] },
  filmFrameWrapper: { position: 'relative' },
  filmFrame: {
    width: 64,
    height: 80,
    borderRadius: Radii.sm,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.softGray,
    position: 'relative',
  },
  filmFrameActive: { borderColor: Colors.charcoal, borderWidth: 2 },
  filmImage: { width: '100%', height: '100%' },
  filmIndex: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 2,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  filmIndexText: { fontFamily: Typography.fontBody, fontSize: 8, fontWeight: '700', color: Colors.warmWhite },
  filmRemoveBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.charcoal,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 1.5,
    borderColor: Colors.warmWhite,
  },
  filmAdd: {
    width: 64,
    height: 80,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  filmAddText: { fontFamily: Typography.fontBody, fontSize: 7, fontWeight: '700', letterSpacing: 0.5, color: Colors.textSecondary },

  section: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[5],
    paddingBottom: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[3] },
  sectionLabel: { fontFamily: Typography.fontBody, fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: Colors.charcoal },
  sectionHint: { fontFamily: Typography.fontBody, fontSize: 10, color: Colors.textSecondary, fontWeight: '600' },
  charCount: { fontFamily: Typography.fontBody, fontSize: 10, color: Colors.textTertiary },

  notesInput: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.charcoal,
    minHeight: 80,
    textAlignVertical: 'top',
    lineHeight: Typography.sm * 1.55,
    marginBottom: Spacing[3],
  },
  hashtagRow: { flexDirection: 'row', gap: Spacing[2], flexWrap: 'wrap', paddingBottom: Spacing[3] },
  hashtag: { paddingHorizontal: Spacing[3], paddingVertical: 4, borderRadius: Radii.full, backgroundColor: Colors.softGray },
  hashtagText: { fontFamily: Typography.fontBody, fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2], paddingBottom: Spacing[2] },
  chip: {
    paddingHorizontal: Spacing[3] + 2,
    paddingVertical: 6,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipActive: { backgroundColor: Colors.charcoal, borderColor: Colors.charcoal },
  chipText: { fontFamily: Typography.fontBody, fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.warmWhite, fontWeight: '700' },

  garmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  garmentInfo: { flex: 1 },
  garmentBrand: { fontFamily: Typography.fontBody, fontSize: Typography.sm, fontWeight: '700', color: Colors.charcoal },
  garmentName: { fontFamily: Typography.fontBody, fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 1 },
  garmentSpec: { fontFamily: Typography.fontBody, fontSize: 10, color: Colors.textTertiary, marginTop: 2, letterSpacing: 0.3 },
  garmentRemove: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  addGarmentBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], paddingVertical: Spacing[4] },
  addGarmentText: { fontFamily: Typography.fontBody, fontSize: 11, fontWeight: '700', letterSpacing: 1, color: Colors.textSecondary },

  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  permInfo: { flex: 1, paddingRight: Spacing[4] },
  permTitle: { fontFamily: Typography.fontBody, fontSize: Typography.sm, fontWeight: '600', color: Colors.charcoal, marginBottom: 2 },
  permDesc: { fontFamily: Typography.fontBody, fontSize: Typography.xs, color: Colors.textSecondary, lineHeight: Typography.xs * 1.5 },

  publishSection: { paddingHorizontal: Spacing[4], paddingTop: Spacing[6], paddingBottom: Spacing[4], gap: Spacing[3] },
  publishLargeBtn: {
    backgroundColor: Colors.charcoal,
    borderRadius: Radii.sm,
    paddingVertical: Spacing[4] + 2,
    alignItems: 'center',
    ...Shadows.md,
  },
  publishLargeBtnText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    fontWeight: '800',
    letterSpacing: 2,
    color: Colors.warmWhite,
  },
  draftBtn: { paddingVertical: Spacing[3], alignItems: 'center' },
  draftBtnText: { fontFamily: Typography.fontBody, fontSize: 11, fontWeight: '600', letterSpacing: 1.5, color: Colors.textSecondary },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: Colors.warmWhite,
    borderTopLeftRadius: Radii['2xl'],
    borderTopRightRadius: Radii['2xl'],
    padding: Spacing[5],
    paddingBottom: Platform.OS === 'ios' ? Spacing[8] : Spacing[5],
    ...Shadows.lg,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[5] },
  modalTitle: { fontFamily: Typography.fontBody, fontSize: Typography.base, fontWeight: '800', color: Colors.charcoal, letterSpacing: 0.5 },
  modalFields: { gap: Spacing[3] },
  modalFieldLabel: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  modalInput: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sm,
    color: Colors.charcoal,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing[2],
    marginBottom: Spacing[2],
  },
  modalAddBtn: {
    backgroundColor: Colors.charcoal,
    borderRadius: Radii.sm,
    paddingVertical: Spacing[4],
    alignItems: 'center',
    marginTop: Spacing[5],
    ...Shadows.sm,
  },
  modalAddBtnText: { fontFamily: Typography.fontBody, fontSize: Typography.sm, fontWeight: '700', color: Colors.warmWhite, letterSpacing: 1 },

  // ── Edit Tab Bar ─────────────────────────────────────────────
  editTabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: Spacing[1],
  },
  editTab: {
    paddingHorizontal: Spacing[3] + 2,
    paddingVertical: Spacing[2],
    borderRadius: Radii.full,
  },
  editTabActive: { backgroundColor: Colors.charcoal },
  editTabText: { fontFamily: Typography.fontBody, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: Colors.textSecondary },
  editTabTextActive: { color: Colors.warmWhite },
  editResetBtn: { marginLeft: 'auto', paddingHorizontal: Spacing[3], paddingVertical: Spacing[2] },
  editResetText: { fontFamily: Typography.fontBody, fontSize: 10, fontWeight: '700', letterSpacing: 1, color: Colors.textGold },

  // ── Filters ──────────────────────────────────────────────────
  filterStrip: { paddingHorizontal: Spacing[4], paddingVertical: Spacing[3], gap: Spacing[3] },
  filterItem: { alignItems: 'center', gap: Spacing[1] },
  filterThumb: {
    width: 56,
    height: 70,
    borderRadius: Radii.sm,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.softGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterThumbActive: { borderColor: Colors.charcoal, borderWidth: 2.5 },
  filterLabel: { fontFamily: Typography.fontBody, fontSize: 7, fontWeight: '700', letterSpacing: 0.8, color: Colors.textSecondary },
  filterLabelActive: { color: Colors.charcoal },

  // ── Adjust Panel ─────────────────────────────────────────────
  adjustPanel: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.surface,
  },
  adjustHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  adjustHeaderLabel: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: Colors.textSecondary,
  },
  adjustModeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
    backgroundColor: Colors.softGray,
  },
  adjustModeToggleText: {
    fontFamily: Typography.fontBody,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: Colors.textSecondary,
  },
  adjustToolStrip: {
    paddingVertical: Spacing[1],
    gap: Spacing[2],
  },
  adjustToolChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing[3],
    paddingVertical: 7,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  adjustToolChipActive: {
    backgroundColor: Colors.charcoal,
    borderColor: Colors.charcoal,
  },
  adjustToolChipText: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  adjustToolChipTextActive: {
    color: Colors.warmWhite,
    fontWeight: '700',
  },
  adjustToolValBadge: {
    backgroundColor: 'rgba(212,175,55,0.18)',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  adjustToolValBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  adjustToolValBadgeText: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: '800',
    color: '#D4AF37',
  },
  adjustToolValBadgeTextActive: {
    color: Colors.warmWhite,
  },
  activeSliderContainer: {
    marginTop: Spacing[2],
  },
});
