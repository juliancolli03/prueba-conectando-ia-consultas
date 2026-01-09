# Nueva Categoría "Otros" con Tags Automáticos

## ✅ Implementación Completa

Se agregó la categoría **"otros"** con clasificación automática de tags específicos usando IA.

### 🎯 ¿Cómo funciona?

1. **Clasificación Principal**: La IA clasifica el mensaje en una de 4 categorías:
   - `consulta` - Preguntas generales
   - `reclamo` - Quejas y problemas  
   - `cotizacion` - Solicitudes de precio
   - `otros` - Todo lo demás (nuevo)

2. **Tag Automático para "otros"**: Cuando la categoría es "otros", la IA hace una segunda llamada para sugerir un tag específico:
   - Ejemplo: "Quiero enviar mi CV" → categoría: `otros`, tag: `rrhh`
   - Ejemplo: "¿Dónde están ubicados?" → categoría: `otros`, tag: `ubicacion`
   - Ejemplo: "Quiero ser proveedor" → categoría: `otros`, tag: `proveedor`

### 📝 Ejemplos de Tags

La IA puede sugerir tags como:
- `rrhh` - Para CVs, solicitudes de trabajo, postulaciones
- `ubicacion` - Para preguntas sobre dirección, sucursales
- `colaboracion` - Para alianzas, partnerships
- `prensa` - Para medios, entrevistas
- `proveedor` - Para solicitudes de ser proveedor
- `franquicia` - Para consultas sobre franquicias
- `general` - Si no está claro (tag por defecto)

### 🔧 Cambios Técnicos

1. **Modelo de Base de Datos** (`Lead.js`):
   - Agregado campo `categoryTag` (String, max 50 chars, nullable)
   - Actualizado enum de `category` para incluir `'otros'`
   - Agregados índices para búsquedas por tag

2. **Clasificación con IA** (`classifyMessage.js`):
   - Devuelve objeto `{category, categoryTag}` en lugar de solo string
   - Primera llamada: clasifica en 4 categorías
   - Segunda llamada (solo si es "otros"): genera tag específico

3. **API Gateway** (`leads.js`, `webhooks.js`):
   - Maneja `categoryTag` en la validación
   - Guarda el tag solo cuando categoría es "otros"
   - Logs incluyen `categoryTag` para debugging

4. **Leads Service** (`leads.js`):
   - Guarda y actualiza `categoryTag` en MongoDB
   - Valida que tag solo exista cuando categoría es "otros"

5. **Notifications Service** (`notify.js`):
   - Muestra el tag en el email cuando categoría es "otros"
   - Formato: `[Otros (rrhh)]` en el asunto
   - Tag también aparece en el cuerpo del email

### 📧 Ejemplo de Email

**Asunto**: `[Otros (rrhh)] Nuevo Lead: Juan Pérez`

**Cuerpo**:
```
Nuevo Lead Recibido

Categoría: Otros (rrhh)
Tag sugerido por IA: rrhh
Nombre: Juan Pérez
Email: juan@example.com
Mensaje: Hola, quiero enviar mi CV para trabajar en la empresa
```

### 🚀 Uso

No requiere cambios en el frontend. El sistema automáticamente:
1. Clasifica el mensaje
2. Si es "otros", genera un tag automático
3. Guarda ambos valores en la base de datos
4. Envía email con la información completa

### ⚠️ Nota sobre Rate Limits

Si ves errores 429 durante pruebas intensivas:
- Es normal, el sistema maneja el error correctamente
- Cuando hay rate limit, usa "consulta" por defecto (sin tag)
- En producción, el rate limit es suficiente para uso normal
- Espera 1-2 minutos entre pruebas intensivas

### 💡 Mejoras Futuras

Posibles mejoras:
- Caché de tags comunes para reducir llamadas a IA
- Lista configurable de tags permitidos
- Dashboard para ver estadísticas por tag

---

**Implementación completada y lista para usar** ✅
