import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PortraitCard } from '../components/MovieCard';
import { searchMulti, getTrendingMovies, getTrendingTV, getPosterUrl, getProfileUrl } from '../services/tmdb';
import { TMDBMovie, TMDBTVShow, TMDBPerson } from '../types/tmdb';

const { width } = Dimensions.get('window');

// Calculate card width for 3-column grid
const GRID_PADDING = 32;
const GRID_GAP = 12;
const CARD_WIDTH = (width - GRID_PADDING - GRID_GAP * 2) / 3;

const FILTERS = ['All', 'Movies', 'TV Shows', 'People'];

type SearchResult = TMDBMovie | TMDBTVShow | TMDBPerson;

interface SearchScreenProps {
  onMoviePress?: (movieId: number) => void;
  onTvPress?: (tvId: number) => void;
  onActorPress?: (actorId: number) => void;
}

export default function SearchScreen({ onMoviePress, onTvPress, onActorPress }: SearchScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [trendingMovies, setTrendingMovies] = useState<TMDBMovie[]>([]);
  const [trendingTV, setTrendingTV] = useState<TMDBTVShow[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  // Fetch trending content on mount
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const [movies, tv] = await Promise.all([
          getTrendingMovies('day'),
          getTrendingTV('day'),
        ]);
        setTrendingMovies(movies.slice(0, 6));
        setTrendingTV(tv.slice(0, 6));
      } catch (error) {
        console.error('Error fetching trending:', error);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchTrending();
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await searchMulti(searchQuery);
        setResults(response.results);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Local type guards that work with any type
  const isMovie = (item: any): item is TMDBMovie => 'title' in item && !('known_for_department' in item);
  const isTv = (item: any): item is TMDBTVShow => 'name' in item && 'first_air_date' in item && !('known_for_department' in item);
  const isPerson = (item: any): item is TMDBPerson => 'known_for_department' in item;

  // Filter results by type
  const filteredResults = results.filter((item) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Movies') return isMovie(item);
    if (activeFilter === 'TV Shows') return isTv(item);
    if (activeFilter === 'People') return isPerson(item);
    return true;
  });

  const handleItemPress = (item: SearchResult) => {
    if (isMovie(item)) {
      onMoviePress?.(item.id);
    } else if (isTv(item)) {
      onTvPress?.(item.id);
    } else if (isPerson(item)) {
      onActorPress?.(item.id);
    }
  };

  const getItemTitle = (item: SearchResult) => {
    if (isMovie(item)) return item.title;
    if (isTv(item)) return item.name;
    if (isPerson(item)) return item.name;
    return '';
  };

  const getItemImage = (item: SearchResult) => {
    if (isPerson(item)) return getProfileUrl(item.profile_path);
    return getPosterUrl((item as TMDBMovie | TMDBTVShow).poster_path);
  };

  const getItemYear = (item: SearchResult) => {
    if (isMovie(item)) return item.release_date?.split('-')[0] || '';
    if (isTv(item)) return item.first_air_date?.split('-')[0] || '';
    return '';
  };

  const getItemRating = (item: SearchResult) => {
    if (isPerson(item)) return '';
    return (item as TMDBMovie | TMDBTVShow).vote_average?.toFixed(1) || '';
  };

  const handleTrendingSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Trending searches from actual trending movies/TV
  const trendingSearches = [
    ...trendingMovies.slice(0, 2).map(m => m.title),
    ...trendingTV.slice(0, 2).map(t => t.name),
  ];

  return (
    <View style={styles.container}>
      {/* Search Header Layer - Sticky & Blurred */}
      <View style={styles.headerWrapper}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            {/* Search Bar */}
            <View style={styles.searchBar}>
              <View style={styles.searchIcon}>
                <MaterialIcons name="search" size={24} color="#9ca3af" />
              </View>
              <TextInput 
                style={styles.input} 
                placeholder="Search for movies, TV shows, or people..." 
                placeholderTextColor="#6b7280"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity style={styles.clearBtn} onPress={() => setSearchQuery('')}>
                  <MaterialIcons name="close" size={20} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Chips - Only show when searching */}
            {searchQuery.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
                {FILTERS.map((filter) => (
                  <TouchableOpacity 
                    key={filter} 
                    style={[styles.chip, activeFilter === filter && styles.activeChip]}
                    onPress={() => setActiveFilter(filter)}
                  >
                    <Text style={[styles.chipText, activeFilter === filter && styles.activeChipText]}>
                      {filter}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#9727e7" />
          </View>
        )}

        {/* Search Results */}
        {!loading && searchQuery.length > 0 && filteredResults.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''} for "{searchQuery}"
            </Text>
            <View style={styles.grid}>
              {filteredResults.map((item) => (
                <View key={`${item.id}-${'title' in item ? 'movie' : 'name' in item && 'known_for_department' in item ? 'person' : 'tv'}`} style={styles.gridItemWrapper}>
                  <PortraitCard
                    title={getItemTitle(item) || ''}
                    image={getItemImage(item)}
                    rating={getItemRating(item)}
                    year={getItemYear(item)}
                    showRating={!isPerson(item)}
                    style={{ width: '100%', marginRight: 0 }}
                    onPress={() => handleItemPress(item)}
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* No Results */}
        {!loading && searchQuery.length > 0 && filteredResults.length === 0 && (
          <View style={styles.noResultsContainer}>
            <MaterialIcons name="search-off" size={64} color="#4b5563" />
            <Text style={styles.noResultsText}>No results found for "{searchQuery}"</Text>
            <Text style={styles.noResultsHint}>Try different keywords or check spelling</Text>
          </View>
        )}

        {/* Default Content - Trending */}
        {!loading && searchQuery.length === 0 && (
          <>
            {/* Trending Searches */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trending Searches</Text>
              <View style={styles.trendingList}>
                {initialLoading ? (
                  <ActivityIndicator size="small" color="#9727e7" style={{ marginVertical: 20 }} />
                ) : (
                  trendingSearches.map((item, index) => (
                    <TouchableOpacity 
                      key={index} 
                      style={styles.trendingItem}
                      onPress={() => handleTrendingSearch(item)}
                    >
                      <View style={styles.trendingIcon}>
                        <MaterialIcons name="trending-up" size={20} color="#9727e7" />
                      </View>
                      <Text style={styles.trendingText} numberOfLines={1}>{item}</Text>
                      <MaterialIcons name="north-east" size={20} color="#6b7280" />
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </View>

            {/* Trending Movies */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Trending Movies</Text>
              </View>
              
              <View style={styles.grid}>
                {(initialLoading ? [1,2,3,4,5,6] : trendingMovies).map((item, index) => (
                  initialLoading ? (
                    <View key={index} style={[styles.gridItemWrapper, styles.skeletonCard]} />
                  ) : (
                    <View key={(item as TMDBMovie).id} style={styles.gridItemWrapper}>
                      <PortraitCard
                        title={(item as TMDBMovie).title || ''}
                        image={getPosterUrl((item as TMDBMovie).poster_path)}
                        rating={(item as TMDBMovie).vote_average?.toFixed(1)}
                        year={(item as TMDBMovie).release_date?.split('-')[0]}
                        showRating={true}
                        style={{ width: '100%', marginRight: 0 }}
                        onPress={() => onMoviePress?.((item as TMDBMovie).id)}
                      />
                    </View>
                  )
                ))}
              </View>
            </View>

            {/* Trending TV Shows */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Trending TV Shows</Text>
              </View>
              
              <View style={styles.grid}>
                {(initialLoading ? [1,2,3,4,5,6] : trendingTV).map((item, index) => (
                  initialLoading ? (
                    <View key={index} style={[styles.gridItemWrapper, styles.skeletonCard]} />
                  ) : (
                    <View key={(item as TMDBTVShow).id} style={styles.gridItemWrapper}>
                      <PortraitCard
                        title={(item as TMDBTVShow).name || ''}
                        image={getPosterUrl((item as TMDBTVShow).poster_path)}
                        rating={(item as TMDBTVShow).vote_average?.toFixed(1)}
                        year={(item as TMDBTVShow).first_air_date?.split('-')[0]}
                        showRating={true}
                        style={{ width: '100%', marginRight: 0 }}
                        onPress={() => onTvPress?.((item as TMDBTVShow).id)}
                      />
                    </View>
                  )
                ))}
              </View>
            </View>
          </>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1121',
  },
  headerWrapper: {
    paddingBottom: 8,
    borderBottomWidth: 0,
    zIndex: 30,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(26, 17, 33, 0.95)',
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  searchBar: {
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  searchIcon: {
    paddingLeft: 16,
    paddingRight: 12,
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    fontFamily: 'Manrope_500Medium',
  },
  clearBtn: {
    paddingHorizontal: 16,
  },
  chipsContainer: {
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
    flexDirection: 'row',
  },
  chip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeChip: {
    backgroundColor: 'rgba(151, 39, 231, 0.2)',
    borderColor: '#9727e7',
  },
  chipText: {
    color: '#9ca3af',
    fontSize: 14,
    fontFamily: 'Manrope_500Medium',
  },
  activeChipText: {
    color: '#9727e7',
  },
  scrollContent: {
    paddingTop: 140,
    paddingBottom: 120,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 12,
    fontFamily: 'Manrope_700Bold',
  },
  trendingList: {
    gap: 4,
  },
  trendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 12,
  },
  trendingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(151, 39, 231, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendingText: {
    flex: 1,
    fontSize: 16,
    color: 'white',
    fontFamily: 'Manrope_500Medium',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  gridItemWrapper: {
    width: CARD_WIDTH,
  },
  skeletonCard: {
    height: CARD_WIDTH * 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  noResultsText: {
    fontSize: 18,
    color: 'white',
    fontFamily: 'Manrope_600SemiBold',
    textAlign: 'center',
  },
  noResultsHint: {
    fontSize: 14,
    color: '#9ca3af',
    fontFamily: 'Manrope_400Regular',
    textAlign: 'center',
  },
});
