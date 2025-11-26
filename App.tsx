import React, { useState, useEffect } from 'react';
import { 
  Activity, AlertTriangle, BarChart2, CheckCircle, ChevronRight, Clock, 
  Database, Download, ExternalLink, FileText, History, Key, Layout, Plus,
  RefreshCw, TrendingUp, Trash2, Upload, X
} from 'lucide-react';
import { MatchAnalysis, HistoryItem } from './types';
import { analyzeUrls } from './services/geminiService';

interface BadgeProps {
  children: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'orange' | 'gray';
}

const Badge: React.FC<BadgeProps> = ({ children, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-900/50 text-blue-200 border-blue-700',
    green: 'bg-green-900/50 text-green-200 border-green-700',
    red: 'bg-red-900/50 text-red-200 border-red-700',
    orange: 'bg-orange-900/50 text-orange-200 border-orange-700',
    gray: 'bg-slate-700 text-slate-300 border-slate-600'
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${colors[color]}`}>
      {children}
    </span>
  );
};

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-sports-card border border-slate-700 rounded-lg shadow-sm ${onClick ? 'cursor-pointer hover:border-sports-blue transition-colors' : ''} ${className}`}
  >
    {children}
  </div>
);

function App() {
  const envApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [inputUrls, setInputUrls] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<MatchAnalysis[] | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<MatchAnalysis | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [tempTranscription, setTempTranscription] = useState('');
  const [showTransModal, setShowTransModal] = useState(false);

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
    } else if (envApiKey) {
      setApiKey(envApiKey);
      localStorage.setItem('gemini_api_key', envApiKey);
    } else {
      setShowApiKeyModal(true);
    }

    const storedHistory = localStorage.getItem('analysis_history');
    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory));
      } catch (e) {
        console.error("Failed to load history");
      }
    }
  }, [envApiKey]);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    setShowApiKeyModal(false);
  };

  const handleAnalyze = async () => {
    if (!apiKey) {
      setShowApiKeyModal(true);
      return;
    }

    const urls = inputUrls.split('\n').filter(u => u.trim().length > 0);
    if (urls.length === 0 && !transcription.trim()) {
      setError("Por favor ingresa al menos una URL válida o agrega una transcripción.");
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const data = await analyzeUrls(urls, apiKey, transcription);
      setResults(data);
      
      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        results: data
      };
      const updatedHistory = [newHistoryItem, ...history].slice(0, 10);
      setHistory(updatedHistory);
      localStorage.setItem('analysis_history', JSON.stringify(updatedHistory));
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al analizar.");
    } finally {
      setLoading(false);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setResults(item.results);
    setShowHistory(false);
    setSelectedMatch(null);
  };

  const clearAll = () => {
    setInputUrls('');
    setTranscription('');
    setTempTranscription('');
    setResults(null);
    setError(null);
    setSelectedMatch(null);
  };

  const exportJSON = () => {
    if (!results) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(results, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "analisis_deportivo.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setTempTranscription(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const openTransModal = () => {
    setTempTranscription(transcription);
    setShowTransModal(true);
  };

  const saveTransModal = () => {
    setTranscription(tempTranscription);
    setShowTransModal(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-sports-blue selection:text-white">
      <header className="bg-sports-card border-b border-slate-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-sports-accent" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              SportsBet <span className="text-sports-blue">Pro</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 text-slate-400 hover:text-white transition-colors relative"
              title="Historial"
            >
              <History className="h-5 w-5" />
              {history.length > 0 && <span className="absolute top-1 right-1 h-2 w-2 bg-sports-blue rounded-full"></span>}
            </button>
            <button 
              onClick={() => setShowApiKeyModal(true)}
              className="p-2 text-slate-400 hover:text-white transition-colors"
              title="Configurar API Key"
            >
              <Key className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8 max-w-6xl">
        {showHistory && (
          <div className="absolute top-16 right-0 w-full md:w-80 bg-sports-card border border-slate-700 shadow-xl z-40 rounded-b-lg">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <h3 className="font-semibold text-white">Historial Reciente</h3>
              <button onClick={() => setShowHistory(false)}><X className="h-4 w-4" /></button>
            </div>
            <ul className="max-h-96 overflow-y-auto">
              {history.length === 0 ? (
                <li className="p-4 text-center text-slate-500 text-sm">Sin historial reciente</li>
              ) : (
                history.map(item => (
                  <li key={item.id} className="border-b border-slate-700 last:border-0">
                    <button 
                      onClick={() => loadFromHistory(item)}
                      className="w-full text-left p-3 hover:bg-slate-700 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <div className="text-sm font-medium text-slate-200">
                          {item.results.length} Partido{item.results.length !== 1 ? 's' : ''}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {new Date(item.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-sports-blue" />
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}

        {showApiKeyModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-sports-card border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-900/30 rounded-full">
                  <Key className="h-6 w-6 text-sports-blue" />
                </div>
                <h2 className="text-xl font-bold text-white">Configuración API</h2>
              </div>
              <p className="text-slate-400 text-sm mb-4">
                Ingresa tu Google Gemini API Key para utilizar el servicio de análisis.
              </p>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Pegar API Key aquí..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-sports-blue focus:border-transparent outline-none mb-4"
              />
              <div className="flex justify-end gap-2">
                {apiKey && (
                  <button 
                    onClick={() => setShowApiKeyModal(false)}
                    className="px-4 py-2 text-slate-300 hover:text-white"
                  >
                    Cancelar
                  </button>
                )}
                <button 
                  onClick={() => saveApiKey(apiKey)}
                  disabled={!apiKey}
                  className="bg-sports-blue hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}

        {showTransModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-sports-card border border-slate-700 rounded-xl p-6 w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-sports-accent" />
                  <h2 className="text-xl font-bold text-white">Agregar Transcripción</h2>
                </div>
                <button onClick={() => setShowTransModal(false)} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="flex-grow overflow-hidden flex flex-col gap-4">
                <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 border border-slate-600 border-dashed rounded-lg p-3 text-center transition-colors">
                  <input type="file" accept=".txt" onChange={handleFileUpload} className="hidden" />
                  <div className="flex items-center justify-center gap-2 text-sm text-slate-300">
                    <Upload className="h-4 w-4" />
                    Subir archivo .txt
                  </div>
                </label>

                <textarea
                  value={tempTranscription}
                  onChange={(e) => setTempTranscription(e.target.value)}
                  placeholder="Pega la transcripción aquí..."
                  className="flex-grow w-full bg-slate-900 border border-slate-700 rounded-lg p-4 text-slate-200 focus:ring-2 focus:ring-sports-accent focus:border-transparent outline-none resize-none font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button 
                  onClick={() => setShowTransModal(false)}
                  className="px-4 py-2 text-slate-300 hover:text-white"
                >
                  Cancelar
                </button>
                <button 
                  onClick={saveTransModal}
                  className="bg-sports-accent hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

        {!results && !loading && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-3">Analizador Deportivo IA</h2>
              <p className="text-slate-400">Pega enlaces de Fox Sports para generar predicciones profesionales.</p>
            </div>

            <Card className="p-6">
              <div className="flex justify-between items-end mb-2">
                <label className="block text-sm font-medium text-slate-300">URLs (una por línea)</label>
                {transcription ? (
                   <button 
                    onClick={openTransModal}
                    className="flex items-center gap-1 px-2 py-1 bg-green-900/40 text-green-300 text-xs rounded border border-green-700/50"
                   >
                     <CheckCircle className="h-3 w-3" />
                     Transcripción ✓
                   </button>
                ) : (
                  <button 
                    onClick={openTransModal}
                    className="flex items-center gap-1 px-2 py-1 text-sports-accent text-xs font-medium"
                  >
                    <Plus className="h-3 w-3" /> Agregar
                  </button>
                )}
              </div>
              
              <textarea
                value={inputUrls}
                onChange={(e) => setInputUrls(e.target.value)}
                placeholder="https://www.foxsports.com/..."
                className="w-full h-40 bg-slate-900 border border-slate-700 rounded-lg p-4 text-slate-200 focus:ring-2 focus:ring-sports-blue focus:border-transparent outline-none resize-none font-mono text-sm"
              />
              
              {error && (
                <div className="mt-4 p-3 bg-red-900/20 border border-red-800 rounded text-red-200 text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={!inputUrls.trim() && !transcription.trim()}
                className="mt-6 w-full bg-sports-blue hover:bg-blue-600 text-white py-3 rounded-lg font-bold text-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Database className="h-5 w-5" />
                Analizar
              </button>
            </Card>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-16 w-16 border-4 border-slate-700 border-t-sports-accent rounded-full animate-spin"></div>
            <h3 className="mt-6 text-xl font-semibold text-white">Procesando...</h3>
            <p className="text-slate-400 mt-2">Gemini está analizando las URLs.</p>
          </div>
        )}

        {results && !loading && (
          <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  Resultados <span className="bg-sports-blue text-xs px-2 py-1 rounded-full">{results.length}</span>
                </h2>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={clearAll}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Nuevo
                </button>
                <button 
                  onClick={exportJSON}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sports-blue rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  JSON
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((match, idx) => (
                <Card 
                  key={idx} 
                  onClick={() => setSelectedMatch(match)}
                  className="cursor-pointer hover:border-sports-blue"
                >
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <Badge>{match.deporte}</Badge>
                      <span className="text-xs text-slate-400">{match.fecha.split(' ')[0]}</span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-white mb-1">
                      {match.partido}
                    </h3>
                    <div className="text-sm text-slate-400 mb-4">
                      {match.arena}
                    </div>

                    <div className="bg-slate-800/50 rounded p-3 mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-slate-400">Ganador</span>
                        <Badge color={match.predicciones_finales.ganador_estimado.confianza === 'Alta' ? 'green' : 'orange'}>
                          {match.predicciones_finales.ganador_estimado.confianza}
                        </Badge>
                      </div>
                      <div className="font-bold text-white">
                        {match.predicciones_finales.ganador_estimado.equipo}
                      </div>
                    </div>

                    <div className="flex justify-between text-xs text-slate-400 border-t border-slate-700 pt-3">
                      <div>
                        <span className="block mb-1">Spread</span>
                        <span className="text-white">{match.predicciones_finales.spread.prediccion.split(' ')[1] || 'N/A'}</span>
                      </div>
                      <div className="text-right">
                        <span className="block mb-1">O/U</span>
                        <span className="text-white">{match.predicciones_finales.over_under.numero}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {selectedMatch && (
          <div className="fixed inset-0 bg-black/80 z-50 overflow-y-auto">
            <div className="min-h-screen px-4 py-8 flex items-center justify-center">
              <div className="bg-sports-card border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl relative">
                
                <button 
                  onClick={() => setSelectedMatch(null)}
                  className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-white"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-t-xl border-b border-slate-700">
                   <div className="flex items-center gap-2 text-sports-accent text-sm font-bold uppercase mb-2">
                     {selectedMatch.deporte} • {selectedMatch.fecha}
                   </div>
                   <h2 className="text-3xl font-bold text-white mb-2">{selectedMatch.partido}</h2>
                   <p className="text-slate-400">{selectedMatch.arena}</p>
                </div>

                <div className="p-6 md:p-8 space-y-8">
                  
                  <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-900/20 border border-blue-800 p-4 rounded-lg">
                      <div className="text-sm text-blue-300 mb-1 font-semibold">Ganador</div>
                      <div className="text-xl font-bold text-white">{selectedMatch.predicciones_finales.ganador_estimado.equipo}</div>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                      <div className="text-sm text-slate-400 mb-1 font-semibold">Spread</div>
                      <div className="text-xl font-bold text-white">{selectedMatch.predicciones_finales.spread.prediccion}</div>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                      <div className="text-sm text-slate-400 mb-1 font-semibold">O/U</div>
                      <div className="text-xl font-bold text-white">{selectedMatch.predicciones_finales.over_under.prediccion} {selectedMatch.predicciones_finales.over_under.numero}</div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <BarChart2 className="h-5 w-5 text-sports-accent" /> Estadísticas
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left text-slate-300">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-900/50">
                          <tr>
                            <th className="px-4 py-3">Estadística</th>
                            <th className="px-4 py-3 text-center">Equipo A</th>
                            <th className="px-4 py-3 text-center">Equipo B</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          <tr>
                            <td className="px-4 py-3 font-medium">Record</td>
                            <td className="px-4 py-3 text-center">{selectedMatch.estadisticas_clave.equipo_a.record}</td>
                            <td className="px-4 py-3 text-center">{selectedMatch.estadisticas_clave.equipo_b.record}</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 font-medium">PPG Off</td>
                            <td className="px-4 py-3 text-center">{selectedMatch.estadisticas_clave.equipo_a.ppg_ofensivo}</td>
                            <td className="px-4 py-3 text-center">{selectedMatch.estadisticas_clave.equipo_b.ppg_ofensivo}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-white mb-4">Análisis Expertos</h3>
                    <div className="space-y-4">
                      {selectedMatch.analisis_expertos.map((expert, i) => (
                        <div key={i} className="bg-slate-800/50 p-4 rounded-lg border-l-4 border-sports-blue">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-white">{expert.nombre_analista}</span>
                            <span className="text-xs uppercase text-slate-500">{expert.fuente}</span>
                          </div>
                          <p className="text-slate-300 italic mb-2">"{expert.razonamiento}"</p>
                        </div>
                      ))}
                    </div>
                  </section>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <section>
                      <h3 className="text-lg font-bold text-white mb-3">Convergencia</h3>
                      <div className="bg-slate-900/50 p-4 rounded-lg text-sm">
                        <p className="text-slate-300">{selectedMatch.convergencia_fuentes.acuerdo_expertos}</p>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-lg font-bold text-white mb-3">Factores de Riesgo</h3>
                      <ul className="bg-red-900/10 border border-red-900/30 p-4 rounded-lg space-y-2">
                        {selectedMatch.factores_riesgo.map((factor, i) => (
                          <li key={i} className="text-sm text-red-200">• {factor}</li>
                        ))}
                      </ul>
                    </section>
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      <footer className="border-t border-slate-800 bg-sports-dark py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
          <p>© {new Date().getFullYear()} SportsBet Pro. Powered by Gemini.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
