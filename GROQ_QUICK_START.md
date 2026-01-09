# 🚀 Inicio Rápido con Groq (IA Gratuita)

## ⚡ Configuración en 3 pasos

### 1️⃣ Obtener API Key de Groq

1. Ve a: **https://console.groq.com**
2. Crea una cuenta (gratis, sin tarjeta)
3. Ve a **"API Keys"** → **"Create API Key"**
4. Copia la key (empieza con `gsk_...`)

### 2️⃣ Agregar al .env

Abre `services/api-gateway/.env` y agrega:

```env
GROQ_API_KEY=gsk_tu-key-aqui
```

### 3️⃣ Reiniciar

```powershell
docker-compose restart api-gateway
```

## ✅ ¡Listo!

Ahora el sistema usará **Groq** (gratis) para clasificar mensajes.

## 🧪 Probar

1. Abre: http://localhost:5173
2. Envía un mensaje de prueba
3. Verifica los logs:

```powershell
docker-compose logs api-gateway --tail 20
```

Deberías ver: `✅ Groq request successful`

---

**Más detalles en:** `CONFIGURAR_GROQ.md`
