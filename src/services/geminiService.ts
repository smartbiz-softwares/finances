import { GoogleGenAI } from '@google/genai';
import { Transaction, AISuggestion } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function getFinancialSuggestions(transactions: Transaction[]): Promise<AISuggestion[]> {
  if (!process.env.GEMINI_API_KEY) {
    return [
      {
        title: "Configuración requerida",
        content: "Añade tu GEMINI_API_KEY para recibir consejos personalizados de ahorro.",
        type: 'warning'
      }
    ];
  }

  try {
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

    const prompt = `Analiza estas finanzas personales y da 3 consejos cortos y accionables en formato JSON:
    Ingresos totales: ${summary.totalIncome}
    Gastos totales: ${summary.totalExpenses}
    Gastos por categoría: ${JSON.stringify(summary.expenses)}
    
    Responde solo con un array de objetos JSON con las propiedades: title, content, type (saving, warning, insight).`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    const text = response.text || '[]';
    
    // Clean potential markdown code blocks
    const cleanedText = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('Error fetching AI suggestions:', error);
    return [
      {
        title: "Análisis en pausa",
        content: "No pudimos conectar con la IA en este momento. Revisa tus gastos recientes para mantener el control.",
        type: 'insight'
      }
    ];
  }
}
