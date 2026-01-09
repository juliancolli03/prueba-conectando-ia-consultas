# ✅ Solución Final: Clasificación con OpenAI

## Cambios Aplicados

1. **Sistema de Retry con Backoff Exponencial**:
   - **5 intentos** en lugar de 3
   - **Delays más largos**: 5s, 10s, 20s, 40s, 80s
   - **Timeout aumentado a 20 segundos**

2. **Logging Mejorado**:
   - Muestra cada intento de request
   - Muestra cuando hay que esperar por rate limit
   - Muestra cuando el request es exitoso

## Cómo Funciona Ahora

Cuando hay un **429 (Rate Limit)**:
1. **Intento 1**: Falla con 429
2. **Espera 5 segundos**
3. **Intento 2**: Reintenta
4. Si falla, **espera 10 segundos**
5. **Intento 3**: Reintenta
6. Si falla, **espera 20 segundos**
7. Y así hasta 5 intentos totales

## Prueba Ahora

**Importante**: Espera **al menos 2-3 minutos** desde la última prueba para que el rate limit de OpenAI pase.

Luego prueba:

```powershell
# 1. COTIZACIÓN
$test1 = @{name="Test Cotización";email="test-cot@test.com";message="Necesito el precio para enviar 50 paquetes"} | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:4000/api/leads -Method Post -Body $test1 -ContentType "application/json"

# Espera 30 segundos

# 2. RECLAMO  
$test2 = @{name="Test Reclamo";email="test-reclamo@test.com";message="Estoy muy enojado, mi pedido llegó roto"} | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:4000/api/leads -Method Post -Body $test2 -ContentType "application/json"

# Espera 30 segundos

# 3. OTROS (RRHH)
$test3 = @{name="Test RRHH";email="test-rrhh@test.com";message="Quiero enviar mi CV para trabajar"} | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:4000/api/leads -Method Post -Body $test3 -ContentType "application/json"
```

## Verificar los Logs

```powershell
docker-compose logs api-gateway --tail 30 | Select-String "attempt|successful|429|category"
```

Deberías ver:
- `OpenAI request attempt 1/5`
- Si hay 429: `Rate limit 429, waiting 5000ms before retry`
- Si funciona: `✅ OpenAI request successful`
- `category: "cotizacion"` (o la categoría correcta)

## Si Aún No Funciona

1. **Espera más tiempo** (5-10 minutos) entre pruebas
2. **Verifica tu plan de OpenAI** - Planes gratuitos tienen límites muy restrictivos
3. **Revisa los logs completos**:
   ```powershell
   docker-compose logs api-gateway --tail 50
   ```

---

**El sistema ahora tiene retry automático con esperas largas para manejar el rate limit de OpenAI.**
