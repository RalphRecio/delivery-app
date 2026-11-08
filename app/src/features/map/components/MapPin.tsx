import { StyleSheet, View } from 'react-native';

import { colors } from '@/config/theme';

const PIN_SIZE = 22;
const STEM_HEIGHT = 12;

/** The fixed centre marker drawn over the map; its tip is the chosen point. */
export function MapPin() {
  return (
    <View pointerEvents="none" style={styles.overlay}>
      <View style={styles.pin}>
        <View style={styles.head} />
        <View style={styles.stem} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    // Leaflet's panes sit at z-index 400 and up; the pin must paint above them.
    zIndex: 1000,
  },
  // Shift up by the stem so the tip sits exactly on the centre.
  pin: { alignItems: 'center', marginBottom: PIN_SIZE + STEM_HEIGHT },
  head: {
    width: PIN_SIZE,
    height: PIN_SIZE,
    borderRadius: PIN_SIZE / 2,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.onPrimary,
  },
  stem: { width: 3, height: STEM_HEIGHT, backgroundColor: colors.primary },
});
