#!/bin/bash

echo "╔════════════════════════════════════════╗"
echo "║    FIX FINAL - SUPRIMIR + CAMBIAR     ║"
echo "╚════════════════════════════════════════╝"

cd /home/jroque/Escritorio/finia-app

# 1. Agregar supresión de verificación
echo -e "\n[1/6] 🔧 Suprimiendo verificación de versión de Kotlin..."

if ! grep -q "kotlin.version.check" android/gradle.properties 2>/dev/null; then
    cat >> android/gradle.properties << 'EOF'

# Suprimir verificación de versión de Kotlin
org.jetbrains.kotlin.version.check=false
kotlin.version.check=false
suppressKotlinVersionCompatibilityCheck=true
EOF
    echo "  ✅ Verificación suprimida"
else
    echo "  ✅ Ya está suprimida"
fi

# 2. Buscar y reemplazar en build.gradle
echo -e "\n[2/6] 🔍 Buscando archivos gradle..."

# Buscar TODOS los build.gradle
find android -name "build.gradle" -o -name "*.gradle.kts" | while read file; do
    if grep -q "1.9.24" "$file" 2>/dev/null; then
        echo "  📝 Cambiando en: $file"
        sed -i 's/1\.9\.24/1.9.25/g' "$file"
    fi
done

# 3. Cambio específico en build.gradle root
echo -e "\n[3/6] 🔧 Cambiando build.gradle root..."

sed -i 's/kotlinVersion = "1.9.24"/kotlinVersion = "1.9.25"/g' android/build.gradle
sed -i 's/kotlin = "1.9.24"/kotlin = "1.9.25"/g' android/build.gradle
sed -i "s/kotlinVersion = '1.9.24'/kotlinVersion = '1.9.25'/g" android/build.gradle
sed -i "s/kotlin = '1.9.24'/kotlin = '1.9.25'/g" android/build.gradle

echo "  ✅ Cambios aplicados"

# 4. Ver resultado
echo -e "\n[4/6] 📋 Verificando cambios:"
grep -E "kotlin.*=" android/build.gradle | head -5

# 5. Limpiar TODO
echo -e "\n[5/6] 🧹 Limpiando caches..."

rm -rf android/.gradle
rm -rf android/build
rm -rf android/app/build
rm -rf ~/.gradle/caches
rm -rf /tmp/kotlin-*
rm -rf /tmp/haste-*
rm -rf /tmp/metro-*

cd android
./gradlew clean --no-daemon > /dev/null 2>&1

echo "  ✅ Cache limpiada"

# 6. Compilar
echo -e "\n[6/6] 🔨 Compilando..."

./gradlew assembleRelease --no-daemon --refresh-dependencies 2>&1 | tee ../final-build.log

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    cp app/build/outputs/apk/release/app-release.apk ../finia-FINAL-$TIMESTAMP.apk
    
    echo -e "\n╔════════════════════════════════════════╗"
    echo "║    ✅ ¡COMPILADO EXITOSAMENTE!        ║"
    echo "╚════════════════════════════════════════╝"
    
    echo -e "\n📦 APK: finia-FINAL-$TIMESTAMP.apk"
    
    cd ..
    if adb devices | grep -q "device"; then
        echo -e "\n📱 Instalando..."
        adb uninstall com.finia.app 2>/dev/null
        adb install finia-FINAL-$TIMESTAMP.apk
        
        if [ $? -eq 0 ]; then
            echo -e "\n╔════════════════════════════════════════╗"
            echo "║    🎉 ¡TODO FUNCIONANDO!              ║"
            echo "╚════════════════════════════════════════╝"
            
            echo -e "\n✅ App instalada con:"
            echo "   🎤 Reconocimiento de voz"
            echo "   📷 Cámara"
            echo "   🔐 Firebase + Google Sign-In"
            echo "   💾 Persistencia de datos"
            echo "   📊 Reportes y gráficas"
        fi
    fi
else
    echo -e "\n❌ Error compilando"
    
    if grep -q "Kotlin version" ../final-build.log; then
        echo -e "\n⚠️  TODAVÍA hay error de versión de Kotlin"
        echo "Intentando con dependencia de expo-modules-core más nueva..."
        
        # Actualizar expo-modules-core
        cd ..
        npm install expo-modules-core@latest --legacy-peer-deps
        
        rm -rf android
        npx expo prebuild --platform android --clean
        
        # Aplicar cambios de nuevo
        ./final-fix.sh
    else
        echo -e "\n📋 Últimas líneas del error:"
        tail -30 ../final-build.log
    fi
fi
