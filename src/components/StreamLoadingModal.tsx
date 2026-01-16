import React from 'react';
import { View, Text, StyleSheet, Modal, Animated, Easing } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';

interface StreamLoadingModalProps {
  visible: boolean;
  message?: string;
}

export default function StreamLoadingModal({ visible, message = "Fetching stream..." }: StreamLoadingModalProps) {
  const spinValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinValue.setValue(0);
    }
  }, [visible]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.container}>
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        
        <View style={styles.content}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <MaterialIcons name="settings" size={48} color="#9727e7" />
          </Animated.View>
          
          <Text style={styles.text}>{message}</Text>
          <Text style={styles.subtext}>Please wait while we connect to servers</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  content: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#1a1121',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(151, 39, 231, 0.2)',
    width: '80%',
    maxWidth: 300,
    elevation: 10,
    shadowColor: '#9727e7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  text: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 24,
    textAlign: 'center',
  },
  subtext: {
    color: '#9ca3af',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
});
