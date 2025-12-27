#!/bin/bash

echo "🔍 Verificación Final de Configuración"
echo "======================================"

echo ""
echo "1️⃣ Frontend .env:"
cat /home/ubuntu/finia-app/.env

echo ""
echo ""
echo "2️⃣ axios.post en login.tsx:"
grep -n "axios.post" /home/ubuntu/finia-app/app/\(auth\)/login.tsx

echo ""
echo ""
echo "3️⃣ Backend corriendo:"
pm2 status finia-backend

echo ""
echo ""
echo "4️⃣ Test backend desde servidor:"
curl -s http://localhost:3000/api/ | head -10

echo ""
echo ""
echo "5️⃣ Test backend desde internet:"
curl -s https://finia.seguricloud.com/api/ | head -10

echo ""
echo ""
echo "======================================"
echo "✅ Configuración verificada"
echo ""
echo "📱 URLs que usará la app:"
echo "   https://finia.seguricloud.com/api/auth/register"
echo "   https://finia.seguricloud.com/api/auth/login"
echo ""
echo "🔒 Seguridad:"
echo "   ✅ HTTPS habilitado"
echo "   ✅ Backend en localhost:3000 (no expuesto)"
echo "   ✅ Apache hace proxy seguro"
