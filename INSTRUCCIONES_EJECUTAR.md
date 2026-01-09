# Cómo Ejecutar el Script start.ps1

## Método 1: Desde PowerShell (Recomendado)

1. **Abre PowerShell** (no CMD, debe ser PowerShell)

2. **Navega a la carpeta del proyecto:**
   ```powershell
   cd C:\Users\jc723\OneDrive\Desktop\primer-logistica-automatizado
   ```

3. **Ejecuta el script:**
   ```powershell
   .\start.ps1
   ```

## Método 2: Si aparece error de "ejecución de scripts"

Si ves un error como:
```
.\start.ps1 no se puede cargar porque la ejecución de scripts está deshabilitada
```

**Solución rápida (para esta sesión):**
```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
.\start.ps1
```

**Solución permanente (requiere permisos de administrador):**
```powershell
# Ejecutar PowerShell como Administrador y luego:
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Método 3: Ejecutar directamente con PowerShell

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\start.ps1
```

## Método 4: Desde el Explorador de Archivos

1. Navega a la carpeta: `C:\Users\jc723\OneDrive\Desktop\primer-logistica-automatizado`
2. Haz clic derecho en `start.ps1`
3. Selecciona **"Ejecutar con PowerShell"**

## Alternativa: Ejecutar comandos manualmente

Si prefieres no usar el script, puedes ejecutar los comandos directamente:

```powershell
# 1. Levantar backend
docker-compose up -d

# 2. Ver logs
docker-compose logs -f
```

---

**Nota:** El script `start.ps1` solo levanta el backend. Después necesitas:
- Ejecutar `leads-service` localmente: `cd services\leads-service && npm run dev`
- Ejecutar frontend: `cd apps\web && npm run dev`
