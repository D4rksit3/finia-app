import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '@/store/userStore';
import { useTransactionStore } from '@/store/transactionStore';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { router } from 'expo-router';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://finia.seguricloud.com/api';

interface OCRResult {
  merchant: string;
  total: number;
  date: string;
  items: Array<{ name: string; price: number }>;
  rawText?: string;
}

export default function OCRScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useUserStore();
  const { addTransaction, syncWithBackend } = useTransactionStore();
  const [image, setImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  
  const [editMerchant, setEditMerchant] = useState('');
  const [editTotal, setEditTotal] = useState('');
  const [editDate, setEditDate] = useState('');
  const [showRawText, setShowRawText] = useState(false);

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso Denegado', 'Necesitamos acceso a tu cámara');
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.9,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      processImage(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.9,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      processImage(result.assets[0].uri);
    }
  };

  const processImage = async (imageUri: string) => {
    setProcessing(true);
    setOcrResult(null);

    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const response = await axios.post(`${API_URL}/ocr/process-receipt`, {
        image: base64,
        userId: user?.id,
      }, {
        timeout: 45000,
      });

      const result: OCRResult = response.data;
      setOcrResult(result);
      
      setEditMerchant(result.merchant);
      setEditTotal(result.total.toFixed(2));
      setEditDate(result.date);

      Alert.alert('✅ Recibo Procesado', 'Revisa y edita los datos si es necesario');
    } catch (error: any) {
      console.error('OCR error:', error);
      Alert.alert('Error', 'No se pudo procesar el recibo. Intenta con mejor iluminación.');
    } finally {
      setProcessing(false);
    }
  };

  const createTransaction = async () => {
    if (!ocrResult) return;

    const finalTotal = parseFloat(editTotal);
    if (isNaN(finalTotal) || finalTotal <= 0) {
      Alert.alert('Error', 'El monto debe ser un número válido');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/transactions`, {
        userId: user?.id,
        type: 'expense',
        amount: finalTotal,
        category: 'Comida',
        description: editMerchant,
        transactionDate: editDate,
      });

      addTransaction({
        id: response.data.transaction.id.toString(),
        userId: user?.id,
        type: 'expense',
        amount: finalTotal,
        category: 'Comida',
        description: editMerchant,
        date: new Date(editDate),
        currency: 'PEN',
      });

      if (user?.id) {
        await syncWithBackend(user.id);
      }

      Alert.alert('✅ Transacción Creada', 'El gasto ha sido registrado', [
        { text: 'Ver Dashboard', onPress: () => router.push('/(tabs)/home') },
      ]);

      setImage(null);
      setOcrResult(null);
    } catch (error) {
      console.error('Error creating transaction:', error);
      Alert.alert('Error', 'No se pudo crear la transacción');
    }
  };

  if (!user?.isPremium) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.locked}>
          <Text style={styles.lockedIcon}>🔒</Text>
          <Text style={styles.lockedTitle}>Función Premium</Text>
          <Text style={styles.lockedText}>
            El escaneo de recibos con OCR está disponible solo para usuarios Premium
          </Text>
          <TouchableOpacity 
            style={styles.upgradeButton}
            onPress={() => router.push('/(tabs)/upgrade')}
          >
            <Text style={styles.upgradeButtonText}>Actualizar a Premium</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <ScrollView 
          style={styles.scroll} 
          contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backButton}>← Atrás</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Escanear Recibo</Text>
            <View style={{ width: 60 }} />
          </View>

          {!image && (
            <View style={styles.instructions}>
              <Text style={styles.instructionsIcon}>📸</Text>
              <Text style={styles.instructionsTitle}>Escanea tu recibo</Text>
              <Text style={styles.instructionsText}>
                Toma una foto clara del recibo. Asegúrate de tener buena iluminación y que el texto sea legible.
              </Text>
            </View>
          )}

          {image && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: image }} style={styles.image} />
              {processing && (
                <View style={styles.processingOverlay}>
                  <ActivityIndicator size="large" color="#00D4AA" />
                  <Text style={styles.processingText}>Procesando recibo...</Text>
                  <Text style={styles.processingSubtext}>Esto puede tardar 10-15 segundos</Text>
                </View>
              )}
            </View>
          )}

          {ocrResult && (
            <View style={styles.results}>
              <Text style={styles.resultsTitle}>✏️ Información Extraída (Editable)</Text>
              
              <View style={styles.editCard}>
                <Text style={styles.editLabel}>Comercio</Text>
                <TextInput
                  style={styles.editInput}
                  value={editMerchant}
                  onChangeText={setEditMerchant}
                  placeholder="Nombre del comercio"
                  placeholderTextColor="#6B7280"
                  returnKeyType="next"
                />
              </View>

              <View style={styles.editCard}>
                <Text style={styles.editLabel}>Total (S/)</Text>
                <TextInput
                  style={styles.editInput}
                  value={editTotal}
                  onChangeText={setEditTotal}
                  placeholder="0.00"
                  placeholderTextColor="#6B7280"
                  keyboardType="decimal-pad"
                  returnKeyType="next"
                />
              </View>

              <View style={styles.editCard}>
                <Text style={styles.editLabel}>Fecha (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.editInput}
                  value={editDate}
                  onChangeText={setEditDate}
                  placeholder="2024-12-26"
                  placeholderTextColor="#6B7280"
                  returnKeyType="done"
                />
              </View>

              {ocrResult.items.length > 0 && (
                <View style={styles.resultCard}>
                  <Text style={styles.resultLabel}>Items detectados ({ocrResult.items.length})</Text>
                  {ocrResult.items.slice(0, 5).map((item, index) => (
                    <View key={index} style={styles.item}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemPrice}>S/ {item.price.toFixed(2)}</Text>
                    </View>
                  ))}
                  {ocrResult.items.length > 5 && (
                    <Text style={styles.moreItems}>+ {ocrResult.items.length - 5} items más</Text>
                  )}
                </View>
              )}

              {ocrResult.rawText && (
                <TouchableOpacity 
                  style={styles.debugButton}
                  onPress={() => setShowRawText(!showRawText)}
                >
                  <Text style={styles.debugButtonText}>
                    {showRawText ? '▼ Ocultar texto OCR' : '▶ Ver texto OCR completo'}
                  </Text>
                </TouchableOpacity>
              )}

              {showRawText && ocrResult.rawText && (
                <View style={styles.rawTextCard}>
                  <ScrollView style={styles.rawTextScroll} nestedScrollEnabled>
                    <Text style={styles.rawText}>{ocrResult.rawText}</Text>
                  </ScrollView>
                </View>
              )}

              <TouchableOpacity 
                style={styles.createButton}
                onPress={createTransaction}
              >
                <Text style={styles.createButtonText}>Crear Transacción</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => {
                  setImage(null);
                  setOcrResult(null);
                }}
              >
                <Text style={styles.retryButtonText}>Escanear Otro</Text>
              </TouchableOpacity>
            </View>
          )}

          {!ocrResult && !processing && (
            <View style={styles.actions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={takePhoto}
              >
                <Text style={styles.actionIcon}>📷</Text>
                <Text style={styles.actionText}>Tomar Foto</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionButton}
                onPress={pickImage}
              >
                <Text style={styles.actionIcon}>🖼️</Text>
                <Text style={styles.actionText}>Galería</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E27' },
  scroll: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  backButton: { fontSize: 16, color: '#00D4AA', fontWeight: '600' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  locked: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  lockedIcon: { fontSize: 64, marginBottom: 16 },
  lockedTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  lockedText: { fontSize: 15, color: '#9CA3AF', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  upgradeButton: { backgroundColor: '#00D4AA', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  upgradeButtonText: { fontSize: 16, fontWeight: 'bold', color: '#0A0E27' },
  instructions: { padding: 40, alignItems: 'center' },
  instructionsIcon: { fontSize: 64, marginBottom: 16 },
  instructionsTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  instructionsText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
  imageContainer: { marginHorizontal: 20, borderRadius: 16, overflow: 'hidden', backgroundColor: '#151B3D', position: 'relative' },
  image: { width: '100%', height: 400, resizeMode: 'contain' },
  processingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10, 14, 39, 0.95)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  processingText: { fontSize: 18, color: '#FFFFFF', marginTop: 16, fontWeight: 'bold' },
  processingSubtext: { fontSize: 13, color: '#9CA3AF', marginTop: 8 },
  results: { padding: 20 },
  resultsTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 16 },
  editCard: { backgroundColor: '#151B3D', borderRadius: 12, padding: 16, marginBottom: 12 },
  editLabel: { fontSize: 12, color: '#9CA3AF', marginBottom: 8 },
  editInput: { fontSize: 16, color: '#FFFFFF', backgroundColor: '#0A0E27', borderRadius: 8, padding: 12, borderWidth: 2, borderColor: '#2D3748' },
  resultCard: { backgroundColor: '#151B3D', borderRadius: 12, padding: 16, marginBottom: 12 },
  resultLabel: { fontSize: 12, color: '#9CA3AF', marginBottom: 8 },
  item: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#2D3748', marginTop: 6 },
  itemName: { fontSize: 13, color: '#FFFFFF', flex: 1 },
  itemPrice: { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },
  moreItems: { fontSize: 12, color: '#6B7280', marginTop: 8, fontStyle: 'italic' },
  debugButton: { backgroundColor: '#151B3D', padding: 12, borderRadius: 8, marginBottom: 12 },
  debugButtonText: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
  rawTextCard: { backgroundColor: '#0A0E27', borderRadius: 8, padding: 12, marginBottom: 12, maxHeight: 200 },
  rawTextScroll: { maxHeight: 180 },
  rawText: { fontSize: 11, color: '#6B7280', fontFamily: 'monospace' },
  createButton: { backgroundColor: '#00D4AA', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  createButtonText: { fontSize: 16, fontWeight: 'bold', color: '#0A0E27' },
  retryButton: { backgroundColor: '#151B3D', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: '#2D3748' },
  retryButtonText: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  actions: { flexDirection: 'row', padding: 20, gap: 12 },
  actionButton: { flex: 1, backgroundColor: '#151B3D', borderRadius: 12, padding: 24, alignItems: 'center' },
  actionIcon: { fontSize: 48, marginBottom: 12 },
  actionText: { fontSize: 14, color: '#9CA3AF', fontWeight: '600' },
});
