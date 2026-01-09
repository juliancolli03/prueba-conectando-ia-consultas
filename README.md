# Clasificador de Leads - Envío de Mails y Guardado en Sheets

Sistema completo para clasificar leads automáticamente con IA, enviar notificaciones por email y guardar en Google Sheets organizados por categoría.

## ⚡ Resumen Rápido para Empezar

Si quieres probarlo rápido, estos son los pasos mínimos:

1. **Instalar Docker Desktop** y asegurarte de que esté corriendo
2. **Crear 3 archivos `.env`** (lee abajo los ejemplos)
3. **Ejecutar**: `docker-compose up -d`
4. **Abrir**: http://localhost:3000

> 💡 **Configuración mínima**: Puedes empezar con solo MongoDB configurado. El sistema funcionará parcialmente y podrás probar el frontend. Luego agrega email, IA y Google Sheets según necesites.

---

## 📋 Prerequisitos

Antes de empezar, necesitas tener instalado:

1. **Docker Desktop** (incluye Docker y Docker Compose)
   - Descarga: https://www.docker.com/products/docker-desktop/
   - Debe estar **corriendo** (verás el ícono en la barra de tareas)

2. **Cuentas y servicios gratuitos** (opcionales pero recomendados):
   - MongoDB Atlas (base de datos): https://www.mongodb.com/cloud/atlas
   - Groq (IA para clasificación - gratis): https://console.groq.com
   - Gmail (para emails SMTP)

## 🚀 Instalación desde Cero

### Paso 1: Descargar el Proyecto

```bash
git clone <url-del-repositorio>
cd clasificador-leads
```

### Paso 2: Crear Archivos de Configuración (.env)

Los archivos `.env` NO están incluidos por seguridad. Puedes usar los archivos `.env.example` como plantilla:

```bash
# Copiar plantillas (Windows PowerShell)
Copy-Item services\api-gateway\.env.example services\api-gateway\.env
Copy-Item services\leads-service\.env.example services\leads-service\.env
Copy-Item services\notifications-service\.env.example services\notifications-service\.env
```

Luego edita cada `.env` y completa los valores necesarios.

> 📝 **Checklist de configuración**:
> - ✅ **MongoDB**: Obligatorio (sin esto no se guardan los leads)
> - ⚠️ **Email SMTP**: Recomendado (sin esto no recibirás notificaciones)
> - ⚠️ **IA (Groq/OpenAI)**: Recomendado (sin esto los mensajes no se clasifican automáticamente)
> - 🔵 **Google Sheets**: Opcional (solo si quieres organizar en hojas automáticamente)

**Crear `services/leads-service/.env`:**
```env
PORT=4001
NODE_ENV=production
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/database?retryWrites=true&w=majority
INTERNAL_TOKEN=
```

**Crear `services/notifications-service/.env`:**
```env
PORT=4002
NODE_ENV=production

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-contraseña-de-aplicacion
SMTP_SECURE=false
FROM_EMAIL=tu-email@gmail.com
ADMIN_EMAIL=email-destino@gmail.com

# Google Sheets (Opcional)
GOOGLE_SHEETS_ID=
GOOGLE_SERVICE_ACCOUNT_PATH=credentials/service-account.json

INTERNAL_TOKEN=
```

**Crear `services/api-gateway/.env`:**
```env
PORT=4000
NODE_ENV=production
LEADS_SERVICE_URL=http://leads-service:4001
NOTIFICATIONS_SERVICE_URL=http://notifications-service:4002

# IA para Clasificación (Groq es gratuito, OpenAI es alternativo)
GROQ_API_KEY=gsk_tu-api-key-aqui
# OPENAI_API_KEY=sk_tu-api-key-aqui

WEBHOOK_TOKEN=
INTERNAL_TOKEN=
CORS_ORIGIN=http://localhost:3000
```

### Paso 3: Levantar Todo con Docker

**Asegúrate de que Docker Desktop esté corriendo**, luego ejecuta:

```bash
docker-compose up -d
```

Este comando:
1. Construye las imágenes de todos los servicios
2. Descarga dependencias necesarias
3. Levanta automáticamente:
   - ✅ **Backend completo** (api-gateway, leads-service, notifications-service)
   - ✅ **Frontend React** (servido en puerto 3000)

La primera vez puede tardar varios minutos (descarga de imágenes). Las siguientes veces será mucho más rápido.

### Paso 4: Verificar que Todo Funciona

Espera unos segundos y verifica que todos los contenedores estén corriendo:

```bash
docker-compose ps
```

Deberías ver 4 servicios con estado "Up":
- `api-gateway` (puerto 4000)
- `leads-service` (puerto 4001)
- `notifications-service` (puerto 4002)
- `web` (puerto 3000)

### Paso 5: Acceder a la Aplicación

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:4000
- **Health Checks**:
  - http://localhost:4000/health
  - http://localhost:4001/health
  - http://localhost:4002/health

## 📁 Estructura del Proyecto

```
.
├── services/
│   ├── api-gateway/          # API Gateway (puerto 4000)
│   ├── leads-service/        # Servicio de Leads + MongoDB (puerto 4001)
│   └── notifications-service/ # Servicio de Notificaciones + Email + Sheets (puerto 4002)
├── apps/
│   └── web/                  # Frontend React + Vite
└── docker-compose.yml        # Orquestación de todos los servicios
```

## 🎯 ¿Qué hace el sistema?

1. **Clasificador de Mensajes por IA**: Analiza automáticamente el mensaje y lo clasifica en:
   - `consulta` - Preguntas generales
   - `reclamo` - Quejas y problemas
   - `cotizacion` - Solicitudes de precio
   - `otros` - Otros (con tags específicos como rrhh, ubicacion, etc.)
2. **Envío Automático de Emails**: Notifica por correo electrónico cuando se recibe un lead, incluyendo la categoría clasificada
3. **Guardado en Google Sheets**: Organiza automáticamente los leads en hojas separadas según su categoría
4. **Almacenamiento en MongoDB**: Guarda todos los leads en base de datos (deduplicación por email)
5. **Captura desde Formulario Web**: Interfaz simple para que los usuarios envíen sus consultas

## ⚙️ Configuración Detallada de Servicios

> 💡 **Nota**: Puedes empezar con valores mínimos en los `.env` y el sistema funcionará parcialmente. A continuación, los detalles para configurar cada servicio completamente.

### MongoDB (Obligatorio para guardar leads)

**Opción 1: MongoDB Atlas (Recomendado - Gratis)**
1. Ve a: https://www.mongodb.com/cloud/atlas
2. Crea una cuenta gratuita
3. Crea un nuevo cluster (elige el plan FREE)
4. Crea un usuario de base de datos (Database Access)
5. Configura IP permitida: `0.0.0.0/0` (para permitir cualquier IP) o tu IP específica
6. Haz clic en "Connect" → "Connect your application"
7. Copia la URI de conexión (algo como: `mongodb+srv://usuario:password@cluster.mongodb.net/...`)
8. Pega esta URI en: `services/leads-service/.env` → `MONGODB_URI`

**Opción 2: MongoDB Local**
- Solo si tienes MongoDB instalado localmente
- URI: `mongodb://localhost:27017/nombre-db`

### Email (SMTP) - Obligatorio para notificaciones

**Configuración con Gmail (Gratis):**
1. Ve a: https://myaccount.google.com/apppasswords
2. Si no ves la opción, activa "Verificación en dos pasos" primero
3. Genera una **"Contraseña de aplicación"** para Correo
4. Copia esa contraseña (16 caracteres, sin espacios)
5. Usa esa contraseña en `SMTP_PASS` (NO tu contraseña normal de Gmail)

Configura en: `services/notifications-service/.env`:
- `SMTP_USER`: Tu email de Gmail
- `SMTP_PASS`: La contraseña de aplicación generada
- `ADMIN_EMAIL`: Email donde recibirás las notificaciones (puede ser el mismo)

### Clasificación por IA - Obligatorio para clasificar mensajes

**Groq (Recomendado - 100% Gratis):**
1. Ve a: https://console.groq.com
2. Crea una cuenta (gratis, sin tarjeta)
3. Inicia sesión y ve a "API Keys" en el menú
4. Haz clic en "Create API Key"
5. Copia la key (empieza con `gsk_...`)
6. Pega en: `services/api-gateway/.env` → `GROQ_API_KEY=gsk_tu-key-aqui`

**OpenAI (Alternativo - Requiere créditos):**
- Requiere créditos en tu cuenta de OpenAI
- Configura en: `services/api-gateway/.env` → `OPENAI_API_KEY=sk_tu-key-aqui`
- Nota: Si no tienes créditos, el sistema usará Groq automáticamente

### Google Sheets (Opcional - Para organizar leads automáticamente)

Si quieres que los leads se guarden automáticamente en Google Sheets organizados por categoría:

1. **Crear un Google Sheet**:
   - Ve a: https://sheets.google.com
   - Crea una nueva hoja de cálculo
   - Copia el ID de la URL (parte entre `/d/` y `/edit`)
   - Ejemplo: `https://docs.google.com/spreadsheets/d/ABC123XYZ/edit` → ID es `ABC123XYZ`

2. **Crear Service Account en Google Cloud**:
   - Ve a: https://console.cloud.google.com/
   - Crea un nuevo proyecto o selecciona uno existente
   - Ve a "APIs & Services" → "Library"
   - Busca "Google Sheets API" y haz clic en "ENABLE"
   - Ve a "APIs & Services" → "Credentials"
   - Click en "+ CREATE CREDENTIALS" → "Service account"
   - Nombre: `sheets-service` → "CREATE AND CONTINUE" → "DONE"
   - Haz clic en el email del Service Account creado
   - Pestaña "KEYS" → "ADD KEY" → "Create new key" → JSON → "CREATE"
   - Se descarga un archivo JSON

3. **Configurar el proyecto**:
   - Crea la carpeta: `services/notifications-service/credentials/`
   - Mueve el JSON descargado ahí y renómbralo a: `service-account.json`
   - Abre el JSON y copia el valor de `client_email`
   - Comparte tu Google Sheet con ese email (permiso "Editor")
   - Configura en `services/notifications-service/.env`:
     ```env
     GOOGLE_SHEETS_ID=ABC123XYZ
     GOOGLE_SERVICE_ACCOUNT_PATH=credentials/service-account.json
     ```

4. **Reiniciar el servicio**:
   ```bash
   docker-compose restart notifications-service
   ```

El sistema creará automáticamente 4 hojas: **Consulta**, **Reclamo**, **Cotización**, **Otros**

## 🐳 Comandos Docker Útiles

```bash
# Levantar todo (la primera vez construye las imágenes)
docker-compose up -d

# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f api-gateway
docker-compose logs -f web
docker-compose logs -f notifications-service

# Ver estado de todos los contenedores
docker-compose ps

# Detener todo
docker-compose down

# Detener y eliminar volúmenes (cuidado: borra datos)
docker-compose down -v

# Reconstruir imágenes desde cero (útil si cambias código)
docker-compose build --no-cache
docker-compose up -d

# Reiniciar un servicio específico (útil después de cambiar .env)
docker-compose restart api-gateway
docker-compose restart notifications-service
```

## 🔌 Endpoints

### API Gateway (http://localhost:4000)

- `GET /health` - Health check
- `POST /api/leads` - Crear/actualizar lead
  ```json
  {
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "phone": "+5491112345678",
    "message": "Necesito un presupuesto para enviar 100 paquetes"
  }
  ```
- `POST /webhooks/n8n/lead` - Webhook para n8n (mismo body)

### Frontend (http://localhost:3000)

- Formulario completo de captura de leads
- Clasificación automática por IA (transparente para el usuario)

## 🧪 Probar el Sistema

### Probar el Frontend

1. Abre en tu navegador: **http://localhost:3000**
2. Completa el formulario con datos de prueba
3. Haz clic en "Enviar"

### Verificar que Funciona

Después de enviar un lead, verifica:

1. **En la consola del navegador** (F12): Deberías ver "Lead enviado correctamente"
2. **En el email**: Recibirás un email con el lead clasificado
3. **En MongoDB**: El lead estará guardado en tu base de datos
4. **En Google Sheets** (si configuraste): Aparecerá en la hoja correspondiente

### Ejemplos de Mensajes para Probar Clasificación

Prueba diferentes tipos de mensajes para ver cómo los clasifica la IA:

- **Cotización**: "Necesito un presupuesto urgente para enviar 100 paquetes"
- **Reclamo**: "Mi pedido llegó roto, estoy muy enojado y quiero un reembolso"
- **Consulta**: "Quisiera más información sobre sus servicios"
- **Otros/RRHH**: "Quiero enviar mi CV para trabajar en la empresa"
- **Otros/Ubicación**: "¿Dónde están ubicadas sus oficinas?"

### Ver Logs en Tiempo Real

Si quieres ver qué está pasando detrás de escena:

```bash
# Ver todos los logs
docker-compose logs -f

# Ver solo clasificación de IA
docker-compose logs -f api-gateway | grep -i "classif"
```

## 📝 Notas Técnicas

- **Deduplicación**: Los leads se deduplican por email (case-insensitive)
- **Best-effort**: Si falla el email o Sheets, el lead se guarda igual
- **Clasificación IA**: Siempre intenta clasificar, usa fallback seguro si falla
- **Rate Limiting**: El gateway tiene rate limiting configurado
- **CORS**: Configurado para permitir el frontend

## 🐛 Solución de Problemas

### Los contenedores no inician

```bash
# Ver qué está fallando
docker-compose logs

# Verificar que Docker Desktop esté corriendo
docker ps
```

### Error de conexión a MongoDB

- Verifica que la URI en `services/leads-service/.env` sea correcta
- En MongoDB Atlas, asegúrate de permitir tu IP en "Network Access"
- Si usas MongoDB local, verifica que esté corriendo

### No llegan los emails

- Verifica las credenciales SMTP en `services/notifications-service/.env`
- Usa una "Contraseña de aplicación" de Gmail, NO tu contraseña normal
- Revisa los logs: `docker-compose logs notifications-service`

### La IA no clasifica

- Verifica que `GROQ_API_KEY` o `OPENAI_API_KEY` esté configurado
- Revisa los logs: `docker-compose logs api-gateway | grep -i "classif"`
- Si usas OpenAI, verifica que tengas créditos disponibles

### Google Sheets no funciona

- Verifica que el archivo `service-account.json` esté en `services/notifications-service/credentials/`
- Verifica que compartiste el Sheet con el email del Service Account
- Revisa los logs: `docker-compose logs notifications-service | grep -i "sheet"`

## 🛠️ Desarrollo Local (Sin Docker - Opcional)

Si prefieres ejecutar sin Docker para desarrollo:

```bash
# Instalar dependencias en cada servicio
cd services/api-gateway && npm install
cd ../leads-service && npm install
cd ../notifications-service && npm install
cd ../../apps/web && npm install

# Ejecutar cada servicio en una terminal diferente
cd services/api-gateway && npm run dev      # Puerto 4000
cd services/leads-service && npm run dev    # Puerto 4001
cd services/notifications-service && npm run dev  # Puerto 4002
cd apps/web && npm run dev                  # Puerto 3000
```

> ⚠️ **Nota**: En desarrollo local, necesitas configurar `LEADS_SERVICE_URL` y `NOTIFICATIONS_SERVICE_URL` para que apunten a `localhost` en lugar de los nombres de los servicios de Docker.

## 📄 Licencia

MIT
