import { Ionicons } from '@expo/vector-icons';
import type { PropsWithChildren } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { adminColors, adminFontSize, adminRadius } from '@/config/adminTheme';
import { Text } from '@/shared/ui';

interface AdminModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  /** Dialog width on desktop; it shrinks to fit narrower windows. */
  width?: number;
}

/** A centred dialog over a dimmed canvas: a header with a close button, then the content. */
export function AdminModal({
  isOpen,
  title,
  subtitle,
  onClose,
  width = 520,
  children,
}: PropsWithChildren<AdminModalProps>) {
  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable
          accessibilityLabel="Close dialog"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[styles.dialog, { maxWidth: width }]}
          accessibilityViewIsModal
          accessibilityLabel={title}
        >
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>{title}</Text>
              {subtitle !== undefined && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              hitSlop={6}
              style={({ pressed }) => [styles.close, pressed && styles.closePressed]}
            >
              <Ionicons name="close" size={18} color={adminColors.textMuted} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  dialog: {
    width: '100%',
    maxHeight: '100%',
    backgroundColor: adminColors.surface,
    borderRadius: adminRadius.panel,
    borderWidth: 1,
    borderColor: adminColors.border,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  headerText: { flex: 1, gap: 2 },
  title: { fontSize: adminFontSize.lg, fontWeight: '600', color: adminColors.text },
  subtitle: { fontSize: adminFontSize.sm, color: adminColors.textMuted },
  close: { padding: 4, borderRadius: 6 },
  closePressed: { backgroundColor: adminColors.surfaceMuted },
  body: { padding: 20, gap: 12 },
});
