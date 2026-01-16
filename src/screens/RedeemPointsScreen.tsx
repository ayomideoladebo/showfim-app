import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../lib/supabase';

interface RedeemPointsScreenProps {
  onBack: () => void;
}

export default function RedeemPointsScreen({ onBack }: RedeemPointsScreenProps) {
  const { user } = useAuth();
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserPoints();
  }, []);

  const fetchUserPoints = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('points_earned')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setUserPoints((data as any).points_earned || 0);
      }
    } catch (err) {
      console.error('Error fetching user points:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate progress for 1 Month Ad-Free (8000 pts)
  const monthlyProgress = Math.min((userPoints / 8000) * 100, 100);
  const pointsNeededForMonthly = Math.max(8000 - userPoints, 0);

  // Check if user can afford each tier
  const canAfford24Hours = userPoints >= 500;
  const canAfford7Days = userPoints >= 2500;
  const canAffordMonth = userPoints >= 8000;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Top Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.pointsBadge}>
          <MaterialIcons name="monetization-on" size={16} color="#FFC107" />
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.pointsBadgeText}>{userPoints.toLocaleString()} Pts</Text>
          )}
        </View>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <View style={styles.iconPulse} />
          <MaterialIcons name="redeem" size={48} color="#9727e7" />
        </View>
        <Text style={styles.headerTitle}>Redeem Points</Text>
        <Text style={styles.headerSubtitle}>
          Exchange your hard-earned points for ad-free streaming time.
        </Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 24 Hours Ad-Free */}
        <View style={[styles.rewardCard, !canAfford24Hours && styles.rewardCardLocked]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardLeft}>
              <View style={[styles.cardIcon, styles.cardIconBlue]}>
                <MaterialIcons name="timelapse" size={24} color="#60a5fa" />
              </View>
              <View>
                <Text style={styles.cardTitle}>24 Hours Ad-Free</Text>
                <Text style={styles.cardSubtitle}>Quick boost</Text>
              </View>
            </View>
            <View style={styles.pointsCostBadge}>
              <Text style={styles.pointsCostText}>500 pts</Text>
            </View>
          </View>
          <View style={styles.cardFooter}>
            <Text style={styles.cardNote}>{canAfford24Hours ? 'Available now' : 'Need more points'}</Text>
            <TouchableOpacity 
              style={[styles.redeemButtonWhite, !canAfford24Hours && styles.redeemButtonLocked]}
              disabled={!canAfford24Hours}
            >
              <Text style={canAfford24Hours ? styles.redeemButtonWhiteText : styles.redeemButtonLockedText}>
                {canAfford24Hours ? 'Redeem' : 'Locked'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 7 Days Ad-Free - BEST VALUE */}
        <View style={[styles.rewardCard, canAfford7Days && styles.rewardCardFeatured, !canAfford7Days && styles.rewardCardLocked]}>
          {canAfford7Days && (
            <View style={styles.bestValueBadge}>
              <Text style={styles.bestValueText}>BEST VALUE</Text>
            </View>
          )}
          <View style={styles.cardHeader}>
            <View style={styles.cardLeft}>
              <View style={[styles.cardIcon, styles.cardIconPurple]}>
                <MaterialIcons name="calendar-today" size={24} color="#9727e7" />
              </View>
              <View>
                <Text style={styles.cardTitle}>7 Days Ad-Free</Text>
                <Text style={styles.cardSubtitle}>Weekly pass</Text>
              </View>
            </View>
            <View style={[styles.pointsCostBadge, canAfford7Days && styles.pointsCostBadgeFeatured]}>
              <Text style={[styles.pointsCostText, canAfford7Days && styles.pointsCostTextFeatured]}>2,500 pts</Text>
            </View>
          </View>
          <View style={styles.cardFooter}>
            <View style={styles.availableRow}>
              <MaterialIcons name={canAfford7Days ? "check-circle" : "lock"} size={14} color={canAfford7Days ? "#10b981" : "#6b7280"} />
              <Text style={styles.availableText}>{canAfford7Days ? 'Available now' : 'Need more points'}</Text>
            </View>
            <TouchableOpacity 
              style={[canAfford7Days ? styles.redeemButtonPrimary : styles.redeemButtonLocked]}
              disabled={!canAfford7Days}
            >
              <Text style={canAfford7Days ? styles.redeemButtonPrimaryText : styles.redeemButtonLockedText}>
                {canAfford7Days ? 'Redeem' : 'Locked'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 1 Month Ad-Free - Shows progress */}
        <View style={[styles.rewardCard, !canAffordMonth && styles.rewardCardLocked]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardLeft}>
              <View style={[styles.cardIcon, styles.cardIconPurpleAlt]}>
                <MaterialIcons name="calendar-month" size={24} color="#a78bfa" />
              </View>
              <View>
                <Text style={styles.cardTitle}>1 Month Ad-Free</Text>
                <Text style={styles.cardSubtitle}>Marathon mode</Text>
              </View>
            </View>
            <View style={styles.pointsCostBadge}>
              <Text style={canAffordMonth ? styles.pointsCostText : styles.pointsCostTextLocked}>8,000 pts</Text>
            </View>
          </View>
          
          {/* Progress Bar */}
          {!canAffordMonth && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={['#ef4444', '#f87171']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${monthlyProgress}%` }]}
                />
              </View>
              <Text style={styles.progressText}>Need {pointsNeededForMonthly.toLocaleString()} more</Text>
            </View>
          )}

          <TouchableOpacity 
            style={[canAffordMonth ? styles.redeemButtonPrimary : styles.redeemButtonLocked, { marginTop: 16, width: '100%' }]} 
            disabled={!canAffordMonth}
          >
            <Text style={canAffordMonth ? styles.redeemButtonPrimaryText : styles.redeemButtonLockedText}>
              {canAffordMonth ? 'Redeem' : 'Locked'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.balanceLabel}>Your balance</Text>
          <View style={styles.balanceRow}>
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Text style={styles.balanceValue}>{userPoints.toLocaleString()}</Text>
                <Text style={styles.balanceUnit}>pts</Text>
              </>
            )}
          </View>
        </View>
        <TouchableOpacity style={styles.historyButton}>
          <Text style={styles.historyButtonText}>History</Text>
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
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#251b2e',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(37,27,46,0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  pointsBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Manrope_700Bold',
  },
  header: {
    paddingTop: 112,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#251b2e',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
    shadowColor: '#9727e7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 8,
  },
  iconPulse: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 48,
    borderWidth: 1,
    borderColor: 'rgba(151,39,231,0.3)',
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: 'white',
    marginBottom: 8,
    fontFamily: 'Manrope_800ExtraBold',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
    fontFamily: 'Manrope_500Medium',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  rewardCard: {
    backgroundColor: '#251b2e',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  rewardCardFeatured: {
    borderColor: 'rgba(151,39,231,0.3)',
    shadowColor: '#9727e7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
  },
  rewardCardLocked: {
    opacity: 0.8,
  },
  glowEffect: {
    position: 'absolute',
    top: -32,
    right: -32,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(151,39,231,0.2)',
  },
  bestValueBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#9727e7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  bestValueText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Manrope_700Bold',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconBlue: {
    backgroundColor: 'rgba(96,165,250,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.2)',
  },
  cardIconPurple: {
    backgroundColor: 'rgba(151,39,231,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(151,39,231,0.2)',
  },
  cardIconPurpleAlt: {
    backgroundColor: 'rgba(167,139,250,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.2)',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Manrope_700Bold',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Manrope_500Medium',
  },
  pointsCostBadge: {
    backgroundColor: '#251b2e',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pointsCostBadgeFeatured: {
    backgroundColor: 'rgba(151,39,231,0.2)',
    borderColor: 'rgba(151,39,231,0.3)',
  },
  pointsCostText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e5e7eb',
    fontFamily: 'Manrope_700Bold',
  },
  pointsCostTextFeatured: {
    color: '#d8b4fe',
  },
  pointsCostTextLocked: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6b7280',
    fontFamily: 'Manrope_700Bold',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  cardNote: {
    fontSize: 12,
    color: '#4b5563',
    fontFamily: 'Manrope_500Medium',
  },
  availableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  availableText: {
    fontSize: 12,
    color: '#4b5563',
    fontFamily: 'Manrope_500Medium',
  },
  redeemButtonWhite: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  redeemButtonWhiteText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'black',
    fontFamily: 'Manrope_700Bold',
  },
  redeemButtonPrimary: {
    backgroundColor: '#9727e7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#9727e7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  redeemButtonPrimaryText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Manrope_700Bold',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 16,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '500',
    fontFamily: 'Manrope_500Medium',
  },
  redeemButtonLocked: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  redeemButtonLockedText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4b5563',
    fontFamily: 'Manrope_700Bold',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    fontFamily: 'Manrope_500Medium',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Manrope_700Bold',
  },
  balanceUnit: {
    fontSize: 12,
    color: '#4b5563',
    fontFamily: 'Manrope_400Regular',
  },
  historyButton: {
    backgroundColor: '#251b2e',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  historyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Manrope_600SemiBold',
  },
});
