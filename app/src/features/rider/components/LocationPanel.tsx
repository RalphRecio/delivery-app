import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/config/theme';
import { useCurrentPosition } from '@/features/map';
import { Alert, Button, Card, Disclosure, Input, Text } from '@/shared/ui';

import { SAMPLE_RIDER_LOCATION } from '../lib/sampleLocation';
import { locationFormSchema } from '../schemas/riderSchemas';
import type { LocationInput, RiderProfile } from '../types';

interface LocationPanelProps {
  profile: RiderProfile;
  onSubmit: (location: LocationInput) => void;
  isSaving: boolean;
  saveError?: string;
}

/**
 * Where the rider is. The device location is the main action; typing
 * coordinates or using the sample point stays available for testing until
 * the native location module is wired in.
 */
export function LocationPanel({ profile, onSubmit, isSaving, saveError }: LocationPanelProps) {
  const [latitude, setLatitude] = useState(String(profile.current_location?.latitude ?? ''));
  const [longitude, setLongitude] = useState(String(profile.current_location?.longitude ?? ''));
  const [error, setError] = useState<string>();
  const position = useCurrentPosition();
  const hasShared = profile.location_updated_at !== null;

  const submit = (input: { latitude: string; longitude: string }) => {
    const parsed = locationFormSchema.safeParse(input);

    if (!parsed.success) {
      setError('Enter a latitude between -90 and 90 and a longitude between -180 and 180.');

      return;
    }

    setError(undefined);
    onSubmit(parsed.data);
  };

  const applyDeviceLocation = async () => {
    const location = await position.locate();

    if (location === null) {
      return;
    }

    setLatitude(String(location.latitude));
    setLongitude(String(location.longitude));
    setError(undefined);
    onSubmit(location);
  };

  const applySampleLocation = () => {
    setLatitude(String(SAMPLE_RIDER_LOCATION.latitude));
    setLongitude(String(SAMPLE_RIDER_LOCATION.longitude));
    setError(undefined);
    onSubmit(SAMPLE_RIDER_LOCATION);
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconCircle, !hasShared && styles.iconCircleWarning]}>
          <Ionicons
            name={hasShared ? 'location' : 'location-outline'}
            size={22}
            color={hasShared ? colors.primaryDeep : '#8A5A00'}
          />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Your location</Text>
          <Text variant="caption">
            {hasShared && profile.location_updated_at !== null
              ? `Updated ${new Date(profile.location_updated_at).toLocaleTimeString()}`
              : 'Not shared yet. Jobs are matched to where you are.'}
          </Text>
        </View>
      </View>
      {(error ?? saveError) !== undefined && (
        <Alert tone="error" message={error ?? saveError ?? ''} />
      )}
      <Button
        icon="locate"
        label="Use my current location"
        onPress={() => void applyDeviceLocation()}
        isLoading={position.isLocating}
        disabled={isSaving}
      />
      <Disclosure
        title="Enter coordinates"
        hint="Type a position or use the sample point."
        isForcedOpen={error !== undefined}
      >
        <View style={styles.row}>
          <View style={styles.half}>
            <Input
              label="Latitude"
              keyboardType="numbers-and-punctuation"
              value={latitude}
              onChangeText={setLatitude}
              editable={!isSaving}
            />
          </View>
          <View style={styles.half}>
            <Input
              label="Longitude"
              keyboardType="numbers-and-punctuation"
              value={longitude}
              onChangeText={setLongitude}
              editable={!isSaving}
            />
          </View>
        </View>
        <Button
          variant="secondary"
          label="Update location"
          onPress={() => submit({ latitude, longitude })}
          isLoading={isSaving}
        />
        <Button
          variant="ghost"
          label="Use sample location"
          onPress={applySampleLocation}
          disabled={isSaving}
        />
      </Disclosure>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleWarning: { backgroundColor: colors.warningSoft },
  headerText: { flex: 1, gap: 2 },
  title: { fontSize: fontSize.md, fontWeight: '700', color: colors.primaryDeep },
  row: { flexDirection: 'row', gap: spacing.sm },
  half: { flex: 1 },
});
