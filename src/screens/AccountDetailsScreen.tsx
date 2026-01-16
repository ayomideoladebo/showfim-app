import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../lib/supabase';

interface AccountDetailsScreenProps {
  onBack: () => void;
  onSecurityPress?: () => void;
}

export default function AccountDetailsScreen({ onBack, onSecurityPress }: AccountDetailsScreenProps) {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState({ displayName: '', email: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

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
        // Fall back to auth user data
        const name = user.user_metadata?.full_name || user.email?.split('@')[0] || '';
        setDisplayName(name);
        setEmail(user.email || '');
        setOriginalData({ displayName: name, email: user.email || '' });
      } else {
        setDisplayName(data.full_name || '');
        setEmail(data.email || user.email || '');
        setAvatarUrl(data.avatar_url);
        setOriginalData({ displayName: data.full_name || '', email: data.email || '' });
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: displayName,
          email: email,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error saving profile:', error);
        Alert.alert('Error', 'Failed to save changes. Please try again.');
      } else {
        Alert.alert('Success', 'Your profile has been updated!');
        setOriginalData({ displayName, email });
        setHasChanges(false);
      }
    } catch (err) {
      console.error('Save error:', err);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const handleDisplayNameChange = (text: string) => {
    setDisplayName(text);
    setHasChanges(text !== originalData.displayName || email !== originalData.email);
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    setHasChanges(displayName !== originalData.displayName || text !== originalData.email);
  };

  const getAvatarUrl = () => {
    if (avatarUrl) return avatarUrl;
    // Default avatar placeholder
    const name = displayName || user?.email?.split('@')[0] || 'User';
    return 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=9727e7&color=fff&size=128';
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#9727e7" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Sticky Header */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']} style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <MaterialIcons name="arrow-back-ios" size={20} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Account Details</Text>
          <View style={{ width: 36 }} />
        </SafeAreaView>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#9727e7', '#a855f7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarGradient}
            >
              <View style={styles.avatarInner}>
                <Image
                  source={{ uri: getAvatarUrl() }}
                  style={styles.avatarImage}
                />
              </View>
            </LinearGradient>
            <TouchableOpacity style={styles.cameraButton}>
              <MaterialIcons name="photo-camera" size={20} color="#9727e7" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Input Fields */}
        <View style={styles.inputsSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>DISPLAY NAME</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={handleDisplayNameChange}
                placeholder="Enter your name"
                placeholderTextColor="#6b7280"
              />
              <MaterialIcons name="edit" size={20} color="#6b7280" style={styles.inputIcon} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, { opacity: 0.6 }]}
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                placeholderTextColor="#6b7280"
                editable={false}
              />
              <MaterialIcons name="lock" size={20} color="#6b7280" style={styles.inputIcon} />
            </View>
            <Text style={styles.inputHint}>Email cannot be changed</Text>
          </View>
        </View>

        {/* Configuration Section */}
        <View style={styles.configSection}>
          <Text style={styles.sectionTitle}>CONFIGURATION</Text>
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingItem} onPress={onSecurityPress}>
              <View style={styles.settingLeft}>
                <View style={styles.iconBg}>
                  <MaterialIcons name="lock" size={22} color="#9727e7" />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>Security</Text>
                  <Text style={styles.settingSubtitle}>Change Password, 2FA</Text>
                </View>
              </View>
              <MaterialIcons name="arrow-forward-ios" size={18} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Save Changes Button */}
        <TouchableOpacity 
          style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]} 
          onPress={handleSaveChanges}
          disabled={!hasChanges || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.saveButtonText}>
              {hasChanges ? 'Save Changes' : 'No Changes'}
            </Text>
          )}
        </TouchableOpacity>

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
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 24,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarGradient: {
    width: 128,
    height: 128,
    borderRadius: 64,
    padding: 4,
    shadowColor: '#9727e7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#1a1121',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#251b2e',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  inputsSection: {
    gap: 16,
    marginBottom: 32,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6b7280',
    letterSpacing: 1,
    paddingLeft: 4,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    backgroundColor: '#251b2e',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    position: 'absolute',
    right: 16,
    top: 14,
  },
  configSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6b7280',
    letterSpacing: 1,
    marginBottom: 12,
    paddingLeft: 8,
  },
  settingsCard: {
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
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(151, 39, 231, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  saveButton: {
    width: '100%',
    padding: 16,
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: '#9727e7',
    alignItems: 'center',
    shadowColor: '#9727e7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  saveButtonDisabled: {
    backgroundColor: '#4a4a55',
    shadowOpacity: 0,
  },
  inputHint: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
    paddingLeft: 4,
  },
});
