import React, { memo } from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Image, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// ----------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------

interface BaseCardProps {
  title: string;
  image: string;
  onPress?: () => void;
}

interface ContinueWatchingCardProps extends BaseCardProps {
  timeLeft: string;
  progress: number; // 0 to 1
}

interface PortraitCardProps extends BaseCardProps {
  rank?: number;
  rating?: string;
  year?: string;
  showRating?: boolean;
  style?: any;
}

// ----------------------------------------------------------------------
// COMPONENTS
// ----------------------------------------------------------------------

export const ContinueWatchingCard = ({ title, image, timeLeft, progress, onPress }: ContinueWatchingCardProps) => {
  return (
    <TouchableOpacity style={styles.continueCard} onPress={onPress} activeOpacity={0.8}>
      <ImageBackground 
        source={{ uri: image }} 
        style={styles.continueImage} 
        imageStyle={{ borderRadius: 8 }}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.playOverlay}>
          <View style={styles.miniPlayBtn}>
            <MaterialIcons name="play-arrow" size={20} color="white" />
          </View>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${Math.min(Math.max(progress, 0), 1) * 100}%` }]} />
        </View>
      </ImageBackground>
      <View style={styles.textGroup}>
        <Text style={styles.cardTitle} numberOfLines={1}>{title || ''}</Text>
        <Text style={styles.cardSubtitle}>{timeLeft || ''}</Text>
      </View>
    </TouchableOpacity>
  );
};

export const PortraitCard = memo(({ title, image, rank, rating, year, showRating, style, onPress }: PortraitCardProps) => {
  return (
    <TouchableOpacity style={[styles.portraitCard, style]} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.portraitImageWrapper}>
        <Image source={{ uri: image }} style={styles.portraitImage} />
        {rank && (
          <View style={styles.rankBadge}>
            <Text style={styles.rankBadgeText}>{rank}</Text>
          </View>
        )}
      </View>
      <View style={styles.textGroup}>
        <Text style={styles.cardTitle} numberOfLines={1}>{title || ''}</Text>
        {(showRating && rating) && (
          <View style={styles.ratingContainer}>
             <MaterialIcons name="star" size={12} color="#9727e7" />
             <Text style={styles.ratingText}>{rating}</Text>
             {year && (
                <>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.ratingText}>{year}</Text>
                </>
             )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

// ----------------------------------------------------------------------
// STYLES
// ----------------------------------------------------------------------

const styles = StyleSheet.create({
  // Shared
  cardTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Manrope_700Bold',
    marginTop: 4,
  },
  cardSubtitle: {
    color: '#9ca3af', // gray-400
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'Manrope_500Medium',
  },

  // Continue Watching
  continueCard: {
    width: width * 0.4, // ~160px
    marginRight: 16,
  },
  continueImage: {
    width: '100%',
    aspectRatio: 16/9,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: '#333',
  },
  playOverlay: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  miniPlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(151, 39, 231, 0.9)', // primary
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'black',
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#9727e7',
  },
  textGroup: {
    marginTop: 6,
  },

  // Portrait
  portraitCard: {
    width: width * 0.28,
    marginRight: 12,
  },
  portraitImageWrapper: {
    position: 'relative',
    width: '100%',
    aspectRatio: 2/3,
    borderRadius: 12,
    backgroundColor: '#333',
    overflow: 'hidden',
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  portraitImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  rankBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(151, 39, 231, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  rankBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Manrope_800ExtraBold',
  },
  
  // Rating Style
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    color: '#9ca3af',
    fontSize: 10,
    fontFamily: 'Manrope_500Medium',
  },
  metaDot: {
    color: '#6b7280',
    fontSize: 10,
  },
});
