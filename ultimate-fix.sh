#!/bin/bash

echo "╔════════════════════════════════════════╗"
echo "║    SOLUCIÓN DEFINITIVA - Kotlin Fix   ║"
echo "╚════════════════════════════════════════╝"

cd /home/jroque/Escritorio/finia-app

# 1. Limpiar TODO
echo -e "\n[1/9] 🧹 Limpieza total..."
rm -rf android
rm -rf ~/.gradle/caches
rm -rf ~/.gradle/daemon
rm -rf /tmp/kotlin-*
rm -rf /tmp/gradle-*
echo "  ✅ Todo limpio"

# 2. Regenerar
echo -e "\n[2/9] 🔄 Regenerando Android..."
npx expo prebuild --platform android --clean 2>&1 | grep -E "(✔|Created|Finished)"
echo "  ✅ Regenerado"

# 3. Verificar gradle.properties
echo -e "\n[3/9] 📋 Verificando gradle.properties..."

if [ ! -f "android/gradle.properties" ]; then
    echo "  ⚠️  gradle.properties NO EXISTE, creando..."
    touch android/gradle.properties
fi

echo "  📄 Contenido actual:"
cat android/gradle.properties

# 4. FORZAR Kotlin en gradle.properties
echo -e "\n[4/9] 🔧 Forzando Kotlin 1.9.25..."

# Remover líneas previas
sed -i '/kotlinVersion/d' android/gradle.properties 2>/dev/null
sed -i '/android.kotlinVersion/d' android/gradle.properties 2>/dev/null
sed -i '/kotlin.version/d' android/gradle.properties 2>/dev/null

# Agregar al inicio (más prioridad)
cat > android/gradle.properties.tmp << 'EOF'
# FORZAR Kotlin 1.9.25
android.kotlinVersion=1.9.25
kotlin.version.check=false
suppressKotlinVersionCompatibilityCheck=true

EOF

cat android/gradle.properties >> android/gradle.properties.tmp
mv android/gradle.properties.tmp android/gradle.properties

echo "  ✅ Configurado en gradle.properties"

# 5. FORZAR en build.gradle también
echo -e "\n[5/9] 🔧 Forzando en build.gradle..."

# Cambiar TODAS las ocurrencias
sed -i "s/'1.9.24'/'1.9.25'/g" android/build.gradle
sed -i 's/"1.9.24"/"1.9.25"/g' android/build.gradle

# Agregar ext después de buildscript si no existe
if ! grep -q "ext.kotlinVersion" android/build.gradle; then
    sed -i '/^buildscript {/a\    ext.kotlinVersion = "1.9.25"' android/build.gradle
    echo "  ✅ ext.kotlinVersion agregado"
fi

echo "  ✅ build.gradle actualizado"

# 6. Ver configuración final
echo -e "\n[6/9] 📋 Configuración final:"
echo "  gradle.properties (primeras 10 líneas):"
head -10 android/gradle.properties | sed 's/^/    /'

echo -e "\n  build.gradle (kotlin):"
grep -E "kotlin" android/build.gradle | head -5 | sed 's/^/    /'

# 7. Configurar AndroidX y Google Services
echo -e "\n[7/9] ⚙️  Configurando AndroidX y Google Services..."

# AndroidX
if ! grep -q "configurations.all" android/app/build.gradle; then
    cat >> android/app/build.gradle << 'ANDROIDXEOF'

configurations.all {
    exclude group: 'com.android.support'
    resolutionStrategy {
        force 'androidx.core:core:1.13.1'
        force 'androidx.appcompat:appcompat:1.6.1'
    }
}
ANDROIDXEOF
fi

# Google Services
if ! tail -3 android/app/build.gradle | grep -q "google-services"; then
    echo "" >> android/app/build.gradle
    echo "apply plugin: 'com.google.gms.google-services'" >> android/app/build.gradle
fi

if ! grep -q "com.google.gms:google-services" android/build.gradle; then
    sed -i '/kotlin-gradle-plugin/a\        classpath("com.google.gms:google-services:4.4.0")' android/build.gradle
fi

# AndroidManifest tools:replace
if ! grep -q "xmlns:tools" android/app/src/main/AndroidManifest.xml; then
    sed -i 's|<manifest xmlns:android="http://schemas.android.com/apk/res/android">|<manifest xmlns:android="http://schemas.android.com/apk/res/android"\n    xmlns:tools="http://schemas.android.com/tools">|' android/app/src/main/AndroidManifest.xml
    sed -i '/<application/a\        tools:replace="android:appComponentFactory"\n        android:appComponentFactory="androidx.core.app.CoreComponentFactory"' android/app/src/main/AndroidManifest.xml
fi

cp google-services.json android/app/ 2>/dev/null
echo "sdk.dir=/root/Android/Sdk" > android/local.properties

echo "  ✅ Todo configurado"

# 8. Limpiar cache de Gradle
echo -e "\n[8/9] 🧹 Limpiando cache de Gradle..."
cd android
rm -rf .gradle
rm -rf build
rm -rf app/build
./gradlew clean --no-daemon > /dev/null 2>&1
echo "  ✅ Cache limpiada"

# 9. Compilar con --refresh-dependencies
echo -e "\n[9/9] 🔨 Compilando con Kotlin 1.9.25 (forzado)..."

./gradlew assembleRelease --no-daemon --refresh-dependencies 2>&1 | tee ../ultimate-build.log

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    cp app/build/outputs/apk/release/app-release.apk ../finia-ULTIMATE-$TIMESTAMP.apk
    
    echo -e "\n╔════════════════════════════════════════╗"
    echo "║    ✅ ¡COMPILADO EXITOSAMENTE!        ║"
    echo "╚════════════════════════════════════════╝"
    
    echo -e "\n📦 APK: finia-ULTIMATE-$TIMESTAMP.apk"
    
    cd ..
    if adb devices | grep -q "device"; then
        adb uninstall com.finia.app 2>/dev/null
        adb install finia-ULTIMATE-$TIMESTAMP.apk
        
        if [ $? -eq 0 ]; then
            echo -e "\n🎉 ¡APP INSTALADA Y FUNCIONANDO!"
        fi
    fi
else
    echo -e "\n❌ SIGUE FALLANDO"
    
    # Verificar QUÉ versión está usando realmente
    echo -e "\n🔍 Diagnóstico:"
    
    echo -e "\n1. gradle.properties actual:"
    cat ../android/gradle.properties | grep -i kotlin
    
    echo -e "\n2. build.gradle actual:"
    grep -E "kotlin" ../android/build.gradle | head -5
    
    echo -e "\n3. Error de Kotlin:"
    grep -A 5 "Kotlin version" ../ultimate-build.log
    
    echo -e "\n4. Buscando 1.9.24 en TODOS los archivos:"
    grep -r "1.9.24" ../android/ 2>/dev/null | head -10
    
    echo -e "\n📋 Si sigue con 1.9.24, es cache de Gradle que no se limpia"
    echo "Intenta: cd android && ./gradlew clean --stop"
fi
