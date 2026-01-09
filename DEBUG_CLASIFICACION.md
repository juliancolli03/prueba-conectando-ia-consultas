# 🔍 Debug: Problema de Clasificación

## Problemas Identificados

1. **Rate Limit 429 sigue activo** - OpenAI todavía está limitando requests
2. **Timeout del contenedor no actualizado** - El contenedor tenía timeout de 5s, lo aumenté a 15s
3. **Categoría no se pasa al notifications-service** - Agregué código para asegurar que la categoría se incluya

## ✅ Cambios Aplicados

1. **Aumentado timeout a 15 segundos** (reconstruido API Gateway)
2. **Agregado código para asegurar que la categoría se pase al notifications-service**
   - Ahora se incluye explícitamente `category` y `categoryTag` aunque el leads-service no los devuelva

## 🔧 Próximos Pasos para Verificar

1. **Espera 2-3 minutos** para que pase el rate limit de OpenAI

2. **Reinicia el leads-service localmente** (si está corriendo):
   ```powershell
   # Detener: Ctrl+C
   # Reiniciar:
   cd services\leads-service
   npm run dev
   ```

3. **Prueba de nuevo**:
   ```powershell
   $test = @{name="Test Final";email="test-final-clas@test.com";message="Hola, quiero comprar el producto"} | ConvertTo-Json
   Invoke-RestMethod -Uri http://localhost:4000/api/leads -Method Post -Body $test -ContentType "application/json"
   ```

4. **Revisa los logs**:
   ```powershell
   # Ver logs del API Gateway
   docker-compose logs api-gateway --tail 15 | Select-String "category|classified|Sending lead"
   ```

5. **Verifica el email**:
   - El asunto debe tener: `[Cotización] Nuevo Lead: ...`
   - El cuerpo debe mostrar: `Categoría: Cotización`

## 🐛 Si Sigue Sin Funcionar

1. **Verifica que el leads-service esté corriendo localmente**:
   ```powershell
   # Debe estar en http://localhost:4001
   Invoke-WebRequest -Uri http://localhost:4001/health
   ```

2. **Verifica logs del leads-service** (en su terminal):
   - Debe mostrar logs cuando se crea un lead
   - Debe incluir la categoría en los logs

3. **Verifica MongoDB directamente**:
   - El lead debe tener `category` guardado

---

**Resumen de cambios:**
- ✅ Timeout aumentado a 15s
- ✅ Código agregado para asegurar categoría en notifications
- ✅ API Gateway reconstruido y reiniciado
- ⚠️ **Espera 2-3 minutos para que pase el rate limit**
