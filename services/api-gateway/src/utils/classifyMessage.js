// Clasificación automática de mensajes usando IA
// Soporta: Groq (gratuito) y OpenAI (fallback)
// No requiere hardcode de palabras clave, usa IA para entender el contexto
import axios from 'axios';

/**
 * Clasifica un mensaje usando IA (Groq por defecto, OpenAI como fallback)
 * @param {string} message - El mensaje a clasificar
 * @returns {Promise<{category: string, categoryTag: string|null}>} - Objeto con categoría y tag sugerido
 */
export const classifyMessageWithAI = async (message) => {
  if (!message || message.trim().length === 0) {
    return { category: 'consulta', categoryTag: null };
  }

  // Priorizar Groq (gratuito), luego OpenAI como fallback
  const groqApiKey = process.env.GROQ_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  // Intentar primero con Groq si está configurado
  if (groqApiKey) {
    try {
      return await classifyWithGroq(message, groqApiKey);
    } catch (error) {
      console.warn('Groq failed, trying OpenAI as fallback:', error.message);
      // Fallback a OpenAI si Groq falla y está configurado
      if (openaiApiKey) {
        try {
          return await classifyWithOpenAI(message, openaiApiKey);
        } catch (openaiError) {
          console.error('Both Groq and OpenAI failed:', openaiError.message);
          throw openaiError;
        }
      }
      throw error;
    }
  }

  // Si no hay Groq, usar OpenAI si está configurado
  if (openaiApiKey) {
    return await classifyWithOpenAI(message, openaiApiKey);
  }

  // Si no hay ninguna API key configurada
  console.warn('No AI provider configured (GROQ_API_KEY or OPENAI_API_KEY), defaulting to "consulta"');
  return { category: 'consulta', categoryTag: null };
};

/**
 * Clasifica usando Groq (gratuito, compatible con OpenAI)
 */
const classifyWithGroq = async (message, apiKey) => {
  const makeRequestWithRetry = async (requestData, maxRetries = 3, initialDelay = 2000) => {
    let lastError;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`Groq request attempt ${attempt + 1}/${maxRetries}`);
        const response = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          requestData,
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 15000
          }
        );
        console.log('✅ Groq request successful');
        return response;
      } catch (error) {
        lastError = error;
        if (error.response?.status === 429 && attempt < maxRetries - 1) {
          const delay = initialDelay * Math.pow(2, attempt);
          console.warn(`⚠️ Groq rate limit, waiting ${delay}ms before retry`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        if (attempt === maxRetries - 1) {
          console.error(`❌ All ${maxRetries} Groq attempts failed`);
          throw lastError;
        }
      }
    }
    throw lastError;
  };

  try {
    // Primera llamada: clasificar en las 4 categorías principales
    const response = await makeRequestWithRetry({
      model: 'llama-3.3-70b-versatile', // Modelo gratuito de Groq
      messages: [
        {
          role: 'system',
          content: `Eres un clasificador experto de mensajes de contacto en español. Analiza el contexto y sentimiento del mensaje y clasifícalo en UNA de estas 4 categorías:

- "reclamo": Mensajes que expresan insatisfacción, quejas, problemas, enojo, frustración, productos defectuosos, servicios malos, pedidos que no llegaron, errores, demandas de reembolso, reclamos de cualquier tipo

- "cotizacion": Mensajes que piden precio, presupuesto, cotización, costos, cuánto cuesta, tarifas, presupuesto para X cantidad, querer saber el precio de algo

- "consulta": Preguntas generales, información sobre servicios, dudas, solicitudes de información, preguntas sobre disponibilidad, horarios, etc.

- "otros": Cualquier otra cosa que no encaje en las anteriores: envío de CVs, solicitudes de trabajo, preguntas sobre ubicaciones/sucursales, propuestas comerciales, colaboraciones, etc.

IMPORTANTE: Si el mensaje expresa enojo, insatisfacción, problemas o quejas → "reclamo"
Si pregunta por precio, costos o presupuesto → "cotizacion"
Si es algo muy específico como CV, trabajo, ubicación, etc. → "otros"
Si es pregunta general o información → "consulta"

Responde SOLO con una palabra (sin comillas, sin puntos, sin espacios): consulta, reclamo, cotizacion u otros`
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 10,
      temperature: 0.3
    });

    const classification = response.data.choices[0]?.message?.content?.toLowerCase().trim();
    console.log('Raw Groq response:', classification);
    
    // Validar que la respuesta sea una de las categorías válidas
    const validCategories = ['consulta', 'reclamo', 'cotizacion', 'otros'];
    if (!validCategories.includes(classification)) {
      console.warn(`Invalid classification received: "${classification}", defaulting to "consulta"`);
      return { category: 'consulta', categoryTag: null };
    }

    // Si es "otros", hacer segunda llamada para obtener un tag específico
    if (classification === 'otros') {
      try {
        const tagResponse = await makeRequestWithRetry({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `Analiza el mensaje y sugiere una palabra clave/tag específico que lo identifique. 

Ejemplos:
- Si habla de enviar CV, trabajo, empleo, postularse → "rrhh"
- Si pregunta por ubicación, dirección, sucursal, dónde están → "ubicacion"
- Si habla de colaboración, alianzas, partnerships → "colaboracion"
- Si habla de prensa, medios, entrevistas → "prensa"
- Si habla de proveedores, ser proveedor → "proveedor"
- Si habla de franquicias → "franquicia"

Responde SOLO con una palabra clave en minúsculas y sin espacios (ejemplo: rrhh, ubicacion, colaboracion, prensa, proveedor, franquicia). Si no está claro, usa "general" como tag.`
            },
            {
              role: 'user',
              content: message
            }
          ],
          max_tokens: 10,
          temperature: 0.3
        });

        const suggestedTag = tagResponse.data.choices[0]?.message?.content?.toLowerCase().trim();
        const cleanTag = suggestedTag?.replace(/["'.]/g, '').replace(/\s+/g, '').substring(0, 20) || 'general';
        console.log('Tag suggested by Groq:', cleanTag);
        
        return { category: 'otros', categoryTag: cleanTag };
      } catch (tagError) {
        console.warn('Error getting tag for "otros" category:', tagError.message);
        return { category: 'otros', categoryTag: 'general' };
      }
    }
    
    console.log('Classification successful (Groq):', classification);
    return { category: classification, categoryTag: null };
  } catch (error) {
    if (error.response) {
      console.error('Groq API error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    } else {
      console.error('Error classifying message with Groq:', error.message);
    }
    throw error;
  }
};

/**
 * Clasifica usando OpenAI (fallback)
 */
const classifyWithOpenAI = async (message, apiKey) => {
  const makeRequestWithRetry = async (requestData, maxRetries = 5, initialDelay = 5000) => {
    let lastError;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`OpenAI request attempt ${attempt + 1}/${maxRetries}`);
        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          requestData,
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 20000
          }
        );
        console.log('✅ OpenAI request successful');
        return response;
      } catch (error) {
        lastError = error;
        if (error.response?.status === 429) {
          const errorData = error.response?.data?.error;
          if (errorData?.code === 'insufficient_quota') {
            console.error('❌ OpenAI quota exhausted. Cannot retry.');
            throw error;
          }
          if (attempt < maxRetries - 1) {
            const delay = initialDelay * Math.pow(2, attempt);
            console.warn(`⚠️ OpenAI rate limit, waiting ${delay}ms before retry`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        if (attempt === maxRetries - 1) {
          console.error(`❌ All ${maxRetries} OpenAI attempts failed`);
          throw lastError;
        }
      }
    }
    throw lastError;
  };

  try {
    const response = await makeRequestWithRetry({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Eres un clasificador experto de mensajes de contacto en español. Analiza el contexto y sentimiento del mensaje y clasifícalo en UNA de estas 4 categorías:

- "reclamo": Mensajes que expresan insatisfacción, quejas, problemas, enojo, frustración, productos defectuosos, servicios malos, pedidos que no llegaron, errores, demandas de reembolso, reclamos de cualquier tipo

- "cotizacion": Mensajes que piden precio, presupuesto, cotización, costos, cuánto cuesta, tarifas, presupuesto para X cantidad, querer saber el precio de algo

- "consulta": Preguntas generales, información sobre servicios, dudas, solicitudes de información, preguntas sobre disponibilidad, horarios, etc.

- "otros": Cualquier otra cosa que no encaje en las anteriores: envío de CVs, solicitudes de trabajo, preguntas sobre ubicaciones/sucursales, propuestas comerciales, colaboraciones, etc.

IMPORTANTE: Si el mensaje expresa enojo, insatisfacción, problemas o quejas → "reclamo"
Si pregunta por precio, costos o presupuesto → "cotizacion"
Si es algo muy específico como CV, trabajo, ubicación, etc. → "otros"
Si es pregunta general o información → "consulta"

Responde SOLO con una palabra (sin comillas, sin puntos, sin espacios): consulta, reclamo, cotizacion u otros`
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 10,
      temperature: 0.3
    });

    const classification = response.data.choices[0]?.message?.content?.toLowerCase().trim();
    console.log('Raw OpenAI response:', classification);
    
    const validCategories = ['consulta', 'reclamo', 'cotizacion', 'otros'];
    if (!validCategories.includes(classification)) {
      console.warn(`Invalid classification received: "${classification}", defaulting to "consulta"`);
      return { category: 'consulta', categoryTag: null };
    }

    if (classification === 'otros') {
      try {
        const tagResponse = await makeRequestWithRetry({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `Analiza el mensaje y sugiere una palabra clave/tag específico que lo identifique. 

Ejemplos:
- Si habla de enviar CV, trabajo, empleo, postularse → "rrhh"
- Si pregunta por ubicación, dirección, sucursal, dónde están → "ubicacion"
- Si habla de colaboración, alianzas, partnerships → "colaboracion"
- Si habla de prensa, medios, entrevistas → "prensa"
- Si habla de proveedores, ser proveedor → "proveedor"
- Si habla de franquicias → "franquicia"

Responde SOLO con una palabra clave en minúsculas y sin espacios (ejemplo: rrhh, ubicacion, colaboracion, prensa, proveedor, franquicia). Si no está claro, usa "general" como tag.`
            },
            {
              role: 'user',
              content: message
            }
          ],
          max_tokens: 10,
          temperature: 0.3
        });

        const suggestedTag = tagResponse.data.choices[0]?.message?.content?.toLowerCase().trim();
        const cleanTag = suggestedTag?.replace(/["'.]/g, '').replace(/\s+/g, '').substring(0, 20) || 'general';
        console.log('Tag suggested by OpenAI:', cleanTag);
        
        return { category: 'otros', categoryTag: cleanTag };
      } catch (tagError) {
        console.warn('Error getting tag for "otros" category:', tagError.message);
        return { category: 'otros', categoryTag: 'general' };
      }
    }
    
    console.log('Classification successful (OpenAI):', classification);
    return { category: classification, categoryTag: null };
  } catch (error) {
    if (error.response?.status === 429) {
      const errorData = error.response?.data?.error;
      if (errorData?.code === 'insufficient_quota') {
        console.error('❌ OpenAI API ERROR: INSUFFICIENT QUOTA');
        console.error('   Message:', errorData?.message);
      }
    } else if (error.response) {
      console.error('OpenAI API error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    } else {
      console.error('Error classifying message with OpenAI:', error.message);
    }
    throw error;
  }
};
