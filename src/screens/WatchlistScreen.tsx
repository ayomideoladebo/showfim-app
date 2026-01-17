import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, ActivityIndicator, Alert, BackHandler } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWatchlist, WatchlistItem } from '../hooks/useWatchlist';
import { getPosterUrl } from '../services/tmdb';

const { width } = Dimensions.get('window');

interface WatchlistScreenProps {
  onBack: () => void;
  onMoviePress?: (movieId: number) => void;
  onTvPress?: (tvId: number) => void;
}

export default function WatchlistScreen({ onBack, onMoviePress, onTvPress }: WatchlistScreenProps) {
  const { watchlist, loading, removeFromWatchlist } = useWatchlist();
  const gridItemWidth = (width - 48 - 24) / 3;

  // Handle hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => backHandler.remove();
  }, [onBack]);

  const handleItemPress = (item: WatchlistItem) => {
    if (item.type === 'movie') {
      onMoviePress?.(item.id);
    } else {
      onTvPress?.(item.id);
    }
  };

  const handleRemove = (item: WatchlistItem) => {
    Alert.alert(
      'Remove from Watchlist',
      `Remove "${item.title}" from your watchlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeFromWatchlist(item.id, item.type) },
      ]
    );
  };

  const movieCount = watchlist.filter(i => i.type === 'movie').length;
  const tvCount = watchlist.filter(i => i.type === 'tv').length;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Sticky Header */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']} style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
             <MaterialIcons name="arrow-back" size={24} color="#d1d5db" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Watchlist</Text>
          <TouchableOpacity style={styles.filterBtn}>
             <MaterialIcons name="filter-list" size={24} color="#9ca3af" />
          </TouchableOpacity>
        </SafeAreaView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9727e7" />
        </View>
      ) : watchlist.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="bookmark-outline" size={64} color="#374151" />
          <Text style={styles.emptyTitle}>Your watchlist is empty</Text>
          <Text style={styles.emptySubtitle}>Add movies and TV shows to watch later</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.summaryRow}>
            <Text style={styles.itemCount}>
              {movieCount > 0 && `${movieCount} Movie${movieCount !== 1 ? 's' : ''}`}
              {movieCount > 0 && tvCount > 0 && ' • '}
              {tvCount > 0 && `${tvCount} TV Show${tvCount !== 1 ? 's' : ''}`}
            </Text>
          </View>

          <View style={styles.grid}>
            {watchlist.map(item => (
              <TouchableOpacity 
                key={`${item.type}-${item.id}`} 
                style={[styles.gridItem, { width: gridItemWidth }]}
                onPress={() => handleItemPress(item)}
                activeOpacity={0.8}
              >
                <Image 
                  source={{ uri: getPosterUrl(item.posterPath) }} 
                  style={styles.poster} 
                />
                <View style={styles.overlay} />
                <TouchableOpacity 
                  style={styles.removeBtn} 
                  onPress={() => handleRemove(item)}
                >
                  <MaterialIcons name="close" size={14} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
                {/* Type badge */}
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>{item.type === 'movie' ? 'MOVIE' : 'TV'}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1121',
  },
  header: {
    backgroundColor: 'rgba(26, 17, 33, 0.95)',
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
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.5,
    fontFamily: 'Manrope_800ExtraBold',
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  filterBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(45, 36, 52, 0.5)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  emptySubtitle: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    aspectRatio: 2/3,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#2d2434',
    marginBottom: 4,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  poster: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%',
    backgroundColor: 'rgba(0,0,0,0.3)', 
  },
  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  typeBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(151, 39, 231, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
