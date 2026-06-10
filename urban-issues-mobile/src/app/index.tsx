import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/auth-context';
import { Brand } from '@/constants/theme';

export default function HomeScreen() {
  const { user, signOut } = useAuth();

  const initials = (user?.name ?? 'U')
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>Signed in as</Text>
          <Text style={styles.name}>{user?.name ?? 'Citizen'}</Text>
          {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}
        </View>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role ?? 'citizen'}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.bodyTitle}>You&apos;re in 🎉</Text>
        <Text style={styles.bodySubtitle}>
          Authentication works. Reports and the map come next.
        </Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.signOut, pressed && styles.signOutPressed]}
        onPress={signOut}
      >
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.primaryDarker,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  avatar: {
    height: 48,
    width: 48,
    borderRadius: 24,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Brand.onPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    color: Brand.accent,
    fontSize: 12,
  },
  name: {
    color: '#f0fdf4',
    fontSize: 18,
    fontWeight: '700',
  },
  email: {
    color: '#a7f3d0',
    fontSize: 13,
    marginTop: 1,
  },
  roleBadge: {
    backgroundColor: Brand.primary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  roleText: {
    color: Brand.onPrimary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  bodySubtitle: {
    fontSize: 15,
    color: '#64748b',
    marginTop: 6,
    textAlign: 'center',
    maxWidth: 280,
  },
  signOut: {
    borderWidth: 1,
    borderColor: Brand.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutPressed: {
    backgroundColor: Brand.tint,
  },
  signOutText: {
    color: Brand.primaryDark,
    fontSize: 16,
    fontWeight: '700',
  },
});
