// ============================================================
// ImageZoomLightbox — Immersive Haute-Couture Pinch-to-Zoom Lightbox
// Allows editorial inspection of fabric texture, cuts & garments
// ============================================================

import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Text,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Typography } from '../design/tokens';
import { hapticLight } from '../lib/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ImageZoomLightboxProps {
  visible: boolean;
  imageUrl: string;
  creatorName?: string;
  onClose: () => void;
}

export const ImageZoomLightbox: React.FC<ImageZoomLightboxProps> = ({
  visible,
  imageUrl,
  creatorName,
  onClose,
}) => {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const resetZoom = () => {
    scale.value = withTiming(1, { duration: 250 });
    savedScale.value = 1;
    translateX.value = withTiming(0, { duration: 250 });
    translateY.value = withTiming(0, { duration: 250 });
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(1, Math.min(savedScale.value * e.scale, 4.5));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value < 1.05) {
        resetZoom();
      }
    });

  const panGesture = Gesture.Pan()
    .averageTouches(true)
    .onUpdate((e) => {
      if (scale.value > 1.05) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      }
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      hapticLight();
      if (scale.value > 1.2) {
        resetZoom();
      } else {
        scale.value = withSpring(2.4);
        savedScale.value = 2.4;
      }
    });

  const composedGestures = Gesture.Simultaneous(pinchGesture, panGesture, doubleTapGesture);

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handleClose = () => {
    resetZoom();
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0C" />

        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerLabel}>INSPECTION STUDIO</Text>
            {creatorName ? (
              <Text style={styles.creatorLabel}>@{creatorName}</Text>
            ) : null}
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.8}>
            <Ionicons name="close" size={24} color="#FAF8F5" />
          </TouchableOpacity>
        </View>

        {/* Zoomable Image Container */}
        <GestureDetector gesture={composedGestures}>
          <View style={styles.imageWrapper}>
            <Animated.View style={[styles.imageContainer, animatedImageStyle]}>
              <Image
                source={{ uri: imageUrl }}
                style={styles.image}
                contentFit="contain"
                cachePolicy="memory-disk"
              />
            </Animated.View>
          </View>
        </GestureDetector>

        {/* Bottom Hint */}
        <View style={styles.footer}>
          <Text style={styles.footerHint}>Pinch to zoom · Double-tap to magnify fabric</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0C',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
    zIndex: 10,
    backgroundColor: 'rgba(10,10,12,0.85)',
  },
  headerLabel: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#D4AF37',
  },
  creatorLabel: {
    fontFamily: Typography.fontBody,
    fontSize: 13,
    fontWeight: '600',
    color: '#FAF8F5',
    marginTop: 2,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.75,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(10,10,12,0.85)',
    zIndex: 10,
  },
  footerHint: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.5,
  },
});
