import { GoogleGenAI } from "@google/genai";
import { MatchAnalysis } from "../types";

const SYSTEM_INSTRUCTION = `
# ROLE
Eres un analista experto en apuestas deportivas de nivel profesional.

# CONTEXT
Tu tarea es:
1. Recibir múltiples URLs.
2. Usar Google Search para extraer y leer el contenido ACTUALIZADO de esas URLs.
3. Si se proporciona una transcripción de texto (YouTube), analizarla como fuente adicional.
4. Identificar partidos, deportes y fechas.
5. Generar análisis completos en formato JSON.

# PROCESSING RULES
1. Extrae información de las URLs proporcionadas usando la herramienta de búsqueda.
2. Si hay TRANSCRIPCIÓN provista, extráe las opiniones de los analistas de ahí y marca la fuente como "YOUTUBE".
3. Cita directamente a analistas y números específicos.
4. Indica fuente de cada dato.
5. Integra datos cuantitativos + opiniones cualitativas.
6. Señala convergencias Y divergencias entre expertos.
7. Usa números exactos de las páginas web.

# OUTPUT FORMAT
Debes devolver UNICAMENTE un array de objetos JSON. No uses Markdown code blocks, solo el JSON raw si es posible, o envuélvelo en un bloque de código si es necesario pero el contenido debe ser parseable.

Estructura requerida para cada partido:
{
  "deporte": "NFL/NBA/MLB/Soccer",
  "partido": "EQUIPO A vs EQUIPO B",
  "fecha": "DD/MM/YYYY HH:MM",
  "arena": "nombre del lugar",
  "estadisticas_clave": {
    "equipo_a": {
      "record": "W-L",
      "ppg_ofensivo": "X.X",
      "ppg_defensivo": "X.X",
      "ultimas_5": "W-L",
      "en_casa": "record",
      "ats": "record",
      "ranking_ofensiva": "posición",
      "ranking_defensiva": "posición"
    },
    "equipo_b": { ... }
  },
  "analisis_expertos": [
    {
      "nombre_analista": "nombre",
      "fuente": "FOX SPORTS/YOUTUBE",
      "prediccion": "EQUIPO / Spread / Moneyline",
      "razonamiento": "texto con cita o resumen",
      "stats_citadas": ["stat1", "stat2"],
      "confianza": "Alta/Media/Baja"
    }
  ],
  "convergencia_fuentes": {
    "acuerdo_expertos": "descripción",
    "respaldo_estadistico": "descripción",
    "nivel_consenso": "Alto/Medio/Bajo"
  },
  "predicciones_finales": {
    "ganador_estimado": {
      "equipo": "EQUIPO",
      "confianza": "Alta/Media/Baja",
      "razon": "texto"
    },
    "moneyline": {
      "prediccion": "EQUIPO",
      "odds": "-XXX/+XXX",
      "valor": "descripción"
    },
    "spread": {
      "prediccion": "EQUIPO cubre X.5",
      "razon": "texto",
      "tendencia_ats": "descripción"
    },
    "over_under": {
      "prediccion": "OVER/UNDER",
      "numero": "XXX.5",
      "razon": "texto",
      "proyeccion": "puntos totales estimados"
    }
  },
  "factores_riesgo": ["factor1", "factor2"],
  "urls_procesadas": ["url1"]
}
`;

export const analyzeUrls = async (urls: string[], apiKey: string, transcription?: string): Promise<MatchAnalysis[]> => {
  if (!apiKey) throw new Error("API Key is required");
  if (urls.length === 0 && !transcription) throw new Error("No URLs provided");

  const ai = new GoogleGenAI({ apiKey });

  // Filter out empty lines
  const cleanUrls = urls.filter(u => u.trim().length > 0).join('\n');
  
  let prompt = `
    Analiza la siguiente información de deportes.
    
    1. URLs a investigar (Usa Google Search para obtener datos actualizados):
    ${cleanUrls}
  `;

  if (transcription && transcription.trim().length > 0) {
    prompt += `
    
    2. TRANSCRIPCIÓN DE VIDEO (YouTube):
    Usa el siguiente texto como fuente directa para las opiniones de expertos de YouTube. Extrae nombres de analistas y argumentos de aquí:
    
    """
    ${transcription}
    """
    `;
  }

  prompt += `
    Genera el JSON con el análisis detallado de cada partido identificado en las fuentes anteriores.
    Si no encuentras información en las URLs, indícalo en el campo de "factores_riesgo" o "razonamiento".
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Strong reasoning model
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }], // Enable grounding to read the URLs
        // Note: responseMimeType: 'application/json' is NOT compatible with tools in some versions,
        // so we rely on the prompt to enforce JSON structure and parse it manually.
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    // Extract JSON from Markdown code blocks if present
    let jsonStr = text;
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    try {
      const parsed: MatchAnalysis[] = JSON.parse(jsonStr);
      if (!Array.isArray(parsed)) {
          // If single object, wrap in array
          return [parsed as unknown as MatchAnalysis];
      }
      return parsed;
    } catch (e) {
      console.error("Failed to parse JSON", jsonStr);
      throw new Error("El modelo generó una respuesta que no es JSON válido. Intenta nuevamente.");
    }

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Error processing request with Gemini");
  }
};