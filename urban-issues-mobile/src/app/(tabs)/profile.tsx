import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/auth-context';
import { Brand } from '@/constants/theme';

const ROLE_LABELS: Record<string, string> = {
  citizen: 'Citizen',
  contractor: 'Contractor',
  admin: 'Administrator',
  supervisor: 'City Supervisor',
};

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const initials =
    user?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ?? '?';

  const roleLabel = ROLE_LABELS[user?.role ?? ''] ?? user?.role ?? '';

  function handleLogout() {
    // After signOut the auth guard in the root layout swaps to the login screen.
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => void signOut() },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.heading}>Profile</Text>

      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
        <Text style={styles.fullName}>{user?.name}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{roleLabel}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Row label="Email" value={user?.email ?? ''} />
        <Divider />
        <Row label="Role" value={roleLabel} />
        <Divider />
        <Row label="User ID" value={user?.userId ? `${user.userId.slice(0, 8)}…` : ''} mono />
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={[rowStyles.value, mono && rowStyles.mono]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  label: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  value: { fontSize: 14, color: '#1E293B', fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  mono: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: '#64748B' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 20 },
  heading: { fontSize: 24, fontWeight: '700', color: '#1E293B', marginBottom: 28 },
  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  initials: { color: Brand.onPrimary, fontSize: 28, fontWeight: '700' },
  fullName: { fontSize: 20, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  roleBadge: {
    backgroundColor: Brand.tint,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  roleText: { color: Brand.primaryDark, fontSize: 13, fontWeight: '600' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    marginBottom: 24,
  },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 16 },
  logoutButton: {
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
  },
  logoutText: { color: '#DC2626', fontSize: 15, fontWeight: '600' },
});
