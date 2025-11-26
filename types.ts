export interface TeamStats {
  record: string;
  ppg_ofensivo: string;
  ppg_defensivo: string;
  ultimas_5: string;
  en_casa: string;
  ats: string;
  ranking_ofensiva: string;
  ranking_defensiva: string;
}

export interface MatchStats {
  equipo_a: TeamStats;
  equipo_b: TeamStats;
}

export interface ExpertAnalysis {
  nombre_analista: string;
  fuente: string;
  prediccion: string;
  razonamiento: string;
  stats_citadas: string[];
  confianza: string;
}

export interface Convergence {
  acuerdo_expertos: string;
  respaldo_estadistico: string;
  nivel_consenso: string;
}

export interface FinalPredictions {
  ganador_estimado: {
    equipo: string;
    confianza: string;
    razon: string;
  };
  moneyline: {
    prediccion: string;
    odds: string;
    valor: string;
  };
  spread: {
    prediccion: string;
    razon: string;
    tendencia_ats: string;
  };
  over_under: {
    prediccion: string;
    numero: string;
    razon: string;
    proyeccion: string;
  };
}

export interface MatchAnalysis {
  deporte: string;
  partido: string;
  fecha: string;
  arena: string;
  estadisticas_clave: MatchStats;
  analisis_expertos: ExpertAnalysis[];
  convergencia_fuentes: Convergence;
  predicciones_finales: FinalPredictions;
  factores_riesgo: string[];
  urls_procesadas: string[];
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  results: MatchAnalysis[];
}