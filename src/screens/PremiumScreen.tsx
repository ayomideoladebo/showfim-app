import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface PremiumScreenProps {
  onClose: () => void;
}

type PlanType = 'weekly' | 'monthly' | 'yearly';

export default function PremiumScreen({ onClose }: PremiumScreenProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('yearly');

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Top Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <MaterialIcons name="close" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.restoreButton}>
          <Text style={styles.restoreText}>Restore</Text>
        </TouchableOpacity>
      </View>

      {/* Hero Section */}
      <View style={styles.heroContainer}>
        <View style={styles.heroBackground}>
          <View style={styles.heroContent}>
            <View style={styles.diamondIcon}>
              <MaterialIcons name="diamond" size={36} color="white" />
            </View>
            <Text style={styles.heroTitle}>Go Ad-Free</Text>
            <Text style={styles.heroSubtitle}>
              Unlock the full cinematic experience.
            </Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2X XP Card */}
        <View style={styles.xpCard}>
          <View style={styles.xpGlow} />
          <View style={styles.xpHeader}>
            <View>
              <View style={styles.xpTitleRow}>
                <Text style={styles.xpTitle}>Level Up Faster</Text>
                <Text style={styles.xpEmoji}>🚀</Text>
              </View>
              <Text style={styles.xpSubtitle}>Reach VIP status in half the time</Text>
            </View>
            <View style={styles.xpBadge}>
              <MaterialIcons name="bolt" size={14} color="white" />
              <Text style={styles.xpBadgeText}>2X XP</Text>
            </View>
          </View>
          
          <View style={styles.comparisonContainer}>
            <View style={styles.comparisonBar}>
              <View style={styles.freeTab}>
                <Text style={styles.freeTabText}>FREE</Text>
              </View>
              <LinearGradient
                colors={['#9727e7', '#a855f7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.premiumTab}
              >
                <Text style={styles.premiumTabText}>PREMIUM</Text>
              </LinearGradient>
            </View>
            <Text style={styles.comparisonNote}>
              Subscribers earn double XP & exclusive rewards
            </Text>
          </View>
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, styles.featureIconRed]}>
              <MaterialIcons name="block" size={20} color="#f87171" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>No Ads</Text>
              <Text style={styles.featureSubtitle}>Enjoy movies without interruption</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, styles.featureIconBlue]}>
              <MaterialIcons name="hd" size={20} color="#60a5fa" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>1080P Full HD</Text>
              <Text style={styles.featureSubtitle}>Crystal clear video streaming</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, styles.featureIconPurple]}>
              <MaterialIcons name="videogame-asset" size={20} color="#9727e7" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Earn Double Rewards</Text>
              <Text style={styles.featureSubtitle}>Get 2x XP for every movie watched</Text>
            </View>
          </View>
        </View>

        {/* Plan Selection */}
        <View style={styles.plansSection}>
          {/* Weekly Plan */}
          <TouchableOpacity 
            style={[styles.planCard, selectedPlan === 'weekly' && styles.planCardSelected]}
            onPress={() => setSelectedPlan('weekly')}
          >
            <View style={styles.planLeft}>
              <View style={[styles.radio, selectedPlan === 'weekly' && styles.radioSelected]}>
                {selectedPlan === 'weekly' && <View style={styles.radioDot} />}
              </View>
              <Text style={styles.planName}>Weekly</Text>
            </View>
            <View style={styles.planRight}>
              <Text style={styles.planPrice}>$2.99</Text>
              <Text style={styles.planPeriod}>/wk</Text>
            </View>
          </TouchableOpacity>

          {/* Monthly Plan */}
          <TouchableOpacity 
            style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardSelected]}
            onPress={() => setSelectedPlan('monthly')}
          >
            <View style={styles.planLeft}>
              <View style={[styles.radio, selectedPlan === 'monthly' && styles.radioSelected]}>
                {selectedPlan === 'monthly' && <View style={styles.radioDot} />}
              </View>
              <Text style={styles.planName}>Monthly</Text>
            </View>
            <View style={styles.planRight}>
              <Text style={styles.planPrice}>$9.99</Text>
              <Text style={styles.planPeriod}>/mo</Text>
            </View>
          </TouchableOpacity>

          {/* Yearly Plan - Featured */}
          <TouchableOpacity 
            style={[styles.planCard, styles.planCardFeatured, selectedPlan === 'yearly' && styles.planCardSelected]}
            onPress={() => setSelectedPlan('yearly')}
          >
            <View style={styles.planGlow} />
            <View style={styles.planLeft}>
              <View style={[styles.radio, selectedPlan === 'yearly' && styles.radioSelected]}>
                {selectedPlan === 'yearly' && <View style={styles.radioDot} />}
              </View>
              <View>
                <View style={styles.yearlyTitleRow}>
                  <Text style={styles.planNameFeatured}>Yearly</Text>
                  <View style={styles.saveBadge}>
                    <Text style={styles.saveBadgeText}>SAVE 20%</Text>
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.planRight}>
              <Text style={styles.planPrice}>$95.99</Text>
              <Text style={styles.planPeriod}>/yr</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.upgradeButton}>
          <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
          <MaterialIcons name="arrow-forward" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.termsText}>
          By continuing, you agree to our Terms of Service. Plan auto-renews annually.
        </Text>
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
  restoreButton: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  restoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d1d5db',
    fontFamily: 'Manrope_600SemiBold',
  },
  heroContainer: {
    width: width,
    height: width * 1.1,
    maxHeight: 320,
  },
  heroBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    paddingBottom: 40,
    backgroundColor: '#1a1121',
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  diamondIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#9727e7',
    transform: [{ rotate: '6deg' }],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#9727e7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: 'white',
    marginBottom: 8,
    fontFamily: 'Manrope_800ExtraBold',
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#d1d5db',
    textAlign: 'center',
    maxWidth: 250,
    lineHeight: 24,
    fontFamily: 'Manrope_500Medium',
  },
  scrollContainer: {
    flex: 1,
    marginTop: -16,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  xpCard: {
    backgroundColor: '#251b2e',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    position: 'relative',
    overflow: 'hidden',
  },
  xpGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(151,39,231,0.2)',
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    zIndex: 10,
  },
  xpTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  xpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Manrope_700Bold',
  },
  xpEmoji: {
    fontSize: 18,
  },
  xpSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
    fontFamily: 'Manrope_500Medium',
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
  },
  xpBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Manrope_700Bold',
  },
  comparisonContainer: {
    zIndex: 10,
  },
  comparisonBar: {
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 12,
    padding: 6,
    flexDirection: 'row',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  freeTab: {
    flex: 1,
    backgroundColor: 'rgba(71,85,105,0.5)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freeTabText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6b7280',
    letterSpacing: 1,
    fontFamily: 'Manrope_700Bold',
  },
  premiumTab: {
    flex: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#9727e7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 4,
  },
  premiumTabText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 1,
    fontFamily: 'Manrope_700Bold',
  },
  comparisonNote: {
    fontSize: 10,
    color: '#4b5563',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'Manrope_500Medium',
  },
  featuresSection: {
    gap: 16,
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#251b2e',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIconRed: {},
  featureIconBlue: {},
  featureIconPurple: {},
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
    fontFamily: 'Manrope_700Bold',
  },
  featureSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Manrope_500Medium',
  },
  plansSection: {
    gap: 12,
    marginBottom: 24,
  },
  planCard: {
    backgroundColor: '#251b2e',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planCardSelected: {
    borderColor: '#9727e7',
    backgroundColor: 'rgba(151,39,231,0.05)',
  },
  planCardFeatured: {
    position: 'relative',
    overflow: 'hidden',
  },
  planGlow: {
    position: 'absolute',
    top: -40,
    right: -24,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(151,39,231,0.2)',
  },
  planLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#6b7280',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    backgroundColor: '#9727e7',
    borderColor: '#9727e7',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e5e7eb',
    fontFamily: 'Manrope_600SemiBold',
  },
  planNameFeatured: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Manrope_700Bold',
  },
  yearlyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveBadge: {
    backgroundColor: '#9727e7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    shadowColor: '#9727e7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Manrope_700Bold',
  },
  planRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Manrope_700Bold',
  },
  planPeriod: {
    fontSize: 12,
    color: '#4b5563',
    fontFamily: 'Manrope_500Medium',
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
  upgradeButton: {
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
  upgradeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Manrope_700Bold',
  },
  termsText: {
    fontSize: 10,
    color: '#4b5563',
    textAlign: 'center',
    marginTop: 12,
    maxWidth: 320,
    alignSelf: 'center',
    fontFamily: 'Manrope_400Regular',
  },
});
