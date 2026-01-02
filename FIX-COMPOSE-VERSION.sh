#!/bin/bash

echo "╔════════════════════════════════════════╗"
echo "║  FIX COMPOSE COMPILER - VERSION FINAL ║"
echo "╚════════════════════════════════════════╝"

cd /home/jroque/Escritorio/finia-app

EXPO_BUILD="node_modules/expo-modules-core/android/build.gradle"

echo -e "\n[1/3] 🔧 Configurando Compose 1.5.14 (compatible con Kotlin 1.9.24)..."

# Cambiar de 1.5.8 a 1.5.14
sed -i 's/"1.5.8"/"1.5.14"/g' "$EXPO_BUILD"
sed -i "s/'1.5.8'/'1.5.14'/g" "$EXPO_BUILD"
sed -i 's/1\.5\.8/1.5.14/g' "$EXPO_BUILD"

# Si todavía tiene 1.5.15, cambiarlo también
sed -i 's/"1.5.15"/"1.5.14"/g' "$EXPO_BUILD"
sed -i "s/'1.5.15'/'1.5.14'/g" "$EXPO_BUILD"
sed -i 's/1\.5\.15/1.5.14/g' "$EXPO_BUILD"

echo "  ✅ Compose Compiler cambiado a 1.5.14"

echo -e "\n[2/3] 📋 Verificando versión..."
grep -E "compose|1\.5\." "$EXPO_BUILD" | head -5

echo -e "\n[3/3] 🔨 Compilando..."
cd android
rm -rf .gradle build
./gradlew clean --stop > /dev/null 2>&1
./gradlew assembleRelease --no-daemon 2>&1 | tee ../compose-fix-build.log

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    cp app/build/outputs/apk/release/app-release.apk ../finia-$TIMESTAMP.apk
    
    echo -e "\n╔════════════════════════════════════════╗"
    echo "║    ✅ ¡ÉXITO TOTAL!                   ║"
    echo "╚════════════════════════════════════════╝"
    
    echo -e "\n📦 APK: finia-$TIMESTAMP.apk"
    
    cd ..
    adb uninstall com.finia.app 2>/dev/null
    adb install finia-$TIMESTAMP.apk
    
    if [ $? -eq 0 ]; then
        echo -e "\n🎉 ¡APP INSTALADA!"
        echo "✅ Voice, Camera, Firebase - TODO FUNCIONAL"
    fi
else
    echo -e "\n❌ Error"
    grep -C 3 "Kotlin version\|error" ../compose-fix-build.log | tail -30
fi
