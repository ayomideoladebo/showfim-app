import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, ScrollView, Image, Dimensions, ActivityIndicator, Linking, Alert, BackHandler } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PortraitCard } from '../components/MovieCard';
import { getMovieDetails, getMovieCredits, getSimilarMovies, getBackdropUrl, getProfileUrl, getPosterUrl, getMovieVideos, getMovieTrailer, getYouTubeUrl } from '../services/tmdb';
import { TMDBMovieDetails, TMDBCredits, TMDBMovie, TMDBCastMember, TMDBVideo } from '../types/tmdb';
import { useMovieStreams } from '../hooks/useMovieStreams';
import { processExternalStreams } from '../utils/streamUtils';
import ShowfimPlayer from '../components/player/ShowfimPlayer';
import DownloadModal from '../components/DownloadModal';
import StreamLoadingModal from '../components/StreamLoadingModal';
import { useWatchlist } from '../hooks/useWatchlist';

const { width, height } = Dimensions.get('window');

interface MovieDetailsScreenProps {
  movieId?: number;
  onBack: () => void;
  onActorPress?: (actorId: number) => void;
  onMoviePress?: (movieId: number) => void;
}

export default function MovieDetailsScreen({ movieId, onBack, onActorPress, onMoviePress }: MovieDetailsScreenProps) {
  const [isPlayingTrailer, setIsPlayingTrailer] = useState(false);
  const [showDownloadSheet, setShowDownloadSheet] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState('1080p');
  
  // TMDB Data State
  const [movie, setMovie] = useState<TMDBMovieDetails | null>(null);
  const [credits, setCredits] = useState<TMDBCredits | null>(null);
  const [similarMovies, setSimilarMovies] = useState<TMDBMovie[]>([]);
  const [trailer, setTrailer] = useState<TMDBVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWaitingForStream, setIsWaitingForStream] = useState(false);

  // Streaming Data
  const { streams, loading: streamsLoading, hasFetched } = useMovieStreams(movieId || 0);

  // Process streams for player and download
  const processedSources = streams ? processExternalStreams(streams.externalStreams) : [];
  const subtitles = streams?.captions || [];

  // Watchlist
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const inWatchlist = movie ? isInWatchlist(movie.id, 'movie') : false;

  // Fetch movie data
  useEffect(() => {
    const fetchMovieData = async () => {
      if (!movieId) return;
      
      try {
        setLoading(true);
        const [movieData, creditsData, similar, videos] = await Promise.all([
          getMovieDetails(movieId),
          getMovieCredits(movieId),
          getSimilarMovies(movieId),
          getMovieVideos(movieId),
        ]);
        
        setMovie(movieData);
        setCredits(creditsData);
        setSimilarMovies(similar.slice(0, 10));
        setTrailer(getMovieTrailer(videos));
      } catch (err) {
        console.error('Error fetching movie details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieData();
  }, [movieId]);

  // Handle hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showPlayer) {
        setShowPlayer(false);
        return true; // Prevent default behavior
      }
      if (showDownloadSheet) {
        setShowDownloadSheet(false);
        return true;
      }
      onBack();
      return true;
    });
    return () => backHandler.remove();
  }, [showPlayer, showDownloadSheet, onBack]);

  // Handle trailer button press
  const handleTrailerPress = async () => {
    if (!trailer) {
      Alert.alert('No Trailer', 'Sorry, no trailer is available for this movie.');
      return;
    }

    const youtubeUrl = getYouTubeUrl(trailer.key);
    
    try {
      const canOpen = await Linking.canOpenURL(youtubeUrl);
      if (canOpen) {
        await Linking.openURL(youtubeUrl);
      } else {
        Alert.alert('Error', 'Unable to open YouTube.');
      }
    } catch (error) {
      console.error('Error opening trailer:', error);
      Alert.alert('Error', 'Failed to open the trailer.');
    }
  };

  // Helper functions
  const formatRuntime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
  };

  const RESOLUTIONS = [
    { id: '1080p', label: '1080p Full HD', desc: 'Ultra clarity', size: '2.4 GB', tag: 'BEST', icon: 'hd' },
    { id: '720p', label: '720p HD', desc: 'Standard clarity', size: '1.1 GB', tag: '', icon: 'sd' },
    { id: '480p', label: '480p SD', desc: 'Data saver', size: '500 MB', tag: '', icon: 'smartphone' },
    { id: '360p', label: '360p Low', desc: 'Minimum size', size: '250 MB', tag: '', icon: 'data-saver-off' },
  ];

  // Watch stream effect
  useEffect(() => {
    if (isWaitingForStream && !streamsLoading && hasFetched) {
      setIsWaitingForStream(false);
      
      const sources = processExternalStreams(streams?.externalStreams || []);
      if (sources.length > 0) {
        setShowPlayer(true);
      } else {
        // Fallback or error
        Alert.alert('No Sources', 'Sorry, no stream sources found for this movie yet.');
      }
    }
  }, [isWaitingForStream, streamsLoading, hasFetched, streams]);

  // Loading state
  if (loading || !movie) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#9727e7" />
        <Text style={{ color: 'white', marginTop: 16, fontFamily: 'Manrope_500Medium' }}>Loading...</Text>
      </View>
    );
  }

  // Derived data
  const cast = credits?.cast?.slice(0, 10) || [];
  const genres = movie.genres?.slice(0, 3) || [];
  const year = movie.release_date?.split('-')[0] || 'N/A';
  const rating = movie.vote_average?.toFixed(1) || 'N/A';

  const handleWatchNow = () => {
    // If we have streams already, play
    const sources = streams ? processExternalStreams(streams.externalStreams) : [];
    if (sources.length > 0) {
      setShowPlayer(true);
      return;
    }

    // If loading or not fetched, show waiting modal
    if (streamsLoading || !hasFetched) {
      setIsWaitingForStream(true);
    } else {
      // Fetched but empty
      Alert.alert('No Sources', 'Sorry, no stream sources found for this movie yet.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Loading Modal */}
      <StreamLoadingModal visible={isWaitingForStream} message="Finding best streams..." />

      {/* Standard Header (Hidden when playing trailer or player) */}
      {!isPlayingTrailer && !showPlayer && (
        <View style={styles.header}>
          <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
            <TouchableOpacity style={styles.iconButton} onPress={onBack}>
              <MaterialIcons name="arrow-back-ios-new" size={20} color="white" />
            </TouchableOpacity>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconButton}>
                <MaterialIcons name="ios-share" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconButton, { borderColor: '#9727e7' }]}>
                <MaterialIcons name="favorite" size={20} color="#9727e7" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      )}

      {/* Trailer Player (Visible only when playing) */}
      {isPlayingTrailer && (
        <View style={styles.trailerPlayer}>
          <ImageBackground
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYekA-Knq8ivBigQ1ouR8VZm_a8W6S3fDhXH82dV54eowszN_iO21YDG2NyXlgDvmy-9jnQ8uZh--PjLk8ilsHDI_GNx9hvmqXi0R49q3B43FYXfJsY74Ngab6XXUXTSwy6myOiBmXi_fsVqUlpxEigF3uHijYW3DdxNzkq17zEZOxYAwOw1c9SYOxqjA7Qvn3bYFANNaKRADmZZk8zgo6Z5JOttFJ1J62TSrTTvtipvr5SaSZ3g4s5HbuwWp4mvwVxCuW4oP0B5Tg' }}
            style={styles.trailerImage}
          >
             <View style={styles.trailerOverlay}>
               {/* Close Button */}
               <SafeAreaView edges={['top']} style={styles.trailerTopBar}>
                 <TouchableOpacity style={styles.closeButton} onPress={() => setIsPlayingTrailer(false)}>
                   <MaterialIcons name="close" size={24} color="white" />
                 </TouchableOpacity>
               </SafeAreaView>

               {/* Controls */}
               <View style={styles.trailerControls}>
                  <View style={styles.progressBar}>
                    <View style={styles.progressFill}>
                       <View style={styles.progressKnob} />
                    </View>
                  </View>
                  <View style={styles.controlsRow}>
                     <TouchableOpacity><MaterialIcons name="volume-up" size={24} color="rgba(255,255,255,0.9)" /></TouchableOpacity>
                     <TouchableOpacity><MaterialIcons name="fullscreen" size={24} color="rgba(255,255,255,0.9)" /></TouchableOpacity>
                  </View>
               </View>
             </View>
          </ImageBackground>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* HERO SECTION (Hidden when playing) */}
        {!isPlayingTrailer && (
          <View style={styles.heroContainer}>
            <ImageBackground
              source={{ uri: getBackdropUrl(movie.backdrop_path) }}
              style={styles.heroImage}
              resizeMode="cover"
            >
              <LinearGradient
                colors={['transparent', 'rgba(26, 17, 33, 0.3)', '#1a1121']}
                locations={[0, 0.5, 1]}
                style={StyleSheet.absoluteFillObject}
              />
              
              <View style={styles.heroContent}>
                <View style={styles.tagsRow}>
                  {genres.map((genre) => (
                    <View key={genre.id} style={styles.tag}>
                      <Text style={styles.tagText}>{genre.name.toUpperCase()}</Text>
                    </View>
                  ))}
                </View>
                
                <Text style={styles.title}>{movie.title}</Text>
                
                <View style={styles.metaRow}>
                  <View style={styles.ratingBox}>
                    <MaterialIcons name="star" size={16} color="#eab308" />
                    <Text style={styles.ratingText}>{rating}</Text>
                  </View>
                  <View style={styles.dot} />
                  <Text style={styles.metaText}>{year}</Text>
                  <View style={styles.dot} />
                  <Text style={styles.metaText}>{movie.runtime ? formatRuntime(movie.runtime) : 'N/A'}</Text>
                  {movie.adult === false && (
                    <View style={[styles.qualityTag, { marginLeft: 8 }]}>
                      <Text style={styles.qualityText}>PG-13</Text>
                    </View>
                  )}
                </View>

                <View style={styles.actionButtonsCol}>
                  <View style={styles.actionRow}>
                      <TouchableOpacity style={styles.watchNowBtn} onPress={handleWatchNow}>
                        <MaterialIcons name="play-arrow" size={24} color="white" />
                        <Text style={styles.watchNowText}>Watch Now</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.secondaryBtn} onPress={handleTrailerPress}>
                        <MaterialIcons name="movie" size={24} color="white" />
                        <Text style={styles.secondaryBtnText}>{trailer ? 'Trailer' : 'No Trailer'}</Text>
                      </TouchableOpacity>
                  </View>
                  <View style={styles.actionRow}>
                    <TouchableOpacity 
                      style={[styles.tertiaryBtn, inWatchlist && { borderColor: '#9727e7' }]}
                      onPress={() => {
                        if (!movie) return;
                        if (inWatchlist) {
                          removeFromWatchlist(movie.id, 'movie');
                        } else {
                          addToWatchlist({
                            id: movie.id,
                            type: 'movie',
                            title: movie.title,
                            posterPath: movie.poster_path || '',
                            backdropPath: movie.backdrop_path || '',
                            voteAverage: movie.vote_average,
                          });
                        }
                      }}
                    >
                        <MaterialIcons name={inWatchlist ? "check" : "add"} size={24} color={inWatchlist ? "#9727e7" : "white"} />
                        <Text style={[styles.tertiaryBtnText, inWatchlist && { color: '#9727e7' }]}>
                          {inWatchlist ? 'In Watchlist' : 'Watch Later'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.tertiaryBtn} onPress={() => setShowDownloadSheet(true)}>
                        <MaterialIcons name="download" size={24} color="white" />
                        <Text style={styles.tertiaryBtnText}>Download</Text>
                    </TouchableOpacity>
                  </View>
                </View>

              </View>
            </ImageBackground>
          </View>
        )}

        {/* DETAILS SECTION */}
        <View 
          style={[
            styles.detailsContainer, 
            isPlayingTrailer && styles.dimmedDetails // Apply dimming style
          ]}
          pointerEvents={isPlayingTrailer ? 'none' : 'auto'} // Disable interaction when trailer plays
        >
          
          {/* Storyline */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Storyline</Text>
            <Text style={styles.storylineText}>
              {movie.overview || 'No description available.'} <Text style={{ color: '#9727e7', fontWeight: 'bold' }}>Read More</Text>
            </Text>
          </View>

          {/* Cast */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
               <Text style={styles.sectionTitle}>Cast & Crew</Text>
               <TouchableOpacity><Text style={styles.seeAllText}>View All</Text></TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.castList}>
              {cast.map((actor: TMDBCastMember) => (
                <TouchableOpacity 
                  key={actor.id} 
                  style={styles.castItem}
                  onPress={() => onActorPress?.(actor.id)}
                  activeOpacity={0.7}
                >
                   <View style={styles.castImageWrapper}>
                      <Image source={{ uri: getProfileUrl(actor.profile_path) }} style={styles.castImage} />
                   </View>
                   <Text style={styles.castName} numberOfLines={1}>{actor.name}</Text>
                   <Text style={styles.castRole} numberOfLines={1}>{actor.character}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* More Like This */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>More Like This</Text>
            <View style={styles.grid}>
              {similarMovies.map((item: TMDBMovie) => (
                <View key={item.id} style={styles.gridItemWrapper}>
                   <PortraitCard
                      title={item.title}
                      image={getPosterUrl(item.poster_path)}
                      rating={item.vote_average?.toFixed(1)}
                      showRating={true}
                      style={{ width: '100%', marginRight: 0 }}
                      onPress={() => onMoviePress?.(item.id)}
                   />
                </View>
              ))}
            </View>
          </View>

          <View style={{ height: 40 }} />
        </View>

      </ScrollView>

      {/* Download Modal */}
      <DownloadModal
        visible={showDownloadSheet}
        onClose={() => setShowDownloadSheet(false)}
        sources={processedSources}
        subtitles={subtitles}
        title={movie?.title || 'Movie'}
        posterUrl={movie?.poster_path ? getPosterUrl(movie.poster_path) : ''}
        loading={streamsLoading}
      />

      {/* Video Player Modal */}
      {showPlayer && (
        <View style={StyleSheet.absoluteFillObject}>
          <ShowfimPlayer
            sources={processedSources}
            subtitles={subtitles}
            title={movie?.title || 'Movie'}
            contentId={`movie-${movieId}`}
            poster={movie?.backdrop_path ? getBackdropUrl(movie.backdrop_path) : undefined}
            autoPlay={true}
            onClose={() => setShowPlayer(false)}
          />
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1121', // background-dark
  },
  scrollContent: {
    paddingBottom: 40,
  },
  // Header
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  headerSafeArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  // Hero
  heroContainer: {
    width: width,
    height: height * 0.55,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tagText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 36, // ~4xl
    fontWeight: '800',
    fontFamily: 'Manrope_800ExtraBold',
    color: 'white',
    marginBottom: 8,
    lineHeight: 40,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    color: '#eab308',
    fontWeight: 'bold',
    fontSize: 14,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#6b7280',
    marginHorizontal: 12,
  },
  metaText: {
    color: '#d1d5db',
    fontSize: 14,
    fontWeight: '500',
  },
  qualityTag: {
    borderWidth: 1,
    borderColor: '#6b7280',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  qualityText: {
    color: '#9ca3af',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  
  // Actions
  actionButtonsCol: {
    gap: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  watchNowBtn: {
    flex: 1,
    height: 56,
    backgroundColor: '#9727e7',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#9727e7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  watchNowText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Manrope_700Bold',
  },
  secondaryBtn: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Manrope_700Bold',
  },
  tertiaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tertiaryBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
  },

  // Details
  detailsContainer: {
    paddingHorizontal: 20,
    marginTop: -4, // pull up slightly
    gap: 32,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontFamily: 'Manrope_600SemiBold',
  },
  storylineText: {
    color: '#9ca3af', // gray-400
    fontSize: 15,
    lineHeight: 24,
    fontFamily: 'Manrope_400Regular',
  },
  
  // Cast
  castList: {
    gap: 16,
    paddingRight: 20,
  },
  castItem: {
    alignItems: 'center',
    minWidth: 80,
    gap: 8,
  },
  castImageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#251b2e',
  },
  castImage: {
    width: '100%',
    height: '100%',
  },
  castName: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  castRole: {
    color: '#6b7280',
    fontSize: 10,
    textAlign: 'center',
  },

  // More Like This
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItemWrapper: {
    width: (width - 40 - 24) / 3, // 3 cols, padding 20*2=40, gap 12*2=24
  },
  
  // Trailer Player
  trailerPlayer: {
    width: width,
    aspectRatio: 16/9,
    backgroundColor: 'black',
    zIndex: 100,
    elevation: 10,
    shadowColor: 'black',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 10 },
  },
  trailerImage: {
    width: '100%',
    height: '100%',
  },
  trailerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'space-between',
  },
  trailerTopBar: {
    alignItems: 'flex-end',
    padding: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  trailerControls: {
    padding: 16,
    paddingTop: 40,
    backgroundColor: 'transparent', 
    // Gradient simulated by simple transparency or container styles if linear-gradient was used here
    // For now simple padding + semi-transparent prop if needed
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressFill: {
    width: '40%', // Mock progress
    height: '100%',
    backgroundColor: '#9727e7',
    position: 'relative',
  },
  progressKnob: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'white',
    position: 'absolute',
    right: -6,
    top: -4,
    shadowColor: 'black',
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  
  // Dimmed State
  dimmedDetails: {
    opacity: 0.3,
    paddingTop: 24, // Add padding when replacing Hero
  },

  // Bottom Sheet
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 200,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#241a2e', // surface-dark
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    zIndex: 201,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    elevation: 20,
    shadowColor: 'black',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    maxHeight: height * 0.7,
  },
  sheetHandleWrapper: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  sheetHandle: {
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  sheetTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Manrope_700Bold',
  },
  sheetCloseBtn: {
    padding: 4,
  },
  resolutionList: {
    paddingHorizontal: 24,
  },
  resolutionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 12,
  },
  resolutionOptionSelected: {
    borderColor: '#9727e7',
    backgroundColor: 'rgba(151, 39, 231, 0.1)',
  },
  resolutionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#9727e7',
    backgroundColor: '#9727e7',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  resolutionInfo: {
    gap: 4,
  },
  resolutionLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Manrope_700Bold',
  },
  resolutionDesc: {
    color: '#ad9db8', // text-secondary
    fontSize: 12,
    fontFamily: 'Manrope_500Medium',
  },
  resTag: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  resTagText: {
    color: '#ad9db8',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  disclaimer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  disclaimerText: {
    flex: 1,
    color: '#ad9db8',
    fontSize: 12,
    lineHeight: 16,
  },
  sheetFooter: {
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  downloadConfirmBtn: {
    backgroundColor: '#9727e7',
    height: 64,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#9727e7',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  downloadConfirmText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Manrope_700Bold',
  },
});
