import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';

interface SettingsScreenProps {
  onBack: () => void;
  onLogout?: () => void;
  onAccountDetailsPress?: () => void;
}

export default function SettingsScreen({ onBack, onLogout, onAccountDetailsPress }: SettingsScreenProps) {
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [cacheSize, setCacheSize] = useState('0 MB');
  const [clearingCache, setClearingCache] = useState(false);

  React.useEffect(() => {
    calculateCacheSize();
  }, []);

  const calculateCacheSize = async () => {
    try {
      const folderPaths = [FileSystem.cacheDirectory, FileSystem.documentDirectory];
      let totalSize = 0;

      for (const dir of folderPaths) {
        if (!dir) continue;
        const info = await FileSystem.getInfoAsync(dir);
        if (info.exists && info.isDirectory) {
          const files = await FileSystem.readDirectoryAsync(dir);
          for (const file of files) {
            // Ignore our custom downloads directory from this "Clear Cache" logic 
            // so users don't accidentally lose offline movies!
            if (file === 'showfim_downloads') continue;

            const fileInfo = await FileSystem.getInfoAsync(dir + file);
            if (fileInfo.exists && !fileInfo.isDirectory) {
              totalSize += fileInfo.size || 0;
            }
          }
        }
      }

      const sizeInMB = (totalSize / (1024 * 1024)).toFixed(1);
      setCacheSize(`${sizeInMB} MB`);
    } catch (e) {
      console.error('Error calculating cache size:', e);
      setCacheSize('Unknown');
    }
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear the app cache? This will not delete your offline downloads or account settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setClearingCache(true);
            try {
              const folderPaths = [FileSystem.cacheDirectory, FileSystem.documentDirectory];
              for (const dir of folderPaths) {
                if (!dir) continue;
                const info = await FileSystem.getInfoAsync(dir);
                if (info.exists && info.isDirectory) {
                  const files = await FileSystem.readDirectoryAsync(dir);
                  for (const file of files) {
                    if (file === 'downloads' || file === 'SQLite') continue; // Protect downloads and DB
                    await FileSystem.deleteAsync(dir + file, { idempotent: true });
                  }
                }
              }
              await calculateCacheSize();
              Alert.alert('Success', 'Cache cleared successfully.');
            } catch (e) {
              console.error('Failed to clear cache:', e);
              Alert.alert('Error', 'Failed to clear some cached files.');
            } finally {
              setClearingCache(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Sticky Header */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']} style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>App Settings</Text>
          <View style={{ width: 40 }} />
        </SafeAreaView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PREFERENCES</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={styles.iconBg}>
                  <MaterialIcons name="dark-mode" size={20} color="#9727e7" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Dark Mode</Text>
                  <Text style={styles.settingSubtitle}>Use dark theme</Text>
                </View>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#9727e7' }}
                thumbColor="white"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={styles.iconBg}>
                  <MaterialIcons name="notifications" size={20} color="#9727e7" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Notifications</Text>
                  <Text style={styles.settingSubtitle}>Push notifications</Text>
                </View>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#9727e7' }}
                thumbColor="white"
              />
            </View>
          </View>
        </View>

        {/* Data & Storage Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATA & STORAGE</Text>
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingItem} onPress={handleClearCache} disabled={clearingCache}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconBg, styles.iconBgGray]}>
                  <MaterialIcons name="delete-outline" size={20} color="#9ca3af" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Clear Cache</Text>
                  <Text style={styles.settingSubtitle}>Free up space</Text>
                </View>
              </View>
              <View style={styles.settingRight}>
                {clearingCache ? (
                  <ActivityIndicator size="small" color="#9727e7" />
                ) : (
                  <>
                    <Text style={styles.cacheSize}>{cacheSize}</Text>
                    <MaterialIcons name="chevron-right" size={20} color="#6b7280" />
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconBg, styles.iconBgGray]}>
                  <MaterialIcons name="info" size={20} color="#9ca3af" />
                </View>
                <Text style={styles.settingTitle}>App Version</Text>
              </View>
              <Text style={styles.versionText}>v2.4.0</Text>
            </View>
          </View>
        </View>

        {/* Log Out Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={onLogout}
        >
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1121',
  },
  header: {
    backgroundColor: 'rgba(26, 17, 33, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Manrope_700Bold',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  scrollContent: {
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6b7280',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 8,
  },
  settingsCard: {
    backgroundColor: '#2d2434',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1121',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBgGray: {
    // For non-primary icons
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cacheSize: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#9727e7',
  },
  versionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  logoutButton: {
    width: '100%',
    padding: 16,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#2d2434',
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});
