import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { API_CONFIG } from '@/api/config';

// Shown whenever EXPO_PUBLIC_USE_MOCK is on, so a demo can't accidentally
// pass canned data off as real.
function MockBanner() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ backgroundColor: '#F59E0B', paddingTop: insets.top, alignItems: 'center' }}>
      <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700', paddingVertical: 4 }}>
        MOCK DATA
      </Text>
    </View>
  );
}

// Root layout: wraps every screen and loads the saved session on startup
export default function RootLayout() {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, []);

  return (
    <>
      {API_CONFIG.useMock && <MockBanner />}
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
    </>
  );
}
