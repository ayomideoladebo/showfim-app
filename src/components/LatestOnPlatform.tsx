import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
import { PortraitCard } from './MovieCard';
import { getLatestOnPlatform, getPosterUrl } from '../services/tmdb';
import { TMDBMovie, TMDBTVShow, isTMDBMovie } from '../types/tmdb';

const { width } = Dimensions.get('window');

// Streaming platforms data
const PLATFORMS = [
  { id: 8, name: 'Netflix', logoUrl: 'https://www.netflix.com/favicon.ico' },
  { id: 9, name: 'Prime Video', logoUrl: 'https://img.icons8.com/fluency/48/amazon-prime-video.png' },
  { id: 2, name: 'Apple TV+', logoUrl: 'https://www.apple.com/favicon.ico' },
  { id: 337, name: 'Disney+', logoUrl: 'https://img.icons8.com/fluency/48/disney-plus.png' },
  { id: 531, name: 'Paramount+', logoUrl: 'https://www.paramountplus.com/favicon.ico' },
];

interface LatestOnPlatformProps {
  onMoviePress?: (movieId: number) => void;
}

export const LatestOnPlatform = ({ onMoviePress }: LatestOnPlatformProps) => {
  const [selectedPlatform, setSelectedPlatform] = useState(PLATFORMS[0]);
  const [content, setContent] = useState<(TMDBMovie | TMDBTVShow)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate card width for 3-column layout
  const movieCardWidth = (width - 64) / 3;

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getLatestOnPlatform(selectedPlatform.id);
        setContent(data);
      } catch (err) {
        console.error('Error fetching platform content:', err);
        setError('Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [selectedPlatform.id]);

  return (
    <View style={styles.container}>
      {/* Header with Platform Selector */}
      <View style={styles.header}>
        <Text style={styles.title}>Latest On</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.platformSelector}
        >
          {PLATFORMS.map((platform) => (
            <TouchableOpacity
              key={platform.id}
              style={[
                styles.platformChip,
                selectedPlatform.id === platform.id && styles.platformChipActive,
              ]}
              onPress={() => setSelectedPlatform(platform)}
            >
              <Image 
                source={{ uri: platform.logoUrl }} 
                style={styles.platformLogo}
              />
              <Text
                style={[
                  styles.platformName,
                  selectedPlatform.id === platform.id && styles.platformNameActive,
                ]}
              >
                {platform.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content Grid */}
      {loading ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.contentList}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={[styles.skeletonCard, { width: movieCardWidth }]} />
          ))}
        </ScrollView>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.contentList}>
          {content.map((item) => (
            <PortraitCard
              key={item.id}
              title={(isTMDBMovie(item) ? item.title : item.name) || ''}
              image={getPosterUrl(item.poster_path)}
              onPress={() => onMoviePress?.(item.id)}
              style={{ width: movieCardWidth }}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'Manrope_700Bold',
    marginBottom: 12,
  },
  platformSelector: {
    paddingLeft: 0,
    gap: 8,
  },
  platformChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 6,
  },
  platformChipActive: {
    backgroundColor: 'rgba(151, 39, 231, 0.3)',
    borderColor: '#9727e7',
  },
  platformLogo: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  platformName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9ca3af',
    fontFamily: 'Manrope_500Medium',
  },
  platformNameActive: {
    color: 'white',
  },
  contentList: {
    paddingLeft: 0,
    paddingRight: 24,
    gap: 8,
  },
  skeletonCard: {
    height: 180,
    backgroundColor: '#2d2335',
    borderRadius: 12,
  },
  errorContainer: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Manrope_500Medium',
  },
});

export default LatestOnPlatform;
