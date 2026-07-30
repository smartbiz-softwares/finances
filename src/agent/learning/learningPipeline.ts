import { MemoryManager } from '../memory/memoryManager';
import Database from 'better-sqlite3';

/**
 * CAPA 7: PIPELINE DE APRENDIZAJE, GOAL ENGINE & BEHAVIOR PREDICTOR
 * 
 * 1. Insight Extractor: Extrae solo descubrimientos clave de la conversación (filtra el ruido).
 * 2. Goal Engine: Evalúa si las decisiones del usuario favorecen u obstaculizan sus metas.
 * 3. Behavior Predictor: Anticipa ciclos de comportamiento (ej. cobro -> gasto fin de semana).
 * 4. Vault Sync & Merge: Actualiza las notas en el Obsidian Vault.
 */

export class LearningPipeline {
  private memoryManager: MemoryManager;

  constructor(memoryManager: MemoryManager) {
    this.memoryManager = memoryManager;
  }

  /**
   * Ejecuta el pipeline de aprendizaje asíncrono al finalizar cada turno
   */
  public async processConversationInsight(userId: string, userMessage: string, agentReply: string, db: Database.Database) {
    // 1. Extractor de Insights (Filtro de Ruido)
    const insight = this.extractFinancialInsight(userMessage);

    if (insight) {
      console.log(`[LearningPipeline] Insight relevante detectado: "${insight}"`);

      // 2. Fusionar con Obsidian Vault (Long-Term Memory)
      const currentProfile = this.memoryManager.readObsidianNote('PERFIL_USUARIO.md');
      const updatedProfile = currentProfile + `\n- [Aprendido ${new Date().toISOString().split('T')[0]}]: ${insight}`;
      this.memoryManager.writeObsidianNote('PERFIL_USUARIO.md', updatedProfile);
    }

    // 3. Goal Engine Check: Evaluar progreso en metas activas
    this.evaluateGoalsProgress(userId, db);

    // 4. Behavior Predictor: Detectar patrones de gasto cíclico
    this.predictBehavioralPatterns(userId, db);
  }

  /**
   * Determina si el mensaje contiene un dato relevante sobre la vida financiera del usuario
   */
  private extractFinancialInsight(message: string): string | null {
    const lower = message.toLowerCase();

    if (lower.includes('cobro el') || lower.includes('mi sueldo es') || lower.includes('gano')) {
      return `Patrón de ingreso detectado en: "${message}"`;
    }

    if (lower.includes('quiero ahorrar') || lower.includes('mi meta es') || lower.includes('planeo comprar')) {
      return `Objetivo financiero expresado: "${message}"`;
    }

    if (lower.includes('tengo una deuda') || lower.includes('debo') || lower.includes('tarjeta de credito')) {
      return `Información de endeudamiento: "${message}"`;
    }

    if (lower.includes('prefiero') || lower.includes('no me gusta') || lower.includes('mi riesgo es')) {
      return `Preferencia personal expresada: "${message}"`;
    }

    return null; // Si no hay dato relevante, se descarta (Filtro de Ruido)
  }

  /**
   * Goal Engine: Evalúa el impacto de la actividad reciente sobre las metas
   */
  private evaluateGoalsProgress(userId: string, db: Database.Database) {
    const goals = db.prepare('SELECT * FROM goals WHERE userId = ?').all(userId) as any[];
    if (!goals || goals.length === 0) return;

    for (const goal of goals) {
      const percentage = Math.round((goal.currentAmount / goal.targetAmount) * 100);
      if (percentage >= 100) {
        console.log(`[GoalEngine] Meta completada al 100%: ${goal.name}`);
      }
    }
  }

  /**
   * Behavior Predictor: Identifica patrones de gasto recurrentes (ej. fin de semana)
   */
  public predictBehavioralPatterns(userId: string, db: Database.Database): string | null {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Domingo, 5 = Viernes, 6 = Sábado

    // Si es viernes o sábado, verificar historial de transacciones en fines de semana pasados
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      const weekendTxs = db.prepare(`
        SELECT SUM(amount) as total FROM transactions 
        WHERE userId = ? AND type = 'expense' 
        AND category IN ('Restaurantes', 'Ocio', 'Entretenimiento', 'Compras')
      `).get(userId) as any;

      if (weekendTxs && weekendTxs.total > 150) {
        return `[BehaviorPredictor Alerta]: Es fin de semana y tu historial indica una alta concentración de gastos en ocio/restaurantes (${weekendTxs.total}€ acumulados). ¿Deseas fijar un límite preventivo?`;
      }
    }

    return null;
  }
}
