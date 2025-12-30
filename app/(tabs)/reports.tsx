import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '@/store/userStore';
import { useTransactionStore } from '@/store/transactionStore';
import { formatCurrency } from '@/utils/formatters';
import { router } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import axios from 'axios';
import { LineChart, BarChart, PieChart, ProgressChart } from 'react-native-chart-kit';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://finia.seguricloud.com/api';
const screenWidth = Dimensions.get('window').width;

export default function ReportsScreen() {
  const { user } = useUserStore();
  const { transactions, getTotalIncome, getTotalExpenses } = useTransactionStore();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [loadingExcel, setLoadingExcel] = useState(false);

  if (!user?.isPremium) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.locked}>
          <Text style={styles.lockedIcon}>📊</Text>
          <Text style={styles.lockedTitle}>Reportes Premium</Text>
          <Text style={styles.lockedText}>
            Los reportes avanzados con 6 gráficas interactivas y exportación PDF/Excel están disponibles solo para usuarios Premium
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

  const totalIncome = getTotalIncome();
  const totalExpenses = getTotalExpenses();
  const balance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0;

  const getPeriodDates = () => {
    const now = new Date();
    let startDate, endDate;

    if (selectedPeriod === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      endDate = now;
    } else if (selectedPeriod === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  };

  const generatePDF = async () => {
    setLoadingPDF(true);
    try {
      const { startDate, endDate } = getPeriodDates();
      const response = await axios.post(
        `${API_URL}/reports/pdf`,
        { userId: user?.id, period: selectedPeriod, startDate, endDate },
        { responseType: 'blob', timeout: 30000 }
      );

      const reader = new FileReader();
      reader.readAsDataURL(response.data);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const base64 = base64data.split(',')[1];
        const fileName = `reporte-finia-${Date.now()}.pdf`;
        const filePath = `${FileSystem.documentDirectory}${fileName}`;

        await FileSystem.writeAsStringAsync(filePath, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(filePath, {
            mimeType: 'application/pdf',
            dialogTitle: 'Compartir Reporte PDF',
          });
        }

        Alert.alert('✅ PDF Generado', 'El reporte se ha generado correctamente');
      };
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', error.message || 'No se pudo generar el PDF');
    } finally {
      setLoadingPDF(false);
    }
  };

  const generateExcel = async () => {
    setLoadingExcel(true);
    try {
      const { startDate, endDate } = getPeriodDates();
      const response = await axios.post(
        `${API_URL}/reports/excel`,
        { userId: user?.id, period: selectedPeriod, startDate, endDate },
        { responseType: 'blob', timeout: 30000 }
      );

      const reader = new FileReader();
      reader.readAsDataURL(response.data);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const base64 = base64data.split(',')[1];
        const fileName = `reporte-finia-${Date.now()}.xlsx`;
        const filePath = `${FileSystem.documentDirectory}${fileName}`;

        await FileSystem.writeAsStringAsync(filePath, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(filePath, {
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            dialogTitle: 'Compartir Reporte Excel',
          });
        }

        Alert.alert('✅ Excel Generado', 'El reporte se ha generado correctamente');
      };
    } catch (error: any) {
      console.error('Error generating Excel:', error);
      Alert.alert('Error', error.message || 'No se pudo generar el Excel');
    } finally {
      setLoadingExcel(false);
    }
  };

  // Datos para gráficos
  const getLast7DaysExpenses = () => {
    const last7Days = [];
    const labels = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayExpenses = transactions
        .filter(t => t.type === 'expense' && t.date.toISOString().split('T')[0] === dateStr)
        .reduce((sum, t) => sum + t.amount, 0);
      
      last7Days.push(dayExpenses);
      labels.push(date.toLocaleDateString('es-PE', { weekday: 'short' }));
    }

    return { data: last7Days, labels };
  };

  const getMonthlyComparison = () => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentMonth = new Date().getMonth();
    const last6Months = [];
    const incomeData = [];
    const expenseData = [];

    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      last6Months.push(months[monthIndex]);

      const monthIncome = transactions
        .filter(t => t.type === 'income' && new Date(t.date).getMonth() === monthIndex)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const monthExpense = transactions
        .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === monthIndex)
        .reduce((sum, t) => sum + t.amount, 0);

      incomeData.push(monthIncome);
      expenseData.push(monthExpense);
    }

    return { labels: last6Months, incomeData, expenseData };
  };

  const getCategoryDistribution = () => {
    const categoryTotals: { [key: string]: number } = {};
    
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      });

    const colors = ['#00D4AA', '#6C5CE7', '#FFD700', '#FF7675', '#74B9FF', '#FD79A8'];
    
    return Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, amount], index) => ({
        name,
        amount,
        color: colors[index],
        legendFontColor: '#9CA3AF',
        legendFontSize: 12,
      }));
  };

  const getSavingsProgress = () => {
    const savingsGoal = totalIncome * 0.2;
    const currentSavings = balance > 0 ? balance : 0;
    const progress = savingsGoal > 0 ? Math.min(currentSavings / savingsGoal, 1) : 0;

    return {
      labels: ['Ahorro'],
      data: [progress],
    };
  };

  const getWeekdayExpenses = () => {
    const weekdays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const weekdayTotals = new Array(7).fill(0);

    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const day = new Date(t.date).getDay();
        weekdayTotals[day] += t.amount;
      });

    return {
      labels: weekdays,
      datasets: [{ data: weekdayTotals }],
    };
  };

  const getBalanceEvolution = () => {
    const last7Days = [];
    const labels = [];
    const today = new Date();
    let runningBalance = 0;

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayTransactions = transactions
        .filter(t => t.date.toISOString().split('T')[0] === dateStr);
      
      dayTransactions.forEach(t => {
        runningBalance += t.type === 'income' ? t.amount : -t.amount;
      });
      
      last7Days.push(Math.max(runningBalance, 0));
      labels.push(date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' }));
    }

    return { data: last7Days, labels };
  };

  const chartConfig = {
    backgroundColor: '#151B3D',
    backgroundGradientFrom: '#151B3D',
    backgroundGradientTo: '#1E2749',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 212, 170, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#00D4AA'
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: '#2D3748',
      strokeWidth: 1,
    }
  };

  const last7DaysData = getLast7DaysExpenses();
  const monthlyData = getMonthlyComparison();
  const categoryData = getCategoryDistribution();
  const savingsData = getSavingsProgress();
  const weekdayData = getWeekdayExpenses();
  const balanceData = getBalanceEvolution();

  const expensesByCategory: { [key: string]: number } = {};
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
    });

  const topCategories = Object.entries(expensesByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Atrás</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Reportes Premium</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.periodSelector}>
          {(['week', 'month', 'year'] as const).map((period) => (
            <TouchableOpacity
              key={period}
              style={[styles.periodButton, selectedPeriod === period && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[styles.periodText, selectedPeriod === period && styles.periodTextActive]}>
                {period === 'week' ? 'Semana' : period === 'month' ? 'Mes' : 'Año'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryIcon}>💰</Text>
            <Text style={styles.summaryLabel}>Ingresos</Text>
            <Text style={styles.summaryIncome}>{formatCurrency(totalIncome)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryIcon}>💸</Text>
            <Text style={styles.summaryLabel}>Gastos</Text>
            <Text style={styles.summaryExpense}>{formatCurrency(totalExpenses)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryIcon}>📊</Text>
            <Text style={styles.summaryLabel}>Balance</Text>
            <Text style={[styles.summaryBalance, { color: balance >= 0 ? '#00D4AA' : '#FF7675' }]}>
              {formatCurrency(balance)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryIcon}>💎</Text>
            <Text style={styles.summaryLabel}>Ahorro</Text>
            <Text style={styles.summarySavings}>{savingsRate.toFixed(1)}%</Text>
          </View>
        </View>

        {/* GRÁFICAS INTERACTIVAS */}
        {transactions.length > 0 && (
          <>
            {/* Gráfico 1: Tendencia de Gastos */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>📉 Tendencia de Gastos (7 días)</Text>
              <Text style={styles.chartSubtitle}>Monitorea tus gastos diarios</Text>
              <LineChart
                data={{
                  labels: last7DaysData.labels,
                  datasets: [{ data: last7DaysData.data.length > 0 ? last7DaysData.data : [0] }],
                }}
                width={screenWidth - 60}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                withInnerLines={true}
                withOuterLines={true}
                withVerticalLines={false}
                withHorizontalLines={true}
                fromZero={true}
              />
            </View>

            {/* Gráfico 2: Comparación Mensual */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>📊 Ingresos vs Gastos (6 meses)</Text>
              <Text style={styles.chartSubtitle}>Comparativa mensual</Text>
              <BarChart
                data={{
                  labels: monthlyData.labels,
                  datasets: [
                    { data: monthlyData.incomeData.length > 0 ? monthlyData.incomeData : [0], color: () => '#00D4AA' },
                    { data: monthlyData.expenseData.length > 0 ? monthlyData.expenseData : [0], color: () => '#FF7675' },
                  ],
                  legend: ['Ingresos', 'Gastos'],
                }}
                width={screenWidth - 60}
                height={220}
                chartConfig={chartConfig}
                style={styles.chart}
                showBarTops={false}
                fromZero={true}
                withInnerLines={true}
              />
            </View>

            {/* Gráfico 3: Distribución por Categoría */}
            {categoryData.length > 0 && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>🍰 Distribución por Categoría</Text>
                <Text style={styles.chartSubtitle}>¿En qué gastas más?</Text>
                <PieChart
                  data={categoryData}
                  width={screenWidth - 60}
                  height={220}
                  chartConfig={chartConfig}
                  accessor="amount"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                  style={styles.chart}
                />
              </View>
            )}

            {/* Gráfico 4: Progreso de Ahorro */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>💰 Progreso de Meta de Ahorro</Text>
              <Text style={styles.chartSubtitle}>Meta: 20% de tus ingresos</Text>
              <ProgressChart
                data={savingsData}
                width={screenWidth - 60}
                height={220}
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(0, 212, 170, ${opacity})`,
                }}
                style={styles.chart}
                hideLegend={false}
              />
              <Text style={styles.progressText}>
                Ahorro actual: {formatCurrency(balance > 0 ? balance : 0)} / {formatCurrency(totalIncome * 0.2)}
              </Text>
            </View>

            {/* Gráfico 5: Gastos por Día de la Semana */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>📅 Gastos por Día de la Semana</Text>
              <Text style={styles.chartSubtitle}>¿Qué día gastas más?</Text>
              <BarChart
                data={weekdayData}
                width={screenWidth - 60}
                height={220}
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(108, 92, 231, ${opacity})`,
                }}
                style={styles.chart}
                showBarTops={false}
                fromZero={true}
                withInnerLines={true}
                verticalLabelRotation={0}
              />
            </View>

            {/* Gráfico 6: Evolución del Balance */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>💎 Evolución del Balance (7 días)</Text>
              <Text style={styles.chartSubtitle}>Crecimiento de tu patrimonio</Text>
              <LineChart
                data={{
                  labels: balanceData.labels,
                  datasets: [{ data: balanceData.data.length > 0 ? balanceData.data : [0] }],
                }}
                width={screenWidth - 60}
                height={220}
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(255, 215, 0, ${opacity})`,
                }}
                bezier
                style={styles.chart}
                withInnerLines={true}
                withOuterLines={true}
                withVerticalLines={false}
                withHorizontalLines={true}
                fromZero={true}
              />
            </View>
          </>
        )}

        {/* Top Categorías */}
        <View style={styles.categoryCard}>
          <Text style={styles.categoryTitle}>📈 Top 5 Categorías de Gastos</Text>
          {topCategories.length > 0 ? (
            topCategories.map(([category, amount], index) => {
              const percentage = (amount / totalExpenses * 100).toFixed(1);
              return (
                <View key={category} style={styles.categoryItem}>
                  <View style={styles.categoryInfo}>
                    <View style={[styles.categoryRank, { backgroundColor: index === 0 ? '#FFD700' : '#00D4AA' }]}>
                      <Text style={styles.categoryRankText}>{index + 1}</Text>
                    </View>
                    <View style={styles.categoryDetails}>
                      <Text style={styles.categoryName}>{category}</Text>
                      <View style={styles.categoryBar}>
                        <View style={[styles.categoryBarFill, { width: `${percentage}%` }]} />
                      </View>
                    </View>
                  </View>
                  <View style={styles.categoryRight}>
                    <Text style={styles.categoryAmount}>{formatCurrency(amount)}</Text>
                    <Text style={styles.categoryPercent}>{percentage}%</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.noData}>Sin datos de gastos</Text>
          )}
        </View>

        {/* Insights */}
        <View style={styles.insightsCard}>
          <Text style={styles.insightsTitle}>💡 Análisis Inteligente</Text>
          <View style={styles.insightItem}>
            <Text style={styles.insightIcon}>✅</Text>
            <Text style={styles.insightText}>
              Tienes {transactions.length} transacciones registradas este período
            </Text>
          </View>
          <View style={styles.insightItem}>
            <Text style={styles.insightIcon}>💰</Text>
            <Text style={styles.insightText}>
              Tu tasa de ahorro es del {savingsRate.toFixed(1)}% - {savingsRate >= 20 ? '¡Excelente!' : 'Puedes mejorar'}
            </Text>
          </View>
          {topCategories.length > 0 && (
            <View style={styles.insightItem}>
              <Text style={styles.insightIcon}>📊</Text>
              <Text style={styles.insightText}>
                Mayor gasto en {topCategories[0][0]}: {formatCurrency(topCategories[0][1])}
              </Text>
            </View>
          )}
        </View>

        {/* Exportación */}
        <View style={styles.exportSection}>
          <Text style={styles.exportTitle}>📤 Exportar Reporte</Text>
          
          <TouchableOpacity 
            style={[styles.exportButton, loadingPDF && styles.exportButtonDisabled]}
            onPress={generatePDF}
            disabled={loadingPDF || loadingExcel}
          >
            {loadingPDF ? (
              <ActivityIndicator color="#0A0E27" />
            ) : (
              <>
                <Text style={styles.exportIcon}>📄</Text>
                <View style={styles.exportTextContainer}>
                  <Text style={styles.exportButtonTitle}>Exportar PDF</Text>
                  <Text style={styles.exportButtonSubtitle}>Reporte profesional en PDF</Text>
                </View>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.exportButton, loadingExcel && styles.exportButtonDisabled]}
            onPress={generateExcel}
            disabled={loadingPDF || loadingExcel}
          >
            {loadingExcel ? (
              <ActivityIndicator color="#0A0E27" />
            ) : (
              <>
                <Text style={styles.exportIcon}>📊</Text>
                <View style={styles.exportTextContainer}>
                  <Text style={styles.exportButtonTitle}>Exportar Excel</Text>
                  <Text style={styles.exportButtonSubtitle}>Datos editables en Excel</Text>
                </View>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  periodSelector: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 20, backgroundColor: '#151B3D', borderRadius: 12, padding: 4 },
  periodButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  periodButtonActive: { backgroundColor: '#00D4AA' },
  periodText: { fontSize: 14, color: '#9CA3AF', fontWeight: '600' },
  periodTextActive: { color: '#0A0E27' },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 12, marginBottom: 20 },
  summaryCard: { width: '48%', backgroundColor: '#151B3D', borderRadius: 12, padding: 16, alignItems: 'center' },
  summaryIcon: { fontSize: 32, marginBottom: 8 },
  summaryLabel: { fontSize: 12, color: '#9CA3AF', marginBottom: 4 },
  summaryIncome: { fontSize: 18, fontWeight: 'bold', color: '#00D4AA' },
  summaryExpense: { fontSize: 18, fontWeight: 'bold', color: '#FF7675' },
  summaryBalance: { fontSize: 18, fontWeight: 'bold' },
  summarySavings: { fontSize: 18, fontWeight: 'bold', color: '#FFD700' },
  chartCard: { backgroundColor: '#151B3D', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 16 },
  chartTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  chartSubtitle: { fontSize: 12, color: '#9CA3AF', marginBottom: 16 },
  chart: { marginVertical: 8, borderRadius: 16 },
  progressText: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginTop: 12 },
  categoryCard: { backgroundColor: '#151B3D', borderRadius: 12, padding: 20, marginHorizontal: 20, marginBottom: 20 },
  categoryTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 16 },
  categoryItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  categoryInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  categoryRank: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  categoryRankText: { fontSize: 14, fontWeight: 'bold', color: '#0A0E27' },
  categoryDetails: { flex: 1 },
  categoryName: { fontSize: 14, fontWeight: '600', color: '#FFFFFF', marginBottom: 6 },
  categoryBar: { height: 6, backgroundColor: '#2D3748', borderRadius: 3, overflow: 'hidden' },
  categoryBarFill: { height: '100%', backgroundColor: '#00D4AA' },
  categoryRight: { alignItems: 'flex-end' },
  categoryAmount: { fontSize: 14, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 2 },
  categoryPercent: { fontSize: 11, color: '#9CA3AF' },
  noData: { fontSize: 14, color: '#6B7280', textAlign: 'center', paddingVertical: 20 },
  insightsCard: { backgroundColor: '#151B3D', borderRadius: 12, padding: 20, marginHorizontal: 20, marginBottom: 20 },
  insightsTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 16 },
  insightItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  insightIcon: { fontSize: 18, marginRight: 12 },
  insightText: { flex: 1, fontSize: 14, color: '#9CA3AF', lineHeight: 20 },
  exportSection: { paddingHorizontal: 20, marginBottom: 20 },
  exportTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 16 },
  exportButton: { backgroundColor: '#00D4AA', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  exportButtonDisabled: { opacity: 0.5 },
  exportIcon: { fontSize: 32, marginRight: 16 },
  exportTextContainer: { flex: 1 },
  exportButtonTitle: { fontSize: 16, fontWeight: 'bold', color: '#0A0E27', marginBottom: 2 },
  exportButtonSubtitle: { fontSize: 12, color: '#0A0E27', opacity: 0.7 },
});
