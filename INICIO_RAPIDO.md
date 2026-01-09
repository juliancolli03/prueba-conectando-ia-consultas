# 🚀 Inicio Rápido - Sistema de Captura de Leads

## ⚠️ IMPORTANTE: Antes de empezar

1. **Docker Desktop debe estar corriendo**
   - Busca "Docker Desktop" en el menú Inicio
   - Ábrelo y espera a que inicie completamente (icono en la bandeja del sistema)

## Paso 1: Levantar Backend con Docker

### Opción A: Comando Directo (Más Simple)

Abre PowerShell y ejecuta:

```powershell
cd C:\Users\jc723\OneDrive\Desktop\primer-logistica-automatizado
docker-compose up -d
```

### Opción B: Script (Si Docker está corriendo)

```powershell
cd C:\Users\jc723\OneDrive\Desktop\primer-logistica-automatizado
powershell.exe -ExecutionPolicy Bypass -File .\start.ps1
```

## Paso 2: Ejecutar Leads-Service Localmente

**En una NUEVA terminal de PowerShell:**

```powershell
cd C:\Users\jc723\OneDrive\Desktop\primer-logistica-automatizado\services\leads-service
npm install
npm run dev
```

Deja esta terminal abierta. El servicio correrá en el puerto **4001**.

## Paso 3: Ejecutar Frontend

**En otra NUEVA terminal de PowerShell:**

```powershell
cd C:\Users\jc723\OneDrive\Desktop\primer-logistica-automatizado\apps\web
npm install
npm run dev
```

El frontend estará disponible en: **http://localhost:5173**

## ✅ Verificar que todo funciona

1. **Backend Docker:**
   ```powershell
   docker-compose ps
   ```
   Debe mostrar `api-gateway` y `notifications-service` como "Up"

2. **Leads Service:**
   - Debe mostrar en la terminal: "Leads Service running on port 4001"

3. **Frontend:**
   - Debe mostrar en la terminal: "Local: http://localhost:5173"

4. **Probar:**
   - Abre http://localhost:5173 en tu navegador
   - Completa el formulario y envía un lead

## 📋 Comandos Útiles

### Ver logs de Docker
```powershell
docker-compose logs -f
```

### Ver logs de un servicio específico
```powershell
docker-compose logs api-gateway
docker-compose logs notifications-service
```

### Detener todo
```powershell
# Detener Docker
docker-compose down

# Detener leads-service: Ctrl+C en su terminal
# Detener frontend: Ctrl+C en su terminal
```

### Reiniciar servicios
```powershell
docker-compose restart
```

## 🔧 Troubleshooting

### Error: "Docker Desktop no está corriendo"
- Abre Docker Desktop
- Espera a que inicie completamente (icono en la bandeja)

### Error: "Puerto 4000/4001/4002 ya está en uso"
```powershell
# Ver qué está usando el puerto
netstat -ano | findstr :4000

# Detener el proceso o cambiar el puerto en docker-compose.yml
```

### Error: "MongoDB connection failed"
- Verifica que `services/leads-service/.env` tenga la URI correcta
- El leads-service debe correr LOCALMENTE, no en Docker

---

**Resumen: 3 terminales abiertas**
1. ✅ Backend Docker: `docker-compose up -d`
2. ✅ Leads Service: `cd services\leads-service && npm run dev`
3. ✅ Frontend: `cd apps\web && npm run dev`
