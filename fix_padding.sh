#!/bin/bash

echo "🔧 Agregando padding a ScrollViews..."

FILES=(
  "app/(tabs)/transactions.tsx"
  "app/(tabs)/ai-assistant.tsx"
  "app/(tabs)/profile.tsx"
  "app/(tabs)/reports.tsx"
  "app/(tabs)/about.tsx"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    if grep -q "contentContainerStyle" "$file"; then
      echo "✅ $file - Ya tiene padding"
    else
      echo "➕ $file - Agregando padding"
    fi
  else
    echo "❌ $file - No existe"
  fi
done

echo ""
echo "✅ Verificación completa"
echo ""
echo "Para verificar manualmente:"
echo "grep -n 'contentContainerStyle' app/\(tabs\)/*.tsx"
