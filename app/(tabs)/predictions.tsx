import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import axios from 'axios';
import authService from '@/services/auth/authService';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://finia.seguricloud.com/api';

export default function PredictionsScreen() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'expenses' | 'anomalies' | 'savings'>('expenses');
  const [predictions, setPredictions] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = await authService.getToken();

      if (activeTab === 'expenses') {
        const response = await axios.get(`${API_URL}/predictions/expenses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPredictions(response.data.predictions);
      } else if (activeTab === 'anomalies') {
        const response = await axios.get(`${API_URL}/predictions/anomalies`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAnomalies(response.data.anomalies || []);
      } else if (activeTab === 'savings') {
        const response = await axios.get(`${API_URL}/predictions/savings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuggestions(response.data.suggestions);
      }
    } catch (error: any) {
      console.error('Error loadData:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Atrás</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Predicciones IA</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'expenses' && styles.activeTab]}
          onPress={() => setActiveTab('expenses')}
        >
          <Text style={[styles.tabText, activeTab === 'expenses' && styles.activeTabText]}>
            Gastos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'anomalies' && styles.activeTab]}
          onPress={() => setActiveTab('anomalies')}
        >
          <Text style={[styles.tabText, activeTab === 'anomalies' && styles.activeTabText]}>
            Anomalías
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'savings' && styles.activeTab]}
          onPress={() => setActiveTab('savings')}
        >
          <Text style={[styles.tabText, activeTab === 'savings' && styles.activeTabText]}>
            Ahorro
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} />}>
        {loading && !predictions && !suggestions && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00D4AA" />
            <Text style={styles.loadingText}>Analizando tus datos...</Text>
          </View>
        )}

        {/* Tab: Predicción de Gastos */}
        {activeTab === 'expenses' && predictions && (
          <View style={styles.content}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Predicción del Próximo Mes</Text>
              <Text style={styles.summaryAmount}>S/ {predictions.total_predicted.toFixed(2)}</Text>
              <Text style={styles.summarySubtext}>Basado en {predictions.analysis_period}</Text>
            </View>

            <Text style={styles.sectionTitle}>Por Categoría</Text>
            {predictions.predictions.map((pred: any, index: number) => (
              <View key={index} style={styles.predictionCard}>
                <View style={styles.predictionHeader}>
                  <Text style={styles.predictionCategory}>{pred.category}</Text>
                  <View style={[styles.confidenceBadge, getConfidenceStyle(pred.confidence)]}>
                    <Text style={styles.confidenceText}>{pred.confidence}</Text>
                  </View>
                </View>
                <Text style={styles.predictionAmount}>S/ {pred.predicted_amount.toFixed(2)}</Text>
                <Text style={styles.predictionDetail}>
                  Día estimado: {pred.predicted_day} • {pred.based_on_transactions} transacciones
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Tab: Anomalías */}
        {activeTab === 'anomalies' && (
          <View style={styles.content}>
            {anomalies.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>✅</Text>
                <Text style={styles.emptyText}>Todo normal</Text>
                <Text style={styles.emptySubtext}>No se detectaron gastos inusuales</Text>
              </View>
            ) : (
              <>
                <Text style={styles.warningText}>
                  ⚠️ Detectamos {anomalies.length} gasto{anomalies.length > 1 ? 's' : ''} inusual
                  {anomalies.length > 1 ? 'es' : ''}
                </Text>
                {anomalies.map((anomaly: any, index: number) => (
                  <View key={index} style={styles.anomalyCard}>
                    <View style={styles.anomalyHeader}>
                      <Text style={styles.anomalyCategory}>{anomaly.category}</Text>
                      <Text style={styles.anomalyDate}>
                        {new Date(anomaly.date).toLocaleDateString('es-ES')}
                      </Text>
                    </View>
                    <Text style={styles.anomalyAmount}>S/ {anomaly.amount.toFixed(2)}</Text>
                    <Text style={styles.anomalyDetail}>
                      Promedio: S/ {anomaly.average.toFixed(2)} • Desviación: {anomaly.deviation > 0 ? '+' : ''}
                      {anomaly.deviation}%
                    </Text>
                  </View>
                ))}
              </>
            )}
          </View>
        )}

        {/* Tab: Sugerencias de Ahorro */}
        {activeTab === 'savings' && suggestions && (
          <View style={styles.content}>
            {suggestions.error ? (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>{suggestions.error}</Text>
                <TouchableOpacity
                  style={styles.configButton}
                  onPress={() => router.push('/onboarding' as any)}
                >
                  <Text style={styles.configButtonText}>Configurar Ingresos</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.currentRateCard}>
                  <Text style={styles.currentRateLabel}>Tu Tasa de Ahorro Actual</Text>
                  <Text style={styles.currentRateValue}>{suggestions.current_rate.toFixed(1)}%</Text>
                  <Text style={styles.currentRateAmount}>
                    S/ {suggestions.current_savings.toFixed(2)} / mes
                  </Text>
                </View>

                <Text style={styles.sectionTitle}>Recomendaciones</Text>
                {suggestions.recommendations.map((rec: any, index: number) => (
                  <View key={index} style={[styles.recommendationCard, getRecommendationStyle(rec.level)]}>
                    <Text style={styles.recommendationLevel}>{getLevelEmoji(rec.level)}</Text>
                    <Text style={styles.recommendationTitle}>{rec.title}</Text>
                    <Text style={styles.recommendationTarget}>Meta: {rec.target}</Text>
                    <View style={styles.tipsList}>
                      {rec.tips.map((tip: string, tipIndex: number) => (
                        <Text key={tipIndex} style={styles.tipText}>
                          • {tip}
                        </Text>
                      ))}
                    </View>
                  </View>
                ))}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const getConfidenceStyle = (confidence: string) => {
  const styles: Record<string, any> = {
    high: { backgroundColor: '#00D4AA' },
    medium: { backgroundColor: '#FFA726' },
    low: { backgroundColor: '#FF6B6B' },
  };
  return styles[confidence] || styles.low;
};

const getRecommendationStyle = (level: string) => {
  const styles: Record<string, any> = {
    critical: { borderColor: '#FF6B6B', borderWidth: 2 },
    good: { borderColor: '#00D4AA', borderWidth: 2 },
    excellent: { borderColor: '#4CAF50', borderWidth: 2 },
  };
  return styles[level] || {};
};

const getLevelEmoji = (level: string) => {
  const emojis: Record<string, string> = {
    critical: '🚨',
    good: '👍',
    excellent: '🌟',
  };
  return emojis[level] || '💡';
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E27' },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  backButton: { color: '#00D4AA', fontSize: 16, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#1A1F3A',
    borderRadius: 12,
    alignItems: 'center',
  },
  activeTab: { backgroundColor: '#00D4AA' },
  tabText: { color: '#8F92A1', fontSize: 14, fontWeight: '600' },
  activeTabText: { color: '#0A0E27' },
  
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  
  loadingContainer: { alignItems: 'center', marginTop: 60 },
  loadingText: { color: '#8F92A1', fontSize: 16, marginTop: 16 },
  
  summaryCard: {
    backgroundColor: '#1A1F3A',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  summaryTitle: { fontSize: 16, color: '#8F92A1', marginBottom: 12 },
  summaryAmount: { fontSize: 36, fontWeight: 'bold', color: '#00D4AA', marginBottom: 8 },
  summarySubtext: { fontSize: 14, color: '#8F92A1' },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  
  predictionCard: {
    backgroundColor: '#1A1F3A',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  predictionCategory: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
  confidenceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: { fontSize: 12, color: '#0A0E27', fontWeight: 'bold' },
  predictionAmount: { fontSize: 24, fontWeight: 'bold', color: '#00D4AA', marginBottom: 8 },
  predictionDetail: { fontSize: 12, color: '#8F92A1' },
  
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 18, color: '#FFFFFF', fontWeight: 'bold', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#8F92A1' },
  
  warningText: {
    fontSize: 16,
    color: '#FF9800',
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  
  anomalyCard: {
    backgroundColor: '#1A1F3A',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  anomalyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  anomalyCategory: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
  anomalyDate: { fontSize: 12, color: '#8F92A1' },
  anomalyAmount: { fontSize: 24, fontWeight: 'bold', color: '#FF6B6B', marginBottom: 8 },
  anomalyDetail: { fontSize: 12, color: '#8F92A1' },
  
  currentRateCard: {
    backgroundColor: '#1A1F3A',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  currentRateLabel: { fontSize: 14, color: '#8F92A1', marginBottom: 12 },
  currentRateValue: { fontSize: 48, fontWeight: 'bold', color: '#00D4AA', marginBottom: 8 },
  currentRateAmount: { fontSize: 16, color: '#FFFFFF' },
  
  recommendationCard: {
    backgroundColor: '#1A1F3A',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  recommendationLevel: { fontSize: 32, marginBottom: 12 },
  recommendationTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  recommendationTarget: { fontSize: 14, color: '#00D4AA', marginBottom: 16 },
  tipsList: { gap: 8 },
  tipText: { fontSize: 14, color: '#8F92A1' },
  
  errorCard: {
    backgroundColor: '#1A1F3A',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  errorText: { fontSize: 16, color: '#FF9800', marginBottom: 20, textAlign: 'center' },
  configButton: {
    backgroundColor: '#00D4AA',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  configButtonText: { color: '#0A0E27', fontSize: 16, fontWeight: 'bold' },
});