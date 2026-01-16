import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Dimensions, Platform, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState, useRef } from 'react';

const { width, height } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
}

const SLIDES = [
  {
    id: '1',
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDhX-s5WRnD9nkOD09SlDj9GXx-H-3ezcCpHDDeDbQuTKxMIwx0TGbsEj5_e3jdINgAWeZoSxaGEbAWM7gsOg6YqipmHTHlH-pQHn0dlm0jYjNJf-ytA_ElOQhDcsgMOtrf1qo5WrXdy5Ig8h-trhCToLHBN8YELbmIVb1Uw7yB0LfDyw4tXsqX6j8mREQwpEd1DzIhHxg5EoVMVMtQ8nBg2ojIKTE_yVR5G6PUk7v_FFgRVDlfC3iyEu7acYBp-mKMEYsXeXX2ZrhR",
    headlineLine1: "Unlimited",
    headlineHighlight: "Streaming",
    body: "Dive into a universe of cinema. Watch your favorites anytime, anywhere.",
  },
  {
    id: '2',
    image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2525&auto=format&fit=crop", // Movie theater/cinema seating
    headlineLine1: "Watch",
    headlineHighlight: "Offline",
    body: "Going somewhere? Download your favorite movies and shows to watch without internet.",
  },
  {
    id: '3',
    image: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2670&auto=format&fit=crop", // Cinematic/Neon/Sci-fi vibe
    headlineLine1: "2K Ultra",
    headlineHighlight: "HD Quality",
    body: "Experience cinema-quality streaming with crystal clear visuals and immersive sound.",
  },
];

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    setCurrentIndex(roundIndex);
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      onComplete();
    }
  };

  const RenderItem = ({ item }: { item: typeof SLIDES[0] }) => (
    <View style={{ width, height }}>
      <ImageBackground
        source={{ uri: item.image }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={[
            '#1a1121', 
            'rgba(26, 17, 33, 0.2)', 
            'rgba(26, 17, 33, 0.4)', 
            'rgba(26, 17, 33, 0.8)',
            '#1a1121', 
            '#1a1121'
          ]}
          locations={[0, 0.2, 0.4, 0.5, 0.75, 1]}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
          style={styles.gradientOverlay}
        />
        
        <View style={styles.contentContainer}>
          <Text style={styles.headline}>
            {item.headlineLine1}{'\n'}
            <Text style={styles.headlineHighlight}>{item.headlineHighlight}</Text>
          </Text>

          <Text style={styles.bodyText}>
            {item.body}
          </Text>
        </View>
      </ImageBackground>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Background & Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={({ item }) => <RenderItem item={item} />}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id}
        bounces={false}
        style={{ flex: 1 }}
      />

      {/* Overlay UI (skip, indicators, next button) */}
      <View style={styles.overlayContainer} pointerEvents="box-none">
        
        {/* Top Bar: Skip */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onComplete} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom UI */}
        <View style={styles.bottomControls}>
          {/* Indicators */}
          <View style={styles.indicators}>
            {SLIDES.map((_, index) => (
              <View 
                key={index} 
                style={[
                  styles.indicatorDot, 
                  currentIndex === index && styles.indicatorActive
                ]} 
              />
            ))}
          </View>

          {/* Primary CTA */}
          <TouchableOpacity 
            style={styles.ctaButton}
            onPress={handleNext}
            activeOpacity={0.9}
          >
            <Text style={styles.ctaText}>
              {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            <MaterialIcons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1121',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  contentContainer: { // Centers text within the slide area
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 180, // Space for bottom controls
    paddingHorizontal: 24,
  },
  overlayContainer: { // UI sitting on top of the list
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: Platform.OS === 'android' ? 60 : 60,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  topBar: {
    width: '100%',
    alignItems: 'flex-end',
  },
  skipButton: {
    backgroundColor: 'rgba(26, 17, 33, 0.3)',
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  skipText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    letterSpacing: 0.5,
  },
  bottomControls: { // Wrapper for indicators and button
    width: '100%',
    alignItems: 'center',
  },
  headline: {
    color: '#fff',
    fontSize: 40,
    fontFamily: 'Manrope_800ExtraBold',
    textAlign: 'center',
    lineHeight: 44,
    marginBottom: 16,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  headlineHighlight: {
    color: '#ffffff',
    opacity: 0.9,
  },
  bodyText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontFamily: 'Manrope_500Medium',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  indicators: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
    alignItems: 'center',
  },
  indicatorDot: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  indicatorActive: {
    width: 32,
    backgroundColor: '#9727e7',
    shadowColor: '#9727e7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  ctaButton: {
    width: '100%',
    backgroundColor: '#9727e7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#9727e7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Manrope_700Bold',
  },
});
