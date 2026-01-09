# 🔧 Solución: La Clasificación No Funciona

## Problemas Encontrados

1. **Timeout de OpenAI muy corto (5 segundos)**
   - ✅ **SOLUCIONADO**: Aumenté el timeout a 15 segundos

2. **La categoría no se guarda en MongoDB**
   - El leads-service corre **localmente** (fuera de Docker)
   - Necesita tener el código actualizado con el campo `category` y `categoryTag`

## ✅ Pasos para Solucionar

### 1. Reiniciar API Gateway (ya hecho)
```powershell
docker-compose restart api-gateway
```

### 2. Reiniciar Leads-Service Localmente

**Importante**: El `leads-service` corre localmente. Debes:

1. **Detener el servicio actual** (Ctrl+C en la terminal donde corre)

2. **Verificar que tenga el código actualizado**:
   ```powershell
   cd services\leads-service
   # Verificar que el archivo models/Lead.js tenga category y categoryTag
   ```

3. **Reiniciarlo**:
   ```powershell
   npm run dev
   ```

### 3. Verificar que Funciona

Haz una prueba enviando un lead:
```powershell
$test = @{name="Test Clasificación";email="test-clas@test.com";message="Quiero comprar el producto"} | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:4000/api/leads -Method Post -Body $test -ContentType "application/json"
```

Luego verifica los logs:
```powershell
# Ver logs del API Gateway
docker-compose logs api-gateway --tail 10

# Ver logs del leads-service (en su terminal local)
# Debe mostrar: "category":"cotizacion" o la categoría correspondiente
```

Y verifica en MongoDB:
```powershell
# El lead debe tener category y categoryTag guardados
```

### 4. Verificar el Email

El email ahora debe mostrar:
- **Asunto**: `[Cotización] Nuevo Lead: Test Clasificación` (o la categoría correspondiente)
- **Cuerpo**: Debe incluir el campo "Categoría: Cotización"

## 🐛 Si Aún No Funciona

1. **Verifica que el leads-service local tenga todos los archivos actualizados**
   - `models/Lead.js` debe tener `category` y `categoryTag`
   - `routes/leads.js` debe guardar y devolver estos campos

2. **Verifica los logs del API Gateway**:
   ```powershell
   docker-compose logs api-gateway --tail 20 | Select-String "category|classified|429|timeout"
   ```

3. **Verifica la respuesta del leads-service**:
   - Debe incluir `category` y `categoryTag` en la respuesta JSON

---

**Cambios aplicados:**
- ✅ Timeout de OpenAI: 5s → 15s
- ✅ Código del leads-service actualizado
- ⚠️ **Necesitas reiniciar el leads-service localmente**
