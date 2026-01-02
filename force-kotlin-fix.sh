#!/bin/bash

echo "🔧 FORZANDO CAMBIO DE KOTLIN A 1.9.25..."

cd /home/jroque/Escritorio/finia-app

# 1. Verificar archivo build.gradle root
echo -e "\n📋 Contenido actual de build.gradle:"
cat android/build.gradle | head -40

echo -e "\n🔍 Buscando todas las ocurrencias de Kotlin 1.9.24..."
grep -rn "1\.9\.24" android/ 2>/dev/null

# 2. Cambiar TODAS las ocurrencias
echo -e "\n🔧 Cambiando 1.9.24 → 1.9.25 en TODOS los archivos..."

find android/ -type f \( -name "*.gradle" -o -name "*.gradle.kts" \) -exec sed -i 's/1\.9\.24/1.9.25/g' {} \;

echo "✅ Cambios aplicados"

# 3. Verificar cambios
echo -e "\n✅ Verificando cambios:"
grep -rn "kotlin" android/build.gradle | grep "=" | head -10

# 4. Limpiar TODA la cache
echo -e "\n🧹 Limpiando cache completa..."
rm -rf android/.gradle
rm -rf android/build
rm -rf android/app/build
rm -rf ~/.gradle/caches
rm -rf /tmp/kotlin-daemon*

cd android
./gradlew clean --no-daemon

echo -e "\n🔨 Compilando con Kotlin 1.9.25..."
./gradlew assembleRelease --no-daemon --refresh-dependencies 2>&1 | tee ../force-kotlin-build.log

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    cp app/build/outputs/apk/release/app-release.apk ../finia-FORCE-FIX-$TIMESTAMP.apk
    
    echo -e "\n✅ COMPILADO: finia-FORCE-FIX-$TIMESTAMP.apk"
    
    cd ..
    if adb devices | grep -q "device"; then
        adb uninstall com.finia.app
        adb install finia-FORCE-FIX-$TIMESTAMP.apk
        echo "✅ INSTALADO"
    fi
else
    echo -e "\n❌ Error - Ver build log"
    
    # Buscar el error específico de Kotlin
    echo -e "\n📋 Error de Kotlin:"
    grep -A 5 "Kotlin version" ../force-kotlin-build.log
fi
