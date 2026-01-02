#!/bin/bash

echo "╔════════════════════════════════════════╗"
echo "║  FIX EXPO-MODULES-CORE DIRECTAMENTE   ║"
echo "╚════════════════════════════════════════╝"

cd /home/jroque/Escritorio/finia-app

EXPO_BUILD="node_modules/expo-modules-core/android/build.gradle"

echo -e "\n[1/4] 🔧 Modificando expo-modules-core/build.gradle..."

# Hacer backup
cp "$EXPO_BUILD" "$EXPO_BUILD.backup"

# Downgrade Compose Compiler de 1.5.15 a 1.5.8 (compatible con 1.9.24)
sed -i 's/1\.5\.15/1.5.8/g' "$EXPO_BUILD"

# Forzar Kotlin 1.9.25 en el archivo
sed -i 's/1\.9\.24/1.9.25/g' "$EXPO_BUILD"

# Agregar supresión al inicio
if ! grep -q "freeCompilerArgs" "$EXPO_BUILD"; then
    # Buscar donde está el bloque kotlinOptions y agregar
    sed -i '/kotlinOptions {/a\            freeCompilerArgs += ["-Xsuppress-version-warnings"]' "$EXPO_BUILD"
fi

echo "  ✅ expo-modules-core modificado"

echo -e "\n[2/4] 📋 Verificando cambios..."
grep -E "compose|kotlin|freeCompilerArgs" "$EXPO_BUILD" | head -10

echo -e "\n[3/4] 🧹 Limpiando cache..."
rm -rf ~/.gradle/caches
rm -rf android/.gradle
rm -rf android/build

echo -e "\n[4/4] 🔨 Compilando..."
cd android
./gradlew clean --stop > /dev/null 2>&1
./gradlew assembleRelease --no-daemon 2>&1 | tee ../fix-expo-build.log

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    cp app/build/outputs/apk/release/app-release.apk ../finia-$TIMESTAMP.apk
    
    echo -e "\n╔════════════════════════════════════════╗"
    echo "║    ✅ ¡COMPILADO!                     ║"
    echo "╚════════════════════════════════════════╝"
    
    echo -e "\n📦 /home/jroque/Escritorio/finia-app/finia-$TIMESTAMP.apk"
    
    cd ..
    adb uninstall com.finia.app 2>/dev/null
    adb install finia-$TIMESTAMP.apk
    echo "✅ INSTALADO"
else
    echo -e "\n❌ Error"
    grep -i "kotlin.*version\|error" ../fix-expo-build.log | tail -20
fi
