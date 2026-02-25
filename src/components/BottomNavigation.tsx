import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';

type Tab = 'home' | 'search' | 'downloads' | 'profile';

interface BottomNavigationProps {
  activeTab: Tab;
  onTabPress: (tab: Tab) => void;
  onShufflePress?: () => void;
}

export const BottomNavigation = ({ activeTab, onTabPress, onShufflePress }: BottomNavigationProps) => {
  return (
    <View style={styles.bottomNavWrapper}>
      <BlurView intensity={80} tint="dark" style={styles.bottomNavContainer}>
        {/* Main Nav Items */}
        <View style={styles.navItemsRow}>
          {/* Left Group */}
          <View style={styles.navLeft}>
            <TouchableOpacity style={styles.navItem} onPress={() => onTabPress('home')}>
              <MaterialIcons name="home" size={24} color={activeTab === 'home' ? "#9727e7" : "#9ca3af"} />
              <Text style={[styles.navLabel, activeTab === 'home' && { color: '#9727e7' }]}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => onTabPress('search')}>
              <MaterialIcons name="search" size={24} color={activeTab === 'search' ? "#9727e7" : "#9ca3af"} />
              <Text style={[styles.navLabel, activeTab === 'search' && { color: '#9727e7' }]}>Search</Text>
            </TouchableOpacity>
          </View>

          {/* Spacer for Shuffle Button */}
          <View style={{ width: 60 }} />

          {/* Right Group */}
          <View style={styles.navRight}>
            <TouchableOpacity style={styles.navItem} onPress={() => onTabPress('downloads')}>
              <MaterialIcons name="download" size={24} color={activeTab === 'downloads' ? "#9727e7" : "#9ca3af"} />
              <Text style={[styles.navLabel, activeTab === 'downloads' && { color: '#9727e7' }]}>Downloads</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => onTabPress('profile')}>
              <View style={[styles.profileIcon, activeTab === 'profile' && { borderColor: '#9727e7' }]}>
                <Image
                  source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD79HM3vofHsa4S-SzOm1moZZHudIZ0P7g84WlW-F2ee5SJWM-vvIg2eHtK_5UAI9P5lhf3wAKWInv2I7VUrqg_M4eQSk_U6Y4XOuxWaO-S2hbh4j2B9gOAMKUg-i6_K0HdNR41VLmxps51qohroarjLhoArxEcsziUNYlAF7qrB4vFt3Ktr7zW1Wdi8FPF8wFWOd-tmVDiK43TMSuhdCLc9v2ey5_sEtHin1v8vnNx0p__IBMlM8aaL7GZDSREsgbwjQnvBqy5TlK3' }}
                  style={styles.profileImage}
                />
              </View>
              <Text style={[styles.navLabel, activeTab === 'profile' && { color: '#9727e7' }]}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>

      {/* Floating Shuffle Button */}
      <View style={styles.shuffleButtonWrapper}>
        <TouchableOpacity style={styles.shuffleButton} activeOpacity={0.8} onPress={onShufflePress}>
          <MaterialIcons name="shuffle" size={32} color="white" />
        </TouchableOpacity>
        <Text style={styles.shuffleLabel}>Shuffle</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNavWrapper: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    height: 80,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bottomNavContainer: {
    width: '100%',
    height: 64,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(45, 36, 52, 0.9)',
  },
  navItemsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  navLeft: {
    flexDirection: 'row',
    gap: 24,
  },
  navRight: {
    flexDirection: 'row',
    gap: 24,
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
    minWidth: 40,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9ca3af',
  },
  profileIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  shuffleButtonWrapper: {
    position: 'absolute',
    top: -10,
    left: '50%',
    transform: [{ translateX: -30 }],
    alignItems: 'center',
    width: 60,
  },
  shuffleButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#9727e7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#1a1121',
    shadowColor: '#9727e7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  shuffleLabel: {
    color: '#9727e7',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 4,
  },
});
