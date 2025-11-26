import { MatchAnalysis } from "../types";

const SYSTEM_PROMPT = `
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

export async function analyzeUrls(
  urls: string[],
  apiKey: string,
  transcription: string = ''
): Promise<MatchAnalysis[]> {
  if (!apiKey) throw new Error("API Key requerida");
  if (urls.length === 0 && !transcription) throw new Error("Agrega URLs o transcripción");

  let userMessage = `Analiza estas URLs de Fox Sports y genera predicciones deportivas profesionales en JSON:\n\n`;
  userMessage += urls.map((url, i) => `${i + 1}. ${url}`).join('\n');
  
  if (transcription.trim()) {
    userMessage += `\n\nTRANSCRIPCION DE YOUTUBE (procesa como fuente adicional):\n${transcription}`;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: [{ text: SYSTEM_PROMPT }],
          contents: [{
            role: 'user',
            parts: [{ text: userMessage }],
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8000,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `Error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) throw new Error('Sin respuesta de Gemini');

    let jsonStr = content
      .replace(/```json\n?/g, '')
      .replace(/\n?```/g, '')
      .trim();

    const parsed = JSON.parse(jsonStr);

    if (!parsed.partidos) {
      return [parsed as unknown as MatchAnalysis];
    }

    return parsed.partidos as MatchAnalysis[];
  } catch (error) {
    console.error(error);
    throw error;
  }
}
