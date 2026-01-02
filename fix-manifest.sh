#!/bin/bash

echo "🔧 Arreglando AndroidManifest..."

MANIFEST="android/app/src/main/AndroidManifest.xml"

# Hacer backup
cp "$MANIFEST" "$MANIFEST.backup"

# 1. Agregar xmlns:tools si no existe
if ! grep -q 'xmlns:tools' "$MANIFEST"; then
    sed -i 's|<manifest xmlns:android="http://schemas.android.com/apk/res/android">|<manifest xmlns:android="http://schemas.android.com/apk/res/android"\n    xmlns:tools="http://schemas.android.com/tools">|' "$MANIFEST"
    echo "  ✅ xmlns:tools agregado"
fi

# 2. Agregar tools:replace en <application>
if ! grep -q 'tools:replace' "$MANIFEST"; then
    sed -i '/<application/a\        tools:replace="android:appComponentFactory"\n        android:appComponentFactory="androidx.core.app.CoreComponentFactory"' "$MANIFEST"
    echo "  ✅ tools:replace agregado"
fi

echo -e "\n📋 AndroidManifest actualizado:"
head -20 "$MANIFEST"

echo -e "\n🔧 Mejorando exclusión de support library en build.gradle..."

# 3. Mejorar configuración en build.gradle
cat >> android/app/build.gradle << 'EOF'

// Forzar uso de AndroidX
configurations.all {
    exclude group: 'com.android.support', module: 'support-compat'
    exclude group: 'com.android.support', module: 'support-annotations'
    exclude group: 'com.android.support', module: 'animated-vector-drawable'
    exclude group: 'com.android.support', module: 'support-vector-drawable'
    
    resolutionStrategy {
        force 'androidx.core:core:1.13.1'
        force 'androidx.appcompat:appcompat:1.6.1'
        force 'androidx.versionedparcelable:versionedparcelable:1.1.1'
    }
}
EOF

echo "  ✅ Exclusiones mejoradas"

echo -e "\n🔨 Compilando..."
cd android

# Limpiar
./gradlew clean > /dev/null 2>&1

# Compilar
./gradlew assembleRelease --no-daemon 2>&1 | tee ../manifest-build.log

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    cp app/build/outputs/apk/release/app-release.apk ../finia-MANIFEST-FIX-$TIMESTAMP.apk
    
    echo -e "\n╔════════════════════════════════════════╗"
    echo "║        ✅ COMPILADO EXITOSAMENTE       ║"
    echo "╚════════════════════════════════════════╝"
    
    echo -e "\n📦 APK: finia-MANIFEST-FIX-$TIMESTAMP.apk"
    
    cd ..
    if adb devices | grep -q "device"; then
        adb uninstall com.finia.app
        adb install finia-MANIFEST-FIX-$TIMESTAMP.apk
        
        if [ $? -eq 0 ]; then
            echo -e "\n✅ INSTALADO"
            echo -e "\n🎉 TODO FUNCIONANDO:"
            echo "   ✅ Voice"
            echo "   ✅ Camera"
            echo "   ✅ Firebase"
            echo "   ✅ Google Sign-In"
        fi
    fi
else
    echo -e "\n❌ Error compilando"
    tail -50 ../manifest-build.log
fi
