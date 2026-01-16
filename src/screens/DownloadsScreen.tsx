import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// Mock Data
const DOWNLOADED_ITEMS = [
  { 
    id: '1', 
    title: 'Oppenheimer', 
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA1OaN1AAADuoJ9lBv_MRXYprBDQetUFmyJoQIwna340GyOw6gAJQu4gv4HxvCvIDpITo8hmsCnXYaioKI5ZFE51dWbAEFxVMv0xZvdFCcpZubi7F57-dx_Gmg0beAcjOzpMfHZCHFT-S1DrRsXv9NsjYootgLcLlyW-uVeNqr4vlTQx7mqLhR2xuczPxIqsVfzz2Rp19Q9DsJ_Dlf7eEsnw4N_6KPfn6szkT_m-i4tEipcCmxAGGpCAAzny5k8umLgwRHnMguqQQhi',
    duration: '3h 0min',
    size: '4.2 GB',
    progress: 100
  },
  { 
    id: '2', 
    title: 'Spider-Man: Across the Spider-Verse', 
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBzfA2qZivHhnKpON-XgiyTEH1aEqTI06MYx7cUd0Z3deuz0Jp4TW4MT0_3DAogQdJS01cWkf64l2kHh8AtwVYHsZeM9ybryVD3-g0B27FNtmnQo28tURZwpWtD5uiJGLjF2NzUhXMdbHKDLJ85sjt-_5UV3wlKKKMrSdkbM2kvUEjkarVPUcwV8JUcgYuQgcFf94nMg4gfgs7kPC-UMmXDFfME4z1QvlcgvfsJG5ddPoIhstku0Ayo59bDaqNlD03Hw-qkCN_6caOy',
    duration: '2h 20min',
    size: '3.1 GB',
    progress: 100
  },
  { 
    id: '3', 
    title: 'The Batman', 
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDbUlWINzFTvCg3f2BwYb88h35QV6RzeS3fZB-rV1O_n2xT0AnLAxmPY9qhbrlA0YYYfdkphMhN-9iHznaVlsx1Ch0LRgAglCdylQMVZDd3-Mrs_zup4pZFdy2cQoIetWLoQ9rFly_Pjgb0hklVokBMyzlaXuL6JJH6bZJzYOiTTUporsz4BgZ1-Kt-BrJ4MYajbloDVyoGYpBR_xGHKDH_6OoK5-w87N-6pn-7Rmga1dagzEM-gSI4m--yvw6NvNfyUHONnjGBcBIU',
    duration: '2h 56min',
    size: '5.5 GB',
    progress: 100
  }
];

export default function DownloadsScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Sticky Header */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']} style={styles.headerContent}>
          <Text style={styles.headerTitle}>My Downloads</Text>
          <TouchableOpacity style={styles.settingsBtn}>
            <MaterialIcons name="settings" size={24} color="#9ca3af" />
          </TouchableOpacity>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Storage Indicator Card */}
        <View style={styles.storageCard}>
           <View style={styles.storageHeader}>
              <View>
                 <Text style={styles.storageLabel}>DEVICE STORAGE</Text>
                 <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
                    <Text style={styles.storageUsed}>32</Text>
                    <Text style={styles.storageUnit}>GB used</Text>
                 </View>
              </View>
              <Text style={styles.storageTotal}>of 128GB</Text>
           </View>

           {/* Progress Bar */}
           <View style={styles.storageBarBg}>
              <View style={[styles.storageBarFill, { width: '25%', backgroundColor: '#9727e7' }]} />
              <View style={[styles.storageBarFill, { width: '15%', backgroundColor: 'rgba(129, 140, 248, 0.5)' }]} />
           </View>

           <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                 <View style={[styles.legendDot, { backgroundColor: '#9727e7' }]} />
                 <Text style={styles.legendText}>Showfim</Text>
              </View>
              <View style={styles.legendItem}>
                 <View style={[styles.legendDot, { backgroundColor: 'rgba(129, 140, 248, 0.5)' }]} />
                 <Text style={styles.legendText}>Other Apps</Text>
              </View>
           </View>
        </View>

        {/* Active Downloads Section */}
        <View style={styles.sectionHeader}>
           <Text style={styles.sectionTitle}>Active Downloads</Text>
           <View style={styles.badge}><Text style={styles.badgeText}>1 item</Text></View>
        </View>

        <View style={styles.activeDownloadCard}>
           {/* Glow Effect */}
           <View style={styles.activeGlow} />

           <View style={{ flexDirection: 'row', gap: 16 }}>
              <View style={styles.activePosterWrapper}>
                 <Image 
                    source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuABIidZj6YoRffhKLY22LrqhqlW_lhKEkUAUQwmAI3wdZofzjZe2ZzpKR9XUkD3ogEq6JrD732mrj03fizq3cfDGYKx4PHAvblUJZMIZEJ-vpui67wyY9dmo0mgWKuMJDa8mftrmms-TLl9CydCyTZGE7bqZSBw0QAqVkxzzbjyK_ZTqp7ZHFVsAPstUVOjp1T6L8wvEdXGzm8mF0KNGsNMl9z8hgMSE-YomuEvMCvkxoQbp0lcfhkhRH_p1g0VURns5xCNs6a6-Yhe' }} 
                    style={styles.posterImage} 
                 />
                 <View style={styles.posterOverlay} />
              </View>
              
              <View style={{ flex: 1, justifyContent: 'center' }}>
                 <View style={styles.activeHeader}>
                    <Text style={styles.movieTitle} numberOfLines={1}>Dune: Part Two</Text>
                    <TouchableOpacity>
                       <MaterialIcons name="close" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                 </View>

                 <View style={styles.activeMeta}>
                    <Text style={styles.activeSpeed}>3.5 MB/s</Text>
                    <View style={styles.activeDot} />
                    <Text style={styles.activeTime}>5 mins remaining</Text>
                 </View>

                 {/* Progress */}
                 <View style={styles.progressBarWrapper}>
                    <View style={styles.progressLabels}>
                       <Text style={styles.progressText}>45%</Text>
                       <Text style={styles.progressText}>12.4GB</Text>
                    </View>
                    <View style={styles.progressTrack}>
                       <View style={[styles.progressFill, { width: '45%' }]} />
                    </View>
                 </View>

                 {/* Controls */}
                 <TouchableOpacity style={styles.pauseBtn}>
                    <MaterialIcons name="pause" size={18} color="white" />
                    <Text style={styles.pauseText}>Pause</Text>
                 </TouchableOpacity>
              </View>
           </View>
        </View>

        {/* Downloaded Section */}
        <View style={styles.sectionHeader}>
           <Text style={styles.sectionTitle}>Downloaded</Text>
           <TouchableOpacity><Text style={styles.manageText}>Manage</Text></TouchableOpacity>
        </View>

        <View style={styles.downloadList}>
           {DOWNLOADED_ITEMS.map(item => (
              <View key={item.id} style={styles.downloadItem}>
                 <View style={styles.downloadPosterWrapper}>
                    <Image source={{ uri: item.image }} style={styles.posterImage} />
                    <View style={styles.playOverlay}>
                       <MaterialIcons name="play-circle-outline" size={28} color="white" />
                    </View>
                 </View>
                 
                 <View style={styles.itemContent}>
                    <Text style={styles.movieTitle} numberOfLines={1}>{item.title}</Text>
                    <View style={styles.itemMeta}>
                       <Text style={styles.metaText}>{item.duration}</Text>
                       <View style={styles.metaDot} />
                       <Text style={styles.metaText}>{item.size}</Text>
                    </View>
                 </View>

                 <View style={styles.itemActions}>
                    <TouchableOpacity style={styles.playBtn}>
                       <MaterialIcons name="play-arrow" size={24} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn}>
                       <MaterialIcons name="delete-outline" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                 </View>
              </View>
           ))}
        </View>

        {/* Auto Download Banner */}
        <View style={styles.autoDownloadBanner}>
           <MaterialIcons name="cloud-download" size={48} color="rgba(255,255,255,0.2)" />
           <Text style={styles.autoDownloadText}>Auto-downloads enabled for "My List"</Text>
        </View>

        {/* Padding for Bottom Nav */}
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
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Manrope_700Bold',
  },
  settingsBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  scrollContent: {
    padding: 16,
  },
  
  // Storage Card
  storageCard: {
    backgroundColor: '#2a1f33',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 32,
    shadowColor: '#9727e7',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  storageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  storageLabel: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 4,
  },
  storageUsed: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  storageUnit: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  storageTotal: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 4,
  },
  storageBarBg: {
    height: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 6,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 12,
  },
  storageBarFill: {
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '500',
  },

  // Active Download
  activeDownloadCard: {
    backgroundColor: '#2a1f33',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(151, 39, 231, 0.2)',
    marginBottom: 32,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#9727e7',
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  activeGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(151, 39, 231, 0.1)',
    zIndex: 0,
  },
  activePosterWrapper: {
    width: 70,
    aspectRatio: 2/3,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1a1121',
  },
  posterOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  activeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  activeSpeed: {
    color: '#9727e7',
    fontSize: 12,
    fontWeight: '500',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4b5563',
  },
  activeTime: {
    color: '#9ca3af',
    fontSize: 12,
  },
  progressBarWrapper: {
    marginBottom: 12,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressText: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: '500',
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#9727e7',
  },
  pauseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  pauseText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },

  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Manrope_700Bold',
  },
  badge: {
    backgroundColor: 'rgba(151, 39, 231, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: '#9727e7',
    fontSize: 12,
    fontWeight: '600',
  },
  manageText: {
    color: '#9727e7',
    fontSize: 12,
    fontWeight: '600',
  },

  // Download List
  downloadList: {
    gap: 16,
  },
  downloadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 8,
    borderRadius: 12,
  },
  downloadPosterWrapper: {
    width: 96,
    aspectRatio: 16/9,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.3)',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  posterImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  itemContent: {
    flex: 1,
    justifyContent: 'center',
  },
  movieTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    fontFamily: 'Manrope_700Bold',
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4b5563', // slate-600
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#9727e7', // primary
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#9727e7',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Auto Download
  autoDownloadBanner: {
    marginTop: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    borderStyle: 'dashed',
  },
  autoDownloadText: {
    color: '#6b7280',
    fontSize: 14,
    marginTop: 8,
  },
});
