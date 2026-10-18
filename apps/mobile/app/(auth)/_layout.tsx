import { Stack } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { Redirect } from 'expo-router';

export default function AuthLayout() {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user?.isOnboarded) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FAF9F7' },
        animation: 'slide_from_right',
      }}
    />
  );
}
