import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Switch, View } from 'react-native';

import { colors, fontSize, radius, shadow, spacing } from '@/config/theme';
import { Text } from '@/shared/ui';

interface AvailabilitySwitchProps {
  isOnline: boolean;
  onChange: (isOnline: boolean) => void;
  isSaving: boolean;
}

/** The rider's main control: a bold card that turns green while they are taking jobs. */
export function AvailabilitySwitch({ isOnline, onChange, isSaving }: AvailabilitySwitchProps) {
  return (
    <View style={[styles.card, isOnline && styles.cardOnline]}>
      <View style={[styles.iconCircle, isOnline && styles.iconCircleOnline]}>
        <Ionicons name="power" size={24} color={isOnline ? colors.primary : colors.textMuted} />
      </View>
      <View style={styles.text}>
        <Text style={[styles.title, isOnline && styles.onPrimary]}>
          {isOnline ? 'You are online' : 'You are offline'}
        </Text>
        <Text style={[styles.caption, isOnline && styles.onPrimary]}>
          {isOnline ? 'Jobs near you appear below.' : 'Go online to receive jobs.'}
        </Text>
      </View>
      <Switch
        accessibilityLabel="Online"
        value={isOnline}
        onValueChange={onChange}
        disabled={isSaving}
        trackColor={{ true: colors.primarySoft, false: colors.border }}
        thumbColor={isOnline ? colors.onPrimary : colors.background}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    ...shadow.card,
  },
  cardOnline: { backgroundColor: colors.primary, borderColor: colors.primary },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleOnline: { backgroundColor: colors.onPrimary },
  text: { flex: 1, gap: 2 },
  title: { fontSize: fontSize.lg, fontWeight: '800', color: colors.primaryDeep },
  caption: { fontSize: fontSize.sm, color: colors.textMuted },
  onPrimary: { color: colors.onPrimary },
});
