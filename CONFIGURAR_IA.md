# Configuración de Clasificación Automática con IA

## ¿Qué hace el sistema ahora?

El sistema ahora clasifica **automáticamente** los mensajes usando **OpenAI (GPT)**:

1. **El usuario NO necesita seleccionar categoría** - El formulario ya no tiene el campo de categoría
2. **El sistema analiza el mensaje** usando IA de OpenAI
3. **Clasifica automáticamente** en una de estas 3 categorías:
   - **Consulta**: Preguntas, información, dudas generales
   - **Reclamo**: Quejas, problemas, insatisfacción
   - **Cotización**: Solicitudes de precio, presupuesto, costos
4. **Guarda la categoría detectada** en la base de datos
5. **Envía email** con la categoría clasificada automáticamente

## Pasos para Configurar

### 1. Obtener API Key de OpenAI

1. Ve a: https://platform.openai.com/api-keys
2. Inicia sesión (o crea una cuenta)
3. Click en "Create new secret key"
4. Copia la API key (empieza con `sk-...`)

**Nota**: OpenAI tiene un plan gratuito con $5 de crédito inicial para probar.

### 2. Configurar la API Key

Edita el archivo `services/api-gateway/.env` y agrega:

```env
OPENAI_API_KEY=sk-tu-api-key-aqui
```

O ejecuta este comando (reemplaza YOUR_API_KEY):

```powershell
$content = Get-Content "services\api-gateway\.env" -Raw
$content = $content -replace 'OPENAI_API_KEY=', 'OPENAI_API_KEY=sk-tu-api-key-aqui'
Set-Content "services\api-gateway\.env" -Value $content -Encoding UTF8
```

### 3. Reiniciar el Gateway

```powershell
docker-compose restart api-gateway
```

## Cómo Funciona

1. Usuario completa el formulario (sin categoría)
2. El sistema envía el mensaje a OpenAI GPT-3.5-turbo
3. GPT analiza el mensaje y devuelve: "consulta", "reclamo" o "cotizacion"
4. El sistema guarda el lead con la categoría detectada
5. El email se envía con la categoría automática en el asunto

## Ejemplos de Clasificación Automática

- **"¿Cuánto cuesta el servicio?"** → `cotizacion`
- **"Tengo un problema con mi pedido"** → `reclamo`
- **"Quisiera más información"** → `consulta`
- **"El producto llegó roto"** → `reclamo`
- **"Necesito un presupuesto"** → `cotizacion`

## Costos

- **GPT-3.5-turbo**: ~$0.0015 por 1000 tokens
- Cada clasificación usa ~50-100 tokens
- **Costo aproximado**: $0.0001 por mensaje clasificado
- Con $5 de crédito gratis: ~50,000 clasificaciones

## Sin API Key

Si no configuras la API key, el sistema funcionará pero:
- Todas las categorías serán `consulta` por defecto
- No habrá clasificación automática
- Los leads se guardarán igual, pero sin análisis

## Prueba

Una vez configurado, prueba enviando mensajes diferentes:

```powershell
# Prueba de cotización
$body = @{name="Test";email="test@test.com";message="¿Cuánto cuesta el servicio de logística?"} | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:4000/api/leads -Method Post -Body $body -ContentType "application/json"

# Prueba de reclamo
$body = @{name="Test";email="test2@test.com";message="El producto llegó en mal estado y estoy muy insatisfecho"} | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:4000/api/leads -Method Post -Body $body -ContentType "application/json"
```

Verifica en los logs que dice "Message classified by AI" con la categoría detectada.
