# Script de inicio rápido para Windows PowerShell
Write-Host "🚀 Iniciando sistema de captura de leads..." -ForegroundColor Cyan
Write-Host ""

# Verificar Docker
Write-Host "1️⃣ Verificando Docker..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    Write-Host "   ✓ Docker está instalado" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Docker no está instalado o no está corriendo" -ForegroundColor Red
    Write-Host "   Por favor instala Docker Desktop y vuelve a intentar" -ForegroundColor Red
    exit 1
}

# Verificar archivos .env
Write-Host ""
Write-Host "2️⃣ Verificando archivos .env..." -ForegroundColor Yellow
$envFiles = @(
    "services/api-gateway/.env",
    "services/leads-service/.env",
    "services/notifications-service/.env"
)

foreach ($file in $envFiles) {
    if (Test-Path $file) {
        Write-Host "   ✓ $file existe" -ForegroundColor Green
    } else {
        Write-Host "   ✗ $file NO existe" -ForegroundColor Red
        Write-Host "   Copiando desde .env.example..." -ForegroundColor Yellow
        Copy-Item "$file.example" $file -ErrorAction SilentlyContinue
    }
}

# Levantar servicios con Docker
Write-Host ""
Write-Host "3️⃣ Levantando servicios backend con Docker..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Servicios backend levantados" -ForegroundColor Green
    Write-Host ""
    Write-Host "   Servicios disponibles en:" -ForegroundColor Cyan
    Write-Host "   - API Gateway: http://localhost:4000" -ForegroundColor White
    Write-Host "   - Leads Service: http://localhost:4001" -ForegroundColor White
    Write-Host "   - Notifications Service: http://localhost:4002" -ForegroundColor White
} else {
    Write-Host "   ✗ Error al levantar servicios Docker" -ForegroundColor Red
    Write-Host "   Verifica los logs con: docker-compose logs" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "4️⃣ Próximos pasos:" -ForegroundColor Yellow
Write-Host "   Para instalar y ejecutar el frontend, abre otra terminal y ejecuta:" -ForegroundColor White
Write-Host "   cd apps/web" -ForegroundColor Cyan
Write-Host "   npm install" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Luego accede a: http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Para ver logs: docker-compose logs -f" -ForegroundColor Cyan
Write-Host "🛑 Para detener: docker-compose down" -ForegroundColor Cyan
