import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../providers/AuthProvider';
import AuthScreen from './AuthScreen';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

interface ProfileData {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  level: number;
  xp: number;
  movies_watched: number;
  points_earned: number;
  badges: number;
}


interface ProfileScreenProps {
  onWatchlistPress?: () => void;
  onDownloadsPress?: () => void;
  onSettingsPress?: () => void;
  onAccountDetailsPress?: () => void;
  onEarnPointsPress?: () => void;
  onRedeemPoints?: () => void;
  onPremiumPress?: () => void;
  onHelpSupportPress?: () => void;
  onSignInPress?: () => void;
  onSignUpPress?: () => void;
}

export default function ProfileScreen({ onWatchlistPress, onDownloadsPress, onSettingsPress, onAccountDetailsPress, onEarnPointsPress, onRedeemPoints, onPremiumPress, onHelpSupportPress, onSignInPress, onSignUpPress }: ProfileScreenProps) {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setLoadingProfile(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // Fall back to auth user data with default stats
        setProfile({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || null,
          avatar_url: null,
          created_at: user.created_at || new Date().toISOString(),
          level: 1,
          xp: 0,
          movies_watched: 0,
          points_earned: 0,
          badges: 0,
        });
      } else {
        setProfile(data as unknown as ProfileData);
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Format member since year
  const getMemberYear = () => {
    if (profile?.created_at) {
      return new Date(profile.created_at).getFullYear().toString();
    }
    if (user?.created_at) {
      return new Date(user.created_at).getFullYear().toString();
    }
    return new Date().getFullYear().toString();
  };

  // Get display name
  const getDisplayName = () => {
    if (profile?.full_name) return profile.full_name;
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  // Get avatar URL
  const getAvatarUrl = () => {
    if (profile?.avatar_url) return profile.avatar_url;
    // Default avatar placeholder
    return 'https://ui-avatars.com/api/?name=' + encodeURIComponent(getDisplayName()) + '&background=6614b8&color=fff&size=128';
  };

  // Get XP needed for next level (simple formula: level * 100)
  const getXpForNextLevel = () => {
    const level = profile?.level || 1;
    return level * 100;
  };

  // Get XP progress percentage
  const getXpProgress = () => {
    const xp = profile?.xp || 0;
    const xpNeeded = getXpForNextLevel();
    return Math.min((xp / xpNeeded) * 100, 100);
  };

  // Show loading state
  if (authLoading || loadingProfile) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#9727e7" />
      </View>
    );
  }

  // Guest view with benefits
  if (!user) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.guestScrollContent} showsVerticalScrollIndicator={false}>
          {/* Guest Header */}
          <View style={styles.guestHeader}>
            <View style={styles.guestIconContainer}>
              <MaterialIcons name="person-outline" size={56} color="#9727e7" />
            </View>
            <Text style={styles.guestTitle}>Join Showfim</Text>
            <Text style={styles.guestSubtitle}>
              Unlock awesome features and personalize your experience
            </Text>
          </View>

          {/* Benefits Section */}
          <View style={styles.benefitsSection}>
            <Text style={styles.benefitsSectionTitle}>Member Benefits</Text>
            
            <View style={styles.benefitCard}>
              <View style={[styles.benefitIcon, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}>
                <MaterialIcons name="bookmark-border" size={24} color="#a855f7" />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Watch Later</Text>
                <Text style={styles.benefitDescription}>Save movies and shows to watch anytime</Text>
              </View>
            </View>

            <View style={styles.benefitCard}>
              <View style={[styles.benefitIcon, { backgroundColor: 'rgba(251, 191, 36, 0.1)' }]}>
                <MaterialIcons name="monetization-on" size={24} color="#fbbf24" />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>Earn Points</Text>
                <Text style={styles.benefitDescription}>Collect points and redeem for ad-free streaming</Text>
              </View>
            </View>

            <View style={styles.benefitCard}>
              <View style={[styles.benefitIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <MaterialIcons name="hd" size={24} color="#10b981" />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>2K Streaming</Text>
                <Text style={styles.benefitDescription}>Access higher resolution streams up to 2K quality</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.guestButtons}>
            <TouchableOpacity style={styles.signInButton} onPress={onSignInPress}>
              <MaterialIcons name="login" size={20} color="white" />
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.createAccountButton} onPress={onSignUpPress}>
              <MaterialIcons name="person-add" size={20} color="#9727e7" />
              <Text style={styles.createAccountButtonText}>Create Account</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.guestNote}>
            Creating an account is free and takes less than a minute
          </Text>

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Sticky Header */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']} style={styles.headerContent}>
          <TouchableOpacity style={styles.iconBtn}>
             {/* Use transparent placeholder for alignment if no back button needed, or just left align */}
             {/* <MaterialIcons name="arrow-back" size={24} color="#9ca3af" /> */}
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.iconBtn} onPress={onSettingsPress}>
            <MaterialIcons name="settings" size={24} color="#9ca3af" />
          </TouchableOpacity>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Hero Section */}
        <View style={styles.heroSection}>
          
          <View style={styles.avatarContainer}>
             <LinearGradient
               colors={['#6614b8', '#2a2a35']}
               start={{ x: 0, y: 1 }}
               end={{ x: 1, y: 0 }}
               style={styles.avatarGradient}
             >
                <Image 
                  source={{ uri: getAvatarUrl() }}
                  style={styles.avatarImage}
                />
             </LinearGradient>
          </View>
          
          {/* Level Badge - Positioned below avatar */}
          <View style={styles.levelBadge}>
             <MaterialIcons name="star" size={14} color="white" />
             <Text style={styles.levelText}>Level {profile?.level || 1}</Text>
          </View>

          <View style={styles.userInfo}>
             <Text style={styles.userName}>{getDisplayName()}</Text>
             {/* Show PRO badge only if user has premium - for now hide or show based on some condition */}
             {/* <View style={styles.proBadge}>
                <Text style={styles.proText}>PRO</Text>
             </View> */}
          </View>
          <Text style={styles.memberSince}>Member since {getMemberYear()}</Text>
        </View>

        {/* Gamification Bar */}
        <View style={styles.section}>
           <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>PROGRESS TO LEVEL {(profile?.level || 1) + 1}</Text>
              <Text style={styles.progressValue}>{profile?.xp || 0} / {getXpForNextLevel()} XP</Text>
           </View>
           <View style={styles.progressBarBg}>
              <LinearGradient
                 colors={['#6614b8', '#a855f7']}
                 start={{ x: 0, y: 0 }}
                 end={{ x: 1, y: 0 }}
                 style={[styles.progressBarFill, { width: `${getXpProgress()}%` }]}
              />
           </View>
           <Text style={styles.nextReward}>
              {(profile?.xp || 0) === 0 ? 'Start watching to earn rewards!' : 'Keep going to level up!'}
           </Text>
        </View>

        {/* Stats Dashboard */}
        <View style={[styles.section, styles.statsGrid]}>
           <View style={styles.statCard}>
              <Text style={styles.statNumber}>{profile?.movies_watched || 0}</Text>
              <Text style={styles.statLabel}>MOVIES WATCHED</Text>
           </View>
           <View style={styles.statCard}>
              <Text style={styles.statNumber}>{profile?.points_earned || 0}</Text>
              <Text style={styles.statLabel}>POINTS EARNED</Text>
           </View>
           <View style={styles.statCard}>
              <Text style={styles.statNumber}>{profile?.badges || 0}</Text>
              <Text style={styles.statLabel}>BADGES</Text>
           </View>
        </View>

        {/* Quick Links */}
        <View style={styles.section}>
           <Text style={styles.sectionHeaderTitle}>Quick Links</Text>
           <View style={styles.linksGrid}>
              
              <TouchableOpacity 
                style={styles.linkCard} 
                activeOpacity={0.7}
                onPress={onWatchlistPress}
              >
                 <View style={styles.linkIconBg}>
                    <MaterialIcons name="bookmark" size={24} color="#d8b4fe" />
                 </View>
                 <View>
                    <Text style={styles.linkTitle}>My Watchlist</Text>
                    <Text style={styles.linkSubtitle}>0 items</Text>
                 </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.linkCard} 
                activeOpacity={0.7}
                onPress={onDownloadsPress}
              >
                 <View style={styles.linkIconBg}>
                    <MaterialIcons name="download" size={24} color="#93c5fd" />
                 </View>
                 <View>
                    <Text style={styles.linkTitle}>My Downloads</Text>
                    <Text style={styles.linkSubtitle}>0 downloads</Text>
                 </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.linkCard} 
                activeOpacity={0.7}
                onPress={onEarnPointsPress}
              >
                 <View style={styles.linkIconBg}>
                    <MaterialIcons name="savings" size={24} color="#fde047" />
                 </View>
                 <View>
                    <Text style={styles.linkTitle}>Earn Points</Text>
                    <Text style={styles.linkSubtitle}>View daily tasks</Text>
                 </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.linkCard} 
                activeOpacity={0.7}
                onPress={onRedeemPoints}
              >
                 <View style={styles.linkIconBg}>
                    <MaterialIcons name="redeem" size={24} color="#fca5a5" />
                 </View>
                 <View>
                    <Text style={styles.linkTitle}>Redeem</Text>
                    <Text style={styles.linkSubtitle}>Shop rewards</Text>
                 </View>
              </TouchableOpacity>

           </View>
        </View>

        {/* Settings List */}
        <View style={[styles.section, { marginBottom: 24 }]}>
           <Text style={styles.sectionHeaderTitle}>Settings</Text>
           <View style={styles.settingsList}>
              
              <TouchableOpacity style={styles.settingItem} onPress={onAccountDetailsPress}>
                 <View style={styles.settingLeft}>
                    <MaterialIcons name="person" size={20} color="#9ca3af" />
                    <Text style={styles.settingText}>Account Details</Text>
                 </View>
                 <MaterialIcons name="chevron-right" size={20} color="#6b7280" />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.settingItem} onPress={onPremiumPress}>
                 <View style={styles.settingLeft}>
                    <MaterialIcons name="diamond" size={20} color="#9ca3af" />
                    <Text style={styles.settingText}>Premium Subscription</Text>
                 </View>
                 <MaterialIcons name="chevron-right" size={20} color="#6b7280" />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.settingItem} onPress={onHelpSupportPress}>
                 <View style={styles.settingLeft}>
                    <MaterialIcons name="help" size={20} color="#9ca3af" />
                    <Text style={styles.settingText}>Help & Support</Text>
                 </View>
                 <MaterialIcons name="chevron-right" size={20} color="#6b7280" />
              </TouchableOpacity>

           </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121216', // Deep Charcoal
  },
  header: {
    backgroundColor: 'rgba(18, 18, 22, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Manrope_700Bold',
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 24,
  },

  // Hero
  heroSection: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    top: 40,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(102, 20, 184, 0.2)',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarGradient: {
    width: 112,
    height: 112,
    borderRadius: 56,
    padding: 4,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 54,
    borderWidth: 2,
    borderColor: '#121216',
  },
  levelBadge: {
    marginTop: -12,
    backgroundColor: '#6614b8',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#121216',
    gap: 4,
  },
  levelText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Manrope_700Bold',
  },
  proBadge: {
    backgroundColor: 'rgba(200, 160, 60, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(200, 160, 60, 0.3)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  proText: {
    color: '#C8A03C',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  memberSince: {
    color: '#9ca3af',
    fontSize: 14,
    marginTop: 4,
  },

  // Sections
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  progressTitle: {
    color: '#6614b8',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  progressValue: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '500',
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#19191F',
    borderRadius: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  nextReward: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#19191F',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 8,
    color: '#6b7280',
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  // Quick Links
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
    fontFamily: 'Manrope_700Bold',
  },
  linksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  linkCard: {
    width: (width - 48 - 12) / 2,
    backgroundColor: '#19191F',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  linkIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#121216',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  linkSubtitle: {
    color: '#6b7280',
    fontSize: 10,
  },

  // Settings
  settingsList: {
    backgroundColor: '#19191F',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginLeft: 48,
  },
  // Guest View Styles
  guestScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  guestHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  guestIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(151, 39, 231, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(151, 39, 231, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  guestTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  guestSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  benefitsSection: {
    marginBottom: 32,
  },
  benefitsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 16,
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#251b2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 13,
    color: '#9ca3af',
  },
  guestButtons: {
    gap: 12,
    marginBottom: 24,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#9727e7',
    paddingVertical: 16,
    borderRadius: 12,
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  createAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#9727e7',
    paddingVertical: 14,
    borderRadius: 12,
  },
  createAccountButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#9727e7',
  },
  guestNote: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
});


