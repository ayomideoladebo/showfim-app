import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Pulse animation for the "Ref" dot
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.5,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Progress bar animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3000,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    }).start();

    // Update percentage text
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 30);

    return () => clearInterval(interval);
  }, []);

  const progressApply = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Background Texture Overlay (Simulated with opacity) */}
      <View style={styles.backgroundTexture} />

      <View style={styles.contentContainer}>
        {/* Logo Composition */}
        <View style={styles.logoSection}>
          {/* Icon Container */}
          <View style={styles.iconWrapper}>
            {/* Backlight Glow */}
            <View style={styles.glow} />
            
            {/* Main Icon Box */}
            <View style={styles.iconBox}>
              <View style={styles.iconFrame} />
              <MaterialIcons name="local-movies" size={72} color="#9727e7" style={styles.icon} />
              
              {/* Rec Dot */}
              <Animated.View style={[styles.recDot, { opacity: pulseAnim }]} />
            </View>
          </View>

          {/* Typography */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>
              Showfim<Text style={styles.primaryDot}>.</Text>
            </Text>
            <Text style={styles.subtitle}> DISCOVER . STREAM . REPEAT</Text>
          </View>
        </View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          {/* Progress Bar Container */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarTrack}>
              <Animated.View style={[styles.progressBarFill, { width: progressApply }]}>
                <View style={styles.progressBarGlint} />
              </Animated.View>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusText}>INITIALIZING</Text>
              <Text style={styles.percentageText}>{progress}%</Text>
            </View>
          </View>

          {/* Version Footer */}
          <View style={styles.footer}>
            <MaterialIcons name="verified-user" size={14} color="rgba(255,255,255,0.3)" />
            <Text style={styles.footerText}>ENCRYPTED CONNECTION</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1121', // background-dark
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundTexture: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    opacity: 0.03, // Subtle grain effect
    zIndex: 0,
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    zIndex: 10,
  },
  logoSection: {
    alignItems: 'center',
    gap: 40,
    marginBottom: 60,
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 144,
    height: 144,
    borderRadius: 32,
    backgroundColor: 'rgba(151, 39, 231, 0.2)', // primary with low opacity
    transform: [{ scale: 0.9 }],
    // Blur simulation using styles might be limited on native, 
    // real blur often requires Image or View with shadow
    shadowColor: '#9727e7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  iconBox: {
    width: 144,
    height: 144,
    borderRadius: 32,
    backgroundColor: '#221829',
    borderColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  iconFrame: {
    position: 'absolute',
    inset: 0,
    borderRadius: 32,
    borderColor: 'rgba(151, 39, 231, 0.1)',
    borderWidth: 2,
    transform: [{ scale: 0.9 }],
  },
  icon: {
    textShadowColor: 'rgba(151, 39, 231, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  recDot: {
    position: 'absolute',
    top: 24,
    right: 24,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  textContainer: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 48,
    color: '#ffffff',
    fontFamily: 'Manrope_800ExtraBold',
    letterSpacing: -1,
    lineHeight: 48,
  },
  primaryDot: {
    color: '#9727e7',
  },
  subtitle: {
    color: 'rgba(151, 39, 231, 0.7)',
    fontSize: 12,
    fontFamily: 'Manrope_600SemiBold',
    letterSpacing: 3,
    paddingLeft: 4,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 48,
    width: '100%',
    paddingHorizontal: 32,
    alignItems: 'center',
    gap: 24,
  },
  progressContainer: {
    width: '100%',
    maxWidth: 180,
    gap: 8,
  },
  progressBarTrack: {
    height: 4,
    width: '100%',
    backgroundColor: '#2d2436',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#9727e7',
    borderRadius: 2,
    position: 'relative',
  },
  progressBarGlint: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6b7280', // gray-500
    letterSpacing: 1,
    fontFamily: 'Manrope_500Medium',
  },
  percentageText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    opacity: 0.3,
  },
  footerText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '500',
    letterSpacing: 1.5,
    fontFamily: 'Manrope_500Medium',
  },
});
