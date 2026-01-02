#!/bin/bash

echo "╔════════════════════════════════════════╗"
echo "║  INSTALANDO TODAS LAS DEPENDENCIAS    ║"
echo "╚════════════════════════════════════════╝"

cd /home/jroque/Escritorio/finia-app

# Lista COMPLETA de dependencias
PACKAGES=(
    # Core Expo
    "expo@~52.0.0"
    "expo-router@~4.0.0"
    "expo-status-bar@~2.0.0"
    "expo-constants@~17.0.0"
    "expo-linking@~7.0.0"
    "expo-font@~13.0.0"
    "expo-splash-screen@~0.29.0"
    
    # React & React Native
    "react@18.3.1"
    "react-native@0.76.5"
    "react-native-safe-area-context@4.12.0"
    "react-native-screens@~4.4.0"
    "react-native-gesture-handler@~2.20.0"
    "react-native-reanimated@~3.16.0"
    
    # Storage
    "@react-native-async-storage/async-storage@^2.1.0"
    "expo-secure-store@~14.0.0"
    
    # Firebase & Auth
    "@react-native-firebase/app@^21.6.2"
    "@react-native-firebase/auth@^21.6.2"
    "@react-native-google-signin/google-signin@^13.1.0"
    
    # Camera & Media
    "expo-camera@~16.0.0"
    "expo-image-picker@~16.0.0"
    
    # Voice
    "@react-native-voice/voice@^3.2.4"
    
    # File System & Sharing
    "expo-file-system@~18.0.0"
    "expo-sharing@~13.0.0"
    
    # Charts
    "react-native-chart-kit@^6.12.0"
    "react-native-svg@15.8.0"
    
    # HTTP & State
    "axios@^1.7.2"
    "zustand@^4.5.2"
)

echo -e "\n📦 Instalando ${#PACKAGES[@]} paquetes..."

for pkg in "${PACKAGES[@]}"; do
    PKG_NAME=$(echo $pkg | cut -d'@' -f1)
    echo "  [$((++COUNT))/${#PACKAGES[@]}] $PKG_NAME"
    npm install "$pkg" --legacy-peer-deps 2>&1 | grep -v "warn" | grep -v "deprecated" || true
done

echo -e "\n✅ TODOS LOS PAQUETES INSTALADOS"

# Verificar paquetes críticos
echo -e "\n🔍 Verificando instalación de paquetes críticos..."

CRITICAL=(
    "expo"
    "expo-camera"
    "@react-native-async-storage/async-storage"
    "@react-native-firebase/app"
    "@react-native-voice/voice"
    "expo-sharing"
    "zustand"
)

ALL_OK=true

for pkg in "${CRITICAL[@]}"; do
    if npm list "$pkg" 2>&1 | grep -q "$pkg@"; then
        echo "  ✅ $pkg"
    else
        echo "  ❌ $pkg FALTA"
        ALL_OK=false
    fi
done

if [ "$ALL_OK" = true ]; then
    echo -e "\n✅ Todos los paquetes críticos están instalados"
    echo -e "\n📋 Siguiente paso: Compilar"
    echo "   cd android"
    echo "   ./gradlew assembleRelease --no-daemon"
else
    echo -e "\n⚠️  Algunos paquetes faltan, revisa arriba"
fi
