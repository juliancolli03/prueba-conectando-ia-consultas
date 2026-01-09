# 📊 Configurar Google Sheets - Pasos desde tu Proyecto Actual

**Proyecto:** My Project 61744 (ID: `utopian-honor-483801-q1`)

## ⚡ Pasos Rápidos

### 1. Habilitar Google Sheets API

Desde donde estás ahora:

1. En el menú lateral izquierdo, busca **"APIs & Services"** → Click en **"Library"**
2. En el buscador (arriba), escribe: **"Google Sheets API"**
3. Click en **"Google Sheets API"**
4. Click en el botón azul **"ENABLE"** (Habilitar)
5. Espera unos segundos hasta que diga "API enabled"

### 2. Crear Service Account

1. En el menú lateral, ve a **"APIs & Services"** → **"Credentials"**
2. Arriba, haz click en el botón azul **"+ CREATE CREDENTIALS"**
3. Selecciona **"Service account"**
4. Completa:
   - **Service account name**: `sheets-service`
   - **Service account ID**: Se genera solo (déjalo como está)
   - Click **"CREATE AND CONTINUE"**
5. En "Grant this service account access to project":
   - **SKIP** este paso (click en **"CONTINUE"** o **"DONE"**)
6. Click **"DONE"**

### 3. Descargar Clave JSON

1. Después de crear el Service Account, regresarás a la página de **"Credentials"**
2. Verás una sección llamada **"Service accounts"** con una tabla
3. En esa tabla, verás una columna **"Email"** con algo como: `sheets-service@utopian-honor-483801-q1.iam.gserviceaccount.com`
4. **Haz click directamente en ese EMAIL** (es un link)
5. Te llevará a la página de detalles del Service Account
6. En la parte superior, verás varias pestañas: **"Details"**, **"Permissions"**, **"KEYS"**
7. Haz click en la pestaña **"KEYS"**
8. Click en el botón **"ADD KEY"** → **"Create new key"**
9. Selecciona **"JSON"**
10. Click **"CREATE"**
11. **Se descarga automáticamente** un archivo JSON a tu carpeta de descargas

### 4. Guardar el Archivo

El archivo descargado tendrá un nombre como: `utopian-honor-483801-q1-xxxxx-xxxxx.json`

**Opción A: Manual**
1. Ve a tu carpeta Downloads
2. Renómbralo a: `service-account.json`
3. Muévelo a: `C:\Users\jc723\OneDrive\Desktop\primer-logistica-automatizado\services\notifications-service\credentials\service-account.json`

**Opción B: PowerShell**
```powershell
# Desde la raíz del proyecto
Move-Item -Path "$env:USERPROFILE\Downloads\utopian-honor-483801-q1-*.json" -Destination "services\notifications-service\credentials\service-account.json" -Force
```

### 5. Obtener Email del Service Account

1. Abre el archivo `service-account.json` que acabas de mover
2. Busca el campo: `"client_email"`
3. Copia ese email (será algo como: `sheets-service@utopian-honor-483801-q1.iam.gserviceaccount.com`)

### 6. Compartir Google Sheet

1. Abre tu Google Sheet: https://docs.google.com/spreadsheets/d/1JikD0WKSTexwofRdtBgjaxPXlqExTPzz-JhBeZeBNVs/edit
2. Click en **"Compartir"** (botón azul arriba a la derecha)
3. Pega el email del Service Account (el que copiaste en paso 5)
4. Permiso: **"Editor"**
5. **IMPORTANTE:** Desmarca **"Notificar a las personas"**
6. Click **"Compartir"**

### 7. Configurar .env

Edita `services/notifications-service/.env` y agrega al final:

```env
# Google Sheets Configuration
GOOGLE_SHEETS_ID=1JikD0WKSTexwofRdtBgjaxPXlqExTPzz-JhBeZeBNVs
GOOGLE_SERVICE_ACCOUNT_PATH=credentials/service-account.json
```

### 8. Reiniciar Servicio

```powershell
docker-compose build notifications-service
docker-compose restart notifications-service
```

### 9. Verificar

```powershell
docker-compose logs notifications-service | Select-String -Pattern "Sheets"
```

Deberías ver: `Google Sheets service initialized successfully`

---

## ✅ Listo!

Ahora cada lead se guardará automáticamente en la hoja correspondiente según su categoría.
