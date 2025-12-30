import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '@/store/userStore';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface SavingGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  icon: string;
}

export default function GoalsScreen() {
  const { user } = useUserStore();
  const [goals, setGoals] = useState<SavingGoal[]>([
    {
      id: '1',
      name: 'Fondo de Emergencia',
      targetAmount: 5000,
      currentAmount: 1200,
      deadline: '2025-06-30',
      icon: '🛡️',
    },
    {
      id: '2',
      name: 'Viaje a Cusco',
      targetAmount: 2000,
      currentAmount: 450,
      deadline: '2025-07-15',
      icon: '✈️',
    },
  ]);
  const [modalVisible, setModalVisible] = useState(false);

  const handleAddGoal = () => {
    if (user?.isPremium) {
      setModalVisible(true);
    } else {
      Alert.alert('Premium', 'Las metas de ahorro requieren el plan Premium', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ver Planes', onPress: () => router.push('/(tabs)/upgrade') },
      ]);
    }
  };

  const getProgress = (goal: SavingGoal) => {
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  };

  const getDaysRemaining = (deadline: string) => {
    const today = new Date();
    const target = new Date(deadline);
    const diff = target.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (!user?.isPremium) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.locked}>
          <Ionicons name="flag" size={80} color="#00D4AA" />
          <Text style={styles.lockedTitle}>Metas de Ahorro</Text>
          <Text style={styles.lockedText}>
            Establece metas de ahorro y alcánzalas con ayuda de tu asistente financiero. Disponible en Premium.
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
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Atrás</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Metas de Ahorro</Text>
          <TouchableOpacity onPress={handleAddGoal}>
            <Text style={styles.addButton}>+ Nueva</Text>
          </TouchableOpacity>
        </View>

        {goals.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="flag-outline" size={64} color="#6B7280" />
            <Text style={styles.emptyText}>No tienes metas aún</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAddGoal}>
              <Text style={styles.emptyButtonText}>Crear Primera Meta</Text>
            </TouchableOpacity>
          </View>
        ) : (
          goals.map((goal) => {
            const progress = getProgress(goal);
            const daysRemaining = getDaysRemaining(goal.deadline);

            return (
              <View key={goal.id} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <View style={styles.goalIcon}>
                    <Text style={styles.goalIconText}>{goal.icon}</Text>
                  </View>
                  <View style={styles.goalInfo}>
                    <Text style={styles.goalName}>{goal.name}</Text>
                    <Text style={styles.goalDeadline}>
                      {daysRemaining > 0 ? `${daysRemaining} días restantes` : 'Meta vencida'}
                    </Text>
                  </View>
                </View>

                <View style={styles.goalProgress}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                  </View>
                  <Text style={styles.progressText}>{progress.toFixed(0)}%</Text>
                </View>

                <View style={styles.goalAmounts}>
                  <View style={styles.amountItem}>
                    <Text style={styles.amountLabel}>Actual</Text>
                    <Text style={styles.amountValue}>S/ {goal.currentAmount.toLocaleString()}</Text>
                  </View>
                  <View style={styles.amountItem}>
                    <Text style={styles.amountLabel}>Meta</Text>
                    <Text style={styles.amountValue}>S/ {goal.targetAmount.toLocaleString()}</Text>
                  </View>
                  <View style={styles.amountItem}>
                    <Text style={styles.amountLabel}>Falta</Text>
                    <Text style={styles.amountValuePending}>
                      S/ {(goal.targetAmount - goal.currentAmount).toLocaleString()}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.addFundsButton}
                  onPress={() => Alert.alert('Agregar Fondos', 'Funcionalidad en desarrollo')}
                >
                  <Text style={styles.addFundsButtonText}>+ Agregar Fondos</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nueva Meta de Ahorro</Text>
            <Text style={styles.modalSubtitle}>Próximamente podrás crear tus metas personalizadas</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E27' },
  scroll: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  backButton: { fontSize: 16, color: '#00D4AA', fontWeight: '600' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  addButton: { fontSize: 16, color: '#00D4AA', fontWeight: '600' },
  locked: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  lockedTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginTop: 16, marginBottom: 8 },
  lockedText: { fontSize: 15, color: '#9CA3AF', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  upgradeButton: { backgroundColor: '#00D4AA', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  upgradeButtonText: { fontSize: 16, fontWeight: 'bold', color: '#0A0E27' },
  emptyState: { alignItems: 'center', padding: 60 },
  emptyText: { fontSize: 16, color: '#9CA3AF', marginTop: 16, marginBottom: 24 },
  emptyButton: { backgroundColor: '#00D4AA', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  emptyButtonText: { fontSize: 14, fontWeight: 'bold', color: '#0A0E27' },
  goalCard: { backgroundColor: '#151B3D', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
  goalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  goalIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1E2749', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  goalIconText: { fontSize: 24 },
  goalInfo: { flex: 1 },
  goalName: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  goalDeadline: { fontSize: 13, color: '#9CA3AF' },
  goalProgress: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  progressBar: { flex: 1, height: 12, backgroundColor: '#2D3748', borderRadius: 6, overflow: 'hidden', marginRight: 12 },
  progressFill: { height: '100%', backgroundColor: '#00D4AA' },
  progressText: { fontSize: 14, fontWeight: 'bold', color: '#00D4AA', width: 50, textAlign: 'right' },
  goalAmounts: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  amountItem: { alignItems: 'center' },
  amountLabel: { fontSize: 12, color: '#9CA3AF', marginBottom: 4 },
  amountValue: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
  amountValuePending: { fontSize: 16, fontWeight: 'bold', color: '#FFD700' },
  addFundsButton: { backgroundColor: '#00D4AA', borderRadius: 8, padding: 12, alignItems: 'center' },
  addFundsButtonText: { fontSize: 14, fontWeight: 'bold', color: '#0A0E27' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#151B3D', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8, textAlign: 'center' },
  modalSubtitle: { fontSize: 14, color: '#9CA3AF', marginBottom: 24, textAlign: 'center' },
  modalButton: { backgroundColor: '#00D4AA', borderRadius: 8, padding: 14, alignItems: 'center' },
  modalButtonText: { fontSize: 16, fontWeight: 'bold', color: '#0A0E27' },
});
