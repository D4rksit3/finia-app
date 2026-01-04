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

export default function GoalsScreen() {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [addMoneyModal, setAddMoneyModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    deadline: '',
    category: 'General',
  });
  const [addAmount, setAddAmount] = useState('');

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const token = await authService.getToken();
      const response = await axios.get(`${API_URL}/goals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGoals(response.data.goals || []);
    } catch (error: any) {
      console.error('Error loadGoals:', error);
      Alert.alert('Error', 'No se pudieron cargar las metas');
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async () => {
    try {
      if (!formData.name || !formData.target_amount) {
        Alert.alert('Error', 'Completa los campos requeridos');
        return;
      }

      const token = await authService.getToken();
      await axios.post(`${API_URL}/goals`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Alert.alert('Éxito', 'Meta creada (+20 XP)');
      setModalVisible(false);
      setFormData({ name: '', target_amount: '', deadline: '', category: 'General' });
      loadGoals();
    } catch (error: any) {
      console.error('Error createGoal:', error);
      Alert.alert('Error', 'No se pudo crear la meta');
    }
  };

  const addToGoal = async () => {
    try {
      if (!addAmount || parseFloat(addAmount) <= 0) {
        Alert.alert('Error', 'Ingresa un monto válido');
        return;
      }

      const token = await authService.getToken();
      const response = await axios.post(
        `${API_URL}/goals/${selectedGoal.id}/add`,
        { amount: parseFloat(addAmount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.completed) {
        Alert.alert('🎉 ¡Felicidades!', response.data.message);
      } else {
        Alert.alert('Éxito', 'Progreso actualizado');
      }

      setAddMoneyModal(false);
      setAddAmount('');
      loadGoals();
    } catch (error: any) {
      console.error('Error addToGoal:', error);
      Alert.alert('Error', 'No se pudo actualizar');
    }
  };

  const deleteGoal = async (goalId: number) => {
    Alert.alert('Confirmar', '¿Eliminar esta meta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await authService.getToken();
            await axios.delete(`${API_URL}/goals/${goalId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            Alert.alert('Éxito', 'Meta eliminada');
            loadGoals();
          } catch (error) {
            Alert.alert('Error', 'No se pudo eliminar');
          }
        },
      },
    ]);
  };

  const activeGoals = goals.filter((g) => !g.is_completed);
  const completedGoals = goals.filter((g) => g.is_completed);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Atrás</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Metas de Ahorro</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text style={styles.addButton}>+ Nueva</Text>
        </TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={loadGoals} />}>
        {/* Metas Activas */}
        {activeGoals.length === 0 && completedGoals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyText}>No tienes metas de ahorro</Text>
            <Text style={styles.emptySubtext}>Crea una meta para empezar a ahorrar con propósito</Text>
          </View>
        ) : (
          <>
            {activeGoals.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Activas ({activeGoals.length})</Text>
                {activeGoals.map((goal) => {
                  const progress = (goal.current_amount / goal.target_amount) * 100;
                  const daysRemaining = goal.days_remaining;

                  return (
                    <View key={goal.id} style={styles.goalCard}>
                      <View style={styles.goalHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.goalName}>{goal.name}</Text>
                          <Text style={styles.goalCategory}>{goal.category}</Text>
                        </View>
                        <TouchableOpacity onPress={() => deleteGoal(goal.id)}>
                          <Text style={styles.deleteIcon}>🗑️</Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.amountContainer}>
                        <View>
                          <Text style={styles.currentLabel}>Ahorrado</Text>
                          <Text style={styles.currentAmount}>S/ {parseFloat(goal.current_amount).toFixed(2)}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.targetLabel}>Meta</Text>
                          <Text style={styles.targetAmount}>S/ {parseFloat(goal.target_amount).toFixed(2)}</Text>
                        </View>
                      </View>

                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
                      </View>
                      <Text style={styles.progressText}>{progress.toFixed(0)}% completado</Text>

                      {daysRemaining !== null && (
                        <Text style={styles.deadlineText}>
                          {daysRemaining > 0 ? `⏰ ${daysRemaining} días restantes` : '⚠️ Fecha límite vencida'}
                        </Text>
                      )}

                      <TouchableOpacity
                        style={styles.addButton2}
                        onPress={() => {
                          setSelectedGoal(goal);
                          setAddMoneyModal(true);
                        }}
                      >
                        <Text style={styles.addButtonText}>+ Agregar Dinero</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </>
            )}

            {/* Metas Completadas */}
            {completedGoals.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Completadas ({completedGoals.length})</Text>
                {completedGoals.map((goal) => (
                  <View key={goal.id} style={[styles.goalCard, styles.completedCard]}>
                    <Text style={styles.completedBadge}>✅ Completada</Text>
                    <Text style={styles.goalName}>{goal.name}</Text>
                    <Text style={styles.goalCategory}>{goal.category}</Text>
                    <Text style={styles.completedAmount}>S/ {parseFloat(goal.current_amount).toFixed(2)}</Text>
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Modal Crear Meta */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nueva Meta de Ahorro</Text>

            <TextInput
              style={styles.input}
              placeholder="Nombre de la meta"
              placeholderTextColor="#666"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Monto objetivo (S/)"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={formData.target_amount}
              onChangeText={(text) => setFormData({ ...formData, target_amount: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Fecha límite (YYYY-MM-DD)"
              placeholderTextColor="#666"
              value={formData.deadline}
              onChangeText={(text) => setFormData({ ...formData, deadline: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Categoría"
              placeholderTextColor="#666"
              value={formData.category}
              onChangeText={(text) => setFormData({ ...formData, category: text })}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  setFormData({ name: '', target_amount: '', deadline: '', category: 'General' });
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveButton} onPress={createGoal}>
                <Text style={styles.saveButtonText}>Crear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Agregar Dinero */}
      <Modal visible={addMoneyModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Agregar a: {selectedGoal?.name}</Text>

            <View style={styles.goalSummary}>
              <Text style={styles.summaryText}>
                Actual: S/ {parseFloat(selectedGoal?.current_amount || 0).toFixed(2)}
              </Text>
              <Text style={styles.summaryText}>
                Meta: S/ {parseFloat(selectedGoal?.target_amount || 0).toFixed(2)}
              </Text>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Monto a agregar"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={addAmount}
              onChangeText={setAddAmount}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setAddMoneyModal(false);
                  setAddAmount('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveButton} onPress={addToGoal}>
                <Text style={styles.saveButtonText}>Agregar</Text>
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
  
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 18, color: '#FFFFFF', fontWeight: 'bold', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#8F92A1', textAlign: 'center', paddingHorizontal: 40 },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
  },
  
  goalCard: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    backgroundColor: '#1A1F3A',
    borderRadius: 16,
  },
  completedCard: {
    borderWidth: 2,
    borderColor: '#00D4AA',
  },
  
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  goalName: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  goalCategory: { fontSize: 14, color: '#8F92A1' },
  deleteIcon: { fontSize: 20 },
  
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  currentLabel: { fontSize: 12, color: '#8F92A1', marginBottom: 4 },
  currentAmount: { fontSize: 24, fontWeight: 'bold', color: '#00D4AA' },
  targetLabel: { fontSize: 12, color: '#8F92A1', marginBottom: 4 },
  targetAmount: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  
  progressBar: {
    height: 12,
    backgroundColor: '#2A3150',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: { height: '100%', backgroundColor: '#00D4AA' },
  progressText: { fontSize: 14, color: '#8F92A1', marginBottom: 8 },
  deadlineText: { fontSize: 12, color: '#FFA726', marginBottom: 16 },
  
  addButton2: {
    backgroundColor: '#00D4AA',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: { color: '#0A0E27', fontSize: 16, fontWeight: 'bold' },
  
  completedBadge: {
    fontSize: 16,
    color: '#00D4AA',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  completedAmount: { fontSize: 20, color: '#00D4AA', fontWeight: 'bold', marginTop: 8 },
  
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
  
  goalSummary: {
    backgroundColor: '#0A0E27',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  summaryText: { color: '#8F92A1', fontSize: 14, marginBottom: 4 },
  
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