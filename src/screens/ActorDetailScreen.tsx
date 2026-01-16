import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ImageBackground, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { PortraitCard } from '../components/MovieCard';
import { getPersonDetails, getPersonMovieCredits, getPersonTVCredits, getProfileUrl, getPosterUrl } from '../services/tmdb';
import { TMDBPersonDetails, TMDBMovieCredit, TMDBTVCredit } from '../types/tmdb';

const { width } = Dimensions.get('window');

interface ActorDetailScreenProps {
  actor?: {
    id: number;
    name?: string;
  };
  onBack: () => void;
  onMoviePress?: (movieId: number) => void;
  onTvPress?: (tvId: number) => void;
}

export default function ActorDetailScreen({ actor, onBack, onMoviePress, onTvPress }: ActorDetailScreenProps) {
  const [personDetails, setPersonDetails] = useState<TMDBPersonDetails | null>(null);
  const [movieCredits, setMovieCredits] = useState<TMDBMovieCredit[]>([]);
  const [tvCredits, setTvCredits] = useState<TMDBTVCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'movies' | 'tv'>('movies');

  const gridItemWidth = (width - 48 - 24) / 3;

  useEffect(() => {
    const fetchActorData = async () => {
      if (!actor?.id) return;
      
      try {
        setLoading(true);
        const [details, movies, tv] = await Promise.all([
          getPersonDetails(actor.id),
          getPersonMovieCredits(actor.id),
          getPersonTVCredits(actor.id),
        ]);
        
        setPersonDetails(details);
        // Sort by popularity and filter out items without posters
        setMovieCredits(
          movies.cast
            .filter(m => m.poster_path)
            .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
            .slice(0, 20)
        );
        setTvCredits(
          tv.cast
            .filter(t => t.poster_path)
            .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
            .slice(0, 20)
        );
      } catch (error) {
        console.error('Error fetching actor details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActorData();
  }, [actor?.id]);

  // Get known for department tags
  const getDepartmentTags = () => {
    if (!personDetails?.known_for_department) return ['ACTOR'];
    const dept = personDetails.known_for_department.toUpperCase();
    if (dept === 'ACTING') return ['ACTOR'];
    return [dept];
  };

  // Format birthday to age
  const calculateAge = (birthday: string | null) => {
    if (!birthday) return null;
    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#9727e7" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const age = calculateAge(personDetails?.birthday || null);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Fixed Header Buttons */}
      <View style={styles.fixedHeader}>
        <SafeAreaView edges={['top']} style={styles.headerButtonRow}>
          <TouchableOpacity style={styles.headerBtn} onPress={onBack}>
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn}>
            <MaterialIcons name="more-vert" size={24} color="white" />
          </TouchableOpacity>
        </SafeAreaView>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <ImageBackground
            source={{ uri: getProfileUrl(personDetails?.profile_path || null) }}
            style={styles.heroImage}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.2)', 'transparent', 'rgba(26,17,33,0.8)', '#1a1121']}
              locations={[0, 0.3, 0.7, 1]}
              style={styles.heroGradient}
            />
          </ImageBackground>

          {/* Bottom Info Overlay */}
          <View style={styles.heroInfo}>
            <View style={styles.dragHandle} />
            <Text style={styles.actorName}>{personDetails?.name || actor?.name}</Text>
            <View style={styles.tagsRow}>
              {getDepartmentTags().map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
              {personDetails?.place_of_birth && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{personDetails.place_of_birth.split(',').pop()?.trim()}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Bio Section */}
        <View style={styles.bioSection}>
          {personDetails?.biography ? (
            <Text style={styles.bioText} numberOfLines={4}>
              {personDetails.biography}
            </Text>
          ) : (
            <Text style={styles.bioText}>No biography available.</Text>
          )}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{movieCredits.length}</Text>
              <Text style={styles.statLabel}>MOVIES</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{tvCredits.length}</Text>
              <Text style={styles.statLabel}>TV SHOWS</Text>
            </View>
            {age && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{age}</Text>
                  <Text style={styles.statLabel}>AGE</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Filmography Section */}
        <View style={styles.filmographySection}>
          <View style={styles.filmographyHeader}>
            <Text style={styles.filmographyTitle}>Filmography</Text>
            <View style={styles.tabsContainer}>
              <TouchableOpacity 
                style={[styles.tabBtn, activeTab === 'movies' && styles.tabBtnActive]}
                onPress={() => setActiveTab('movies')}
              >
                <Text style={[styles.tabText, activeTab === 'movies' && styles.tabTextActive]}>Movies</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tabBtn, activeTab === 'tv' && styles.tabBtnActive]}
                onPress={() => setActiveTab('tv')}
              >
                <Text style={[styles.tabText, activeTab === 'tv' && styles.tabTextActive]}>TV</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.filmGrid}>
            {activeTab === 'movies' ? (
              movieCredits.map(movie => (
                <View key={`movie-${movie.id}-${movie.credit_id}`} style={[styles.filmGridItem, { width: gridItemWidth }]}>
                  <PortraitCard
                    title={movie.title}
                    image={getPosterUrl(movie.poster_path)}
                    rating={movie.vote_average?.toFixed(1)}
                    showRating={!!movie.vote_average && movie.vote_average > 0}
                    style={{ width: '100%', marginRight: 0 }}
                    onPress={() => {
                      console.log('Movie pressed:', movie.id, movie.title);
                      onMoviePress?.(movie.id);
                    }}
                  />
                </View>
              ))
            ) : (
              tvCredits.map(show => (
                <View key={`tv-${show.id}-${show.credit_id}`} style={[styles.filmGridItem, { width: gridItemWidth }]}>
                  <PortraitCard
                    title={show.name}
                    image={getPosterUrl(show.poster_path)}
                    rating={show.vote_average?.toFixed(1)}
                    showRating={!!show.vote_average && show.vote_average > 0}
                    style={{ width: '100%', marginRight: 0 }}
                    onPress={() => {
                      console.log('TV Show pressed:', show.id, show.name);
                      onTvPress?.(show.id);
                    }}
                  />
                </View>
              ))
            )}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1121',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Manrope_500Medium',
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    padding: 24,
  },
  headerButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(45, 36, 52, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Hero
  heroSection: {
    width: '100%',
    aspectRatio: 3/4,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  heroInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  dragHandle: {
    width: 48,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    marginBottom: 24,
  },
  actorName: {
    fontSize: 36,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
    fontFamily: 'Manrope_800ExtraBold',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#e5e7eb',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Bio
  bioSection: {
    paddingHorizontal: 24,
    marginTop: -8,
  },
  bioText: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 22,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Manrope_700Bold',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  // Filmography
  filmographySection: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  filmographyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  filmographyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Manrope_700Bold',
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tabBtnActive: {
    backgroundColor: '#9727e7',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
  },
  tabTextActive: {
    color: 'white',
  },
  filmGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  filmGridItem: {
    marginBottom: 4,
  },
});
