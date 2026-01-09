# Error 429 - Rate Limit de OpenAI

## ⏱️ ¿Cuándo se resuelve?

El error **429 (Too Many Requests)** de OpenAI generalmente se resuelve automáticamente después de:

- **1-2 minutos** para la mayoría de planes
- **Hasta 5 minutos** en algunos casos con planes gratuitos
- El tiempo exacto depende de tu plan de OpenAI

### ¿Por qué ocurre?

OpenAI limita el número de requests por minuto/hora según tu plan:
- **Plan gratuito/gratis**: ~3 requests por minuto (muy restrictivo)
- **Plan básico**: ~60 requests por minuto
- **Planes superiores**: Más requests permitidos

Durante las pruebas, se hicieron muchas solicitudes en poco tiempo, por eso se activó el límite.

## 🔍 Cómo verificar si ya pasó

Puedes verificar haciendo una prueba:

```powershell
# Espera 2-3 minutos y luego prueba
$test = @{name="Test Rate Limit";email="test@test.com";message="Hola, necesito información"} | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:4000/api/leads -Method Post -Body $test -ContentType "application/json"

# Luego revisa los logs
docker-compose logs api-gateway --tail 10 | Select-String -Pattern "429|classified"
```

Si **NO** aparece el error 429 y ves `"category"` en los logs, significa que ya pasó.

## ✅ El sistema funciona igual

**Importante**: El sistema NO se rompe con el 429. Cuando ocurre:
- ✅ El lead se guarda igual en MongoDB
- ✅ El email se envía correctamente
- ⚠️ Solo usa "consulta" como categoría por defecto (sin IA)
- ✅ No bloquea ni rompe nada

## 🚀 Cómo evitar el 429 en el futuro

1. **Espera entre pruebas**: 10-15 segundos entre cada request
2. **En producción**: El uso normal no debería alcanzar el límite
3. **Si necesitas más capacidad**: Considera upgradear tu plan de OpenAI

## 💡 Mejora Futura (Opcional)

Podríamos agregar retry automático con backoff exponencial, pero por ahora el sistema funciona bien:
- Maneja el error correctamente
- No rompe el flujo
- Usa valores por defecto seguros

---

**Resumen**: Espera 1-3 minutos y prueba de nuevo. El sistema seguirá funcionando aunque haya rate limit (solo usará categoría por defecto).
