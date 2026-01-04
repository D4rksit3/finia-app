import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Share,
  Clipboard,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import axios from 'axios';
import authService from '@/services/auth/authService';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://finia.seguricloud.com/api';

export default function ReferralScreen() {
  const [loading, setLoading] = useState(false);
  const [referralData, setReferralData] = useState<any>(null);
  const [codeInput, setCodeInput] = useState('');

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      setLoading(true);
      const token = await authService.getToken();
      const response = await axios.get(`${API_URL}/referral/code`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReferralData(response.data);
    } catch (error: any) {
      console.error('Error loadReferralData:', error);
      Alert.alert('Error', 'No se pudo cargar la información');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (referralData?.referral_code) {
      Clipboard.setString(referralData.referral_code);
      Alert.alert('✅ Copiado', 'Código copiado al portapapeles');
    }
  };

  const shareCode = async () => {
    try {
      if (referralData?.referral_code) {
        await Share.share({
          message: `¡Únete a FINIA y lleva el control de tus finanzas! 💰\n\nUsa mi código de referido: ${referralData.referral_code}\n\n¡Ambos ganamos recompensas! 🎉`,
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const applyCode = async () => {
    try {
      if (!codeInput.trim()) {
        Alert.alert('Error', 'Ingresa un código de referido');
        return;
      }

      const token = await authService.getToken();
      const response = await axios.post(
        `${API_URL}/referral/apply`,
        { referral_code: codeInput.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('¡Éxito! 🎉', response.data.message);
      setCodeInput('');
      loadReferralData();
    } catch (error: any) {
      console.error('Error applyCode:', error);
      Alert.alert('Error', error.response?.data?.error || 'Código inválido');
    }
  };

  const claimReward = async () => {
    try {
      const token = await authService.getToken();
      const response = await axios.post(
        `${API_URL}/referral/claim`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('¡Recompensa Reclamada! 🎉', response.data.message);
      loadReferralData();
    } catch (error: any) {
      console.error('Error claimReward:', error);
      Alert.alert('Error', error.response?.data?.error || 'No se pudo reclamar');
    }
  };

  if (!referralData) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  const unclaimedCount = referralData.referrals?.filter((r: any) => !r.reward_claimed).length || 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Atrás</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Referidos</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={loadReferralData} />}>
        {/* Tu Código */}
        <View style={styles.codeCard}>
          <Text style={styles.codeTitle}>Tu Código de Referido</Text>
          <View style={styles.codeContainer}>
            <Text style={styles.codeText}>{referralData.referral_code}</Text>
          </View>
          <View style={styles.codeButtons}>
            <TouchableOpacity style={styles.copyButton} onPress={copyCode}>
              <Text style={styles.copyButtonText}>📋 Copiar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton} onPress={shareCode}>
              <Text style={styles.shareButtonText}>📤 Compartir</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Estadísticas */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Tus Referidos</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{referralData.stats?.total_referrals || 0}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{referralData.stats?.completed_referrals || 0}</Text>
              <Text style={styles.statLabel}>Activos</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{unclaimedCount}</Text>
              <Text style={styles.statLabel}>Sin reclamar</Text>
            </View>
          </View>

          {unclaimedCount > 0 && (
            <TouchableOpacity style={styles.claimButton} onPress={claimReward}>
              <Text style={styles.claimButtonText}>🎁 Reclamar Recompensas</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Recompensas */}
        <View style={styles.rewardsCard}>
          <Text style={styles.rewardsTitle}>Recompensas</Text>
          <View style={styles.rewardItem}>
            <Text style={styles.rewardIcon}>⭐</Text>
            <Text style={styles.rewardText}>{referralData.rewards?.per_referral} XP por cada referido</Text>
          </View>
          <View style={styles.rewardItem}>
            <Text style={styles.rewardIcon}>👑</Text>
            <Text style={styles.rewardText}>
              {referralData.rewards?.premium_bonus} días premium cada 5 referidos
            </Text>
          </View>
        </View>

        {/* Aplicar Código */}
        <View style={styles.applyCard}>
          <Text style={styles.applyTitle}>¿Tienes un código de referido?</Text>
          <TextInput
            style={styles.input}
            placeholder="Ingresa el código"
            placeholderTextColor="#666"
            value={codeInput}
            onChangeText={setCodeInput}
            autoCapitalize="characters"
          />
          <TouchableOpacity style={styles.applyButton} onPress={applyCode}>
            <Text style={styles.applyButtonText}>Aplicar Código</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de Referidos */}
        {referralData.referrals && referralData.referrals.length > 0 && (
          <View style={styles.listCard}>
            <Text style={styles.listTitle}>Tus Referidos ({referralData.referrals.length})</Text>
            {referralData.referrals.map((ref: any) => (
              <View key={ref.id} style={styles.referralItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.referralName}>{ref.name || 'Usuario'}</Text>
                  <Text style={styles.referralDate}>
                    {new Date(ref.created_at).toLocaleDateString('es-ES')}
                  </Text>
                </View>
                <View style={[styles.statusBadge, ref.reward_claimed && styles.claimedBadge]}>
                  <Text style={styles.statusText}>
                    {ref.reward_claimed ? '✅ Reclamado' : '🎁 Pendiente'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E27' },
  loadingText: { color: '#FFFFFF', fontSize: 18, textAlign: 'center', marginTop: 100 },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  backButton: { color: '#00D4AA', fontSize: 16, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  
  codeCard: {
    margin: 20,
    padding: 24,
    backgroundColor: '#1A1F3A',
    borderRadius: 16,
    alignItems: 'center',
  },
  codeTitle: { fontSize: 16, color: '#8F92A1', marginBottom: 16 },
  codeContainer: {
    backgroundColor: '#0A0E27',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 16,
  },
  codeText: { fontSize: 28, fontWeight: 'bold', color: '#00D4AA', letterSpacing: 2 },
  codeButtons: { flexDirection: 'row', gap: 12 },
  copyButton: {
    flex: 1,
    backgroundColor: '#2A3150',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  copyButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  shareButton: {
    flex: 1,
    backgroundColor: '#00D4AA',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  shareButtonText: { color: '#0A0E27', fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  
  statsCard: {
    margin: 20,
    marginTop: 0,
    padding: 24,
    backgroundColor: '#1A1F3A',
    borderRadius: 16,
  },
  statsTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 32, fontWeight: 'bold', color: '#00D4AA', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#8F92A1' },
  
  claimButton: {
    backgroundColor: '#00D4AA',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  claimButtonText: { color: '#0A0E27', fontSize: 16, fontWeight: 'bold' },
  
  rewardsCard: {
    margin: 20,
    marginTop: 0,
    padding: 24,
    backgroundColor: '#1A1F3A',
    borderRadius: 16,
  },
  rewardsTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 16 },
  rewardItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  rewardIcon: { fontSize: 24, marginRight: 12 },
  rewardText: { fontSize: 14, color: '#8F92A1', flex: 1 },
  
  applyCard: {
    margin: 20,
    marginTop: 0,
    padding: 24,
    backgroundColor: '#1A1F3A',
    borderRadius: 16,
  },
  applyTitle: { fontSize: 16, color: '#FFFFFF', marginBottom: 16, textAlign: 'center' },
  input: {
    backgroundColor: '#0A0E27',
    padding: 16,
    borderRadius: 12,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  applyButton: {
    backgroundColor: '#00D4AA',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: { color: '#0A0E27', fontSize: 16, fontWeight: 'bold' },
  
  listCard: {
    margin: 20,
    marginTop: 0,
    padding: 24,
    backgroundColor: '#1A1F3A',
    borderRadius: 16,
  },
  listTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 16 },
  referralItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A3150',
  },
  referralName: { fontSize: 16, color: '#FFFFFF', fontWeight: '600', marginBottom: 4 },
  referralDate: { fontSize: 12, color: '#8F92A1' },
  statusBadge: {
    backgroundColor: '#2A3150',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  claimedBadge: { backgroundColor: 'rgba(0, 212, 170, 0.2)' },
  statusText: { fontSize: 12, color: '#8F92A1', fontWeight: 'bold' },
});
