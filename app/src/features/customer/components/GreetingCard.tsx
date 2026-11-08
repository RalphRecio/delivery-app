import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, fontSize, radius, shadow, spacing } from '@/config/theme';
import { useCurrentUser } from '@/features/auth';
import { SERVICE_OFFERINGS, type ServiceOffering } from '@/features/booking';
import { Text } from '@/shared/ui';

import { filipinoGreeting } from '@/shared/lib/format';

interface GreetingCardProps {
  onBook: (offering: ServiceOffering) => void;
}

/**
 * The white card that rides over the green banner: "Magandang umaga, Ali!"
 * and a row of the four services as icon tiles, the quickest way to book.
 */
export function GreetingCard({ onBook }: GreetingCardProps) {
  const me = useCurrentUser();
  const firstName = me.data?.first_name;

  return (
    <View style={styles.card}>
      <View style={styles.greeting}>
        <Text style={styles.hello}>
          {filipinoGreeting(new Date())}
          {firstName !== undefined ? `, ${firstName}` : ''}!
        </Text>
        <Text style={styles.sub}>saan tayo magpapasuyo ngayon?</Text>
      </View>
      <View style={styles.services} accessibilityRole="menu">
        {SERVICE_OFFERINGS.map((offering) => (
          <Pressable
            key={offering.key}
            accessibilityRole="button"
            accessibilityLabel={`Book ${offering.title}`}
            onPress={() => onBook(offering)}
            style={({ pressed }) => [styles.service, pressed && styles.servicePressed]}
          >
            <View style={styles.iconTile}>
              <Ionicons name={offering.icon} size={26} color={colors.primaryPressed} />
            </View>
            <Text style={styles.serviceLabel} numberOfLines={1}>
              {offering.shortTitle}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.card,
    backgroundColor: colors.background,
    ...shadow.card,
  },
  greeting: { gap: 2 },
  hello: { fontSize: fontSize.lg + 2, fontWeight: '800', color: colors.primaryDeep },
  sub: { fontSize: fontSize.md - 1, color: colors.textMuted },
  services: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.xs },
  service: { flex: 1, alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xs },
  servicePressed: { opacity: 0.7 },
  iconTile: {
    width: 56,
    height: 56,
    borderRadius: radius.card,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
});
