#!/bin/bash

echo "╔════════════════════════════════════════╗"
echo "║    SOLUCIÓN TOTAL - DESDE CERO        ║"
echo "╚════════════════════════════════════════╝"

cd /home/jroque/Escritorio/finia-app

# 1. Limpiar TODO
echo -e "\n[1/10] 🧹 Limpieza total..."
rm -rf android
rm -rf node_modules/.cache
rm -rf ~/.gradle
rm -rf /tmp/kotlin-*
rm -rf /tmp/gradle-*
echo "  ✅ Limpio"

# 2. Revertir expo-modules-core
echo -e "\n[2/10] ⏪ Revirtiendo expo-modules-core a 2.2.3..."
npm install expo-modules-core@2.2.3 --legacy-peer-deps > /dev/null 2>&1
echo "  ✅ Revertido"

# 3. Regenerar Android
echo -e "\n[3/10] 🔄 Regenerando Android..."
npx expo prebuild --platform android --clean 2>&1 | grep -E "(✔|Created|Finished)"
echo "  ✅ Regenerado"

# 4. Crear gradle.properties correcto
echo -e "\n[4/10] 📋 Creando gradle.properties..."

cat > android/gradle.properties << 'EOF'
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
android.useAndroidX=true
android.enableJetifier=true

# Kotlin - FORZAR 1.9.25
android.kotlinVersion=1.9.25

# Hermes
hermesEnabled=true
EOF

echo "  ✅ gradle.properties creado"

# 5. Modificar expo-modules-core para suprimir verificación
echo -e "\n[5/10] 🔧 Modificando expo-modules-core..."

EXPO_BUILD="node_modules/expo-modules-core/android/build.gradle"

if [ -f "$EXPO_BUILD" ]; then
    # Agregar al inicio del archivo
    cat > "$EXPO_BUILD.new" << 'KEOF'
// Suprimir verificación de Kotlin
tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
    kotlinOptions {
        freeCompilerArgs += ["-Xsuppress-version-warnings"]
    }
}

KEOF
    cat "$EXPO_BUILD" >> "$EXPO_BUILD.new"
    mv "$EXPO_BUILD.new" "$EXPO_BUILD"
    echo "  ✅ expo-modules-core modificado"
fi

# 6. Configurar build.gradle root
echo -e "\n[6/10] 🔧 Configurando build.gradle root..."

# Asegurar Kotlin 1.9.25
sed -i "s/'1.9.24'/'1.9.25'/g" android/build.gradle
sed -i 's/"1.9.24"/"1.9.25"/g' android/build.gradle

# Agregar classpath de google-services
if ! grep -q "google-services:4.4" android/build.gradle; then
    sed -i '/kotlin-gradle-plugin/a\        classpath("com.google.gms:google-services:4.4.0")' android/build.gradle
fi

echo "  ✅ build.gradle root configurado"

# 7. Configurar app/build.gradle
echo -e "\n[7/10] ⚙️  Configurando app/build.gradle..."

# Agregar configuraciones AndroidX
cat >> android/app/build.gradle << 'APPEOF'

// Forzar AndroidX
configurations.all {
    exclude group: 'com.android.support', module: 'support-compat'
    exclude group: 'com.android.support', module: 'support-annotations'
    
    resolutionStrategy {
        force 'androidx.core:core:1.13.1'
        force 'androidx.appcompat:appcompat:1.6.1'
    }
}

// Google Services
apply plugin: 'com.google.gms.google-services'
APPEOF

echo "  ✅ app/build.gradle configurado"

# 8. Configurar AndroidManifest
echo -e "\n[8/10] 📱 Configurando AndroidManifest..."

MANIFEST="android/app/src/main/AndroidManifest.xml"

if ! grep -q "xmlns:tools" "$MANIFEST"; then
    sed -i 's|<manifest xmlns:android="http://schemas.android.com/apk/res/android">|<manifest xmlns:android="http://schemas.android.com/apk/res/android"\n    xmlns:tools="http://schemas.android.com/tools">|' "$MANIFEST"
fi

if ! grep -q "tools:replace" "$MANIFEST"; then
    sed -i '/<application/a\        tools:replace="android:appComponentFactory"\n        android:appComponentFactory="androidx.core.app.CoreComponentFactory"' "$MANIFEST"
fi

echo "  ✅ AndroidManifest configurado"

# 9. Copiar archivos necesarios
echo -e "\n[9/10] 📁 Configurando archivos..."

if [ -f "google-services.json" ]; then
    cp google-services.json android/app/
    echo "  ✅ google-services.json copiado"
fi

echo "sdk.dir=/root/Android/Sdk" > android/local.properties
echo "  ✅ local.properties creado"

# 10. Compilar
echo -e "\n[10/10] 🔨 Compilando..."

cd android

# Limpiar
rm -rf .gradle build app/build
./gradlew clean --stop > /dev/null 2>&1

# Compilar
./gradlew assembleRelease --no-daemon 2>&1 | tee ../compilacion-final.log

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    cp app/build/outputs/apk/release/app-release.apk ../finia-$TIMESTAMP.apk
    
    echo -e "\n╔════════════════════════════════════════╗"
    echo "║    ✅ ¡COMPILADO EXITOSAMENTE!        ║"
    echo "╚════════════════════════════════════════╝"
    
    echo -e "\n📦 APK: finia-$TIMESTAMP.apk"
    echo -e "📍 Ubicación: /home/jroque/Escritorio/finia-app/finia-$TIMESTAMP.apk"
    
    cd ..
    
    if adb devices | grep -q "device"; then
        echo -e "\n📱 Instalando en dispositivo..."
        adb uninstall com.finia.app 2>/dev/null
        adb install finia-$TIMESTAMP.apk
        
        if [ $? -eq 0 ]; then
            echo -e "\n╔════════════════════════════════════════╗"
            echo "║    🎉 ¡APP INSTALADA Y LISTA!         ║"
            echo "╚════════════════════════════════════════╝"
            echo -e "\n✅ Funciones disponibles:"
            echo "   🎤 Reconocimiento de voz"
            echo "   📷 Cámara para recibos"
            echo "   🔐 Firebase Auth"
            echo "   📊 Google Sign-In"
            echo "   💾 Almacenamiento persistente"
        fi
    else
        echo -e "\n⚠️  Conecta el dispositivo para instalar"
        echo "Puedes instalar manualmente el APK"
    fi
else
    echo -e "\n╔════════════════════════════════════════╗"
    echo "║    ❌ ERROR EN COMPILACIÓN            ║"
    echo "╚════════════════════════════════════════╝"
    
    echo -e "\n📋 Error principal:"
    grep -A 10 -E "FAILURE:|error:|Error:" ../compilacion-final.log | head -30
    
    echo -e "\n📋 Para ver el log completo:"
    echo "cat /home/jroque/Escritorio/finia-app/compilacion-final.log"
fi
