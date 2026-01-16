import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { getTrendingMovies, getTrendingTV, getPosterUrl, getBackdropUrl } from '../services/tmdb';
import { TMDBMovie, TMDBTVShow, isTMDBMovie } from '../types/tmdb';

const { width, height } = Dimensions.get('window');

interface ShuffleLoadingScreenProps {
  onClose: () => void;
  onMovieSelect?: (movieId: number) => void;
  onTvSelect?: (tvId: number) => void;
}

type ShuffleItem = TMDBMovie | TMDBTVShow;

export default function ShuffleLoadingScreen({ onClose, onMovieSelect, onTvSelect }: ShuffleLoadingScreenProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const rotateRing1 = useRef(new Animated.Value(0)).current;
  const rotateRing2 = useRef(new Animated.Value(0)).current;
  const scrollAnim = useRef(new Animated.Value(0)).current;
  
  const [items, setItems] = useState<ShuffleItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ShuffleItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shuffleComplete, setShuffleComplete] = useState(false);

  // Fetch random movies and TV shows
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const [movies, tvShows] = await Promise.all([
          getTrendingMovies('week'),
          getTrendingTV('week'),
        ]);
        
        // Combine and shuffle
        const combined: ShuffleItem[] = [...movies.slice(0, 10), ...tvShows.slice(0, 10)];
        const shuffled = combined.sort(() => Math.random() - 0.5);
        setItems(shuffled);
        
        // Pick a random item after loading animation
        const randomIndex = Math.floor(Math.random() * shuffled.length);
        setSelectedItem(shuffled[randomIndex]);
      } catch (error) {
        console.error('Error fetching shuffle content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, []);

  // Start shuffle completion timer
  useEffect(() => {
    if (!isLoading && selectedItem) {
      const timer = setTimeout(() => {
        setShuffleComplete(true);
      }, 3000); // Show animation for 3 seconds
      return () => clearTimeout(timer);
    }
  }, [isLoading, selectedItem]);

  useEffect(() => {
    // Pulsing glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Shuffle icon rotation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    // Ring 1 rotation (slower)
    Animated.loop(
      Animated.timing(rotateRing1, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: true,
      })
    ).start();

    // Ring 2 rotation (faster, reverse)
    Animated.loop(
      Animated.timing(rotateRing2, {
        toValue: 1,
        duration: 15000,
        useNativeDriver: true,
      })
    ).start();

    // Vertical scroll animation
    Animated.loop(
      Animated.timing(scrollAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const rotateRing1Deg = rotateRing1.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const rotateRing2Deg = rotateRing2.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  const scrollY = scrollAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -120],
  });

  const handleWatchNow = () => {
    if (selectedItem) {
      if (isTMDBMovie(selectedItem)) {
        onMovieSelect?.(selectedItem.id);
      } else {
        onTvSelect?.(selectedItem.id);
      }
    }
    onClose();
  };

  const handleShuffle = () => {
    if (items.length > 0) {
      setShuffleComplete(false);
      const randomIndex = Math.floor(Math.random() * items.length);
      setSelectedItem(items[randomIndex]);
      setTimeout(() => setShuffleComplete(true), 2000);
    }
  };

  // Get display data for selected item
  const getItemTitle = (item: ShuffleItem) => isTMDBMovie(item) ? item.title : item.name;
  const getItemYear = (item: ShuffleItem) => {
    const date = isTMDBMovie(item) ? item.release_date : item.first_air_date;
    return date?.split('-')[0] || '';
  };
  const getItemType = (item: ShuffleItem) => isTMDBMovie(item) ? 'Movie' : 'TV Show';

  // Background image from selected item
  const backgroundImage = selectedItem?.backdrop_path 
    ? getBackdropUrl(selectedItem.backdrop_path)
    : 'https://lh3.googleusercontent.com/aida-public/AB6AXuCRQnNgN9JvoKoVcNab2dVQBWQnMI73HSNTFzq3qmZbE1_4GhES5qb_M7zxNA6V9MtoWs9pd_y4wzPx4Swde13Y7qrJYp47_Tm8UpGSAx0YHIeVF56H4ndgJV2Fh2tUUB55jECyxwjVayXvHftP2wHuNUFDSqjDRquPQkxcwr49m9Rg6ic9j-k8YE8tT7dzHHkcRynHlz4veMPMzV4XC3gLV6kB4RHlW2fPeoDziqvfurxPQ5WFlpvL7NLDVB4bv7Ibii7cdnxTSWQ8';

  // If shuffle complete, show the result
  if (shuffleComplete && selectedItem) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        
        {/* Background Image */}
        <View style={styles.backgroundContainer}>
          <Image
            source={{ uri: backgroundImage }}
            style={styles.backgroundImage}
            blurRadius={5}
          />
          <LinearGradient
            colors={['rgba(26,17,33,0.7)', 'rgba(26,17,33,0.9)', '#1a1121']}
            style={StyleSheet.absoluteFillObject}
          />
        </View>

        {/* Close Button */}
        <View style={styles.topBar}>
          <View style={styles.spacer} />
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialIcons name="close" size={24} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>

        {/* Result Content */}
        <View style={styles.resultContainer}>
          <Text style={styles.foundText}>We found something for you!</Text>
          
          {/* Poster */}
          <View style={styles.posterContainer}>
            <Image
              source={{ uri: getPosterUrl(selectedItem.poster_path) }}
              style={styles.posterImage}
            />
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{getItemType(selectedItem)}</Text>
            </View>
          </View>

          {/* Title & Details */}
          <Text style={styles.resultTitle}>{getItemTitle(selectedItem)}</Text>
          <View style={styles.resultMeta}>
            <MaterialIcons name="star" size={16} color="#eab308" />
            <Text style={styles.metaRating}>{selectedItem.vote_average.toFixed(1)}</Text>
            <View style={styles.metaDot} />
            <Text style={styles.metaText}>{getItemYear(selectedItem)}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.watchNowBtn} onPress={handleWatchNow}>
              <MaterialIcons name="play-arrow" size={24} color="white" />
              <Text style={styles.watchNowText}>Watch Now</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shuffleAgainBtn} onPress={handleShuffle}>
              <MaterialIcons name="shuffle" size={24} color="#9727e7" />
              <Text style={styles.shuffleAgainText}>Shuffle Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Background Image */}
      <View style={styles.backgroundContainer}>
        <Image
          source={{ uri: backgroundImage }}
          style={styles.backgroundImage}
          blurRadius={10}
        />
        <LinearGradient
          colors={['rgba(26,17,33,0.9)', 'rgba(26,17,33,0.95)', '#1a1121']}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      {/* Close Button */}
      <View style={styles.topBar}>
        <View style={styles.spacer} />
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <MaterialIcons name="close" size={24} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>

      {/* Center Content */}
      <View style={styles.centerContent}>
        {/* Headline */}
        <View style={styles.headline}>
          <Text style={styles.headlineText}>
            Picking something{'\n'}
            <Text style={styles.headlineAccent}>perfect</Text> for you...
          </Text>
          <Text style={styles.subheadline}>
            Searching Movies • TV Shows • Best Matches
          </Text>
        </View>

        {/* Animation Container */}
        <View style={styles.animationContainer}>
          {/* Rotating Rings */}
          <Animated.View style={[styles.ring1, { transform: [{ rotate: rotateRing1Deg }] }]} />
          <Animated.View style={[styles.ring2, { transform: [{ rotate: rotateRing2Deg }] }]} />
          
          {/* Pulsing Glow */}
          <Animated.View style={[styles.glow, { transform: [{ scale: pulseAnim }] }]} />
          
          {/* Center Icon */}
          <View style={styles.iconContainer}>
            <Animated.View style={{ transform: [{ rotate }] }}>
              <MaterialIcons name="shuffle" size={48} color="#9727e7" />
            </Animated.View>
          </View>

          {/* Particle Dots */}
          <View style={[styles.dot, styles.dotTop]} />
          <View style={[styles.dot, styles.dotBottom]} />
          <View style={[styles.dot, styles.dotLeft]} />
          <View style={[styles.dot, styles.dotRight]} />
        </View>

        {/* Slot Machine Carousel */}
        <View style={styles.carouselContainer}>
          <Animated.View style={[styles.carouselScroll, { transform: [{ translateY: scrollY }] }]}>
            {items.length > 0 ? (
              [...items, ...items].slice(0, 6).map((item, index) => (
                <View key={`${item.id}-${index}`} style={styles.carouselItem}>
                  <Image source={{ uri: getPosterUrl(item.poster_path) }} style={styles.carouselImage} />
                  <View style={styles.carouselText}>
                    <Text style={styles.carouselTitle} numberOfLines={1}>
                      {isTMDBMovie(item) ? item.title : item.name}
                    </Text>
                    <Text style={styles.carouselMeta}>
                      ⭐ {item.vote_average.toFixed(1)} • {isTMDBMovie(item) ? 'Movie' : 'TV'}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              [1, 2, 3].map((i) => (
                <View key={i} style={styles.carouselItem}>
                  <View style={[styles.carouselImage, { backgroundColor: '#2d2335' }]} />
                  <View style={styles.carouselText}>
                    <View style={styles.shimmerBar1} />
                    <View style={styles.shimmerBar2} />
                  </View>
                </View>
              ))
            )}
          </Animated.View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Analyzing {items.length > 0 ? items.length * 50 : '1,000'}+ titles based on popularity
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1121',
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    opacity: 0.4,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
  },
  spacer: {
    width: 40,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: -40,
  },
  headline: {
    alignItems: 'center',
    marginBottom: 48,
  },
  headlineText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    lineHeight: 36,
    fontFamily: 'Manrope_700Bold',
    textShadowColor: 'rgba(151,39,231,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  headlineAccent: {
    color: '#A130E0',
  },
  subheadline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 8,
    fontFamily: 'Manrope_500Medium',
  },
  animationContainer: {
    width: 256,
    height: 256,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
    position: 'relative',
  },
  ring1: {
    position: 'absolute',
    width: 256,
    height: 256,
    borderRadius: 128,
    borderWidth: 2,
    borderColor: 'rgba(151,39,231,0.2)',
  },
  ring2: {
    position: 'absolute',
    width: 224,
    height: 224,
    borderRadius: 112,
    borderWidth: 1,
    borderColor: 'rgba(151,39,231,0.1)',
  },
  glow: {
    position: 'absolute',
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: 'rgba(151,39,231,0.2)',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#2d2335',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#9727e7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 8,
    zIndex: 10,
  },
  dot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9727e7',
    shadowColor: '#9727e7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  dotTop: {
    top: 0,
    left: '50%',
    marginLeft: -2,
  },
  dotBottom: {
    bottom: 0,
    left: '50%',
    marginLeft: -2,
  },
  dotLeft: {
    left: 0,
    top: '50%',
    marginTop: -2,
  },
  dotRight: {
    right: 0,
    top: '50%',
    marginTop: -2,
  },
  carouselContainer: {
    width: 280,
    height: 192,
    overflow: 'hidden',
  },
  carouselScroll: {
    gap: 16,
  },
  carouselItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 8,
    opacity: 0.8,
    marginBottom: 12,
  },
  carouselImage: {
    width: 48,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#2d2335',
  },
  carouselText: {
    flex: 1,
    gap: 4,
  },
  carouselTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Manrope_600SemiBold',
  },
  carouselMeta: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'Manrope_400Regular',
  },
  shimmerBar1: {
    height: 12,
    width: 128,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 6,
  },
  shimmerBar2: {
    height: 8,
    width: 80,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
  },
  footer: {
    paddingBottom: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '500',
    fontFamily: 'Manrope_500Medium',
  },
  
  // Result Screen Styles
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  foundText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Manrope_500Medium',
    marginBottom: 24,
  },
  posterContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  posterImage: {
    width: 180,
    height: 270,
    borderRadius: 16,
    backgroundColor: '#2d2335',
  },
  typeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#9727e7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
    fontFamily: 'Manrope_800ExtraBold',
    marginBottom: 8,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  metaRating: {
    fontSize: 14,
    fontWeight: '700',
    color: '#eab308',
    marginLeft: 4,
    fontFamily: 'Manrope_700Bold',
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 8,
  },
  metaText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'Manrope_500Medium',
  },
  actionButtons: {
    gap: 12,
    width: '100%',
  },
  watchNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9727e7',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  watchNowText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'Manrope_700Bold',
  },
  shuffleAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(151,39,231,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(151,39,231,0.3)',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  shuffleAgainText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9727e7',
    fontFamily: 'Manrope_700Bold',
  },
});
