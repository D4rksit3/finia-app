#!/bin/bash

echo "🔍 Agregando logs de debug..."

# Hacer backup
cp app/\(auth\)/login.tsx app/\(auth\)/login.tsx.backup.debug

# Agregar logs después de línea 8
sed -i '9i console.log("🟢 API_URL from env:", process.env.EXPO_PUBLIC_API_URL);' app/\(auth\)/login.tsx
sed -i '10i console.log("🟢 API_URL final:", API_URL);' app/\(auth\)/login.tsx

# Agregar logs en handleEmailAuth
sed -i '/const endpoint = isRegister/a\    const fullUrl = `${API_URL}${endpoint}`;\n    console.log("🔴 FULL URL:", fullUrl);\n    console.log("🔴 Payload:", payload);' app/\(auth\)/login.tsx

echo "✅ Logs agregados"
echo ""
echo "Verificando:"
grep "console.log" app/\(auth\)/login.tsx

echo ""
echo "Limpiando cache..."
rm -rf .expo

echo ""
echo "✅ Listo. Ahora ejecuta:"
echo "   npx expo start --clear --tunnel"
echo ""
echo "Y mira los logs cuando abras la app"
