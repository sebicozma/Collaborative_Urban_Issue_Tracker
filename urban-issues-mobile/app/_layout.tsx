import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

// Root layout: wraps every screen and loads the saved session on startup
export default function RootLayout() {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, []);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(app)" options={{ headerShown: false }} />
      {/* Report detail is a modal-style stack push over the tabs */}
      <Stack.Screen
        name="report/[id]"
        options={{
          title: 'Report Details',
          headerTintColor: '#2563EB',
          headerBackTitle: 'Back',
        }}
      />
    </Stack>
  );
}
