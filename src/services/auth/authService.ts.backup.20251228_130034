import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest, ResponseType } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.40.246:3000/api';

WebBrowser.maybeCompleteAuthSession();

// Configuración de Google OAuth
const googleConfig = {
  expoClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
};

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  plan: 'free' | 'premium' | 'enterprise';
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  photoURL?: string;
}

class AuthService {
  private apiClient = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Google Auth Request (para usar en componentes)
  createGoogleAuthRequest() {
    return Google.useAuthRequest(googleConfig);
  }

  async saveToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync('jwt_token', token);
    } catch (error) {
      console.error('Error saving token:', error);
    }
  }

  async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('jwt_token');
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  async removeToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('jwt_token');
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  async signUp(
    email: string,
    password: string,
    fullName: string
  ): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      const response = await this.apiClient.post('/test/create-user', {
        email,
        fullName,
      });

      const { user } = response.data;
      const fakeToken = `fake_token_${user.id}`;
      await this.saveToken(fakeToken);

      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          plan: user.plan,
          emailVerified: false,
          twoFactorEnabled: false,
        },
        error: null,
      };
    } catch (error: any) {
      console.error('SignUp error:', error);
      return {
        user: null,
        error: error.response?.data?.error || 'Error al registrarse',
      };
    }
  }

  async signIn(
    email: string,
    password: string
  ): Promise<{ user: AuthUser | null; error: string | null; requires2FA?: boolean }> {
    try {
      const response = await this.apiClient.get('/test/users');
      const users = response.data.users;
      
      const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        return { user: null, error: 'Usuario no encontrado. Regístrate primero.' };
      }

      const fakeToken = `fake_token_${user.id}`;
      await this.saveToken(fakeToken);

      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          plan: user.plan,
          emailVerified: false,
          twoFactorEnabled: false,
        },
        error: null,
      };
    } catch (error: any) {
      console.error('SignIn error:', error);
      return {
        user: null,
        error: 'Error al iniciar sesión',
      };
    }
  }

  // Procesar respuesta de Google OAuth
  async handleGoogleResponse(token: string): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      console.log('Processing Google token...');

      // Obtener info del usuario desde Google
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!userInfoResponse.ok) {
        throw new Error('Failed to get user info from Google');
      }

      const googleUser = await userInfoResponse.json();
      console.log('Google user info:', {
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
      });

      // Registrar o hacer login en nuestro backend
      const response = await this.apiClient.post('/test/create-user', {
        email: googleUser.email,
        fullName: googleUser.name,
      });

      const { user } = response.data;
      const fakeToken = `fake_token_${user.id}`;
      await this.saveToken(fakeToken);

      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          plan: user.plan,
          emailVerified: true,
          twoFactorEnabled: false,
          photoURL: googleUser.picture,
        },
        error: null,
      };
    } catch (error: any) {
      console.error('Handle Google response error:', error);
      return {
        user: null,
        error: error.response?.data?.error || 'Error procesando login de Google',
      };
    }
  }

  async verify2FA(code: string, userId: string): Promise<{ success: boolean; user: AuthUser | null; error: string | null }> {
    return { success: false, user: null, error: 'No implementado' };
  }

  async signOut(): Promise<void> {
    await this.removeToken();
  }

  async resetPassword(email: string): Promise<{ success: boolean; error: string | null }> {
    Alert.alert('Email enviado', 'Revisa tu correo para resetear la contraseña');
    return { success: true, error: null };
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const token = await this.getToken();
    if (!token) return null;

    const userId = token.replace('fake_token_', '');

    try {
      const response = await this.apiClient.get('/test/users');
      const user = response.data.users.find((u: any) => u.id === userId);

      if (!user) return null;

      return {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        plan: user.plan,
        emailVerified: false,
        twoFactorEnabled: false,
      };
    } catch (error) {
      return null;
    }
  }
}

export const authService = new AuthService();
