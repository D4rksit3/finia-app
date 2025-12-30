import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '@/store/userStore';
import { router } from 'expo-router';
import axios from 'axios';
//import authService from '@/src/services/auth/authService';
import authService from '../../src/services/auth/authService';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://finia.seguricloud.com/api';

console.log('🟢 API_URL from env:', process.env.EXPO_PUBLIC_API_URL);
console.log('🟢 API_URL final:', API_URL);

// Configurar Google Sign In

export default function LoginScreen() {
  const { setUser } = useUserStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  // ============================================
  // LOGIN/REGISTRO TRADICIONAL (EMAIL/PASSWORD)
  // ============================================
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

      console.log('🔴 FULL URL:', fullUrl);

      const payload = isRegister
        ? { email, password, fullName }
        : { email, password };

      console.log('🔴 Payload:', payload);

      const response = await axios.post(fullUrl, payload);

      console.log('✅ Response:', response.data);

      // Guardar usuario en el store
      setUser({
        id: response.data.user.id,
        email: response.data.user.email,
        fullName: response.data.user.fullName,
        photoURL: response.data.user.photoURL,
        plan: response.data.user.plan || 'free',
        isPremium: response.data.user.isPremium || false,
        transactionsThisMonth: response.data.user.transactionsThisMonth || 0,
      });

      // Navegar a tabs
      router.replace('/(tabs)');

      Alert.alert(
        '¡Éxito!',
        isRegister ? 'Cuenta creada exitosamente' : 'Sesión iniciada'
      );
    } catch (error: any) {
      console.error('❌ Error en auth:', error);

      const errorMessage =
        error.response?.data?.error || error.message || 'Error al autenticar';

      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // LOGIN CON GOOGLE + FIREBASE
  // ============================================
  

// ============================================
// LOGIN CON GOOGLE + FIREBASE
// ============================================
const handleGoogleLogin = async () => {
  try {
    setLoadingGoogle(true);
    console.log('🔐 [LOGIN] Iniciando Google Sign-In...');

    // Usar el servicio centralizado
    const { user, error } = await authService.signInWithGoogle();

    if (error) {
      throw new Error(error);
    }

    if (!user) {
      throw new Error('No se obtuvo información del usuario');
    }

    console.log('✅ [LOGIN] Usuario autenticado:', user.email);

    // Guardar usuario en el store
    setUser({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      photoURL: user.photoURL,
      plan: user.plan || 'free',
      isPremium: user.isPremium || false,
      transactionsThisMonth: user.transactionsThisMonth || 0,
    });

    console.log('✅ [LOGIN] Login completado exitosamente');

    // Navegar a tabs
    router.replace('/(tabs)');

    // Mensaje de bienvenida
    Alert.alert(
      '¡Bienvenido! 👋',
      `Hola ${user.fullName}`
    );

  } catch (error: any) {
    console.error('❌ [LOGIN] Error:', error);

    // Usuario canceló el login
    if (error.code === '12501') {
      console.log('ℹ️ Usuario canceló el login');
      return;
    }

    Alert.alert('Error', error.message || 'No se pudo iniciar sesión con Google');
  } finally {
    setLoadingGoogle(false);
  }
};



  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.appName}>FINIA</Text>
            <Text style={styles.tagline}>Tu asistente financiero inteligente</Text>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            <Text style={styles.title}>
              {isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
            </Text>

            {isRegister && (
              <TextInput
                style={styles.input}
                placeholder="Nombre completo"
                placeholderTextColor="#64748B"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            )}

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#64748B"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor="#64748B"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            {/* Botón Email/Password */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleEmailAuth}
              disabled={loading || loadingGoogle}
            >
              {loading ? (
                <ActivityIndicator color="#0A0E27" />
              ) : (
                <Text style={styles.buttonText}>
                  {isRegister ? 'Registrarse' : 'Iniciar sesión'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Divisor */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>O continúa con</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Botón Google */}
            <TouchableOpacity
              style={[styles.googleButton, loadingGoogle && styles.buttonDisabled]}
              onPress={handleGoogleLogin}
              disabled={loading || loadingGoogle}
            >
              {loadingGoogle ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <View style={styles.googleIconContainer}>
                    <Text style={styles.googleIcon}>G</Text>
                  </View>
                  <Text style={styles.googleButtonText}>Google</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Toggle Login/Registro */}
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setIsRegister(!isRegister)}
              disabled={loading || loadingGoogle}
            >
              <Text style={styles.toggleText}>
                {isRegister ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
                <Text style={styles.toggleLink}>
                  {isRegister ? 'Inicia sesión' : 'Regístrate'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Al continuar, aceptas nuestros{'\n'}
              <Text style={styles.footerLink}>Términos de Uso</Text> y{' '}
              <Text style={styles.footerLink}>Política de Privacidad</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E27',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  appName: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#00D4AA',
    marginBottom: 10,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#1E2749',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2D3B5F',
  },
  button: {
    backgroundColor: '#00D4AA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A0E27',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#2D3B5F',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#64748B',
  },
  googleButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    backgroundColor: '#4285F4',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  googleIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  toggleButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  toggleLink: {
    color: '#00D4AA',
    fontWeight: '600',
  },
  footer: {
    marginTop: 30,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: '#00D4AA',
    textDecorationLine: 'underline',
  },
});
