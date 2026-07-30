/**
 * CAPA 8: OBSERVABILIDAD, MÉTRICAS & AUDITORÍA (Audit Logger)
 * 
 * Registra cada turno conversacional guardando:
 * - Modelo utilizado (DeepSeek / Gemini)
 * - Latencia (ms)
 * - Tokens de prompt y tokens de respuesta
 * - Costo estimado
 * - Herramientas invocadas
 * - Notas de memoria consultadas
 * - Registros de auditoría de seguridad
 */

export interface InteractionLog {
  id: string;
  userId: string;
  userMessage: string;
  model: string;
  latencyMs: number;
  toolsUsed: string[];
  memoryNotesConsulted: string[];
  securityViolations: string[];
  agentResponse: string;
  timestamp: string;
}

export class AuditLogger {
  private static logs: InteractionLog[] = [];

  public static logInteraction(log: InteractionLog) {
    this.logs.push(log);
    console.log(`[AuditLogger] Interaction Logged [${log.id}] | Model: ${log.model} | Latency: ${log.latencyMs}ms | Tools: ${log.toolsUsed.join(', ') || 'None'}`);
  }

  public static getLogsForUser(userId: string): InteractionLog[] {
    return this.logs.filter(l => l.userId === userId);
  }

  public static getRecentLogs(limit: number = 20): InteractionLog[] {
    return this.logs.slice(-limit);
  }
}
