import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '@/store/userStore';
import { useTransactionStore } from '@/store/transactionStore';
import { router } from 'expo-router';
import axios from 'axios';
import Voice from '@react-native-voice/voice';
import PermissionsService from '../../src/services/permissions/permissionsService';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://finia.seguricloud.com/api';

type TransactionType = 'income' | 'expense';

const categories = {
  expense: ['Comida', 'Transporte', 'Hogar', 'Salud', 'Entretenimiento', 'Educación', 'Otros'],
  income: ['Salario', 'Freelance', 'Inversiones', 'Ventas', 'Otros'],
};

export default function AddScreen() {
  const insets = useSafeAreaInsets();
  const { user, canAddTransaction, incrementTransactions } = useUserStore();
  const { addTransaction, syncWithBackend } = useTransactionStore();
  
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Comida');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');

  useEffect(() => {
    console.log('📱 AddScreen montado');
    
    try {
      Voice.onSpeechStart = () => {
        console.log('🎤 Voice recognition started');
        setIsListening(true);
      };

      Voice.onSpeechResults = (event: any) => {
        console.log('🎤 onSpeechResults:', event);
        if (event.value && event.value.length > 0) {
          const text = event.value[0];
          console.log('🎤 Recognized:', text);
          setRecognizedText(text);
          parseVoiceInput(text);
        }
      };

      Voice.onSpeechError = (event: any) => {
        console.error('🎤 Error:', event);
        setIsListening(false);
        if (event.error?.code !== '7' && event.error?.code !== 7) {
          Alert.alert('Error de voz', 'No se pudo reconocer. Intenta de nuevo.');
        }
      };

      Voice.onSpeechEnd = () => {
        console.log('🎤 Voice recognition ended');
        setIsListening(false);
      };
    } catch (error) {
      console.error('❌ Error configurando Voice:', error);
    }

    return () => {
      console.log('📱 AddScreen desmontado');
      Voice.destroy().then(Voice.removeAllListeners).catch(err => {
        console.error('Error cleanup Voice:', err);
      });
    };
  }, []);

  const startListening = async () => {
    try {
      console.log('🎤 [startListening] Iniciando...');
      
      const hasPermission = await PermissionsService.requestMicrophonePermission();
      
      if (!hasPermission) {
        console.log('❌ [startListening] Permiso denegado');
        Alert.alert(
          'Permiso Requerido',
          'FINIA necesita acceso al micrófono para el reconocimiento de voz.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Abrir Configuración', onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }
      
      console.log('✅ [startListening] Permiso concedido');
      console.log('🎤 [startListening] Iniciando Voice.start...');
      
      setIsListening(true);
      await Voice.start('es-PE');
      console.log('✅ [startListening] Voice started');
      
    } catch (error: any) {
      console.error('❌ [startListening] Error:', error);
      setIsListening(false);
      Alert.alert('Error', 'No se pudo iniciar el reconocimiento de voz');
    }
  };

  const stopListening = async () => {
    try {
      console.log('🛑 [stopListening] Deteniendo...');
      await Voice.stop();
      setIsListening(false);
      console.log('✅ [stopListening] Voice stopped');
    } catch (error: any) {
      console.error('❌ [stopListening] Error:', error);
      setIsListening(false);
    }
  };

  const parseVoiceInput = (text: string) => {
    try {
      console.log('🔍 [parseVoiceInput] Parseando:', text);
      const lowerText = text.toLowerCase();
      
      let detectedType: TransactionType = 'expense';
      if (lowerText.includes('ingreso') || lowerText.includes('ganancia') || lowerText.includes('cobré') || lowerText.includes('recibí')) {
        detectedType = 'income';
        setType('income');
      } else if (lowerText.includes('gasto') || lowerText.includes('gasté') || lowerText.includes('pagué') || lowerText.includes('compré')) {
        detectedType = 'expense';
        setType('expense');
      }

      const montoPatterns = [
        /(\d+\.?\d*)\s*(soles?|nuevos soles)/i,
        /(\d+\.?\d*)\s*s\/?\.?/i,
        /(\d+)\s*(con\s*(\d+))?/i,
      ];

      let detectedAmount = '';
      for (const pattern of montoPatterns) {
        const match = lowerText.match(pattern);
        if (match) {
          if (match[3]) {
            detectedAmount = `${match[1]}.${match[3]}`;
          } else {
            detectedAmount = match[1];
          }
          setAmount(detectedAmount);
          break;
        }
      }

      const categoryKeywords = {
        'Comida': ['comida', 'almuerzo', 'cena', 'desayuno', 'restaurant', 'comí', 'pizza', 'pollo', 'ceviche'],
        'Transporte': ['transporte', 'taxi', 'uber', 'gasolina', 'pasaje', 'bus', 'combi'],
        'Hogar': ['casa', 'hogar', 'alquiler', 'luz', 'agua', 'internet'],
        'Salud': ['salud', 'farmacia', 'medicina', 'doctor', 'médico', 'clínica'],
        'Entretenimiento': ['cine', 'diversión', 'juego', 'netflix', 'spotify'],
        'Educación': ['educación', 'curso', 'libro', 'universidad', 'colegio'],
        'Salario': ['salario', 'sueldo', 'pago', 'cobré'],
        'Freelance': ['freelance', 'trabajo', 'proyecto'],
        'Ventas': ['venta', 'vendí'],
      };

      let detectedCategory = detectedType === 'expense' ? 'Comida' : 'Salario';
      for (const [cat, keywords] of Object.entries(categoryKeywords)) {
        for (const keyword of keywords) {
          if (lowerText.includes(keyword)) {
            if (detectedType === 'expense' && categories.expense.includes(cat)) {
              detectedCategory = cat;
              break;
            } else if (detectedType === 'income' && categories.income.includes(cat)) {
              detectedCategory = cat;
              break;
            }
          }
        }
      }
      setCategory(detectedCategory);

      let desc = text
        .replace(/\d+\.?\d*/g, '')
        .replace(/soles?|nuevos soles|s\/\.?/gi, '')
        .replace(/gasté|pagué|compré|ingreso|ganancia|cobré|recibí/gi, '')
        .replace(/en|de|para|por/gi, '')
        .trim();
      
      if (desc.length > 3) {
        setDescription(desc);
      }

      console.log('✅ [parseVoiceInput] Parseado:', { detectedType, detectedAmount, detectedCategory, desc });

      Alert.alert(
        '🎤 Reconocido',
        `Tipo: ${detectedType === 'income' ? 'Ingreso' : 'Gasto'}\nMonto: S/ ${detectedAmount || '0'}\nCategoría: ${detectedCategory}\nDescripción: ${desc || 'Sin descripción'}`,
        [
          { text: 'Editar', style: 'cancel' },
          { 
            text: 'Confirmar', 
            onPress: () => {
              if (detectedAmount) {
                handleSubmit();
              } else {
                Alert.alert('Error', 'No se detectó un monto válido');
              }
            }
          },
        ]
      );
    } catch (error) {
      console.error('❌ [parseVoiceInput] Error:', error);
      Alert.alert('Error', 'No se pudo procesar el texto reconocido');
    }
  };

  const handleTypeChange = (newType: TransactionType) => {
    console.log('🔄 Cambiando tipo a:', newType);
    setType(newType);
    setCategory(newType === 'expense' ? 'Comida' : 'Salario');
  };

  const handleSubmit = async () => {
    try {
      console.log('💾 [handleSubmit] Iniciando...');
      
      if (!amount || !category || !description) {
        Alert.alert('Error', 'Por favor completa todos los campos');
        return;
      }

      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        Alert.alert('Error', 'Ingresa un monto válido');
        return;
      }

      if (!canAddTransaction()) {
        Alert.alert(
          'Límite Alcanzado',
          'Has alcanzado el límite de 50 transacciones mensuales. Actualiza a Premium.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Ver Planes', onPress: () => router.push('/(tabs)/upgrade') },
          ]
        );
        return;
      }

      setLoading(true);
      console.log('💾 [handleSubmit] Enviando al backend...');

      const today = new Date();
      const dateString = today.toISOString().split('T')[0];

      const response = await axios.post(`${API_URL}/transactions`, {
        userId: user?.id,
        type,
        amount: numAmount,
        category,
        description,
        transactionDate: dateString,
      });

      console.log('✅ [handleSubmit] Respuesta backend:', response.data);

      addTransaction({
        id: response.data.transaction.id.toString(),
        userId: user?.id,
        type,
        amount: numAmount,
        category,
        description,
        date: new Date(),
        currency: 'PEN',
      });

      incrementTransactions();

      if (user?.id) {
        await syncWithBackend(user.id);
      }

      console.log('✅ [handleSubmit] Transacción agregada');

      Alert.alert('¡Listo! ✅', 'Transacción agregada exitosamente', [
        { text: 'Agregar otra', onPress: () => resetForm() },
        { text: 'Ver Dashboard', onPress: () => router.push('/(tabs)/home') },
      ]);
      
    } catch (error: any) {
      console.error('❌ [handleSubmit] Error:', error);
      
      if (error.response?.status === 403) {
        Alert.alert('Límite Alcanzado', error.response.data.message);
      } else {
        Alert.alert('Error', `No se pudo crear la transacción: ${error.message || 'Error desconocido'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    console.log('🔄 Reseteando formulario');
    setAmount('');
    setDescription('');
    setCategory(type === 'expense' ? 'Comida' : 'Salario');
    setRecognizedText('');
  };

  const openScanner = async () => {
    try {
      console.log('📷 [openScanner] Iniciando...');
      
      const hasPermission = await PermissionsService.requestCameraPermission();
      
      if (!hasPermission) {
        console.log('❌ [openScanner] Permiso de cámara denegado');
        Alert.alert(
          'Permiso Requerido',
          'FINIA necesita acceso a la cámara para escanear recibos.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Abrir Configuración', onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }
      
      console.log('✅ [openScanner] Permiso concedido, abriendo escáner...');
      router.push('/(tabs)/ocr');
      
    } catch (error) {
      console.error('❌ [openScanner] Error:', error);
      Alert.alert('Error', 'No se pudo abrir el escáner');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <ScrollView 
          style={styles.scroll} 
          keyboardShouldPersistTaps="handled" 
          contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            
            {/* Header con título */}
            <View style={styles.header}>
              <Text style={styles.title}>Nueva Transacción</Text>
              <Text style={styles.subtitle}>Registra tus movimientos financieros</Text>
            </View>

            {/* Botones de acción (Cámara y Voz) */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.cameraButton]} 
                onPress={openScanner}
              >
                <Text style={styles.actionIcon}>📷</Text>
                <Text style={styles.actionLabel}>Escanear</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.voiceButton, isListening && styles.voiceButtonActive]} 
                onPress={isListening ? stopListening : startListening}
              >
                <Text style={styles.actionIcon}>{isListening ? '⏸️' : '🎤'}</Text>
                <Text style={styles.actionLabel}>{isListening ? 'Detener' : 'Voz'}</Text>
              </TouchableOpacity>
            </View>

            {/* Listening indicator */}
            {isListening && (
              <View style={styles.listeningCard}>
                <View style={styles.listeningDot} />
                <Text style={styles.listeningText}>Escuchando... Di tu transacción</Text>
              </View>
            )}

            {/* Type selector */}
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeButton, type === 'expense' && styles.typeButtonExpenseActive]}
                onPress={() => handleTypeChange('expense')}
              >
                <Text style={[styles.typeIcon, type === 'expense' && styles.typeIconActive]}>💸</Text>
                <Text style={[styles.typeText, type === 'expense' && styles.typeTextExpenseActive]}>Gasto</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.typeButton, type === 'income' && styles.typeButtonIncomeActive]}
                onPress={() => handleTypeChange('income')}
              >
                <Text style={[styles.typeIcon, type === 'income' && styles.typeIconActive]}>💰</Text>
                <Text style={[styles.typeText, type === 'income' && styles.typeTextIncomeActive]}>Ingreso</Text>
              </TouchableOpacity>
            </View>

            {/* Amount */}
            <View style={styles.field}>
              <Text style={styles.label}>Monto</Text>
              <View style={[styles.amountContainer, type === 'income' && styles.amountContainerIncome]}>
                <Text style={[styles.currency, type === 'income' && styles.currencyIncome]}>S/</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  placeholderTextColor="#6B7280"
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Category */}
            <View style={styles.field}>
              <Text style={styles.label}>Categoría</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
                {categories[type].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryButton, 
                      category === cat && (type === 'expense' ? styles.categoryButtonExpenseActive : styles.categoryButtonIncomeActive)
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[
                      styles.categoryText, 
                      category === cat && styles.categoryTextActive
                    ]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Description */}
            <View style={styles.field}>
              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Almuerzo con familia"
                placeholderTextColor="#6B7280"
                value={description}
                onChangeText={setDescription}
                maxLength={100}
                returnKeyType="done"
                blurOnSubmit={true}
                multiline
                numberOfLines={2}
              />
              <Text style={styles.hint}>{description.length}/100</Text>
            </View>

            {/* Submit button */}
            <TouchableOpacity
              style={[
                styles.submitButton, 
                loading && styles.submitButtonDisabled,
                type === 'income' && styles.submitButtonIncome
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0A0E27" />
              ) : (
                <>
                  <Text style={styles.submitButtonIcon}>{type === 'expense' ? '💸' : '💰'}</Text>
                  <Text style={styles.submitButtonText}>
                    {type === 'expense' ? 'Registrar Gasto' : 'Registrar Ingreso'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Free plan warning */}
            {!user?.isPremium && (
              <View style={styles.warningCard}>
                <Text style={styles.warningIcon}>📊</Text>
                <View style={styles.warningContent}>
                  <Text style={styles.warningTitle}>Plan FREE</Text>
                  <Text style={styles.warningText}>
                    {user?.transactionsThisMonth || 0} / 50 transacciones este mes
                  </Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E27' },
  scroll: { flex: 1 },
  content: { padding: 20 },
  
  // Header
  header: { marginBottom: 24 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#9CA3AF' },
  
  // Action Buttons (Cámara y Voz)
  actionButtons: { 
    flexDirection: 'row', 
    gap: 12, 
    marginBottom: 24 
  },
  actionButton: { 
    flex: 1, 
    backgroundColor: '#151B3D', 
    borderRadius: 16, 
    padding: 20, 
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2D3748'
  },
  cameraButton: {
    borderColor: '#8B5CF6'
  },
  voiceButton: {
    borderColor: '#00D4AA'
  },
  voiceButtonActive: { 
    backgroundColor: '#00D4AA',
    borderColor: '#00D4AA'
  },
  actionIcon: { fontSize: 32, marginBottom: 8 },
  actionLabel: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  
  // Listening indicator
  listeningCard: { 
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: '#1E2749', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#00D4AA'
  },
  listeningDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00D4AA',
    marginRight: 12,
    shadowColor: '#00D4AA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4
  },
  listeningText: { fontSize: 15, color: '#00D4AA', fontWeight: '600' },
  
  // Type Selector
  typeSelector: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  typeButton: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#151B3D', 
    borderRadius: 16, 
    padding: 18,
    borderWidth: 2,
    borderColor: '#2D3748'
  },
  typeButtonExpenseActive: { 
    borderColor: '#EF4444',
    backgroundColor: '#1E2749'
  },
  typeButtonIncomeActive: { 
    borderColor: '#10B981',
    backgroundColor: '#1E2749'
  },
  typeIcon: { fontSize: 24, marginRight: 8 },
  typeIconActive: {},
  typeText: { fontSize: 16, fontWeight: '600', color: '#9CA3AF' },
  typeTextExpenseActive: { color: '#EF4444' },
  typeTextIncomeActive: { color: '#10B981' },
  
  // Form Fields
  field: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#9CA3AF', marginBottom: 10 },
  
  // Amount
  amountContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#151B3D', 
    borderRadius: 16, 
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#EF4444'
  },
  amountContainerIncome: {
    borderColor: '#10B981'
  },
  currency: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#EF4444', 
    marginRight: 8 
  },
  currencyIncome: {
    color: '#10B981'
  },
  amountInput: { 
    flex: 1, 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: '#FFFFFF', 
    paddingVertical: 16 
  },
  
  // Categories
  categories: { flexDirection: 'row' },
  categoryButton: { 
    backgroundColor: '#151B3D', 
    borderRadius: 12, 
    paddingHorizontal: 18, 
    paddingVertical: 12, 
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#2D3748'
  },
  categoryButtonExpenseActive: { 
    backgroundColor: '#EF4444',
    borderColor: '#EF4444'
  },
  categoryButtonIncomeActive: { 
    backgroundColor: '#10B981',
    borderColor: '#10B981'
  },
  categoryText: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  categoryTextActive: { color: '#FFFFFF' },
  
  // Description
  input: { 
    backgroundColor: '#151B3D', 
    borderRadius: 16, 
    padding: 18, 
    fontSize: 16, 
    color: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#2D3748',
    minHeight: 80,
    textAlignVertical: 'top'
  },
  hint: { fontSize: 12, color: '#6B7280', textAlign: 'right', marginTop: 6 },
  
  // Submit Button
  submitButton: { 
    backgroundColor: '#EF4444', 
    borderRadius: 16, 
    padding: 20, 
    alignItems: 'center',
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  submitButtonIncome: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981'
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonIcon: { fontSize: 20, marginRight: 8 },
  submitButtonText: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  
  // Warning Card
  warningCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#1E2749', 
    borderRadius: 16, 
    padding: 18, 
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#F59E0B'
  },
  warningIcon: { fontSize: 28, marginRight: 12 },
  warningContent: { flex: 1 },
  warningTitle: { fontSize: 14, fontWeight: 'bold', color: '#F59E0B', marginBottom: 2 },
  warningText: { fontSize: 13, color: '#9CA3AF' },
});