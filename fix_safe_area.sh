#!/bin/bash

echo "🔧 Ajustando SafeAreaView en todas las pantallas..."

FILES=(
  "app/(tabs)/home.tsx"
  "app/(tabs)/transactions.tsx"
  "app/(tabs)/add.tsx"
  "app/(tabs)/ai-assistant.tsx"
  "app/(tabs)/profile.tsx"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    # Buscar si tiene edges={['top']}
    if grep -q "edges={\['top'\]}" "$file"; then
      echo "✅ $file - Ya tiene edges top"
    elif grep -q "edges={\['top', 'bottom'\]}" "$file"; then
      echo "✅ $file - Tiene edges top y bottom (cambiar a solo top)"
    else
      echo "⚠️ $file - Revisar SafeAreaView"
    fi
  fi
done

echo ""
echo "✅ Verificación completa"
