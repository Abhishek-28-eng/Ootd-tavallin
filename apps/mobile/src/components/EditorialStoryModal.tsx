// ============================================================
// EditorialStoryModal — 9:16 High-Fashion Lookbook Export
// Formatted for Instagram Stories, WhatsApp Status & Pinterest
// ============================================================

import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Share,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Typography } from '../design/tokens';
import { hapticLight, hapticSuccess } from '../lib/haptics';
import type { OutfitPost } from '@tavallin/shared';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 48, 340);
const CARD_HEIGHT = CARD_WIDTH * (16 / 9);

interface EditorialStoryModalProps {
  visible: boolean;
  post: OutfitPost;
  onClose: () => void;
}

export const EditorialStoryModal: React.FC<EditorialStoryModalProps> = ({
  visible,
  post,
  onClose,
}) => {
  const creator = post.creator ?? (post as any).author ?? {
    username: 'creator',
    displayName: 'Creator',
  };

  const firstMedia = post.media?.[0] as any;
  const imageUrl = firstMedia?.url ?? firstMedia?.publicUrl ?? '';
  const products = (post as any).products ?? (post as any).outfitItems ?? [];

  const handleShareStory = async () => {
    hapticSuccess();
    try {
      await Share.share({
        message: `Lookbook Edition • @${creator.username} on OOTDi\n\n"${
          post.caption || 'Curated fashion look'
        }"\n\nExplore full look & garment links on OOTDi!`,
      });
    } catch {}
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.modalContent}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <View>
              <Text style={styles.modalTitle}>LOOKBOOK EXPORT</Text>
              <Text style={styles.modalSub}>9:16 Story Card</Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => {
                hapticLight();
                onClose();
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={22} color="#FAF8F5" />
            </TouchableOpacity>
          </View>

          {/* 9:16 Editorial Card Preview */}
          <ScrollView
            contentContainerStyle={styles.cardScroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.storyCard, { width: CARD_WIDTH, height: CARD_HEIGHT }]}>
              {/* Editorial Header */}
              <View style={styles.cardHeader}>
                <View style={styles.mastheadRow}>
                  <Text style={styles.mastheadTitle}>OOTDi</Text>
                  <Text style={styles.mastheadVol}>LOOKBOOK // 04</Text>
                </View>
                <View style={styles.dividerLine} />
                <View style={styles.creatorRow}>
                  <Text style={styles.creatorHandle}>@{creator.username.toUpperCase()}</Text>
                  <Text style={styles.editionLabel}>AUTUMN / WINTER</Text>
                </View>
              </View>

              {/* Main Look Photo */}
              <View style={styles.photoFrame}>
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.storyImage}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />

                {/* Floating Garment Tag */}
                {products.length > 0 && (
                  <View style={styles.storyTagBadge}>
                    <Text style={styles.storyTagBadgeText}>
                      ✦ {products[0].productName ?? products[0].name ?? 'KEY PIECE'}
                    </Text>
                  </View>
                )}
              </View>

              {/* Editorial Footer */}
              <View style={styles.cardFooter}>
                {post.caption ? (
                  <Text style={styles.storyCaption} numberOfLines={2}>
                    "{post.caption}"
                  </Text>
                ) : null}

                {/* Product Breakdown */}
                {products.length > 0 && (
                  <View style={styles.garmentCredits}>
                    {products.slice(0, 3).map((prod: any, idx: number) => (
                      <View key={idx} style={styles.garmentLine}>
                        <Text style={styles.garmentBrand}>
                          {(prod.brand || 'CURATED').toUpperCase()}
                        </Text>
                        <Text style={styles.garmentItem} numberOfLines={1}>
                          {prod.productName || prod.name}
                        </Text>
                        {prod.price ? (
                          <Text style={styles.garmentPrice}>
                            {prod.currency || '₹'}{prod.price}
                          </Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.bottomWatermark}>
                  <Text style={styles.watermarkText}>VERIFIED LOOK ON OOTDi APP</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Action Bar */}
          <View style={styles.actionBar}>
            <TouchableOpacity
              style={styles.shareStoryBtn}
              onPress={handleShareStory}
              activeOpacity={0.85}
            >
              <Feather name="share" size={18} color="#0A0A0C" />
              <Text style={styles.shareStoryText}>SHARE TO STORY / WHATSAPP</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10,10,12,0.92)',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  modalTitle: {
    fontFamily: Typography.fontBody,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#D4AF37',
  },
  modalSub: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    color: '#FAF8F5',
    opacity: 0.7,
    marginTop: 2,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardScroll: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  storyCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D4CEBF',
    padding: 14,
    justifyContent: 'space-between',
  },
  cardHeader: {
    gap: 4,
  },
  mastheadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  mastheadTitle: {
    fontFamily: Typography.fontDisplay,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 3,
    color: '#0A0A0C',
  },
  mastheadVol: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#8A857B',
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#0A0A0C',
    marginVertical: 4,
  },
  creatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creatorHandle: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#0A0A0C',
  },
  editionLabel: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#8A857B',
  },
  photoFrame: {
    flex: 1,
    marginVertical: 10,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E8E3DA',
  },
  storyImage: {
    width: '100%',
    height: '100%',
  },
  storyTagBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(10,10,12,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 3,
  },
  storyTagBadgeText: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#FAF8F5',
  },
  cardFooter: {
    gap: 8,
  },
  storyCaption: {
    fontFamily: Typography.fontBody,
    fontSize: 11,
    fontStyle: 'italic',
    color: '#2C2B28',
    lineHeight: 15,
  },
  garmentCredits: {
    backgroundColor: '#F3EFEA',
    borderRadius: 4,
    padding: 8,
    gap: 4,
  },
  garmentLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  garmentBrand: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#8A857B',
    width: 60,
  },
  garmentItem: {
    flex: 1,
    fontFamily: Typography.fontBody,
    fontSize: 10,
    fontWeight: '600',
    color: '#0A0A0C',
  },
  garmentPrice: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    fontWeight: '700',
    color: '#D4AF37',
  },
  bottomWatermark: {
    alignItems: 'center',
    paddingTop: 4,
  },
  watermarkText: {
    fontFamily: Typography.fontBody,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#8A857B',
  },
  actionBar: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  shareStoryBtn: {
    backgroundColor: '#D4AF37',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 6,
    gap: 8,
  },
  shareStoryText: {
    fontFamily: Typography.fontBody,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#0A0A0C',
  },
});
