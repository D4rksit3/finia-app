import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  RefreshControl, 
  Dimensions,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

// Tus Stores y Utils
import { useUserStore } from '@/store/userStore';
import { useTransactionStore } from '@/store/transactionStore';
import { useInsightsStore } from '@/store/insightsStore';
import { formatCurrency, formatRelativeDate } from '@/utils/formatters';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { user } = useUserStore();
  const { 
    getTotalIncome, 
    getTotalExpenses, 
    getBalance, 
    getRecentTransactions, 
    syncWithBackend, 
    loading 
  } = useTransactionStore();
  const { getUnreadCount } = useInsightsStore();

  useEffect(() => {
    if (user?.id) {
      syncWithBackend(user.id);
    }
  }, [user?.id]);

  const onRefresh = () => {
    if (user?.id) syncWithBackend(user.id);
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Cargando tu billetera...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Lógica de Negocio
  const totalIncome = getTotalIncome();
  const totalExpenses = getTotalExpenses();
  const balance = getBalance();
  const recentTransactions = getRecentTransactions(5);
  const unreadInsights = getUnreadCount();
  
  const avgDailyExpense = totalExpenses / 30;
  const daysRemaining = balance > 0 ? Math.floor(balance / avgDailyExpense) : 0;
  const showWarning = daysRemaining < 7 && daysRemaining > 0 && totalExpenses > 0;
  
  const planColor = user.plan === 'free' ? '#94A3B8' : user.plan === 'premium' ? '#00D4AA' : '#8B5CF6';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor="#00D4AA" />
        }
        contentContainerStyle={styles.scrollContent}
      >
        
        {/* --- HEADER --- */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.profileSection} 
            onPress={() => router.push('/(tabs)/profile')}
          >
            {user.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: planColor }]}>
                <Text style={styles.avatarText}>{user.fullName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View>
              <Text style={styles.greeting}>Hola, {user.fullName.split(' ')[0]}</Text>
              <View style={[styles.planBadge, { borderColor: planColor }]}>
                <Text style={[styles.planBadgeText, { color: planColor }]}>{user.plan.toUpperCase()}</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.notificationBtn}
            onPress={() => router.push('/notifications' as any)}
          >
            <Feather name="bell" size={22} color="white" />
            {unreadInsights > 0 && <View style={styles.activeDot} />}
          </TouchableOpacity>
        </View>

        {/* --- BALANCE CARD --- */}
        <LinearGradient
          colors={['#1E293B', '#0F172A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <Text style={styles.balanceLabel}>Balance Total</Text>
          <Text style={[styles.balanceAmount, { color: balance >= 0 ? '#FFFFFF' : '#FF7675' }]}>
            {formatCurrency(balance)}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(0, 212, 170, 0.15)' }]}>
                <Feather name="arrow-up-right" size={16} color="#00D4AA" />
              </View>
              <View>
                <Text style={styles.statLabel}>Ingresos</Text>
                <Text style={styles.incomeText}>{formatCurrency(totalIncome)}</Text>
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 118, 117, 0.15)' }]}>
                <Feather name="arrow-down-left" size={16} color="#FF7675" />
              </View>
              <View>
                <Text style={styles.statLabel}>Gastos</Text>
                <Text style={styles.expenseText}>{formatCurrency(totalExpenses)}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* --- ALERTAS Y CONSEJOS --- */}
        {showWarning && (
          <View style={styles.warningBanner}>
            <Ionicons name="warning-outline" size={24} color="#FF7675" />
            <View style={styles.bannerContent}>
              <Text style={styles.warningTitle}>Saldo crítico</Text>
              <Text style={styles.warningSub}>Te queda dinero para aprox. {daysRemaining} días.</Text>
            </View>
          </View>
        )}

        {unreadInsights > 0 && (
          <TouchableOpacity 
            style={styles.insightBanner}
            onPress={() => router.push('/(tabs)/insights')}
          >
            <LinearGradient
              colors={['#312E81', '#1E1B4B']}
              style={styles.insightGradient}
            >
              <MaterialCommunityIcons name="lightbulb-on-outline" size={24} color="#FDE047" />
              <View style={styles.bannerContent}>
                <Text style={styles.insightTitle}>Tienes {unreadInsights} consejos de IA</Text>
                <Text style={styles.insightSub}>Pulsa para optimizar tus finanzas ahora.</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#94A3B8" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* --- HERRAMIENTAS FINANCIERAS --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gestión Patrimonial</Text>
          <View style={styles.actionGrid}>
            <ActionButton icon="credit-card" label="Tarjetas" route="/cards" color="#6366F1" />
            <ActionButton icon="target" label="Metas" route="/goals" color="#F59E0B" />
            <ActionButton icon="trending-up" label="Predicciones" route="/predictions" color="#10B981" />
            <ActionButton icon="users" label="Referidos" route="/referral" color="#EC4899" />
          </View>
        </View>

        {/* --- ACCIONES RÁPIDAS (PRO) --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Operaciones Rápidas</Text>
          <View style={styles.actionGrid}>
            <ActionButton icon="plus" label="Agregar" route="/(tabs)/add" color="#00D4AA" />
            
            <ActionButton 
              icon="maximize" 
              label="Escanear" 
              route={user.isPremium ? "/(tabs)/ocr" : "/(tabs)/upgrade"} 
              isLocked={!user.isPremium}
              color="#3B82F6"
            />
            
            <ActionButton 
              icon="bar-chart-2" 
              label="Reportes" 
              route={user.isPremium ? "/(tabs)/reports" : "/(tabs)/upgrade"} 
              isLocked={!user.isPremium}
              color="#8B5CF6"
            />
            
            <ActionButton icon="cpu" label="IA Chat" route="/(tabs)/ai-assistant" color="#00D4AA" />
          </View>
        </View>

        {/* --- TRANSACCIONES --- */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Movimientos</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
              <Text style={styles.seeAllText}>Ver historial</Text>
            </TouchableOpacity>
          </View>

          {recentTransactions.length === 0 ? (
            <View style={styles.emptyCard}>
              <Feather name="file-text" size={40} color="#334155" />
              <Text style={styles.emptyText}>No hay movimientos este mes</Text>
            </View>
          ) : (
            recentTransactions.map((item) => (
              <View key={item.id} style={styles.transactionItem}>
                <View style={[styles.itemIcon, { backgroundColor: item.type === 'income' ? '#064E3B' : '#1E293B' }]}>
                  <MaterialCommunityIcons 
                    name={item.type === 'income' ? 'arrow-bottom-left' : 'cart-outline'} 
                    size={20} 
                    color={item.type === 'income' ? '#00D4AA' : '#94A3B8'} 
                  />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={1}>{item.description}</Text>
                  <Text style={styles.itemSub}>{item.category} • {formatRelativeDate(item.date)}</Text>
                </View>
                <Text style={[styles.itemAmount, { color: item.type === 'income' ? '#00D4AA' : '#FFFFFF' }]}>
                  {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Sub-componente para botones de acción
const ActionButton = ({ icon, label, route, color, isLocked }: any) => (
  <TouchableOpacity 
    style={styles.actionBtn} 
    onPress={() => router.push(route)}
  >
    <View style={[styles.actionIconWrap, { backgroundColor: `${color}15` }]}>
      <Feather name={icon} size={22} color={color} />
      {isLocked && (
        <View style={styles.lockBadge}>
          <Ionicons name="lock-closed" size={8} color="black" />
        </View>
      )}
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 120 },
  loadingText: { color: '#94A3B8', fontSize: 16 },
  
  // Header
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20 
  },
  profileSection: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 16 },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#020617' },
  greeting: { fontSize: 18, fontWeight: '700', color: '#F8FAFC' },
  planBadge: { borderWidth: 1, paddingHorizontal: 6, borderRadius: 4, marginTop: 4, alignSelf: 'flex-start' },
  planBadgeText: { fontSize: 9, fontWeight: '800' },
  notificationBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center' },
  activeDot: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#00D4AA', borderWidth: 2, borderColor: '#1E293B' },

  // Balance Card
  balanceCard: { margin: 20, borderRadius: 28, padding: 24, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 } }) },
  balanceLabel: { color: '#94A3B8', fontSize: 14, fontWeight: '500' },
  balanceAmount: { fontSize: 36, fontWeight: '800', marginVertical: 12, letterSpacing: -1 },
  statsRow: { flexDirection: 'row', marginTop: 12, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  statBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconCircle: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  statLabel: { color: '#64748B', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  incomeText: { color: '#00D4AA', fontSize: 15, fontWeight: '700' },
  expenseText: { color: '#FF7675', fontSize: 15, fontWeight: '700' },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 15 },

  // Banners
  warningBanner: { marginHorizontal: 20, marginBottom: 16, flexDirection: 'row', backgroundColor: 'rgba(255, 118, 117, 0.1)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 118, 117, 0.2)', alignItems: 'center' },
  bannerContent: { flex: 1, marginLeft: 12 },
  warningTitle: { color: '#FF7675', fontWeight: '700', fontSize: 15 },
  warningSub: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  
  insightBanner: { marginHorizontal: 20, marginBottom: 20, borderRadius: 20, overflow: 'hidden' },
  insightGradient: { flexDirection: 'row', padding: 16, alignItems: 'center' },
  insightTitle: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  insightSub: { color: '#94A3B8', fontSize: 12, marginTop: 2 },

  // Sections
  section: { paddingHorizontal: 20, marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#F8FAFC', marginBottom: 14 },
  seeAllText: { color: '#00D4AA', fontSize: 14, fontWeight: '600' },
  
  // Grid
  actionGrid: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, alignItems: 'center' },
  actionIconWrap: { width: (width - 76) / 4, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 8, position: 'relative' },
  actionLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '500' },
  lockBadge: { position: 'absolute', bottom: -2, right: -2, backgroundColor: '#00D4AA', width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWeight: 2, borderColor: '#020617' },

  // Transactions
  transactionItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: '#0F172A', padding: 12, borderRadius: 20 },
  itemIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemTitle: { color: '#F8FAFC', fontSize: 15, fontWeight: '600' },
  itemSub: { color: '#64748B', fontSize: 12, marginTop: 2 },
  itemAmount: { fontSize: 16, fontWeight: '700' },
  emptyCard: { padding: 40, alignItems: 'center', backgroundColor: '#0F172A', borderRadius: 24, borderStyle: 'dashed', borderWidth: 1, borderColor: '#1E293B' },
  emptyText: { color: '#475569', marginTop: 12, fontSize: 14 }
});