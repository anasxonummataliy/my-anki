import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '@/store/themeStore';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import {
  exportBackupToJson,
  importBackupFromFile,
} from '@/services/backupService';
import { triggerHaptic } from '@/utils/haptics';
import {
  ChevronLeft,
  UploadCloud,
  FolderDown,
} from 'lucide-react-native';

export default function BackupScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeStore((s) => s.getColors());

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExportBackup = async () => {
    setIsExporting(true);
    triggerHaptic('medium');
    try {
      await exportBackupToJson();
      triggerHaptic('success');
    } catch (err: any) {
      console.error('Export error:', err);
      triggerHaptic('error');
      Alert.alert('Export Failed', err.message || 'Could not export backup file.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportBackup = async () => {
    Alert.alert(
      'Restore Database from Backup',
      'Restoring a backup will replace your current vocabulary, review intervals, and quiz history with the backup file data.\n\nAre you sure you want to proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Choose Backup File',
          style: 'destructive',
          onPress: async () => {
            setIsImporting(true);
            try {
              const res = await importBackupFromFile();
              if (res.success) {
                triggerHaptic('success');
                Alert.alert('Restore Complete', res.message);
              } else if (res.message !== 'Import cancelled') {
                triggerHaptic('error');
                Alert.alert('Import Failed', res.message);
              }
            } catch (err: any) {
              console.error('Import error:', err);
              triggerHaptic('error');
              Alert.alert('Import Failed', err.message || 'Invalid or corrupt backup file.');
            } finally {
              setIsImporting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 16,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ChevronLeft size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Backup & Restore
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Export Backup Card */}
        <Card variant="elevated" style={styles.backupCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: colors.statFlameBg }]}>
              <UploadCloud size={24} color={colors.primary} />
            </View>
            <View style={styles.textColumn}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Export Backup
              </Text>
              <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                Save your data as a .JSON file to keep your vocabulary safe.
              </Text>
            </View>
          </View>

          <Button
            title="Export to Files"
            onPress={handleExportBackup}
            loading={isExporting}
            variant="primary"
            size="lg"
            style={styles.actionBtn}
          />
        </Card>

        {/* Import Backup Card */}
        <Card variant="elevated" style={styles.backupCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: colors.statBlueBg }]}>
              <FolderDown size={24} color={colors.statBlue} />
            </View>
            <View style={styles.textColumn}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Import Backup
              </Text>
              <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                Restore your data from a backup file.
              </Text>
            </View>
          </View>

          <Button
            title="Choose File"
            onPress={handleImportBackup}
            loading={isImporting}
            variant="secondary"
            size="lg"
            style={styles.actionBtn}
          />
        </Card>

        {/* Bottom Note */}
        <Text style={[styles.bottomNote, { color: colors.textSecondary }]}>
          Backup includes: vocabulary, decks, review schedules, history and settings.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  backupCard: {
    padding: 22,
    borderRadius: 22,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textColumn: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionBtn: {
    width: '100%',
    height: 52,
    borderRadius: 16,
  },
  bottomNote: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
    paddingHorizontal: 24,
  },
});
