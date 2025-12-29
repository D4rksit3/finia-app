import { Alert, Linking, Platform } from 'react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import Voice from '@react-native-voice/voice';

class PermissionsService {
  
  // ============================================
  // VERIFICAR SI TENEMOS PERMISOS
  // ============================================
  
  async checkMicrophonePermission(): Promise<boolean> {
    try {
      const available = await Voice.isAvailable();
      return available === 1;
    } catch (error) {
      console.error('Error verificando permiso de micrófono:', error);
      return false;
    }
  }

  async checkCameraPermission(): Promise<boolean> {
    const { status } = await Camera.getCameraPermissionsAsync();
    return status === 'granted';
  }

  async checkGalleryPermission(): Promise<boolean> {
    const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
    return status === 'granted';
  }

  // ============================================
  // SOLICITAR PERMISOS
  // ============================================

  async requestMicrophonePermission(): Promise<boolean> {
    try {
      console.log('🎤 Solicitando permiso de micrófono...');
      
      // Para Voice, el permiso se solicita automáticamente al usarlo
      // Pero podemos verificar si está disponible
      const available = await Voice.isAvailable();
      
      if (available !== 1) {
        Alert.alert(
          'Permiso de Micrófono Requerido',
          'FINIA necesita acceso al micrófono para el reconocimiento de voz en transacciones.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Ir a Configuración', onPress: () => Linking.openSettings() }
          ]
        );
        return false;
      }

      console.log('✅ Permiso de micrófono concedido');
      return true;

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
          'FINIA necesita acceso a la cámara para escanear recibos y capturar comprobantes.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Ir a Configuración', onPress: () => Linking.openSettings() }
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
            { text: 'Ir a Configuración', onPress: () => Linking.openSettings() }
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
    Alert.alert(
      'Permiso Requerido',
      explanation,
      [
        { text: 'Ahora No', style: 'cancel' },
        { 
          text: 'Permitir',
          onPress: async () => {
            switch (type) {
              case 'microphone':
                return await this.requestMicrophonePermission();
              case 'camera':
                return await this.requestCameraPermission();
              case 'gallery':
                return await this.requestGalleryPermission();
            }
          }
        }
      ]
    );
    return false;
  }
}

export const permissionsService = new PermissionsService();
export default permissionsService;
