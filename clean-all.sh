#!/bin/bash

echo "🔥 LIMPIEZA TOTAL DE EXPO"
echo "========================"

# Matar procesos
echo "1️⃣ Matando procesos..."
pkill -9 -f "expo" 2>/dev/null
pkill -9 -f "metro" 2>/dev/null
pkill -9 -f "node.*8081" 2>/dev/null

sleep 2

# Borrar cache
echo "2️⃣ Borrando cache..."
rm -rf .expo .metro node_modules/.cache
rm -rf /tmp/metro-* /tmp/react-* /tmp/haste-*
rm -rf ~/.expo ~/snap/expo-cli
watchman watch-del-all 2>/dev/null

# Limpiar npm
echo "3️⃣ Limpiando npm..."
npm cache clean --force

# Reinstalar node_modules
echo "4️⃣ Reinstalando dependencias..."
rm -rf node_modules
npm install

# Verificar .env
echo "5️⃣ Verificando .env..."
cat .env

echo ""
echo "========================"
echo "✅ Limpieza completada"
echo ""
echo "🚀 Ahora ejecuta:"
echo "   npx expo start --clear --reset-cache --tunnel"
