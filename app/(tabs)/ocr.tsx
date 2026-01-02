import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import axios from 'axios';
import authService from '@/services/auth/authService';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://finia.seguricloud.com/api';

export default function OCRScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [torch, setTorch] = useState<'on' | 'off'>('off');
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <View style={styles.container}><ActivityIndicator size="large" color="#00D4AA" /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Necesitamos permiso para usar la cámara</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Conceder Permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    try {
      if (cameraRef.current) {
        console.log('📷 Tomando foto...');
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
          exif: false,
        });
        
        if (photo && photo.uri) {
          console.log('✅ Foto capturada:', photo.uri);
          setPhoto(photo.uri);
          
          // Procesar automáticamente
          if (photo.base64) {
            await processImage(photo.base64);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error tomando foto:', error);
      Alert.alert('Error', 'No se pudo capturar la imagen');
    }
  };

  const processImage = async (base64: string) => {
    try {
      setProcessing(true);
      console.log('🔍 Procesando imagen...');
      
      const token = await authService.getToken();
      
      const response = await axios.post(
        `${API_URL}/ocr/process`,
        { image: base64 },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('✅ OCR procesado:', response.data);

      if (response.data.success) {
        Alert.alert(
          '✅ Recibo Escaneado',
          `Monto: S/ ${response.data.amount}\nDescripción: ${response.data.description}`,
          [
            { text: 'Descartar', style: 'cancel', onPress: () => setPhoto(null) },
            {
              text: 'Usar Datos',
              onPress: () => {
                router.push({
                  pathname: '/(tabs)/add',
                  params: {
                    amount: response.data.amount,
                    description: response.data.description,
                  },
                });
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('❌ Error procesando OCR:', error);
      Alert.alert('Error', 'No se pudo procesar el recibo. Intenta con mejor iluminación.');
    } finally {
      setProcessing(false);
    }
  };

  const retake = () => {
    setPhoto(null);
  };

  if (photo) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photo }} style={styles.preview} />
        {processing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#00D4AA" />
            <Text style={styles.processingText}>Procesando recibo...</Text>
          </View>
        )}
        {!processing && (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.retakeButton} onPress={retake}>
              <Text style={styles.retakeButtonText}>Tomar Otra</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView 
        style={styles.camera} 
        ref={cameraRef}
        facing="back"
        enableTorch={torch === 'on'}
      >
        <View style={styles.overlay}>
          {/* Guías de escaneo */}
          <View style={styles.scanFrame} />
          
          <Text style={styles.instruction}>
            Coloca el recibo dentro del marco{'\n'}
            Asegúrate de tener buena iluminación
          </Text>

          {/* Controles */}
          <View style={styles.controls}>
            <TouchableOpacity 
              style={styles.torchButton} 
              onPress={() => setTorch(torch === 'on' ? 'off' : 'on')}
            >
              <Text style={styles.torchIcon}>{torch === 'on' ? '🔦' : '💡'}</Text>
              <Text style={styles.torchText}>{torch === 'on' ? 'Flash ON' : 'Flash OFF'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E27' },
  camera: { flex: 1 },
  
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'space-between',
    padding: 20,
  },
  
  scanFrame: {
    position: 'absolute',
    top: '25%',
    left: '10%',
    right: '10%',
    height: 300,
    borderWidth: 3,
    borderColor: '#00D4AA',
    borderRadius: 16,
  },
  
  instruction: {
    marginTop: 100,
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 16,
    borderRadius: 12,
  },
  
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 40,
  },
  
  torchButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 12,
  },
  torchIcon: { fontSize: 28, marginBottom: 4 },
  torchText: { color: '#FFFFFF', fontSize: 12 },
  
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#00D4AA',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#00D4AA',
  },
  
  closeButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: { color: '#FFFFFF', fontSize: 28, fontWeight: 'bold' },
  
  preview: { flex: 1, resizeMode: 'contain' },
  
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: { color: '#00D4AA', fontSize: 18, marginTop: 16 },
  
  actions: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  
  retakeButton: {
    backgroundColor: '#00D4AA',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
  },
  retakeButtonText: { color: '#0A0E27', fontSize: 18, fontWeight: 'bold' },
  
  message: { color: '#FFFFFF', fontSize: 16, textAlign: 'center', marginBottom: 20 },
  button: {
    backgroundColor: '#00D4AA',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: { color: '#0A0E27', fontSize: 16, fontWeight: 'bold' },
});
