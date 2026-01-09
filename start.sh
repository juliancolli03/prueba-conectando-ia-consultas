#!/bin/bash
# Script de inicio rápido para Linux/Mac

echo "🚀 Iniciando sistema de captura de leads..."
echo ""

# Verificar Docker
echo "1️⃣ Verificando Docker..."
if command -v docker &> /dev/null; then
    echo "   ✓ Docker está instalado"
else
    echo "   ✗ Docker no está instalado"
    exit 1
fi

# Verificar archivos .env
echo ""
echo "2️⃣ Verificando archivos .env..."
env_files=(
    "services/api-gateway/.env"
    "services/leads-service/.env"
    "services/notifications-service/.env"
)

for file in "${env_files[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✓ $file existe"
    else
        echo "   ✗ $file NO existe"
        echo "   Copiando desde .env.example..."
        cp "${file}.example" "$file" 2>/dev/null || true
    fi
done

# Levantar servicios con Docker
echo ""
echo "3️⃣ Levantando servicios backend con Docker..."
docker-compose up -d

if [ $? -eq 0 ]; then
    echo "   ✓ Servicios backend levantados"
    echo ""
    echo "   Servicios disponibles en:"
    echo "   - API Gateway: http://localhost:4000"
    echo "   - Leads Service: http://localhost:4001"
    echo "   - Notifications Service: http://localhost:4002"
else
    echo "   ✗ Error al levantar servicios Docker"
    echo "   Verifica los logs con: docker-compose logs"
fi

echo ""
echo "4️⃣ Próximos pasos:"
echo "   Para instalar y ejecutar el frontend, abre otra terminal y ejecuta:"
echo "   cd apps/web"
echo "   npm install"
echo "   npm run dev"
echo ""
echo "   Luego accede a: http://localhost:5173"
echo ""
echo "📋 Para ver logs: docker-compose logs -f"
echo "🛑 Para detener: docker-compose down"
