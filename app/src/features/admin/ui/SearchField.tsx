import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { adminColors, adminFontSize, adminRadius } from '@/config/adminTheme';

interface SearchFieldProps extends Omit<TextInputProps, 'style'> {
  /** Spoken by screen readers; the visible hint is the placeholder. */
  label: string;
}

/** The list-page search box: icon on the left, compact height, no visible label. */
export function SearchField({ label, ...props }: SearchFieldProps) {
  return (
    <View style={styles.frame}>
      <Ionicons name="search-outline" size={16} color={adminColors.textFaint} />
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={adminColors.textFaint}
        style={styles.input}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 36,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: adminColors.borderStrong,
    borderRadius: adminRadius.control,
    backgroundColor: adminColors.surface,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: adminFontSize.base,
    color: adminColors.text,
  },
});
