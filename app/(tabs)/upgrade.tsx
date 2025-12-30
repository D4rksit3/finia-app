import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '@/store/userStore';
import { router } from 'expo-router';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.40.246:3000/api';

interface Plan {
  id: 'free' | 'premium' | 'enterprise';
  name: string;
  price: string;
  priceAmount: number;
  description: string;
  features: string[];
  color: string;
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 'Gratis',
    priceAmount: 0,
    description: 'Para comenzar a gestionar tus finanzas',
    color: '#6B7280',
    features: [
      '50 transacciones por mes',
      'Dashboard básico',
      'Categorización manual',
      'Reportes básicos',
      'Soporte por email',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 'S/ 29',
    priceAmount: 29,
    description: 'Para usuarios que quieren más control',
    color: '#00D4AA',
    popular: true,
    features: [
      'Transacciones ilimitadas',
      'Dashboard avanzado con gráficos',
      'OCR de recibos con IA',
      'Reportes avanzados (PDF/Excel)',
      'Asistente IA sin límites',
      'Integración bancaria',
      'Alertas personalizadas',
      'Soporte prioritario 24/7',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'S/ 99',
    priceAmount: 99,
    description: 'Para empresas y equipos',
    color: '#6C5CE7',
    features: [
      'Todo de Premium +',
      'Múltiples usuarios',
      'Dashboard empresarial',
      'API access',
      'Reportes personalizados',
      'Integración con ERP',
      'Soporte dedicado',
      'Capacitación personalizada',
    ],
  },
];

export default function UpgradeScreen() {
  const { user, updatePlan } = useUserStore();
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (plan: Plan) => {
    if (plan.id === user?.plan) {
      Alert.alert('Plan Actual', `Ya tienes el plan ${plan.name}`);
      return;
    }

    if (plan.id === 'free') {
      Alert.alert(
        'Cambiar a Free',
        '¿Estás seguro de cambiar al plan Free? Perderás acceso a las funciones Premium.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Confirmar',
            style: 'destructive',
            onPress: () => processPlanChange(plan),
          },
        ]
      );
      return;
    }

    Alert.alert(
      `Actualizar a ${plan.name}`,
      `Estás a punto de actualizar al plan ${plan.name} por ${plan.price}/mes.\n\n📝 Por ahora es una simulación. Los métodos de pago se agregarán próximamente.\n\n¿Continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          onPress: () => processPlanChange(plan),
        },
      ]
    );
  };

const processPlanChange = async (plan: Plan) => {
  setLoading(plan.id);

  try {
    console.log('📊 [Upgrade] Procesando cambio a:', plan.id);
    
    await new Promise(resolve => setTimeout(resolve, 1500));

    const success = await updatePlan(plan.id);

    setLoading(null);

    if (success) {
      Alert.alert(
        '¡Éxito! 🎉',
        `Has cambiado al plan ${plan.name}.`,
        [
          {
            text: 'Ver Dashboard',
            onPress: () => router.push('/(tabs)/home'),
          },
        ]
      );
    } else {
      Alert.alert(
        'Error',
        'No se pudo actualizar el plan. Verifica tu conexión.'
      );
    }
  } catch (error: any) {
    console.error('❌ [Upgrade] Error:', error);
    setLoading(null);
    Alert.alert('Error', 'Ocurrió un error inesperado.');
  }
};




  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Atrás</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Planes</Text>
          <View style={{ width: 60 }} />
        </View>

        <Text style={styles.subtitle}>
          Elige el plan perfecto para ti
        </Text>

        {/* Plans */}
        {plans.map((plan) => (
          <View
            key={plan.id}
            style={[
              styles.planCard,
              user?.plan === plan.id && styles.planCardActive,
              plan.popular && styles.planCardPopular,
            ]}
          >
            {plan.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>MÁS POPULAR</Text>
              </View>
            )}

            <View style={styles.planHeader}>
              <Text style={styles.planName}>{plan.name}</Text>
              {user?.plan === plan.id && (
                <View style={styles.currentBadge}>
                  <Text style={styles.currentText}>ACTUAL</Text>
                </View>
              )}
            </View>

            <Text style={styles.planPrice}>{plan.price}</Text>
            <Text style={styles.planPriceSubtext}>
              {plan.priceAmount > 0 ? 'por mes' : 'para siempre'}
            </Text>
            <Text style={styles.planDescription}>{plan.description}</Text>

            <View style={styles.features}>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.feature}>
                  <Text style={styles.featureIcon}>✓</Text>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.planButton,
                { backgroundColor: plan.color },
                user?.plan === plan.id && styles.planButtonActive,
                loading === plan.id && styles.planButtonLoading,
              ]}
              onPress={() => handleUpgrade(plan)}
              disabled={loading !== null}
            >
              {loading === plan.id ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.planButtonText}>
                  {user?.plan === plan.id
                    ? 'Plan Actual'
                    : plan.id === 'free'
                    ? 'Cambiar a Free'
                    : 'Actualizar Ahora'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ))}

        {/* Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>💳</Text>
          <Text style={styles.infoTitle}>Métodos de pago próximamente</Text>
          <Text style={styles.infoText}>
            Por ahora puedes probar todas las funciones Premium de forma gratuita.
            Pronto agregaremos integración con Culqi, Niubiz y otros métodos de pago peruanos.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E27' },
  scroll: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  backButton: { fontSize: 16, color: '#00D4AA', fontWeight: '600' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  planCard: {
    backgroundColor: '#151B3D',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#2D3748',
    position: 'relative',
  },
  planCardActive: {
    borderColor: '#00D4AA',
    backgroundColor: '#1E2749',
  },
  planCardPopular: {
    borderColor: '#00D4AA',
    borderWidth: 3,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: '50%',
    transform: [{ translateX: -60 }],
    backgroundColor: '#00D4AA',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0A0E27',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  currentBadge: {
    backgroundColor: '#00D4AA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  currentText: { fontSize: 10, fontWeight: 'bold', color: '#0A0E27' },
  planPrice: { fontSize: 36, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  planPriceSubtext: { fontSize: 14, color: '#9CA3AF', marginBottom: 12 },
  planDescription: { fontSize: 14, color: '#9CA3AF', marginBottom: 20 },
  features: { marginBottom: 24 },
  feature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  featureIcon: { fontSize: 18, color: '#00D4AA', marginRight: 12, marginTop: 2 },
  featureText: { fontSize: 14, color: '#FFFFFF', flex: 1, lineHeight: 20 },
  planButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  planButtonActive: {
    opacity: 0.7,
  },
  planButtonLoading: {
    opacity: 0.8,
  },
  planButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  infoCard: {
    backgroundColor: '#151B3D',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D3748',
  },
  infoIcon: { fontSize: 48, marginBottom: 12 },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});
