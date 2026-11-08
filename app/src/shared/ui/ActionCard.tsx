import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/config/theme';

import { Button } from './Button';
import { Text } from './Text';

interface ActionCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionLabel: string;
  onPress: () => void;
}

/** A highlighted choice with one button, e.g. "Book without a store". */
export function ActionCard({ icon, title, description, actionLabel, onPress }: ActionCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconCircle}>
          <Ionicons name={icon} size={22} color={colors.primaryDeep} />
        </View>
        <View style={styles.text}>
          <Text style={styles.title}>{title}</Text>
          <Text variant="caption">{description}</Text>
        </View>
      </View>
      <Button variant="secondary" label={actionLabel} onPress={onPress} />
    </View>
  );
}

const ICON_SIZE = 44;

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconCircle: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: 2 },
  title: { fontWeight: '700', color: colors.primaryDeep },
});
