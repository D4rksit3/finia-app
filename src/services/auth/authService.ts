import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://finia.seguricloud.com/api';

// Web Client ID - tipo 3 del google-services.json
const WEB_CLIENT_ID = '17405051659-ci0icsc5rhv48m2r37eegkb8ngddbsvl.apps.googleusercontent.com';

// Configurar Google Sign In
GoogleSignin.configure({
  webClientId: WEB_CLIENT_ID,
  offlineAccess: false,
  forceCodeForRefreshToken: false,
  scopes: ['email', 'profile'],
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
      console.log('🔐 === INICIANDO GOOGLE SIGN-IN ===');
      console.log('🔐 Web Client ID:', WEB_CLIENT_ID);
      console.log('🔐 Paso 1: Verificando Google Play Services...');

      // 1. Verificar Google Play Services
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      console.log('✅ Paso 1: Google Play Services disponible');

      // 2. Obtener información de Google CON idToken
      console.log('🔐 Paso 2: Llamando a GoogleSignin.signIn()...');
      const userInfo = await GoogleSignin.signIn({
        webClientId: WEB_CLIENT_ID,
      });
      console.log('✅ Paso 2: GoogleSignin.signIn() completado');
      console.log('📋 userInfo keys:', Object.keys(userInfo));
      
      // Log detallado de userInfo
      try {
        console.log('📋 userInfo completo:', JSON.stringify(userInfo, null, 2));
      } catch (e) {
        console.log('📋 No se pudo stringify userInfo');
      }

      // Extraer idToken de diferentes ubicaciones posibles
      let idToken = null;
      
      // Opción 1: userInfo.idToken (versión antigua)
      if ('idToken' in userInfo && userInfo.idToken) {
        idToken = userInfo.idToken;
        console.log('✅ idToken encontrado en userInfo.idToken');
      }
      // Opción 2: userInfo.data?.idToken (versión nueva)
      else if (userInfo.data && 'idToken' in userInfo.data && userInfo.data.idToken) {
        idToken = userInfo.data.idToken;
        console.log('✅ idToken encontrado en userInfo.data.idToken');
      }
      // Opción 3: userInfo.user?.idToken
      else if (userInfo.user && 'idToken' in userInfo.user && userInfo.user.idToken) {
        idToken = userInfo.user.idToken;
        console.log('✅ idToken encontrado en userInfo.user.idToken');
      }

      console.log('🔑 idToken:', idToken ? `${idToken.substring(0, 50)}...` : 'NULL');

      if (!idToken) {
        console.error('❌ ERROR: No se pudo extraer idToken');
        console.error('❌ Claves de userInfo:', Object.keys(userInfo));
        if (userInfo.data) {
          console.error('❌ Claves de userInfo.data:', Object.keys(userInfo.data));
        }
        if (userInfo.user) {
          console.error('❌ Claves de userInfo.user:', Object.keys(userInfo.user));
        }
        throw new Error('No se obtuvo ID Token de Google. Verifica la configuración de Firebase.');
      }

      console.log('✅ ID Token obtenido exitosamente');

      // 3. Crear credencial de Firebase
      console.log('🔐 Paso 3: Creando credencial de Firebase...');
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      console.log('✅ Paso 3: Credencial de Firebase creada');

      // 4. Autenticar con Firebase
      console.log('🔐 Paso 4: Autenticando con Firebase...');
      const userCredential = await auth().signInWithCredential(googleCredential);
      console.log('✅ Paso 4: Autenticado con Firebase:', userCredential.user.email);

      // 5. Obtener Firebase ID Token
      console.log('🔐 Paso 5: Obteniendo Firebase ID Token...');
      const firebaseIdToken = await userCredential.user.getIdToken();
      console.log('✅ Paso 5: Firebase ID Token obtenido');

      // 6. Enviar al backend
      console.log('🔐 Paso 6: Enviando al backend:', API_URL);
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
      console.log('📥 Paso 6: Respuesta del backend:', data);

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error al autenticar con el backend');
      }

      // 7. Guardar token y usuario
      console.log('🔐 Paso 7: Guardando datos...');
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
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);

      let errorMessage = 'No se pudo iniciar sesión con Google';

      if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'Esta cuenta ya existe con otro método de inicio de sesión';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Error de red. Verifica tu conexión a internet';
      } else if (error.code === '12501') {
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
      console.log('🔐 Iniciando sesión tradicional:', email);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!data.success || !data.token) {
        throw new Error(data.error || 'Credenciales inválidas');
      }

      await this.saveToken(data.token);

      const user: AuthUser = {
        id: data.user.id.toString(),
        email: data.user.email,
        fullName: data.user.fullName,
        plan: data.user.plan,
        emailVerified: false,
        twoFactorEnabled: false,
        memberSince: data.user.memberSince,
      };

      await this.saveUser(user);

      console.log('✅ Login tradicional exitoso:', user.email);

      return { user, error: null };

    } catch (error: any) {
      console.error('❌ Error en signin tradicional:', error);
      return {
        user: null,
        error: error.message || 'Error al iniciar sesión',
      };
    }
  }

  async signOut(): Promise<void> {
    try {
      console.log('👋 Cerrando sesión...');
      await auth().signOut();
      try {
        await GoogleSignin.revokeAccess();
        await GoogleSignin.signOut();
      } catch (error) {
        console.log('ℹ️ No había sesión de Google activa');
      }
      await this.removeToken();
      await this.removeUser();
      console.log('✅ Sesión cerrada exitosamente');
    } catch (error) {
      console.error('❌ Error en signOut:', error);
      await this.removeToken();
      await this.removeUser();
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const localUser = await this.getUser();
      if (localUser) {
        console.log('✅ Usuario encontrado en storage local');
        return localUser;
      }
      const firebaseUser = auth().currentUser;
      if (firebaseUser) {
        console.log('✅ Usuario encontrado en Firebase');
        const token = await this.getToken();
        if (token) {
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

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

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

  async verify2FA(
    code: string, 
    userId: string
  ): Promise<{ success: boolean; user: AuthUser | null; error: string | null }> {
    return { 
      success: false, 
      user: null, 
      error: '2FA no implementado aún' 
    };
  }
}

export const authService = new AuthService();
export default authService;
