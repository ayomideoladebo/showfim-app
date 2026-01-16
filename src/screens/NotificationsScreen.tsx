import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

interface NotificationsScreenProps {
  onBack: () => void;
}

export default function NotificationsScreen({ onBack }: NotificationsScreenProps) {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Sticky Header */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']} style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.iconBtn} 
            onPress={onBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity style={styles.iconBtn}>
            <MaterialIcons name="more-horiz" size={24} color="white" />
          </TouchableOpacity>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* NEW Section */}
        <View style={styles.sectionHeader}>
           <Text style={styles.sectionTitle}>NEW</Text>
           <TouchableOpacity><Text style={styles.markReadText}>Mark all as read</Text></TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
            {/* Item 1: Download Complete */}
            <TouchableOpacity style={styles.notificationItem} activeOpacity={0.7}>
              <View style={styles.iconWrapper}>
                  <View style={[styles.iconCircle, { backgroundColor: 'rgba(151, 39, 231, 0.2)' }]}>
                      <MaterialIcons name="check-circle" size={24} color="#9727e7" />
                  </View>
                  <View style={styles.unreadDot} />
              </View>
              <View style={styles.contentWrapper}>
                  <View style={styles.itemHeader}>
                      <Text style={styles.itemTitle}>Download Complete</Text>
                      <Text style={styles.timestamp}>2m ago</Text>
                  </View>
                  <Text style={styles.itemDescription} numberOfLines={2}>
                      <Text style={styles.highlightText}>Dune: Part Two</Text> has been downloaded successfully. You can now watch it offline.
                  </Text>
              </View>
            </TouchableOpacity>

            {/* Item 2: New Movie Released (With Image) */}
            <TouchableOpacity style={styles.notificationItem} activeOpacity={0.7}>
              <View style={styles.iconWrapper}>
                  <View style={[styles.iconCircle, { backgroundColor: 'rgba(151, 39, 231, 0.2)' }]}>
                      <MaterialIcons name="movie" size={24} color="#9727e7" />
                  </View>
                  <View style={styles.unreadDot} />
              </View>
              <View style={styles.contentWrapper}>
                  <View style={styles.itemHeader}>
                      <Text style={styles.itemTitle}>New Movie Released</Text>
                      <Text style={styles.timestamp}>1h ago</Text>
                  </View>
                  <Text style={styles.itemDescription} numberOfLines={2}>
                      The highly anticipated sci-fi thriller <Text style={styles.highlightText}>Orbital Fall</Text> is now available.
                  </Text>
                  
                  {/* Hero Image */}
                  <View style={styles.heroImageContainer}>
                      <Image 
                        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD5oKt589SiPLS9TwG7TCLJlMEy0t99QWF8nzXoJpNFXRGMLZ80gvovXj3PO4gwWCwSTiJzoha7bsma88Hf4aB6sD9BRGYAH9e4NvOZ83nqMjXIlhi5qevPv0o_G0zo8F_6I8K3ahZPenmZrVrda572knRKvuZYtiCRF09rX2HI8i2H_XZ4cB-YMUBs9Ltj9y2I1spauLE5lqPisP8UHTrpEjdIt4HLvdbZrIBEcRY6M7_9cADLFEg--HU250xry7FmyGKDynUwxx9t' }}
                        style={styles.heroImage}
                      />
                      <View style={styles.imageOverlay} />
                      <View style={styles.watchTrailerBtn}>
                          <MaterialIcons name="play-circle-outline" size={16} color="white" />
                          <Text style={styles.watchTrailerText}>WATCH TRAILER</Text>
                      </View>
                  </View>
              </View>
            </TouchableOpacity>
        </View>

        {/* EARLIER Section */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
           <Text style={styles.sectionTitle}>EARLIER</Text>
        </View>

        <View style={styles.listContainer}>
            {/* Item 3: Subscription */}
            <TouchableOpacity style={styles.notificationItem} activeOpacity={0.7}>
              <View style={styles.iconWrapper}>
                  <View style={[styles.iconCircle, { backgroundColor: '#2d2434', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }]}>
                      <MaterialIcons name="credit-card" size={20} color="#9ca3af" />
                  </View>
              </View>
              <View style={styles.contentWrapper}>
                  <View style={styles.itemHeader}>
                      <Text style={[styles.itemTitle, { color: '#d1d5db' }]}>Subscription Renewed</Text>
                      <Text style={styles.timestamp}>Yesterday</Text>
                  </View>
                  <Text style={styles.itemDescription}>
                      Your Premium Plan has been successfully renewed. Next billing date: May 24, 2024.
                  </Text>
              </View>
            </TouchableOpacity>

            {/* Item 4: Flash Sale */}
            <TouchableOpacity style={styles.notificationItem} activeOpacity={0.7}>
              <View style={styles.iconWrapper}>
                  <View style={[styles.iconCircle, { backgroundColor: '#2d2434', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }]}>
                      <MaterialIcons name="flash-on" size={20} color="#9ca3af" />
                  </View>
              </View>
              <View style={styles.contentWrapper}>
                  <View style={styles.itemHeader}>
                      <Text style={[styles.itemTitle, { color: '#d1d5db' }]}>Flash Sale</Text>
                      <Text style={styles.timestamp}>2d ago</Text>
                  </View>
                  <Text style={styles.itemDescription}>
                      50% off on all 4K rentals for the next 24 hours. Don't miss out!
                  </Text>
              </View>
            </TouchableOpacity>

            {/* Item 5: Security */}
            <TouchableOpacity style={styles.notificationItem} activeOpacity={0.7}>
              <View style={styles.iconWrapper}>
                  <View style={[styles.iconCircle, { backgroundColor: '#2d2434', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }]}>
                      <MaterialIcons name="security" size={20} color="#9ca3af" />
                  </View>
              </View>
              <View style={styles.contentWrapper}>
                  <View style={styles.itemHeader}>
                      <Text style={[styles.itemTitle, { color: '#d1d5db' }]}>New Login Detected</Text>
                      <Text style={styles.timestamp}>5d ago</Text>
                  </View>
                  <Text style={styles.itemDescription}>
                      We noticed a new login from iPad Pro in San Francisco, CA. Was this you?
                  </Text>
              </View>
            </TouchableOpacity>

             {/* Item 6: Recommendation */}
             <TouchableOpacity style={styles.notificationItem} activeOpacity={0.7}>
              <View style={styles.iconWrapper}>
                  <View style={[styles.iconCircle, { backgroundColor: '#2d2434', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }]}>
                      <MaterialIcons name="thumb-up" size={20} color="#9ca3af" />
                  </View>
              </View>
              <View style={styles.contentWrapper}>
                  <View style={styles.itemHeader}>
                      <Text style={[styles.itemTitle, { color: '#d1d5db' }]}>Recommendation</Text>
                      <Text style={styles.timestamp}>1w ago</Text>
                  </View>
                  <Text style={styles.itemDescription}>
                      Because you watched <Text style={{color: '#9ca3af'}}>Inception</Text>, we think you'll love <Text style={{color: '#9ca3af'}}>Tenet</Text>.
                  </Text>
              </View>
            </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
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
    backgroundColor: 'rgba(26, 17, 33, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 0.5,
    fontFamily: 'Manrope_700Bold',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 24,
  },
  
  // Sections
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontFamily: 'Manrope_700Bold',
  },
  markReadText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9727e7',
  },

  listContainer: {
    gap: 4,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 16,
    gap: 16,
    // Hover effect handled by activeOpacity
  },
  iconWrapper: {
    position: 'relative',
    paddingTop: 2,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#9727e7',
    borderWidth: 2,
    borderColor: '#1a1121',
  },
  contentWrapper: {
    flex: 1,
    paddingTop: 2,
    paddingBottom: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  itemTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Manrope_700Bold',
  },
  timestamp: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6b7280',
    marginLeft: 8,
  },
  itemDescription: {
    color: '#9ca3af',
    fontSize: 12,
    lineHeight: 18,
    paddingRight: 16,
  },
  highlightText: {
    color: '#e5e7eb',
    fontWeight: '500',
  },

  // Hero Image specific
  heroImageContainer: {
    marginTop: 12,
    width: '100%',
    aspectRatio: 21/9,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  watchTrailerBtn: {
    position: 'absolute',
    bottom: 8,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  watchTrailerText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
