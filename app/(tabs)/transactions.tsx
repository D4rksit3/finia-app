import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '@/store/userStore';
import { useTransactionStore } from '@/store/transactionStore';
import { formatCurrency, formatDate } from '@/utils/formatters';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://finia.seguricloud.com/api';

type FilterType = 'all' | 'income' | 'expense';

export default function TransactionsScreen() {
  const { user } = useUserStore();
  const { transactions, deleteTransaction, syncWithBackend, loading } = useTransactionStore();
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    if (user?.id) {
      syncWithBackend(user.id);
    }
  }, [user?.id]);

  const onRefresh = () => {
    if (user?.id) {
      syncWithBackend(user.id);
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    if (filter === 'all') return true;
    return t.type === filter;
  });

  const handleDelete = (id: string) => {
    Alert.alert('Eliminar Transacción', '¿Estás seguro de eliminar esta transacción?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            // Eliminar del backend
            await axios.delete(`${API_URL}/transactions/${id}`, {
              data: { userId: user?.id },
            });

            // Eliminar del store local
            deleteTransaction(id);

            Alert.alert('✅ Eliminado', 'Transacción eliminada exitosamente');

            // Sincronizar
            if (user?.id) {
              syncWithBackend(user.id);
            }
          } catch (error) {
            console.error('Error deleting transaction:', error);
            Alert.alert('Error', 'No se pudo eliminar la transacción');
          }
        },
      },
    ]);
  };

  // Agrupar por mes
  const groupedByMonth: { [key: string]: typeof transactions } = {};
  filteredTransactions.forEach((t) => {
    const monthKey = new Date(t.date).toLocaleDateString('es-PE', { year: 'numeric', month: 'long' });
    if (!groupedByMonth[monthKey]) {
      groupedByMonth[monthKey] = [];
    }
    groupedByMonth[monthKey].push(t);
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transacciones</Text>
        <Text style={styles.count}>{filteredTransactions.length} total</Text>
      </View>

      {/* Filter */}
      <View style={styles.filterContainer}>
        {(['all', 'income', 'expense'] as FilterType[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'Todos' : f === 'income' ? 'Ingresos' : 'Gastos'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView 
  contentContainerStyle={{ paddingBottom: 100 }}
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor="#00D4AA" />
        }
      >
        {Object.keys(groupedByMonth).length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No hay transacciones</Text>
          </View>
        ) : (
          Object.keys(groupedByMonth).map((month) => (
            <View key={month} style={styles.monthGroup}>
              <Text style={styles.monthTitle}>{month}</Text>
              {groupedByMonth[month].map((transaction) => (
                <TouchableOpacity
                  key={transaction.id}
                  style={styles.transactionCard}
                  onLongPress={() => handleDelete(transaction.id)}
                >
                  <View style={styles.transactionIcon}>
                    <Text style={styles.transactionIconText}>
                      {transaction.type === 'income' ? '💼' : '🛒'}
                    </Text>
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionDescription}>{transaction.description}</Text>
                    <Text style={styles.transactionCategory}>{transaction.category}</Text>
                    <Text style={styles.transactionDate}>{formatDate(transaction.date)}</Text>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text
                      style={[
                        styles.transactionAmount,
                        { color: transaction.type === 'income' ? '#00D4AA' : '#FF7675' },
                      ]}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E27' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
  count: { fontSize: 14, color: '#9CA3AF' },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    backgroundColor: '#151B3D',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2D3748',
  },
  filterButtonActive: {
    backgroundColor: '#00D4AA',
    borderColor: '#00D4AA',
  },
  filterText: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  filterTextActive: { color: '#0A0E27' },
  scroll: { flex: 1 },
  monthGroup: {
    marginBottom: 24,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#9CA3AF',
    textTransform: 'capitalize',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#151B3D',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E2749',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionIconText: { fontSize: 20 },
  transactionInfo: { flex: 1 },
  transactionDescription: { fontSize: 15, fontWeight: '600', color: '#FFFFFF', marginBottom: 2 },
  transactionCategory: { fontSize: 12, color: '#9CA3AF', marginBottom: 2 },
  transactionDate: { fontSize: 11, color: '#6B7280' },
  transactionRight: { alignItems: 'flex-end' },
  transactionAmount: { fontSize: 16, fontWeight: 'bold' },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 16, color: '#9CA3AF' },
});
