// ============================================================
// Budget Screen — Deprecated (Redirects directly to Complete)
// ============================================================

import React from 'react';
import { Redirect } from 'expo-router';

export default function BudgetScreen() {
  return <Redirect href="/(onboarding)/complete" />;
}
