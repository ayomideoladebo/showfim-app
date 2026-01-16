
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ScrollView,
  Linking,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useDownloads } from '../hooks/useDownloads';
import { BlurView } from 'expo-blur';
import { StreamSource, Caption, getQualityLabel } from '../utils/streamUtils';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface DownloadModalProps {
  visible: boolean;
  onClose: () => void;
  sources: StreamSource[];
  subtitles?: Caption[];
  title: string;
  posterUrl: string;
  loading?: boolean;
}

type TabType = 'video' | 'subtitle';

export default function DownloadModal({
  visible,
  onClose,
  sources,
  subtitles = [],
  title,
  posterUrl,
  loading = false,
}: DownloadModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('video');
  const [selectedSource, setSelectedSource] = useState<StreamSource | null>(null);
  const [selectedSubtitle, setSelectedSubtitle] = useState<Caption | null>(null);

  // Auto-select best quality on open
  React.useEffect(() => {
    if (sources.length > 0 && !selectedSource) {
      setSelectedSource(sources[0]);
    }
  }, [sources]);

  // Use native download hook
  const { startDownload } = useDownloads();

  const handleDownload = async () => {
    let url = '';
    let quality = 'unknown';
    let size = 'unknown';
    let type: 'video' | 'subtitle' = 'video';

    if (activeTab === 'video' && selectedSource) {
      url = selectedSource.url;
      quality = selectedSource.resolution + 'p';
      size = selectedSource.size;
      type = 'video';
    } else if (activeTab === 'subtitle' && selectedSubtitle) {
      url = selectedSubtitle.url;
      quality = selectedSubtitle.lan;
      size = '10kb'; // Approximate
      type = 'subtitle';
    }

    if (url) {
      const id = `${title.replace(/\s+/g, '_')}_${quality}`; // Simple ID generation
      startDownload({
        id,
        contentId: id, // Mapping to same for now, ideally pass movieId
        title,
        posterUrl,
        type: 'movie', // Default to movie, need logic for TV later
        quality,
        remoteUrl: url,
        size,
      });
      
      Alert.alert('Download Started', `Downloading ${title} (${quality}). check "Downloads" tab.`);
      onClose();
    }
  };

  const getQualityBadgeColor = (resolution: number) => {
    if (resolution >= 1080) return '#9727e7'; // Purple for Best
    if (resolution >= 720) return '#3b82f6';  // Blue for HD
    return '#6b7280'; // Gray for lower
  };

  const renderVideoTab = () => (
    <View style={styles.listContainer}>
      {sources.map((source) => (
        <TouchableOpacity
          key={source.id}
          style={[
            styles.optionItem,
            selectedSource?.id === source.id && styles.optionItemSelected
          ]}
          onPress={() => setSelectedSource(source)}
        >
          <View style={styles.optionLeft}>
            <View style={[styles.radioCircle, selectedSource?.id === source.id && styles.radioCircleSelected]}>
              {selectedSource?.id === source.id && <View style={styles.radioDot} />}
            </View>
            <View style={styles.optionInfo}>
              <View style={styles.optionTitleRow}>
                <Text style={styles.optionTitle}>
                  {source.resolution}p {getQualityLabel(source.resolution)}
                </Text>
                {source.resolution >= 1080 && (
                  <View style={styles.bestBadge}>
                    <Text style={styles.bestBadgeText}>BEST</Text>
                  </View>
                )}
              </View>
              <Text style={styles.optionSubtitle}>
                {getQualityLabel(source.resolution)} • {source.size}
              </Text>
            </View>
          </View>
          <MaterialIcons 
            name={source.resolution >= 720 ? "hd" : "sd"} 
            size={24} 
            color={selectedSource?.id === source.id ? "#9727e7" : "#4b5563"} 
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSubtitleTab = () => (
    <View style={styles.listContainer}>
      {subtitles.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No subtitles available</Text>
        </View>
      ) : (
        subtitles.map((subtitle) => (
          <TouchableOpacity
            key={subtitle.lan}
            style={[
              styles.optionItem,
              selectedSubtitle?.lan === subtitle.lan && styles.optionItemSelected
            ]}
            onPress={() => setSelectedSubtitle(subtitle)}
          >
            <View style={styles.optionLeft}>
              <View style={[styles.radioCircle, selectedSubtitle?.lan === subtitle.lan && styles.radioCircleSelected]}>
                {selectedSubtitle?.lan === subtitle.lan && <View style={styles.radioDot} />}
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>{subtitle.lanName}</Text>
                <Text style={styles.optionSubtitle}>{subtitle.lan.toUpperCase()}</Text>
              </View>
            </View>
            <MaterialIcons 
              name="subtitles" 
              size={24} 
              color={selectedSubtitle?.lan === subtitle.lan ? "#9727e7" : "#4b5563"} 
            />
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.closeArea} onPress={onClose} />
        
        <View style={styles.modalContainer}>
          <View style={styles.dragHandle} />
          
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Select Quality</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'video' && styles.activeTab]}
              onPress={() => setActiveTab('video')}
            >
              <Text style={[styles.tabText, activeTab === 'video' && styles.activeTabText]}>Video</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'subtitle' && styles.activeTab]}
              onPress={() => setActiveTab('subtitle')}
            >
              <Text style={[styles.tabText, activeTab === 'subtitle' && styles.activeTabText]}>Subtitles</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#9727e7" />
                <Text style={styles.loadingText}>Fetching options...</Text>
              </View>
            ) : sources.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="cloud-off" size={48} color="#6b7280" />
                <Text style={styles.emptyText}>No downloads available</Text>
              </View>
            ) : (
              activeTab === 'video' ? renderVideoTab() : renderSubtitleTab()
            )}
          </ScrollView>

          {/* Info & Download Button */}
          <View style={styles.footer}>
            <View style={styles.infoRow}>
              <MaterialIcons name="info-outline" size={16} color="#9ca3af" />
              <Text style={styles.infoText}>
                Downloads use storage space. Higher quality takes more space.
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.downloadButton,
                (!selectedSource && activeTab === 'video') || (!selectedSubtitle && activeTab === 'subtitle') 
                  ? styles.downloadButtonDisabled 
                  : {}
              ]}
              disabled={(!selectedSource && activeTab === 'video') || (!selectedSubtitle && activeTab === 'subtitle')}
              onPress={handleDownload}
            >
              <LinearGradient
                colors={['#9727e7', '#7c1fd8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.downloadButtonGradient}
              >
                <MaterialIcons name="file-download" size={24} color="white" />
                <Text style={styles.downloadButtonText}>
                  Download {activeTab === 'video' && selectedSource ? `(${selectedSource.size})` : ''}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  closeArea: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: '#1a1121',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    minHeight: 400,
    width: '100%',
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(151, 39, 231, 0.2)',
  },
  tabText: {
    color: '#9ca3af',
    fontWeight: '600',
    fontSize: 14,
  },
  activeTabText: {
    color: '#9727e7',
  },
  content: {
    paddingHorizontal: 20,
  },
  listContainer: {
    gap: 12,
    paddingBottom: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  optionItemSelected: {
    borderColor: '#9727e7',
    backgroundColor: 'rgba(151, 39, 231, 0.05)',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4b5563',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#9727e7',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#9727e7',
  },
  optionInfo: {
    marginLeft: 8,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bestBadge: {
    backgroundColor: 'rgba(151, 39, 231, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bestBadgeText: {
    color: '#9727e7',
    fontSize: 10,
    fontWeight: 'bold',
  },
  optionSubtitle: {
    color: '#9ca3af',
    fontSize: 13,
    marginTop: 2,
  },
  footer: {
    padding: 20,
    paddingBottom: 32, // Safe area
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
  },
  infoText: {
    color: '#9ca3af',
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  downloadButton: {
    borderRadius: 28,
    overflow: 'hidden',
    height: 56,
  },
  downloadButtonDisabled: {
    opacity: 0.5,
  },
  downloadButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  downloadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#9ca3af',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 16,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
});

