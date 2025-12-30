import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '@/store/userStore';
import { router } from 'expo-router';
import authService from '../../src/services/auth/authService';

export default function ProfileScreen() {
  const { user, logout } = useUserStore();

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleLogout = async () => {
  Alert.alert(
    'Cerrar Sesión',
    '¿Estás seguro de que deseas cerrar sesión?',
    [
      { 
        text: 'Cancelar', 
        style: 'cancel' 
      },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: async () => {
          try {
            console.log('👋 Cerrando sesión...');
            
            await authService.signOut();
            logout();
            router.replace('/(auth)/login');
            
            console.log('✅ Sesión cerrada completamente');
            
          } catch (error) {
            console.error('Error logout:', error);
            logout();
            router.replace('/(auth)/login');
          }
        },
      },
    ]
  );
};
  const planColor = user.plan === 'free' ? '#6B7280' : user.plan === 'premium' ? '#00D4AA' : '#6C5CE7';
  const planName = user.plan === 'free' ? 'FREE' : user.plan === 'premium' ? 'PREMIUM' : 'ENTERPRISE';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scroll} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 90 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Perfil</Text>
        </View>

        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.userHeader}>
            {user.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{user.fullName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.fullName}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.planBadge, { backgroundColor: planColor }]}
            onPress={() => router.push('/(tabs)/upgrade')}
          >
            <Text style={styles.planBadgeIcon}>
              {user.plan === 'free' ? '🆓' : user.plan === 'premium' ? '⭐' : '💎'}
            </Text>
            <View style={styles.planBadgeContent}>
              <Text style={styles.planBadgeTitle}>Plan {planName}</Text>
              {user.plan === 'free' && (
                <Text style={styles.planBadgeSubtitle}>Actualizar a Premium →</Text>
              )}
            </View>
          </TouchableOpacity>

          {user.memberSince && (
            <View style={styles.memberSince}>
              <Text style={styles.memberSinceText}>
                Miembro desde {new Date(user.memberSince).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })}
              </Text>
            </View>
          )}
        </View>

        {/* Menu Items */}
        <View style={styles.menu}>
          {/* Plan y Suscripción */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(tabs)/upgrade')}
          >
            <Text style={styles.menuIcon}>⭐</Text>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Plan y Suscripción</Text>
              <Text style={styles.menuSubtitle}>Plan {planName}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          {/* METAS DE AHORRO - ESTE ES EL BOTÓN IMPORTANTE */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(tabs)/goals')}
          >
            <Text style={styles.menuIcon}>🎯</Text>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Metas de Ahorro</Text>
              <Text style={styles.menuSubtitle}>
                {user.isPremium ? 'Administrar metas' : 'Requiere Premium'}
              </Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          {/* Notificaciones */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('Notificaciones', 'Configuración de notificaciones - Próximamente')}
          >
            <Text style={styles.menuIcon}>🔔</Text>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Notificaciones</Text>
              <Text style={styles.menuSubtitle}>Alertas y recordatorios</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          {/* Privacidad */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('Privacidad', 'Configuración de privacidad - Próximamente')}
          >
            <Text style={styles.menuIcon}>🔒</Text>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Privacidad y Seguridad</Text>
              <Text style={styles.menuSubtitle}>Controla tu información</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          {/* Métodos de pago */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('Pagos', 'Gestionar métodos de pago - Próximamente')}
          >
            <Text style={styles.menuIcon}>💳</Text>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Métodos de pago</Text>
              <Text style={styles.menuSubtitle}>Tarjetas y pagos</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          {/* Exportar datos */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              if (user.isPremium) {
                router.push('/(tabs)/reports');
              } else {
                Alert.alert('Premium', 'La exportación de datos requiere Premium');
              }
            }}
          >
            <Text style={styles.menuIcon}>📊</Text>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Exportar datos</Text>
              <Text style={styles.menuSubtitle}>Descarga tus datos</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          {/* Quiénes Somos */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(tabs)/about')}
          >
            <Text style={styles.menuIcon}>ℹ️</Text>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Quiénes Somos</Text>
              <Text style={styles.menuSubtitle}>Conoce más sobre FINIA</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          {/* Ayuda */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('Ayuda', 'soporte@finia.app')}
          >
            <Text style={styles.menuIcon}>❓</Text>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Ayuda y Soporte</Text>
              <Text style={styles.menuSubtitle}>Centro de ayuda</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          {/* Términos */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('Términos', 'Ver términos y condiciones')}
          >
            <Text style={styles.menuIcon}>📄</Text>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Términos y Condiciones</Text>
              <Text style={styles.menuSubtitle}>Políticas de uso</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>FINIA v1.0.0</Text>
          <Text style={styles.footerSubtext}>Tu asistente financiero inteligente</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E27' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#9CA3AF' },
  scroll: { flex: 1 },
  header: { padding: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
  userCard: { backgroundColor: '#151B3D', borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 24 },
  userHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 64, height: 64, borderRadius: 32, marginRight: 16 },
  avatarPlaceholder: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#00D4AA', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#0A0E27' },
  userInfo: { flex: 1 },
  userName: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  userEmail: { fontSize: 14, color: '#9CA3AF' },
  planBadge: { borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center' },
  planBadgeIcon: { fontSize: 24, marginRight: 12 },
  planBadgeContent: { flex: 1 },
  planBadgeTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 2 },
  planBadgeSubtitle: { fontSize: 12, color: '#FFFFFF', opacity: 0.8 },
  memberSince: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#2D3748' },
  memberSinceText: { fontSize: 12, color: '#9CA3AF', textAlign: 'center' },
  menu: { paddingHorizontal: 20, marginBottom: 24 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#151B3D', borderRadius: 12, padding: 16, marginBottom: 8 },
  menuIcon: { fontSize: 24, marginRight: 16 },
  menuContent: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginBottom: 2 },
  menuSubtitle: { fontSize: 13, color: '#9CA3AF' },
  menuArrow: { fontSize: 24, color: '#9CA3AF', marginLeft: 8 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1E2749', borderRadius: 12, padding: 16, marginHorizontal: 20, marginBottom: 32, borderWidth: 1, borderColor: '#FF7675' },
  logoutIcon: { fontSize: 20, marginRight: 8 },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#FF7675' },
  footer: { padding: 32, alignItems: 'center' },
  footerText: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  footerSubtext: { fontSize: 12, color: '#6B7280' },
});
