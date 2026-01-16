import { useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './src/providers/AuthProvider';
import SplashScreen from './src/screens/SplashScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import AuthScreen from './src/screens/AuthScreen';
import DownloadsScreen from './src/screens/DownloadsScreen';
import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';
import MovieDetailsScreen from './src/screens/MovieDetailsScreen';
import TvDetailsScreen from './src/screens/TvDetailsScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ActorDetailScreen from './src/screens/ActorDetailScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import WatchlistScreen from './src/screens/WatchlistScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AccountDetailsScreen from './src/screens/AccountDetailsScreen';
import EarnPointsScreen from './src/screens/EarnPointsScreen';
import RedeemPointsScreen from './src/screens/RedeemPointsScreen';
import PremiumScreen from './src/screens/PremiumScreen';
import HelpSupportScreen from './src/screens/HelpSupportScreen';
import ShuffleLoadingScreen from './src/screens/ShuffleLoadingScreen';
import SecurityScreen from './src/screens/SecurityScreen';
import { BottomNavigation } from './src/components/BottomNavigation';
import { 
  useFonts, 
  Manrope_400Regular, 
  Manrope_500Medium, 
  Manrope_600SemiBold, 
  Manrope_700Bold, 
  Manrope_800ExtraBold 
} from '@expo-google-fonts/manrope';

type Tab = 'home' | 'search' | 'downloads' | 'profile';

function MainLayout() {
  const { user, loading, signOut } = useAuth();
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [selectedTvId, setSelectedTvId] = useState<number | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [showEarnPoints, setShowEarnPoints] = useState(false);
  const [showRedeemPoints, setShowRedeemPoints] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [showHelpSupport, setShowHelpSupport] = useState(false);
  const [showShuffle, setShowShuffle] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [selectedActor, setSelectedActor] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(false);

  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      const timer = setTimeout(() => {
        setIsSplashVisible(false);
        if (!user) {
          setShowOnboarding(true);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [fontsLoaded, user]);

  if (!fontsLoaded || isSplashVisible) {
    return <SplashScreen />;
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  // 1. Show Onboarding first (only if not logged in)
  if (!user && showOnboarding) {
    return <OnboardingScreen onComplete={() => setShowOnboarding(false)} />;
  }

  // 2. Show Auth Screen next (only if not logged in and not already skipped)
  if (!user && !isGuest && !showOnboarding) {
    return <AuthScreen onSkip={() => setIsGuest(true)} />;
  }

  // Show auth screen when triggered from guest profile
  if (showAuth) {
    return <AuthScreen onSkip={() => setShowAuth(false)} initialMode={authMode} />;
  }

  // 3. Main App (Authenticated OR Guest)
  // We only block specific overlays if needed, otherwise allow access
  
  if (showNotifications) {
    // Maybe block notifications for guest? For now allow or let screen handle empty state
    return <NotificationsScreen onBack={() => setShowNotifications(false)} />;
  }

  if (showWatchlist) {
    return <WatchlistScreen onBack={() => setShowWatchlist(false)} />;
  }

  if (showSettings) {
    return (
      <SettingsScreen 
        onBack={() => setShowSettings(false)} 
        onAccountDetailsPress={() => setShowAccountDetails(true)}
        onLogout={async () => {
          await signOut();
          setShowSettings(false);
        }}
      />
    );
  }

  if (showSecurity) {
    return <SecurityScreen onBack={() => setShowSecurity(false)} />;
  }

  if (showAccountDetails) {
    return (
      <AccountDetailsScreen 
        onBack={() => setShowAccountDetails(false)} 
        onSecurityPress={() => setShowSecurity(true)}
      />
    );
  }

  if (showEarnPoints) {
    return (
      <EarnPointsScreen 
        onClose={() => setShowEarnPoints(false)}
        onRedeemPress={() => setShowRedeemPoints(true)}
      />
    );
  }

  if (showRedeemPoints) {
    return <RedeemPointsScreen onBack={() => setShowRedeemPoints(false)} />;
  }

  if (showPremium) {
    return <PremiumScreen onClose={() => setShowPremium(false)} />;
  }

  if (showHelpSupport) {
    return <HelpSupportScreen onBack={() => setShowHelpSupport(false)} />;
  }

  if (showShuffle) {
    return (
      <ShuffleLoadingScreen 
        onClose={() => setShowShuffle(false)}
        onMovieSelect={(movieId) => {
          setShowShuffle(false);
          setSelectedMovieId(movieId);
        }}
        onTvSelect={(tvId) => {
          setShowShuffle(false);
          setSelectedTvId(tvId);
        }}
      />
    );
  }

  if (selectedActor) {
    return (
      <ActorDetailScreen 
        actor={selectedActor} 
        onBack={() => setSelectedActor(null)} 
        onMoviePress={(movieId) => {
          setSelectedActor(null);
          setSelectedMovieId(movieId);
        }}
        onTvPress={(tvId) => {
          setSelectedActor(null);
          setSelectedTvId(tvId);
        }}
      />
    );
  }

  if (selectedMovieId) {
    return (
      <MovieDetailsScreen 
        movieId={selectedMovieId}
        onBack={() => setSelectedMovieId(null)} 
        onActorPress={(actorId) => {
          setSelectedMovieId(null);
          setSelectedActor({ id: actorId });
        }}
        onMoviePress={(movieId) => setSelectedMovieId(movieId)}
      />
    );
  }

  if (selectedTvId) {
    return (
      <TvDetailsScreen 
        tvId={selectedTvId}
        onBack={() => setSelectedTvId(null)} 
        onActorPress={(actorId) => {
          setSelectedTvId(null);
          setSelectedActor({ id: actorId });
        }}
      />
    );
  }

  return (
    <View style={styles.appContainer}>
      {activeTab === 'home' && (
         <HomeScreen 
           onMoviePress={(movieId) => setSelectedMovieId(movieId)}
           onTvPress={(tvId) => setSelectedTvId(tvId)}
           onNotificationPress={() => setShowNotifications(true)}
         />
      )}
      {activeTab === 'search' && (
        <SearchScreen 
          onMoviePress={(movieId) => setSelectedMovieId(movieId)}
          onTvPress={(tvId) => setSelectedTvId(tvId)}
          onActorPress={(actorId) => setSelectedActor({ id: actorId })}
        />
      )}
      {activeTab === 'downloads' && <DownloadsScreen />}
      {activeTab === 'profile' && (
        <ProfileScreen 
          onWatchlistPress={() => setShowWatchlist(true)}
          onDownloadsPress={() => setActiveTab('downloads')}
          onSettingsPress={() => setShowSettings(true)}
          onAccountDetailsPress={() => setShowAccountDetails(true)}
          onEarnPointsPress={() => setShowEarnPoints(true)}
          onRedeemPoints={() => setShowRedeemPoints(true)}
          onPremiumPress={() => setShowPremium(true)}
          onHelpSupportPress={() => setShowHelpSupport(true)}
          onSignInPress={() => {
            setAuthMode('signin');
            setShowAuth(true);
          }}
          onSignUpPress={() => {
            setAuthMode('signup');
            setShowAuth(true);
          }}
        />
      )}
      
      <BottomNavigation 
        activeTab={activeTab} 
        onTabPress={setActiveTab}
        onShufflePress={() => setShowShuffle(true)}
      />
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1121',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appContainer: {
    flex: 1,
    backgroundColor: '#1a1121',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'white',
  },
});



