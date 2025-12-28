import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://finia.seguricloud.com/api';

// Configurar Google Sign In
GoogleSignin.configure({
  webClientId: '17405051659-ci0icsc5rhv48m2r37eegkb8ngddbsvl.apps.googleusercontent.com',
});

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  plan: 'free' | 'premium' | 'enterprise';
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  photoURL?: string;
  memberSince?: string;
  isNewUser?: boolean;
}

interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    id: number;
    email: string;
    fullName: string;
    plan: string;
    memberSince: string;
    isNewUser?: boolean;
  };
  message?: string;
}

class AuthService {
  // ============================================
  // TOKEN MANAGEMENT
  // ============================================

  async saveToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync('jwt_token', token);
      console.log('✅ Token guardado');
    } catch (error) {
      console.error('❌ Error guardando token:', error);
    }
  }

  async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('jwt_token');
    } catch (error) {
      console.error('❌ Error obteniendo token:', error);
      return null;
    }
  }

  async removeToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('jwt_token');
      console.log('✅ Token eliminado');
    } catch (error) {
      console.error('❌ Error eliminando token:', error);
    }
  }

  // ============================================
  // USER DATA MANAGEMENT
  // ============================================

  async saveUser(user: AuthUser): Promise<void> {
    try {
      await SecureStore.setItemAsync('user_data', JSON.stringify(user));
      console.log('✅ Usuario guardado');
    } catch (error) {
      console.error('❌ Error guardando usuario:', error);
    }
  }

  async getUser(): Promise<AuthUser | null> {
    try {
      const userData = await SecureStore.getItemAsync('user_data');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('❌ Error obteniendo usuario:', error);
      return null;
    }
  }

  async removeUser(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('user_data');
      console.log('✅ Usuario eliminado');
    } catch (error) {
      console.error('❌ Error eliminando usuario:', error);
    }
  }

  // ============================================
  // GOOGLE LOGIN WITH FIREBASE
  // ============================================

  async signInWithGoogle(): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      console.log('🔐 Iniciando login con Google + Firebase...');

      // 1. Verificar Google Play Services
      await GoogleSignin.hasPlayServices();
      console.log('✅ Google Play Services disponible');

      // 2. Obtener Google ID Token
      const { idToken } = await GoogleSignin.signIn();
      console.log('✅ Google ID Token obtenido');

      if (!idToken) {
        throw new Error('No se obtuvo ID Token de Google');
      }

      // 3. Crear credencial de Firebase
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      console.log('✅ Credencial de Firebase creada');

      // 4. Autenticar con Firebase
      const userCredential = await auth().signInWithCredential(googleCredential);
      console.log('✅ Autenticado con Firebase:', userCredential.user.email);

      // 5. Obtener Firebase ID Token
      const firebaseIdToken = await userCredential.user.getIdToken();
      console.log('✅ Firebase ID Token obtenido');

      // 6. Enviar al backend
      console.log('📤 Enviando al backend:', API_URL);
      const response = await fetch(`${API_URL}/auth/firebase-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken: firebaseIdToken,
        }),
      });

      const data: LoginResponse = await response.json();
      console.log('📥 Respuesta del backend:', data);

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error al autenticar con el backend');
      }

      // 7. Guardar token y usuario
      await this.saveToken(data.token);

      const user: AuthUser = {
        id: data.user.id.toString(),
        email: data.user.email,
        fullName: data.user.fullName,
        plan: data.user.plan as 'free' | 'premium' | 'enterprise',
        emailVerified: userCredential.user.emailVerified,
        twoFactorEnabled: false,
        photoURL: userCredential.user.photoURL || undefined,
        memberSince: data.user.memberSince,
        isNewUser: data.user.isNewUser,
      };

      await this.saveUser(user);

      console.log('✅ Login completado exitosamente');

      return { user, error: null };

    } catch (error: any) {
      console.error('❌ Error en Google login:', error);

      let errorMessage = 'No se pudo iniciar sesión con Google';

      if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'Esta cuenta ya existe con otro método de inicio de sesión';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Error de red. Verifica tu conexión a internet';
      } else if (error.code === '12501') {
        // Usuario canceló el inicio de sesión
        console.log('ℹ️ Usuario canceló el login');
        return { user: null, error: null };
      } else if (error.message) {
        errorMessage = error.message;
      }

      return { user: null, error: errorMessage };
    }
  }

  // ============================================
  // TRADITIONAL SIGNUP (Fallback)
  // ============================================

  async signUp(
    email: string,
    password: string,
    fullName: string
  ): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      console.log('📝 Registrando usuario:', email);

      const response = await fetch(`${API_URL}/test/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          fullName,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al registrarse');
      }

      const user: AuthUser = {
        id: data.user.id.toString(),
        email: data.user.email,
        fullName: data.user.fullName,
        plan: data.user.plan,
        emailVerified: false,
        twoFactorEnabled: false,
      };

      // Guardar token fake para testing
      const fakeToken = `fake_token_${user.id}`;
      await this.saveToken(fakeToken);
      await this.saveUser(user);

      console.log('✅ Usuario registrado:', user.email);

      return { user, error: null };

    } catch (error: any) {
      console.error('❌ Error en signup:', error);
      return {
        user: null,
        error: error.message || 'Error al registrarse',
      };
    }
  }

  // ============================================
  // TRADITIONAL SIGNIN (Fallback)
  // ============================================

  async signIn(
    email: string,
    password: string
  ): Promise<{ user: AuthUser | null; error: string | null; requires2FA?: boolean }> {
    try {
      console.log('🔐 Iniciando sesión:', email);

      // Por ahora usamos el endpoint de test
      const response = await fetch(`${API_URL}/test/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      const users = data.users;

      const foundUser = users.find((u: any) => 
        u.email.toLowerCase() === email.toLowerCase()
      );

      if (!foundUser) {
        return { 
          user: null, 
          error: 'Usuario no encontrado. Regístrate primero o usa Google.' 
        };
      }

      const user: AuthUser = {
        id: foundUser.id.toString(),
        email: foundUser.email,
        fullName: foundUser.full_name,
        plan: foundUser.plan,
        emailVerified: false,
        twoFactorEnabled: false,
      };

      // Guardar token fake para testing
      const fakeToken = `fake_token_${user.id}`;
      await this.saveToken(fakeToken);
      await this.saveUser(user);

      console.log('✅ Login exitoso:', user.email);

      return { user, error: null };

    } catch (error: any) {
      console.error('❌ Error en signin:', error);
      return {
        user: null,
        error: 'Error al iniciar sesión',
      };
    }
  }

  // ============================================
  // SIGN OUT
  // ============================================

  async signOut(): Promise<void> {
    try {
      console.log('👋 Cerrando sesión...');

      // Cerrar sesión de Firebase
      await auth().signOut();

      // Cerrar sesión de Google
      try {
        await GoogleSignin.revokeAccess();
        await GoogleSignin.signOut();
      } catch (error) {
        console.log('ℹ️ No había sesión de Google activa');
      }

      // Limpiar tokens y datos
      await this.removeToken();
      await this.removeUser();

      console.log('✅ Sesión cerrada exitosamente');

    } catch (error) {
      console.error('❌ Error en signOut:', error);
      // Limpiar de todas formas
      await this.removeToken();
      await this.removeUser();
    }
  }

  // ============================================
  // GET CURRENT USER
  // ============================================

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      // Primero intentar obtener del storage local
      const localUser = await this.getUser();

      if (localUser) {
        console.log('✅ Usuario encontrado en storage local');
        return localUser;
      }

      // Si no hay usuario local, verificar si hay sesión de Firebase
      const firebaseUser = auth().currentUser;

      if (firebaseUser) {
        console.log('✅ Usuario encontrado en Firebase');
        
        // Obtener token y sincronizar con backend
        const token = await this.getToken();
        
        if (token) {
          // Usuario válido
          return {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            fullName: firebaseUser.displayName || 'Usuario',
            plan: 'free',
            emailVerified: firebaseUser.emailVerified,
            twoFactorEnabled: false,
            photoURL: firebaseUser.photoURL || undefined,
          };
        }
      }

      console.log('ℹ️ No hay usuario autenticado');
      return null;

    } catch (error) {
      console.error('❌ Error obteniendo usuario actual:', error);
      return null;
    }
  }

  // ============================================
  // PASSWORD RESET
  // ============================================

  async resetPassword(email: string): Promise<{ success: boolean; error: string | null }> {
    try {
      await auth().sendPasswordResetEmail(email);
      Alert.alert('Email enviado', 'Revisa tu correo para resetear la contraseña');
      return { success: true, error: null };
    } catch (error: any) {
      console.error('❌ Error en resetPassword:', error);
      return { 
        success: false, 
        error: error.message || 'Error al enviar email de recuperación' 
      };
    }
  }

  // ============================================
  // CHECK AUTHENTICATION
  // ============================================

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  // ============================================
  // UPDATE USER PLAN
  // ============================================

  async updatePlan(plan: 'free' | 'premium' | 'enterprise'): Promise<{ success: boolean; error: string | null }> {
    try {
      const token = await this.getToken();

      if (!token) {
        throw new Error('No autenticado');
      }

      console.log('📊 Actualizando plan a:', plan);

      const response = await fetch(`${API_URL}/users/update-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error al actualizar plan');
      }

      // Actualizar usuario local
      const currentUser = await this.getUser();
      if (currentUser) {
        currentUser.plan = plan;
        await this.saveUser(currentUser);
      }

      console.log('✅ Plan actualizado a:', plan);

      return { success: true, error: null };

    } catch (error: any) {
      console.error('❌ Error actualizando plan:', error);
      return {
        success: false,
        error: error.message || 'Error al actualizar plan',
      };
    }
  }

  // ============================================
  // 2FA (Placeholder)
  // ============================================

  async verify2FA(
    code: string, 
    userId: string
  ): Promise<{ success: boolean; user: AuthUser | null; error: string | null }> {
    // TODO: Implementar 2FA cuando sea necesario
    return { 
      success: false, 
      user: null, 
      error: '2FA no implementado aún' 
    };
  }
}

export const authService = new AuthService();
export default authService;
