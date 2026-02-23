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
  Platform,
  PanResponder,
  Animated,
  Pressable
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

interface SubtitleCue {
  start: number; // in seconds
  end: number;
  text: string;
}

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
  const [selectedQuality, setSelectedQuality] = useState(() => {
    // Default to 480p if available, otherwise 720p or middle index
    const index480 = sources.findIndex(s => s.resolution === 480);
    if (index480 !== -1) return index480;
    const index720 = sources.findIndex(s => s.resolution === 720);
    if (index720 !== -1) return index720;
    return Math.floor(sources.length / 2);
  });
  const [selectedSubtitle, setSelectedSubtitle] = useState<Caption | null>(null);
  const [parsedSubtitles, setParsedSubtitles] = useState<SubtitleCue[]>([]);
  const [activeCue, setActiveCue] = useState<SubtitleCue | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playableDuration, setPlayableDuration] = useState(0);

  // Seamless quality switching state (dual-video approach)
  const [activeVideo, setActiveVideo] = useState<'A' | 'B'>('A');
  const [sourceA, setSourceA] = useState<StreamSource | null>(sources[selectedQuality]);
  const [sourceB, setSourceB] = useState<StreamSource | null>(null);
  const [pendingQualityIndex, setPendingQualityIndex] = useState<number | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);

  const videoA = useRef<Video>(null);
  const videoB = useRef<Video>(null);

  const activeVideoRef = activeVideo === 'A' ? videoA : videoB;
  const inactiveVideoRef = activeVideo === 'A' ? videoB : videoA;

  // Next episode auto-play state
  const [showNextEpisodeOverlay, setShowNextEpisodeOverlay] = useState(false);
  const [nextEpisodeCountdown, setNextEpisodeCountdown] = useState(10);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Gesture State
  const [volume, setVolume] = useState(1.0);
  const [brightness, setBrightness] = useState(1.0); // 1.0 is normal, lower is darker (simulated)
  const [gestureType, setGestureType] = useState<'volume' | 'brightness' | 'none'>('none');
  const [gestureValue, setGestureValue] = useState(0);
  const [showGestureOverlay, setShowGestureOverlay] = useState(false);
  const [skipType, setSkipType] = useState<'forward' | 'backward' | null>(null);
  const [showSkipOverlay, setShowSkipOverlay] = useState(false);

  const gestureTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const skipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);

  const showGestureFeedback = (type: 'volume' | 'brightness', value: number) => {
    setGestureType(type);
    setGestureValue(value);
    setShowGestureOverlay(true);

    if (gestureTimeoutRef.current) clearTimeout(gestureTimeoutRef.current);
    gestureTimeoutRef.current = setTimeout(() => setShowGestureOverlay(false), 1500);
  };

  const showSkipFeedback = (type: 'forward' | 'backward') => {
    setSkipType(type);
    setShowSkipOverlay(true);

    if (skipTimeoutRef.current) clearTimeout(skipTimeoutRef.current);
    skipTimeoutRef.current = setTimeout(() => setShowSkipOverlay(false), 800);
  };

  // PanResponder for gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only take control if it's a clear vertical swipe or a double-tap candidate
        return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 20;
      },
      onPanResponderGrant: (evt) => {
        // Handle double tap
        const now = Date.now();
        const { locationX, locationY } = evt.nativeEvent;

        if (lastTapRef.current && (now - lastTapRef.current.time) < 300) {
          const dx = Math.abs(locationX - lastTapRef.current.x);
          const dy = Math.abs(locationY - lastTapRef.current.y);
          if (dx < 60 && dy < 60) {
            if (locationX < SCREEN_WIDTH / 3) {
              seekBackward();
              showSkipFeedback('backward');
              lastTapRef.current = null;
              return;
            } else if (locationX > (SCREEN_WIDTH * 2) / 3) {
              seekForward();
              showSkipFeedback('forward');
              lastTapRef.current = null;
              return;
            }
          }
        }
        lastTapRef.current = { time: now, x: locationX, y: locationY };

        // If controls are hidden, show them on any touch
        if (!showControls) {
          resetControlsTimeout();
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const { locationX } = evt.nativeEvent;
        const isLeft = locationX < SCREEN_WIDTH / 2;

        // Vertical swipe detection
        if (Math.abs(gestureState.dy) > Math.abs(gestureState.dx)) {
          // Hide controls during swipe for better visibility of feedback
          if (showControls) setShowControls(false);

          const delta = -gestureState.dy / 1500; // Even less sensitive

          if (isLeft) {
            setBrightness(prev => {
              const next = Math.max(0.1, Math.min(1.0, prev + delta));
              showGestureFeedback('brightness', next);
              return next;
            });
          } else {
            setVolume(prev => {
              const next = Math.max(0, Math.min(1.0, prev + delta));
              showGestureFeedback('volume', next);
              return next;
            });
          }
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        // If it was just a tap (no significant move and not a double tap already handled)
        if (Math.abs(gestureState.dx) < 10 && Math.abs(gestureState.dy) < 10) {
          // Normal tap - toggle controls
          setShowControls(prev => !prev);
          if (!showControls) resetControlsTimeout();
        }
      }
    })
  ).current;

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
        if (activeVideoRef.current) {
          await activeVideoRef.current.setPositionAsync(resumeTime * 1000);
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
    setPlayableDuration(status.playableDurationMillis ? status.playableDurationMillis / 1000 : 0);

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
    if (!activeVideoRef.current) return;

    if (isPlaying) {
      await activeVideoRef.current.pauseAsync();
    } else {
      await activeVideoRef.current.playAsync();
    }
    resetControlsTimeout();
  };

  const handleSeek = async (seekTime: number) => {
    if (!activeVideoRef.current) return;
    await activeVideoRef.current.setPositionAsync(seekTime * 1000);
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

    setPendingQualityIndex(index);
    setIsSwapping(true);
    setShowQualityModal(false);

    // Set the source on the inactive video component to start background loading
    if (activeVideo === 'A') {
      setSourceB(sources[index]);
    } else {
      setSourceA(sources[index]);
    }
  };

  // Handle background video ready - perform seamless blend-in swap
  const handleBgVideoReady = async () => {
    if (pendingQualityIndex === null) return;

    try {
      // Get current position from active video
      let swapPosition = currentTime * 1000;
      if (activeVideoRef.current) {
        const status = await activeVideoRef.current.getStatusAsync();
        if (status.isLoaded) {
          swapPosition = status.positionMillis;
        }
      }

      // Sync inactive video to current position and play
      if (inactiveVideoRef.current) {
        await inactiveVideoRef.current.setPositionAsync(swapPosition);
        if (isPlaying) {
          await inactiveVideoRef.current.playAsync();
        }
      }

      // Small buffer to ensure background video is actually playing and decoded
      await new Promise(resolve => setTimeout(resolve, 500));

      // Perform the swap
      const newActive = activeVideo === 'A' ? 'B' : 'A';
      setActiveVideo(newActive);
      setSelectedQuality(pendingQualityIndex);

      // Now playing new video - pause the OLD video (don't stop yet, just pause to be safe)
      if (activeVideoRef.current) {
        await activeVideoRef.current.pauseAsync();
      }

      // Cleanup
      setPendingQualityIndex(null);
      setIsSwapping(false);

      // Clear the now unused source after a delay
      setTimeout(() => {
        if (newActive === 'A') setSourceB(null); else setSourceA(null);
      }, 1000);

    } catch (e) {
      console.error('Error during seamless resolution swap:', e);
      setPendingQualityIndex(null);
      setIsSwapping(false);
    }
  };

  // Fetch and parse subtitles when selectedSubtitle changes
  useEffect(() => {
    if (!selectedSubtitle) {
      setParsedSubtitles([]);
      setActiveCue(null);
      return;
    }

    const fetchSubtitles = async () => {
      try {
        const response = await fetch(selectedSubtitle.url);
        const text = await response.text();

        // Simple SRT/VTT parser
        const cues: SubtitleCue[] = [];
        // Regex for timestamps: 00:00:20,000 --> 00:00:24,400 or 00:20.000 --> 00:24.400
        const timestampRegex = /(\d{1,2}:)?\d{1,2}:\d{1,2}[,.]\d{3} --> (\d{1,2}:)?\d{1,2}:\d{1,2}[,.]\d{3}/;

        const lines = text.split(/\r?\n/);
        let currentCue: Partial<SubtitleCue> | null = null;

        const parseTime = (timeStr: string) => {
          const parts = timeStr.replace(',', '.').split(':');
          if (parts.length === 3) {
            return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
          } else {
            return parseInt(parts[0]) * 60 + parseFloat(parts[1]);
          }
        };

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();

          if (timestampRegex.test(line)) {
            const [startStr, endStr] = line.split(' --> ');
            currentCue = {
              start: parseTime(startStr),
              end: parseTime(endStr),
              text: ''
            };
          } else if (currentCue && line === '') {
            if (currentCue.text) {
              cues.push(currentCue as SubtitleCue);
            }
            currentCue = null;
          } else if (currentCue) {
            currentCue.text = currentCue.text ? `${currentCue.text}\n${line}` : line;
          }
        }

        // Push last cue if file doesn't end with empty line
        if (currentCue && currentCue.text) {
          cues.push(currentCue as SubtitleCue);
        }

        setParsedSubtitles(cues);
      } catch (e) {
        console.error('Error fetching/parsing subtitles:', e);
        setParsedSubtitles([]);
      }
    };

    fetchSubtitles();
  }, [selectedSubtitle]);

  // Sync active cue with currentTime
  useEffect(() => {
    if (parsedSubtitles.length === 0) {
      setActiveCue(null);
      return;
    }

    // Binary search would be faster but for simple vtt/srt a find is usually fine
    const cue = parsedSubtitles.find(c => currentTime >= c.start && currentTime <= c.end);
    if (cue !== activeCue) {
      setActiveCue(cue || null);
    }
  }, [currentTime, parsedSubtitles]);

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
      {/* Black Overlay for Brightness (Simulated) */}
      <View
        pointerEvents="none"
        style={[
          styles.brightnessOverlay,
          { backgroundColor: `rgba(0,0,0,${1 - brightness})` }
        ]}
      />

      {/* Video */}
      <View
        style={styles.videoContainer}
        {...panResponder.panHandlers}
      >
        {/* Video A */}
        {sourceA && (
          <Video
            ref={videoA}
            source={{ uri: sourceA.url }}
            style={[styles.video, activeVideo === 'B' && styles.hiddenVideo]}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={autoPlay && activeVideo === 'A'}
            volume={volume}
            progressUpdateIntervalMillis={500}
            onPlaybackStatusUpdate={activeVideo === 'A' ? handlePlaybackStatusUpdate : undefined}
            onLoad={activeVideo === 'B' ? handleBgVideoReady : undefined}
            onError={(e) => activeVideo === 'A' && setError(e)}
            posterSource={poster ? { uri: poster } : undefined}
            usePoster={!!poster && activeVideo === 'A'}
          />
        )}

        {/* Video B */}
        {sourceB && (
          <Video
            ref={videoB}
            source={{ uri: sourceB.url }}
            style={[styles.video, activeVideo === 'A' && styles.hiddenVideo]}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={autoPlay && activeVideo === 'B'}
            volume={volume}
            progressUpdateIntervalMillis={500}
            onPlaybackStatusUpdate={activeVideo === 'B' ? handlePlaybackStatusUpdate : undefined}
            onLoad={activeVideo === 'A' ? handleBgVideoReady : undefined}
            onError={(e) => activeVideo === 'B' && setError(e)}
            posterSource={poster ? { uri: poster } : undefined}
            usePoster={!!poster && activeVideo === 'B'}
          />
        )}

        {/* Subtitle Overlay */}
        {activeCue && (
          <View style={styles.subtitleOverlay} pointerEvents="none">
            <Text style={styles.subtitleText}>{activeCue.text}</Text>
          </View>
        )}

        {/* Loading Indicator */}
        {(isLoading || isSwapping) && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#9727e7" />
            {isSwapping && (
              <Text style={styles.swappingText}>Switching to {sources[pendingQualityIndex!]?.resolution}p...</Text>
            )}
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
                <View style={styles.bufferProgressBackground}>
                  <View style={[styles.bufferProgressFill, { width: `${(playableDuration / Math.max(duration, 0.1)) * 100}%` }]} />
                </View>
                <Slider
                  style={{ width: '100%', height: 40 }}
                  minimumValue={0}
                  maximumValue={Math.max(duration, 0.1)} // Prevent 0 maximum
                  value={currentTime}
                  minimumTrackTintColor="#9727e7"
                  maximumTrackTintColor="transparent" // Let the buffer show through
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

        {/* Gesture Feedback Overlay */}
        {showGestureOverlay && (
          <View style={styles.gestureOverlay}>
            <View style={styles.gestureIconContainer}>
              <MaterialIcons
                name={gestureType === 'volume' ? (gestureValue === 0 ? 'volume-off' : 'volume-up') : 'brightness-6'}
                size={32}
                color="white"
              />
              <View style={styles.gestureProgressBar}>
                <View style={[styles.gestureProgressFill, { width: `${gestureValue * 100}%` }]} />
              </View>
            </View>
          </View>
        )}

        {/* Skip Animation Overlay */}
        {showSkipOverlay && (
          <View style={[
            styles.skipOverlay,
            skipType === 'backward' ? { left: '10%' } : { right: '10%' }
          ]}>
            <View style={styles.skipCircle}>
              <MaterialIcons
                name={skipType === 'backward' ? 'replay-10' : 'forward-10'}
                size={40}
                color="white"
              />
            </View>
          </View>
        )}
      </View>

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
    position: 'relative',
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  brightnessOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  gestureOverlay: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    marginLeft: -40,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    width: 80,
    zIndex: 20,
  },
  gestureIconContainer: {
    alignItems: 'center',
    gap: 10,
  },
  gestureProgressBar: {
    width: 50,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  gestureProgressFill: {
    height: '100%',
    backgroundColor: '#9727e7',
  },
  skipOverlay: {
    position: 'absolute',
    top: '40%',
    zIndex: 20,
  },
  skipCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  hiddenVideo: {
    opacity: 0,
    zIndex: -1,
    position: 'absolute',
    width: 1,
    height: 1,
  },
  swappingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 14,
    fontWeight: '500',
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
  subtitleOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
  },
  subtitleText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    textShadowColor: 'rgba(0,0,0,1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bufferProgressBackground: {
    position: 'absolute',
    left: 15, // Slider padding
    right: 15,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    overflow: 'hidden',
    // Align with slider's track
    top: 18,
  },
  bufferProgressFill: {
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
});
