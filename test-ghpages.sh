#!/bin/bash
# Test script que simula GitHub Pages localmente

echo "🧪 Testing as GitHub Pages would serve..."
echo "📍 URL: http://localhost:8000"
echo ""
echo "⚠️  IMPORTANTE: Esto simula EXACTAMENTE cómo GitHub Pages sirve los archivos"
echo "    Si funciona aquí, funcionará en GitHub Pages"
echo ""
echo "🔄 Presiona Ctrl+C para detener el servidor"
echo ""

# Usar Python SimpleHTTPServer que sirve archivos igual que GitHub Pages
python3 -m http.server 8000
