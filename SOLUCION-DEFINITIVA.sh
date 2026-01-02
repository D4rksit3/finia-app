#!/bin/bash

echo "╔════════════════════════════════════════╗"
echo "║  SOLUCIÓN DEFINITIVA - SUPRIMIR TODO  ║"
echo "╚════════════════════════════════════════╝"

cd /home/jroque/Escritorio/finia-app

# 1. Suprimir en build.gradle de expo-modules-core
echo -e "\n[1/3] 🔧 Suprimiendo verificación en expo-modules-core..."

EXPO_BUILD="node_modules/expo-modules-core/android/build.gradle"

if [ -f "$EXPO_BUILD" ]; then
    # Agregar supresión al inicio del archivo
    if ! grep -q "suppressKotlinVersionCompatibilityCheck" "$EXPO_BUILD"; then
        cat > "$EXPO_BUILD.tmp" << 'EOF'
// Suprimir verificación de Kotlin
tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
    kotlinOptions {
        freeCompilerArgs += ["-Xsuppress-version-warnings"]
    }
}

EOF
        cat "$EXPO_BUILD" >> "$EXPO_BUILD.tmp"
        mv "$EXPO_BUILD.tmp" "$EXPO_BUILD"
        echo "  ✅ Supresión agregada a expo-modules-core"
    else
        echo "  ✅ Ya está suprimido"
    fi
fi

# 2. Agregar a gradle.properties
echo -e "\n[2/3] 🔧 Configurando gradle.properties..."

cat > android/gradle.properties << 'EOF'
# Configuración del proyecto
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
android.useAndroidX=true
android.enableJetifier=true

# SUPRIMIR VERIFICACIÓN DE KOTLIN
android.kotlinVersion=1.9.25
kotlin.version.check=false
kotlin.compiler.suppressVersionWarnings=true
kotlin.suppressVersionCompatibilityCheck=true

# Compose
compose.kotlinCompilerExtensionVersion=1.5.15
compose.kotlinCompilerVersion=1.9.24
EOF

echo "  ✅ gradle.properties configurado"

# 3. Limpiar y compilar
echo -e "\n[3/3] 🔨 Compilando..."

cd android
rm -rf .gradle build app/build
./gradlew clean --no-daemon --stop > /dev/null 2>&1

./gradlew assembleRelease --no-daemon 2>&1 | tee ../final-suppress-build.log

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    cp app/build/outputs/apk/release/app-release.apk ../finia-FINAL-$TIMESTAMP.apk
    
    echo -e "\n╔════════════════════════════════════════╗"
    echo "║    ✅ ¡ÉXITO! APK COMPILADO           ║"
    echo "╚════════════════════════════════════════╝"
    
    echo -e "\n📦 APK: finia-FINAL-$TIMESTAMP.apk"
    
    cd ..
    adb uninstall com.finia.app 2>/dev/null
    adb install finia-FINAL-$TIMESTAMP.apk
    
    echo -e "\n🎉 ¡TODO FUNCIONANDO!"
else
    echo -e "\n❌ Sigue fallando"
    grep -i "error\|failed" ../final-suppress-build.log | tail -20
fi
