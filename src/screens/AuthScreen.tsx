import { View, Text, StyleSheet, ImageBackground, TextInput, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { BlurView } from 'expo-blur';
import { useAuth } from '../hooks/useAuth';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

interface AuthScreenProps {
  onSkip?: () => void;
  initialMode?: 'signin' | 'signup';
}

export default function AuthScreen({ onSkip, initialMode = 'signin' }: AuthScreenProps) {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [loading, setLoading] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [googleLoading, setGoogleLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password || (isSignUp && !fullName)) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
        Alert.alert('Success', 'Check your email for verification link!');
        setIsSignUp(false); // Switch back to login after signup
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'showfim://login-callback',
          skipBrowserRedirect: true,
        },
      });
      if (error) throw error;
      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, 'showfim://login-callback');
        if (result.type === 'success' && result.url) {
          const url = new URL(result.url);
          const access_token = url.searchParams.get('access_token');
          const refresh_token = url.searchParams.get('refresh_token');
          if (access_token && refresh_token) {
            await supabase.auth.setSession({ access_token, refresh_token });
          }
        }
      }
    } catch (err: any) {
      Alert.alert('Google Sign-In Error', err.message || 'Sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Background Image Layer */}
      <ImageBackground
        source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDmPwq2wTsgwFVfRZMxWSA_mGnHphIrSJA0uYzURHwgb5ENHkaxokoQvnTpPvSQLjWDbyYVVqPAq_PsMMP0nUK8hx5kQ_5KdDxpNeW9cKUvq4ZH6PwRjLUsAs7FxEFBQmp_aPG5trvAhPbUDsx1vwGQQwSz4M_DwAx3kklwHZRwdNFClbTakCaWEN6N4ZI1xzsmL_RS9PlkFny5bnrwbaKBS1pw7WaugfJv58_hXYcoCl2m61vCxDkrDSPL9XuliHj3pYqu2nJg-VNA" }}
        style={styles.backgroundImage}
        resizeMode="cover"
        blurRadius={10} // Native blur effect
      >
        {/* Gradient Overlays */}
        <LinearGradient
          colors={['rgba(26, 17, 33, 0.8)', 'rgba(26, 17, 33, 0.95)', '#1a1121']}
          style={StyleSheet.absoluteFillObject}
        />
        <LinearGradient
          colors={['rgba(151, 39, 231, 0.1)', 'transparent']}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />

        <SafeAreaView style={styles.safeArea}>
          {onSkip && (
            <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
              <Text style={styles.skipText}>Skip</Text>
              <MaterialIcons name="chevron-right" size={20} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          )}

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Header Section */}
              <View style={styles.header}>
                <View style={styles.brandIcon}>
                  <LinearGradient
                    colors={['#9727e7', '#4c1d95']} // primary to purple-900
                    style={styles.brandGradient}
                  >
                    <MaterialIcons name="local-movies" size={32} color="white" />
                  </LinearGradient>
                </View>
                <Text style={styles.title}>Showfim</Text>
                <Text style={styles.subtitle}>
                  {isSignUp ? 'Join the premiere.' : 'Welcome back to the premiere.'}
                </Text>
              </View>

              {/* Form Section */}
              <View style={styles.form}>
                {/* Full Name Input (Sign Up Only) */}
                {isSignUp && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>FULL NAME</Text>
                    <View style={styles.inputContainer}>
                      <MaterialIcons name="person" size={20} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="John Doe"
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        value={fullName}
                        onChangeText={setFullName}
                        autoCapitalize="words"
                      />
                    </View>
                  </View>
                )}

                {/* Email Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>EMAIL ADDRESS</Text>
                  <View style={styles.inputContainer}>
                    <MaterialIcons name="mail" size={20} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="name@example.com"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>PASSWORD</Text>
                  </View>
                  <View style={styles.inputContainer}>
                    <MaterialIcons name="lock-open" size={20} color="rgba(255,255,255,0.4)" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                      <MaterialIcons
                        name={showPassword ? "visibility" : "visibility-off"}
                        size={20}
                        color="rgba(255,255,255,0.3)"
                      />
                    </TouchableOpacity>
                  </View>
                  {!isSignUp && (
                    <TouchableOpacity style={styles.forgotPassword}>
                      <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Primary Action Button */}
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleAuth}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Text style={styles.submitText}>{isSignUp ? 'Sign Up' : 'Sign In'}</Text>
                      <MaterialIcons name="arrow-forward" size={20} color="white" />
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Social Login Section */}
              <View style={styles.socialSection}>
                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
                  <View style={styles.divider} />
                </View>

                <View style={styles.socialButtons}>
                  {/* Google */}
                  <TouchableOpacity style={styles.socialButton} onPress={handleGoogleSignIn} disabled={googleLoading}>
                    {googleLoading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <MaterialIcons name="public" size={20} color="#fff" />
                    )}
                    <Text style={styles.socialText}>Google</Text>
                  </TouchableOpacity>

                  {/* Apple */}
                  <TouchableOpacity style={styles.socialButton}>
                    <MaterialIcons name="apple" size={20} color="#fff" />
                    <Text style={styles.socialText}>Apple</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Toggle Mode */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                </Text>
                <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
                  <Text style={styles.footerLink}>{isSignUp ? 'Sign In' : 'Sign Up'}</Text>
                </TouchableOpacity>
              </View>



            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1121',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  brandIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#9727e7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  brandGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    color: 'white',
    fontFamily: 'Manrope_800ExtraBold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'Manrope_500Medium',
  },
  form: {
    gap: 24,
    width: '100%',
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontFamily: 'Manrope_700Bold',
    letterSpacing: 1,
    marginLeft: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 28, 38, 0.8)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    height: 56,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    fontFamily: 'Manrope_500Medium',
    height: '100%',
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotPasswordText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontFamily: 'Manrope_600SemiBold',
  },
  submitButton: {
    height: 56,
    backgroundColor: '#9727e7',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    shadowColor: '#9727e7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  submitText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Manrope_700Bold',
  },
  socialSection: {
    marginTop: 40,
    gap: 24,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    fontFamily: 'Manrope_700Bold',
    letterSpacing: 1.5,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  socialButton: {
    flex: 1,
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  socialText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontFamily: 'Manrope_600SemiBold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
    paddingBottom: 20,
  },
  footerText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontFamily: 'Manrope_500Medium',
  },
  footerLink: {
    color: '#9727e7',
    fontSize: 14,
    fontFamily: 'Manrope_700Bold',
    textDecorationLine: 'underline',
  },
  safeArea: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 24,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  skipText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Manrope_600SemiBold',
    marginRight: 4,
  },
});
