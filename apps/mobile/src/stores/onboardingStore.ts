// ============================================================
// Onboarding Store — Multi-step onboarding state management
// ============================================================

import { create } from 'zustand';
import type { StyleCategory, Occasion, ColorPreference } from '@tavallin/shared';

interface OnboardingState {
  displayName: string;
  bio: string;
  styleCategories: StyleCategory[];
  occasions: Occasion[];
  colorPreferences: ColorPreference[];
  budgetMin: number;
  budgetMax: number;
  currency: string;

  setDisplayName: (displayName: string) => void;
  setBio: (bio: string) => void;
  toggleStyle: (style: StyleCategory) => void;
  toggleOccasion: (occasion: Occasion) => void;
  toggleColor: (color: ColorPreference) => void;
  setBudget: (budgetMin: number, budgetMax: number, currency?: string) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  displayName: '',
  bio: '',
  styleCategories: [],
  occasions: [],
  colorPreferences: [],
  budgetMin: 500,
  budgetMax: 5000,
  currency: 'INR',

  setDisplayName: (displayName) => set({ displayName }),
  setBio: (bio) => set({ bio }),
  toggleStyle: (style) =>
    set((state) => ({
      styleCategories: state.styleCategories.includes(style)
        ? state.styleCategories.filter((s) => s !== style)
        : [...state.styleCategories, style],
    })),
  toggleOccasion: (occasion) =>
    set((state) => ({
      occasions: state.occasions.includes(occasion)
        ? state.occasions.filter((o) => o !== occasion)
        : [...state.occasions, occasion],
    })),
  toggleColor: (color) =>
    set((state) => ({
      colorPreferences: state.colorPreferences.includes(color)
        ? state.colorPreferences.filter((c) => c !== color)
        : [...state.colorPreferences, color],
    })),
  setBudget: (budgetMin, budgetMax, currency = 'INR') =>
    set({ budgetMin, budgetMax, currency }),
  reset: () =>
    set({
      displayName: '',
      bio: '',
      styleCategories: [],
      occasions: [],
      colorPreferences: [],
      budgetMin: 500,
      budgetMax: 5000,
      currency: 'INR',
    }),
}));
