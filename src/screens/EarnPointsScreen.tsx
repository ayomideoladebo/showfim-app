import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Dimensions, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

interface EarnPointsScreenProps {
  onClose: () => void;
  onRedeemPress?: () => void;
}

export default function EarnPointsScreen({ onClose, onRedeemPress }: EarnPointsScreenProps) {
  const { user } = useAuth();
  const [pointsBalance, setPointsBalance] = useState(0);
  const [level, setLevel] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('points_earned, level')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setPointsBalance((data as any).points_earned || 0);
        setLevel((data as any).level || 1);
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getLevelTitle = () => {
    if (level >= 10) return 'Movie Master';
    if (level >= 7) return 'Cinema Expert';
    if (level >= 4) return 'Movie Buff';
    if (level >= 2) return 'Film Fan';
    return 'Newcomer';
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Top Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <MaterialIcons name="close" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.historyButton}>
          <MaterialIcons name="history" size={16} color="#d1d5db" />
          <Text style={styles.historyText}>History</Text>
        </TouchableOpacity>
      </View>

      {/* Hero Section */}
      <View style={styles.heroContainer}>
        <ImageBackground
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDGL_FMr5zWsZYNk9gb8nwrIN3rARUlf0y5lHT-MOI09CJpQzWitxbfYl2B7cAgbC8VTnlh5trqNHcAToyVTjGOzSMciG-Iyrge3w8ooiIYHpZ4uE1BA-xmSQgir-4YZMFKwGx9kn3l-QAyDz3DfehUX-exxSA7vXzGFzTBMaNi35qhK8V56rucvF64RLzy5Pmiz-K4cmP-JKla483qWgJesE7e7gCjue5JLkgeip1pV7fnrLWk_RoijxbQM1eT13-DIyuAt4QHnB1R' }}
          style={styles.heroBackground}
          blurRadius={40}
        >
          <LinearGradient
            colors={['transparent', 'rgba(26,17,33,0.5)', '#1a1121']}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.heroContent}>
            <Text style={styles.balanceLabel}>Your Points Balance</Text>
            <View style={styles.pointsRow}>
              <View style={styles.coinIcon}>
                <MaterialIcons name="monetization-on" size={28} color="white" />
              </View>
              {loading ? (
                <ActivityIndicator size="large" color="white" />
              ) : (
                <Text style={styles.pointsValue}>{pointsBalance.toLocaleString()}</Text>
              )}
            </View>
            <View style={styles.levelBadge}>
              <View style={styles.levelDot} />
              <Text style={styles.levelText}>Level {level}: {getLevelTitle()}</Text>
            </View>
          </View>
        </ImageBackground>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Daily Tasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Daily Tasks</Text>
              <View style={styles.dot} />
            </View>
            <View style={styles.resetBadge}>
              <Text style={styles.resetText}>Resets in 4h 20m</Text>
            </View>
          </View>

          <View style={styles.tasksList}>
            {/* Completed Task */}
            <View style={[styles.taskCard, styles.taskCompleted]}>
              <View style={styles.taskHeader}>
                <View style={styles.taskLeft}>
                  <View style={[styles.taskIcon, styles.taskIconActive]}>
                    <MaterialIcons name="person" size={20} color="#9727e7" />
                  </View>
                  <View style={styles.taskInfo}>
                    <Text style={styles.taskTitle}>Complete your profile</Text>
                    <View style={styles.pointsRow2}>
                      <MaterialIcons name="bolt" size={14} color="#fbbf24" />
                      <Text style={styles.taskPoints}>+20 pts</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity style={styles.claimButton}>
                  <Text style={styles.claimButtonText}>Claim</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: '100%' }]} />
              </View>
              <View style={styles.progressFooter}>
                <Text style={styles.progressLabel}>Completed</Text>
                <Text style={styles.progressValue}>100%</Text>
              </View>
            </View>

            {/* Incomplete Task */}
            <View style={styles.taskCard}>
              <View style={styles.taskHeader}>
                <View style={styles.taskLeft}>
                  <View style={styles.taskIcon}>
                    <MaterialIcons name="share" size={20} color="#6b7280" />
                  </View>
                  <View style={styles.taskInfo}>
                    <Text style={styles.taskTitle}>Share a movie with a friend</Text>
                    <View style={styles.pointsRow2}>
                      <MaterialIcons name="bolt" size={14} color="rgba(251,191,36,0.8)" />
                      <Text style={styles.taskPointsInactive}>+10 pts</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity style={styles.goButton}>
                  <Text style={styles.goButtonText}>Go</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: '0%' }]} />
              </View>
              <View style={styles.progressFooter}>
                <Text style={styles.progressLabelInactive}>Not started</Text>
                <Text style={styles.progressLabelInactive}>0/1</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Weekly Challenges */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Weekly Challenges</Text>
              <MaterialIcons name="calendar-today" size={16} color="#9727e7" />
            </View>
            <View style={styles.resetBadge}>
              <Text style={styles.resetText}>Ends Sunday</Text>
            </View>
          </View>

          <View style={styles.tasksList}>
            {/* In Progress Task */}
            <View style={styles.taskCard}>
              <View style={styles.taskHeader}>
                <View style={styles.taskLeft}>
                  <View style={styles.taskIcon}>
                    <MaterialIcons name="movie" size={20} color="#6b7280" />
                  </View>
                  <View style={styles.taskInfo}>
                    <Text style={styles.taskTitle}>Watch 3 movies this week</Text>
                    <View style={styles.pointsRow2}>
                      <MaterialIcons name="bolt" size={14} color="rgba(251,191,36,0.8)" />
                      <Text style={styles.taskPointsInactive}>+50 pts</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity style={styles.goButton}>
                  <Text style={styles.goButtonText}>Go</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: '33%' }]} />
              </View>
              <View style={styles.progressFooter}>
                <Text style={styles.progressLabel}>In Progress</Text>
                <Text style={styles.progressValue}>1/3 watched</Text>
              </View>
            </View>

            {/* Locked Task */}
            <View style={[styles.taskCard, styles.taskLocked]}>
              <View style={styles.taskHeader}>
                <View style={styles.taskLeft}>
                  <View style={styles.taskIcon}>
                    <MaterialIcons name="rate-review" size={20} color="#6b7280" />
                  </View>
                  <View style={styles.taskInfo}>
                    <Text style={styles.taskTitle}>Review a movie</Text>
                    <View style={styles.pointsRow2}>
                      <MaterialIcons name="bolt" size={14} color="rgba(251,191,36,0.8)" />
                      <Text style={styles.taskPointsInactive}>+30 pts</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.lockedIcon}>
                  <MaterialIcons name="lock" size={18} color="#4b5563" />
                </View>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: '0%' }]} />
              </View>
              <View style={styles.progressFooter}>
                <Text style={styles.progressLabelInactive}>Locked (Complete previous first)</Text>
                <Text style={styles.progressLabelInactive}>0/1</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.redeemButton} onPress={onRedeemPress}>
          <MaterialIcons name="redeem" size={24} color="white" />
          <Text style={styles.redeemButtonText}>Redeem Points</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1121',
  },
  topNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  historyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d1d5db',
  },
  heroContainer: {
    width: width,
    height: width * 0.9,
    maxHeight: 350,
  },
  heroBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
    paddingTop: 40,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  coinIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#9727e7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#9727e7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  pointsValue: {
    fontSize: 48,
    fontWeight: '800',
    color: 'white',
    fontFamily: 'Manrope_800ExtraBold',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 8,
  },
  levelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  levelText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#d1d5db',
  },
  scrollContainer: {
    flex: 1,
    marginTop: -24,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Manrope_700Bold',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9727e7',
  },
  resetBadge: {
    backgroundColor: '#251b2e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  resetText: {
    fontSize: 10,
    color: '#6b7280',
  },
  tasksList: {
    gap: 12,
  },
  taskCard: {
    backgroundColor: '#251b2e',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  taskCompleted: {
    borderColor: 'rgba(255,255,255,0.1)',
  },
  taskLocked: {
    opacity: 0.8,
  },
  glowEffect: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16,185,129,0.1)',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  taskLeft: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  taskIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskIconActive: {
    backgroundColor: 'rgba(151,39,231,0.1)',
    borderColor: 'rgba(151,39,231,0.2)',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  pointsRow2: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  taskPoints: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fbbf24',
  },
  taskPointsInactive: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#d1d5db',
  },
  claimButton: {
    backgroundColor: '#9727e7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#9727e7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 4,
  },
  claimButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  goButton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  goButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  lockedIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#9727e7',
    borderRadius: 3,
    shadowColor: '#9727e7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6b7280',
  },
  progressValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#9727e7',
  },
  progressLabelInactive: {
    fontSize: 10,
    fontWeight: '500',
    color: '#4b5563',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(26,17,33,0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  redeemButton: {
    width: '100%',
    backgroundColor: '#9727e7',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#9727e7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  redeemButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});
