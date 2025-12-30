import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AboutScreen() {
  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scroll} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Atrás</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quiénes Somos</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroIcon}>💰</Text>
          <Text style={styles.heroTitle}>FINIA</Text>
          <Text style={styles.heroSubtitle}>Tu asistente financiero inteligente</Text>
        </View>

        {/* Misión */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="rocket" size={28} color="#00D4AA" />
            <Text style={styles.sectionTitle}>Nuestra Misión</Text>
          </View>
          <Text style={styles.sectionText}>
            Transformar la relación de las personas con el dinero a través de tecnología inteligente y accesible.
          </Text>
          <Text style={styles.sectionText}>
            Creemos que todos merecen tener control total sobre sus finanzas personales, sin importar su nivel de conocimiento financiero.
          </Text>
        </View>

        {/* Objetivos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="target" size={28} color="#FFD700" />
            <Text style={styles.sectionTitle}>Nuestros Objetivos</Text>
          </View>
          
          <View style={styles.objectiveCard}>
            <View style={styles.objectiveIcon}>
              <Ionicons name="trending-down" size={24} color="#00D4AA" />
            </View>
            <View style={styles.objectiveContent}>
              <Text style={styles.objectiveTitle}>Reducir el nivel de deudas</Text>
              <Text style={styles.objectiveText}>
                Ayudarte a identificar gastos innecesarios y crear estrategias personalizadas para salir de deudas más rápido.
              </Text>
            </View>
          </View>

          <View style={styles.objectiveCard}>
            <View style={styles.objectiveIcon}>
              <Ionicons name="wallet" size={24} color="#00D4AA" />
            </View>
            <View style={styles.objectiveContent}>
              <Text style={styles.objectiveTitle}>Mejorar el ahorro personal</Text>
              <Text style={styles.objectiveText}>
                Establecer metas de ahorro alcanzables y brindarte las herramientas para cumplirlas consistentemente.
              </Text>
            </View>
          </View>

          <View style={styles.objectiveCard}>
            <View style={styles.objectiveIcon}>
              <Ionicons name="school" size={24} color="#00D4AA" />
            </View>
            <View style={styles.objectiveContent}>
              <Text style={styles.objectiveTitle}>Democratizar la educación financiera</Text>
              <Text style={styles.objectiveText}>
                Hacer que el conocimiento financiero sea accesible para todos, sin jerga complicada ni barreras de entrada.
              </Text>
            </View>
          </View>
        </View>

        {/* Impacto */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people" size={28} color="#FF7675" />
            <Text style={styles.sectionTitle}>Nuestro Impacto</Text>
          </View>
          
          <Text style={styles.impactText}>
            Nuestra visión es ser la herramienta que transforma la relación con el dinero de millones de peruanos, ayudándolos a alcanzar la libertad financiera.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>FINIA v1.0.0</Text>
          <Text style={styles.footerSubtext}>Hecho con 💚 en Perú</Text>
          <Text style={styles.footerCopyright}>© 2024 FINIA. Todos los derechos reservados.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0E27' },
  scroll: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12 },
  backButton: { fontSize: 16, color: '#00D4AA', fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  heroSection: { alignItems: 'center', padding: 40, paddingBottom: 20 },
  heroIcon: { fontSize: 80, marginBottom: 16 },
  heroTitle: { fontSize: 40, fontWeight: 'bold', color: '#00D4AA', marginBottom: 8 },
  heroSubtitle: { fontSize: 16, color: '#9CA3AF', textAlign: 'center' },
  section: { marginHorizontal: 20, marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', marginLeft: 12 },
  sectionText: { fontSize: 15, color: '#9CA3AF', lineHeight: 24, marginBottom: 12 },
  objectiveCard: { flexDirection: 'row', backgroundColor: '#151B3D', borderRadius: 12, padding: 16, marginBottom: 12 },
  objectiveIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1E2749', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  objectiveContent: { flex: 1 },
  objectiveTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 6 },
  objectiveText: { fontSize: 14, color: '#9CA3AF', lineHeight: 20 },
  impactText: { fontSize: 15, color: '#9CA3AF', lineHeight: 24, marginTop: 12, textAlign: 'center' },
  footer: { alignItems: 'center', padding: 40, paddingBottom: 60 },
  footerText: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  footerSubtext: { fontSize: 13, color: '#6B7280', marginBottom: 16 },
  footerCopyright: { fontSize: 11, color: '#4B5563' },
});
