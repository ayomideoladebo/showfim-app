import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, ScrollView, Dimensions, Image, Platform, Animated, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { ContinueWatchingCard, PortraitCard } from '../components/MovieCard';
import { LatestOnPlatform } from '../components/LatestOnPlatform';
import { useRef, useState, useEffect } from 'react';
import { getTrendingMovies, getPopularMovies, getTopRatedMovies, getUpcomingInTheaters, getTrendingTV, getPopularTV, getKDramas, getActionMovies, getComedyMovies, getDramaMovies, getActionContent, getComedyContent, getDramaContent, getPosterUrl, getBackdropUrl } from '../services/tmdb';
import { TMDBMovie, TMDBTVShow, isTMDBMovie } from '../types/tmdb';

const { width } = Dimensions.get('window');





interface HomeScreenProps {
  onMoviePress?: (movieId: number) => void;
  onTvPress?: (tvId: number) => void;
  onNotificationPress?: () => void;
}

export default function HomeScreen({ onMoviePress, onTvPress, onNotificationPress }: HomeScreenProps) {
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // TMDB Data State
  const [heroSlides, setHeroSlides] = useState<(TMDBMovie | TMDBTVShow)[]>([]);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [trendingMovies, setTrendingMovies] = useState<TMDBMovie[]>([]);
  const [popularMovies, setPopularMovies] = useState<TMDBMovie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<TMDBMovie[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<TMDBMovie[]>([]);
  const [actionContent, setActionContent] = useState<(TMDBMovie | TMDBTVShow)[]>([]);
  const [comedyContent, setComedyContent] = useState<(TMDBMovie | TMDBTVShow)[]>([]);
  const [dramaContent, setDramaContent] = useState<(TMDBMovie | TMDBTVShow)[]>([]);
  
  // TV Show State
  const [trendingTvShows, setTrendingTvShows] = useState<TMDBTVShow[]>([]);
  const [popularTvShows, setPopularTvShows] = useState<TMDBTVShow[]>([]);
  const [kDramas, setKDramas] = useState<TMDBTVShow[]>([]);
  
  // Trending filter state
  const [trendingFilter, setTrendingFilter] = useState<'movie' | 'tv'>('movie');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch TMDB data on component mount
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        const [trending, popular, topRated, upcoming, trendingTv] = await Promise.all([
          getTrendingMovies('week'),
          getPopularMovies(),
          getTopRatedMovies(),
          getUpcomingInTheaters(),
          getTrendingTV('week'),
        ]);
        
        // Create hero slides: Top 5 movies and Top 5 TV shows interleaved
        const topMovies = trending.slice(0, 5);
        const topTv = trendingTv.slice(0, 5);
        const heroContent: (TMDBMovie | TMDBTVShow)[] = [];
        
        for (let i = 0; i < Math.max(topMovies.length, topTv.length); i++) {
          if (topMovies[i]) heroContent.push(topMovies[i]);
          if (topTv[i]) heroContent.push(topTv[i]);
        }
        
        setHeroSlides(heroContent);
        
        setTrendingMovies(trending.slice(0, 10));
        setPopularMovies(popular.slice(0, 10));
        setTopRatedMovies(topRated.slice(0, 10));
        setUpcomingMovies(upcoming.slice(0, 10));
        
        // Collect all displayed movie IDs for deduplication
        let displayedIds = [
          ...trending.slice(0, 10).map(m => m.id),
          ...popular.slice(0, 10).map(m => m.id),
          ...topRated.slice(0, 10).map(m => m.id),
          ...upcoming.slice(0, 10).map(m => m.id),
        ];
        
        // Fetch action content (movies + TV) excluding already displayed ones
        const action = await getActionContent(displayedIds);
        setActionContent(action.slice(0, 10));
        displayedIds = [...displayedIds, ...action.slice(0, 10).map(m => m.id)];
        
        // Fetch comedy content (movies + TV) excluding all previously displayed
        const comedy = await getComedyContent(displayedIds);
        setComedyContent(comedy.slice(0, 10));
        displayedIds = [...displayedIds, ...comedy.slice(0, 10).map(m => m.id)];
        
        // Fetch drama content (movies + TV) excluding all previously displayed
        const drama = await getDramaContent(displayedIds);
        setDramaContent(drama.slice(0, 10));
        
        // Store trending TV for the filter
        setTrendingTvShows(trendingTv.slice(0, 10));
        
        // Fetch Popular TV and K-Dramas
        const [popularTv, koreanDramas] = await Promise.all([
          getPopularTV(),
          getKDramas(),
        ]);
        setPopularTvShows(popularTv.slice(0, 10));
        setKDramas(koreanDramas.slice(0, 10));
        
        setError(null);
      } catch (err) {
        console.error('Error fetching movies:', err);
        setError('Failed to load movies. Please check your API key.');
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);
  
  // Calculate width for 3-column layout - ensuring all 3 cards are fully visible
  // Section has 24px left/right padding, ScrollView has 0 left and 24px right padding
  // We need: card1 + gap + card2 + gap + card3 + right padding to fit
  // 2 gaps of 8px each = 16px total gaps
  // Right padding = 24px
  // Available width for cards = screenWidth - 24 (section left padding) - 16 (gaps) - 24 (right padding) = screenWidth - 64
  const movieCardWidth = (width - 64) / 3;

  // Animate header background opacity from 0 to 1 between scroll offset 0 and 50
  const headerBgOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 0.95],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Fixed Header Layer */}
      <View style={styles.fixedHeader}>
        {/* Animated Background */}
        <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#1a1121', opacity: headerBgOpacity }]} />
        
        <SafeAreaView edges={['top']} style={styles.headerContent}>
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <MaterialIcons name="local-movies" size={20} color="white" />
            </View>
            <Text style={styles.logoText}>Showfim</Text>
          </View>
          <TouchableOpacity style={styles.notificationBtn} onPress={onNotificationPress}>
            <MaterialIcons name="notifications-none" size={24} color="white" />
          </TouchableOpacity>
        </SafeAreaView>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        removeClippedSubviews={true}
      >
        {/* HERO SLIDER */}
        <View style={styles.heroContainer}>
          <FlatList
            data={heroSlides}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            removeClippedSubviews={true}
            initialNumToRender={2}
            maxToRenderPerBatch={2}
            windowSize={3}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveHeroIndex(index);
            }}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item, index }) => {
              const title = isTMDBMovie(item) ? item.title : item.name;
              const year = isTMDBMovie(item) 
                ? item.release_date?.split('-')[0] 
                : item.first_air_date?.split('-')[0];
              const type = isTMDBMovie(item) ? 'Movie' : 'TV Series';
              const rating = item.vote_average?.toFixed(1);

              return (
                <ImageBackground
                  source={{ uri: getBackdropUrl(item.backdrop_path) }}
                  style={[styles.heroImage, { width }]}
                  resizeMode="cover"
                >
                  {/* Gradients */}
                  <LinearGradient
                    colors={['rgba(26, 17, 33, 0.4)', 'rgba(0,0,0,0)']}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 0, y: 0.6 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <LinearGradient
                    colors={['rgba(26, 17, 33, 1)', 'rgba(26, 17, 33, 0.8)', 'transparent']}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 0, y: 0.5 }}
                    style={StyleSheet.absoluteFillObject}
                  />

                  {/* Hero Content */}
                  <View style={styles.heroContent}>
                    <View style={styles.tagsRow}>
                      <View style={styles.topTag}>
                        <Text style={styles.topTagText}>TOP 10</Text>
                      </View>
                      <Text style={styles.rankText}>#{index + 1} in {type} Today</Text>
                    </View>

                    <Text style={styles.heroTitle} numberOfLines={2}>{title}</Text>

                    <View style={styles.metaRow}>
                      <Text style={styles.metaText}>{year || 'N/A'}</Text>
                      <View style={styles.metaDot} />
                      <Text style={styles.metaText}>{type}</Text>
                      <View style={styles.metaDot} />
                      <Text style={styles.metaText}>★ {rating}</Text>
                      <View style={styles.qualityTag}>
                        <Text style={styles.qualityText}>HD</Text>
                      </View>
                    </View>

                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={styles.playButton} 
                        onPress={() => {
                          if (isTMDBMovie(item)) {
                            onMoviePress?.(item.id);
                          } else {
                            onTvPress?.(item.id);
                          }
                        }}
                      >
                        <MaterialIcons name="play-arrow" size={28} color="white" />
                        <Text style={styles.playText}>Play Now</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.myListButton}>
                        <MaterialIcons name="add" size={24} color="white" />
                        <Text style={styles.myListText}>My List</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </ImageBackground>
              );
            }}
          />
          
          {/* Pagination Dots */}
          <View style={styles.paginationDots}>
            {heroSlides.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  activeHeroIndex === index && styles.dotActive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* SECTIONS */}
        <View style={styles.sectionsContainer}>
          
          {/* Trending Now with Filter */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending Now</Text>
            <TouchableOpacity 
              style={styles.dropdownFilter}
              onPress={() => setTrendingFilter(trendingFilter === 'movie' ? 'tv' : 'movie')}
            >
              <Text style={styles.dropdownFilterText}>
                {trendingFilter === 'movie' ? 'Movies' : 'TV Shows'}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={18} color="#9727e7" />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {[1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={[styles.skeletonCard, { width: movieCardWidth }]} />
              ))}
            </ScrollView>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : trendingFilter === 'movie' ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {trendingMovies.map((movie, index) => (
                <PortraitCard
                  key={movie.id}
                  title={movie.title}
                  image={getPosterUrl(movie.poster_path)}
                  rank={index + 1}
                  onPress={() => onMoviePress?.(movie.id)}
                  style={{ width: movieCardWidth }}
                />
              ))}
            </ScrollView>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {trendingTvShows.map((show, index) => (
                <PortraitCard
                  key={show.id}
                  title={show.name}
                  image={getPosterUrl(show.poster_path)}
                  rank={index + 1}
                  onPress={() => onTvPress?.(show.id)}
                  style={{ width: movieCardWidth }}
                />
              ))}
            </ScrollView>
          )}

          {/* Latest On Streaming Platforms */}
          <LatestOnPlatform onMoviePress={onMoviePress} />


          {/* Popular Movies */}
          <View style={[styles.sectionHeader, { marginTop: 24 }]}>
            <Text style={styles.sectionTitle}>Popular Movies</Text>
            <TouchableOpacity><Text style={styles.seeAllText}>See All</Text></TouchableOpacity>
          </View>
          {loading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {[1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={{...styles.skeletonCard, width: movieCardWidth}} />
              ))}
            </ScrollView>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {popularMovies.map((movie) => (
                <PortraitCard
                  key={movie.id}
                  title={movie.title}
                  image={getPosterUrl(movie.poster_path)}
                  onPress={() => onMoviePress?.(movie.id)}
                  style={{ width: movieCardWidth }}
                />
              ))}
            </ScrollView>
          )}

          {/* Top Rated Movies */}
          <View style={[styles.sectionHeader, { marginTop: 24 }]}>
            <Text style={styles.sectionTitle}>Top Rated</Text>
            <TouchableOpacity><Text style={styles.seeAllText}>See All</Text></TouchableOpacity>
          </View>
          {loading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {[1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={{...styles.skeletonCard, width: movieCardWidth}} />
              ))}
            </ScrollView>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {topRatedMovies.map((movie) => (
                <PortraitCard
                  key={movie.id}
                  title={movie.title}
                  image={getPosterUrl(movie.poster_path)}
                  onPress={() => onMoviePress?.(movie.id)}
                  style={{ width: movieCardWidth }}
                />
              ))}
            </ScrollView>
          )}

          {/* Upcoming Movies */}
          <View style={[styles.sectionHeader, { marginTop: 24 }]}>
            <Text style={styles.sectionTitle}>Upcoming</Text>
            <TouchableOpacity><Text style={styles.seeAllText}>See All</Text></TouchableOpacity>
          </View>
          {loading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {[1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={[styles.skeletonCard, { width: movieCardWidth }]} />
              ))}
            </ScrollView>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {upcomingMovies.map((movie) => (
                <PortraitCard
                  key={movie.id}
                  title={movie.title}
                  image={getPosterUrl(movie.poster_path)}
                  onPress={() => onMoviePress?.(movie.id)}
                  style={{ width: movieCardWidth }}
                />
              ))}
            </ScrollView>
          )}

          {/* Action-Packed Thrills */}
          <View style={[styles.sectionHeader, { marginTop: 24 }]}>
            <Text style={styles.sectionTitle}>Action-Packed Thrills</Text>
            <TouchableOpacity><Text style={styles.seeAllText}>See All</Text></TouchableOpacity>
          </View>
          {loading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {[1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={[styles.skeletonCard, { width: movieCardWidth }]} />
              ))}
            </ScrollView>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {actionContent.map((item) => (
                <PortraitCard
                  key={item.id}
                  title={isTMDBMovie(item) ? item.title : item.name}
                  image={getPosterUrl(item.poster_path)}
                  onPress={() => isTMDBMovie(item) ? onMoviePress?.(item.id) : onTvPress?.(item.id)}
                  style={{ width: movieCardWidth }}
                />
              ))}
            </ScrollView>
          )}

          {/* Comedy Gold */}
          <View style={[styles.sectionHeader, { marginTop: 24 }]}>
            <Text style={styles.sectionTitle}>Comedy Gold</Text>
            <TouchableOpacity><Text style={styles.seeAllText}>See All</Text></TouchableOpacity>
          </View>
          {loading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {[1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={[styles.skeletonCard, { width: movieCardWidth }]} />
              ))}
            </ScrollView>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {comedyContent.map((item) => (
                <PortraitCard
                  key={item.id}
                  title={isTMDBMovie(item) ? item.title : item.name}
                  image={getPosterUrl(item.poster_path)}
                  onPress={() => isTMDBMovie(item) ? onMoviePress?.(item.id) : onTvPress?.(item.id)}
                  style={{ width: movieCardWidth }}
                />
              ))}
            </ScrollView>
          )}

          {/* Drama Excellence */}
          <View style={[styles.sectionHeader, { marginTop: 24 }]}>
            <Text style={styles.sectionTitle}>Drama Excellence</Text>
            <TouchableOpacity><Text style={styles.seeAllText}>See All</Text></TouchableOpacity>
          </View>
          {loading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {[1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={[styles.skeletonCard, { width: movieCardWidth }]} />
              ))}
            </ScrollView>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {dramaContent.map((item) => (
                <PortraitCard
                  key={item.id}
                  title={isTMDBMovie(item) ? item.title : item.name}
                  image={getPosterUrl(item.poster_path)}
                  onPress={() => isTMDBMovie(item) ? onMoviePress?.(item.id) : onTvPress?.(item.id)}
                  style={{ width: movieCardWidth }}
                />
              ))}
            </ScrollView>
          )}

          {/* Popular TV Shows */}
          <View style={[styles.sectionHeader, { marginTop: 24 }]}>
            <Text style={styles.sectionTitle}>Popular TV Shows</Text>
            <TouchableOpacity><Text style={styles.seeAllText}>See All</Text></TouchableOpacity>
          </View>
          {loading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {[1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={[styles.skeletonCard, { width: movieCardWidth }]} />
              ))}
            </ScrollView>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {popularTvShows.map((show) => (
                <PortraitCard
                  key={show.id}
                  title={show.name}
                  image={getPosterUrl(show.poster_path)}
                  onPress={() => onTvPress?.(show.id)}
                  style={{ width: movieCardWidth }}
                />
              ))}
            </ScrollView>
          )}

          {/* K-Dramas */}
          <View style={[styles.sectionHeader, { marginTop: 24 }]}>
            <Text style={styles.sectionTitle}>K-Dramas</Text>
            <TouchableOpacity><Text style={styles.seeAllText}>See All</Text></TouchableOpacity>
          </View>
          {loading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {[1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={[styles.skeletonCard, { width: movieCardWidth }]} />
              ))}
            </ScrollView>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
              {kDramas.map((show) => (
                <PortraitCard
                  key={show.id}
                  title={show.name}
                  image={getPosterUrl(show.poster_path)}
                  onPress={() => onTvPress?.(show.id)}
                  style={{ width: movieCardWidth }}
                />
              ))}
            </ScrollView>
          )}

        </View>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1121',
  },
  
  // Hero
  heroContainer: {
    width: width,
    height: width * 1.4, // Aspect ratio roughly 4:5 to 9:16
    maxHeight: 600,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  paginationDots: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotActive: {
    backgroundColor: '#9727e7',
    width: 24,
  },
  // Header
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100, // Ensure it sits on top
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 10, // Add bottom padding for better spacing
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#9727e7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    fontFamily: 'Manrope_800ExtraBold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    padding: 24,
    paddingBottom: 40,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  topTag: {
    backgroundColor: '#9727e7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  topTagText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  rankText: {
    color: '#d1d5db',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: '800',
    fontFamily: 'Manrope_800ExtraBold',
    color: 'white',
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  metaText: {
    color: '#d1d5db',
    fontSize: 14,
    fontWeight: '500',
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#6b7280',
  },
  qualityTag: {
    borderWidth: 1,
    borderColor: '#6b7280',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  qualityText: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  playButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#9727e7',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  playText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Manrope_700Bold',
  },
  myListButton: {
    flex: 1,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  myListText: {
    color: 'white', // Corrected from class="text-white" usually in tailwind
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Manrope_700Bold',
  },

  // Sections
  sectionsContainer: {
    marginTop: 10,
    paddingLeft: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Manrope_700Bold',
  },
  seeAllText: {
    color: '#9727e7',
    fontSize: 14,
    fontWeight: '600',
  },
  horizontalList: {
    paddingLeft: 0,
    paddingRight: 24,
    gap: 8,
  },
  skeletonCard: {
    height: 180,
    backgroundColor: '#2d2335',
    borderRadius: 12,
    marginRight: 16,
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
  
  // Filter Chips
  filterChips: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterChipActive: {
    backgroundColor: '#9727e7',
    borderColor: '#9727e7',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    fontFamily: 'Manrope_600SemiBold',
  },
  filterChipTextActive: {
    color: 'white',
  },
  
  // Dropdown Filter
  dropdownFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(151, 39, 231, 0.15)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(151, 39, 231, 0.3)',
  },
  dropdownFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9727e7',
    fontFamily: 'Manrope_600SemiBold',
  },
});
