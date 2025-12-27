import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { authService } from '@/services/auth/authService';
import { useUserStore } from '@/store/userStore';

export default function RegisterScreen() {
  const { setUser } = useUserStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !fullName) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    const result = await authService.signUp(email, password, fullName);
    setLoading(false);

    if (result.error) {
      Alert.alert('Error', result.error);
      return;
    }

    if (result.user) {
      setUser({
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        plan: result.user.plan,
        isPremium: result.user.plan !== 'free',
        transactionsThisMonth: 0,
      });

      Alert.alert(
        '¡Bienvenido! 🎉',
        'Tu cuenta ha sido creada exitosamente',
        [
          {
            text: 'Comenzar',
            onPress: () => router.replace('/(tabs)/home'),
          },
        ]
      );
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const result = await authService.signInWithGoogle();
    setGoogleLoading(false);

    if (result.error) {
      return;
    }

    if (result.user) {
      setUser({
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        plan: result.user.plan,
        isPremium: result.user.plan !== 'free',
        transactionsThisMonth: 0,
      });
      router.replace('/(tabs)/home');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backText}>← Volver</Text>
            </TouchableOpacity>

            <Text style={styles.logo}>🚀</Text>
            <Text style={styles.title}>Crear cuenta</Text>
            <Text style={styles.subtitle}>Únete a FINIA y toma control de tus finanzas</Text>

            {/* Google Sign-In Button */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              disabled={googleLoading || loading}
            >
              {googleLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <View style={styles.googleIconContainer}>
                    <Text style={styles.googleIcon}>G</Text>
                  </View>
                  <Text style={styles.googleText}>Registrarse con Google</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o con email</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Form */}
            <TextInput
              style={styles.input}
              placeholder="Nombre completo"
              placeholderTextColor="#6B7280"
              autoCapitalize="words"
              value={fullName}
              onChangeText={setFullName}
              editable={!loading && !googleLoading}
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#6B7280"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              editable={!loading && !googleLoading}
            />

            <TextInput
              style={styles.input}
              placeholder="Contraseña (mín. 6 caracteres)"
              placeholderTextColor="#6B7280"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!loading && !googleLoading}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading || googleLoading}
            >
              {loading ? (
                <ActivityIndicator color="#0A0E27" />
              ) : (
                <Text style={styles.buttonText}>Crear Cuenta</Text>
              )}
            </TouchableOpacity>

            <View style={styles.termsBox}>
              <Text style={styles.termsText}>
                Al crear una cuenta, aceptas nuestros{' '}
                <Text style={styles.termsLink}>Términos de Servicio</Text> y{' '}
                <Text style={styles.termsLink}>Política de Privacidad</Text>
              </Text>
            </View>

            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.loginLinkText}>
                ¿Ya tienes cuenta? <Text style={styles.loginLinkBold}>Inicia sesión</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E27' },
  keyboardView: { flex: 1 },
  scroll: { flexGrow: 1 },
  content: { flex: 1, justifyContent: 'center', padding: 20, paddingTop: 60 },
  backButton: { position: 'absolute', top: 20, left: 20, zIndex: 10 },
  backText: { fontSize: 16, color: '#00D4AA', fontWeight: '600' },
  logo: { fontSize: 64, textAlign: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#9CA3AF', textAlign: 'center', marginBottom: 32 },
  
  // Google Button
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  googleIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  googleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#2D3748',
  },
  dividerText: {
    fontSize: 13,
    color: '#6B7280',
    marginHorizontal: 16,
  },

  // Form
  input: {
    backgroundColor: '#151B3D',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#2D3748',
  },
  button: {
    backgroundColor: '#00D4AA',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontSize: 17, fontWeight: 'bold', color: '#0A0E27' },
  termsBox: { marginTop: 24, paddingHorizontal: 8 },
  termsText: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', lineHeight: 18 },
  termsLink: { color: '#00D4AA', fontWeight: '600' },
  loginLink: { marginTop: 24, alignItems: 'center' },
  loginLinkText: { fontSize: 14, color: '#9CA3AF' },
  loginLinkBold: { color: '#00D4AA', fontWeight: 'bold' },
});
