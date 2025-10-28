#!/bin/bash
# Build script - Concatena todos los módulos en un solo archivo

echo "Building Crown HS Schedule Calendar..."

# Crear directorio build si no existe
mkdir -p build

# Concatenar todos los archivos en orden
cat > build/app-bundle.js << 'EOF'
/**
 * Crown HS Schedule Calendar - Complete Bundle
 * Auto-generated from modular source files
 */

const { useState, useEffect, useMemo, useRef } = React;

EOF

# Agregar archivos en orden de dependencias
echo "// ========== CONFIG ==========" >> build/app-bundle.js
cat js/config/areaConfig.js >> build/app-bundle.js
echo "" >> build/app-bundle.js

echo "// ========== UTILITIES ==========" >> build/app-bundle.js
cat js/utils/dateUtils.js >> build/app-bundle.js
echo "" >> build/app-bundle.js
cat js/utils/excelUtils.js >> build/app-bundle.js
echo "" >> build/app-bundle.js
cat js/utils/duplicateDetection.js >> build/app-bundle.js
echo "" >> build/app-bundle.js
cat js/utils/comparisonUtils.js >> build/app-bundle.js
echo "" >> build/app-bundle.js
cat js/utils/localStorage.js >> build/app-bundle.js
echo "" >> build/app-bundle.js

echo "// ========== COMPONENTS ==========" >> build/app-bundle.js
cat js/components/Toast.js >> build/app-bundle.js
echo "" >> build/app-bundle.js
cat js/components/DeleteConfirmModal.js >> build/app-bundle.js
echo "" >> build/app-bundle.js
cat js/components/RenameUpdateModal.js >> build/app-bundle.js
echo "" >> build/app-bundle.js
cat js/components/SettingsModal.js >> build/app-bundle.js
echo "" >> build/app-bundle.js
cat js/components/EditActivityModal.js >> build/app-bundle.js
echo "" >> build/app-bundle.js
cat js/components/ManualEntryModal.js >> build/app-bundle.js
echo "" >> build/app-bundle.js
cat js/components/DuplicateDetectionModal.js >> build/app-bundle.js
echo "" >> build/app-bundle.js
cat js/components/BulkContractorModal.js >> build/app-bundle.js
echo "" >> build/app-bundle.js
cat js/components/ExportOptionsModal.js >> build/app-bundle.js
echo "" >> build/app-bundle.js
cat js/components/ComparisonModal.js >> build/app-bundle.js
echo "" >> build/app-bundle.js
cat js/components/ConfigureCodesModal.js >> build/app-bundle.js
echo "" >> build/app-bundle.js
cat js/components/ImportWizard.js >> build/app-bundle.js
echo "" >> build/app-bundle.js
cat js/components/MarkerLegend.js >> build/app-bundle.js
echo "" >> build/app-bundle.js
cat js/components/SaveFilterLayoutModal.js >> build/app-bundle.js
echo "" >> build/app-bundle.js

echo "// ========== MAIN APP ==========" >> build/app-bundle.js
cat js/app.js >> build/app-bundle.js
echo "" >> build/app-bundle.js

# Limpiar exports e imports del bundle
sed -i '' '/^export /d' build/app-bundle.js
sed -i '' '/^import /d' build/app-bundle.js
sed -i '' 's/^export function /function /g' build/app-bundle.js
sed -i '' 's/^export const /const /g' build/app-bundle.js

# Eliminar TODAS las declaraciones de React hooks (incluyendo combinaciones parciales)
sed -i '' '/^const { .*useState.* } = React;$/d' build/app-bundle.js
sed -i '' '/^const { .*useEffect.* } = React;$/d' build/app-bundle.js
sed -i '' '/^const { .*useMemo.* } = React;$/d' build/app-bundle.js
sed -i '' '/^const { .*useRef.* } = React;$/d' build/app-bundle.js

# Re-agregar la declaración única al inicio del bundle (después del comentario)
sed -i '' '5i\
const { useState, useEffect, useMemo, useRef } = React;\
' build/app-bundle.js

echo "✅ Build complete: build/app-bundle.js"
echo "📊 File size: $(wc -c < build/app-bundle.js | tr -d ' ') bytes"
echo "📝 Lines: $(wc -l < build/app-bundle.js | tr -d ' ')"
