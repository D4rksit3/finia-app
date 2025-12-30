import { Alert, Linking, Platform, PermissionsAndroid } from 'react-native';
import { Camera } from 'expo-camera';

class PermissionsService {
  
  // ============================================
  // VERIFICAR PERMISOS
  // ============================================
  
  async checkMicrophonePermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );
      return granted;
    } catch (error) {
      console.error('Error verificando permiso de micrófono:', error);
      return false;
    }
  }

  async checkCameraPermission(): Promise<boolean> {
    try {
      const { status } = await Camera.getCameraPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error verificando permiso de cámara:', error);
      return false;
    }
  }

  async checkGalleryPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
      );
      return granted;
    } catch (error) {
      console.error('Error verificando permiso de galería:', error);
      return false;
    }
  }

  // ============================================
  // SOLICITAR PERMISOS
  // ============================================

  async requestMicrophonePermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      console.log('🎤 Solicitando permiso de micrófono...');
      
      const hasPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );

      if (hasPermission) {
        console.log('✅ Ya tiene permiso de micrófono');
        return true;
      }

      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Permiso de Micrófono',
          message: 'FINIA necesita acceso al micrófono para el reconocimiento de voz.',
          buttonNeutral: 'Preguntar después',
          buttonNegative: 'Cancelar',
          buttonPositive: 'Permitir',
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('✅ Permiso de micrófono concedido');
        return true;
      } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        Alert.alert(
          'Permiso Requerido',
          'Habilita el permiso de micrófono en la configuración.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Abrir Configuración', onPress: () => Linking.openSettings() }
          ]
        );
        return false;
      }
      
      console.log('❌ Permiso denegado');
      return false;

    } catch (error) {
      console.error('❌ Error solicitando permiso de micrófono:', error);
      return false;
    }
  }

  async requestCameraPermission(): Promise<boolean> {
    try {
      console.log('📷 Solicitando permiso de cámara...');
      
      const { status: currentStatus } = await Camera.getCameraPermissionsAsync();
      
      if (currentStatus === 'granted') {
        console.log('✅ Permiso de cámara ya concedido');
        return true;
      }

      const { status } = await Camera.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permiso de Cámara Requerido',
          'FINIA necesita acceso a la cámara para escanear recibos.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Abrir Configuración', onPress: () => Linking.openSettings() }
          ]
        );
        return false;
      }

      console.log('✅ Permiso de cámara concedido');
      return true;

    } catch (error) {
      console.error('❌ Error solicitando permiso de cámara:', error);
      return false;
    }
  }

  async requestGalleryPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      console.log('🖼️ Solicitando permiso de galería...');
      
      const hasPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
      );

      if (hasPermission) {
        console.log('✅ Ya tiene permiso de galería');
        return true;
      }

      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
        {
          title: 'Permiso de Galería',
          message: 'FINIA necesita acceso a tus fotos.',
          buttonNeutral: 'Preguntar después',
          buttonNegative: 'Cancelar',
          buttonPositive: 'Permitir',
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('✅ Permiso de galería concedido');
        return true;
      }
      
      console.log('❌ Permiso de galería denegado');
      return false;

    } catch (error) {
      console.error('❌ Error solicitando permiso de galería:', error);
      return false;
    }
  }

  async requestAllPermissions(): Promise<{
    microphone: boolean;
    camera: boolean;
    gallery: boolean;
  }> {
    console.log('🔐 Solicitando todos los permisos...');

    const microphone = await this.requestMicrophonePermission();
    const camera = await this.requestCameraPermission();
    const gallery = await this.requestGalleryPermission();

    const results = { microphone, camera, gallery };
    console.log('📋 Resultados de permisos:', results);

    return results;
  }

  async checkAllPermissions(): Promise<{
    microphone: boolean;
    camera: boolean;
    gallery: boolean;
  }> {
    const microphone = await this.checkMicrophonePermission();
    const camera = await this.checkCameraPermission();
    const gallery = await this.checkGalleryPermission();

    return { microphone, camera, gallery };
  }

  async requestPermissionWithExplanation(
    type: 'microphone' | 'camera' | 'gallery',
    explanation: string
  ): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        'Permiso Requerido',
        explanation,
        [
          { 
            text: 'Ahora No', 
            style: 'cancel',
            onPress: () => resolve(false)
          },
          { 
            text: 'Permitir',
            onPress: async () => {
              let result = false;
              switch (type) {
                case 'microphone':
                  result = await this.requestMicrophonePermission();
                  break;
                case 'camera':
                  result = await this.requestCameraPermission();
                  break;
                case 'gallery':
                  result = await this.requestGalleryPermission();
                  break;
              }
              resolve(result);
            }
          }
        ]
      );
    });
  }
}

export const permissionsService = new PermissionsService();
export default permissionsService;
