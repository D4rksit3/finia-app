import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '@/store/userStore';
import { router } from 'expo-router';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.40.246:3000/api';
console.log("🟢 API_URL from env:", process.env.EXPO_PUBLIC_API_URL);
console.log("🟢 API_URL final:", API_URL);

export default function LoginScreen() {
  const { setUser } = useUserStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (isRegister && !fullName) {
      Alert.alert('Error', 'Por favor ingresa tu nombre');
      return;
    }

    setLoading(true);
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
    const fullUrl = `${API_URL}${endpoint}`;
    console.log("🔴 FULL URL:", fullUrl);
    console.log("🔴 Payload:", payload);
      const payload = isRegister 
        ? { email, password, fullName }
        : { email, password };

      const response = await axios.post(`${API_URL}${endpoint}`, payload);

      setUser({
        id: response.data.user.id,
        email: response.data.user.email,
        fullName: response.data.user.fullName,
        photoURL: response.data.user.photoURL,
        plan: response.data.user.plan || 'free',
        isPremium: response.data.user.isPremium || false,
        transactionsThisMonth: response.data.user.transactionsThisMonth || 0,
        memberSince: response.data.user.memberSince,
      });

      router.replace('/(tabs)/home');
    } catch (error: any) {
      console.error('❌ Auth error:', error);
      const errorMsg = error.response?.data?.error || 'Error de conexión';
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const mockUser = {
        email: 'demo@finia.app',
        fullName: 'Usuario Demo',
        photoURL: null,
      };

      const response = await axios.post(`${API_URL}/test/create-user`, mockUser);

      setUser({
        id: response.data.user.id,
        email: response.data.user.email,
        fullName: response.data.user.fullName,
        photoURL: response.data.user.photoURL,
        plan: response.data.user.plan || 'free',
        isPremium: response.data.user.isPremium || false,
        transactionsThisMonth: response.data.user.transactionsThisMonth || 0,
        memberSince: response.data.user.memberSince,
      });

      router.replace('/(tabs)/home');
    } catch (error: any) {
      console.error('❌ Google error:', error);
      Alert.alert('Error', 'No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>💰</Text>
            <Text style={styles.title}>FINIA</Text>
            <Text style={styles.subtitle}>Tu asistente financiero inteligente</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, !isRegister && styles.tabActive]}
                onPress={() => setIsRegister(false)}
              >
                <Text style={[styles.tabText, !isRegister && styles.tabTextActive]}>Ingresar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, isRegister && styles.tabActive]}
                onPress={() => setIsRegister(true)}
              >
                <Text style={[styles.tabText, isRegister && styles.tabTextActive]}>Registrarse</Text>
              </TouchableOpacity>
            </View>

            {isRegister && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Nombre completo</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Tu nombre"
                  placeholderTextColor="#6B7280"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="tu@email.com"
                placeholderTextColor="#6B7280"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#6B7280"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.authButton, loading && styles.authButtonDisabled]}
              onPress={handleEmailAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0A0E27" />
              ) : (
                <Text style={styles.authButtonText}>
                  {isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={[styles.googleButton, loading && styles.googleButtonDisabled]}
              onPress={handleGoogleSignIn}
              disabled={loading}
            >
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleButtonText}>Continuar con Google</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E27' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 60, marginBottom: 12 },
  title: { fontSize: 40, fontWeight: 'bold', color: '#00D4AA', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#9CA3AF', textAlign: 'center' },
  formContainer: { marginBottom: 24 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#151B3D', borderRadius: 12, padding: 4, marginBottom: 24 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#00D4AA' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  tabTextActive: { color: '#0A0E27' },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#9CA3AF', marginBottom: 8 },
  input: { backgroundColor: '#151B3D', borderRadius: 12, padding: 16, fontSize: 16, color: '#FFFFFF', borderWidth: 2, borderColor: '#2D3748' },
  authButton: { backgroundColor: '#00D4AA', borderRadius: 12, padding: 18, alignItems: 'center', marginBottom: 20 },
  authButtonDisabled: { opacity: 0.5 },
  authButtonText: { fontSize: 18, fontWeight: 'bold', color: '#0A0E27' },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#2D3748' },
  dividerText: { fontSize: 13, color: '#6B7280', marginHorizontal: 12 },
  googleButton: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#E5E7EB' },
  googleButtonDisabled: { opacity: 0.5 },
  googleIcon: { fontSize: 24, fontWeight: 'bold', color: '#EA4335', marginRight: 12 },
  googleButtonText: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
});
