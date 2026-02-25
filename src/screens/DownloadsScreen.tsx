import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDownloads } from '../hooks/useDownloads';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

interface DownloadsScreenProps {
  onPlay: (item: any) => void;
}

export default function DownloadsScreen({ onPlay }: DownloadsScreenProps) {
  const {
    downloads,
    deleteDownload,
    pauseDownload,
    resumeDownload,
    clearAllDownloads
  } = useDownloads();

  const activeDownloads = downloads.filter(d => d.status === 'downloading' || d.status === 'paused');
  const completedDownloads = downloads.filter(d => d.status === 'completed');

  const handleOptions = (item: any) => {
    Alert.alert(
      item.title,
      'Choose an action',
      [
        {
          text: 'Share / Save to Device',
          onPress: async () => {
            try {
              const available = await Sharing.isAvailableAsync();
              if (available) {
                await Sharing.shareAsync(item.uri);
              } else {
                Alert.alert('Sharing is not available on this device');
              }
            } catch (error) {
              console.log('Error sharing:', error);
            }
          }
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteDownload(item.id)
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  // Storage State
  const [storage, setStorage] = React.useState({
    totalGB: 128,
    usedGB: 32,
    appUsedGB: 0,
    percentUsed: 0.25,
    percentApp: 0.05
  });

  const [expandedShows, setExpandedShows] = React.useState<Record<string, boolean>>({});

  const toggleShow = (showId: string) => {
    setExpandedShows(prev => ({ ...prev, [showId]: !prev[showId] }));
  };

  const groupedDownloads = React.useMemo(() => {
    const groups: Record<string, any> = {};
    const result: any[] = [];

    completedDownloads.forEach(item => {
      if (item.type === 'tv' && item.contentId) {
        if (!groups[item.contentId]) {
          const showTitle = item.title.split(' - S')[0] || item.title;
          groups[item.contentId] = {
            type: 'show_group',
            id: item.contentId,
            title: showTitle,
            posterUrl: item.posterUrl,
            episodes: []
          };
          result.push(groups[item.contentId]);
        }
        groups[item.contentId].episodes.push(item);
      } else {
        result.push({ type: 'movie', id: item.id, item });
      }
    });

    Object.values(groups).forEach(group => {
      if (group.type === 'show_group') {
        group.episodes.sort((a: any, b: any) => {
          if (a.season !== b.season) return (a.season || 0) - (b.season || 0);
          return (a.episode || 0) - (b.episode || 0);
        });
      }
    });

    return result;
  }, [completedDownloads]);

  React.useEffect(() => {
    updateStorageInfo();
  }, [downloads]); // Update when downloads change

  const updateStorageInfo = async () => {
    try {
      // Use legacy import to avoid deprecation warnings
      const FileSystem = require('expo-file-system/legacy');

      // Get Device Storage (using legacy API)
      let free = 0;
      let total = 128 * 1024 * 1024 * 1024; // Default 128GB

      try {
        free = await FileSystem.getFreeDiskStorageAsync();
        total = await FileSystem.getTotalDiskCapacityAsync();
      } catch (storageErr) {
        // If storage APIs fail, use defaults
        console.log('Storage API not available, using defaults');
        free = 96 * 1024 * 1024 * 1024; // Default 96GB free
      }

      const used = total - free;

      // Get App Usage (Downloads folder)
      const downloadDir = FileSystem.documentDirectory + 'downloads/';
      let appSize = 0;

      const dirInfo = await FileSystem.getInfoAsync(downloadDir);
      if (dirInfo.exists && dirInfo.isDirectory) {
        const files = await FileSystem.readDirectoryAsync(downloadDir);
        // Sum up file sizes
        for (const file of files) {
          const fileInfo = await FileSystem.getInfoAsync(downloadDir + file, { size: true });
          if (fileInfo.exists && !fileInfo.isDirectory) {
            appSize += (fileInfo.size || 0);
          }
        }
      }

      // Convert to GB
      const toGB = (bytes: number) => (bytes / (1024 * 1024 * 1024));

      setStorage({
        totalGB: Math.round(toGB(total)),
        usedGB: parseFloat(toGB(used).toFixed(1)),
        appUsedGB: parseFloat(toGB(appSize).toFixed(2)),
        percentUsed: used / total,
        percentApp: appSize / total
      });

    } catch (e) {
      console.log('Error fetching storage:', e);
    }
  };

  const otherUsedPercent = Math.max(0, storage.percentUsed - storage.percentApp);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Sticky Header */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']} style={styles.headerContent}>
          <Text style={styles.headerTitle}>My Downloads</Text>
          <TouchableOpacity style={styles.settingsBtn} onPress={clearAllDownloads} onLongPress={() => Alert.alert('Clear All', 'Delete all downloads?', [{ text: 'Cancel' }, { text: 'Delete', onPress: clearAllDownloads }])}>
            <MaterialIcons name="delete-sweep" size={24} color="#9ca3af" />
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
                <Text style={styles.storageUsed}>{storage.usedGB}</Text>
                <Text style={styles.storageUnit}>GB used</Text>
              </View>
            </View>
            <Text style={styles.storageTotal}>of {storage.totalGB}GB</Text>
          </View>
          <View style={styles.storageBarBg}>
            <View style={[styles.storageBarFill, { width: `${storage.percentApp * 100}%`, backgroundColor: '#9727e7' }]} />
            <View style={[styles.storageBarFill, { width: `${otherUsedPercent * 100}%`, backgroundColor: 'rgba(129, 140, 248, 0.5)' }]} />
          </View>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#9727e7' }]} />
              <Text style={styles.legendText}>Showfim ({storage.appUsedGB} GB)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: 'rgba(129, 140, 248, 0.5)' }]} />
              <Text style={styles.legendText}>Other Apps</Text>
            </View>
          </View>
        </View>

        {/* Active Downloads Section */}
        {activeDownloads.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Downloads</Text>
              <View style={styles.badge}><Text style={styles.badgeText}>{activeDownloads.length} item{activeDownloads.length !== 1 ? 's' : ''}</Text></View>
            </View>

            {activeDownloads.map(item => (
              <View key={item.id} style={styles.activeDownloadCard}>
                {/* Glow Effect */}
                <View style={styles.activeGlow} />

                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <View style={styles.activePosterWrapper}>
                    {item.posterUrl ? (
                      <Image source={{ uri: item.posterUrl }} style={styles.posterImage} />
                    ) : (
                      <View style={[styles.posterImage, { backgroundColor: '#333' }]} />
                    )}
                    <View style={styles.posterOverlay} />
                  </View>

                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <View style={styles.activeHeader}>
                      <Text style={styles.movieTitle} numberOfLines={1}>{item.title}</Text>
                      <TouchableOpacity onPress={() => deleteDownload(item.id)}>
                        <MaterialIcons name="close" size={20} color="#9ca3af" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.activeMeta}>
                      <Text style={styles.activeSpeed}>
                        {item.status === 'paused'
                          ? 'Paused'
                          : (item.downloadSpeed ? `Downloading - ${item.downloadSpeed}` : 'Downloading...')}
                      </Text>
                      <View style={styles.activeDot} />
                      <Text style={styles.activeTime}>{item.quality}</Text>
                    </View>

                    {/* Progress */}
                    <View style={styles.progressBarWrapper}>
                      <View style={styles.progressLabels}>
                        <Text style={styles.progressText}>
                          {Math.round(Math.max(0, Math.min(100, item.progress)))}%
                        </Text>
                        <Text style={styles.progressText}>{item.size}</Text>
                      </View>
                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${Math.max(0, Math.min(100, item.progress))}%` }
                          ]}
                        />
                      </View>
                    </View>

                    {/* Controls */}
                    {item.status === 'downloading' ? (
                      <TouchableOpacity style={styles.pauseBtn} onPress={() => pauseDownload(item.id)}>
                        <MaterialIcons name="pause" size={18} color="white" />
                        <Text style={styles.pauseText}>Pause</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={styles.pauseBtn} onPress={() => resumeDownload(item.id)}>
                        <MaterialIcons name="play-arrow" size={18} color="white" />
                        <Text style={styles.pauseText}>Resume</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Downloaded Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Downloaded</Text>
          {/* <TouchableOpacity><Text style={styles.manageText}>Manage</Text></TouchableOpacity> */}
        </View>

        {completedDownloads.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="cloud-download" size={64} color="#374151" />
            <Text style={styles.emptyText}>No downloads yet</Text>
            <Text style={styles.emptySubtext}>Movies and episodes you download will appear here.</Text>
          </View>
        ) : (
          <View style={styles.downloadList}>
            {groupedDownloads.map(group => {
              if (group.type === 'movie') {
                const item = group.item;
                return (
                  <View key={`movie-${item.id}`} style={styles.downloadItem}>
                    <View style={styles.downloadPosterWrapper}>
                      {item.posterUrl ? (
                        <Image source={{ uri: item.posterUrl }} style={styles.posterImage} />
                      ) : (
                        <View style={[styles.posterImage, { backgroundColor: '#333' }]} />
                      )}
                      <View style={styles.playOverlay}>
                        <MaterialIcons name="play-circle-outline" size={28} color="white" />
                      </View>
                    </View>

                    <View style={styles.itemContent}>
                      <Text style={styles.movieTitle} numberOfLines={1}>{item.title}</Text>
                      <View style={styles.itemMeta}>
                        <Text style={styles.metaText}>{item.quality}</Text>
                        <View style={styles.metaDot} />
                        <Text style={styles.metaText}>{item.size}</Text>
                      </View>
                    </View>

                    <View style={styles.itemActions}>
                      <TouchableOpacity style={styles.playBtn} onPress={() => onPlay(item)}>
                        <MaterialIcons name="play-arrow" size={24} color="white" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleOptions(item)}>
                        <MaterialIcons name="more-vert" size={24} color="#9ca3af" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              } else {
                const show = group;
                const isExpanded = expandedShows[show.id];
                return (
                  <View key={`show-${show.id}`} style={styles.showGroupContainer}>
                    <TouchableOpacity style={styles.downloadItem} onPress={() => toggleShow(show.id)}>
                      <View style={[styles.downloadPosterWrapper, { aspectRatio: 2 / 3, width: 64 }]}>
                        {show.posterUrl ? (
                          <Image source={{ uri: show.posterUrl }} style={styles.posterImage} />
                        ) : (
                          <View style={[styles.posterImage, { backgroundColor: '#333' }]} />
                        )}
                        <View style={styles.folderOverlay}>
                          <MaterialIcons name="folder" size={24} color="white" />
                        </View>
                      </View>

                      <View style={styles.itemContent}>
                        <Text style={styles.movieTitle} numberOfLines={1}>{show.title}</Text>
                        <View style={styles.itemMeta}>
                          <MaterialIcons name="live-tv" size={14} color="#9ca3af" />
                          <Text style={[styles.metaText, { marginLeft: 4 }]}>{show.episodes.length} Episode{show.episodes.length !== 1 ? 's' : ''}</Text>
                        </View>
                      </View>

                      <View style={styles.itemActions}>
                        <MaterialIcons name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={28} color="#9ca3af" />
                      </View>
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.episodesContainer}>
                        {show.episodes.map((item: any) => {
                          // shorten title to S1 E1 or similar
                          const shortTitle = `S${item.season} E${item.episode}`;
                          return (
                            <View key={item.id} style={[styles.downloadItem, styles.nestedEpisodeItem]}>
                              <View style={styles.nestedEpisodePrefix}>
                                <View style={styles.nestedEpisodeLine} />
                              </View>
                              <View style={styles.itemContent}>
                                <Text style={styles.movieTitle} numberOfLines={1}>{shortTitle}</Text>
                                <View style={styles.itemMeta}>
                                  <Text style={styles.metaText}>{item.quality}</Text>
                                  <View style={styles.metaDot} />
                                  <Text style={styles.metaText}>{item.size}</Text>
                                </View>
                              </View>
                              <View style={styles.itemActions}>
                                <TouchableOpacity style={[styles.playBtn, { width: 32, height: 32 }]} onPress={() => onPlay(item)}>
                                  <MaterialIcons name="play-arrow" size={20} color="white" />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleOptions(item)}>
                                  <MaterialIcons name="more-vert" size={20} color="#9ca3af" />
                                </TouchableOpacity>
                              </View>
                            </View>
                          )
                        })}
                      </View>
                    )}
                  </View>
                );
              }
            })}
          </View>
        )}

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
    aspectRatio: 2 / 3,
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
    aspectRatio: 16 / 9,
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
  showGroupContainer: {
    backgroundColor: 'rgba(42, 31, 51, 0.4)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  folderOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.5)',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  episodesContainer: {
    paddingLeft: 16,
    paddingRight: 8,
    paddingBottom: 8,
  },
  nestedEpisodeItem: {
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  nestedEpisodePrefix: {
    width: 24,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nestedEpisodeLine: {
    width: 2,
    height: '100%',
    backgroundColor: 'rgba(151, 39, 231, 0.3)',
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    gap: 16,
  },
  emptyText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptySubtext: {
    color: '#9ca3af',
    fontSize: 14,
  },
});
