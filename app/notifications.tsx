import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import axios from 'axios';
import authService from '@/services/auth/authService';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://finia.seguricloud.com/api';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const token = await authService.getToken();
      const response = await axios.get(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(response.data.notifications || []);
    } catch (error: any) {
      console.error('Error loadNotifications:', error);
      Alert.alert('Error', 'No se pudieron cargar las notificaciones');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const token = await authService.getToken();
      await axios.post(
        `${API_URL}/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadNotifications();
    } catch (error) {
      console.error('Error markAsRead:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = await authService.getToken();
      await axios.post(
        `${API_URL}/notifications/read-all`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Éxito', 'Todas las notificaciones marcadas como leídas');
      loadNotifications();
    } catch (error) {
      console.error('Error markAllAsRead:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      motivation: '💪',
      warning: '⚠️',
      critical: '🚨',
      achievement: '🎉',
      referral: '👥',
      info: 'ℹ️',
    };
    return icons[type] || '🔔';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      motivation: '#00D4AA',
      warning: '#FF9800',
      critical: '#FF6B6B',
      achievement: '#4CAF50',
      referral: '#2196F3',
      info: '#8F92A1',
    };
    return colors[type] || '#8F92A1';
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Atrás</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notificaciones</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllButton}>Marcar todas</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Contador */}
      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Text style={styles.unreadText}>
            {unreadCount} notificación{unreadCount > 1 ? 'es' : ''} sin leer
          </Text>
        </View>
      )}

      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={loadNotifications} />}>
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyText}>No tienes notificaciones</Text>
            <Text style={styles.emptySubtext}>Te notificaremos cuando haya novedades</Text>
          </View>
        ) : (
          notifications.map((notif) => (
            <TouchableOpacity
              key={notif.id}
              style={[styles.notifCard, !notif.is_read && styles.unreadCard]}
              onPress={() => !notif.is_read && markAsRead(notif.id)}
            >
              <View style={styles.notifHeader}>
                <Text style={styles.notifIcon}>{getTypeIcon(notif.type)}</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.notifTitle}>{notif.title}</Text>
                  <Text style={styles.notifMessage}>{notif.message}</Text>
                  <Text style={styles.notifDate}>
                    {new Date(notif.created_at).toLocaleString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                {!notif.is_read && <View style={styles.unreadDot} />}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
  markAllButton: { color: '#00D4AA', fontSize: 14, fontWeight: '600' },
  
  unreadBanner: {
    backgroundColor: '#00D4AA',
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
  },
  unreadText: { color: '#0A0E27', fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 18, color: '#FFFFFF', fontWeight: 'bold', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#8F92A1', textAlign: 'center' },
  
  notifCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    backgroundColor: '#1A1F3A',
    borderRadius: 16,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#00D4AA',
  },
  
  notifHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  notifIcon: { fontSize: 32 },
  notifTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  notifMessage: { fontSize: 14, color: '#8F92A1', marginBottom: 8 },
  notifDate: { fontSize: 12, color: '#666' },
  
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00D4AA',
    marginLeft: 8,
  },
});
