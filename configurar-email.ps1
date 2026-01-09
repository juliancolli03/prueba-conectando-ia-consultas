# Script para configurar email SMTP
Write-Host "📧 Configuración de Email para Notificaciones" -ForegroundColor Cyan
Write-Host ""

$adminEmail = Read-Host "Ingresa tu email donde recibirás las notificaciones"
$smtpProvider = Read-Host "¿Qué proveedor usas? (gmail/outlook/otro)"

$smtpHost = ""
$smtpPort = 587
$fromEmail = ""

if ($smtpProvider -eq "gmail") {
    $smtpHost = "smtp.gmail.com"
    $smtpPort = 587
    $fromEmail = Read-Host "Email de Gmail que enviará (puede ser el mismo: $adminEmail)"
    Write-Host ""
    Write-Host "⚠️  IMPORTANTE para Gmail:" -ForegroundColor Yellow
    Write-Host "1. Ve a: https://myaccount.google.com/apppasswords" -ForegroundColor White
    Write-Host "2. Genera una 'Contraseña de aplicación' para 'Correo'" -ForegroundColor White
    Write-Host "3. Usa esa contraseña (NO tu contraseña normal de Gmail)" -ForegroundColor White
    Write-Host ""
} elseif ($smtpProvider -eq "outlook") {
    $smtpHost = "smtp-mail.outlook.com"
    $smtpPort = 587
    $fromEmail = Read-Host "Email de Outlook que enviará (puede ser el mismo: $adminEmail)"
} else {
    $smtpHost = Read-Host "Ingresa el servidor SMTP (ej: smtp.tu-proveedor.com)"
    $smtpPort = Read-Host "Puerto SMTP (generalmente 587 o 465)"
    $fromEmail = Read-Host "Email que enviará las notificaciones"
}

$smtpUser = Read-Host "Usuario SMTP (generalmente tu email: $fromEmail)"
$smtpPass = Read-Host "Contraseña SMTP (o contraseña de aplicación para Gmail)" -AsSecureString
$smtpPassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($smtpPass))

$smtpSecure = Read-Host "¿Usar conexión segura (TLS)? (s/n)"
if ($smtpSecure -eq "s" -or $smtpSecure -eq "S") {
    $smtpSecureValue = "true"
} else {
    $smtpSecureValue = "false"
}

# Actualizar archivo .env
$envPath = "services\notifications-service\.env"
$envContent = @"
PORT=4002
NODE_ENV=development

# SMTP Configuration
SMTP_HOST=$smtpHost
SMTP_PORT=$smtpPort
SMTP_USER=$smtpUser
SMTP_PASS=$smtpPassPlain
SMTP_SECURE=$smtpSecureValue
FROM_EMAIL=$fromEmail
ADMIN_EMAIL=$adminEmail

# Seguridad
INTERNAL_TOKEN=
"@

Set-Content -Path $envPath -Value $envContent -Encoding UTF8

Write-Host ""
Write-Host "✅ Configuración guardada en $envPath" -ForegroundColor Green
Write-Host ""
Write-Host "Para aplicar los cambios:" -ForegroundColor Yellow
Write-Host "1. Reinicia el notifications-service:" -ForegroundColor White
Write-Host "   docker-compose restart notifications-service" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. O si está corriendo localmente, reinicia el proceso" -ForegroundColor White
Write-Host ""
Write-Host "📧 Las notificaciones se enviarán a: $adminEmail" -ForegroundColor Green
