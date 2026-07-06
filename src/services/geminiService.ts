import { GoogleGenAI } from '@google/genai';
import { Transaction, AISuggestion } from '../types';

const getApiKey = (): string => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.GEMINI_API_KEY || '';
  }
  const metaEnv = (import.meta as any).env;
  if (metaEnv) {
    return metaEnv.VITE_GEMINI_API_KEY || metaEnv.GEMINI_API_KEY || '';
  }
  return '';
};

const apiKey = getApiKey();
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function getFinancialSuggestions(transactions: Transaction[], forceRefresh: boolean = false): Promise<AISuggestion[]> {
  const currentApiKey = getApiKey();
  if (!currentApiKey || !ai) {
    return [
      {
        title: "Configuración requerida",
        content: "Añade tu GEMINI_API_KEY para recibir consejos personalizados de ahorro.",
        type: 'warning'
      }
    ];
  }

  // Calculate local summary first to build the cache key
  const summary = transactions.reduce((acc, t) => {
    const cat = t.categoryId;
    if (t.type === 'expense') {
      acc.expenses[cat] = (acc.expenses[cat] || 0) + t.amount;
      acc.totalExpenses += t.amount;
    } else {
      acc.totalIncome += t.amount;
    }
    return acc;
  }, { expenses: {} as Record<string, number>, totalExpenses: 0, totalIncome: 0 });

  const summaryKey = `${transactions.length}_${summary.totalIncome}_${summary.totalExpenses}`;
  const CACHE_KEY = 'hera_cached_suggestions';
  const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        if (parsedCache && Array.isArray(parsedCache.data)) {
          const isSameData = parsedCache.summaryKey === summaryKey;
          const isFresh = Date.now() - parsedCache.timestamp < CACHE_DURATION;
          
          if (isSameData || isFresh) {
            return parsedCache.data;
          }
        }
      }
    } catch (e) {
      console.warn('Error reading from cache', e);
    }
  }

  try {
    const prompt = `Analiza estas finanzas personales y da 3 consejos cortos y accionables en formato JSON:
    Ingresos totales: ${summary.totalIncome}
    Gastos totales: ${summary.totalExpenses}
    Gastos por categoría: ${JSON.stringify(summary.expenses)}
    
    Responde solo con un array de objetos JSON con las propiedades: title, content, type (saving, warning, insight).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    const text = response.text || '[]';
    
    // Clean potential markdown code blocks
    const cleanedText = text.replace(/```json|```/g, '').trim();
    const parsed: AISuggestion[] = JSON.parse(cleanedText);
    
    // Save to cache
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        timestamp: Date.now(),
        data: parsed,
        summaryKey
      }));
    } catch (e) {
      console.warn('Error saving to cache', e);
    }

    return parsed;
  } catch (error: any) {
    console.error('Error fetching AI suggestions:', error);
    
    // Try to recover from cache upon failure, regardless of age
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        if (parsedCache && Array.isArray(parsedCache.data)) {
          const errorMsg = error?.message || '';
          const isQuota = errorMsg.includes('quota') || errorMsg.includes('429') || error?.status === 'RESOURCE_EXHAUSTED' || JSON.stringify(error).includes('429');
          const warningTitle = isQuota ? "Límite de Consultas Inteligentes" : "Sugerencias Guardadas";
          const warningContent = isQuota 
            ? "Has alcanzado el límite de consultas gratuitas a la IA. Mostrando el último análisis guardado para no interrumpir tu experiencia."
            : "No pudimos conectar con la IA. Mostrando el último análisis disponible.";
          
          return [
            {
              title: warningTitle,
              content: warningContent,
              type: 'warning'
            },
            ...parsedCache.data
          ];
        }
      }
    } catch (e) {
      console.error('Error retrieving from cache during recovery:', e);
    }

    const errorMsg = error?.message || '';
    const isQuota = errorMsg.includes('quota') || errorMsg.includes('429') || error?.status === 'RESOURCE_EXHAUSTED' || JSON.stringify(error).includes('429');
    if (isQuota) {
      return [
        {
          title: "Cuota de IA Excedida",
          content: "Se ha superado la cuota de consultas gratuitas de la API de Gemini. No te preocupes, puedes seguir gestionando tus finanzas normalmente y volver a intentarlo en unos minutos o configurar tu propia clave.",
          type: 'warning'
        }
      ];
    }

    return [
      {
        title: "Análisis en pausa",
        content: "No pudimos conectar con la IA en este momento. Revisa tus gastos recientes para mantener el control.",
        type: 'insight'
      }
    ];
  }
}
