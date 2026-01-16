import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

interface HelpSupportScreenProps {
  onBack: () => void;
}

export default function HelpSupportScreen({ onBack }: HelpSupportScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']} style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <MaterialIcons name="arrow-back-ios" size={20} color="#d1d5db" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help Center</Text>
          <View style={{ width: 40 }} />
        </SafeAreaView>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Help Articles"
              placeholderTextColor="#6b7280"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Quick Chips */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}
          >
            <TouchableOpacity style={styles.chip}>
              <Text style={styles.chipText}>Payment Failed</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.chip}>
              <Text style={styles.chipText}>Offline Mode</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.chip}>
              <Text style={styles.chipText}>Change Password</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Common Topics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>COMMON TOPICS</Text>
          <View style={styles.topicsCard}>
            <TouchableOpacity style={styles.topicItem}>
              <View style={styles.topicLeft}>
                <View style={styles.topicIcon}>
                  <MaterialIcons name="receipt-long" size={22} color="#9727e7" />
                </View>
                <View style={styles.topicText}>
                  <Text style={styles.topicTitle}>Billing & Subscription</Text>
                  <Text style={styles.topicSubtitle}>Plans, payments, history</Text>
                </View>
              </View>
              <MaterialIcons name="arrow-forward-ios" size={18} color="#6b7280" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.topicItem}>
              <View style={styles.topicLeft}>
                <View style={styles.topicIcon}>
                  <MaterialIcons name="cast-connected" size={22} color="#9727e7" />
                </View>
                <View style={styles.topicText}>
                  <Text style={styles.topicTitle}>Streaming Issues</Text>
                  <Text style={styles.topicSubtitle}>Buffering, quality, audio</Text>
                </View>
              </View>
              <MaterialIcons name="arrow-forward-ios" size={18} color="#6b7280" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.topicItem}>
              <View style={styles.topicLeft}>
                <View style={styles.topicIcon}>
                  <MaterialIcons name="manage-accounts" size={22} color="#9727e7" />
                </View>
                <View style={styles.topicText}>
                  <Text style={styles.topicTitle}>Account Settings</Text>
                  <Text style={styles.topicSubtitle}>Login, profile, security</Text>
                </View>
              </View>
              <MaterialIcons name="arrow-forward-ios" size={18} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Contact Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONTACT SUPPORT</Text>
          
          <View style={styles.contactGrid}>
            <TouchableOpacity style={styles.contactCard}>
              <View style={styles.contactIconContainer}>
                <MaterialIcons name="chat-bubble" size={26} color="#9727e7" />
              </View>
              <View style={styles.contactTextContainer}>
                <Text style={styles.contactTitle}>Live Chat</Text>
                <Text style={styles.contactSubtitle}>Wait time: &lt; 2 min</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactCard}>
              <View style={styles.contactIconContainer}>
                <MaterialIcons name="mail" size={26} color="#9727e7" />
              </View>
              <View style={styles.contactTextContainer}>
                <Text style={styles.contactTitle}>Email Us</Text>
                <Text style={styles.contactSubtitle}>Response in 24h</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Pro Tip */}
          <View style={styles.proTipContainer}>
            <LinearGradient
              colors={['rgba(151,39,231,0.1)', 'rgba(59,130,246,0.1)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.proTipGradient}
            >
              <MaterialIcons name="info" size={20} color="#9727e7" style={styles.proTipIcon} />
              <Text style={styles.proTipText}>
                <Text style={styles.proTipBold}>Pro Tip: </Text>
                Most account issues can be resolved instantly by checking your email for verification links.
              </Text>
            </LinearGradient>
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
    backgroundColor: '#1a1121',
  },
  header: {
    backgroundColor: 'rgba(26, 17, 33, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Manrope_700Bold',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  searchSection: {
    marginBottom: 32,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#251b2e',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
    fontFamily: 'Manrope_500Medium',
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingBottom: 4,
  },
  chip: {
    backgroundColor: '#251b2e',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d1d5db',
    fontFamily: 'Manrope_600SemiBold',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6b7280',
    letterSpacing: 1,
    marginBottom: 12,
    paddingLeft: 8,
    fontFamily: 'Manrope_700Bold',
  },
  topicsCard: {
    backgroundColor: '#251b2e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  topicItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  topicLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  topicIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(151,39,231,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicText: {
    flex: 1,
  },
  topicTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
    fontFamily: 'Manrope_600SemiBold',
  },
  topicSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Manrope_500Medium',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  contactGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  contactCard: {
    flex: 1,
    backgroundColor: '#251b2e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  contactIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(151,39,231,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactTextContainer: {
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    fontFamily: 'Manrope_700Bold',
  },
  contactSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontFamily: 'Manrope_500Medium',
  },
  proTipContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(151,39,231,0.1)',
  },
  proTipGradient: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    gap: 12,
  },
  proTipIcon: {
    marginTop: 2,
  },
  proTipText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#d1d5db',
    fontFamily: 'Manrope_400Regular',
  },
  proTipBold: {
    fontWeight: 'bold',
    color: '#9727e7',
    fontFamily: 'Manrope_700Bold',
  },
});
