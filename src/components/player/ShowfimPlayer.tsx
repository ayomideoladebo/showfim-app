import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions,
  Modal,
  FlatList,
  StatusBar,
  Platform
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus, VideoFullscreenUpdate } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ScreenOrientation from 'expo-screen-orientation';
import Slider from '@react-native-community/slider';
import { 
  StreamSource, 
  Caption, 
  formatTime, 
  getQualityLabel,
  getPlaybackProgress,
  savePlaybackProgress,
} from '../../utils/streamUtils';
import { addToWatchHistoryAsync } from '../../hooks/useWatchHistory';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ShowfimPlayerProps {
  sources: StreamSource[];
  subtitles?: Caption[];
  title: string;
  contentId: string;
  poster?: string;
  autoPlay?: boolean;
  onClose?: () => void;
  // Episode navigation for TV shows
  episodeInfo?: {
    season: number;
    episode: number;
    totalEpisodes: number;
    hasNextEpisode: boolean;
  };
  onNextEpisode?: () => void;
}

export default function ShowfimPlayer({
  sources,
  subtitles = [],
  title,
  contentId,
  poster,
  autoPlay = true,
  onClose,
  episodeInfo,
  onNextEpisode,
}: ShowfimPlayerProps) {
  const videoRef = useRef<Video>(null);
  const preloadVideoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [showSubtitleModal, setShowSubtitleModal] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState(0);
  const [selectedSubtitle, setSelectedSubtitle] = useState<Caption | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Seamless quality switching state (dual-buffer approach)
  const [pendingQualityIndex, setPendingQualityIndex] = useState<number | null>(null);
  const [preloadReady, setPreloadReady] = useState(false);
  
  // Next episode auto-play state
  const [showNextEpisodeOverlay, setShowNextEpisodeOverlay] = useState(false);
  const [nextEpisodeCountdown, setNextEpisodeCountdown] = useState(10);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get current source
  const currentSource = sources[selectedQuality];
  const pendingSource = pendingQualityIndex !== null ? sources[pendingQualityIndex] : null;

  // Hide controls after inactivity
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      // Check current state using the ref or just set false if valid
      setShowControls(false); 
    }, 4000);
  }, []);

  // Initial control timeout on mount if autoplay
  useEffect(() => {
    if (autoPlay) {
      resetControlsTimeout();
    }
  }, []);

  // Load saved progress on mount
  useEffect(() => {
    const loadProgress = async () => {
      const savedProgress = await getPlaybackProgress(contentId);
      if (savedProgress && savedProgress.time > 10) {
        // Resume from saved position (minus 5 seconds for context)
        const resumeTime = Math.max(0, savedProgress.time - 5);
        if (videoRef.current) {
          await videoRef.current.setPositionAsync(resumeTime * 1000);
        }
      }
    };
    loadProgress();
  }, [contentId]);

  // Save progress periodically
  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (currentTime > 0 && duration > 0) {
        savePlaybackProgress(contentId, currentTime, duration);
      }
    }, 10000); // Save every 10 seconds

    return () => clearInterval(saveInterval);
  }, [contentId, currentTime, duration]);

  // Record watch history
  useEffect(() => {
    if (currentTime > 30 || (duration > 0 && currentTime > duration * 0.1)) {
      const recordHistory = async () => {
        try {
          // contentId format: "movie-123" or "tv-456-1-2"
          const parts = contentId.split('-');
          const type = parts[0] as 'movie' | 'tv';
          const id = parseInt(parts[1]);
          
          if (!isNaN(id) && (type === 'movie' || type === 'tv')) {
            await addToWatchHistoryAsync({
              id,
              type,
              title,
              posterPath: poster
            });
          }
        } catch (e) {
          console.error('Error recording watch history', e);
        }
      };
      
      recordHistory();
    }
  }, [contentId, currentTime, duration, title, poster]);

  // Lock to landscape in fullscreen
  useEffect(() => {
    if (isFullscreen) {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      StatusBar.setHidden(true);
    } else {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      StatusBar.setHidden(false);
    }

    return () => {
      ScreenOrientation.unlockAsync();
      StatusBar.setHidden(false);
    };
  }, [isFullscreen]);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        setError(`Playback error: ${status.error}`);
        setIsLoading(false);
      }
      return;
    }

    // Improve loading check
    if (status.isPlaying) {
         setIsLoading(false);
    } else {
         setIsLoading(status.isBuffering);
    }
    
    setIsPlaying(status.isPlaying);
    setCurrentTime(status.positionMillis / 1000);
    setDuration(status.durationMillis ? status.durationMillis / 1000 : 0);
    
    // Check if video ended and has next episode
    if (status.didJustFinish && episodeInfo?.hasNextEpisode && onNextEpisode) {
      startNextEpisodeCountdown();
    }
  };
  
  // Start countdown for next episode auto-play
  const shouldPlayNextRef = useRef(false);
  
  const startNextEpisodeCountdown = () => {
    setShowNextEpisodeOverlay(true);
    setNextEpisodeCountdown(10);
    shouldPlayNextRef.current = false;
    
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    
    countdownRef.current = setInterval(() => {
      setNextEpisodeCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          shouldPlayNextRef.current = true;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  // Watch for countdown completion and trigger next episode
  useEffect(() => {
    if (nextEpisodeCountdown === 0 && shouldPlayNextRef.current) {
      shouldPlayNextRef.current = false;
      setShowNextEpisodeOverlay(false);
      // Use setTimeout to ensure this happens outside React's render cycle
      setTimeout(() => {
        onNextEpisode?.();
      }, 0);
    }
  }, [nextEpisodeCountdown, onNextEpisode]);
  
  // Cancel next episode countdown
  const cancelNextEpisodeCountdown = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    shouldPlayNextRef.current = false;
    setShowNextEpisodeOverlay(false);
    setNextEpisodeCountdown(10);
  };
  
  // Play next episode immediately
  const playNextEpisodeNow = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    shouldPlayNextRef.current = false;
    setShowNextEpisodeOverlay(false);
    // Use setTimeout to ensure this happens outside React's render cycle
    setTimeout(() => {
      onNextEpisode?.();
    }, 0);
  };
  
  // Cleanup countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  const togglePlayPause = async () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
    resetControlsTimeout();
  };

  const handleSeek = async (seekTime: number) => {
    if (!videoRef.current) return;
    await videoRef.current.setPositionAsync(seekTime * 1000);
    setCurrentTime(seekTime);
    resetControlsTimeout();
  };

  const handleSliderValueChange = (val: number) => {
    setCurrentTime(val);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  };

  const seekForward = async () => {
    const newTime = Math.min(currentTime + 10, duration);
    await handleSeek(newTime);
    resetControlsTimeout();
  };

  const seekBackward = async () => {
    const newTime = Math.max(currentTime - 10, 0);
    await handleSeek(newTime);
    resetControlsTimeout();
  };

  const handleQualityChange = async (index: number) => {
    if (index === selectedQuality || pendingQualityIndex !== null) {
      setShowQualityModal(false);
      return;
    }
    
    // Start preloading the new quality in the background
    // Current video keeps playing uninterrupted
    setPendingQualityIndex(index);
    setPreloadReady(false);
    setShowQualityModal(false);
    
    // The preload Video's onLoad will handle the swap
  };
  
  // Handle preload video ready - perform invisible swap
  const handlePreloadReady = async () => {
    if (pendingQualityIndex === null) return;
    
    try {
      // Get current position from main video
      let swapPosition = currentTime * 1000;
      if (videoRef.current) {
        const status = await videoRef.current.getStatusAsync();
        if (status.isLoaded) {
          swapPosition = status.positionMillis;
        }
      }
      
      // Seek preload video to exact position
      if (preloadVideoRef.current) {
        await preloadVideoRef.current.setPositionAsync(swapPosition);
        if (isPlaying) {
          await preloadVideoRef.current.playAsync();
        }
      }
      
      // Small buffer time to ensure smooth playback
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Perform the swap - switch quality index
      const newQuality = pendingQualityIndex;
      setPendingQualityIndex(null);
      setPreloadReady(false);
      setSelectedQuality(newQuality);
      
      // Seek main video to current position (now playing new quality)
      setTimeout(async () => {
        if (videoRef.current) {
          try {
            const preloadStatus = preloadVideoRef.current ? await preloadVideoRef.current.getStatusAsync() : null;
            const targetPos = preloadStatus?.isLoaded ? preloadStatus.positionMillis : swapPosition;
            await videoRef.current.setPositionAsync(targetPos);
            if (isPlaying) {
              await videoRef.current.playAsync();
            }
          } catch (e) {
            console.log('Position sync after swap:', e);
          }
        }
      }, 100);
      
    } catch (e) {
      console.error('Error during quality swap:', e);
      setPendingQualityIndex(null);
      setPreloadReady(false);
    }
  };

  const handleSubtitleChange = (subtitle: Caption | null) => {
    setSelectedSubtitle(subtitle);
    setShowSubtitleModal(false);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    resetControlsTimeout();
  };

  const handleClose = () => {
    // Save progress before closing
    if (currentTime > 0 && duration > 0) {
      savePlaybackProgress(contentId, currentTime, duration);
    }
    onClose?.();
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!currentSource) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>No video sources available</Text>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, isFullscreen && styles.containerFullscreen]}>
      {/* Video */}
      <TouchableOpacity 
        style={styles.videoContainer} 
        activeOpacity={1}
        onPress={resetControlsTimeout}
      >
        <Video
          ref={videoRef}
          source={{ uri: currentSource.url }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={autoPlay}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          onError={(error) => setError(error)}
          posterSource={poster ? { uri: poster } : undefined}
          usePoster={!!poster}
        />
        
        {/* Hidden Preload Video for seamless quality switching */}
        {pendingSource && (
          <Video
            ref={preloadVideoRef}
            source={{ uri: pendingSource.url }}
            style={styles.hiddenVideo}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={false}
            isMuted={true}
            onLoad={() => {
              setPreloadReady(true);
              handlePreloadReady();
            }}
            onError={() => {
              // If preload fails, cancel the switch
              setPendingQualityIndex(null);
              setPreloadReady(false);
            }}
          />
        )}

        {/* Loading Indicator (only for initial load, not quality switch) */}
        {isLoading && !pendingQualityIndex && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#9727e7" />
          </View>
        )}

        {/* Subtle quality switching indicator (just a small badge, not blocking) */}
        {pendingQualityIndex !== null && (
          <View style={styles.qualitySwitchBadge}>
            <ActivityIndicator size="small" color="white" />
            <Text style={styles.qualitySwitchBadgeText}>
              Loading {pendingSource?.resolution}p
            </Text>
          </View>
        )}

        {/* Error Display */}
        {error && (
          <View style={styles.errorOverlay}>
            <MaterialIcons name="error" size={40} color="#ef4444" />
            <Text style={styles.errorOverlayText}>{error}</Text>
          </View>
        )}

        {/* Next Episode Overlay */}
        {showNextEpisodeOverlay && episodeInfo && (
          <View style={styles.nextEpisodeOverlay}>
            <View style={styles.nextEpisodeContent}>
              <Text style={styles.nextEpisodeTitle}>Up Next</Text>
              <Text style={styles.nextEpisodeInfo}>
                Season {episodeInfo.season}, Episode {episodeInfo.episode + 1}
              </Text>
              
              {/* Countdown Circle */}
              <View style={styles.countdownContainer}>
                <View style={styles.countdownCircle}>
                  <Text style={styles.countdownText}>{nextEpisodeCountdown}</Text>
                </View>
                <Text style={styles.countdownLabel}>seconds</Text>
              </View>
              
              {/* Action Buttons */}
              <View style={styles.nextEpisodeButtons}>
                <TouchableOpacity 
                  style={styles.playNowButton}
                  onPress={playNextEpisodeNow}
                >
                  <MaterialIcons name="play-arrow" size={24} color="white" />
                  <Text style={styles.playNowText}>Play Now</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={cancelNextEpisodeCountdown}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Next Episode Button (shown in controls when available) */}
        {episodeInfo?.hasNextEpisode && showControls && !showNextEpisodeOverlay && (
          <TouchableOpacity 
            style={styles.nextEpisodeSmallButton}
            onPress={playNextEpisodeNow}
          >
            <MaterialIcons name="skip-next" size={24} color="white" />
            <Text style={styles.nextEpisodeSmallText}>Next Episode</Text>
          </TouchableOpacity>
        )}

        {/* Showfim Logo Watermark */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>SHOWFIM</Text>
        </View>

        {/* Controls Overlay */}
        {showControls && !error && (
          <LinearGradient
            colors={['rgba(0,0,0,0.7)', 'transparent', 'transparent', 'rgba(0,0,0,0.8)']}
            style={styles.controlsOverlay}
          >
            {/* Top Bar */}
            <View style={styles.topBar}>
              <TouchableOpacity style={styles.topButton} onPress={handleClose}>
                <MaterialIcons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.titleText} numberOfLines={1}>{title}</Text>
              <View style={styles.topActions}>
                <TouchableOpacity 
                  style={styles.topButton} 
                  onPress={() => setShowSubtitleModal(true)}
                >
                  <MaterialIcons name="subtitles" size={24} color={selectedSubtitle ? "#9727e7" : "white"} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.topButton} 
                  onPress={() => setShowQualityModal(true)}
                >
                  <MaterialIcons name="settings" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Center Controls */}
            <View style={styles.centerControls}>
              <TouchableOpacity style={styles.seekButton} onPress={seekBackward}>
                <MaterialIcons name="replay-10" size={40} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.playButton} onPress={togglePlayPause}>
                <MaterialIcons 
                  name={isPlaying ? "pause" : "play-arrow"} 
                  size={56} 
                  color="white" 
                />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.seekButton} onPress={seekForward}>
                <MaterialIcons name="forward-10" size={40} color="white" />
              </TouchableOpacity>
            </View>

            {/* Bottom Bar */}
            <View style={styles.bottomBar}>
              <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
              
              <View style={styles.progressContainer}>
                <Slider
                  style={{ width: '100%', height: 40 }}
                  minimumValue={0}
                  maximumValue={Math.max(duration, 0.1)} // Prevent 0 maximum
                  value={currentTime}
                  minimumTrackTintColor="#9727e7"
                  maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                  thumbTintColor="#9727e7"
                  onSlidingComplete={handleSeek}
                  onValueChange={handleSliderValueChange}
                />
              </View>
              
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
              
              <TouchableOpacity style={styles.fullscreenButton} onPress={toggleFullscreen}>
                <MaterialIcons 
                  name={isFullscreen ? "fullscreen-exit" : "fullscreen"} 
                  size={28} 
                  color="white" 
                />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        )}
      </TouchableOpacity>

      {/* Quality Selection Modal */}
      <Modal
        visible={showQualityModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQualityModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setShowQualityModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Video Quality</Text>
            {sources.map((source, index) => (
              <TouchableOpacity
                key={source.id}
                style={[
                  styles.qualityOption,
                  selectedQuality === index && styles.qualityOptionSelected,
                ]}
                onPress={() => handleQualityChange(index)}
              >
                <Text style={styles.qualityText}>
                  {source.resolution}p ({getQualityLabel(source.resolution)})
                </Text>
                <Text style={styles.qualitySize}>{source.size}</Text>
                {selectedQuality === index && (
                  <MaterialIcons name="check" size={20} color="#9727e7" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Subtitle Selection Modal */}
      <Modal
        visible={showSubtitleModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSubtitleModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setShowSubtitleModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Subtitles</Text>
            <TouchableOpacity
              style={[
                styles.qualityOption,
                !selectedSubtitle && styles.qualityOptionSelected,
              ]}
              onPress={() => handleSubtitleChange(null)}
            >
              <Text style={styles.qualityText}>Off</Text>
              {!selectedSubtitle && (
                <MaterialIcons name="check" size={20} color="#9727e7" />
              )}
            </TouchableOpacity>
            {subtitles.map((subtitle) => (
              <TouchableOpacity
                key={subtitle.lan}
                style={[
                  styles.qualityOption,
                  selectedSubtitle?.lan === subtitle.lan && styles.qualityOptionSelected,
                ]}
                onPress={() => handleSubtitleChange(subtitle)}
              >
                <Text style={styles.qualityText}>{subtitle.lanName}</Text>
                {selectedSubtitle?.lan === subtitle.lan && (
                  <MaterialIcons name="check" size={20} color="#9727e7" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  containerFullscreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  hiddenVideo: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  qualitySwitchBadge: {
    position: 'absolute',
    top: 80,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(151, 39, 231, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 8,
  },
  qualitySwitchBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  logoContainer: {
    position: 'absolute',
    top: 60,
    right: 16,
    opacity: 0.7,
  },
  logoText: {
    color: '#9727e7',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 48,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topActions: {
    flexDirection: 'row',
    gap: 8,
  },
  titleText: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 16,
    textAlign: 'center',
  },
  centerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 48,
  },
  seekButton: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(151, 39, 231, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    minWidth: 45,
  },
  progressContainer: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#9727e7',
    borderRadius: 2,
  },
  fullscreenButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#1a1121',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    gap: 12,
  },
  errorOverlayText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    maxWidth: '80%',
  },
  closeButton: {
    backgroundColor: '#9727e7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1121',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 300,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  qualityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  qualityOptionSelected: {
    backgroundColor: 'rgba(151, 39, 231, 0.2)',
    borderWidth: 1,
    borderColor: '#9727e7',
  },
  qualityText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  qualitySize: {
    color: '#6b7280',
    fontSize: 12,
    marginLeft: 8,
  },
  // Next Episode Overlay Styles
  nextEpisodeOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.9)',
    zIndex: 200,
  },
  nextEpisodeContent: {
    alignItems: 'center',
    padding: 24,
  },
  nextEpisodeTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  nextEpisodeInfo: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    marginBottom: 24,
  },
  countdownContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  countdownCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#9727e7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  countdownText: {
    color: 'white',
    fontSize: 32,
    fontWeight: '700',
  },
  countdownLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  nextEpisodeButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  playNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9727e7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  playNowText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  nextEpisodeSmallButton: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(151, 39, 231, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    zIndex: 50,
  },
  nextEpisodeSmallText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
});
