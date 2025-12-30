import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInsightsStore } from '@/store/insightsStore';
import { router } from 'expo-router';

export default function InsightsScreen() {
  const { insights, markAsRead } = useInsightsStore();

  const handleInsightPress = (id: string) => {
    markAsRead(id);
  };

  const priorityColors = {
    low: '#6B7280',
    medium: '#FFD700',
    high: '#FF7675',
  };

  const typeIcons = {
    savings: '💰',
    spending: '💸',
    budget: '📊',
    investment: '📈',
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Atrás</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Consejos IA</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Insights */}
        <View style={styles.content}>
          {insights.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💡</Text>
              <Text style={styles.emptyTitle}>Sin consejos aún</Text>
              <Text style={styles.emptyText}>
                A medida que uses FINIA, recibirás consejos personalizados basados en tus finanzas
              </Text>
            </View>
          ) : (
            insights.map((insight) => (
              <TouchableOpacity
                key={insight.id}
                style={[
                  styles.insightCard,
                  !insight.isRead && styles.insightCardUnread,
                ]}
                onPress={() => handleInsightPress(insight.id)}
              >
                <View style={styles.insightHeader}>
                  <Text style={styles.insightIcon}>{typeIcons[insight.type]}</Text>
                  <View
                    style={[
                      styles.priorityBadge,
                      { backgroundColor: priorityColors[insight.priority] },
                    ]}
                  >
                    <Text style={styles.priorityText}>
                      {insight.priority === 'high' ? 'Alta' : insight.priority === 'medium' ? 'Media' : 'Baja'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightDescription}>{insight.description}</Text>
                <Text style={styles.insightDate}>
                  {new Date(insight.createdAt).toLocaleDateString('es-PE')}
                </Text>
              </TouchableOpacity>
            ))
          )}
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
  content: { padding: 20 },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
  insightCard: {
    backgroundColor: '#151B3D',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  insightCardUnread: {
    borderWidth: 2,
    borderColor: '#00D4AA',
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightIcon: { fontSize: 24 },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: { fontSize: 10, fontWeight: 'bold', color: '#0A0E27' },
  insightTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  insightDescription: { fontSize: 14, color: '#9CA3AF', lineHeight: 20, marginBottom: 8 },
  insightDate: { fontSize: 11, color: '#6B7280' },
});
