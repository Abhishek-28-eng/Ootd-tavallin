// ============================================================
// Haptics Helper — Safe wrapper around expo-haptics
// Bypasses gracefully on web/unsupported devices
// ============================================================

import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export function hapticLight(): void {
  if (Platform.OS === 'web') return;
  try {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {}
}

export function hapticMedium(): void {
  if (Platform.OS === 'web') return;
  try {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {}
}

export function hapticHeavy(): void {
  if (Platform.OS === 'web') return;
  try {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch {}
}

export function hapticSuccess(): void {
  if (Platform.OS === 'web') return;
  try {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {}
}

export function hapticSelection(): void {
  if (Platform.OS === 'web') return;
  try {
    void Haptics.selectionAsync();
  } catch {}
}
