import React, { useState, useEffect } from 'react';
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
import { syncAll, getLastSyncedTime } from '@/services/syncService';
import { triggerHaptic } from '@/utils/haptics';
import {
  ChevronLeft,
  UploadCloud,
  FolderDown,
  RefreshCw,
  Cloud,
} from 'lucide-react-native';

export default function BackupScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeStore((s) => s.getColors());

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    async function loadLastSync() {
      const ts = await getLastSyncedTime();
      setLastSyncTime(ts);
    }
    loadLastSync();
  }, []);

  const formatLastSync = (ts: number | null) => {
    if (!ts) return 'Hali qilinmagan';
    const date = new Date(ts);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const handleCloudSync = async () => {
    setIsSyncing(true);
    triggerHaptic('medium');
    try {
      const result = await syncAll();
      if (result.success) {
        triggerHaptic('success');
        setLastSyncTime(result.lastSyncedAt || Date.now());
        Alert.alert(
          'Sinxronizatsiya yakunlandi',
          `MacBook va iPhone o'rtasidagi so'zlar sinxronlashtirildi!\n\nYuklangan: ${result.pushedCount ?? 0} ta\nOlingan: ${result.pulledCount ?? 0} ta`
        );
      } else {
        triggerHaptic('error');
        Alert.alert('Sinxronizatsiya xatosi', result.message);
      }
    } catch (err: any) {
      console.error('Sync error:', err);
      triggerHaptic('error');
      Alert.alert('Xatolik', err.message || 'Sinxronizatsiya bajarilmadi.');
    } finally {
      setIsSyncing(false);
    }
  };

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
          Backup & Sync
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Supabase Cloud Sync Card */}
        <Card variant="elevated" style={[styles.backupCard, { borderColor: colors.primary + '30', borderWidth: 1 }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#EEF2FF' }]}>
              <Cloud size={24} color="#4F46E5" />
            </View>
            <View style={styles.textColumn}>
              <View style={styles.statusRow}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  Supabase Cloud Sync
                </Text>
                <View style={[styles.badge, { backgroundColor: '#DCFCE7' }]}>
                  <Text style={[styles.badgeText, { color: '#166534' }]}>Ulangan</Text>
                </View>
              </View>
              <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                {"MacBook va iPhone o'rtasida so'zlarni avtomatik sinxronlash."}
              </Text>
              <Text style={[styles.syncStatusText, { color: colors.textSecondary }]}>
                Oxirgi sinxronizatsiya: {formatLastSync(lastSyncTime)}
              </Text>
            </View>
          </View>

          <Button
            title={isSyncing ? 'Sinxronlashtirilmoqda...' : 'Hozir Sinxronlash'}
            onPress={handleCloudSync}
            loading={isSyncing}
            variant="primary"
            size="lg"
            icon={<RefreshCw size={18} color="#FFFFFF" />}
            style={styles.actionBtn}
          />
        </Card>

        {/* Export Backup Card */}
        <Card variant="elevated" style={styles.backupCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: colors.statFlameBg }]}>
              <UploadCloud size={24} color={colors.primary} />
            </View>
            <View style={styles.textColumn}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Export Backup (JSON)
              </Text>
              <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                {"Barcha so'z va ma'lumotlarni offline fayl (.json) sifatida saqlab olish."}
              </Text>
            </View>
          </View>

          <Button
            title="Export to Files"
            onPress={handleExportBackup}
            loading={isExporting}
            variant="secondary"
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
                {"Zaxira fayldan barcha lug'atlarni qayta yuklash."}
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
          {"Local-first xavfsizlik: Barcha ma'lumotlar qurilmangizning o'zida ham offline saqlanadi."}
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  syncStatusText: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  actionBtn: {
    width: '100%',
    height: 52,
    borderRadius: 16,
  },
  bottomNote: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 18,
    paddingHorizontal: 24,
  },
});
