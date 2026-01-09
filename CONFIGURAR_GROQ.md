# 🤖 Configuración de Groq (API de IA Gratuita)

## ✅ ¿Qué es Groq?

**Groq** es una API de IA **100% GRATUITA** que ofrece:
- 🆓 **14,400 requests por día** (tier gratuito generoso)
- ⚡ **Muy rápida** (respuestas en milisegundos)
- 🎯 **Alta calidad** con modelos como Llama 3.3 70B
- 🔒 **Sin tarjeta de crédito** requerida para empezar
- ✅ **Compatible con OpenAI** (misma estructura de API)

## 🚀 Pasos para Configurar

### 1. Crear cuenta en Groq

1. Ve a: https://console.groq.com
2. Haz click en **"Sign Up"** (arriba a la derecha)
3. Crea una cuenta con tu email (o usa Google/GitHub)
4. **NO requiere tarjeta de crédito** para el tier gratuito

### 2. Obtener API Key

1. Una vez dentro del dashboard, haz click en **"API Keys"** (menú lateral)
2. Haz click en **"Create API Key"**
3. Dale un nombre (ej: "primer-logistica")
4. **Copia la API key** (empieza con `gsk_...`)

### 3. Configurar en el proyecto

Edita el archivo `services/api-gateway/.env` y agrega:

```env
GROQ_API_KEY=gsk_tu-api-key-aqui
```

**O ejecuta este comando en PowerShell:**

```powershell
# Lee el archivo .env actual
$envContent = Get-Content "services\api-gateway\.env" -Raw -ErrorAction SilentlyContinue

# Agrega o actualiza GROQ_API_KEY
if ($envContent -match "GROQ_API_KEY=") {
    $envContent = $envContent -replace "GROQ_API_KEY=.*", "GROQ_API_KEY=gsk_tu-api-key-aqui"
} else {
    $envContent += "`nGROQ_API_KEY=gsk_tu-api-key-aqui"
}

# Guarda el archivo
Set-Content "services\api-gateway\.env" -Value $envContent -Encoding UTF8
```

**Reemplaza `gsk_tu-api-key-aqui` con tu API key real de Groq.**

### 4. Reiniciar el Gateway

```powershell
docker-compose restart api-gateway
```

## ✅ ¡Listo!

El sistema ahora usará **Groq** para clasificar mensajes automáticamente.

## 🔄 Fallback Automático

El sistema tiene **fallback inteligente**:
1. **Primero intenta Groq** (gratuito)
2. **Si Groq falla**, intenta OpenAI (si está configurado)
3. **Si ambas fallan**, usa "consulta" por defecto

## 📊 Límites del Tier Gratuito

- ✅ **14,400 requests por día** (más que suficiente para uso normal)
- ✅ **6,000 tokens por minuto**
- ✅ Sin costo adicional
- ✅ Sin tarjeta de crédito requerida

## 🧪 Probar

Envía un mensaje desde el frontend:
- http://localhost:5173

Y verifica en los logs:
```powershell
docker-compose logs api-gateway --tail 20 | Select-String -Pattern "Groq|classification"
```

Deberías ver:
```
Groq request attempt 1/3
✅ Groq request successful
Raw Groq response: cotizacion
Classification successful (Groq): cotizacion
```

## 💡 Ventajas de Groq

- ✅ **100% Gratuito** para uso normal
- ✅ **Muy rápido** (respuestas casi instantáneas)
- ✅ **No requiere créditos** como OpenAI
- ✅ **Sin preocuparse por facturación**
- ✅ **Misma calidad** de clasificación

---

**¡Ya puedes probar el sistema con Groq completamente gratis!** 🎉
