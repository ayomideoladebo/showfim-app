
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, ScrollView, Image, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTVDetails, getTVCredits, getTVSeasonDetails, getBackdropUrl, getProfileUrl, getStillUrl } from '../services/tmdb';
import { TMDBTVDetails, TMDBCredits, TMDBSeasonDetails, TMDBEpisode, TMDBCastMember } from '../types/tmdb';
import { useTVShowStreams } from '../hooks/useTVShowStreams';
import { processExternalStreams } from '../utils/streamUtils';
import ShowfimPlayer from '../components/player/ShowfimPlayer';
import DownloadModal from '../components/DownloadModal';
import StreamLoadingModal from '../components/StreamLoadingModal';

const { width } = Dimensions.get('window');

interface TvDetailsScreenProps {
  tvId?: number;
  onBack: () => void;
  onActorPress?: (actorId: number) => void;
}

export default function TvDetailsScreen({ tvId, onBack, onActorPress }: TvDetailsScreenProps) {
  // State
  const [tvShow, setTvShow] = useState<TMDBTVDetails | null>(null);
  const [credits, setCredits] = useState<TMDBCredits | null>(null);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [seasonDetails, setSeasonDetails] = useState<TMDBSeasonDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [seasonLoading, setSeasonLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState<'seasons' | 'extras'>('seasons');
  
  // Streaming state
  const [showPlayer, setShowPlayer] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [isWaitingForStream, setIsWaitingForStream] = useState(false);
  const [playingEpisode, setPlayingEpisode] = useState<{ season: number; episode: number } | null>(null);
  
  // Streaming data (only fetch when episode is selected for playback)
  const { streams, loading: streamsLoading, hasFetched } = useTVShowStreams(
    tvId || 0, 
    playingEpisode?.season || 1, 
    playingEpisode?.episode || 1
  );
  const processedSources = streams ? processExternalStreams(streams.externalStreams) : [];
  const subtitles = streams?.captions || [];

  // Fetch TV show data
  useEffect(() => {
    const fetchTVData = async () => {
      if (!tvId) return;
      
      try {
        setLoading(true);
        const [tvData, creditsData] = await Promise.all([
          getTVDetails(tvId),
          getTVCredits(tvId),
        ]);
        
        setTvShow(tvData);
        setCredits(creditsData);
        
        // Fetch first season by default
        if (tvData.seasons && tvData.seasons.length > 0) {
          const firstSeasonNumber = tvData.seasons.find(s => s.season_number > 0)?.season_number || 1;
          setSelectedSeason(firstSeasonNumber);
          const season = await getTVSeasonDetails(tvId, firstSeasonNumber);
          setSeasonDetails(season);
        }
      } catch (err) {
        console.error('Error fetching TV details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTVData();
  }, [tvId]);

  // Fetch season details when season changes
  useEffect(() => {
    const fetchSeason = async () => {
      if (!tvId || loading) return;
      
      try {
        setSeasonLoading(true);
        const season = await getTVSeasonDetails(tvId, selectedSeason);
        setSeasonDetails(season);
      } catch (err) {
        console.error('Error fetching season:', err);
      } finally {
        setSeasonLoading(false);
      }
    };

    fetchSeason();
  }, [tvId, selectedSeason, loading]);

  // Helper functions
  const formatRuntime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
  };

  // Loading state
  if (loading || !tvShow) {
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
  const genres = tvShow.genres?.slice(0, 3) || [];
  const year = tvShow.first_air_date?.split('-')[0] || 'N/A';
  const rating = tvShow.vote_average?.toFixed(1) || 'N/A';
  const totalSeasons = tvShow.number_of_seasons || 1;
  const episodes = seasonDetails?.episodes || [];

  // Get seasons for tabs (exclude season 0 which is specials)
  const seasons = tvShow.seasons?.filter(s => s.season_number > 0) || [];

  // Watch stream effect
  useEffect(() => {
    if (isWaitingForStream && !streamsLoading && playingEpisode) {
      if (streams?.externalStreams && streams.externalStreams.length > 0) {
        setIsWaitingForStream(false);
        setShowPlayer(true);
      } else if (hasFetched) {
        setIsWaitingForStream(false);
        setPlayingEpisode(null); // Reset selection
        Alert.alert('No Sources', 'Sorry, no stream sources found for this episode yet.');
      }
    }
  }, [isWaitingForStream, streamsLoading, hasFetched, streams, playingEpisode]);

  // Handle episode play
  const handlePlayEpisode = (episode: TMDBEpisode) => {
    // If playing same episode and data ready
    if (playingEpisode?.season === selectedSeason && playingEpisode?.episode === episode.episode_number && streams?.externalStreams?.length > 0) {
      setShowPlayer(true);
      return;
    }

    setPlayingEpisode({ season: selectedSeason, episode: episode.episode_number });
    // If already has streams or just switching, might need to wait? 
    // Actually the hook updates when playingEpisode changes.
    // So we should always wait for the hook to respond
    setIsWaitingForStream(true);
  };

  // Handle episode download
  const handleDownloadEpisode = (episode: TMDBEpisode) => {
    setPlayingEpisode({ season: selectedSeason, episode: episode.episode_number });
    setShowDownloadModal(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Loading Modal */}
      <StreamLoadingModal visible={isWaitingForStream} message="Finding episode streams..." />
      
      {/* Fixed Header */}
      {!showPlayer && (
        <View style={styles.header}>
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          <TouchableOpacity style={styles.iconButton} onPress={onBack}>
            <MaterialIcons name="arrow-back-ios-new" size={20} color="white" />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton}>
              <MaterialIcons name="cast" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.iconButton, isFavorite && { borderColor: '#9727e7' }]}
              onPress={() => setIsFavorite(!isFavorite)}
            >
              <MaterialIcons 
                name={isFavorite ? "favorite" : "favorite-border"} 
                size={20} 
                color={isFavorite ? "#9727e7" : "white"} 
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* HERO SECTION */}
        <View style={styles.heroContainer}>
          <ImageBackground
            source={{ uri: getBackdropUrl(tvShow.backdrop_path) }}
            style={styles.heroImage}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['transparent', 'rgba(26, 17, 33, 0.3)', '#1a1121']}
              locations={[0, 0.5, 1]}
              style={StyleSheet.absoluteFillObject}
            />
            
            <View style={styles.heroContent}>
              {/* Genre Tags */}
              <View style={styles.tagsRow}>
                {genres.map((genre) => (
                  <View key={genre.id} style={styles.tag}>
                    <Text style={styles.tagText}>{genre.name.toUpperCase()}</Text>
                  </View>
                ))}
              </View>
              
              {/* Title */}
              <Text style={styles.title}>{tvShow.name}</Text>
              
              {/* Meta Info */}
              <View style={styles.metaRow}>
                <View style={styles.ratingBox}>
                  <MaterialIcons name="star" size={16} color="#eab308" />
                  <Text style={styles.ratingText}>{rating}</Text>
                </View>
                <View style={styles.dot} />
                <Text style={styles.metaText}>{year}</Text>
                <View style={styles.dot} />
                <Text style={styles.metaText}>{totalSeasons} Season{totalSeasons > 1 ? 's' : ''}</Text>
                <View style={[styles.qualityTag, { marginLeft: 8 }]}>
                  <Text style={styles.qualityText}>TV-MA</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.watchButton}>
                  <MaterialIcons name="play-arrow" size={24} color="white" />
                  <Text style={styles.watchButtonText}>Watch S{selectedSeason} E1</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.trailerButton}>
                  <Text style={styles.trailerButtonText}>Trailer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ImageBackground>
        </View>

        {/* CONTENT SECTION */}
        <View style={styles.contentContainer}>
          
          {/* Tabs: Seasons + Extras */}
          <View style={styles.seasonTabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.seasonTabs}>
              {seasons.map((season) => (
                <TouchableOpacity
                  key={season.id}
                  style={[
                    styles.seasonTab,
                    activeTab === 'seasons' && selectedSeason === season.season_number && styles.seasonTabActive,
                  ]}
                  onPress={() => {
                    setActiveTab('seasons');
                    setSelectedSeason(season.season_number);
                  }}
                >
                  <Text style={[
                    styles.seasonTabText,
                    activeTab === 'seasons' && selectedSeason === season.season_number && styles.seasonTabTextActive,
                  ]}>
                    Season {season.season_number}
                  </Text>
                  {activeTab === 'seasons' && selectedSeason === season.season_number && (
                    <View style={styles.seasonTabIndicator} />
                  )}
                </TouchableOpacity>
              ))}
              <TouchableOpacity 
                style={[styles.seasonTab, activeTab === 'extras' && styles.seasonTabActive]}
                onPress={() => setActiveTab('extras')}
              >
                <Text style={[styles.seasonTabText, activeTab === 'extras' && styles.seasonTabTextActive]}>Extras</Text>
                {activeTab === 'extras' && <View style={styles.seasonTabIndicator} />}
              </TouchableOpacity>
            </ScrollView>
          </View>

          {activeTab === 'seasons' ? (
            <>
              {/* Download All Button */}
              <TouchableOpacity style={styles.downloadAllButton}>
                <MaterialIcons name="download" size={20} color="#9727e7" />
                <Text style={styles.downloadAllText}>Download All</Text>
              </TouchableOpacity>

              {/* Episodes List */}
              <View style={styles.episodesList}>
                {seasonLoading ? (
                  <View style={{ padding: 40, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#9727e7" />
                  </View>
                ) : (
                  episodes.map((episode: TMDBEpisode) => (
                    <TouchableOpacity key={episode.id} style={styles.episodeItem}>
                      {/* Episode Thumbnail */}
                      <View style={styles.episodeThumbnail}>
                        <Image
                          source={{ uri: getStillUrl(episode.still_path) }}
                          style={styles.episodeImage}
                          resizeMode="cover"
                        />
                        <View style={styles.episodeDuration}>
                          <Text style={styles.durationText}>
                            {episode.runtime ? formatRuntime(episode.runtime) : '—'}
                          </Text>
                        </View>
                        <View style={styles.playOverlay}>
                          <View style={styles.playButton}>
                            <MaterialIcons name="play-arrow" size={18} color="white" />
                          </View>
                        </View>
                      </View>
                      
                      {/* Episode Info */}
                      <View style={styles.episodeInfo}>
                        <View style={styles.episodeHeader}>
                          <Text style={styles.episodeTitle} numberOfLines={2}>
                            {episode.episode_number}. {episode.name}
                          </Text>
                        </View>
                        <View style={styles.episodeActions}>
                          <TouchableOpacity 
                            style={styles.episodePlayButton}
                            onPress={() => handlePlayEpisode(episode)}
                          >
                            <MaterialIcons name="play-arrow" size={24} color="white" />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.episodeDownloadButton}
                            onPress={() => handleDownloadEpisode(episode)}
                          >
                            <MaterialIcons name="download" size={20} color="#9ca3af" />
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.episodeDescription} numberOfLines={3}>
                          {episode.overview || 'No description available.'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </>
          ) : (
            /* EXTRAS TAB CONTENT */
            <View style={styles.extrasContainer}>
              {/* Description */}
              <View style={styles.extrasSection}>
                <Text style={styles.extrasSectionTitle}>About</Text>
                <Text style={styles.extrasDescription}>
                  {tvShow.overview || 'No description available.'}
                </Text>
              </View>

              {/* Cast Section */}
              <View style={styles.extrasSection}>
                <Text style={styles.extrasSectionTitle}>Cast</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.castList}>
                  {cast.map((actor: TMDBCastMember) => (
                    <TouchableOpacity 
                      key={actor.id} 
                      style={styles.castItem}
                      onPress={() => onActorPress?.(actor.id)}
                    >
                      <Image
                        source={{ uri: getProfileUrl(actor.profile_path) }}
                        style={styles.castImage}
                      />
                      <Text style={styles.castName} numberOfLines={1}>{actor.name}</Text>
                      <Text style={styles.castCharacter} numberOfLines={1}>{actor.character}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Show Info */}
              <View style={styles.extrasSection}>
                <Text style={styles.extrasSectionTitle}>Details</Text>
                <View style={styles.detailsGrid}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <Text style={styles.detailValue}>{tvShow.status || 'Unknown'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>First Aired</Text>
                    <Text style={styles.detailValue}>{tvShow.first_air_date || 'Unknown'}</Text>
                  </View>
                  {tvShow.last_air_date && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Last Aired</Text>
                      <Text style={styles.detailValue}>{tvShow.last_air_date}</Text>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Total Episodes</Text>
                    <Text style={styles.detailValue}>{tvShow.number_of_episodes || 'Unknown'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Episode Runtime</Text>
                    <Text style={styles.detailValue}>
                      {tvShow.episode_run_time?.[0] ? `${tvShow.episode_run_time[0]} min` : 'Varies'}
                    </Text>
                  </View>
                  {tvShow.networks && tvShow.networks.length > 0 && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Network</Text>
                      <Text style={styles.detailValue}>
                        {tvShow.networks.map(n => n.name).join(', ')}
                      </Text>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Original Language</Text>
                    <Text style={styles.detailValue}>{tvShow.original_language?.toUpperCase() || 'Unknown'}</Text>
                  </View>
                </View>
              </View>

              {/* Genres */}
              <View style={styles.extrasSection}>
                <Text style={styles.extrasSectionTitle}>Genres</Text>
                <View style={styles.genresList}>
                  {tvShow.genres?.map((genre) => (
                    <View key={genre.id} style={styles.genreTag}>
                      <Text style={styles.genreTagText}>{genre.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </View>

      </ScrollView>
      {/* Download Modal */}
      <DownloadModal
        visible={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        sources={processedSources}
        subtitles={subtitles}
        title={tvShow?.name || 'Episode'}
        posterUrl={tvShow?.poster_path ? getPosterUrl(tvShow.poster_path) : ''}
        loading={streamsLoading}
      />

      {/* Video Player Modal */}
      {showPlayer && (
        <View style={StyleSheet.absoluteFillObject}>
          <ShowfimPlayer
            sources={processedSources}
            subtitles={subtitles}
            title={`${tvShow?.name} - S${playingEpisode?.season} E${playingEpisode?.episode}`}
            contentId={`tv-${tvId}-${playingEpisode?.season}-${playingEpisode?.episode}`}
            poster={tvShow?.backdrop_path ? getBackdropUrl(tvShow.backdrop_path) : undefined}
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
    backgroundColor: '#1a1121',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerSafeArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  heroContainer: {
    width: width,
    height: width * 1.4,
    maxHeight: 550,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
    fontFamily: 'Manrope_700Bold',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: 'white',
    marginBottom: 12,
    fontFamily: 'Manrope_800ExtraBold',
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
    fontSize: 14,
    fontWeight: '700',
    color: '#eab308',
    fontFamily: 'Manrope_700Bold',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#6b7280',
    marginHorizontal: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#d1d5db',
    fontFamily: 'Manrope_500Medium',
  },
  qualityTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#6b7280',
    borderRadius: 4,
  },
  qualityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9ca3af',
    letterSpacing: 0.5,
    fontFamily: 'Manrope_700Bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  watchButton: {
    flex: 2,
    height: 48,
    backgroundColor: '#9727e7',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  watchButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'Manrope_700Bold',
  },
  trailerButton: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trailerButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'Manrope_700Bold',
  },
  contentContainer: {
    backgroundColor: '#1a1121',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  seasonTabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 24,
  },
  seasonTabs: {
    gap: 32,
  },
  seasonTab: {
    paddingBottom: 12,
    position: 'relative',
  },
  seasonTabActive: {},
  seasonTabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
    fontFamily: 'Manrope_500Medium',
  },
  seasonTabTextActive: {
    color: 'white',
    fontWeight: '700',
  },
  seasonTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#9727e7',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  downloadAllButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(151, 39, 231, 0.5)',
    borderRadius: 12,
    marginBottom: 24,
  },
  downloadAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9727e7',
    fontFamily: 'Manrope_700Bold',
  },
  episodesList: {
    gap: 24,
  },
  episodeItem: {
    flexDirection: 'row',
    gap: 16,
  },
  episodeThumbnail: {
    width: 144,
    aspectRatio: 16 / 9,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#251b2e',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    position: 'relative',
  },
  episodeImage: {
    width: '100%',
    height: '100%',
  },
  episodeDuration: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 4,
  },
  durationText: {
    fontSize: 10,
    fontWeight: '500',
    color: 'white',
    fontFamily: 'Manrope_500Medium',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  episodeInfo: {
    flex: 1,
    paddingVertical: 2,
  },
  episodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  episodeTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
    lineHeight: 20,
    fontFamily: 'Manrope_700Bold',
  },
  downloadButton: {
    padding: 4,
    marginLeft: 8,
    marginTop: -4,
    marginRight: -4,
  },
  episodeDescription: {
    fontSize: 12,
    color: '#9ca3af',
    lineHeight: 18,
    fontFamily: 'Manrope_400Regular',
  },
  
  // Extras Tab Styles
  extrasContainer: {
    gap: 24,
  },
  extrasSection: {
    gap: 12,
  },
  extrasSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    fontFamily: 'Manrope_700Bold',
  },
  extrasDescription: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 22,
    fontFamily: 'Manrope_400Regular',
  },
  castList: {
    gap: 16,
    paddingRight: 20,
  },
  castItem: {
    width: 80,
    alignItems: 'center',
    gap: 6,
  },
  castImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#251b2e',
    borderWidth: 2,
    borderColor: 'rgba(151, 39, 231, 0.3)',
  },
  castName: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    fontFamily: 'Manrope_600SemiBold',
  },
  castCharacter: {
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'center',
    fontFamily: 'Manrope_400Regular',
  },
  detailsGrid: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#9ca3af',
    fontFamily: 'Manrope_500Medium',
  },
  detailValue: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  genresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  episodeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  episodePlayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#9727e7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  episodeDownloadButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  genreTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(151, 39, 231, 0.15)',
    borderRadius: 20,
    borderColor: 'rgba(151, 39, 231, 0.3)',
  },
  genreTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9727e7',
    fontFamily: 'Manrope_600SemiBold',
  },
});
