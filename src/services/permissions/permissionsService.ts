import { Alert, Linking, Platform, PermissionsAndroid } from 'react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

class PermissionsService {
  
  // ============================================
  // VERIFICAR SI TENEMOS PERMISOS
  // ============================================
  
  async checkMicrophonePermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true; // iOS maneja permisos automáticamente
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
    if (Platform.OS !== 'android') {
      const { status } = await Camera.getCameraPermissionsAsync();
      return status === 'granted';
    }

    try {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.CAMERA
      );
      return granted;
    } catch (error) {
      console.error('Error verificando permiso de cámara:', error);
      return false;
    }
  }

  async checkGalleryPermission(): Promise<boolean> {
    const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
    return status === 'granted';
  }

  // ============================================
  // SOLICITAR PERMISOS
  // ============================================

  async requestMicrophonePermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true; // iOS maneja permisos automáticamente con Voice
    }

    try {
      console.log('🎤 Solicitando permiso de micrófono...');
      
      // Verificar si ya tiene permiso
      const hasPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
      );

      if (hasPermission) {
        console.log('✅ Ya tiene permiso de micrófono');
        return true;
      }

      // Solicitar permiso
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Permiso de Micrófono',
          message: 'FINIA necesita acceso al micrófono para el reconocimiento de voz en transacciones.',
          buttonNeutral: 'Preguntar después',
          buttonNegative: 'Cancelar',
          buttonPositive: 'Permitir',
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('✅ Permiso de micrófono concedido');
        return true;
      } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        // Usuario marcó "No volver a preguntar"
        Alert.alert(
          'Permiso Requerido',
          'Por favor, habilita el permiso de micrófono en la configuración de la aplicación.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Abrir Configuración', onPress: () => Linking.openSettings() }
          ]
        );
        return false;
      } else {
        console.log('❌ Permiso de micrófono denegado');
        return false;
      }

    } catch (error) {
      console.error('❌ Error solicitando permiso de micrófono:', error);
      return false;
    }
  }

  async requestCameraPermission(): Promise<boolean> {
    try {
      console.log('📷 Solicitando permiso de cámara...');
      
      // Usar expo-camera para manejar permisos
      const { status: currentStatus } = await Camera.getCameraPermissionsAsync();
      
      if (currentStatus === 'granted') {
        console.log('✅ Permiso de cámara ya concedido');
        return true;
      }

      const { status } = await Camera.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permiso de Cámara Requerido',
          'FINIA necesita acceso a la cámara para escanear recibos y capturar comprobantes.',
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
    try {
      console.log('🖼️ Solicitando permiso de galería...');
      
      const { status: currentStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();
      
      if (currentStatus === 'granted') {
        console.log('✅ Permiso de galería ya concedido');
        return true;
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permiso de Galería Requerido',
          'FINIA necesita acceso a tu galería para seleccionar imágenes de recibos.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Abrir Configuración', onPress: () => Linking.openSettings() }
          ]
        );
        return false;
      }

      console.log('✅ Permiso de galería concedido');
      return true;

    } catch (error) {
      console.error('❌ Error solicitando permiso de galería:', error);
      return false;
    }
  }

  // ============================================
  // SOLICITAR TODOS LOS PERMISOS NECESARIOS
  // ============================================

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

  // ============================================
  // VERIFICAR TODOS LOS PERMISOS
  // ============================================

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

  // ============================================
  // SOLICITAR PERMISO ESPECÍFICO CON EXPLICACIÓN
  // ============================================

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