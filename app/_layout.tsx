import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments, Slot } from 'expo-router';
import { useUserStore } from '@/store/userStore';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { user } = useUserStore();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  useEffect(() => {
    // Esperar a que la navegación esté lista
    const timer = setTimeout(() => {
      setIsNavigationReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isNavigationReady) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    console.log('Navigation check:', {
      hasUser: !!user,
      inAuthGroup,
      inTabsGroup,
      segments,
    });

    // Si no hay usuario y no está en auth, redirigir a login
    if (!user && !inAuthGroup) {
      console.log('No user, redirecting to login');
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 50);
    }

    // Si hay usuario y está en auth, redirigir a home
    if (user && inAuthGroup) {
      console.log('User logged in, redirecting to home');
      setTimeout(() => {
        router.replace('/(tabs)/home');
      }, 50);
    }
  }, [user, segments, isNavigationReady]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
