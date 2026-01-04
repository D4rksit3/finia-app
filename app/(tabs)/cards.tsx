import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import axios from 'axios';
import authService from '@/services/auth/authService';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://finia.seguricloud.com/api';

export default function CardsScreen() {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    credit_limit: '',
    bank: '',
    closing_day: '1',
    payment_day: '15',
  });

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      setLoading(true);
      const token = await authService.getToken();
      const response = await axios.get(`${API_URL}/cards`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCards(response.data.cards || []);
    } catch (error: any) {
      console.error('Error loadCards:', error);
      Alert.alert('Error', 'No se pudieron cargar las tarjetas');
    } finally {
      setLoading(false);
    }
  };

  const addCard = async () => {
    try {
      if (!formData.name || !formData.credit_limit) {
        Alert.alert('Error', 'Completa los campos requeridos');
        return;
      }

      const token = await authService.getToken();
      await axios.post(`${API_URL}/cards`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Alert.alert('Éxito', 'Tarjeta agregada');
      setModalVisible(false);
      setFormData({ name: '', credit_limit: '', bank: '', closing_day: '1', payment_day: '15' });
      loadCards();
    } catch (error: any) {
      console.error('Error addCard:', error);
      Alert.alert('Error', 'No se pudo agregar la tarjeta');
    }
  };

  const deleteCard = async (cardId: number) => {
    Alert.alert('Confirmar', '¿Eliminar esta tarjeta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await authService.getToken();
            await axios.delete(`${API_URL}/cards/${cardId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            Alert.alert('Éxito', 'Tarjeta eliminada');
            loadCards();
          } catch (error) {
            Alert.alert('Error', 'No se pudo eliminar');
          }
        },
      },
    ]);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return '#FF6B6B';
    if (percentage >= 80) return '#FF9800';
    if (percentage >= 60) return '#FFA726';
    return '#00D4AA';
  };

  const totalCreditUsed = cards.reduce((sum, c) => sum + parseFloat(c.current_balance || 0), 0);
  const totalCreditLimit = cards.reduce((sum, c) => sum + parseFloat(c.credit_limit || 0), 0);
  const overallUsage = totalCreditLimit > 0 ? (totalCreditUsed / totalCreditLimit) * 100 : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Atrás</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Tarjetas de Crédito</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text style={styles.addButton}>+ Agregar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={loadCards} />}>
        {/* Resumen General */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Uso Total de Crédito</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(overallUsage, 100)}%`, backgroundColor: getUsageColor(overallUsage) }]} />
          </View>
          <Text style={styles.summaryText}>
            S/ {totalCreditUsed.toFixed(2)} / S/ {totalCreditLimit.toFixed(2)} ({overallUsage.toFixed(0)}%)
          </Text>
          {overallUsage >= 80 && (
            <Text style={styles.warningText}>
              ⚠️ {overallUsage >= 90 ? '¡ALERTA! Límite crítico' : 'Cuidado con tu uso de crédito'}
            </Text>
          )}
        </View>

        {/* Lista de Tarjetas */}
        {cards.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💳</Text>
            <Text style={styles.emptyText}>No tienes tarjetas agregadas</Text>
            <Text style={styles.emptySubtext}>Agrega una tarjeta para controlar tus gastos</Text>
          </View>
        ) : (
          cards.map((card) => {
            const usage = (card.current_balance / card.credit_limit) * 100;
            const available = card.credit_limit - card.current_balance;

            return (
              <View key={card.id} style={styles.cardItem}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardName}>{card.name}</Text>
                  <TouchableOpacity onPress={() => deleteCard(card.id)}>
                    <Text style={styles.deleteIcon}>🗑️</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.cardBank}>{card.bank}</Text>

                <View style={styles.cardAmounts}>
                  <View>
                    <Text style={styles.amountLabel}>Usado</Text>
                    <Text style={[styles.amountValue, { color: '#FF6B6B' }]}>
                      S/ {parseFloat(card.current_balance).toFixed(2)}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.amountLabel}>Disponible</Text>
                    <Text style={[styles.amountValue, { color: '#00D4AA' }]}>
                      S/ {available.toFixed(2)}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.amountLabel}>Límite</Text>
                    <Text style={styles.amountValue}>
                      S/ {parseFloat(card.credit_limit).toFixed(2)}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardProgressBar}>
                  <View style={[styles.cardProgressFill, { width: `${Math.min(usage, 100)}%`, backgroundColor: getUsageColor(usage) }]} />
                </View>
                <Text style={[styles.usageText, { color: getUsageColor(usage) }]}>
                  {usage.toFixed(0)}% usado
                </Text>

                <View style={styles.cardDates}>
                  <Text style={styles.dateText}>📅 Cierre: día {card.closing_day}</Text>
                  <Text style={styles.dateText}>💰 Pago: día {card.payment_day}</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal Agregar Tarjeta */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nueva Tarjeta</Text>

            <TextInput
              style={styles.input}
              placeholder="Nombre de la tarjeta"
              placeholderTextColor="#666"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Banco"
              placeholderTextColor="#666"
              value={formData.bank}
              onChangeText={(text) => setFormData({ ...formData, bank: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Límite de crédito"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={formData.credit_limit}
              onChangeText={(text) => setFormData({ ...formData, credit_limit: text })}
            />

            <View style={styles.dateInputs}>
              <View style={styles.dateInputContainer}>
                <Text style={styles.dateLabel}>Día de cierre</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder="1"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  value={formData.closing_day}
                  onChangeText={(text) => setFormData({ ...formData, closing_day: text })}
                />
              </View>

              <View style={styles.dateInputContainer}>
                <Text style={styles.dateLabel}>Día de pago</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder="15"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  value={formData.payment_day}
                  onChangeText={(text) => setFormData({ ...formData, payment_day: text })}
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  setFormData({ name: '', credit_limit: '', bank: '', closing_day: '1', payment_day: '15' });
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveButton} onPress={addCard}>
                <Text style={styles.saveButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

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
  addButton: { color: '#00D4AA', fontSize: 16, fontWeight: '600' },
  
  summaryCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#1A1F3A',
    borderRadius: 16,
  },
  summaryTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12 },
  progressBar: {
    height: 12,
    backgroundColor: '#2A3150',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: { height: '100%' },
  summaryText: { fontSize: 14, color: '#8F92A1', marginBottom: 8 },
  warningText: { fontSize: 14, color: '#FF6B6B', fontWeight: 'bold', marginTop: 8 },
  
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 18, color: '#FFFFFF', fontWeight: 'bold', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#8F92A1', textAlign: 'center' },
  
  cardItem: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    backgroundColor: '#1A1F3A',
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardName: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  deleteIcon: { fontSize: 20 },
  cardBank: { fontSize: 14, color: '#8F92A1', marginBottom: 16 },
  
  cardAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  amountLabel: { fontSize: 12, color: '#8F92A1', marginBottom: 4 },
  amountValue: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
  
  cardProgressBar: {
    height: 8,
    backgroundColor: '#2A3150',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  cardProgressFill: { height: '100%' },
  usageText: { fontSize: 12, fontWeight: 'bold', marginBottom: 16 },
  
  cardDates: { flexDirection: 'row', justifyContent: 'space-between' },
  dateText: { fontSize: 12, color: '#8F92A1' },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1F3A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 20 },
  
  input: {
    backgroundColor: '#0A0E27',
    padding: 16,
    borderRadius: 12,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 16,
  },
  
  dateInputs: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  dateInputContainer: { flex: 1 },
  dateLabel: { fontSize: 12, color: '#8F92A1', marginBottom: 8 },
  dateInput: {
    backgroundColor: '#0A0E27',
    padding: 16,
    borderRadius: 12,
    color: '#FFFFFF',
    fontSize: 16,
  },
  
  modalButtons: { flexDirection: 'row', gap: 12 },
  cancelButton: {
    flex: 1,
    backgroundColor: '#2A3150',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  saveButton: {
    flex: 1,
    backgroundColor: '#00D4AA',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: { color: '#0A0E27', fontSize: 16, fontWeight: 'bold' },
});