import { StyleSheet, Text, View } from 'react-native';

export const CATEGORY_EMOJI: Record<string, string> = {
  waste: '🗑️',
  road: '🚧',
  lighting: '💡',
  water: '💧',
  safety: '⚠️',
  other: '📋',
};

export function CategoryBadge({ category }: { category: string }) {
  const emoji = CATEGORY_EMOJI[category] ?? '📋';
  const label = category.charAt(0).toUpperCase() + category.slice(1);
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>
        {emoji} {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  text: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
});
