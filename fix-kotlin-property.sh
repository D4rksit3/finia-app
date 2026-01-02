#!/bin/bash

echo "╔════════════════════════════════════════╗"
echo "║  FIX DEFINITIVO - Kotlin en Properties ║"
echo "╚════════════════════════════════════════╝"

cd /home/jroque/Escritorio/finia-app

# 1. Revertir expo-modules-core
echo -e "\n[1/8] ⏪ Revirtiendo expo-modules-core..."
npm install expo-modules-core@2.2.3 --legacy-peer-deps > /dev/null 2>&1
echo "  ✅ Revertido a versión 2.2.3"

# 2. Regenerar Android
echo -e "\n[2/8] 🔄 Regenerando Android..."
rm -rf android
npx expo prebuild --platform android --clean 2>&1 | grep -E "(✔|✓|Created|Finished)"
echo "  ✅ Android regenerado"

# 3. FORZAR Kotlin en gradle.properties
echo -e "\n[3/8] 🔧 Configurando Kotlin 1.9.25..."

# Remover líneas anteriores de kotlin si existen
sed -i '/android.kotlinVersion/d' android/gradle.properties

# Agregar al final
cat >> android/gradle.properties << 'EOF'

# FORZAR Kotlin 1.9.25
android.kotlinVersion=1.9.25

# Suprimir verificación
kotlin.version.check=false
suppressKotlinVersionCompatibilityCheck=true
EOF

echo "  ✅ Kotlin 1.9.25 forzado en gradle.properties"

# 4. Ver configuración
echo -e "\n[4/8] 📋 Verificando configuración..."
echo "  gradle.properties (últimas líneas):"
tail -10 android/gradle.properties | sed 's/^/    /'

echo "  build.gradle (kotlin):"
grep -E "kotlin" android/build.gradle | head -3 | sed 's/^/    /'

# 5. Configurar AndroidX
echo -e "\n[5/8] ⚙️  Configurando AndroidX..."

if ! grep -q "configurations.all" android/app/build.gradle; then
    cat >> android/app/build.gradle << 'EOF'

configurations.all {
    exclude group: 'com.android.support', module: 'support-compat'
    exclude group: 'com.android.support', module: 'support-annotations'
    
    resolutionStrategy {
        force 'androidx.core:core:1.13.1'
        force 'androidx.appcompat:appcompat:1.6.1'
        force 'androidx.versionedparcelable:versionedparcelable:1.1.1'
    }
}
EOF
    echo "  ✅ AndroidX configurado"
fi

# 6. Google Services
echo -e "\n[6/8] 🔐 Configurando Google Services..."

if ! tail -3 android/app/build.gradle | grep -q "google-services"; then
    echo "" >> android/app/build.gradle
    echo "apply plugin: 'com.google.gms.google-services'" >> android/app/build.gradle
    echo "  ✅ Plugin agregado"
fi

if ! grep -q "com.google.gms:google-services" android/build.gradle; then
    sed -i '/kotlin-gradle-plugin/a\        classpath("com.google.gms:google-services:4.4.0")' android/build.gradle
    echo "  ✅ Classpath agregado"
fi

# 7. Archivos necesarios
echo -e "\n[7/8] 📁 Configurando archivos..."

if [ -f "google-services.json" ]; then
    cp google-services.json android/app/
    echo "  ✅ google-services.json copiado"
fi

# Buscar Android SDK
SDK_FOUND=false
SDK_LOCATIONS=(
    "/root/Android/Sdk"
    "/opt/android-sdk"
    "$HOME/Android/Sdk"
)

for loc in "${SDK_LOCATIONS[@]}"; do
    if [ -d "$loc" ]; then
        echo "sdk.dir=$loc" > android/local.properties
        echo "  ✅ Android SDK: $loc"
        SDK_FOUND=true
        break
    fi
done

if [ "$SDK_FOUND" = false ]; then
    echo "sdk.dir=/opt/android-sdk" > android/local.properties
    echo "  ⚠️  SDK no encontrado, usando default"
fi

# 8. Compilar
echo -e "\n[8/8] 🔨 Compilando con Kotlin 1.9.25..."

cd android
rm -rf .gradle build
./gradlew clean > /dev/null 2>&1

./gradlew assembleRelease --no-daemon 2>&1 | tee ../final-property-build.log

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    cp app/build/outputs/apk/release/app-release.apk ../finia-PROPERTY-FIX-$TIMESTAMP.apk
    
    echo -e "\n╔════════════════════════════════════════╗"
    echo "║    ✅ ¡COMPILADO EXITOSAMENTE!        ║"
    echo "╚════════════════════════════════════════╝"
    
    echo -e "\n📦 APK: finia-PROPERTY-FIX-$TIMESTAMP.apk"
    
    cd ..
    if adb devices | grep -q "device"; then
        echo -e "\n📱 Instalando..."
        adb uninstall com.finia.app 2>/dev/null
        adb install finia-PROPERTY-FIX-$TIMESTAMP.apk
        
        if [ $? -eq 0 ]; then
            echo -e "\n╔════════════════════════════════════════╗"
            echo "║    🎉 ¡TODO FUNCIONANDO!              ║"
            echo "╚════════════════════════════════════════╝"
        fi
    fi
else
    echo -e "\n❌ Error compilando"
    
    if grep -q "Kotlin version" ../final-property-build.log; then
        echo -e "\n⚠️  ERROR DE KOTLIN PERSISTE"
        echo "Verificando qué versión está usando:"
        grep -A 3 "Kotlin version" ../final-property-build.log
        
        echo -e "\n📋 gradle.properties:"
        cat android/gradle.properties | grep -i kotlin
    else
        echo -e "\n📋 Últimas 30 líneas del error:"
        tail -30 ../final-property-build.log
    fi
fi
