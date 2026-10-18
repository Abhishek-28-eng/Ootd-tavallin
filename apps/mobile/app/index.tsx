import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';

export default function Index() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (!user?.isOnboarded) {
    return <Redirect href={user?.displayName ? '/(onboarding)/style-preferences' : '/(onboarding)/display-name'} />;
  }

  return <Redirect href="/(tabs)" />;
}
