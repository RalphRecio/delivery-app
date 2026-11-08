import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { colors, fontSize, radius, shadow, spacing } from '@/config/theme';
import { Alert, Input, Text } from '@/shared/ui';

import { useAddressSearch } from '../hooks/useAddressSearch';
import { useCurrentPosition } from '../hooks/useCurrentPosition';
import { useReverseGeocode } from '../hooks/useReverseGeocode';
import type { PlaceSuggestion } from '../lib/searchPlaces';
import type { LatLng } from '../types';

import { MapPicker } from './MapPicker';

export interface PickedLocation {
  address: string;
  landmark: string;
  details: string;
  point: LatLng | null;
}

export const EMPTY_PICKED_LOCATION: PickedLocation = {
  address: '',
  landmark: '',
  details: '',
  point: null,
};

interface LocationPickerProps {
  title: string;
  value: PickedLocation;
  onChange: (value: PickedLocation) => void;
  errors?: Partial<Record<keyof PickedLocation, string>>;
  editable?: boolean;
  /** Placeholder for the details field; differs for a store vs. a home. */
  detailsPlaceholder?: string;
  /** False hides the details field (an admin placing a store has no door-level details). */
  hasDetails?: boolean;
}

const MAP_HEIGHT = 200;

/**
 * Grab-style location entry. Type an address to get a list of places, pick
 * one and the pin jumps there; or use the device location; or drag the map
 * and the address fills in from the pin. Then add a landmark and door-level
 * details for the rider.
 */
export function LocationPicker({
  title,
  value,
  onChange,
  errors,
  editable = true,
  detailsPlaceholder = 'Floor, unit, gate colour, who to call',
  hasDetails = true,
}: LocationPickerProps) {
  const position = useCurrentPosition();
  const geocoded = useReverseGeocode(value.point);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const search = useAddressSearch(value.address, value.point, isSearchOpen);
  // True from the moment the pin is dragged until the address for it has been applied.
  const isAwaitingAddress = useRef(false);

  const update = (patch: Partial<PickedLocation>) => onChange({ ...value, ...patch });

  useEffect(() => {
    if (isAwaitingAddress.current && geocoded.address !== undefined && geocoded.address !== null) {
      isAwaitingAddress.current = false;
      onChange({ ...value, address: geocoded.address });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geocoded.address]);

  const movePin = (point: LatLng) => {
    if (
      value.point !== null &&
      Math.abs(value.point.latitude - point.latitude) < 1e-5 &&
      Math.abs(value.point.longitude - point.longitude) < 1e-5
    ) {
      return;
    }

    isAwaitingAddress.current = true;
    setIsSearchOpen(false);
    update({ point });
  };

  const choose = (suggestion: PlaceSuggestion) => {
    isAwaitingAddress.current = false;
    setIsSearchOpen(false);
    update({ address: `${suggestion.title}, ${suggestion.subtitle}`, point: suggestion.point });
  };

  const locateMe = async () => {
    const point = await position.locate();

    if (point !== null) {
      movePin(point);
    }
  };

  const showList = isSearchOpen && editable;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="location" size={18} color={colors.primaryPressed} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Use my location"
          onPress={() => void locateMe()}
          disabled={!editable || position.isLocating}
          style={({ pressed }) => [styles.locateChip, pressed && styles.rowPressed]}
        >
          {position.isLocating ? (
            <ActivityIndicator color={colors.primaryPressed} />
          ) : (
            <Ionicons name="navigate" size={14} color={colors.primaryPressed} />
          )}
          <Text style={styles.locateChipText}>Use my location</Text>
        </Pressable>
      </View>
      {value.point !== null && (
        <Text variant="caption">
          Pin at {value.point.latitude.toFixed(5)}, {value.point.longitude.toFixed(5)}
          {geocoded.isResolving ? ' · finding address…' : ''}
        </Text>
      )}

      <Input
        label={`${title} address`}
        placeholder="Search a place or street"
        value={value.address}
        onChangeText={(address) => {
          setIsSearchOpen(true);
          update({ address });
        }}
        onFocus={() => setIsSearchOpen(true)}
        error={errors?.address ?? errors?.point}
        editable={editable}
        accessibilityHint="Type to see matching places"
      />

      {showList && (
        <View style={styles.list} accessibilityRole="list">
          {search.isSearching && (
            <View style={styles.row}>
              <ActivityIndicator color={colors.textMuted} />
              <Text variant="caption">Searching…</Text>
            </View>
          )}
          {search.suggestions.map((suggestion) => (
            <Pressable
              key={suggestion.id}
              accessibilityRole="button"
              accessibilityLabel={`${suggestion.title}, ${suggestion.subtitle}`}
              onPress={() => choose(suggestion)}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <View style={styles.rowIcon}>
                <Ionicons name="location-outline" size={18} color={colors.textMuted} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {suggestion.title}
                </Text>
                <Text variant="caption" numberOfLines={1}>
                  {suggestion.subtitle}
                </Text>
              </View>
            </Pressable>
          ))}
          {!search.isSearching &&
            search.suggestions.length === 0 &&
            value.address.trim().length >= 3 && (
              <Text variant="caption" style={styles.hint}>
                No places match. Keep typing, or drag the map to the exact spot.
              </Text>
            )}
          <Pressable
            accessibilityRole="button"
            onPress={() => setIsSearchOpen(false)}
            style={styles.closeRow}
          >
            <Text style={styles.closeText}>Done</Text>
          </Pressable>
        </View>
      )}

      {position.error !== undefined && <Alert tone="error" message={position.error} />}

      <View style={styles.mapFrame}>
        <MapPicker
          value={value.point}
          onChange={movePin}
          height={MAP_HEIGHT}
          testID={`${title}-map`}
        />
        {value.point === null && (
          <View pointerEvents="none" style={styles.mapHint}>
            <Text style={styles.mapHintText}>Drag the map to drop the pin</Text>
          </View>
        )}
      </View>

      <View style={styles.extra}>
        <Input
          label="Landmark (optional)"
          placeholder="e.g. beside 7-Eleven, across the church"
          value={value.landmark}
          onChangeText={(landmark) => update({ landmark })}
          error={errors?.landmark}
          editable={editable}
        />
        {hasDetails && (
          <Input
            label="Other details (optional)"
            placeholder={detailsPlaceholder}
            value={value.details}
            onChangeText={(details) => update({ details })}
            error={errors?.details}
            editable={editable}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: fontSize.lg, fontWeight: '700' },
  locateChip: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  locateChipText: { color: colors.primaryPressed, fontWeight: '600', fontSize: fontSize.sm },
  list: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowPressed: { backgroundColor: colors.surface },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconAccent: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowTitle: { fontWeight: '600' },
  hint: { padding: spacing.sm + 2 },
  closeRow: { alignItems: 'center', padding: spacing.sm },
  closeText: { color: colors.primaryPressed, fontWeight: '600' },
  mapFrame: { borderRadius: radius.md, overflow: 'hidden' },
  mapHint: { position: 'absolute', left: 0, right: 0, bottom: spacing.sm, alignItems: 'center' },
  mapHintText: {
    backgroundColor: colors.text,
    color: colors.onPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    fontSize: fontSize.sm,
    overflow: 'hidden',
  },
  extra: { gap: spacing.sm },
});
